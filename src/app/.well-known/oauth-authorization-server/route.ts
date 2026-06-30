import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    {
      issuer: 'https://calaire.app',
      authorization_endpoint: 'https://calaire.app/login',
      token_endpoint: 'https://calaire.app/agent/auth/claim/complete',
      response_types_supported: ['code'],
      grant_types_supported: ['urn:ietf:params:oauth:grant-type:token-exchange'],
      agent_auth: {
        supported_types: ['identity_assertion'],
        assertion_types: ['verified_email'],
      },
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
