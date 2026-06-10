import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    {
      resource: 'https://calaire.app',
      authorization_servers: ['https://calaire.app'],
      scopes_supported: ['calaire.agent.me'],
      agent_auth: {
        supported_types: ['identity_assertion'],
        assertion_types: ['verified_email'],
        claim_endpoint: '/agent/auth',
        claim_completion_endpoint: '/agent/auth/claim/complete',
      },
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
