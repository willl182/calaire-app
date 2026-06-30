import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Alert } from '../../../components/Alert'
import { EstadoBadge } from '../../../components/EstadoBadge'
import { isAdmin, requireAuth } from '@/server/auth'
import { getRonda } from '@/server/rondas'
import {
  SGC_FORMATOS_FASE_1,
  SGC_PLAN_BLOQUES,
  SGC_RONDA_ETAPAS,
  type SgcFormatoCodigo,
  type SgcRondaDocumento,
} from '@/server/sgc/catalog'
import { getPanelSgc, inicializarPanelSgc } from '@/server/sgc'
import { RondaContextNav } from '../RondaContextNav'
import { ExpedienteSgc } from './ExpedienteSgc'
import {
  finalizarPlanRondaAction,
  finalizarRevisionDatosAction,
  finalizarRevisionHomogeneidadAction,
  guardarPlanRondaAction,
  guardarRevisionDatosAction,
  guardarRevisionHomogeneidadAction,
} from './actions'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const INFORME_CHECK_LABELS: Record<string, string> = {
  participantes_revisados: 'Participantes, codigos y fichas revisados',
  fichas_revisadas: 'F-PSEA-03 y registros de participacion consistentes',
  envios_finales_revisados: 'F-PSEA-08/F-PSEA-12 revisados contra envios finales',
  metricas_revisadas: 'Metricas y salidas usadas en el informe revisadas',
  evidencias_revisadas: 'Evidencias F-PSEA-09, F-PSEA-10 y anexos revisadas',
  inconsistencias_resueltas: 'Inconsistencias resueltas o justificadas',
  f_psea_11_no_aplica: 'Homogeneidad/estabilidad revisada o no aplicabilidad justificada',
}

const DOCUMENTO_ESTADOS_CUBIERTOS = new Set(['completo', 'no_aplica', 'disponible'])

const HOMOGENEIDAD_CHECK_LABELS: Record<string, string> = {
  plan_muestreo_revisado: 'Plan de muestreo revisado',
  criterios_aceptacion_definidos: 'Criterios de aceptacion definidos',
  resultados_homogeneidad_revisados: 'Resultados de homogeneidad revisados',
  resultados_estabilidad_revisados: 'Resultados de estabilidad revisados',
  desviaciones_documentadas: 'Desviaciones documentadas',
  conclusion_lote_aprobada: 'Conclusion de lote aprobada',
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseSelectedFormato(value: string | string[] | undefined): SgcFormatoCodigo | null {
  const formato = getParam(value)
  return SGC_FORMATOS_FASE_1.some((item) => item.codigo === formato) ? formato as SgcFormatoCodigo : null
}

function estadoClasses(estado: string) {
  if (estado === 'completo' || estado === 'no_aplica' || estado === 'disponible') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'advertencia') return 'bg-amber-100 text-amber-800'
  if (estado === 'pendiente') return 'bg-rose-100 text-rose-800'
  return 'bg-slate-100 text-slate-700'
}

function getDocumentoEstado(doc: SgcRondaDocumento, checklistByCodigo: Map<string, { estado: string }>) {
  if (!doc.formatoOperativo) return doc.estado
  return checklistByCodigo.get(doc.formatoOperativo)?.estado ?? doc.estado
}

function getDocumentoObservacion(doc: SgcRondaDocumento, checklistByCodigo: Map<string, { observaciones: string; vinculo: string | null }>) {
  if (!doc.formatoOperativo) return doc.nota
  const item = checklistByCodigo.get(doc.formatoOperativo)
  if (!item) return doc.nota
  return `${item.observaciones}${item.vinculo ? ` Vinculo: ${item.vinculo}.` : ''}`
}

