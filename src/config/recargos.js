// src/config/recargos.js
// Recargos por medio de pago. Los valores por defecto se usan como respaldo;
// los reales se cargan desde el panel (config/pagos) con el hook useRecargos.

export const RECARGO_DEBITO = 7; // %

export const CREDITO_OPCIONES = [
  { cuotas: 1, recargo: 15 },
  { cuotas: 2, recargo: 19 },
  { cuotas: 3, recargo: 19 },
];

export const cuotaLabel = (c) => `${c.cuotas} ${c.cuotas === 1 ? 'pago' : 'pagos'} (+${c.recargo}%)`;

// Valores efectivos a partir de la config (con respaldo a los defaults).
export const getRecargoDebito = (cfg) => Number(cfg?.recargoDebito ?? RECARGO_DEBITO) || 0;
export const getCreditoOpciones = (cfg) => (Array.isArray(cfg?.creditoOpciones) && cfg.creditoOpciones.length ? cfg.creditoOpciones : CREDITO_OPCIONES);

// % de recargo según medio de pago y cuotas (cfg opcional).
export const recargoPctDe = (metodo, cuotas, cfg) => {
  if (metodo === 'debito') return getRecargoDebito(cfg);
  if (metodo === 'credito') return getCreditoOpciones(cfg).find((c) => c.cuotas === cuotas)?.recargo || 0;
  return 0; // efectivo / transferencia
};
