import { NextResponse } from 'next/server'
import { executeAgentRoute } from '@/lib/agent-router'

export const dynamic = 'force-dynamic'

function extractApiKey(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? ''
  const match = auth.match(/^Bearer (.+)$/i)
  return match ? match[1] : null
}

async function handle(req: Request, method: string) {
  const apiKey = extractApiKey(req)
  if (!apiKey) {
    return NextResponse.json({ error: 'unauthorized', message: 'Authorization: Bearer <api_key> requerido' }, { status: 401 })
  }

  const url = new URL(req.url)
  const pathSegments = url.pathname.replace('/agent/v1/', '').split('/').filter(Boolean)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  let body: unknown = queryParams
  if (method !== 'GET') {
    try {
      body = await req.json()
    } catch {
      body = queryParams
    }
  }

  const { status, data } = await executeAgentRoute(method, pathSegments, apiKey, body)
  return NextResponse.json(data, { status })
}

export async function GET(req: Request) {
  return handle(req, 'GET')
}

export async function POST(req: Request) {
  return handle(req, 'POST')
}

export async function PATCH(req: Request) {
  return handle(req, 'PATCH')
}

export async function DELETE(req: Request) {
  return handle(req, 'DELETE')
}
