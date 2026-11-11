// src/services/geoService.js
// Normalización de direcciones con Georef (API oficial de datos.gob.ar).
// Gratis, sin API key. Solo direcciones de Argentina.
const GEOREF_URL = 'https://apis.datos.gob.ar/georef/api/direcciones';

/**
 * Busca direcciones normalizadas. Devuelve sugerencias con calle, altura,
 * localidad, provincia y coordenadas (lat/lon).
 * @param {string} texto  Ej: "Av. Corrientes 1234"
 * @param {object} [opts] { max, signal }
 */
export async function buscarDirecciones(texto, { max = 8, signal } = {}) {
  const q = (texto || '').trim();
  if (q.length < 4) return [];
  const url = `${GEOREF_URL}?direccion=${encodeURIComponent(q)}&max=${max}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Georef respondió ${res.status}`);
  const data = await res.json();
  return (data.direcciones || []).map((d) => {
    const calle = d.calle?.nombre || '';
    const numero = d.altura?.valor != null ? String(d.altura.valor) : '';
    // Etiqueta con calle + número (Georef a veces no lo incluye en `nombre`).
    const label = [calle, numero].filter(Boolean).join(' ');
    return {
      label: label || d.nombre || calle,
      calle,
      numero,
      localidad: d.localidad_censal?.nombre || d.departamento?.nombre || '',
      provincia: d.provincia?.nombre || '',
      lat: d.ubicacion?.lat ?? null,
      lon: d.ubicacion?.lon ?? null,
    };
  }).filter((d) => d.calle);
}
