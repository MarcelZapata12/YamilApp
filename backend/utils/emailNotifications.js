const User = require('../models/User');

const RESEND_API_URL = 'https://api.resend.com/emails';

function getFrontendUrl() {
  const configuredUrl =
    process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

  return configuredUrl.split(',')[0].trim().replace(/\/$/, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEventDate(date) {
  return new Intl.DateTimeFormat('es-CR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

function buildPlainText(evento, eventUrl) {
  const description = evento.descripcion
    ? `\n\nDescripcion:\n${evento.descripcion}`
    : '';

  return [
    'Recordatorio importante',
    '',
    evento.titulo,
    `Fecha: ${formatEventDate(evento.fecha)}`,
    `Categoria: ${evento.tipo}`,
    description,
    '',
    `Ver calendario: ${eventUrl}`,
    '',
    'Puedes desactivar estos recordatorios desde el menu de tu cuenta.'
  ].join('\n');
}

function buildHtmlTemplate(evento, eventUrl) {
  const title = escapeHtml(evento.titulo);
  const description = evento.descripcion
    ? `<p style="margin:18px 0 0;color:#51483b;font-size:15px;line-height:1.7;">${escapeHtml(
        evento.descripcion
      )}</p>`
    : '';

  return `
  <div style="margin:0;padding:0;background:#f7f3ec;font-family:Arial,Helvetica,sans-serif;color:#1f1f1f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ec;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffdfa;border:1px solid #eadfcd;border-radius:24px;overflow:hidden;box-shadow:0 18px 48px rgba(75,60,35,0.12);">
            <tr>
              <td style="padding:34px 34px 20px;text-align:center;">
                <p style="margin:0 0 12px;color:#c8a96a;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">Recordatorio importante</p>
                <h1 style="margin:0;color:#171717;font-size:28px;line-height:1.2;">${title}</h1>
                <div style="width:72px;height:3px;background:#c8a96a;border-radius:999px;margin:18px auto 0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 34px;">
                <div style="background:#f7f3ec;border:1px solid #eadfcd;border-radius:18px;padding:22px;">
                  <p style="margin:0;color:#6a5e4e;font-size:14px;text-transform:uppercase;letter-spacing:0.12em;">Fecha</p>
                  <p style="margin:6px 0 0;color:#171717;font-size:20px;font-weight:700;">${escapeHtml(
                    formatEventDate(evento.fecha)
                  )}</p>
                  <p style="margin:18px 0 0;color:#6a5e4e;font-size:14px;text-transform:uppercase;letter-spacing:0.12em;">Categoria</p>
                  <p style="margin:6px 0 0;color:#171717;font-size:17px;font-weight:700;">${escapeHtml(
                    evento.tipo
                  )}</p>
                  ${description}
                </div>

                <div style="text-align:center;margin-top:28px;">
                  <a href="${escapeHtml(eventUrl)}" style="display:inline-block;background:#c8a96a;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:13px 24px;">Ver calendario</a>
                </div>

                <p style="margin:26px 0 0;color:#7b7164;font-size:12px;line-height:1.6;text-align:center;">
                  Recibes este correo porque tienes activos los recordatorios de eventos importantes.
                  Puedes desactivarlos desde el menu de tu cuenta.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn(
      'Recordatorio importante omitido: faltan RESEND_API_KEY o EMAIL_FROM'
    );
    return { skipped: true };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`No se pudo enviar correo (${response.status}): ${errorText}`);
  }

  return response.json().catch(() => ({ ok: true }));
}

async function notifyImportantEvent(evento) {
  if (!evento?.importante) {
    return;
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn(
      'Recordatorio importante omitido: faltan RESEND_API_KEY o EMAIL_FROM'
    );
    return;
  }

  const users = await User.find({
    email: { $exists: true, $ne: '' },
    receiveEventReminders: { $ne: false }
  }).select('email');

  if (!users.length) {
    console.warn(
      'Recordatorio importante omitido: no hay usuarios con recordatorios activos'
    );
    return;
  }

  const eventUrl = `${getFrontendUrl()}/calendario`;
  const subject = `Recordatorio importante: ${evento.titulo}`;
  const html = buildHtmlTemplate(evento, eventUrl);
  const text = buildPlainText(evento, eventUrl);
  const results = await Promise.allSettled(
    users.map((user) =>
      sendEmail({
        to: user.email,
        subject,
        html,
        text
      })
    )
  );
  const failed = results.filter((result) => result.status === 'rejected');

  if (failed.length) {
    console.error(
      `No se pudieron enviar ${failed.length} recordatorio(s) de evento importante`
    );

    failed.slice(0, 3).forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Detalle de error de Resend #${index + 1}:`,
          result.reason instanceof Error ? result.reason.message : result.reason
        );
      }
    });
  } else {
    console.log(
      `Recordatorio importante enviado a ${users.length} usuario(s)`
    );
  }
}

module.exports = {
  notifyImportantEvent
};