export default async function SgcRondaPage({ params, searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const { id } = await params
  const query = searchParams ? await searchParams : {}
  const ronda = await getRonda(id)
  if (!ronda) notFound()

  await inicializarPanelSgc(id)
  const panel = await getPanelSgc(id)
  if (!panel) notFound()

  const success = getParam(query.success)
  const error = getParam(query.error)
  const selectedFormato = parseSelectedFormato(query.formato)
  const checklistByCodigo = new Map(panel.checklist.map((item) => [item.codigo, item]))
  const documentos = SGC_RONDA_ETAPAS.flatMap((seccion) => seccion.documentos.map((doc) => ({ seccion, doc })))
  const cubiertos = documentos.filter(({ doc }) => {
    const estado = getDocumentoEstado(doc, checklistByCodigo)
    return DOCUMENTO_ESTADOS_CUBIERTOS.has(estado)
  }).length
  const progreso = documentos.length === 0 ? 0 : Math.round((cubiertos / documentos.length) * 100)

  const planBloques = panel.plan?.bloques ?? {}
  const planCampos = panel.plan?.camposEstructurados ?? {}
  const informeChecks = panel.revision?.checks ?? {}
  const homogeneidadChecks = panel.revisionHomogeneidad?.checks ?? {}
  const informeCheckKeys = Object.keys(INFORME_CHECK_LABELS)
  const homogeneidadCheckKeys = Object.keys(HOMOGENEIDAD_CHECK_LABELS)

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <RondaContextNav rondaId={id} rondaCodigo={ronda.codigo} />

        <header className="header-bar px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">SGC de la ronda</h1>
                <EstadoBadge estado={ronda.estado} />
              </div>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Expediente documental para {ronda.codigo}. Solo se muestran el mapa documental, el checklist real y los registros que se diligencian desde esta vista.
              </p>
            </div>
            <div className="min-w-48 rounded-lg border border-[var(--border)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Checklist documental</div>
              <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{progreso}%</div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progreso}%` }} />
              </div>
            </div>
          </div>
        </header>

        {success && <Alert tone="success" message={success} />}
        {error && <Alert tone="error" message={error} />}

        <ExpedienteSgc panel={panel} rondaId={id} rondaCodigo={ronda.codigo} selectedFormato={selectedFormato} />

        <section className="card p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Checklist documental real</h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Lista derivada de las secciones y documentos de {ronda.codigo}, no del checklist operativo anterior.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {documentos.length} items
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
                  <th className="px-3 py-2">Seccion</th>
                  <th className="px-3 py-2">Documento</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Fuente</th>
                  <th className="px-3 py-2">Cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {documentos.map(({ seccion, doc }) => {
                  const estado = getDocumentoEstado(doc, checklistByCodigo)
                  return (
                    <tr key={`${seccion.key}-${doc.codigo}`}>
                      <td className="px-3 py-3 align-top">
                        <div className="font-semibold">{seccion.numero}. {seccion.nombre}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">{seccion.carpeta}</div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="font-semibold">{doc.codigo}</div>
                        <div>{doc.nombre}</div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClasses(estado)}`}>{estado}</span>
                      </td>
                      <td className="px-3 py-3 align-top text-[var(--foreground-muted)]">
                        {doc.archivoBase ? `${seccion.carpeta}/${doc.archivoBase}.md y .docx` : `Sin archivo base en ${ronda.codigo}`}
                      </td>
                      <td className="px-3 py-3 align-top text-[var(--foreground-muted)]">
                        {getDocumentoObservacion(doc, checklistByCodigo)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="plan-ronda" className="card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">F-PSEA-06 - Planificacion de ronda EA</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Estado: {panel.plan?.estado ?? 'borrador'}</p>
              </div>
              <Link className="btn-outline" href={`/dashboard/rondas/${id}/sgc/plan/print`}>Vista imprimible</Link>
            </div>
            <form action={guardarPlanRondaAction} className="mt-4 space-y-3">
              <input type="hidden" name="ronda_id" value={id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" name="responsable" placeholder="Responsable" defaultValue={planCampos.responsable ?? ''} />
                <input className="input" name="fecha_plan" type="date" defaultValue={planCampos.fecha_plan ?? ''} />
              </div>
              <div className="max-h-[500px] space-y-4 overflow-y-auto rounded-lg border border-[var(--border)] bg-slate-50/50 p-4 pr-2">
                {SGC_PLAN_BLOQUES.map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{label}</label>
                    <textarea
                      className="input min-h-24 w-full bg-white"
                      name={`bloque_${key}`}
                      placeholder={`Ingrese el contenido para el bloque ${key.toUpperCase()}...`}
                      defaultValue={planBloques[key] ?? ''}
                    />
                  </div>
                ))}
              </div>
              <input className="input" name="motivo_revision" placeholder="Motivo si edita un plan finalizado" />
              <button className="btn-primary" type="submit">Guardar F-PSEA-06</button>
            </form>
            <form action={finalizarPlanRondaAction} className="mt-3">
              <input type="hidden" name="ronda_id" value={id} />
              <button className="btn-outline" type="submit">Finalizar F-PSEA-06 y crear snapshot</button>
            </form>
          </section>

          <section id="f-psea-13" className="card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">F-PSEA-13 - Informe final de resultados</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Estado: {panel.revision?.estado ?? 'borrador'}</p>
              </div>
              <Link className="btn-outline" href={`/dashboard/rondas/${id}/sgc/f-psea-13/print`}>Vista imprimible</Link>
            </div>
            <form action={guardarRevisionDatosAction} className="mt-4 space-y-3">
              <input type="hidden" name="ronda_id" value={id} />
              <input type="hidden" name="check_keys" value={informeCheckKeys.join(',')} />
              {informeCheckKeys.map((key) => {
                const check = informeChecks[key]
                return (
                  <div key={key} className="rounded-lg border border-[var(--border)] p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" name={`check_${key}`} defaultChecked={check?.cumple ?? false} />
                      {INFORME_CHECK_LABELS[key]}
                    </label>
                    <input className="input mt-2" name={`obs_${key}`} placeholder="Observacion si no cumple" defaultValue={check?.observacion ?? ''} />
                  </div>
                )
              })}
              <button className="btn-primary" type="submit">Guardar F-PSEA-13</button>
            </form>
            <form action={finalizarRevisionDatosAction} className="mt-3">
              <input type="hidden" name="ronda_id" value={id} />
              <button className="btn-outline" type="submit">Finalizar F-PSEA-13 y crear snapshot</button>
            </form>
          </section>
        </div>

        <section id="f-psea-11" className="card p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">F-PSEA-11 - Homogeneidad y estabilidad del item</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Estado: {panel.revisionHomogeneidad?.estado ?? 'borrador'}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Registro diligenciable
            </span>
          </div>
          <form action={guardarRevisionHomogeneidadAction} className="mt-4 space-y-3">
            <input type="hidden" name="ronda_id" value={id} />
            <input type="hidden" name="homogeneidad_check_keys" value={homogeneidadCheckKeys.join(',')} />
            <textarea
              className="input min-h-24"
              name="homogeneidad_conclusiones"
              placeholder="Conclusion documentada de homogeneidad y estabilidad"
              defaultValue={panel.revisionHomogeneidad?.conclusiones ?? ''}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {homogeneidadCheckKeys.map((key) => {
                const check = homogeneidadChecks[key]
                return (
                  <div key={key} className="rounded-lg border border-[var(--border)] p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" name={`homogeneidad_check_${key}`} defaultChecked={check?.cumple ?? false} />
                      {HOMOGENEIDAD_CHECK_LABELS[key]}
                    </label>
                    <input className="input mt-2" name={`homogeneidad_obs_${key}`} placeholder="Observacion si no cumple" defaultValue={check?.observacion ?? ''} />
                  </div>
                )
              })}
            </div>
            <button className="btn-primary" type="submit">Guardar F-PSEA-11</button>
          </form>
          <form action={finalizarRevisionHomogeneidadAction} className="mt-3">
            <input type="hidden" name="ronda_id" value={id} />
            <button className="btn-outline" type="submit">Finalizar F-PSEA-11 y crear snapshot</button>
          </form>
        </section>
      </div>
    </div>
  )
}
