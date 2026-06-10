import { Resend } from 'resend'

type MailDelivery =
  | { status: 'sent'; provider: 'resend'; id: string | null }
  | { status: 'failed'; provider: 'resend'; reason: string }
  | { status: 'skipped'; reason: 'missing_resend_api_key' | 'missing_mail_from' }

const resendApiKey = process.env.RESEND_API_KEY
const mailFrom = process.env.MAIL_FROM
const resend = resendApiKey ? new Resend(resendApiKey) : null

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendAgentClaimEmail(args: {
  to: string
  claimViewUrl: string
  expiresInMinutes: number
}): Promise<MailDelivery> {
  if (!resend) {
    return { status: 'skipped', reason: 'missing_resend_api_key' }
  }
  if (!mailFrom) {
    return { status: 'skipped', reason: 'missing_mail_from' }
  }

  const safeUrl = escapeHtml(args.claimViewUrl)
  const safeMinutes = escapeHtml(String(args.expiresInMinutes))

  const result = await resend.emails.send({
    from: mailFrom,
    to: args.to,
    subject: 'CALAIRE APP: verificacion de agente',
    text: [
      'Se solicito una verificacion de agente para CALAIRE APP.',
      '',
      `Abre este enlace para iniciar sesion y ver el codigo OTP: ${args.claimViewUrl}`,
      '',
      `El enlace vence en ${args.expiresInMinutes} minutos.`,
      'Si no solicitaste este acceso, ignora este mensaje.',
    ].join('\n'),
    html: [
      '<p>Se solicito una verificacion de agente para CALAIRE APP.</p>',
      `<p><a href="${safeUrl}">Abrir verificacion</a></p>`,
      `<p>El enlace vence en ${safeMinutes} minutos.</p>`,
      '<p>Si no solicitaste este acceso, ignora este mensaje.</p>',
    ].join(''),
  })

  if (result.error) {
    return { status: 'failed', provider: 'resend', reason: result.error.message }
  }

  return { status: 'sent', provider: 'resend', id: result.data?.id ?? null }
}
