// functions/scripts/envia-states.mjs
// Lista los códigos de provincia (state) que Envia.com espera para Argentina.
// Uso:  ENVIA_TOKEN=tu_token  node functions/scripts/envia-states.mjs
// (opcional) ENVIA_ENV=test

const token = process.env.ENVIA_TOKEN;
if (!token) { console.error('Falta ENVIA_TOKEN'); process.exit(1); }
const test = process.env.ENVIA_ENV === 'test';

// Probamos los endpoints conocidos del catálogo (Queries API) hasta que uno responda.
const bases = [
  'https://queries.envia.com',
  test ? 'https://api-test.envia.com/queries' : 'https://api.envia.com/queries',
];
const rutas = [
  '/state?country_code=AR',
  '/state?country=AR',
  '/states?country_code=AR',
];

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

for (const base of bases) {
  for (const ruta of rutas) {
    const url = `${base}${ruta}`;
    try {
      const res = await fetch(url, { headers });
      const txt = await res.text();
      if (res.status === 404) { continue; }
      console.log(`\n== ${url}  (HTTP ${res.status}) ==`);
      let json; try { json = JSON.parse(txt); } catch { console.log(txt.slice(0, 2000)); continue; }
      const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      if (arr.length) {
        console.log('Campos del primer item:', JSON.stringify(arr[0]));
        console.log('---');
        for (const s of arr) {
          const code = s.code ?? s.code_2 ?? s.code_3 ?? s.state_code ?? s.iso ?? s.abbr ?? s.abbreviation ?? s.id ?? '?';
          const name = s.name || s.state || s.description || '';
          console.log(` ${String(code).padEnd(6)} ${name}`);
        }
        process.exit(0);
      } else {
        console.log(JSON.stringify(json, null, 2).slice(0, 2000));
      }
    } catch (e) {
      console.log(`(falló ${url}: ${e.message})`);
    }
  }
}
console.log('\nNingún endpoint de catálogo respondió con datos. Pegame lo de arriba.');
