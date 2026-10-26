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

// ---- Localizar el Excel ----
let file = process.argv[2];
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
    if (++i === 450) { await batch.commit(); batch = db.batch(); i = 0; }
  }
  if (i > 0) await batch.commit();
  console.log(`   ✔ Colección "${COL_CAT}" escrita (${categorias.length})`);
}

// ---- Escribir productos ----
let batch = db.batch();
let ok = 0, skip = 0, inBatch = 0;
for (const row of masterRows) {
  const codigo = String(cell(row, 'codigo')).trim();
  if (!codigo) { skip++; continue; }
  const cat = catOf[codigo] || { slug: '', nombre: '' };
  const prod = {
    codigo,
    nombre:       String(cell(row, 'nombre')).trim(),
    marca:        String(cell(row, 'marca')).trim(),
    descripcion:  String(cell(row, 'descripcion')).trim(),
    proveedor:    String(cell(row, 'proveedor')).trim(),
    precioCosto:  parseNum(cell(row, 'precio compra', 'preciocompra')),
    precioVenta:  parseNum(cell(row, 'precio venta', 'precioventa')),
    stock:        parseInt0(cell(row, 'stock')),
    stockMinimo:  parseInt0(cell(row, 'stock minimo', 'stockminimo')),
    estado:       mapEstado(cell(row, 'estado')),
    categoria:    cat.slug,          // slug para filtrar (where categoria == ...)
    categoriaNombre: cat.nombre,     // nombre para mostrar
    destacado:    false,
    imagen:       '',
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
  };
  batch.set(db.collection(COL_PROD).doc(safeId(codigo)), prod, { merge: true });
  ok++; inBatch++;
  if (inBatch === 450) { await batch.commit(); batch = db.batch(); inBatch = 0; process.stdout.write('.'); }
}
if (inBatch > 0) await batch.commit();

const sinCat = ok - Object.keys(catOf).length;
console.log(`\n✅ Productos importados/actualizados: ${ok}   ·   Omitidos (sin código): ${skip}`);
console.log(`   Con categoría: ${Object.keys(catOf).length}   ·   Sin categoría: ${sinCat >= 0 ? sinCat : 0}`);
console.log(`   productos/{Código}  +  categorias/{slug}`);
process.exit(0);
