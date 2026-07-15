import { requireAuth } from '@/server/auth'
import { getMyPtCertificateDownload, getRondaByCodigo } from '@/server/rondas'

export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  await requireAuth()
  const { codigo } = await params
  const ronda = await getRondaByCodigo(codigo)
  if (!ronda) return Response.json({ error: 'not_found' }, { status: 404 })
  const certificate = await getMyPtCertificateDownload(ronda.id)
  if (!certificate?.url) return Response.json({ error: 'not_available' }, { status: 404 })
  const upstream = await fetch(certificate.url)
  if (!upstream.ok) return Response.json({ error: 'storage_error' }, { status: 502 })
  return new Response(upstream.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${certificate.nombreArchivo}"` } })
}
