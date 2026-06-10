import { NextResponse } from 'next/server'
import { createAgentClaim } from '@/lib/agent-auth'
import { sendAgentClaimEmail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: 'missing_email' }, { status: 422 })
  }

  const claim = await createAgentClaim(email)
  let emailDelivery
  try {
    emailDelivery = await sendAgentClaimEmail({
      to: email,
      claimViewUrl: claim.claimViewUrl,
      expiresInMinutes: 60,
    })
  } catch (error) {
    emailDelivery = {
      status: 'failed',
      provider: 'resend',
      reason: error instanceof Error ? error.message : 'unknown_error',
    }
  }

  return NextResponse.json({
    claim_token: claim.claimToken,
    claim_view_url: claim.claimViewUrl,
    expires_in: 60 * 60,
    email_delivery: emailDelivery,
  })
}
