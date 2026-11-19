// functions/scripts/envia-carriers.mjs
// Lista los carriers disponibles en Envia.com (para saber qué códigos usar en shipment.carrier).
// Uso:  ENVIA_TOKEN=tu_token  node functions/scripts/envia-carriers.mjs
// (opcional) ENVIA_ENV=test

const token = process.env.ENVIA_TOKEN;
if (!token) { console.error('Falta ENVIA_TOKEN'); process.exit(1); }
const test = process.env.ENVIA_ENV === 'test';

const bases = ['https://queries.envia.com', test ? 'https://api-test.envia.com/queries' : 'https://api.envia.com/queries'];
const rutas = ['/carrier?country_code=AR', '/carrier', '/carriers?country_code=AR', '/carriers'];
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

for (const base of bases) {
  for (const ruta of rutas) {
    const url = `${base}${ruta}`;
    try {
      const res = await fetch(url, { headers });
      if (res.status === 404) continue;
      const txt = await res.text();
      console.log(`\n== ${url}  (HTTP ${res.status}) ==`);
      let json; try { json = JSON.parse(txt); } catch { console.log(txt.slice(0, 2000)); continue; }
      const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      if (!arr.length) { console.log(JSON.stringify(json, null, 2).slice(0, 2000)); continue; }
      console.log('Campos del primer item:', JSON.stringify(arr[0]));
      console.log('---');
      for (const c of arr) {
        const code = c.carrier || c.code || c.name || '?';
        const name = c.description || c.carrier_description || c.name || '';
        console.log(` ${String(code).padEnd(20)} ${name}`);
      }
      process.exit(0);
    } catch (e) { console.log(`(falló ${url}: ${e.message})`); }
  }
}
console.log('\nNingún endpoint de carriers respondió. Pegame lo de arriba.');
