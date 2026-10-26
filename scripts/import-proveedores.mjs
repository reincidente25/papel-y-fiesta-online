// scripts/import-proveedores.mjs
//
// Importa proveedores desde un Excel (1 pestaña) a Firestore.
//   proveedores/{ID}   (ID del doc = columna "ID" original; proveedorId como campo)
//
// Uso:
//   cd scripts && npm install
//   node import-proveedores.mjs [archivo.xlsx]   (toma el que tenga "proveedor" en el nombre)
//
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COL = 'proveedores';

const keyPath = join(__dirname, 'serviceAccountKey.json');
if (!existsSync(keyPath)) { console.error('✗ Falta scripts/serviceAccountKey.json (ver README.md).'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = admin.firestore();

let file = process.argv[2];
if (!file) {
  const xls = readdirSync(__dirname).filter((f) => /\.(xlsx|xls)$/i.test(f));
  file = xls.find((f) => /proveedor/i.test(f)) || xls[0];
  if (!file) { console.error('✗ No encontré el Excel de proveedores en scripts/.'); process.exit(1); }
  file = join(__dirname, file);
}
console.log('📄 Leyendo:', file);

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
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

const wb = XLSX.readFile(file, { cellDates: true });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
console.log(`   ${rows.length} filas`);

let batch = db.batch();
let ok = 0, skip = 0, inBatch = 0;
for (const row of rows) {
  const id = String(cell(row, 'id')).trim();
  if (!id) { skip++; continue; }
  const creado = parseFecha(cell(row, 'creado'));
  const prov = {
    proveedorId: id,
    nombre:      String(cell(row, 'razon social', 'razon', 'nombre')).trim(),
    cuit:        String(cell(row, 'cuit')).trim(),
    contacto:    String(cell(row, 'contacto')).trim(),
    email:       String(cell(row, 'email')).trim(),
    telefono:    String(cell(row, 'telefono')).trim(),
    rubro:       String(cell(row, 'rubro')).trim(),
    direccion:   String(cell(row, 'direccion')).trim(),
    ciudad:      String(cell(row, 'ciudad')).trim(),
    provincia:   String(cell(row, 'provincia')).trim(),
    codigoPostal:String(cell(row, 'codigo postal', 'cp')).trim(),
    notas:       String(cell(row, 'notas')).trim(),
    estado:      norm(cell(row, 'estado')).startsWith('activ') ? 'activo' : 'inactivo',
    creado:      creado ? admin.firestore.Timestamp.fromDate(creado) : null,
    migrado:     true,
  };
  batch.set(db.collection(COL).doc(id), prov, { merge: true });
  ok++; inBatch++;
  if (inBatch === 450) { await batch.commit(); batch = db.batch(); inBatch = 0; process.stdout.write('.'); }
}
if (inBatch > 0) await batch.commit();

console.log(`\n✅ Proveedores importados/actualizados: ${ok}   ·   Omitidos (sin ID): ${skip}`);
console.log(`   Colección: ${COL}   ·   ID del doc = ID original`);
process.exit(0);
