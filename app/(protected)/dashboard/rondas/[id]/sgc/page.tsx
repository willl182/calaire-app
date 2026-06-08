import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Alert } from '@/app/(protected)/dashboard/components/Alert'
import { EstadoBadge } from '@/app/(protected)/dashboard/components/EstadoBadge'
import { isAdmin, requireAuth } from '@/lib/auth'
import { getRonda } from '@/lib/rondas'
import { SGC_LEYENDA_CODIGO_PROVISIONAL } from '@/lib/sgc/catalog'
import { getPanelSgc, inicializarPanelSgc } from '@/lib/sgc'
import { RondaContextNav } from '../RondaContextNav'
import {
  actualizarHitoRondaAction,
  crearHitoRondaAction,
  descargarEvidenciaAction,
  finalizarPlanRondaAction,
  finalizarRevisionDatosAction,
  guardarJustificacionAction,
  guardarPlanRondaAction,
  guardarRevisionDatosAction,
  retirarJustificacionAction,
  retirarEvidenciaAction,
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

  const success = getParam(query.success)
  const error = getParam(query.error)
  const progreso = panel.checklist.length === 0
    ? 0
    : Math.round((panel.checklist.filter((item) => item.estado === 'completo' || item.estado === 'no_aplica').length / panel.checklist.length) * 100)
  const planBloques = panel.plan?.bloques ?? {}
  const planCampos = panel.plan?.camposEstructurados ?? {}
  const revisionChecks = panel.revision?.checks ?? {}
  const revisionMetricas = { ...panel.metricasActuales, ...(panel.revision?.metricas ?? {}) }
  const metricKeys = Object.keys(METRIC_LABELS)
  const checkKeys = Object.keys(CHECK_LABELS)

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
              <Link key={name} className="btn-outline" href={`/sgc/templates/p20/${name}.md`}>{name}</Link>
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
