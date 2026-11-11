// functions/lib/correoArgentino.js
// Cliente de la API "Mi Correo Argentino" para cotizar envíos (Paq.ar).
// Flujo: POST /token (Basic) -> JWT; POST /users/validate (Bearer) -> customerId;
// POST /rates (Bearer) -> tarifas. Credenciales por secret; nada hardcodeado.

const BASES = {
  test: 'https://apitest.correoargentino.com.ar/micorreo/v1',
  prod: 'https://api.correoargentino.com.ar/micorreo/v1',
};

// Cache a nivel módulo (persiste mientras la instancia esté tibia).
let cache = { token: null, expira: 0, customerId: null };

// Extrae el CP numérico de 4 dígitos (acepta CPA "C1407GZO" -> "1407").
export function cpNumerico(cp) {
  const m = String(cp || '').match(/\d{4}/);
  return m ? m[0] : '';
}

async function post(base, path, headers, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* respuesta no-JSON */ }
  if (!res.ok) throw new Error(`Correo ${path} ${res.status}: ${text.slice(0, 180)}`);
  return data;
}

async function asegurarSesion(cfg) {
  const base = BASES[cfg.env] || BASES.prod;
  const ahora = Date.now();
  if (cache.token && cache.customerId && cache.expira - 60000 > ahora) return { base };

  // 1) Token (Basic userToken:passwordToken)
  const basic = Buffer.from(`${cfg.userToken}:${cfg.passwordToken}`).toString('base64');
  const tok = await post(base, '/token', { authorization: `Basic ${basic}` });
  cache.token = tok.token;
  cache.expira = tok.expires ? new Date(tok.expires).getTime() : (ahora + 50 * 60000);

  // 2) customerId (Bearer + email/password de la cuenta)
  const val = await post(base, '/users/validate', { authorization: `Bearer ${cache.token}` },
    { email: cfg.email, password: cfg.password });
  cache.customerId = val.customerId;
  return { base };
}

/**
 * Cotiza un envío. Devuelve { customerId, rates:[{deliveredType,productType,productName,price,...}] }.
 * @param cfg { env, userToken, passwordToken, email, password }
 * @param q   { cpOrigen, cpDestino, pesoGramos, dimensiones:{length,width,height}, cantidad, deliveredType? }
 */
export async function cotizar(cfg, q) {
  const { base } = await asegurarSesion(cfg);
  const dim = q.dimensiones || { length: 20, width: 15, height: 10 };
  const body = {
    customerId: cache.customerId,
    postalCodeOrigin: cpNumerico(q.cpOrigen),
    postalCodeDestination: cpNumerico(q.cpDestino),
    ...(q.deliveredType ? { deliveredType: q.deliveredType } : {}),
    dimensions: [{
      weight: Math.max(1, Math.min(25000, Math.round(q.pesoGramos || 500))),
      length: dim.length, width: dim.width, height: dim.height,
      quantity: q.cantidad || 1,
    }],
  };
  return post(base, '/rates', { authorization: `Bearer ${cache.token}` }, body);
}
