import { getMyPtReport, getRondaByCodigo } from '@/server/rondas'
import { requireAuth } from '@/server/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  await requireAuth()
  const { codigo } = await params
  const ronda = await getRondaByCodigo(codigo)
  if (!ronda) return Response.json({ error: 'not_found' }, { status: 404 })
  const report = await getMyPtReport(ronda.id)
  if (!report?.url) return Response.json({ error: 'not_available' }, { status: 404 })
  const upstream = await fetch(report.url)
  if (!upstream.ok) return Response.json({ error: 'storage_error' }, { status: 502 })
  return new Response(upstream.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${report.nombreArchivo.replace(/["\r\n]/g, '_')}"` } })
}
