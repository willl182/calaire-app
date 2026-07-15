import { httpRouter } from 'convex/server'
import { ConvexError } from 'convex/values'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

const ERROR_STATUS: Record<string, number> = { unauthorized: 401, not_found: 404, conflict: 409, bad_request: 400 }

const http = httpRouter()

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

http.route({
  path: '/pt/scores', method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const authorization = request.headers.get('authorization') ?? ''
    if (!authorization.startsWith('Bearer ') || authorization.slice(7).trim().length < 16) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    let body: { rondaCodigo?: unknown; rows?: unknown }
    try { body = await request.json() } catch { return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }
    if (typeof body.rondaCodigo !== 'string' || !Array.isArray(body.rows)) return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
    try {
      const result = await ctx.runMutation(internal.pt.scores.importHttpDraft, { apiKeyHash: await sha256(authorization.slice(7).trim()), rondaCodigo: body.rondaCodigo, rows: body.rows })
      return Response.json(result, { status: result.ok ? 200 : 422 })
    } catch (error) {
      if (error instanceof ConvexError && typeof error.data === 'object' && error.data !== null) {
        const { code, message } = error.data as { code?: string; message?: string }
        return Response.json({ ok: false, error: message ?? 'import_failed' }, { status: ERROR_STATUS[code ?? ''] ?? 400 })
      }
      return Response.json({ ok: false, error: error instanceof Error ? error.message : 'import_failed' }, { status: 400 })
    }
  }),
})

export default http
