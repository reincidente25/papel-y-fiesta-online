// src/config/tienda.js
// Datos de la tienda editables por código (antes del deploy).

// Datos para transferencia que se incluyen en el mensaje de WhatsApp al validar.
export const DATOS_TRANSFERENCIA = {
  titular: 'Papel & Fiesta',
  banco: '',
  cbu: '',
  alias: '',
};

// Texto armado con los datos de transferencia (omite los vacíos).
export const transferenciaTexto = () => {
  const d = DATOS_TRANSFERENCIA;
  return [
    d.titular && `Titular: ${d.titular}`,
    d.banco && `Banco: ${d.banco}`,
    d.cbu && `CBU: ${d.cbu}`,
    d.alias && `Alias: ${d.alias}`,
  ].filter(Boolean).join('\n');
};
