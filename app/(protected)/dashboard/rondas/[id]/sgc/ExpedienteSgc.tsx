import Link from 'next/link'
import { SGC_RONDA_ETAPAS, type SgcFormatoCodigo, type SgcRondaDocumento } from '@/lib/sgc/catalog'
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
  rondaCodigo: string
  selectedFormato: SgcFormatoCodigo | null
}

const FORMATOS_ARCHIVO: SgcFormatoCodigo[] = ['F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-14']
const FORMATOS_JUSTIFICABLES: SgcFormatoCodigo[] = ['F-PSEA-05', 'F-PSEA-05A', 'F-PSEA-12']

const ACTION_LABELS: Partial<Record<SgcFormatoCodigo, string>> = {
  'F-PSEA-03': 'Ver participantes',
  'F-PSEA-05': 'Gestionar participantes',
  'F-PSEA-05A': 'Revisar fichas',
  'F-PSEA-06': 'Completar plan',
  'F-PSEA-07': 'Revisar codigos',
  'F-PSEA-08': 'Subir datos reportados',
  'F-PSEA-09': 'Subir exportacion PT',
  'F-PSEA-10': 'Subir preprocesamiento',
  'F-PSEA-11': 'Revisar H/E',
  'F-PSEA-12': 'Revisar consolidados',
  'F-PSEA-13': 'Completar informe',
  'F-PSEA-14': 'Subir caso SGC',
}

const FORMATO_ANCHORS: Partial<Record<SgcFormatoCodigo, string>> = {
  'F-PSEA-03': 'participantes',
  'F-PSEA-05': 'participantes',
  'F-PSEA-05A': 'participantes',
  'F-PSEA-06': '#plan-ronda',
  'F-PSEA-07': 'participantes',
  'F-PSEA-09': '#formato-F-PSEA-09',
  'F-PSEA-10': '#formato-F-PSEA-10',
  'F-PSEA-11': '#f-psea-11',
  'F-PSEA-12': 'resultados',
  'F-PSEA-13': '#f-psea-13',
  'F-PSEA-14': '#formato-F-PSEA-14',
}

function estadoClasses(estado: string) {
  if (estado === 'completo' || estado === 'no_aplica') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'advertencia') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

