// functions/lib/envia.js
// Integración con la API de Envia.com (agregador multi-correo).
// Docs: https://docs.envia.com/reference/shipping-rates
//
// Auth: header Authorization: Bearer <token> (el token sale del panel de Envia).
// Cotización: POST /ship/rate/  con { origin, destination, packages, shipment }.
// No se hardcodea nada sensible: el token viaja por Firebase secret.

import { provinciaLetra } from './enviopack.js';

const baseUrl = (test) => (test ? 'https://api-test.envia.com' : 'https://api.envia.com');

// Envia espera el estado como código ISO 3166-2 con prefijo de país (AR-C, AR-B, AR-X...).
// Acepta ese código tal cual, una letra suelta (le agrega AR-), o el nombre de provincia.
const estadoCodigo = (s, pais = 'AR') => {
  const v = String(s || '').trim();
  if (!v) return '';
  if (/^[A-Za-z]{2}-[A-Za-z0-9]{1,3}$/.test(v)) return v.toUpperCase();   // ya es ISO (AR-C)
  if (/^[A-Za-z]$/.test(v)) return `${pais}-${v.toUpperCase()}`;           // letra suelta
  const letra = provinciaLetra(v);
  return letra ? `${pais}-${letra}` : v;
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
