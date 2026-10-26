// src/utils/variants.js
// Helpers para productos con variantes (color, tamaño, diseño, etc.).

export const nuevaVarianteId = () =>
  `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const tieneVariantes = (p) => Boolean(p?.tieneVariantes && p?.variantes?.length);

// Stock total: suma de variantes, o el stock simple del producto.
export const stockTotal = (p) =>
  tieneVariantes(p)
    ? p.variantes.reduce((n, v) => n + (Number(v.stock) || 0), 0)
    : (Number(p?.stock) || 0);

// Precio a mostrar en catálogo: el menor de las variantes ("desde").
export const precioDesde = (p) =>
  tieneVariantes(p)
    ? Math.min(...p.variantes.map((v) => Number(v.precioVenta) || 0))
    : (Number(p?.precioVenta) || 0);

// Costo de referencia: el menor de las variantes.
export const costoDesde = (p) =>
  tieneVariantes(p)
    ? Math.min(...p.variantes.map((v) => Number(v.precioCosto) || 0))
    : (Number(p?.precioCosto) || 0);

export const varianteLabel = (v) => (v?.tipo ? `${v.tipo}: ${v.nombre}` : (v?.nombre || ''));

// Normaliza las variantes antes de guardar (números y labels limpios).
export const limpiarVariantes = (variantes = []) =>
  variantes
    .filter((v) => (v.nombre || '').trim() !== '')
    .map((v) => ({
      id: v.id || nuevaVarianteId(),
      tipo: (v.tipo || '').trim(),
      nombre: (v.nombre || '').trim(),
      precioCosto: Number(v.precioCosto) || 0,
      precioVenta: Number(v.precioVenta) || 0,
      stock: Number(v.stock) || 0,
      imagen: v.imagen || '',
    }));
