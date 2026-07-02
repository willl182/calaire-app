import { notFound, redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/server/auth'
import { getRonda } from '@/server/rondas'
import { getPanelSgc } from '@/server/sgc'
import { SGC_LEYENDA_CODIGO_PROVISIONAL } from '@/server/sgc/catalog'

type PageProps = { params: Promise<{ id: string }> }

const METRIC_LABELS: Record<string, string> = {
  participantes_esperados: 'Participantes esperados',
  participantes_reclamados: 'Participantes reclamados',
  fichas_enviadas: 'Fichas enviadas',
  envios_finales: 'Participantes con envio final',
  envios_esperados: 'Participantes esperados para envio final',
  envios_pt_en_borrador: 'Celdas PT en borrador',
  pt_items_configurados: 'Items PT configurados',
  grupos_muestra_configurados: 'Grupos de muestra configurados',
  celdas_esperadas: 'Celdas esperadas',
  celdas_finales: 'Celdas finales',
  celdas_faltantes: 'Celdas faltantes',
  completitud_por_contaminante: 'Completitud por contaminante',
  completitud_por_grupo: 'Completitud por grupo',
  export_csv_pt_listo: 'Export CSV PT listo',
  evidencia_f_psea_09_vigente: 'Evidencia F-PSEA-09 vigente',
  evidencia_f_psea_10_vigente: 'Evidencia F-PSEA-10 vigente',
  evidencia_f_psea_14_vigente: 'Evidencia F-PSEA-14 vigente',
  codigos_duplicados: 'Codigos duplicados',
  codigos_provisionales: 'Codigos provisionales',
  hitos_bloqueantes_pendientes: 'Hitos bloqueantes pendientes',
}

function fmt(ms?: number | null) {
  return ms ? new Date(ms).toLocaleString('es-CO') : 'Sin fecha'
}

function fmtMetric(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Sin dato'
  if (typeof value === 'boolean') return value ? 'Si' : 'No'
  return String(value)
}

export default async function FPsea13PrintPage({ params }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')
  const { id } = await params
  const ronda = await getRonda(id)
  const panel = await getPanelSgc(id)
  if (!ronda || !panel) notFound()
  const revision = panel.revision
  const metricas = { ...panel.metricasActuales, ...(revision?.metricas ?? {}) }

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-10 text-slate-950 print:px-0">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">F-PSEA-13</p>
      <h1 className="mt-2 text-3xl font-semibold">Revision de datos {ronda.codigo}</h1>
      <p className="mt-1 text-slate-600">{ronda.nombre}</p>
      <div className="mt-6 grid gap-3 border-y border-slate-200 py-4 text-sm sm:grid-cols-2">
        <div><strong>Estado documental:</strong> {revision?.estado ?? 'borrador'}</div>
        <div><strong>Finalizado:</strong> {fmt(revision?.finalizadoAt)}</div>
        <div><strong>Finalizado por:</strong> {revision?.finalizadoBy ?? 'No finalizado'}</div>
        <div><strong>Snapshot/version:</strong> ver bitacora SGC</div>
      </div>
      <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900">
        {SGC_LEYENDA_CODIGO_PROVISIONAL}
      </p>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Metricas de apoyo</h2>
        <div className="mt-3 divide-y divide-slate-200 rounded border border-slate-200">
          {Object.entries(METRIC_LABELS).map(([key, label]) => (
            <div key={key} className="grid gap-2 p-3 text-sm sm:grid-cols-[240px_1fr]">
              <div className="font-medium">{label}</div>
              <div className="text-slate-700">{fmtMetric(metricas[key])}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Checks</h2>
        <div className="mt-3 divide-y divide-slate-200 rounded border border-slate-200">
          {Object.entries(revision?.checks ?? {}).map(([key, check]) => (
            <div key={key} className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_120px_1fr]">
              <div className="font-medium">{key}</div>
              <div>{check.cumple ? 'Cumple' : 'No cumple'}</div>
              <div className="text-slate-600">{check.observacion ?? 'Sin observacion'}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
