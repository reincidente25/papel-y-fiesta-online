// src/utils/format.js
// Helpers de formato para toda la app (moneda ARS por defecto).

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatMoney = (value) => currency.format(Number(value) || 0);

// Convierte Timestamp de Firestore | Date | string a Date de JS (o null)
export const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const d = new Date(value);
  return isNaN(d) ? null : d;
};

export const formatDate = (value) => {
  if (!value) return '—';
  // Soporta Timestamp de Firestore o Date/string
  const date = value?.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
};

// Margen de ganancia a partir de precio de costo y de venta
export const calcMargin = (costo, venta) => {
  const c = Number(costo) || 0;
  const v = Number(venta) || 0;
  if (!v) return 0;
  return Math.round(((v - c) / v) * 100);
};

export const slugify = (text = '') =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
