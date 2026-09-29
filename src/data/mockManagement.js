// src/data/mockManagement.js
// Datos de ejemplo para la gestión del local (mockup).
// Arrays mutables en memoria: sirven de "base" mientras no hay backend.

export const MOCK_SUPPLIERS = [
  { id: 'prov-1', nombre: 'Distribuidora Papelera SA', contacto: 'Marcelo Ruiz', telefono: '+54 9 351 555-1010', email: 'ventas@papelera.com', cuit: '30-12345678-9', notas: 'Entrega los martes.' },
  { id: 'prov-2', nombre: 'Cotillón Mayorista El Globo', contacto: 'Ana Pérez', telefono: '+54 9 351 555-2020', email: 'pedidos@elglobo.com', cuit: '30-98765432-1', notas: '' },
  { id: 'prov-3', nombre: 'Arte & Color Insumos', contacto: 'Diego Sosa', telefono: '+54 9 351 555-3030', email: 'info@artecolor.com', cuit: '27-22222222-3', notas: 'Mínimo de compra $50.000.' },
];

export const MOCK_SALES = [
  { id: 'v-1001', fecha: '2026-09-28T14:20:00', canal: 'local', items: [{ nombre: 'Cuaderno A5 tapa dura', cantidad: 2, precioUnit: 6900 }], subtotal: 13800, descuento: 0, total: 13800, metodoPago: 'efectivo', cliente: '' },
  { id: 'v-1002', fecha: '2026-09-28T16:05:00', canal: 'web',   items: [{ nombre: 'Set 12 fibras', cantidad: 1, precioUnit: 9500 }], subtotal: 9500, descuento: 0, total: 9500, metodoPago: 'mercadopago', cliente: 'Laura G.' },
  { id: 'v-1003', fecha: '2026-09-29T10:12:00', canal: 'local', items: [{ nombre: 'Resma A4', cantidad: 3, precioUnit: 7200 }], subtotal: 21600, descuento: 600, total: 21000, metodoPago: 'debito', cliente: '' },
];

export const MOCK_PURCHASES = [
  { id: 'c-2001', proveedorId: 'prov-1', proveedorNombre: 'Distribuidora Papelera SA', fecha: '2026-09-25T09:00:00', items: [{ nombre: 'Resma A4', cantidad: 50, costoUnit: 4500 }], total: 225000, estado: 'pagada', metodoPago: 'transferencia' },
  { id: 'c-2002', proveedorId: 'prov-2', proveedorNombre: 'Cotillón Mayorista El Globo', fecha: '2026-09-27T11:30:00', items: [{ nombre: 'Kit cumpleaños', cantidad: 20, costoUnit: 5200 }], total: 104000, estado: 'pendiente', metodoPago: 'cuenta_corriente' },
];

export const MOCK_CASH_MOVEMENTS = [
  { id: 'm-1', fecha: '2026-09-29T09:00:00', tipo: 'ingreso', concepto: 'Apertura de caja', metodoPago: 'efectivo', monto: 20000 },
  { id: 'm-2', fecha: '2026-09-29T10:12:00', tipo: 'venta',   concepto: 'Venta #v-1003', metodoPago: 'debito', monto: 21000 },
  { id: 'm-3', fecha: '2026-09-29T12:40:00', tipo: 'egreso',  concepto: 'Pago flete', metodoPago: 'efectivo', monto: 3500 },
];

// Sesión de caja actual (mock)
export const MOCK_CASH_SESSION = {
  id: 'caja-1', estado: 'abierta', aperturaFecha: '2026-09-29T09:00:00', montoInicial: 20000, cierreFecha: null, montoFinal: null,
};
