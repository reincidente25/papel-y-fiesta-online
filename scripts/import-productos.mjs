// scripts/import-productos.mjs
//
// Importa productos desde un Excel a Firestore, con categorías tomadas de las
// pestañas del archivo.
//
// Estructura esperada del Excel:
//   - Pestaña "Todos"         -> lista completa de productos (datos).
//   - Pestañas por categoría  -> cada una lista los productos de esa categoría
//                                (la categoría = el nombre de la pestaña).
//   - Pestaña "Sin categoría" -> productos sin categoría.
//
// Resultado en Firestore:
//   - productos/{Codigo}   (ID del doc = Código, ej. "VAR-046")
//       { codigo, nombre, marca, descripcion, proveedor, precioCosto,
//         precioVenta, stock, stockMinimo, estado, categoria, categoriaNombre, ... }
//   - categorias/{slug}    (ID del doc = slug, ej. "arte-y-modelado")
//       { nombre, slug, orden, activa, cantidad }
//
// Uso:
//   1) cd scripts && npm install
//   2) Poné el Excel en scripts/ (o pasá la ruta como argumento)
//   3) Descargá la service account key -> scripts/serviceAccountKey.json (ver README)
//   4) node import-productos.mjs [archivo.xlsx]
//
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COL_PROD = 'productos';
const COL_CAT = 'categorias';

// Pestañas que NO son categorías
const SHEET_TODOS = 'todos';
const SHEET_SIN_CAT = 'sin categoria';

