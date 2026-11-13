// functions/index.js
// Puente seguro entre la tienda (Papel & Fiesta) y el POS/inventario del local.
//
// Lee los productos del proyecto del POS con el Admin SDK (del lado servidor),
// NUNCA devuelve el precio de costo, y solo responde a usuarios admin de la tienda.

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineString, defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { sendEmail } from './lib/brevo.js';
import { cotizar as cotizarCorreo } from './lib/correoArgentino.js';
import {
  welcomeEmail, verifyEmail, passwordResetEmail,
  emailChangedEmail, orderReceivedEmail, orderStatusEmail, adminNewOrderEmail,
} from './lib/emails.js';

// ── Parámetros de configuración (se definen al desplegar) ──────────────────
// projectId del POS y nombre de la colección de productos en el POS.
const POS_PROJECT_ID = defineString('POS_PROJECT_ID', { default: '' });
const POS_COLLECTION = defineString('POS_COLLECTION', { default: 'productos' });

// ── Emails transaccionales (Brevo) ─────────────────────────────────────────
// Secret: se carga con `firebase functions:secrets:set BREVO_API_KEY`.
const BREVO_API_KEY = defineSecret('BREVO_API_KEY');
// Remitente (debe estar verificado en Brevo) y datos del sitio / admin.
const BREVO_SENDER_EMAIL = defineString('BREVO_SENDER_EMAIL');
const BREVO_SENDER_NAME = defineString('BREVO_SENDER_NAME', { default: 'Papel & Fiesta' });
const ADMIN_NOTIFY_EMAIL = defineString('ADMIN_NOTIFY_EMAIL', { default: '' });
const SITE_URL = defineString('SITE_URL', { default: '' });

// Estados de pedido que SÍ disparan email al cliente (coma-separados).
// Por defecto, solo los relevantes: evitamos spamear al cliente en cada paso.
const NOTIFY_ESTADOS = defineString('NOTIFY_ESTADOS', {
  default: 'confirmado,pagado,enviado,entregado,cancelado',
});

// Datos de transferencia (se incluyen en el mail de "Confirmado — a pagar").
const TRANSFER_TITULAR = defineString('TRANSFER_TITULAR', { default: '' });
const TRANSFER_BANCO = defineString('TRANSFER_BANCO', { default: '' });
const TRANSFER_CBU = defineString('TRANSFER_CBU', { default: '' });
const TRANSFER_ALIAS = defineString('TRANSFER_ALIAS', { default: '' });
const transferenciaHtml = () => [
  TRANSFER_TITULAR.value() && `Titular: ${TRANSFER_TITULAR.value()}`,
  TRANSFER_BANCO.value() && `Banco: ${TRANSFER_BANCO.value()}`,
  TRANSFER_CBU.value() && `CBU: ${TRANSFER_CBU.value()}`,
  TRANSFER_ALIAS.value() && `Alias: ${TRANSFER_ALIAS.value()}`,
].filter(Boolean).join('<br/>');

// ── Envíos (Mi Correo Argentino) ───────────────────────────────────────────
const CA_ENV = defineString('CA_ENV', { default: 'prod' }); // 'test' | 'prod'
const CA_USER_TOKEN = defineSecret('CA_USER_TOKEN');
const CA_PASSWORD_TOKEN = defineSecret('CA_PASSWORD_TOKEN');
const CA_EMAIL = defineSecret('CA_EMAIL');
const CA_PASSWORD = defineSecret('CA_PASSWORD');
const CA_CP_ORIGEN = defineString('CA_CP_ORIGEN', { default: '' });        // CP del local
const ENVIO_PESO_ESTANDAR_G = defineString('ENVIO_PESO_ESTANDAR_G', { default: '500' });
// Fallback (cuando no hay credenciales o falla la API): base + por kg, con factor por zona.
const ENVIO_FALLBACK_BASE = defineString('ENVIO_FALLBACK_BASE', { default: '2500' });
const ENVIO_FALLBACK_POR_KG = defineString('ENVIO_FALLBACK_POR_KG', { default: '1200' });

