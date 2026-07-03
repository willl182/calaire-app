import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canEditSgcMaestro, canViewSgcMaestro, requireAuth } from '@/server/auth'
import { normalizeHttpUrl } from '@/lib/safe-url'
import { listSgcMaestro, listSgcMaestroWithStatus, type DocumentoSgc } from '@/server/sgc'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import { guardarDocumentoMaestroAction } from './actions'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function estadoTone(estado: string) {
  if (estado === 'vigente') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'en_revision') return 'bg-amber-100 text-amber-800'
  if (estado === 'obsoleto') return 'bg-slate-200 text-slate-700'
  return 'bg-rose-100 text-rose-800'
}

function tipoTone(tipo: DocumentoSgc['tipo']) {
  if (tipo === 'procedimiento') return 'text-sky-500'
  if (tipo === 'instructivo') return 'text-violet-500'
  if (tipo === 'formato' || tipo === 'registro') return 'text-emerald-500'
  if (tipo === 'plantilla') return 'text-amber-500'
  return 'text-slate-400'
}

function familiaLabel(familia: NonNullable<DocumentoSgc['familia']>) {
  if (familia === 'DG') return 'Documentos generales'
  if (familia === 'P') return 'Procedimientos'
  if (familia === 'I') return 'Instructivos'
  if (familia === 'F') return 'Formatos y registros'
  return 'Otros documentos'
}

function FolderIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 text-sky-500 ${className}`} fill="currentColor">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  )
}

function FileIcon({ tipo, className = 'h-9 w-9' }: { tipo: DocumentoSgc['tipo']; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${tipoTone(tipo)} ${className}`} fill="currentColor">
      <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5z" />
    </svg>
  )
}

function versionFor(doc: DocumentoSgc, versiones: Awaited<ReturnType<typeof listSgcMaestro>>['versiones']) {
  return versiones.find((item) => item.documentoId === doc._id)
}

function buildDocumentosHref(
  params: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | null>
) {
  const search = new URLSearchParams()
  for (const key of ['q', 'familia', 'estado', 'modo']) {
    const value = firstParam(params[key])
    if (value) search.set(key, value)
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) search.set(key, value)
    else search.delete(key)
  }
  const query = search.toString()
  return query ? `/sgc/documentos?${query}` : '/sgc/documentos'
}