function baseClasses(estado: SgcRondaDocumento['estado']) {
  if (estado === 'disponible') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (estado === 'no_aplica') return 'border-slate-200 bg-slate-100 text-slate-700'
  return 'border-amber-200 bg-amber-50 text-amber-800'
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

function EvidenciaControls({
  doc,
  rondaId,
  serie,
  vigente,
}: {
  doc: SgcRondaDocumento
  rondaId: string
  serie: SgcPanel['series'][number]
  vigente: SgcPanel['versiones'][number]['vigente'] | null
}) {
  if (!doc.formatoOperativo) return null
  return (
    <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-white p-3">
      {vigente && (
        <div className="text-xs text-[var(--foreground-muted)]">
          <span className="font-semibold text-[var(--foreground)]">Vigente:</span> v{vigente.version} {vigente.fileName} · {fmtDate(vigente.createdAt)}
        </div>
      )}
      {vigente && (
        <form action={descargarEvidenciaAction}>
          <input type="hidden" name="ronda_id" value={rondaId} />
          <input type="hidden" name="formato_focus" value={doc.formatoOperativo} />
          <input type="hidden" name="evidencia_version_id" value={vigente._id} />
          <button className="btn-outline text-xs" type="submit">Descargar vigente</button>
        </form>
      )}
      <form action={subirEvidenciaAction} className="grid gap-2">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <input type="hidden" name="formato_focus" value={doc.formatoOperativo} />
        <input type="hidden" name="serie_id" value={serie._id} />
        <input id={`archivo-${doc.formatoOperativo}`} className="input" name="archivo" type="file" accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg" />
        <button className="btn-primary justify-self-start text-xs" type="submit">{vigente ? 'Reemplazar evidencia' : 'Registrar evidencia'}</button>
      </form>
      {vigente && (
        <form action={retirarEvidenciaAction} className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input type="hidden" name="ronda_id" value={rondaId} />
          <input type="hidden" name="formato_focus" value={doc.formatoOperativo} />
          <input type="hidden" name="evidencia_version_id" value={vigente._id} />
          <input className="input" name="motivo" placeholder="Motivo obligatorio de retiro" required />
          <button className="btn-outline text-xs" type="submit">Retirar</button>
        </form>
      )}
    </div>
  )
}

export function ExpedienteSgc({ panel, rondaId, rondaCodigo, selectedFormato }: Props) {
  const checklistByCodigo = new Map(panel.checklist.map((item) => [item.codigo, item]))
  const seriesByCodigo = new Map(panel.series.map((serie) => [serie.formato, serie]))
  const versionesBySerie = new Map(panel.versiones.map((version) => [version.serieId, version.vigente]))
  const justificacionesVigentes = new Map(
    panel.justificaciones
      .filter((justificacion) => justificacion.estado === 'vigente')
      .map((justificacion) => [justificacion.formato, justificacion])
  )

  const documentos = SGC_RONDA_ETAPAS.flatMap((seccion) => seccion.documentos)
  const disponibles = documentos.filter((doc) => doc.estado === 'disponible').length
  const operativos = documentos.filter((doc) => doc.formatoOperativo)
  const cubiertos = operativos.filter((doc) => {
    const item = checklistByCodigo.get(doc.formatoOperativo!)
    return item?.estado === 'completo' || item?.estado === 'no_aplica'
  }).length

  return (
    <section className="card overflow-hidden" aria-labelledby="expediente-sgc-title">
      <div className="border-b border-[var(--border)] bg-gradient-to-r from-white to-[var(--pt-primary-subtle)] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{rondaCodigo}</p>
            <h2 id="expediente-sgc-title" className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              Expediente documental de la ronda
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Vista organizada por secciones del expediente. Los formatos disponibles corresponden a los documentos base en
              docs/{rondaCodigo}; los pendientes quedan visibles para no perder cobertura SGC.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2">
              <div className="text-lg font-semibold">{SGC_RONDA_ETAPAS.length}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Secciones</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2">
              <div className="text-lg font-semibold">{disponibles}/{documentos.length}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Base</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2">
              <div className="text-lg font-semibold">{cubiertos}/{operativos.length}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Operativo</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--border)] bg-slate-50 p-4 lg:border-b-0 lg:border-r">
          <div className="sticky top-4 grid gap-2">
            {SGC_RONDA_ETAPAS.map((seccion) => {
              const seccionOperativos = seccion.documentos.filter((doc) => doc.formatoOperativo)
              const seccionCubiertos = seccionOperativos.filter((doc) => {
                const item = checklistByCodigo.get(doc.formatoOperativo!)
                return item?.estado === 'completo' || item?.estado === 'no_aplica'
              }).length
              return (
                <a
                  key={seccion.key}
                  href={`#sgc-seccion-${seccion.key}`}
                  className="rounded-lg border border-transparent px-3 py-2 text-sm transition hover:border-[var(--border)] hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[var(--foreground)]">{seccion.numero}. {seccion.nombre}</span>
                    {seccionOperativos.length > 0 && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground-muted)]">
                        {seccionCubiertos}/{seccionOperativos.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">{seccion.documentos.length} documentos</div>
                </a>
              )
            })}
          </div>
        </aside>

        <div className="grid gap-5 p-5">
          {SGC_RONDA_ETAPAS.map((seccion) => (
            <section key={seccion.key} id={`sgc-seccion-${seccion.key}`} className="rounded-lg border border-[var(--border)] bg-white">
              <div className="border-b border-[var(--border)] px-4 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Seccion {seccion.numero}</div>
                    <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{seccion.nombre}</h3>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{seccion.descripcion}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {seccion.documentos.length} documentos
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {seccion.documentos.map((doc) => {
                  const item = doc.formatoOperativo ? checklistByCodigo.get(doc.formatoOperativo) : null
                  const serie = doc.formatoOperativo ? seriesByCodigo.get(doc.formatoOperativo) : null
                  const vigente = serie ? versionesBySerie.get(serie._id) : null
                  const justificacion = doc.formatoOperativo ? justificacionesVigentes.get(doc.formatoOperativo) : null
                  const isArchivo = doc.formatoOperativo ? FORMATOS_ARCHIVO.includes(doc.formatoOperativo) : false
                  const isJustificable = doc.formatoOperativo ? FORMATOS_JUSTIFICABLES.includes(doc.formatoOperativo) : false
                  const actionHref = doc.formatoOperativo ? getActionHref(rondaId, doc.formatoOperativo) : null
                  const selected = selectedFormato === doc.formatoOperativo

                  return (
                    <article
                      key={`${seccion.key}-${doc.codigo}`}
                      id={doc.formatoOperativo ? `formato-${doc.formatoOperativo}` : undefined}
                      data-testid="expediente-sgc-item"
                      className={[
                        'grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]',
                        selected ? 'bg-amber-50/70 ring-2 ring-inset ring-amber-300' : '',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[var(--foreground)]">{doc.codigo}</span>
                          {item ? (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClasses(item.estado)}`}>{item.estado}</span>
                          ) : (
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${baseClasses(doc.estado)}`}>{doc.estado}</span>
                          )}
                          {item && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.modo}</span>}
                        </div>
                        <h4 className="mt-1 font-medium text-[var(--foreground)]">{doc.nombre}</h4>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{doc.nota}</p>
                        {doc.archivoBase && (
                          <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                            Ubicacion fuente: {seccion.carpeta}/{doc.archivoBase}.md y .docx
                          </p>
                        )}
                        {item && (
                          <div className="mt-3 grid gap-1 text-sm text-[var(--foreground-muted)] sm:grid-cols-2">
                            <div><span className="font-medium text-[var(--foreground)]">Responsable:</span> {item.responsable}</div>
                            <div><span className="font-medium text-[var(--foreground)]">Vinculo:</span> {item.vinculo ?? 'Sin vinculo operativo'}</div>
                            <div className="sm:col-span-2"><span className="font-medium text-[var(--foreground)]">Cobertura:</span> {item.observaciones}</div>
                          </div>
                        )}
                        {justificacion && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            <div className="font-semibold">Justificacion vigente</div>
                            <div>{justificacion.razon}</div>
                            <div className="mt-1 text-xs">Alcance: {justificacion.alcance}</div>
                          </div>
                        )}
                      </div>

                      <div className="grid content-start gap-3">
                        {actionHref && doc.formatoOperativo && (
                          <Link className="btn-outline justify-center text-xs" href={actionHref}>
                            {ACTION_LABELS[doc.formatoOperativo] ?? 'Abrir'}
                          </Link>
                        )}
                        {isArchivo && serie && <EvidenciaControls doc={doc} rondaId={rondaId} serie={serie} vigente={vigente ?? null} />}
                        {isJustificable && doc.formatoOperativo && (
                          <div className="grid gap-2">
                            {!justificacion && (
                              <form action={guardarJustificacionAction} className="grid gap-2">
                                <input type="hidden" name="ronda_id" value={rondaId} />
                                <input type="hidden" name="formato_focus" value={doc.formatoOperativo} />
                                <input type="hidden" name="formato" value={doc.formatoOperativo} />
                                <input className="input" name="alcance" placeholder="Alcance: ronda, participante, envio" defaultValue="ronda" />
                                <input className="input" name="razon" placeholder="Razon documentada" />
                                <button className="btn-primary justify-self-start text-xs" type="submit">Justificar cobertura</button>
                              </form>
                            )}
                            {justificacion && (
                              <form action={retirarJustificacionAction} className="grid gap-2">
                                <input type="hidden" name="ronda_id" value={rondaId} />
                                <input type="hidden" name="formato_focus" value={doc.formatoOperativo} />
                                <input type="hidden" name="justificacion_id" value={justificacion._id} />
                                <input className="input" name="motivo" placeholder="Motivo de retiro" required />
                                <button className="btn-outline justify-self-start text-xs" type="submit">Retirar justificacion</button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
