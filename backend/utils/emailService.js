const RESEND_API_URL = 'https://api.resend.com/emails';

function getPublicUrl() {
  const fallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const configuredUrl = process.env.APP_PUBLIC_URL || fallbackUrl.split(',')[0];

  return configuredUrl.trim().replace(/\/$/, '');
}

function assertEmailConfig() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error('Faltan RESEND_API_KEY o EMAIL_FROM para enviar correos');
  }
}

function buildBaseTemplate({ title, intro, actionLabel, actionUrl, outro }) {
  return `
    <div style="margin:0;padding:0;background:#f8f6f2;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
      <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
        <div style="background:#fffdf9;border:1px solid rgba(176,141,70,.28);border-radius:24px;padding:32px;box-shadow:0 18px 45px rgba(52,40,17,.08);">
          <p style="margin:0 0 8px;color:#c8a96a;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Derecho y Sociedad</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#1a1a1a;">${title}</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#655e54;">${intro}</p>
          <a href="${actionUrl}" style="display:inline-block;background:#c8a96a;color:#ffffff;text-decoration:none;font-weight:700;border-radius:14px;padding:14px 22px;">${actionLabel}</a>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#8e867a;">${outro}</p>
          <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#8e867a;">Si el boton no funciona, copia y pega este enlace en tu navegador:<br><span style="word-break:break-all;">${actionUrl}</span></p>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html }) {
  assertEmailConfig();

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
      html
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(errorBody || 'No se pudo enviar el correo');
  }
}

async function sendVerificationEmail(email, token) {
  const actionUrl = `${getPublicUrl()}/verificar-correo?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verifica tu cuenta',
    html: buildBaseTemplate({
      title: 'Verifica tu cuenta',
      intro:
        'Recibimos una solicitud para crear tu cuenta. Confirma tu correo para poder iniciar sesion y acceder al sistema.',
      actionLabel: 'Verificar correo',
      actionUrl,
      outro: 'Este enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.'
    })
  });
}

async function sendPasswordResetEmail(email, token) {
  const actionUrl = `${getPublicUrl()}/restablecer-contrasenna?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Restablece tu contrasena',
    html: buildBaseTemplate({
      title: 'Restablece tu contrasena',
      intro:
        'Recibimos una solicitud para cambiar la contrasena de tu cuenta. Usa el siguiente boton para crear una nueva contrasena.',
      actionLabel: 'Crear nueva contrasena',
      actionUrl,
      outro: 'Este enlace vence en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.'
    })
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
