import { NextResponse } from 'next/server'
import { completeClaim, getClaimByToken, hashValue } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const claimToken = typeof body?.claim_token === 'string' ? body.claim_token : ''
  const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''
  if (!claimToken || !otp) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 422 })
  }

  const claim = await getClaimByToken(claimToken)
  if (!claim) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (claim.status !== 'pending' || claim.claimExpiresAt < Date.now()) {
    return NextResponse.json({ error: 'conflict' }, { status: 409 })
  }
  if (claim.otpExpiresAt == null || claim.otpHash == null) {
    return NextResponse.json({ error: 'otp_not_ready' }, { status: 409 })
  }
  if (claim.otpExpiresAt < Date.now()) {
    return NextResponse.json({ error: 'otp_expired' }, { status: 422 })
  }
  if (hashValue(otp) !== claim.otpHash) {
    return NextResponse.json({ error: 'invalid_otp' }, { status: 422 })
  }

  const { apiKey, apiKeyExpiresAt } = await completeClaim(claim._id)
  return NextResponse.json({
    api_key: apiKey,
    token_type: 'Bearer',
    expires_in: Math.floor((apiKeyExpiresAt - Date.now()) / 1000),
    scopes: claim.scopes,
  })
}
