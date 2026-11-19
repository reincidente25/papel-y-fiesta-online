// functions/lib/enviopack.js
// Integración con la API de Envíopack (agregador multi-correo: Correo Argentino,
// Andreani, OCA, etc.). Docs: https://developers.enviopack.com.ar
//
// Flujo: POST /auth (api-key + secret) → access_token (vale ~4h) → GET de cotización.
// No se guarda nada sensible en el código: las credenciales viajan por Firebase secrets.

const BASE = 'https://api.enviopack.com';

// Mapa provincia (nombre) → código de letra que usa Envíopack/CPA.
const PROV_LETRA = {
  'ciudad autonoma de buenos aires': 'C', 'caba': 'C', 'capital federal': 'C',
  'buenos aires': 'B',
  'catamarca': 'K', 'chaco': 'H', 'chubut': 'U', 'cordoba': 'X', 'córdoba': 'X',
  'corrientes': 'W', 'entre rios': 'E', 'entre ríos': 'E', 'formosa': 'P',
  'jujuy': 'Y', 'la pampa': 'L', 'la rioja': 'F', 'mendoza': 'M', 'misiones': 'N',
  'neuquen': 'Q', 'neuquén': 'Q', 'rio negro': 'R', 'río negro': 'R', 'salta': 'A',
  'san juan': 'J', 'san luis': 'D', 'santa cruz': 'Z', 'santa fe': 'S',
  'santiago del estero': 'G', 'tierra del fuego': 'V', 'tucuman': 'T', 'tucumán': 'T',
};

const normalizar = (s) => String(s || '').trim().toLowerCase();

export function provinciaLetra(nombre) {
  return PROV_LETRA[normalizar(nombre)] || '';
}

async function getToken({ apiKey, secret }) {
  const body = new URLSearchParams({ 'api-key': apiKey, secret });
  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Envíopack auth ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const token = data.token || data.access_token;
  if (!token) throw new Error('Envíopack no devolvió token');
  return token;
}

// Toma el primer valor numérico entre varios nombres de campo posibles.
const num = (obj, ...keys) => {
  for (const k of keys) {
    const v = Number(obj?.[k]);
    if (Number.isFinite(v) && v > 0) return v;
  }
  return 0;
};

function normalizarRates(arr, modalidad) {
  const items = Array.isArray(arr) ? arr : (arr ? [arr] : []);
  return items.map((o) => {
    const price = num(o, 'costo', 'precio', 'tarifa', 'valor', 'total');
    const correo = o.correo || o.servicio || o.nombre_servicio || 'Envío';
    return {
      deliveredType: modalidad === 'sucursal' ? 'S' : 'D',
      productName: `${correo}${modalidad === 'sucursal' ? ' (a sucursal)' : ' (a domicilio)'}`,
      price: Math.round(price),
      meta: { correo, modalidad, servicio: o.servicio || null, dias: o.entrega || o.plazo || null },
    };
  }).filter((r) => r.price > 0);
}

/**
 * Cotiza un envío nacional.
 * cfg: { apiKey, secret, deposito? }
 * datos: { cpDestino, provincia?, pesoGramos, paquetes? }  (provincia = nombre o letra)
 */
export async function cotizar(cfg, { cpDestino, provincia = '', pesoGramos = 500, paquetes = '20x15x10' } = {}) {
  const token = await getToken(cfg);
  const letra = provincia.length === 1 ? provincia.toUpperCase() : provinciaLetra(provincia);

  const qs = (extra = {}) => {
    const p = new URLSearchParams({
      access_token: token,
      codigo_postal: String(cpDestino),
      peso: String(Math.max(1, Math.round(pesoGramos))),
      paquetes: String(paquetes),
      ...extra,
    });
    if (letra) p.set('provincia', letra);
    if (cfg.deposito) p.set('direccion_envio', String(cfg.deposito));
    return p.toString();
  };

  const pedir = async (ruta, modalidad) => {
    const res = await fetch(`${BASE}${ruta}?${qs()}`);
    if (!res.ok) throw new Error(`Envíopack ${ruta} ${res.status}: ${await res.text()}`);
    return normalizarRates(await res.json(), modalidad);
  };

  // Domicilio + sucursal en paralelo; si una falla, seguimos con la otra.
  const [dom, suc] = await Promise.allSettled([
    pedir('/cotizar/precio/a-domicilio', 'domicilio'),
    pedir('/cotizar/precio/a-sucursal', 'sucursal'),
  ]);

  const rates = [
    ...(dom.status === 'fulfilled' ? dom.value : []),
    ...(suc.status === 'fulfilled' ? suc.value : []),
  ].sort((a, b) => a.price - b.price);

  if (rates.length === 0) {
    const err = dom.reason || suc.reason;
    throw new Error(err ? String(err.message || err) : 'Sin tarifas de Envíopack');
  }
  return { rates };
}
