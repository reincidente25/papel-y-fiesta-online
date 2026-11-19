// functions/lib/envia.js
// Integración con la API de Envia.com (agregador multi-correo).
// Docs: https://docs.envia.com/reference/shipping-rates
//
// Auth: header Authorization: Bearer <token> (el token sale del panel de Envia).
// Cotización: POST /ship/rate/  con { origin, destination, packages, shipment }.
// No se hardcodea nada sensible: el token viaja por Firebase secret.

const baseUrl = (test) => (test ? 'https://api-test.envia.com' : 'https://api.envia.com');

// Envia espera el estado como su código de 2 letras (code_2_digits del catálogo).
const ESTADO_COD = {
  'buenos aires': 'BA',
  'catamarca': 'CT', 'chaco': 'CC', 'chubut': 'CH',
  'ciudad autonoma de buenos aires': 'DF', 'caba': 'DF', 'capital federal': 'DF',
  'cordoba': 'CB', 'corrientes': 'CN', 'entre rios': 'ER', 'formosa': 'FM',
  'jujuy': 'JY', 'la pampa': 'LP', 'la rioja': 'LR', 'mendoza': 'MZ',
  'misiones': 'MN', 'neuquen': 'NQ', 'rio negro': 'RN', 'salta': 'SA',
  'san juan': 'SJ', 'san luis': 'SL', 'santa cruz': 'SC', 'santa fe': 'SF',
  'santiago del estero': 'SE', 'tierra del fuego': 'TF', 'tucuman': 'TM',
};

// Normaliza quitando acentos para que "Córdoba" y "Río Negro" matcheen.
const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export const estadoCodigo = (s) => {
  const v = String(s || '').trim();
  if (!v) return '';
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();   // ya es código de 2 letras
  return ESTADO_COD[sinAcentos(v)] || '';
};

// Toma el primer valor numérico entre varios nombres de campo posibles.
const num = (obj, ...keys) => {
  for (const k of keys) {
    const v = Number(obj?.[k]);
    if (Number.isFinite(v) && v > 0) return v;
  }
  return 0;
};

function normalizarRates(data) {
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  return arr.map((o) => {
    const price = num(o, 'totalPrice', 'total_price', 'basePrice', 'base_price', 'price', 'amount');
    const carrier = o.carrier || o.carrierName || o.company || 'Envío';
    const servicio = o.serviceDescription || o.service_description || o.service || '';
    const dias = o.deliveryEstimate || o.delivery_estimate || o.deliveryDays || null;
    return {
      deliveredType: /sucursal|office|pickup|branch/i.test(`${servicio} ${o.deliveryType || ''}`) ? 'S' : 'D',
      productName: [carrier, servicio].filter(Boolean).join(' · ') || 'Envío',
      price: Math.round(price),
      meta: { carrier, servicio, dias, currency: o.currency || 'ARS' },
    };
  }).filter((r) => r.price > 0).sort((a, b) => a.price - b.price);
}

/**
 * Cotiza envíos.
 * cfg: { token, test?, origen: { cp, estado?, ciudad?, pais?, nombre? } }
 * datos: { cpDestino, provincia?, ciudad?, pesoGramos, valorDeclarado?, paquete? }
 */
export async function cotizar(cfg, {
  cpDestino, provincia = '', ciudad = '', pesoGramos = 500, valorDeclarado = 0, paquete = {},
} = {}) {
  const origen = cfg.origen || {};
  const pesoKg = Math.max(0.1, Math.round((Number(pesoGramos) || 500)) / 1000);

  const body = {
    origin: {
      name: origen.nombre || 'Papel & Fiesta',
      country: origen.pais || 'AR',
      postalCode: String(origen.cp || ''),
      state: estadoCodigo(origen.estado),
      city: origen.ciudad || '',
    },
    destination: {
      name: 'Cliente',
      country: 'AR',
      postalCode: String(cpDestino || ''),
      state: estadoCodigo(provincia),
      city: ciudad || '',
    },
    packages: [{
      content: 'Productos de librería y cotillón',
      amount: 1,
      type: 'box',
      weight: pesoKg,
      insurance: Number(valorDeclarado) || 0,
      declaredValue: Number(valorDeclarado) || 0,
      weightUnit: 'KG',
      lengthUnit: 'CM',
      dimensions: {
        length: Number(paquete.length) || 20,
        width: Number(paquete.width) || 15,
        height: Number(paquete.height) || 10,
      },
    }],
    shipment: { type: 1 },
  };

  const res = await fetch(`${baseUrl(cfg.test)}/ship/rate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Envia rate ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json?.meta === 'error' || json?.error) {
    throw new Error(`Envia error: ${JSON.stringify(json.error || json.message || json)}`);
  }
  const rates = normalizarRates(json);
  if (rates.length === 0) throw new Error('Envia no devolvió tarifas');
  return { rates };
}
