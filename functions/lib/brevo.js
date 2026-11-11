// functions/lib/brevo.js
// Cliente mínimo para enviar emails transaccionales con la API de Brevo.
// La API key se pasa como secret de Cloud Functions (BREVO_API_KEY); nunca
// se escribe en el código ni se loguea.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Envía un email transaccional por Brevo.
 * @param {object} opts
 * @param {string} opts.apiKey           API key de Brevo.
 * @param {{email:string,name?:string}} opts.sender  Remitente (debe estar verificado en Brevo).
 * @param {Array<{email:string,name?:string}>} opts.to  Destinatarios.
 * @param {string} opts.subject          Asunto.
 * @param {string} opts.html             Cuerpo HTML.
 * @param {{email:string,name?:string}} [opts.replyTo] Responder a (opcional).
 */
export async function sendEmail({ apiKey, sender, to, subject, html, replyTo }) {
  if (!apiKey) throw new Error('Falta BREVO_API_KEY');
  if (!sender?.email) throw new Error('Falta el remitente (sender.email)');
  if (!to?.length) throw new Error('Falta el destinatario (to)');

  const payload = {
    sender,
    to,
    subject,
    htmlContent: html,
    ...(replyTo ? { replyTo } : {}),
  };

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo respondió ${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}
