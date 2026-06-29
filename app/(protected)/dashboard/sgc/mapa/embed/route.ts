import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { canViewSgcMaestro, requireAuth } from '@/lib/auth'

const MAP_PATH = join(process.cwd(), 'data', 'sgc', 'mapa_navegacion_sgc_pea.html')

export async function GET() {
  const auth = await requireAuth()
  if (!auth.user || !canViewSgcMaestro(auth)) {
    return new Response('No autorizado', { status: 404 })
  }

  const html = await readFile(MAP_PATH, 'utf8')
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    },
  })
}
