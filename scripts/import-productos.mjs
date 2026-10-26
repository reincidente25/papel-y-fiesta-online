// scripts/import-productos.mjs
//
// Importa productos desde un Excel a Firestore.
// - El ID de cada documento = Código del producto (ej. "VAR-046"), NO un hash random.
// - El campo `codigo` se guarda también dentro del documento para filtrar rápido.
//
// Uso:
//   1) npm install            (dentro de la carpeta scripts/)
//   2) Poné el Excel en scripts/ (o pasá la ruta como argumento)
//   3) Descargá la service account key de Firebase y guardala como
//      scripts/serviceAccountKey.json  (ver README.md)
//   4) node import-productos.mjs [archivo.xlsx]
//
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COLLECTION = 'productos';

// ---- Service account ----
const keyPath = join(__dirname, 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error('✗ Falta scripts/serviceAccountKey.json (ver README.md).');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = admin.firestore();

// ---- Localizar el Excel ----
let file = process.argv[2];
if (!file) {
  const xls = readdirSync(__dirname).filter((f) => /\.(xlsx|xls)$/i.test(f));
  if (xls.length === 0) { console.error('✗ No encontré ningún .xlsx en scripts/. Pasá la ruta como argumento.'); process.exit(1); }
  file = join(__dirname, xls[0]);
}
console.log('📄 Leyendo:', file);

// ---- Helpers ----
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Convierte "$1.020,00" / "1.020,00" / "1020" -> 1020.00
function parseNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').replace(/[^\d,.-]/g, '');
  if (s === '') return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); // formato AR
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function parseInt0(v) { return Math.trunc(parseNum(v)); }

// Estado del Excel -> estado de la app
function mapEstado(v) {
  const e = norm(v);
  if (e.startsWith('activ')) return 'activo';
  if (e.startsWith('inactiv') || e.startsWith('pausad')) return 'pausado';
  return 'pausado';
}

// ID de documento seguro para Firestore (sin '/')
const safeId = (codigo) => String(codigo).trim().replace(/\//g, '-');

// ---- Leer filas ----
const wb = XLSX.readFile(file);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
console.log(`   ${rows.length} filas encontradas`);

// Acceso por header normalizado (tolera acentos y mayúsculas)
function cell(row, ...names) {
  const map = {};
  for (const k of Object.keys(row)) map[norm(k)] = row[k];
  for (const n of names) if (map[n] !== undefined && map[n] !== '') return map[n];
  return '';
}

// ---- Construir y escribir en lotes ----
let batch = db.batch();
let ok = 0, skip = 0, inBatch = 0;

for (const row of rows) {
  const codigo = String(cell(row, 'codigo')).trim();
  if (!codigo) { skip++; continue; }

  const id = safeId(codigo);
  const prod = {
    codigo,                                   // campo para filtrar rápido
    nombre:       String(cell(row, 'nombre')).trim(),
    marca:        String(cell(row, 'marca')).trim(),
    descripcion:  String(cell(row, 'descripcion')).trim(),
    proveedor:    String(cell(row, 'proveedor')).trim(),
    precioCosto:  parseNum(cell(row, 'precio compra', 'preciocompra')),
    precioVenta:  parseNum(cell(row, 'precio venta', 'precioventa')),
    stock:        parseInt0(cell(row, 'stock')),
    stockMinimo:  parseInt0(cell(row, 'stock minimo', 'stockminimo')),
    estado:       mapEstado(cell(row, 'estado')),
    categoria:    '',        // se asigna luego desde el panel
    destacado:    false,
    imagen:       '',
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
  };

  batch.set(db.collection(COLLECTION).doc(id), prod, { merge: true });
  ok++; inBatch++;

  if (inBatch === 450) { await batch.commit(); batch = db.batch(); inBatch = 0; process.stdout.write('.'); }
}
if (inBatch > 0) await batch.commit();

console.log(`\n✅ Importados/actualizados: ${ok}   ·   Omitidos (sin código): ${skip}`);
console.log(`   Colección: ${COLLECTION}   ·   ID del documento = Código`);
process.exit(0);
