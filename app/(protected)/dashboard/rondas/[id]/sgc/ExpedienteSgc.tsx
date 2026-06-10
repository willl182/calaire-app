import Link from 'next/link'
import { SGC_FORMATOS_FASE_1, type SgcFase, type SgcFormatoCodigo } from '@/lib/sgc/catalog'
import type { SgcPanel } from '@/lib/sgc'
import {
  descargarEvidenciaAction,
  guardarJustificacionAction,
  retirarEvidenciaAction,
  retirarJustificacionAction,
  subirEvidenciaAction,
} from './actions'

type Props = {
  panel: SgcPanel
  rondaId: string
  selectedFormato: SgcFormatoCodigo | null
}

const FASE_LABELS: Record<SgcFase, string> = {
  planeacion: 'Planeacion',
  convocatoria: 'Convocatoria',
  ejecucion: 'Ejecucion',
  evaluacion: 'Evaluacion',
  cierre: 'Cierre',
}

const FASES: SgcFase[] = ['planeacion', 'convocatoria', 'ejecucion', 'evaluacion', 'cierre']
const FORMATOS_ARCHIVO: SgcFormatoCodigo[] = ['F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-14']
const FORMATOS_JUSTIFICABLES: SgcFormatoCodigo[] = ['F-PSEA-05', 'F-PSEA-05A', 'F-PSEA-12']

const FORMATO_ANCHORS: Partial<Record<SgcFormatoCodigo, string>> = {
  'F-PPSEA-03': '#plan-ronda',
  'F-PSEA-06': '#plan-ronda',
  'F-PSEA-05': 'participantes',
  'F-PSEA-05A': 'participantes',
  'F-PSEA-07': 'participantes',
  'F-PSEA-08': '#f-psea-08',
  'F-PSEA-11': '#f-psea-13',
  'F-PSEA-12': 'resultados',
  'F-PSEA-13': '#f-psea-13',
}

const ACTION_LABELS: Record<SgcFormatoCodigo, string> = {
  'F-PPSEA-03': 'Completar plan',
  'F-PSEA-05': 'Gestionar participantes',
  'F-PSEA-05A': 'Revisar fichas',
  'F-PSEA-06': 'Completar plan operativo',
  'F-PSEA-07': 'Revisar codigos',
  'F-PSEA-08': 'Revisar F-PSEA-08',
  'F-PSEA-09': 'Subir evidencia',
  'F-PSEA-10': 'Subir evidencia',
  'F-PSEA-11': 'Marcar no aplica',
  'F-PSEA-12': 'Revisar envios',
  'F-PSEA-13': 'Completar revision',
  'F-PSEA-14': 'Subir evidencia',
}

function estadoClasses(estado: string) {
  if (estado === 'completo' || estado === 'no_aplica') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'advertencia') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

function fmtDate(ms?: number | null) {
  if (!ms) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms))
}

function getActionHref(rondaId: string, codigo: SgcFormatoCodigo) {
  const anchor = FORMATO_ANCHORS[codigo]
  if (!anchor) return null
  if (anchor.startsWith('#')) return `/dashboard/rondas/${rondaId}/sgc${anchor}`
  return `/dashboard/rondas/${rondaId}/${anchor}`
}

