// functions/scripts/test-envia.mjs
// Prueba de cotización con Envia.com usando el mismo proveedor que la Cloud Function.
//
// PowerShell:
//   $env:ENVIA_TOKEN="tu_token"; $env:ORIGEN_CP="1407"; $env:PROVINCIA="Buenos Aires"; node functions/scripts/test-envia.mjs 1425
// Git Bash:
//   ENVIA_TOKEN=tu_token ORIGEN_CP=1407 PROVINCIA="Buenos Aires" node functions/scripts/test-envia.mjs 1425

import { cotizar } from '../lib/envia.js';

const token = process.env.ENVIA_TOKEN;
if (!token) { console.error('Falta ENVIA_TOKEN en el entorno.'); process.exit(1); }

const cpDestino = process.argv[2] || '1425';
const cfg = {
  token,
  test: process.env.ENVIA_ENV === 'test',
  origen: {
    cp: process.env.ORIGEN_CP || '1407',
    estado: process.env.ORIGEN_PROV || 'Ciudad Autónoma de Buenos Aires',
    ciudad: process.env.ORIGEN_CIUDAD || 'CABA',
    pais: 'AR',
  },
  carriers: process.env.CARRIERS ? process.env.CARRIERS.split(',').map((s) => s.trim()) : undefined,
};

try {
  const r = await cotizar(cfg, {
    cpDestino,
    provincia: process.env.PROVINCIA || '',
    ciudad: process.env.CIUDAD || '',
    pesoGramos: Number(process.env.PESO_G) || 1000,
  });
  console.log(`\nTarifas (${r.rates.length}):`);
  for (const t of r.rates) {
    console.log(` • ${t.productName}  →  $${t.price}  ${t.meta?.dias ? '(' + t.meta.dias + ')' : ''}  [${t.deliveredType}]`);
  }
} catch (e) {
  console.error('\nERROR:', e.message);
  process.exit(1);
}