const REGION = 'southamerica-east1';

// Factor de zona aproximado por el primer dígito del CP numérico.
const ZONA_FACTOR = { 1: 1.0, 2: 1.3, 3: 1.5, 4: 1.6, 5: 1.5, 6: 1.4, 7: 1.5, 8: 1.8, 9: 2.1, 0: 1.3 };
function estimarFallback(cpDestino, pesoGramos, cantidad) {
  const base = Number(ENVIO_FALLBACK_BASE.value()) || 2500;
  const porKg = Number(ENVIO_FALLBACK_POR_KG.value()) || 1200;
  const kg = Math.max(0.5, ((pesoGramos || 500) * (cantidad || 1)) / 1000);
  const dig = (String(cpDestino).match(/\d/) || ['1'])[0];
  const factor = ZONA_FACTOR[dig] ?? 1.5;
  const precio = Math.round((base + porKg * kg) * factor);
  return { estimado: true, rates: [{ deliveredType: 'D', productType: 'EST', productName: 'Envío estimado a domicilio', price: precio }] };
}

// Redirige al sitio después de la acción (reset/verificación), si está seteado.
const actionSettings = () => (siteUrl() ? { url: siteUrl(), handleCodeInApp: false } : undefined);

const sender = () => ({ email: BREVO_SENDER_EMAIL.value(), name: BREVO_SENDER_NAME.value() });
const siteUrl = () => SITE_URL.value() || '';

// Envía un email y nunca tira el error hacia arriba (no debe romper el trigger).
async function enviar({ to, subject, html }) {
  try {
    if (!BREVO_SENDER_EMAIL.value()) { logger.warn('BREVO_SENDER_EMAIL sin configurar; no se envía.'); return; }
    await sendEmail({ apiKey: BREVO_API_KEY.value(), sender: sender(), to, subject, html });
  } catch (err) {
    logger.error('Error enviando email por Brevo:', err.message);
  }
}

// App por defecto = proyecto de la TIENDA (usa las credenciales del runtime).
const tiendaApp = initializeApp();
const tiendaDb = getFirestore(tiendaApp);

// Segunda app = proyecto del POS. El service account del runtime de la tienda
// debe tener el rol "Cloud Datastore Viewer" (datastore.viewer) en el proyecto
// del POS para poder leer su Firestore (permiso cruzado por IAM, sin claves).
let posDb = null;
function getPosDb() {
  if (posDb) return posDb;
  const posApp = initializeApp(
    { projectId: POS_PROJECT_ID.value(), credential: applicationDefault() },
    'pos'
  );
  posDb = getFirestore(posApp);
  return posDb;
}

// ── Mapeo de un documento del POS a la forma que consume la tienda ─────────
// ⚠️ AJUSTAR los nombres de campos a los reales del POS.
// (Pasame un documento de ejemplo y lo dejo exacto.)
function mapPosDoc(id, d) {
  return {
    productoId: id,
    nombre:      d.nombre ?? d.descripcion ?? d.titulo ?? '(sin nombre)',
    // precio de venta del local (se usa como sugerencia; el precio web se edita aparte)
    precioLocal: Number(d.precioVenta ?? d.precio ?? d.precioLista ?? 0),
    stockLocal:  Number(d.stock ?? d.cantidad ?? d.existencia ?? 0),
    categoria:   d.categoria ?? d.rubro ?? null,
    imagen:      d.imagen ?? d.foto ?? d.urlImagen ?? null,
    // 🔒 NUNCA incluir precio de costo ni datos sensibles del POS.
  };
}

async function assertAdmin(auth) {
  if (!auth) throw new HttpsError('unauthenticated', 'Necesitás iniciar sesión.');
  const snap = await tiendaDb.doc(`usuarios/${auth.uid}`).get();
  if (!snap.exists || snap.data().rol !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo administradores pueden importar.');
  }
}