// ---- Service account ----
const keyPath = join(__dirname, 'serviceAccountKey.json');
if (!existsSync(keyPath)) { console.error('✗ Falta scripts/serviceAccountKey.json (ver README.md).'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = admin.firestore();

// ---- Flags ----
//   --mark    : marca los productos que YA NO vienen en el Excel (pausado + fuera de la web)
//   --delete  : ELIMINA los productos que ya no vienen en el Excel
//   (sin flag) : solo los reporta, no toca nada
const args = process.argv.slice(2);
const PRUNE_MARK = args.includes('--mark');
const PRUNE_DELETE = args.includes('--delete');
const DRY_RUN = args.includes('--dry-run') || args.includes('--dry');
if (DRY_RUN) console.log('🧪 DRY-RUN: simulación, NO se escribe nada en Firestore.\n');

// ---- Localizar el Excel ----
let file = args.find((a) => !a.startsWith('--'));
if (!file) {
  const xls = readdirSync(__dirname).filter((f) => /\.(xlsx|xls)$/i.test(f));
  if (xls.length === 0) { console.error('✗ No encontré ningún .xlsx en scripts/.'); process.exit(1); }
  file = join(__dirname, xls[0]);
}
console.log('📄 Leyendo:', file);

// ---- Helpers ----
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function parseNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').replace(/[^\d,.-]/g, '');
  if (s === '') return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
const parseInt0 = (v) => Math.trunc(parseNum(v));

function mapEstado(v) {
  const e = norm(v);
  if (e.startsWith('activ')) return 'activo';
  return 'pausado';
}
const safeId = (codigo) => String(codigo).trim().replace(/\//g, '-');

function cell(row, ...names) {
  const map = {};
  for (const k of Object.keys(row)) map[norm(k)] = row[k];
  for (const n of names) if (map[n] !== undefined && map[n] !== '') return map[n];
  return '';
}

// ---- Leer workbook ----
const wb = XLSX.readFile(file);
const sheetByNorm = {};
for (const name of wb.SheetNames) sheetByNorm[norm(name)] = name;

// Pestaña maestra con los datos
const masterName = sheetByNorm[SHEET_TODOS] || wb.SheetNames[0];
const masterRows = XLSX.utils.sheet_to_json(wb.Sheets[masterName], { defval: '' });
console.log(`   Maestra "${masterName}": ${masterRows.length} filas`);

// ---- Mapa código -> categoría, desde las pestañas de categoría ----
const catOf = {};          // codigo -> { slug, nombre }
const catMap = new Map();  // slug -> { slug, nombre, orden }  (dedupe por slug)
let conflicts = 0, orden = 0;

for (const name of wb.SheetNames) {
  const n = norm(name);
  if (n === SHEET_TODOS || n === SHEET_SIN_CAT) continue;
  const slug = slugify(name);
  if (!slug) continue;
  if (!catMap.has(slug)) catMap.set(slug, { slug, nombre: name.trim(), orden: orden++ });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
  for (const row of rows) {
    const codigo = String(cell(row, 'codigo')).trim();
    if (!codigo) continue;
    if (catOf[codigo]) { conflicts++; continue; } // primera categoría gana
    catOf[codigo] = { slug, nombre: catMap.get(slug).nombre };
  }
}
const categorias = [...catMap.values()];
// Cantidad real de productos por categoría (a partir del mapa final)
const catCount = {};
for (const { slug } of Object.values(catOf)) catCount[slug] = (catCount[slug] || 0) + 1;
console.log(`   Categorías detectadas: ${categorias.length}   ·   Productos mapeados: ${Object.keys(catOf).length}   ·   Códigos en >1 categoría: ${conflicts}`);

// ---- Escribir categorías ----
{
  let batch = db.batch(), i = 0;
  for (const c of categorias) {
    batch.set(db.collection(COL_CAT).doc(c.slug), {
      nombre: c.nombre, slug: c.slug, orden: c.orden, activa: true, cantidad: catCount[c.slug] || 0,
      actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    if (++i === 450) { if (!DRY_RUN) await batch.commit(); batch = db.batch(); i = 0; }
  }
  if (i > 0 && !DRY_RUN) await batch.commit();
  console.log(`   ${DRY_RUN ? '(simulado)' : '✔'} Colección "${COL_CAT}": ${categorias.length}`);
}

// ---- Productos existentes en Firestore (para decidir crear vs. actualizar) ----
const existingSnap = await db.collection(COL_PROD).get();
const existing = new Map(); // id -> data
existingSnap.forEach((d) => existing.set(d.id, d.data()));
console.log(`   Productos ya en Firestore: ${existing.size}`);

// ---- Escribir productos: nuevo = completo · existente = solo stock ----
let batch = db.batch();
let creados = 0, actualizados = 0, skip = 0, inBatch = 0;
const excelIds = new Set();
const commit = async () => { if (inBatch >= 450) { if (!DRY_RUN) await batch.commit(); batch = db.batch(); inBatch = 0; process.stdout.write('.'); } };

for (const row of masterRows) {
  const codigo = String(cell(row, 'codigo')).trim();
  if (!codigo) { skip++; continue; }
  const id = safeId(codigo);
  excelIds.add(id);
  const stock = parseInt0(cell(row, 'stock'));

  if (existing.has(id)) {
    // Ya existe → actualizar SOLO la cantidad.
    batch.set(db.collection(COL_PROD).doc(id), {
      stock,
      enLocal: true,
      actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    actualizados++;
  } else {
    // Nuevo → documento completo.
    const cat = catOf[codigo] || { slug: '', nombre: '' };
    batch.set(db.collection(COL_PROD).doc(id), {
      codigo,
      nombre:       String(cell(row, 'nombre')).trim(),
      marca:        String(cell(row, 'marca')).trim(),
      descripcion:  String(cell(row, 'descripcion')).trim(),
      proveedor:    String(cell(row, 'proveedor')).trim(),
      precioCosto:  parseNum(cell(row, 'precio compra', 'preciocompra')),
      precioVenta:  parseNum(cell(row, 'precio venta', 'precioventa')),
      stock,
      stockMinimo:  parseInt0(cell(row, 'stock minimo', 'stockminimo')),
      estado:       mapEstado(cell(row, 'estado')),
      categoria:    cat.slug,
      categoriaNombre: cat.nombre,
      destacado:    false,
      mostrarWeb:   false,
      imagen:       '',
      enLocal:      true,
      creadoEn:     admin.firestore.FieldValue.serverTimestamp(),
      actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    creados++;
  }
  inBatch++; await commit();
}
if (inBatch > 0 && !DRY_RUN) await batch.commit();

console.log(`\n${DRY_RUN ? '🧪 (simulado) ' : '✅ '}Nuevos: ${creados}   ·   Actualizados (solo stock): ${actualizados}   ·   Omitidos (sin código): ${skip}`);

// ---- Cruce inverso: en Firestore pero NO en el Excel ----
const huerfanos = [...existing.keys()].filter((id) => !excelIds.has(id));
if (huerfanos.length === 0) {
  console.log('   ✔ No hay productos huérfanos (todo lo de la web vino en el Excel).');
} else {
  console.log(`\n⚠️  ${huerfanos.length} producto(s) están en la web pero NO vinieron en el Excel:`);
  for (const id of huerfanos) console.log(`     - ${id}  (${existing.get(id).nombre || ''})`);

  if (DRY_RUN) {
    console.log(`   🧪 (simulado) ${PRUNE_DELETE ? 'se eliminarían' : PRUNE_MARK ? 'se marcarían como pausados' : 'solo reporte'}.`);
  } else if (PRUNE_DELETE) {
    let b = db.batch(), n = 0;
    for (const id of huerfanos) { b.delete(db.collection(COL_PROD).doc(id)); if (++n % 450 === 0) { await b.commit(); b = db.batch(); } }
    if (n % 450 !== 0) await b.commit();
    console.log(`   🗑️  Eliminados ${huerfanos.length} (--delete).`);
  } else if (PRUNE_MARK) {
    let b = db.batch(), n = 0;
    for (const id of huerfanos) {
      b.set(db.collection(COL_PROD).doc(id), { estado: 'pausado', mostrarWeb: false, enLocal: false, actualizadoEn: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      if (++n % 450 === 0) { await b.commit(); b = db.batch(); }
    }
    if (n % 450 !== 0) await b.commit();
    console.log(`   🚫 Marcados como pausados y fuera de la web (--mark).`);
  } else {
    console.log('   (solo reporte · usá --mark para pausarlos o --delete para eliminarlos)');
  }
}
console.log('\n   productos/{Código}  +  categorias/{slug}');
process.exit(0);