function formatBytes(size?: number | null) {
  if (!size) return null
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default async function CentroDocumentalPage({ searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

  const params = (await searchParams) ?? {}
  const result = await listSgcMaestroWithStatus({
    ambito: firstParam(params.ambito) ?? null,
    familia: (firstParam(params.familia) as DocumentoSgc['familia']) ?? null,
    estado: (firstParam(params.estado) as DocumentoSgc['estado']) ?? null,
    modoDiligenciamiento: (firstParam(params.modo) as DocumentoSgc['modoDiligenciamiento']) ?? null,
    texto: firstParam(params.q) ?? null,
  })
  const data = result.data
  const canEdit = canEditSgcMaestro(auth)
  const selectedCarpeta = firstParam(params.carpeta) as NonNullable<DocumentoSgc['familia']> | undefined
  const selectedDocId = firstParam(params.doc) ?? null
  const familiasOrden = ['DG', 'P', 'I', 'F', 'OTRO'] as const
  const documentosPorFamilia = new Map<NonNullable<DocumentoSgc['familia']>, DocumentoSgc[]>()
  for (const familia of familiasOrden) documentosPorFamilia.set(familia, [])
  for (const doc of data.documentos) {
    const familia = doc.familia ?? 'OTRO'
    documentosPorFamilia.set(familia, [...(documentosPorFamilia.get(familia) ?? []), doc])
  }
  const carpetas = familiasOrden
    .map((familia) => ({ familia, documentos: documentosPorFamilia.get(familia) ?? [] }))
    .filter((carpeta) => carpeta.documentos.length > 0)
  const activeFolder = selectedCarpeta ? carpetas.find((carpeta) => carpeta.familia === selectedCarpeta) ?? null : null
  const folderDocs = activeFolder?.documentos ?? []
  const selectedDoc = selectedDocId ? folderDocs.find((doc) => doc._id === selectedDocId) ?? null : null

  return (
    <div className="grid min-w-0 gap-6">
      <SgcHeader
        title="Centro documental"
        accent="Inventario maestro de documentos SGC"
        description="Las versiones oficiales, registros, normativa y mapa leen estos mismos documentos."
        email={auth.user.email}
      />

      {result.offline && (
        <BackendOfflineBanner detail="El centro documental se muestra sin documentos mientras Convex no responde." />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Documentos</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.total}</div>
        </div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Vigentes</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.vigentes}</div>
        </div>
        <div className="card-accent border-l-amber-500 bg-amber-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">En revision</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.enRevision}</div>
        </div>
        <div className="card-accent border-l-rose-500 bg-rose-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Sin version</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.sinVersion}</div>
        </div>
      </section>

      <section className="card p-5">
        <form className="grid gap-3 md:grid-cols-5">
          <input className="input md:col-span-2" name="q" placeholder="Codigo o nombre" defaultValue={firstParam(params.q) ?? ''} />
          <select className="input" name="familia" defaultValue={firstParam(params.familia) ?? ''}>
            <option value="">Todas las familias</option>
            {data.familias.map((familia) => <option key={familia} value={familia}>{familia}</option>)}
          </select>
          <select className="input" name="estado" defaultValue={firstParam(params.estado) ?? ''}>
            <option value="">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="en_revision">En revision</option>
            <option value="borrador">Borrador</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
          <button className="btn-primary" type="submit">Filtrar</button>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border)] bg-white px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Mi unidad</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">Repositorio documental SGC</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <span>Centro documental</span>
                {activeFolder && (
                  <>
                    <span>/</span>
                    <span>{familiaLabel(activeFolder.familia)}</span>
                  </>
                )}
              </div>
            </div>
            <Link className="btn-outline self-start" href="/dashboard/sgc/documentos">Administrar documentos</Link>
          </div>
        </div>

        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-slate-50 px-6 py-3 text-sm">
          <Link href={buildDocumentosHref(params, { carpeta: null, doc: null })} className={`font-semibold ${activeFolder ? 'text-sky-700 hover:underline' : 'text-[var(--foreground)]'}`}>
            Centro documental
          </Link>
          {activeFolder && (
            <>
              <span className="text-[var(--foreground-muted)]">/</span>
              <span className="font-semibold text-[var(--foreground)]">{familiaLabel(activeFolder.familia)}</span>
            </>
          )}
        </nav>

        {data.documentos.length === 0 && <div className="p-8 text-center text-sm text-[var(--foreground-muted)]">No hay documentos para los filtros seleccionados.</div>}

        {data.documentos.length > 0 && !activeFolder && (
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {carpetas.map(({ familia, documentos }) => {
              const vigentes = documentos.filter((doc) => doc.estado === 'vigente').length
              return (
                <Link
                  key={familia}
                  href={buildDocumentosHref(params, { carpeta: familia, doc: null })}
                  className="group overflow-hidden rounded-xl border border-[var(--border)] bg-white transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="relative flex h-36 items-center justify-center bg-slate-50">
                    <FolderIcon className="h-16 w-16 transition group-hover:scale-105" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground-muted)] shadow-sm">
                      {vigentes}/{documentos.length}
                    </span>
                  </div>
                  <div className="border-t border-[var(--border)] px-4 py-3">
                    <div className="truncate font-semibold text-[var(--foreground)]">{familiaLabel(familia)}</div>
                    <div className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">
                      Carpeta · {documentos.length} documento{documentos.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {activeFolder && (
          <div className={`grid gap-0 ${selectedDoc ? 'lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]' : ''}`}>
            <div className="p-6">
              <Link
                href={buildDocumentosHref(params, { carpeta: null, doc: null })}
                className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-sky-300 hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Volver al centro documental
              </Link>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{familiaLabel(activeFolder.familia)}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{activeFolder.familia} · {folderDocs.length} documento{folderDocs.length === 1 ? '' : 's'} filtrado{folderDocs.length === 1 ? '' : 's'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {folderDocs.map((doc) => {
                  const active = doc._id === selectedDocId
                  const version = versionFor(doc, data.versiones)
                  const fuenteEditableUrl = normalizeHttpUrl(doc.fuenteEditableUrl)
                  return (
                    <Link
                      key={doc._id}
                      href={buildDocumentosHref(params, { carpeta: activeFolder.familia, doc: doc._id })}
                      aria-current={active ? 'true' : undefined}
                      className={`group overflow-hidden rounded-xl border bg-white transition hover:shadow-md ${active ? 'border-sky-400 ring-2 ring-sky-200' : 'border-[var(--border)] hover:border-sky-300'}`}
                    >
                      <div className="relative flex h-32 items-center justify-center bg-slate-50">
                        <FileIcon tipo={doc.tipo} className="h-14 w-14 transition group-hover:scale-105" />
                        <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${estadoTone(doc.estado)}`}>{doc.estado}</span>
                      </div>
                      <div className="border-t border-[var(--border)] px-4 py-3">
                        <div className="truncate text-sm font-semibold text-[var(--foreground)]">{doc.codigo}</div>
                        <div className="line-clamp-1 text-xs text-[var(--foreground-muted)]">{doc.nombre}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {fuenteEditableUrl && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">Editable</span>}
                          {version?.vigente && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">v{version.vigente.version}</span>}
                          {doc.visibilidad === 'participantes' && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">Participantes</span>}
                          {doc.criticidad === 'alta' && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">Critico</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {selectedDoc && (
              <aside className="border-t border-[var(--border)] bg-slate-50 p-5 lg:border-l lg:border-t-0">
                <div className="sticky top-24">
                  {(() => {
                    const version = versionFor(selectedDoc, data.versiones)
                    const fuenteEditableUrl = normalizeHttpUrl(selectedDoc.fuenteEditableUrl)
                    return (
                      <>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">{selectedDoc.tipo}</span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoTone(selectedDoc.estado)}`}>{selectedDoc.estado}</span>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--foreground-muted)]">{selectedDoc.modoDiligenciamiento ?? 'no_diligenciable'}</span>
                            </div>
                            <h4 className="mt-2 font-semibold text-[var(--foreground)]">{selectedDoc.codigo}</h4>
                            <p className="mt-1 text-sm text-[var(--foreground)]">{selectedDoc.nombre}</p>
                            <p className="mt-2 text-sm text-[var(--foreground-muted)]">{selectedDoc.ambito ?? 'Sin ambito'} · {selectedDoc.proceso}</p>
                          </div>
                          <Link href={buildDocumentosHref(params, { carpeta: activeFolder.familia, doc: null })} className="shrink-0 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--foreground-muted)] hover:bg-slate-100" aria-label="Cerrar detalle">
                            Cerrar
                          </Link>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2">
                          <Link className="btn-primary px-3 py-1 text-xs" href={`/dashboard/sgc/documentos/${selectedDoc._id}`}>Ver ficha</Link>
                          {fuenteEditableUrl && <a className="btn-outline px-3 py-1 text-xs" href={fuenteEditableUrl} target="_blank" rel="noreferrer">Abrir editable</a>}
                          {version?.vigente && (
                            <Link className="btn-outline px-3 py-1 text-xs" href={`/dashboard/sgc/documentos/${selectedDoc._id}/versiones/${version.vigente._id}/download`}>
                              Descargar oficial
                            </Link>
                          )}
                        </div>

                        <dl className="grid gap-3 text-sm">
                          <div className="rounded-lg border border-[var(--border)] bg-white p-3">
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Version oficial</dt>
                            <dd className="mt-1 text-[var(--foreground)]">
                              {version?.vigente ? `v${version.vigente.version} · ${version.vigente.fileName ?? 'archivo oficial'}${formatBytes(version.vigente.size) ? ` · ${formatBytes(version.vigente.size)}` : ''}` : 'Sin version registrada'}
                            </dd>
                          </div>
                          <div className="rounded-lg border border-[var(--border)] bg-white p-3">
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Gobierno</dt>
                            <dd className="mt-1 text-[var(--foreground)]">Responsable: {selectedDoc.responsable ?? selectedDoc.propietario}</dd>
                            <dd className="text-[var(--foreground-muted)]">Criticidad: {selectedDoc.criticidad} · Visibilidad: {selectedDoc.visibilidad ?? 'interna'}</dd>
                          </div>
                          {(selectedDoc.notas || selectedDoc.ubicacionFuente || selectedDoc.externalLabel) && (
                            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
                              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Notas</dt>
                              {selectedDoc.notas && <dd className="mt-1 text-[var(--foreground)]">{selectedDoc.notas}</dd>}
                              {selectedDoc.ubicacionFuente && <dd className="mt-1 text-[var(--foreground-muted)]">{selectedDoc.ubicacionFuente}</dd>}
                              {selectedDoc.externalLabel && <dd className="mt-1 text-[var(--foreground-muted)]">{selectedDoc.externalLabel}</dd>}
                            </div>
                          )}
                        </dl>
                      </>
                    )
                  })()}
                </div>
              </aside>
            )}
          </div>
        )}
      </section>

      {canEdit && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold">Crear documento maestro</h2>
          <form action={guardarDocumentoMaestroAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <input className="input" name="codigo" placeholder="Codigo" required />
            <input className="input md:col-span-2" name="nombre" placeholder="Nombre" required />
            <select className="input" name="familia" defaultValue="F">
              <option value="DG">DG</option>
              <option value="P">P</option>
              <option value="I">I</option>
              <option value="F">F</option>
              <option value="OTRO">OTRO</option>
            </select>
            <input className="input" name="ambito" defaultValue="PEA / ISO 17043" />
            <input className="input" name="proceso" defaultValue="SGC" />
            <select className="input" name="estado" defaultValue="borrador">
              <option value="borrador">Borrador</option>
              <option value="en_revision">En revision</option>
              <option value="vigente">Vigente</option>
              <option value="obsoleto">Obsoleto</option>
            </select>
            <select className="input" name="modo_diligenciamiento" defaultValue="solo_archivo">
              <option value="no_diligenciable">No diligenciable</option>
              <option value="solo_archivo">Solo archivo</option>
              <option value="ui_nativo">UI nativo</option>
              <option value="ui_nativo_exportable">UI nativo exportable</option>
            </select>
            <select className="input" name="visibilidad" defaultValue="interna">
              <option value="interna">Interna</option>
              <option value="participantes">Participantes</option>
              <option value="publica">Publica</option>
            </select>
            <select className="input" name="modo_control" defaultValue="app_oficial">
              <option value="app_oficial">App oficial</option>
              <option value="mixto">Mixto</option>
              <option value="externo_referenciado">Externo referenciado</option>
            </select>
            <input className="input" name="responsable" placeholder="Responsable" />
            <input className="input md:col-span-2" name="fuente_editable_url" placeholder="URL editable opcional" />
            <textarea className="input md:col-span-3" name="notas" placeholder="Notas" rows={3} />
            <button className="btn-primary justify-self-start" type="submit">Guardar documento</button>
          </form>
        </section>
      )}
    </div>
  )
}