// ── Listar productos del POS para la pantalla de importación ───────────────
export const listPosProducts = onCall({ region: REGION }, async (request) => {
  await assertAdmin(request.auth);

  const search = String(request.data?.search || '').trim().toLowerCase();
  const snap = await getPosDb().collection(POS_COLLECTION.value()).get();

  let items = snap.docs.map((doc) => mapPosDoc(doc.id, doc.data()));
  if (search) items = items.filter((p) => p.nombre.toLowerCase().includes(search));
  items.sort((a, b) => a.nombre.localeCompare(b.nombre));

  return { items, total: items.length };
});

// ── Trigger: alta de usuario → email de bienvenida ─────────────────────────
export const onUsuarioCreado = onDocumentCreated(
  { document: 'usuarios/{uid}', region: REGION, secrets: [BREVO_API_KEY] },
  async (event) => {
    const u = event.data?.data();
    if (!u?.email) return;
    // Intentamos incluir el link de verificación en el mismo email de bienvenida.
    let verifyLink;
    try {
      verifyLink = await getAuth(tiendaApp).generateEmailVerificationLink(u.email, actionSettings());
    } catch (err) {
      logger.warn('No se pudo generar link de verificación:', err.message);
    }
    const { subject, html } = welcomeEmail({ nombre: u.nombre, siteUrl: siteUrl(), verifyLink });
    await enviar({ to: [{ email: u.email, name: u.nombre || undefined }], subject, html });
  }
);

