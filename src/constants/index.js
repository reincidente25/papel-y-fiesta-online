// src/constants/index.js

// Estados posibles de un producto
export const PRODUCT_STATUS = {
  activo:    { value: 'activo',    label: 'Activo',    badge: 'badge-success' },
  pausado:   { value: 'pausado',   label: 'Pausado',   badge: 'badge-warning' },
  sin_stock: { value: 'sin_stock', label: 'Sin stock', badge: 'badge-danger'  },
  borrador:  { value: 'borrador',  label: 'Borrador',  badge: 'badge-muted'   },
};

export const PRODUCT_STATUS_LIST = Object.values(PRODUCT_STATUS);

// Estados del seguimiento de pedidos (los pagos NO se procesan en la web).
export const ORDER_STATUS = {
  pendiente:      { value: 'pendiente',      label: 'Pendiente de validación', badge: 'badge-warning', step: 0, desc: 'Recibimos tu pedido. Estamos verificando la disponibilidad de stock.' },
  confirmado:     { value: 'confirmado',     label: 'Confirmado — a pagar',    badge: 'badge-warning', step: 1, desc: 'Confirmamos el stock. Ya podés abonar por transferencia con los datos de más abajo.' },
  pago_informado: { value: 'pago_informado', label: 'Pago informado',          badge: 'badge-muted',   step: 1, desc: 'Nos avisaste que transferiste. Estamos verificando el pago.' },
  pagado:         { value: 'pagado',         label: 'Pago confirmado',         badge: 'badge-success', step: 2, desc: 'Confirmamos tu pago. Empezamos a preparar tu pedido.' },
  preparando:     { value: 'preparando',     label: 'En preparación',          badge: 'badge-muted',   step: 3, desc: 'Estamos preparando tu pedido.' },
  enviado:        { value: 'enviado',        label: 'Enviado / listo',         badge: 'badge-muted',   step: 4, desc: 'Tu pedido fue despachado o está listo para retirar.' },
  entregado:      { value: 'entregado',      label: 'Entregado',               badge: 'badge-success', step: 5, desc: '¡Pedido entregado! Gracias por tu compra.' },
  cancelado:      { value: 'cancelado',      label: 'Cancelado',               badge: 'badge-danger',  step: -1, desc: 'El pedido fue cancelado.' },
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

// Pasos visibles de la línea de tiempo (cancelado queda fuera).
export const ORDER_FLOW = ['pendiente', 'confirmado', 'pagado', 'preparando', 'enviado', 'entregado'];

// Acciones que puede tomar el admin según el estado actual.
export const ORDER_NEXT_ACTIONS = {
  pendiente:      [{ to: 'confirmado', label: '✓ Validar stock', style: 'btn-primary' }, { to: 'cancelado', label: 'Sin stock / cancelar', style: 'btn-danger' }],
  confirmado:     [{ to: 'pagado', label: '✓ Confirmar pago', style: 'btn-primary' }, { to: 'cancelado', label: 'Cancelar', style: 'btn-ghost' }],
  pago_informado: [{ to: 'pagado', label: '✓ Confirmar pago', style: 'btn-primary' }, { to: 'cancelado', label: 'Cancelar', style: 'btn-ghost' }],
  pagado:         [{ to: 'preparando', label: 'Marcar en preparación', style: 'btn-primary' }],
  preparando:     [{ to: 'enviado', label: 'Marcar enviado / listo', style: 'btn-primary' }],
  enviado:        [{ to: 'entregado', label: '✓ Marcar entregado', style: 'btn-primary' }],
  entregado:      [],
  cancelado:      [],
};

// Roles de usuario
export const ROLES = {
  ADMIN: 'admin',
  CLIENTE: 'cliente',
};

// Categorías base de la librería (semilla; luego editables desde el panel)
export const DEFAULT_CATEGORIES = [
  { id: 'libreria',    name: 'Librería',            icon: '✏️' },
  { id: 'escolar',     name: 'Escolar',             icon: '🎒' },
  { id: 'arte',        name: 'Arte y manualidades', icon: '🎨' },
  { id: 'fiesta',      name: 'Cotillón y fiesta',   icon: '🎉' },
  { id: 'regaleria',   name: 'Regalería',           icon: '🎁' },
  { id: 'oficina',     name: 'Oficina',             icon: '📎' },
];

// Medios de pago (ventas, compras y caja)
export const PAYMENT_METHODS = {
  efectivo:     { value: 'efectivo',     label: 'Efectivo',      afectaCaja: true },
  debito:       { value: 'debito',       label: 'Débito',        afectaCaja: false },
  credito:      { value: 'credito',      label: 'Crédito',       afectaCaja: false },
  transferencia:{ value: 'transferencia',label: 'Transferencia', afectaCaja: false },
  mercadopago:  { value: 'mercadopago',  label: 'Mercado Pago',  afectaCaja: false },
  cuenta_corriente: { value: 'cuenta_corriente', label: 'Cuenta corriente', afectaCaja: false },
};
export const PAYMENT_METHODS_LIST = Object.values(PAYMENT_METHODS);

// Canal de la venta
export const SALE_CHANNELS = {
  local: { value: 'local', label: 'Local',  badge: 'badge-muted'   },
  web:   { value: 'web',   label: 'Web',    badge: 'badge-success' },
};

// Estado de una compra
export const PURCHASE_STATUS = {
  pagada:    { value: 'pagada',    label: 'Pagada',    badge: 'badge-success' },
  pendiente: { value: 'pendiente', label: 'Pendiente', badge: 'badge-warning' },
};
export const PURCHASE_STATUS_LIST = Object.values(PURCHASE_STATUS);

// Tipos de cliente
export const CUSTOMER_TYPES = {
  minorista: { value: 'minorista', label: 'Minorista' },
  mayorista: { value: 'mayorista', label: 'Mayorista' },
};
export const CUSTOMER_TYPES_LIST = Object.values(CUSTOMER_TYPES);

// Estados de un carrito abandonado
export const ABANDONED_STATUS = {
  abierto:    { value: 'abierto',    label: 'Abandonado', badge: 'badge-warning' },
  contactado: { value: 'contactado', label: 'Contactado', badge: 'badge-muted'   },
  recuperado: { value: 'recuperado', label: 'Recuperado', badge: 'badge-success' },
  descartado: { value: 'descartado', label: 'Descartado', badge: 'badge-danger'  },
};
export const ABANDONED_STATUS_LIST = Object.values(ABANDONED_STATUS);

// Tipos de movimiento de caja
export const CASH_TYPES = {
  venta:   { value: 'venta',   label: 'Venta',   signo: 1 },
  ingreso: { value: 'ingreso', label: 'Ingreso', signo: 1 },
  compra:  { value: 'compra',  label: 'Compra',  signo: -1 },
  egreso:  { value: 'egreso',  label: 'Egreso',  signo: -1 },
};
