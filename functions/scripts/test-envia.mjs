// functions/scripts/test-envia.mjs
// Prueba rápida de cotización con Envia.com para ver qué carriers devuelve tu cuenta.
//
// Uso (Node 18+):
//   ENVIA_TOKEN=tu_token  node functions/scripts/test-envia.mjs 1425
//   (opcional) ENVIA_ENV=test  y  ORIGEN_CP=5000 PROVINCIA="Buenos Aires"
//
// No imprime el token. No commitea credenciales: el token va por variable de entorno.

import { provinciaLetra } from '../lib/enviopack.js';

const token = process.env.ENVIA_TOKEN;
if (!token) { console.error('Falta ENVIA_TOKEN en el entorno.'); process.exit(1); }

const codigo = (s) => { const v = String(s || '').trim(); return /^[A-Za-z]{1,2}$/.test(v) ? v.toUpperCase() : provinciaLetra(v); };

const test = process.env.ENVIA_ENV === 'test';
const base = test ? 'https://api-test.envia.com' : 'https://api.envia.com';
const cpDestino = process.argv[2] || '1425';
const cpOrigen = process.env.ORIGEN_CP || '5000';
const provincia = process.env.PROVINCIA || 'Buenos Aires';

const body = {
  origin: { name: 'Papel & Fiesta', country: 'AR', postalCode: cpOrigen, state: codigo(process.env.ORIGEN_PROV || 'Ciudad Autónoma de Buenos Aires'), city: process.env.ORIGEN_CIUDAD || 'CABA' },
  destination: { name: 'Cliente', country: 'AR', postalCode: cpDestino, state: codigo(provincia), city: process.env.CIUDAD || '' },
  packages: [{
    content: 'Productos', amount: 1, type: 'box',
    weight: 1, insurance: 0, declaredValue: 0, weightUnit: 'KG', lengthUnit: 'CM',
    dimensions: { length: 20, width: 15, height: 10 },
  }],
  shipment: { type: 1 },
};

const res = await fetch(`${base}/ship/rate/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
});

const txt = await res.text();
console.log('HTTP', res.status);
let json;
try { json = JSON.parse(txt); } catch { console.log(txt); process.exit(0); }

const data = Array.isArray(json?.data) ? json.data : [];
if (!data.length) { console.log(JSON.stringify(json, null, 2)); process.exit(0); }

console.log(`\nCarriers / servicios devueltos (${data.length}):`);
for (const r of data) {
  const carrier = r.carrier || r.carrierName || '?';
  const serv = r.serviceDescription || r.service || '';
  const price = r.totalPrice ?? r.total_price ?? r.price ?? '?';
  const dias = r.deliveryEstimate || r.delivery_estimate || '';
  console.log(` • ${carrier}  ${serv}  →  $${price} ${r.currency || ''}  ${dias ? '(' + dias + ')' : ''}`);
}
