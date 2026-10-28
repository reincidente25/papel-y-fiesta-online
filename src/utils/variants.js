// src/utils/variants.js
// Helpers para productos con variantes (color, tamaño, diseño, etc.).

export const nuevaVarianteId = () =>
  `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const tieneVariantes = (p) => Boolean(p?.tieneVariantes && p?.variantes?.length);

// El precio y el stock son del producto (las variantes son solo de elección).

export const varianteLabel = (v) => (v?.tipo ? `${v.tipo}: ${v.nombre}` : (v?.nombre || ''));

// Imagen principal: la portada del producto o, si no tiene, la de la primera
// variante que tenga foto.
export const imagenPrincipal = (p) => {
  if (p?.imagen) return p.imagen;
  if (p?.imagenes?.length) return p.imagenes[0];
  if (p?.variantes?.length) return p.variantes.find((v) => v.imagen)?.imagen || '';
  return '';
};

// Lista de fotos del producto: las propias + las de las variantes (sin repetir).
export const fotosProducto = (p) => {
  const base = p?.imagenes?.length ? p.imagenes : (p?.imagen ? [p.imagen] : []);
  const deVariantes = (p?.variantes || []).map((v) => v.imagen).filter(Boolean);
  return [...new Set([...base, ...deVariantes])];
};

// Normaliza las variantes antes de guardar (solo tipo, nombre y foto).
export const limpiarVariantes = (variantes = []) =>
  variantes
    .filter((v) => (v.nombre || '').trim() !== '')
    .map((v) => ({
      id: v.id || nuevaVarianteId(),
      tipo: (v.tipo || '').trim(),
      nombre: (v.nombre || '').trim(),
      imagen: v.imagen || '',
    }));
