// src/constants/index.js

// Estados posibles de un producto
export const PRODUCT_STATUS = {
  activo:    { value: 'activo',    label: 'Activo',    badge: 'badge-success' },
  pausado:   { value: 'pausado',   label: 'Pausado',   badge: 'badge-warning' },
  sin_stock: { value: 'sin_stock', label: 'Sin stock', badge: 'badge-danger'  },
  borrador:  { value: 'borrador',  label: 'Borrador',  badge: 'badge-muted'   },
};

export const PRODUCT_STATUS_LIST = Object.values(PRODUCT_STATUS);

// Estados del seguimiento de pedidos
export const ORDER_STATUS = {
  pendiente:  { value: 'pendiente',  label: 'Pendiente',  badge: 'badge-warning' },
  pagado:     { value: 'pagado',     label: 'Pagado',     badge: 'badge-success' },
  preparando: { value: 'preparando', label: 'Preparando', badge: 'badge-muted'   },
  enviado:    { value: 'enviado',    label: 'Enviado',    badge: 'badge-muted'   },
  entregado:  { value: 'entregado',  label: 'Entregado',  badge: 'badge-success' },
  cancelado:  { value: 'cancelado',  label: 'Cancelado',  badge: 'badge-danger'  },
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

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

// Tipos de movimiento de caja
export const CASH_TYPES = {
  venta:   { value: 'venta',   label: 'Venta',   signo: 1 },
  ingreso: { value: 'ingreso', label: 'Ingreso', signo: 1 },
  compra:  { value: 'compra',  label: 'Compra',  signo: -1 },
  egreso:  { value: 'egreso',  label: 'Egreso',  signo: -1 },
};
