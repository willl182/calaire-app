import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Alert } from '@/app/(protected)/dashboard/components/Alert'
import { EstadoBadge } from '@/app/(protected)/dashboard/components/EstadoBadge'
import { isAdmin, requireAuth } from '@/lib/auth'
import { getRonda } from '@/lib/rondas'
import { SGC_LEYENDA_CODIGO_PROVISIONAL } from '@/lib/sgc/catalog'
import { getPanelSgc, inicializarPanelSgc, listPublicaciones } from '@/lib/sgc'
import { RondaContextNav } from '../RondaContextNav'
import {
  actualizarHitoRondaAction,
  actualizarCasoSgcAction,
  crearCasoSgcAction,
  crearHitoRondaAction,
  crearPublicacionAction,
  descargarEvidenciaAction,
  eliminarPublicacionAction,
  finalizarPlanRondaAction,
  finalizarRevisionDatosAction,
  finalizarRevisionHomogeneidadAction,
  guardarJustificacionAction,
  guardarPlanRondaAction,
  guardarRevisionDatosAction,
  guardarRevisionHomogeneidadAction,
  retirarJustificacionAction,
  retirarEvidenciaAction,
  responderComentarioAction,
  crearNotificacionAction,
  guardarResultadoPtAppAction,
  subirEvidenciaAction,
  transicionSgcAction,
} from './actions'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const FASE_LABELS = {
  planeacion: 'Planeacion',
  convocatoria: 'Convocatoria',
  ejecucion: 'Ejecucion',
  evaluacion: 'Evaluacion',
  cierre: 'Cierre',
}

const SNAPSHOT_LABELS: Record<string, string> = {
  plan_ronda: 'Plan de ronda',
  revision_datos: 'F-PSEA-13',
  revision_homogeneidad: 'F-PSEA-08',
}

const CHECK_LABELS: Record<string, string> = {
  participantes_revisados: 'Participantes esperados y reclamados revisados',
  fichas_revisadas: 'Fichas de inscripcion revisadas',
  envios_finales_revisados: 'Envios finales revisados',
  metricas_revisadas: 'Metricas de apoyo revisadas',
  evidencias_revisadas: 'Evidencias F-PSEA-09/10/14 revisadas',
  inconsistencias_resueltas: 'Inconsistencias detectables resueltas',
  f_psea_11_no_aplica: 'F-PSEA-11 marcado no aplica con razon',
}

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

const HOMOGENEIDAD_CHECK_LABELS: Record<string, string> = {
  plan_muestreo_revisado: 'Plan de muestreo revisado',
  criterios_aceptacion_definidos: 'Criterios de aceptacion definidos',
  resultados_homogeneidad_revisados: 'Resultados de homogeneidad revisados',
  resultados_estabilidad_revisados: 'Resultados de estabilidad revisados',
  desviaciones_documentadas: 'Desviaciones documentadas',
  conclusion_lote_aprobada: 'Conclusion de lote aprobada',
}

const HOMOGENEIDAD_METRIC_LABELS: Record<string, string> = {
  items_pt_configurados: 'Items PT configurados',
  grupos_muestra_configurados: 'Grupos de muestra configurados',
  evidencia_f_psea_08_vigente: 'Evidencia F-PSEA-08 vigente',
  resultado_homogeneidad_aprobado: 'Resultado homogeneidad aprobado',
  resultado_estabilidad_aprobado: 'Resultado estabilidad aprobado',
  celdas_finales_disponibles: 'Celdas finales disponibles',
  celdas_faltantes: 'Celdas faltantes',
}

const CASO_TIPO_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  desviacion: 'Desviacion',
  queja: 'Queja',
  apelacion: 'Apelacion',
  nc_capa: 'NC/CAPA',
  otro: 'Otro',
}

const CASO_ESTADO_LABELS: Record<string, string> = {
  abierto: 'Abierto',
  en_revision: 'En revision',
  esperando_participante: 'Esperando participante',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function fmtDate(ms?: number | null) {
  if (!ms) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms))
}