export function ExpedienteSgc({ panel, rondaId, selectedFormato }: Props) {
  const checklistByCodigo = new Map(panel.checklist.map((item) => [item.codigo, item]))
  const seriesByCodigo = new Map(panel.series.map((serie) => [serie.formato, serie]))
  const versionesBySerie = new Map(panel.versiones.map((version) => [version.serieId, version.vigente]))
  const justificacionesVigentes = new Map(
    panel.justificaciones
      .filter((justificacion) => justificacion.estado === 'vigente')
      .map((justificacion) => [justificacion.formato, justificacion])
  )

  return (
    <section className="card p-6" aria-labelledby="expediente-sgc-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 id="expediente-sgc-title" className="text-lg font-semibold text-[var(--foreground)]">Expediente SGC</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Formatos documentales de la ronda agrupados por fase, con acciones operativas segun el estado calculado.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {panel.checklist.length} formatos
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {FASES.map((fase) => {
          const formatos = SGC_FORMATOS_FASE_1.filter((formato) => formato.fase === fase)
          return (
            <div key={fase} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{FASE_LABELS[fase]}</h3>
              <div className="grid gap-3">
                {formatos.map((formato) => {
                  const item = checklistByCodigo.get(formato.codigo)
                  if (!item) return null
                  const selected = selectedFormato === formato.codigo
                  const serie = seriesByCodigo.get(formato.codigo)
                  const vigente = serie ? versionesBySerie.get(serie._id) : null
                  const justificacion = justificacionesVigentes.get(formato.codigo)
                  const isArchivo = FORMATOS_ARCHIVO.includes(formato.codigo)
                  const isJustificable = FORMATOS_JUSTIFICABLES.includes(formato.codigo)
                  const actionHref = getActionHref(rondaId, formato.codigo)
                  const expanded = selected || item.estado === 'pendiente'

                  return (
                    <details
                      key={formato.codigo}
                      id={`formato-${formato.codigo}`}
                      data-testid="expediente-sgc-item"
                      className={[
                        'rounded-lg border p-4',
                        selected ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-200' : 'border-[var(--border)] bg-[var(--card)]',
                      ].join(' ')}
                      open={expanded}
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[var(--foreground)]">{item.codigo}</span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClasses(item.estado)}`}>{item.estado}</span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.modo}</span>
                            </div>
                            <div className="mt-1 font-medium text-[var(--foreground)]">{item.nombre}</div>
                            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{item.observaciones}</p>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {actionHref && (
                              <Link className="btn-outline text-xs" href={actionHref}>{ACTION_LABELS[item.codigo]}</Link>
                            )}
                          </div>
                        </div>
                      </summary>

                      <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 text-sm lg:grid-cols-[1fr_1.1fr]">
                        <div className="space-y-2 text-[var(--foreground-muted)]">
                          <div><span className="font-medium text-[var(--foreground)]">Responsable:</span> {item.responsable}</div>
                          <div><span className="font-medium text-[var(--foreground)]">Vinculo:</span> {item.vinculo ?? 'Sin vinculo'}</div>
                          <div><span className="font-medium text-[var(--foreground)]">Actualizacion:</span> {item.ultimaActualizacion ? fmtDate(Date.parse(item.ultimaActualizacion)) : 'Sin registro'}</div>
                          {vigente && (
                            <div><span className="font-medium text-[var(--foreground)]">Vigente:</span> v{vigente.version} {vigente.fileName}</div>
                          )}
                          {justificacion && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                              <div className="font-semibold">Justificacion vigente</div>
                              <div>{justificacion.razon}</div>
                              <div className="mt-1 text-xs">Alcance: {justificacion.alcance}</div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {isArchivo && serie && (
                            <div className="space-y-3">
                              {vigente && (
                                <form action={descargarEvidenciaAction}>
                                  <input type="hidden" name="ronda_id" value={rondaId} />
                                  <input type="hidden" name="formato_focus" value={formato.codigo} />
                                  <input type="hidden" name="evidencia_version_id" value={vigente._id} />
                                  <button className="btn-outline text-xs" type="submit">Descargar vigente</button>
                                </form>
                              )}
                              <form action={subirEvidenciaAction} className="grid gap-2">
                                <input type="hidden" name="ronda_id" value={rondaId} />
                                <input type="hidden" name="formato_focus" value={formato.codigo} />
                                <input type="hidden" name="serie_id" value={serie._id} />
                                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]" htmlFor={`archivo-${formato.codigo}`}>
                                  {vigente ? 'Reemplazar evidencia' : 'Subir evidencia'}
                                </label>
                                <input id={`archivo-${formato.codigo}`} className="input" name="archivo" type="file" accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg" />
                                <button className="btn-primary justify-self-start text-xs" type="submit">{vigente ? 'Reemplazar version' : 'Registrar evidencia'}</button>
                              </form>
                              {vigente && (
                                <form action={retirarEvidenciaAction} className="grid gap-2">
                                  <input type="hidden" name="ronda_id" value={rondaId} />
                                  <input type="hidden" name="formato_focus" value={formato.codigo} />
                                  <input type="hidden" name="evidencia_version_id" value={vigente._id} />
                                  <input className="input" name="motivo" placeholder="Motivo obligatorio de retiro" />
                                  <button className="btn-outline justify-self-start text-xs" type="submit">Retirar vigente</button>
                                </form>
                              )}
                            </div>
                          )}

                          {isJustificable && (
                            <div className="grid gap-2">
                              {!justificacion && (
                                <form action={guardarJustificacionAction} className="grid gap-2">
                                  <input type="hidden" name="ronda_id" value={rondaId} />
                                  <input type="hidden" name="formato_focus" value={formato.codigo} />
                                  <input type="hidden" name="formato" value={formato.codigo} />
                                  <input className="input" name="alcance" placeholder="Alcance: ronda, participante, envio" defaultValue="ronda" />
                                  <input className="input" name="razon" placeholder="Razon documentada" />
                                  <button className="btn-primary justify-self-start text-xs" type="submit">Justificar</button>
                                </form>
                              )}
                              {justificacion && (
                                <form action={retirarJustificacionAction} className="grid gap-2">
                                  <input type="hidden" name="ronda_id" value={rondaId} />
                                  <input type="hidden" name="formato_focus" value={formato.codigo} />
                                  <input type="hidden" name="justificacion_id" value={justificacion._id} />
                                  <input className="input" name="motivo" placeholder="Motivo de retiro" />
                                  <button className="btn-outline justify-self-start text-xs" type="submit">Retirar justificacion</button>
                                </form>
                              )}
                            </div>
                          )}

                          {!isArchivo && !isJustificable && actionHref && (
                            <Link className="btn-outline text-xs" href={actionHref}>{ACTION_LABELS[item.codigo]}</Link>
                          )}
                        </div>
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
