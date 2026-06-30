import { NextResponse } from 'next/server'
import { getApiKeyRecord } from '@/server/auth/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const match = auth.match(/^Bearer (.+)$/i)
  if (!match) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const record = await getApiKeyRecord(match[1])
  if (!record || record.revokedAt || record.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    email: record.email,
    scopes: record.scopes,
    expires_at: record.expiresAt,
  })
}
