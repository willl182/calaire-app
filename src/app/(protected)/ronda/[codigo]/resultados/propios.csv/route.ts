import { requireAuth } from '@/server/auth'
import { getMyPtResults, getRondaByCodigo } from '@/server/rondas'

function cell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"` }
export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  await requireAuth()
  const { codigo } = await params
  const ronda = await getRondaByCodigo(codigo)
  if (!ronda) return Response.json({ error: 'not_found' }, { status: 404 })
  const data = await getMyPtResults(ronda.id)
  if (data.estado !== 'publicada') return Response.json({ error: 'not_published' }, { status: 404 })
  const headers = ['contaminante','run_code','level_label','unidad','metodo','valor_asignado','u_xpt','sigma_pt','valor_participante','u_lab','U_lab','z','z_prima','zeta','en','clasificacion']
  const lines = data.resultados.map((row) => [row.item?.contaminante,row.item?.runCode,row.item?.levelLabel,row.unidad,row.metodo,row.valorAsignado,row.incertidumbreAsignada,row.sigmaPt,row.valorParticipante,row.uParticipante,row.UParticipante,row.z,row.zPrima,row.zeta,row.en,row.clasificacion].map(cell).join(','))
  return new Response(`\uFEFF${headers.join(',')}\n${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${ronda.codigo}-mis-resultados.csv"` } })
}
