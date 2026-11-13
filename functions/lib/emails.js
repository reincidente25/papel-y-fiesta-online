// functions/lib/emails.js
// Plantillas HTML de los emails transaccionales, con los colores de la marca.
// Cada función devuelve { subject, html } listo para enviar por Brevo.

const BRAND = {
  orange: '#F7941E',
  ink: '#2B2B2B',
  bg: '#F4F4F1',
  muted: '#8A8A8A',
};

const money = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n) || 0);

// Reemplaza variables {clave} con sus valores.
const fill = (t, vars = {}) => String(t == null ? '' : t).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
// Texto del admin → HTML (variables + saltos de línea).
const htmlText = (t, vars = {}) => fill(t, vars).replace(/\n/g, '<br/>');

// Estados de pedido → texto para el cliente (espejo de src/constants ORDER_STATUS).
const ESTADOS = {
  pendiente:      { label: 'Pedido recibido',       desc: 'Estamos verificando la disponibilidad de stock.' },
  confirmado:     { label: 'Confirmado — a pagar',  desc: 'Confirmamos el stock. Ya podés abonar por transferencia; te pasamos los datos.' },
  pago_informado: { label: 'Pago informado',        desc: 'Recibimos tu aviso de pago. Lo estamos verificando.' },
  pagado:         { label: 'Pago confirmado',       desc: '¡Confirmamos tu pago! Empezamos a preparar tu pedido.' },
  preparando:     { label: 'En preparación',        desc: 'Estamos preparando tu pedido.' },
  enviado:        { label: 'Enviado / listo',       desc: 'Tu pedido fue despachado o está listo para retirar.' },
  entregado:      { label: '¡Entregado!',           desc: '¡Gracias por tu compra! Esperamos que lo disfrutes.' },
  cancelado:      { label: 'Pedido cancelado',      desc: 'Tu pedido fue cancelado. Ante cualquier duda, respondé este correo.' },
};