function fmtIsoDate(value?: string | null) {
  if (!value) return 'Sin registro'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function estadoClasses(estado: string) {
  if (estado === 'completo' || estado === 'no_aplica') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'advertencia') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

function fmtMetric(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Sin dato'
  if (typeof value === 'boolean') return value ? 'Si' : 'No'
  return String(value)
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

  const publicaciones = await listPublicaciones(id)

  const success = getParam(query.success)
  const error = getParam(query.error)
  const progreso = panel.checklist.length === 0
    ? 0
    : Math.round((panel.checklist.filter((item) => item.estado === 'completo' || item.estado === 'no_aplica').length / panel.checklist.length) * 100)
  const planBloques = panel.plan?.bloques ?? {}
  const planCampos = panel.plan?.camposEstructurados ?? {}
  const revisionChecks = panel.revision?.checks ?? {}
  const revisionMetricas = { ...panel.metricasActuales, ...(panel.revision?.metricas ?? {}) }
  const homogeneidadChecks = panel.revisionHomogeneidad?.checks ?? {}
  const homogeneidadMetricas = { ...panel.metricasHomogeneidadActuales, ...(panel.revisionHomogeneidad?.metricas ?? {}) }
  const metricKeys = Object.keys(METRIC_LABELS)
  const checkKeys = Object.keys(CHECK_LABELS)
  const homogeneidadMetricKeys = Object.keys(HOMOGENEIDAD_METRIC_LABELS)
  const homogeneidadCheckKeys = Object.keys(HOMOGENEIDAD_CHECK_LABELS)
  const versionesVigentes = new Map(panel.versiones.map((item) => [item.serieId, item.vigente]))

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <RondaContextNav rondaId={id} rondaCodigo={ronda.codigo} />

        <header className="header-bar px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">Panel SGC</h1>
                <EstadoBadge estado={ronda.estado} />
              </div>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Cierre documental por ronda con trazabilidad de plan, evidencias, F-PSEA-13, snapshots y bitacora.
              </p>
              <p className="mt-2 text-xs font-medium text-amber-800">{SGC_LEYENDA_CODIGO_PROVISIONAL}</p>
            </div>
            <div className="min-w-48 rounded-lg border border-[var(--border)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Progreso documental</div>
              <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{progreso}%</div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progreso}%` }} />
              </div>
            </div>
          </div>
        </header>

        {success && <Alert tone="success" message={success} />}
        {error && <Alert tone="error" message={error} />}

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Acciones de cierre</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {ronda.estado === 'activa' && (
              <form action={transicionSgcAction}>
                <input type="hidden" name="ronda_id" value={id} />
                <input type="hidden" name="accion" value="documentacion_pendiente" />
                <button className="btn-primary" type="submit">Pasar a documentacion pendiente</button>
              </form>
            )}
            {ronda.estado === 'documentacion_pendiente' && (
              <form action={transicionSgcAction}>
                <input type="hidden" name="ronda_id" value={id} />
                <input type="hidden" name="accion" value="cerrar" />
                <button className="btn-primary" type="submit">Cerrar documentalmente</button>
              </form>
            )}
            {ronda.estado === 'cerrada' && (
              <form action={transicionSgcAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="ronda_id" value={id} />
                <input type="hidden" name="accion" value="reabrir" />
                <input className="input min-w-72" name="motivo" placeholder="Motivo obligatorio de reapertura" />
                <button className="btn-outline" type="submit">Reabrir a documentacion pendiente</button>
              </form>
            )}
          </div>
          {panel.bloqueantes.length > 0 && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm font-semibold text-rose-900">Bloqueantes de cierre</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-800">
                {panel.bloqueantes.map((bloqueante) => <li key={bloqueante}>{bloqueante}</li>)}
              </ul>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Checklist SGC</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
                  <th className="px-3 py-2">Formato</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Fase</th>
                  <th className="px-3 py-2">Modo</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Responsable</th>
                  <th className="px-3 py-2">Ultima actualizacion</th>
                  <th className="px-3 py-2">Vinculo</th>
                  <th className="px-3 py-2">Observaciones</th>
                  <th className="px-3 py-2">Accion principal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {panel.checklist.map((item) => {
                  const justificable = item.codigo === 'F-PSEA-05' || item.codigo === 'F-PSEA-05A' || item.codigo === 'F-PSEA-12'
                  return (
                    <tr key={item.codigo}>
                      <td className="px-3 py-3 font-semibold">{item.codigo}</td>
                      <td className="px-3 py-3">{item.nombre}</td>
                      <td className="px-3 py-3">{FASE_LABELS[item.fase]}</td>
                      <td className="px-3 py-3">{item.modo}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClasses(item.estado)}`}>{item.estado}</span>
                      </td>
                      <td className="px-3 py-3">{item.responsable}</td>
                      <td className="px-3 py-3">{fmtIsoDate(item.ultimaActualizacion)}</td>
                      <td className="px-3 py-3">{item.vinculo ?? 'Sin vinculo'}</td>
                      <td className="px-3 py-3 text-[var(--foreground-muted)]">{item.observaciones}</td>
                      <td className="px-3 py-3">
                        {justificable ? (
                          <span className="text-xs font-medium text-[var(--foreground-muted)]">Registrar justificativo si no hay cobertura</span>
                        ) : (
                          <span className="text-xs font-medium text-[var(--foreground-muted)]">{item.vinculo ?? 'Completar registro'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Justificaciones SGC</h2>
          <form action={guardarJustificacionAction} className="mt-4 grid gap-3 md:grid-cols-4">
            <input type="hidden" name="ronda_id" value={id} />
            <select className="input" name="formato" defaultValue="F-PSEA-05">
              <option value="F-PSEA-05">F-PSEA-05</option>
              <option value="F-PSEA-05A">F-PSEA-05A</option>
              <option value="F-PSEA-12">F-PSEA-12</option>
            </select>
            <input className="input" name="alcance" placeholder="Alcance: ronda, participante, envio" />
            <input className="input md:col-span-2" name="razon" placeholder="Razon documentada" />
            <button className="btn-primary md:col-span-4" type="submit">Registrar justificativo</button>
          </form>
          <div className="mt-4 grid gap-2">
            {panel.justificaciones.map((justificacion) => (
              <div key={justificacion._id} className="grid gap-3 rounded-lg border border-[var(--border)] p-3 text-sm md:grid-cols-5">
                <div className="font-semibold">{justificacion.formato}</div>
                <div>{justificacion.estado}</div>
                <div>{justificacion.alcance}</div>
                <div className="text-[var(--foreground-muted)]">{justificacion.razon}</div>
                {justificacion.estado === 'vigente' && (
                  <form action={retirarJustificacionAction} className="flex flex-col gap-2">
                    <input type="hidden" name="ronda_id" value={id} />
                    <input type="hidden" name="justificacion_id" value={justificacion._id} />
                    <input className="input" name="motivo" placeholder="Motivo de retiro" />
                    <button className="btn-outline" type="submit">Retirar</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Plan de ronda</h2>
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
              <textarea className="input min-h-24" name="bloque_a" placeholder="A. Objetivo y alcance" defaultValue={planBloques.a ?? ''} />
              <textarea className="input min-h-24" name="bloque_b" placeholder="B. Cronograma y responsabilidades" defaultValue={planBloques.b ?? ''} />
              <input className="input" name="motivo_revision" placeholder="Motivo si edita un plan finalizado" />
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" type="submit">Guardar plan</button>
              </div>
            </form>
            <form action={finalizarPlanRondaAction} className="mt-3">
              <input type="hidden" name="ronda_id" value={id} />
              <button className="btn-outline" type="submit">Finalizar plan y crear snapshot</button>
            </form>
          </section>

          <section className="card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">F-PSEA-13</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Estado: {panel.revision?.estado ?? 'borrador'}</p>
              </div>
              <Link className="btn-outline" href={`/dashboard/rondas/${id}/sgc/f-psea-13/print`}>Vista imprimible</Link>
            </div>
            <div className="mt-4 rounded-lg border border-[var(--border)]">
              <div className="border-b border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">Metricas de apoyo</div>
              <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
                {metricKeys.map((key) => (
                  <div key={key} className="bg-[var(--card)] px-3 py-2 text-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{METRIC_LABELS[key]}</div>
                    <div className="mt-1 break-words text-[var(--foreground)]">{fmtMetric(revisionMetricas[key])}</div>
                  </div>
                ))}
              </div>
            </div>
            <form action={guardarRevisionDatosAction} className="mt-4 space-y-3">
              <input type="hidden" name="ronda_id" value={id} />
              <input type="hidden" name="check_keys" value={checkKeys.join(',')} />
              {checkKeys.map((key) => {
                const check = revisionChecks[key]
                return (
                  <div key={key} className="rounded-lg border border-[var(--border)] p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" name={`check_${key}`} defaultChecked={check?.cumple ?? false} />
                      {CHECK_LABELS[key]}
                    </label>
                    <input className="input mt-2" name={`obs_${key}`} placeholder="Observacion si no cumple" defaultValue={check?.observacion ?? ''} />
                  </div>
                )
              })}
              <button className="btn-primary" type="submit">Guardar revision</button>
            </form>
            <form action={finalizarRevisionDatosAction} className="mt-3">
              <input type="hidden" name="ronda_id" value={id} />
              <button className="btn-outline" type="submit">Finalizar F-PSEA-13 y crear snapshot</button>
            </form>
          </section>
        </div>

        <section className="card p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">F-PSEA-08</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Revision nativa de homogeneidad y estabilidad. Estado: {panel.revisionHomogeneidad?.estado ?? 'borrador'}
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Registro nativo Fase 2
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[var(--border)]">
            <div className="border-b border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">Metricas de apoyo</div>
            <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
              {homogeneidadMetricKeys.map((key) => (
                <div key={key} className="bg-[var(--card)] px-3 py-2 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{HOMOGENEIDAD_METRIC_LABELS[key]}</div>
                  <div className="mt-1 break-words text-[var(--foreground)]">{fmtMetric(homogeneidadMetricas[key])}</div>
                </div>
              ))}
            </div>
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
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" type="submit">Guardar F-PSEA-08</button>
            </div>
          </form>
          <form action={finalizarRevisionHomogeneidadAction} className="mt-3">
            <input type="hidden" name="ronda_id" value={id} />
            <button className="btn-outline" type="submit">Finalizar F-PSEA-08 y crear snapshot</button>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Evidencias</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {panel.series.map((serie) => {
              const vigente = panel.versiones.find((version) => version.serieId === serie._id)?.vigente
              return (
                <div key={serie._id} className="rounded-lg border border-[var(--border)] p-4">
                  <div className="font-semibold">{serie.formato}</div>
                  <div className="text-sm text-[var(--foreground-muted)]">{vigente ? `V${vigente.version} ${vigente.fileName}` : 'Sin evidencia vigente'}</div>
                  {vigente && (
                    <div className="mt-3 space-y-2">
                      <form action={descargarEvidenciaAction}>
                        <input type="hidden" name="ronda_id" value={id} />
                        <input type="hidden" name="evidencia_version_id" value={vigente._id} />
                        <button className="btn-outline" type="submit">Descargar vigente</button>
                      </form>
                      <form action={retirarEvidenciaAction} className="flex flex-col gap-2">
                        <input type="hidden" name="ronda_id" value={id} />
                        <input type="hidden" name="evidencia_version_id" value={vigente._id} />
                        <input className="input" name="motivo" placeholder="Motivo obligatorio de retiro" />
                        <button className="btn-outline" type="submit">Retirar vigente</button>
                      </form>
                    </div>
                  )}
                  <form action={subirEvidenciaAction} className="mt-3 space-y-2">
                    <input type="hidden" name="ronda_id" value={id} />
                    <input type="hidden" name="serie_id" value={serie._id} />
                    <input className="input" name="archivo" type="file" accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg" />
                    <button className="btn-outline" type="submit">Registrar version</button>
                  </form>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Cronograma</h2>
          <form action={crearHitoRondaAction} className="mt-4 grid gap-3 md:grid-cols-5">
            <input type="hidden" name="ronda_id" value={id} />
            <input className="input" name="codigo" placeholder="Codigo" />
            <input className="input" name="nombre" placeholder="Nombre del hito" />
            <input className="input" name="fase" placeholder="Fase" />
            <input className="input" name="fecha_objetivo" type="date" />
            <input className="input" name="responsable" placeholder="Responsable" />
            <input className="input md:col-span-2" name="formato_relacionado" placeholder="Formato relacionado" />
            <input className="input md:col-span-2" name="notas" placeholder="Notas" />
            <label className="flex items-center gap-2 text-sm"><input name="bloquea_cierre" type="checkbox" /> Bloquea cierre</label>
            <button className="btn-primary md:col-span-5" type="submit">Crear hito</button>
          </form>
          <div className="mt-4 grid gap-2">
            {panel.hitos.map((hito) => (
              <form key={hito._id} action={actualizarHitoRondaAction} className="grid gap-3 rounded-lg border border-[var(--border)] p-3 text-sm md:grid-cols-6">
                <input type="hidden" name="ronda_id" value={id} />
                <input type="hidden" name="hito_id" value={hito._id} />
                <input className="input" name="codigo" defaultValue={hito.codigo} />
                <input className="input md:col-span-2" name="nombre" defaultValue={hito.nombre} />
                <input className="input" name="fase" defaultValue={hito.fase} />
                <select className="input" name="estado" defaultValue={hito.estado}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completado">Completado</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="no_aplica">No aplica</option>
                </select>
                <input className="input" name="responsable" defaultValue={hito.responsable} />
                <input className="input" name="fecha_objetivo" type="date" defaultValue={hito.fechaObjetivo ?? ''} />
                <input className="input" name="fecha_real" type="date" defaultValue={hito.fechaReal ?? ''} />
                <input className="input md:col-span-2" name="formato_relacionado" defaultValue={hito.formatoRelacionado ?? ''} />
                <input className="input md:col-span-2" name="notas" defaultValue={hito.notas ?? ''} />
                <label className="flex items-center gap-2"><input name="bloquea_cierre" type="checkbox" defaultChecked={hito.bloqueaCierre} /> Bloquea cierre</label>
                <label className="flex items-center gap-2"><input name="visible_participante" type="checkbox" defaultChecked={hito.visibleParticipante} /> Visible participante</label>
                <button className="btn-outline md:col-span-6" type="submit">Actualizar hito</button>
              </form>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Plantillas P-20</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {['convocatoria', 'recordatorio-ficha', 'recordatorio-envio-resultados', 'publicacion-resultados', 'cierre-ronda'].map((name) => (
              <Link key={name} className="btn-outline" href={`/dashboard/rondas/${id}/sgc/templates/${name}`}>{name}</Link>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Publicaciones</h2>
          <form action={crearPublicacionAction} className="mt-4 grid gap-3 md:grid-cols-6">
            <input type="hidden" name="ronda_id" value={id} />
            <input className="input md:col-span-3" name="titulo" placeholder="Titulo" required />
            <select className="input" name="tipo">
              <option value="comunicado">Comunicado</option>
              <option value="resultado">Resultado</option>
              <option value="cronograma">Cronograma</option>
              <option value="evidencia">Evidencia</option>
            </select>
            <input className="input" name="visible_desde" type="date" required />
            <input className="input" name="visible_hasta" type="date" />
            <textarea className="input md:col-span-6 min-h-24" name="contenido" placeholder="Contenido visible para participantes" required />
            <button className="btn-primary md:col-span-6" type="submit">Publicar</button>
          </form>
          <div className="mt-4 grid gap-2">
            {publicaciones.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">Sin publicaciones registradas.</p>
            )}
            {publicaciones.map((pub) => (
              <div key={pub._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{pub.titulo}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">{pub.tipo} · {fmtDate(pub.visibleDesde)} {pub.visibleHasta ? `hasta ${fmtDate(pub.visibleHasta)}` : ''}</div>
                  </div>
                  <form action={eliminarPublicacionAction}>
                    <input type="hidden" name="ronda_id" value={id} />
                    <input type="hidden" name="publicacion_id" value={pub._id} />
                    <button className="btn-outline text-xs" type="submit">Eliminar</button>
                  </form>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-[var(--foreground-muted)]">{pub.contenido}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Comentarios de participantes</h2>
          <div className="mt-4 grid gap-3">
            {panel.comentarios.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">Sin comentarios de participantes.</p>
            )}
            {panel.comentarios.map((comentario) => (
              <div key={comentario._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{comentario.autorNombre}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">{comentario.autorEmail} · {fmtDate(comentario.createdAt)} · {comentario.estado}</div>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[var(--foreground)]">{comentario.mensaje}</p>
                {comentario.respuestaAdmin && (
                  <p className="mt-2 rounded border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--foreground-muted)]">{comentario.respuestaAdmin}</p>
                )}
                <form action={responderComentarioAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                  <input type="hidden" name="ronda_id" value={id} />
                  <input type="hidden" name="comentario_id" value={comentario._id} />
                  <input className="input" name="respuesta" placeholder="Respuesta operativa" />
                  <label className="flex items-center gap-2 text-sm"><input name="cerrar" type="checkbox" /> Cerrar</label>
                  <button className="btn-outline" type="submit">Responder</button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Notificaciones in-app</h2>
          <form action={crearNotificacionAction} className="mt-4 grid gap-3 md:grid-cols-6">
            <input type="hidden" name="ronda_id" value={id} />
            <select className="input md:col-span-3" name="ronda_participante_id" aria-label="Seleccionar participante destinatario" defaultValue="">
              <option value="">Destinatario manual por correo</option>
              {panel.destinatariosNotificacion.map((destinatario) => (
                <option key={destinatario._id} value={destinatario._id}>
                  {destinatario.participantCode ?? 'Sin codigo'} · {destinatario.email}
                </option>
              ))}
            </select>
            <input className="input md:col-span-2" name="destinatario_email" placeholder="Correo manual si no selecciona participante" />
            <select className="input" name="tipo" defaultValue="sgc">
              <option value="sgc">SGC</option>
              <option value="recordatorio">Recordatorio</option>
              <option value="cronograma">Cronograma</option>
              <option value="resultado">Resultado</option>
              <option value="otro">Otro</option>
            </select>
            <input className="input md:col-span-2" name="titulo" placeholder="Titulo" required />
            <textarea className="input md:col-span-6 min-h-20" name="mensaje" placeholder="Mensaje visible para el participante" required />
            <button className="btn-primary md:col-span-6" type="submit">Publicar notificacion</button>
          </form>
          <div className="mt-4 grid gap-2">
            {panel.notificaciones.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">Sin notificaciones publicadas.</p>
            )}
            {panel.notificaciones.map((notificacion) => (
              <div key={notificacion._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="font-semibold">{notificacion.titulo}</div>
                <div className="text-xs text-[var(--foreground-muted)]">{notificacion.destinatarioEmail} · {notificacion.tipo} · {fmtDate(notificacion.createdAt)} {notificacion.leidaAt ? `· leida ${fmtDate(notificacion.leidaAt)}` : ''}</div>
                <div className="mt-2 whitespace-pre-wrap text-[var(--foreground-muted)]">{notificacion.mensaje}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Resultados pt_app</h2>
          <form action={guardarResultadoPtAppAction} className="mt-4 grid gap-3 md:grid-cols-6">
            <input type="hidden" name="ronda_id" value={id} />
            <select className="input" name="tipo_resultado" defaultValue="homogeneidad">
              <option value="homogeneidad">Homogeneidad</option>
              <option value="estabilidad">Estabilidad</option>
              <option value="estadistico">Estadistico</option>
            </select>
            <select className="input md:col-span-2" name="serie_id" required>
              {panel.series.filter((serie) => ['F-PSEA-09', 'F-PSEA-10', 'F-PSEA-14'].includes(serie.formato)).map((serie) => (
                <option key={serie._id} value={serie._id}>{serie.formato} · {serie.nombre}</option>
              ))}
            </select>
            <select className="input" name="version_id">
              <option value="">Sin version vinculada</option>
              {panel.series.map((serie) => {
                const vigente = versionesVigentes.get(serie._id)
                return vigente ? <option key={vigente._id} value={vigente._id}>{serie.formato} v{vigente.version}</option> : null
              })}
            </select>
            <select className="input" name="estado" defaultValue="en_revision">
              <option value="pendiente">Pendiente</option>
              <option value="cargado">Cargado</option>
              <option value="en_revision">En revision</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
            <input className="input" name="fecha_calculo" type="date" />
            <textarea className="input md:col-span-6 min-h-20" name="observaciones" placeholder="Metadatos u observaciones del exportado pt_app" />
            <button className="btn-primary md:col-span-6" type="submit">Guardar metadata pt_app</button>
          </form>
          <div className="mt-4 grid gap-2">
            {panel.resultadosPtApp.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">Sin resultados pt_app clasificados.</p>
            )}
            {panel.resultadosPtApp.map((resultado) => (
              <div key={resultado._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="font-semibold">{resultado.tipoResultado} · {resultado.estado} · v{resultado.version}</div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {resultado.fechaCalculo ?? 'Sin fecha de calculo'} {resultado.aprobadoAt ? `· aprobado por ${resultado.aprobadoBy} en ${fmtDate(resultado.aprobadoAt)}` : ''}
                </div>
                {resultado.observaciones && <div className="mt-2 text-[var(--foreground-muted)]">{resultado.observaciones}</div>}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Casos SGC unificados</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Registro operativo de consultas, desviaciones, quejas, apelaciones y NC/CAPA vinculadas a la ronda.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Fase 2
            </div>
          </div>
          <form action={crearCasoSgcAction} className="mt-4 grid gap-3 md:grid-cols-6">
            <input type="hidden" name="ronda_id" value={id} />
            <input className="input md:col-span-2" name="titulo" placeholder="Titulo del caso" required />
            <select className="input" name="tipo" defaultValue="desviacion">
              <option value="consulta">Consulta</option>
              <option value="desviacion">Desviacion</option>
              <option value="queja">Queja</option>
              <option value="apelacion">Apelacion</option>
              <option value="nc_capa">NC/CAPA</option>
              <option value="otro">Otro</option>
            </select>
            <select className="input" name="severidad" defaultValue="media">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Critica</option>
            </select>
            <input className="input" name="fecha_objetivo" type="date" />
            <input className="input" name="responsable" placeholder="Responsable" />
            <select className="input md:col-span-2" name="ronda_participante_id" defaultValue="">
              <option value="">Sin participante vinculado</option>
              {panel.destinatariosNotificacion.map((destinatario) => (
                <option key={destinatario._id} value={destinatario._id}>
                  {destinatario.participantCode ?? 'Sin codigo'} · {destinatario.email}
                </option>
              ))}
            </select>
            <input className="input" name="formato_relacionado" placeholder="Formato relacionado" />
            <select className="input md:col-span-2" name="evidencia_serie_id" defaultValue="">
              <option value="">Sin evidencia vinculada</option>
              {panel.series.map((serie) => (
                <option key={serie._id} value={serie._id}>{serie.formato} · {serie.nombre}</option>
              ))}
            </select>
            <textarea className="input md:col-span-6 min-h-24" name="descripcion" placeholder="Descripcion, impacto y acciones iniciales" required />
            <button className="btn-primary md:col-span-6" type="submit">Crear caso SGC</button>
          </form>
          <div className="mt-4 grid gap-3">
            {panel.casos.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">Sin casos SGC registrados.</p>
            )}
            {panel.casos.map((caso) => (
              <div key={caso._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{caso.codigo} · {caso.titulo}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">
                      {CASO_TIPO_LABELS[caso.tipo]} · {CASO_ESTADO_LABELS[caso.estado]} · severidad {caso.severidad} · {fmtDate(caso.createdAt)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
                    {caso.responsable}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[var(--foreground)]">{caso.descripcion}</p>
                <div className="mt-2 grid gap-2 text-xs text-[var(--foreground-muted)] md:grid-cols-3">
                  <div>Formato: {caso.formatoRelacionado ?? 'Sin vinculo'}</div>
                  <div>Fecha objetivo: {caso.fechaObjetivo ?? 'Sin fecha'}</div>
                  <div>{caso.cerradoAt ? `Cerrado por ${caso.cerradoBy} en ${fmtDate(caso.cerradoAt)}` : 'Cierre pendiente'}</div>
                </div>
                <form action={actualizarCasoSgcAction} className="mt-3 grid gap-2 md:grid-cols-6">
                  <input type="hidden" name="ronda_id" value={id} />
                  <input type="hidden" name="caso_id" value={caso._id} />
                  <select className="input" name="estado" defaultValue={caso.estado}>
                    <option value="abierto">Abierto</option>
                    <option value="en_revision">En revision</option>
                    <option value="esperando_participante">Esperando participante</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                  <select className="input" name="severidad" defaultValue={caso.severidad}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Critica</option>
                  </select>
                  <input className="input" name="fecha_objetivo" type="date" defaultValue={caso.fechaObjetivo ?? ''} />
                  <input className="input md:col-span-2" name="responsable" defaultValue={caso.responsable} />
                  <button className="btn-outline" type="submit">Actualizar caso</button>
                  <textarea className="input md:col-span-6 min-h-20" name="resolucion" placeholder="Resolucion obligatoria si resuelve o cierra" defaultValue={caso.resolucion ?? ''} />
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Snapshots de registros nativos</h2>
          <div className="mt-4 space-y-3">
            {panel.snapshots.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">Sin snapshots registrados todavia.</p>
            )}
            {panel.snapshots.map((snapshot) => (
              <details key={snapshot._id} className="rounded-lg border border-[var(--border)] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
                  {SNAPSHOT_LABELS[snapshot.tipoRegistro] ?? snapshot.tipoRegistro} v{snapshot.version} · {fmtDate(snapshot.createdAt)}
                </summary>
                <div className="mt-3 grid gap-2 text-sm text-[var(--foreground-muted)] sm:grid-cols-2">
                  <div><span className="font-medium text-[var(--foreground)]">Creado por:</span> {snapshot.createdBy}</div>
                  <div><span className="font-medium text-[var(--foreground)]">Registro:</span> {snapshot.registroId}</div>
                  <div className="sm:col-span-2"><span className="font-medium text-[var(--foreground)]">Resumen:</span> {snapshot.resumen}</div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Bitacora minima</h2>
          <div className="mt-4 space-y-2">
            {panel.audit.map((entry) => (
              <div key={entry._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="font-semibold">{entry.evento}</div>
                <div className="text-[var(--foreground-muted)]">{entry.actor} · {fmtDate(entry.createdAt)} {entry.detalle ? `· ${entry.detalle}` : ''}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
