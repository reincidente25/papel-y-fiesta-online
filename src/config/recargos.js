// src/config/recargos.js
// Recargos por medio de pago (fuente única para la venta local y la web).
// Editá estos valores para cambiar los intereses en todo el sistema.

export const RECARGO_DEBITO = 7; // %

export const CREDITO_OPCIONES = [
  { cuotas: 1, recargo: 15, label: '1 pago (+15%)' },
  { cuotas: 2, recargo: 19, label: '2 pagos (+19%)' },
  { cuotas: 3, recargo: 19, label: '3 pagos (+19%)' },
];

// % de recargo según medio de pago y cuotas.
export const recargoPctDe = (metodo, cuotas) => {
  if (metodo === 'debito') return RECARGO_DEBITO;
  if (metodo === 'credito') return CREDITO_OPCIONES.find((c) => c.cuotas === cuotas)?.recargo || 0;
  return 0; // efectivo / transferencia / etc.
};
