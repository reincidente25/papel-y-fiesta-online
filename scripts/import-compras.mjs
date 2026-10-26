// scripts/import-compras.mjs
//
// Importa compras (historial) desde un Excel de 2 pestañas a Firestore.
//   - CABECERAS: una fila por compra.  - DETALLE: una fila por ítem.
//   Se unen por "ID Compra" (hash original).
//
//   compras/{ID Compra}
//     { compraId, fecha, proveedor, proveedorId, remito, factura, estado,
//       total, cantItems, notas, items:[{productoId,codigo,nombre,cantidad,costoUnit,subtotal}] }
//
// NO modifica stock ni caja. Uso:
//   cd scripts && npm install
//   node import-compras.mjs [archivo.xlsx]   (toma el que tenga "compra" en el nombre)
//
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COL = 'compras';

const keyPath = join(__dirname, 'serviceAccountKey.json');
if (!existsSync(keyPath)) { console.error('✗ Falta scripts/serviceAccountKey.json (ver README.md).'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = admin.firestore();

let file = process.argv[2];
if (!file) {
  const xls = readdirSync(__dirname).filter((f) => /\.(xlsx|xls)$/i.test(f));
  file = xls.find((f) => /compra/i.test(f)) || xls[0];
  if (!file) { console.error('✗ No encontré el Excel de compras en scripts/.'); process.exit(1); }
  file = join(__dirname, file);
}
console.log('📄 Leyendo:', file);

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function parseNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').replace(/[^\d,.-]/g, '');
  if (s === '') return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s); return Number.isFinite(n) ? n : 0;
}
const parseInt0 = (v) => Math.trunc(parseNum(v));
function parseFecha(v) {
  if (v instanceof Date && !isNaN(v)) return v;
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
  const d = new Date(s); return isNaN(d) ? null : d;
}
function cell(row, ...names) {
  const map = {};
  for (const k of Object.keys(row)) map[norm(k)] = row[k];
  for (const n of names) if (map[n] !== undefined && map[n] !== '') return map[n];
  return '';
}
// Match por substring del encabezado (para "N° Remito", "N° Factura", etc.)
function cellLike(row, sub) {
  for (const k of Object.keys(row)) if (norm(k).includes(sub) && row[k] !== '') return row[k];
  return '';
}
const hasHeader = (row, name) => Object.keys(row).some((k) => norm(k) === name);

const wb = XLSX.readFile(file, { cellDates: true });
const sheets = wb.SheetNames.map((name) => ({ name, rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) }));

let detalle = sheets.find((s) => s.rows[0] && hasHeader(s.rows[0], 'id producto'));
let cabeceras = sheets.find((s) => s.rows[0] && hasHeader(s.rows[0], 'id compra') && !hasHeader(s.rows[0], 'id producto'));
if (!cabeceras) cabeceras = sheets[0];
if (!detalle) detalle = sheets[1] || { rows: [] };
console.log(`   Cabeceras: "${cabeceras.name}" (${cabeceras.rows.length})   ·   Detalle: "${detalle.name || '-'}" (${detalle.rows.length})`);

// Agrupar ítems por ID Compra
const itemsByCompra = {};
for (const row of detalle.rows) {
  const cid = String(cell(row, 'id compra')).trim();
  if (!cid) continue;
  (itemsByCompra[cid] ||= []).push({
    productoId: String(cell(row, 'id producto')).trim(),
    codigo:     String(cell(row, 'codigo')).trim(),
    nombre:     String(cell(row, 'producto')).trim(),
    cantidad:   parseInt0(cell(row, 'cantidad')),
    costoUnit:  parseNum(cell(row, 'precio unit.', 'precio unit', 'preciounit')),
    subtotal:   parseNum(cell(row, 'subtotal')),
  });
}

let batch = db.batch();
let ok = 0, skip = 0, inBatch = 0;
for (const row of cabeceras.rows) {
  const cid = String(cell(row, 'id compra')).trim();
  if (!cid) { skip++; continue; }
  const fecha = parseFecha(cell(row, 'fecha', 'fecha compra'));
  const compra = {
    compraId: cid,
    fecha: fecha ? admin.firestore.Timestamp.fromDate(fecha) : null,
    proveedor:   String(cell(row, 'proveedor')).trim(),
    proveedorId: String(cell(row, 'id proveedor')).trim(),
    remito:  String(cellLike(row, 'remito')).trim(),
    factura: String(cellLike(row, 'factura')).trim(),
    estado:  norm(cell(row, 'estado')) || 'recibida',
    total:   parseNum(cell(row, 'total')),
    cantItems: parseInt0(cell(row, 'cant. items', 'cant items', 'cantidad items')),
    notas:   String(cell(row, 'notas')).trim(),
    items:   itemsByCompra[cid] || [],
    migrado: true,
  };
  batch.set(db.collection(COL).doc(cid), compra, { merge: true });
  ok++; inBatch++;
  if (inBatch === 400) { await batch.commit(); batch = db.batch(); inBatch = 0; process.stdout.write('.'); }
}
if (inBatch > 0) await batch.commit();

console.log(`\n✅ Compras importadas/actualizadas: ${ok}   ·   Omitidas (sin ID): ${skip}`);
console.log(`   Compras con detalle: ${Object.keys(itemsByCompra).length}   ·   Colección: ${COL}   ·   ID del doc = ID Compra (hash)`);
process.exit(0);
