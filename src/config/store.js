// src/config/store.js
// Datos comerciales de la tienda (mock). Editables luego desde el panel.

export const STORE_INFO = {
  nombre: 'Papel & Fiesta',
  whatsapp: '+54 9 351 000-0000',
  email: 'hola@papelyfiesta.com',
};

// Datos para el pago por transferencia (se muestran al cliente una vez
// que el admin confirma el stock del pedido).
export const PAYMENT_INFO = {
  titular: 'Papel & Fiesta SRL',
  banco: 'Banco Ejemplo',
  cbu: '0000000000000000000000',
  alias: 'papel.fiesta.mp',
  cuit: '30-12345678-9',
  aclaracion: 'Enviá el comprobante por WhatsApp para agilizar la confirmación.',
};
