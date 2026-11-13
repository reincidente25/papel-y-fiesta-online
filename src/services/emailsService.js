// src/services/emailsService.js
// Configuración editable de los correos (config/emails).
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const COL = 'config';
const DOC = 'emails';

export async function getEmailsConfig() {
  if (!isFirebaseConfigured) return {};
  try {
    const snap = await getDoc(doc(db, COL, DOC));
    return snap.exists() ? (snap.data() || {}) : {};
  } catch {
    return {};
  }
}

export async function saveEmailsConfig(data) {
  if (isFirebaseConfigured) {
    await setDoc(doc(db, COL, DOC), { ...data, actualizadoEn: serverTimestamp() }, { merge: true });
  }
  return data;
}

// Catálogo de correos editables (defaults como placeholders).
export const EMAIL_CATALOG = [
  { grupo: 'Cuenta', items: [
    { code: 'bienvenida', nombre: 'Bienvenida (alta de usuario)', asunto: '¡Bienvenido/a a Papel & Fiesta! 🎉', cuerpo: 'Tu cuenta ya está activa. Desde ahora podés hacer pedidos y seguir su estado.', vars: ['{nombre}'] },
    { code: 'verificacion', nombre: 'Verificar email', asunto: 'Confirmá tu email · Papel & Fiesta', cuerpo: 'Hacé clic en el botón para verificar tu dirección de correo.', vars: ['{nombre}'] },
    { code: 'reset', nombre: 'Restablecer contraseña', asunto: 'Restablecé tu contraseña · Papel & Fiesta', cuerpo: 'Recibimos un pedido para restablecer tu contraseña. Hacé clic en el botón.', vars: ['{nombre}'] },
  ] },
  { grupo: 'Pedidos', items: [
    { code: 'pedidoRecibido', nombre: 'Pedido recibido (cliente)', asunto: '¡Recibimos tu pedido! 🧾', cuerpo: 'Ya lo registramos y estamos verificando el stock.', vars: ['{nombre}', '{total}'] },
    { code: 'avisoAdmin', nombre: 'Aviso de nuevo pedido (al admin)', asunto: '🛒 Nuevo pedido', cuerpo: '(el detalle del pedido se agrega automático)', vars: ['{cliente}', '{total}'], soloAsunto: true },
    { code: 'estado_confirmado', nombre: 'Estado: Confirmado — a pagar', asunto: 'Confirmado — a pagar', cuerpo: 'Confirmamos el stock. Ya podés abonar por transferencia; te pasamos los datos.', vars: ['{nombre}'] },
    { code: 'estado_pagado', nombre: 'Estado: Pago confirmado', asunto: 'Pago confirmado', cuerpo: '¡Confirmamos tu pago! Empezamos a preparar tu pedido.', vars: ['{nombre}'] },
    { code: 'estado_enviado', nombre: 'Estado: Enviado / listo', asunto: 'Enviado / listo', cuerpo: 'Tu pedido fue despachado o está listo para retirar.', vars: ['{nombre}'] },
    { code: 'estado_entregado', nombre: 'Estado: Entregado', asunto: '¡Entregado!', cuerpo: '¡Gracias por tu compra!', vars: ['{nombre}'] },
    { code: 'estado_cancelado', nombre: 'Estado: Cancelado', asunto: 'Pedido cancelado', cuerpo: 'Tu pedido fue cancelado. Ante cualquier duda, respondé este correo.', vars: ['{nombre}'] },
  ] },
];
