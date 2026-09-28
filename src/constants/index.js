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