// Layout común. `cta` es opcional: { url, label }.
function layout({ titulo, cuerpo, cta, siteUrl }) {
  const boton = cta
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${cta.url}" style="display:inline-block;background:${BRAND.orange};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:15px;">${cta.label}</a>
       </td></tr>`
    : '';
  return `<!doctype html><html lang="es"><body style="margin:0;background:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.06);">
        <tr><td style="padding:22px 28px;border-bottom:1px solid #eee;">
          <span style="font-size:20px;font-weight:800;color:${BRAND.ink};">Papel</span><span style="font-size:20px;font-weight:800;color:${BRAND.orange};">&amp;</span><span style="font-size:20px;font-weight:800;color:${BRAND.ink};">Fiesta</span>
        </td></tr>
        <tr><td style="padding:26px 28px 8px;">
          <h1 style="margin:0 0 10px;font-size:22px;">${titulo}</h1>
          <div style="font-size:15px;line-height:1.55;color:#444;">${cuerpo}</div>
        </td></tr>
        <tr><td style="padding:12px 28px 26px;">
          <table role="presentation" cellpadding="0" cellspacing="0">${boton}</table>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #eee;font-size:12px;color:${BRAND.muted};">
          Papel &amp; Fiesta · Librería y cotillón${siteUrl ? ` · <a href="${siteUrl}" style="color:${BRAND.muted};">${siteUrl.replace(/^https?:\/\//, '')}</a>` : ''}<br/>
          Este es un correo automático, podés responderlo si necesitás ayuda.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export function welcomeEmail({ nombre, siteUrl, verifyLink, o = {} }) {
  const cuerpoVerif = verifyLink
    ? `<br/><br/>Para empezar, confirmá tu email con el botón de abajo.`
    : '';
  const cuerpoBase = o.cuerpo
    ? htmlText(o.cuerpo, { nombre })
    : `Tu cuenta en <strong>Papel &amp; Fiesta</strong> ya está activa. Desde ahora podés hacer pedidos y seguir su estado en todo momento.`;
  return {
    subject: o.asunto ? fill(o.asunto, { nombre }) : '¡Bienvenido/a a Papel & Fiesta! 🎉',
    html: layout({
      siteUrl,
      titulo: `¡Hola${nombre ? ' ' + nombre : ''}! 👋`,
      cuerpo: `${cuerpoBase}${cuerpoVerif}<br/><br/>¡Gracias por sumarte!`,
      cta: verifyLink
        ? { url: verifyLink, label: 'Confirmar mi email' }
        : (siteUrl ? { url: `${siteUrl}/catalogo`, label: 'Ver el catálogo' } : null),
    }),
  };
}

export function verifyEmail({ nombre, link, siteUrl, o = {} }) {
  return {
    subject: o.asunto ? fill(o.asunto, { nombre }) : 'Confirmá tu email · Papel & Fiesta',
    html: layout({
      siteUrl,
      titulo: 'Confirmá tu email ✉️',
      cuerpo: o.cuerpo ? htmlText(o.cuerpo, { nombre }) : `Hola${nombre ? ' ' + nombre : ''}, hacé clic en el botón para verificar tu dirección de correo y activar todas las funciones de tu cuenta.<br/><br/>Si no creaste una cuenta en Papel &amp; Fiesta, ignorá este mensaje.`,
      cta: { url: link, label: 'Verificar mi email' },
    }),
  };
}

export function passwordResetEmail({ nombre, link, siteUrl, o = {} }) {
  return {
    subject: o.asunto ? fill(o.asunto, { nombre }) : 'Restablecé tu contraseña · Papel & Fiesta',
    html: layout({
      siteUrl,
      titulo: 'Restablecer contraseña 🔑',
      cuerpo: o.cuerpo ? htmlText(o.cuerpo, { nombre }) : `Hola${nombre ? ' ' + nombre : ''}, recibimos un pedido para restablecer la contraseña de tu cuenta. Hacé clic en el botón para elegir una nueva.<br/><br/>El enlace vence en 1 hora. Si no fuiste vos, ignorá este correo: tu contraseña no cambia.`,
      cta: { url: link, label: 'Crear nueva contraseña' },
    }),
  };
}

export function emailChangedEmail({ nombre, emailNuevo, aviso, siteUrl }) {
  // `aviso` = 'nuevo' (al correo nuevo) | 'viejo' (al correo anterior, por seguridad)
  if (aviso === 'viejo') {
    return {
      subject: 'Cambiaste el email de tu cuenta',
      html: layout({
        siteUrl,
        titulo: 'Tu email fue modificado',
        cuerpo: `Hola${nombre ? ' ' + nombre : ''}, te avisamos que el email de tu cuenta se cambió a <strong>${emailNuevo}</strong>.<br/><br/>Si <strong>no</strong> fuiste vos, respondé este correo cuanto antes para que lo revisemos.`,
      }),
    };
  }
  return {
    subject: 'Confirmamos el cambio de email',
    html: layout({
      siteUrl,
      titulo: 'Email actualizado ✅',
      cuerpo: `Hola${nombre ? ' ' + nombre : ''}, tu cuenta de <strong>Papel &amp; Fiesta</strong> ahora usa este correo (<strong>${emailNuevo}</strong>). Ya podés iniciar sesión con él.`,
    }),
  };
}

function itemsTabla(items = []) {
  if (!items.length) return '';
  const filas = items.map((i) => {
    const cant = i.cantidad || 1;
    const precio = i.precio ?? i.precioUnit ?? 0;
    const nombre = i.nombre || i.variante || 'Producto';
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${nombre}${i.variante && i.nombre !== i.variante ? ` <span style="color:${BRAND.muted};">(${i.variante})</span>` : ''} × ${cant}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;white-space:nowrap;">${money(precio * cant)}</td>
    </tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;">${filas}</table>`;
}

export function orderReceivedEmail({ nombre, orden, siteUrl, o = {} }) {
  const total = money(orden.total);
  const intro = o.cuerpo ? htmlText(o.cuerpo, { nombre, total }) : 'Ya lo registramos y estamos verificando el stock. Te avisaremos cuando esté confirmado.';
  return {
    subject: o.asunto ? fill(o.asunto, { nombre, total }) : '¡Recibimos tu pedido! 🧾',
    html: layout({
      siteUrl,
      titulo: `¡Gracias por tu pedido${nombre ? ', ' + nombre : ''}!`,
      cuerpo: `${intro}
        ${itemsTabla(orden.items)}
        <div style="font-size:16px;font-weight:800;margin-top:6px;">Total: ${total}</div>
        <div style="font-size:13px;color:${BRAND.muted};margin-top:6px;">El pago no se procesa en la web: te pasamos los datos para transferir cuando confirmemos el stock.</div>`,
      cta: siteUrl && orden.id ? { url: `${siteUrl}/pedido/${orden.id}`, label: 'Seguir mi pedido' } : null,
    }),
  };
}

export function orderStatusEmail({ nombre, orden, estado, siteUrl, transferencia, o = {} }) {
  const info = ESTADOS[estado] || { label: 'Actualización de tu pedido', desc: '' };
  const label = o.asunto ? fill(o.asunto, { nombre }) : info.label;
  const desc = o.cuerpo ? htmlText(o.cuerpo, { nombre }) : info.desc;
  // En "confirmado" se agregan los datos de transferencia, si están configurados.
  const bloqueTransfer = (estado === 'confirmado' && transferencia)
    ? `<div style="margin-top:16px;padding:14px 16px;background:${BRAND.bg};border-radius:12px;font-size:14px;line-height:1.7;">
         <strong>Datos para transferir:</strong><br/>${transferencia}
         <br/><br/><span style="color:${BRAND.muted};font-size:13px;">Cuando transfieras, envianos el comprobante.</span>
       </div>`
    : '';
  return {
    subject: `Tu pedido: ${label}`,
    html: layout({
      siteUrl,
      titulo: label,
      cuerpo: `Hola${nombre ? ' ' + nombre : ''}, tu pedido cambió de estado.<br/><br/>${desc}${bloqueTransfer}`,
      cta: siteUrl && orden.id ? { url: `${siteUrl}/pedido/${orden.id}`, label: 'Ver mi pedido' } : null,
    }),
  };
}

export function adminNewOrderEmail({ orden, siteUrl, o = {} }) {
  return {
    subject: o.asunto ? fill(o.asunto, { cliente: orden.cliente || '', total: money(orden.total) }) : `🛒 Nuevo pedido de ${orden.cliente || 'un cliente'} · ${money(orden.total)}`,
    html: layout({
      siteUrl,
      titulo: 'Nuevo pedido en la web',
      cuerpo: `<strong>Cliente:</strong> ${orden.cliente || '—'}<br/>
        <strong>Email:</strong> ${orden.email || '—'}<br/>
        <strong>Teléfono:</strong> ${orden.telefono || '—'}<br/>
        <strong>Entrega:</strong> ${orden.entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en el local'}${orden.entrega === 'envio' && orden.direccionTexto ? `<br/><strong>Domicilio:</strong> ${orden.direccionTexto}` : ''}
        ${itemsTabla(orden.items)}
        <div style="font-size:16px;font-weight:800;">Total: ${money(orden.total)}</div>
        ${orden.notas ? `<div style="font-size:13px;color:${BRAND.muted};margin-top:8px;">Notas: ${orden.notas}</div>` : ''}`,
      cta: siteUrl ? { url: `${siteUrl}/admin/pedidos`, label: 'Ver en el panel' } : null,
    }),
  };
}
