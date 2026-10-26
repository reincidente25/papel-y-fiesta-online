// scripts/import-ventas.mjs
//
// Importa el historial de ventas desde un Excel de 2 pestañas a Firestore.
//   - Pestaña CABECERAS: una fila por venta.
//   - Pestaña DETALLE:   una fila por ítem (líneas de cada venta).
//   Se unen por la columna "ID Venta" (el hash original de Firestore).
//
// Resultado:
//   ventas/{ID Venta}   (ID del doc = hash de "ID Venta"; ventaId como campo)
//     { ventaId, fecha, canal, cliente, clienteId, vendedorId, metodoPago,
//       estado, subtotal, tipoDescuento, valorDesc, montoDesc, total,
//       cantItems, notas, items: [{ productoId, codigo, nombre, cantidad, precioUnit, subtotal }] }
//
// NO descuenta stock ni impacta caja: solo carga el historial.
//
// Uso:
//   1) cd scripts && npm install
//   2) Poné el Excel de ventas en scripts/ (nombre con "venta") o pasá la ruta.
//   3) serviceAccountKey.json en scripts/ (ver README)
//   4) node import-ventas.mjs [archivo.xlsx]
//
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COL = 'ventas';

const keyPath = join(__dirname, 'serviceAccountKey.json');
if (!existsSync(keyPath)) { console.error('✗ Falta scripts/serviceAccountKey.json (ver README.md).'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = admin.firestore();

// ---- Localizar Excel ----
let file = process.argv[2];
if (!file) {
  const xls = readdirSync(__dirname).filter((f) => /\.(xlsx|xls)$/i.test(f));
  file = xls.find((f) => /venta/i.test(f)) || xls[1] || xls[0];
  if (!file) { console.error('✗ No encontré el Excel de ventas en scripts/. Pasá la ruta como argumento.'); process.exit(1); }
  file = join(__dirname, file);
}
console.log('📄 Leyendo:', file);

// ---- Helpers ----
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function parseNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').replace(/[^\d,.-]/g, '');
  if (s === '') return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
const parseInt0 = (v) => Math.trunc(parseNum(v));

// "26/10/2026 14:31" -> Date  (soporta Date nativo de Excel)
function parseFecha(v) {
  if (v instanceof Date && !isNaN(v)) return v;
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function mapMetodoPago(v) {
  const e = norm(v);
  if (e.includes('efectivo')) return 'efectivo';
  if (e.includes('transfer')) return 'transferencia';
  if (e.includes('debito')) return 'debito';
  if (e.includes('credito')) return 'credito';
  if (e.includes('mercado')) return 'mercadopago';
  if (e.includes('corriente')) return 'cuenta_corriente';
  return e || 'efectivo';
}

function cell(row, ...names) {
  const map = {};
  for (const k of Object.keys(row)) map[norm(k)] = row[k];
  for (const n of names) if (map[n] !== undefined && map[n] !== '') return map[n];
  return '';
}
const hasHeader = (row, name) => Object.keys(row).some((k) => norm(k) === name);

// ---- Leer workbook ----
const wb = XLSX.readFile(file, { cellDates: true });
const sheets = wb.SheetNames.map((name) => ({ name, rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) }));

// Detectar pestañas por sus columnas
let detalle = sheets.find((s) => s.rows[0] && hasHeader(s.rows[0], 'id producto'));
let cabeceras = sheets.find((s) => s.rows[0] && hasHeader(s.rows[0], 'total') && !hasHeader(s.rows[0], 'id producto'));
if (!cabeceras) cabeceras = sheets[0];
if (!detalle) detalle = sheets[1] || sheets[0];
console.log(`   Cabeceras: "${cabeceras.name}" (${cabeceras.rows.length})   ·   Detalle: "${detalle.name}" (${detalle.rows.length})`);

// ---- Agrupar ítems del detalle por ID Venta ----
const itemsByVenta = {};
for (const row of detalle.rows) {
  const vid = String(cell(row, 'id venta')).trim();
  if (!vid) continue;
  (itemsByVenta[vid] ||= []).push({
    productoId: String(cell(row, 'id producto')).trim(),
    codigo:     String(cell(row, 'codigo')).trim(),
    nombre:     String(cell(row, 'producto')).trim(),
    cantidad:   parseInt0(cell(row, 'cantidad')),
    precioUnit: parseNum(cell(row, 'precio unit.', 'precio unit', 'preciounit')),
    subtotal:   parseNum(cell(row, 'subtotal')),
  });
}

// ---- Escribir ventas (cabecera + items) ----
let batch = db.batch();
let ok = 0, skip = 0, inBatch = 0;
for (const row of cabeceras.rows) {
  const vid = String(cell(row, 'id venta')).trim();
  if (!vid) { skip++; continue; }
  const fecha = parseFecha(cell(row, 'fecha', 'fecha venta'));
  const venta = {
    ventaId: vid,
    canal: 'local',
    fecha: fecha ? admin.firestore.Timestamp.fromDate(fecha) : null,
    cliente:   String(cell(row, 'cliente')).trim(),
    clienteId: String(cell(row, 'id cliente')).trim(),
    vendedorId:String(cell(row, 'id vendedor')).trim(),
    metodoPago: mapMetodoPago(cell(row, 'metodo de pago', 'metodo')),
    estado:     norm(cell(row, 'estado')) || 'completada',
    subtotal:      parseNum(cell(row, 'subtotal')),
    tipoDescuento: String(cell(row, 'tipo descuento')).trim(),
    valorDesc:     parseNum(cell(row, 'valor desc.', 'valor desc')),
    montoDesc:     parseNum(cell(row, 'monto desc.', 'monto desc')),
    total:         parseNum(cell(row, 'total')),
    cantItems:     parseInt0(cell(row, 'cant. items', 'cant items', 'cantidad items')),
    notas:         String(cell(row, 'notas')).trim(),
    items:         itemsByVenta[vid] || [],
    migrado:       true,
  };
  batch.set(db.collection(COL).doc(vid), venta, { merge: true });
  ok++; inBatch++;
  if (inBatch === 400) { await batch.commit(); batch = db.batch(); inBatch = 0; process.stdout.write('.'); }
}
if (inBatch > 0) await batch.commit();

const sinItems = Object.keys(itemsByVenta).length;
console.log(`\n✅ Ventas importadas/actualizadas: ${ok}   ·   Omitidas (sin ID): ${skip}`);
console.log(`   Ventas con detalle: ${sinItems}   ·   Colección: ${COL}   ·   ID del doc = ID Venta (hash)`);
process.exit(0);
