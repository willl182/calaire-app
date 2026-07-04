import { Resend } from 'resend'
import { env } from '@/env'

type MailDelivery =
  | { status: 'sent'; provider: 'resend'; id: string | null }
  | { status: 'failed'; provider: 'resend'; reason: string }
  | { status: 'skipped'; reason: 'missing_resend_api_key' | 'missing_mail_from' }

let _resend: Resend | null | undefined

function getResend(): Resend | null {
  if (_resend === undefined) {
    const apiKey = env.RESEND_API_KEY
    _resend = apiKey ? new Resend(apiKey) : null
  }
  return _resend
}

function getMailFrom(): string | undefined {
  return env.MAIL_FROM ?? undefined
}

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
  const resend = getResend()
  if (!resend) {
    return { status: 'skipped', reason: 'missing_resend_api_key' }
  }
  const mailFrom = getMailFrom()
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