// ── Callable: enviar email de verificación (reenvío) ───────────────────────
export const enviarVerificacion = onCall(
  { region: REGION, secrets: [BREVO_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Necesitás iniciar sesión.');
    const { uid } = request.auth;
    const userRec = await getAuth(tiendaApp).getUser(uid);
    if (!userRec.email) throw new HttpsError('failed-precondition', 'Tu cuenta no tiene email.');
    if (userRec.emailVerified) return { ok: true, yaVerificado: true };
    const link = await getAuth(tiendaApp).generateEmailVerificationLink(userRec.email, actionSettings());
    const { subject, html } = verifyEmail({ nombre: userRec.displayName, link, siteUrl: siteUrl() });
    await enviar({ to: [{ email: userRec.email, name: userRec.displayName || undefined }], subject, html });
    return { ok: true };
  }
);

// ── Callable: enviar email de reseteo de contraseña ────────────────────────
// Público (como el reset estándar). No revela si el email existe o no.
export const enviarResetPassword = onCall(
  { region: REGION, secrets: [BREVO_API_KEY] },
  async (request) => {
    const email = String(request.data?.email || '').trim().toLowerCase();
    if (!email) throw new HttpsError('invalid-argument', 'Falta el email.');
    try {
      const userRec = await getAuth(tiendaApp).getUserByEmail(email);
      const link = await getAuth(tiendaApp).generatePasswordResetLink(email, actionSettings());
      const { subject, html } = passwordResetEmail({ nombre: userRec.displayName, link, siteUrl: siteUrl() });
      await enviar({ to: [{ email, name: userRec.displayName || undefined }], subject, html });
    } catch (err) {
      // No filtramos si el email existe: respondemos ok igual.
      logger.info('Reset solicitado para email no registrado o error:', err.message);
    }
    return { ok: true };
  }
);

// ── Trigger: cambio de email → aviso al correo nuevo y al anterior ──────────
export const onUsuarioActualizado = onDocumentUpdated(
  { document: 'usuarios/{uid}', region: REGION, secrets: [BREVO_API_KEY] },
  async (event) => {
    const antes = event.data?.before?.data();
    const despues = event.data?.after?.data();
    if (!antes || !despues) return;
    if (antes.email && despues.email && antes.email !== despues.email) {
      // Aviso al correo nuevo (confirmación).
      const nuevo = emailChangedEmail({ nombre: despues.nombre, emailNuevo: despues.email, aviso: 'nuevo', siteUrl: siteUrl() });
      await enviar({ to: [{ email: despues.email, name: despues.nombre || undefined }], subject: nuevo.subject, html: nuevo.html });
      // Aviso al correo anterior (seguridad).
      const viejo = emailChangedEmail({ nombre: despues.nombre, emailNuevo: despues.email, aviso: 'viejo', siteUrl: siteUrl() });
      await enviar({ to: [{ email: antes.email }], subject: viejo.subject, html: viejo.html });
    }
  }
);

// ── Trigger: nuevo pedido → confirmación al cliente + aviso al admin ────────
export const onPedidoCreado = onDocumentCreated(
  { document: 'pedidos/{id}', region: REGION, secrets: [BREVO_API_KEY] },
  async (event) => {
    const d = event.data?.data();
    if (!d) return;
    const orden = { id: event.params.id, ...d };
    if (orden.email) {
      const { subject, html } = orderReceivedEmail({ nombre: orden.cliente, orden, siteUrl: siteUrl() });
      await enviar({ to: [{ email: orden.email, name: orden.cliente || undefined }], subject, html });
    }
    const adminMail = ADMIN_NOTIFY_EMAIL.value();
    if (adminMail) {
      const { subject, html } = adminNewOrderEmail({ orden, siteUrl: siteUrl() });
      await enviar({ to: [{ email: adminMail }], subject, html });
    }
  }
);

// ── Trigger: cambio de estado del pedido → email al cliente ─────────────────
export const onPedidoEstadoCambiado = onDocumentUpdated(
  { document: 'pedidos/{id}', region: REGION, secrets: [BREVO_API_KEY] },
  async (event) => {
    const antes = event.data?.before?.data();
    const despues = event.data?.after?.data();
    if (!antes || !despues) return;
    if (antes.estado !== despues.estado && despues.email) {
      const permitidos = NOTIFY_ESTADOS.value().split(',').map((s) => s.trim()).filter(Boolean);
      if (!permitidos.includes(despues.estado)) return; // estado silenciado
      const orden = { id: event.params.id, ...despues };
      const { subject, html } = orderStatusEmail({ nombre: orden.cliente, orden, estado: despues.estado, siteUrl: siteUrl(), transferencia: transferenciaHtml() });
      await enviar({ to: [{ email: orden.email, name: orden.cliente || undefined }], subject, html });
    }
  }
);

// ── Callable: cotizar envío (Correo Argentino, con fallback estimado) ───────
export const cotizarEnvio = onCall(
  { region: REGION, secrets: [CA_USER_TOKEN, CA_PASSWORD_TOKEN, CA_EMAIL, CA_PASSWORD] },
  async (request) => {
    const cpDestino = String(request.data?.cpDestino || '').trim();
    const cantidad = Number(request.data?.cantidad) || 1;
    const pesoGramos = (Number(request.data?.pesoGramos) || Number(ENVIO_PESO_ESTANDAR_G.value()) || 500);
    if (!cpDestino) throw new HttpsError('invalid-argument', 'Falta el código postal de destino.');

    const cpOrigen = CA_CP_ORIGEN.value();
    const hayCreds = CA_USER_TOKEN.value() && CA_PASSWORD_TOKEN.value() && CA_EMAIL.value() && CA_PASSWORD.value() && cpOrigen;

    if (!hayCreds) {
      return estimarFallback(cpDestino, pesoGramos, cantidad);
    }
    try {
      const cfg = {
        env: CA_ENV.value(),
        userToken: CA_USER_TOKEN.value(), passwordToken: CA_PASSWORD_TOKEN.value(),
        email: CA_EMAIL.value(), password: CA_PASSWORD.value(),
      };
      const r = await cotizarCorreo(cfg, { cpOrigen, cpDestino, pesoGramos, cantidad });
      return { estimado: false, rates: r.rates || [], validTo: r.validTo || null };
    } catch (err) {
      logger.error('Cotización Correo falló, uso fallback:', err.message);
      return estimarFallback(cpDestino, pesoGramos, cantidad);
    }
  }
);
