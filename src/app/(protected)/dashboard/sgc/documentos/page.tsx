import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canEditSgcMaestro, canViewSgcMaestro, requireAuth } from '@/server/auth'
import { normalizeHttpUrl } from '@/lib/safe-url'
import { listSgcMaestro, listSgcMaestroWithStatus, type DocumentoSgc } from '@/server/sgc'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import { DocGrid, driveSplitGrid } from '@/components/ui/drive/DocGrid'
import { DocMetaDot, DocRow } from '@/components/ui/drive/DocRow'
import { DriveBreadcrumb } from '@/components/ui/drive/DriveBreadcrumb'
import { DriveDetailAside } from '@/components/ui/drive/DriveDetailAside'
import { DriveStatsBar } from '@/components/ui/drive/DriveStatsBar'
import { FolderCard } from '@/components/ui/drive/FolderCard'
import type { FileTone } from '@/components/ui/drive/DriveIcons'
import { estadoBadgeTone } from '@/components/ui/drive/estadoTone'
import { guardarDocumentoMaestroAction } from './actions'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function tipoTone(tipo: DocumentoSgc['tipo']): FileTone {
  if (tipo === 'procedimiento') return 'sky'
  if (tipo === 'instructivo') return 'violet'
  if (tipo === 'formato' || tipo === 'registro') return 'emerald'
  if (tipo === 'plantilla') return 'amber'
  return 'slate'
}

function familiaLabel(familia: NonNullable<DocumentoSgc['familia']>) {
  if (familia === 'DG') return 'Documentos generales'
  if (familia === 'P') return 'Procedimientos'
  if (familia === 'I') return 'Instructivos'
  if (familia === 'F') return 'Formatos y registros'
  return 'Otros documentos'
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
  const selectedVersion = selectedDoc ? versionFor(selectedDoc, data.versiones) : null
  const selectedEditableUrl = selectedDoc ? normalizeHttpUrl(selectedDoc.fuenteEditableUrl) : null

  return (
    <div className="grid min-w-0 gap-6">
      <SgcHeader
        title="Centro documental"
        accent="Inventario maestro de documentos SGC"
        description="Las versiones oficiales, registros, normativa y mapa leen estos mismos documentos."
        email={auth.user.email}
        actions={<Link className="btn-outline" href="/dashboard/sgc/documentos">Administrar documentos</Link>}
      />

      {result.offline && (
        <BackendOfflineBanner detail="El centro documental se muestra sin documentos mientras Convex no responde." />
      )}

      <DriveStatsBar
        items={[
          { label: 'Documentos', value: data.resumen.total },
          { label: 'Vigentes', value: data.resumen.vigentes, tone: 'emerald' },
          { label: 'En revision', value: data.resumen.enRevision, tone: 'amber' },
          { label: 'Sin version', value: data.resumen.sinVersion, tone: 'rose' },
        ]}
      />

      <section className="card overflow-hidden">
        <form className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-panel)] px-6 py-3">
          {activeFolder && <input type="hidden" name="carpeta" value={activeFolder.familia} />}
          <input className="input min-w-48 flex-1" name="q" placeholder="Codigo o nombre" defaultValue={firstParam(params.q) ?? ''} />
          <select className="input w-auto" name="familia" defaultValue={firstParam(params.familia) ?? ''}>
            <option value="">Todas las familias</option>
            {data.familias.map((familia) => <option key={familia} value={familia}>{familia}</option>)}
          </select>
          <select className="input w-auto" name="estado" defaultValue={firstParam(params.estado) ?? ''}>
            <option value="">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="en_revision">En revision</option>
            <option value="borrador">Borrador</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
          <button className="btn-outline" type="submit">Filtrar</button>
        </form>

        <DriveBreadcrumb
          rootLabel="Centro documental"
          rootHref={buildDocumentosHref(params, { carpeta: null, doc: null })}
          folderLabel={activeFolder ? familiaLabel(activeFolder.familia) : null}
        />

        {data.documentos.length === 0 && <div className="p-8 text-center text-sm text-[var(--foreground-muted)]">No hay documentos para los filtros seleccionados.</div>}

        {data.documentos.length > 0 && !activeFolder && (
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {carpetas.map(({ familia, documentos }) => {
              const vigentes = documentos.filter((doc) => doc.estado === 'vigente').length
              return (
                <FolderCard
                  key={familia}
                  href={buildDocumentosHref(params, { carpeta: familia, doc: null })}
                  nombre={familiaLabel(familia)}
                  sublabel={`Carpeta · ${documentos.length} documento${documentos.length === 1 ? '' : 's'}`}
                  badge={`${vigentes}/${documentos.length}`}
                />
              )
            })}
          </div>
        )}

        {activeFolder && (
          <div className={selectedDoc ? driveSplitGrid : ''}>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{familiaLabel(activeFolder.familia)}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{activeFolder.familia} · {folderDocs.length} documento{folderDocs.length === 1 ? '' : 's'} filtrado{folderDocs.length === 1 ? '' : 's'}</p>
              </div>
              <DocGrid collapsed={Boolean(selectedDoc)}>
                {folderDocs.map((doc) => {
                  const version = versionFor(doc, data.versiones)
                  const fuenteEditableUrl = normalizeHttpUrl(doc.fuenteEditableUrl)
                  return (
                    <DocRow
                      key={doc._id}
                      href={buildDocumentosHref(params, { carpeta: activeFolder.familia, doc: doc._id })}
                      active={doc._id === selectedDocId}
                      iconTone={tipoTone(doc.tipo)}
                      estado={doc.estado}
                      codigo={doc.codigo}
                      nombre={doc.nombre}
                      meta={
                        <>
                          <span>{doc.tipo}</span>
                          {doc.visibilidad === 'participantes' && <DocMetaDot label="Visible para participantes" tone="violet" />}
                          {doc.criticidad === 'alta' && <DocMetaDot label="Criticidad alta" tone="rose" />}
                          {fuenteEditableUrl && <DocMetaDot label="Editable disponible" tone="sky" />}
                        </>
                      }
                      trailing={version?.vigente && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">v{version.vigente.version}</span>}
                    />
                  )
                })}
              </DocGrid>
            </div>

            {selectedDoc && (
              <DriveDetailAside
                chips={
                  <>
                    <span className="rounded-md bg-[var(--surface-panel)] px-2 py-1 text-xs font-semibold text-slate-700">{selectedDoc.tipo}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoBadgeTone(selectedDoc.estado)}`}>{selectedDoc.estado}</span>
                    <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground-muted)]">{selectedDoc.modoDiligenciamiento ?? 'no_diligenciable'}</span>
                  </>
                }
                codigo={selectedDoc.codigo}
                nombre={selectedDoc.nombre}
                subtitle={<p className="mt-2 text-sm text-[var(--foreground-muted)]">{selectedDoc.ambito ?? 'Sin ambito'} · {selectedDoc.proceso}</p>}
                closeHref={buildDocumentosHref(params, { carpeta: activeFolder.familia, doc: null })}
              >
                <div className="mb-4 flex flex-wrap gap-2">
                  <Link className="btn-primary px-4 py-2 text-sm" href={`/dashboard/sgc/documentos/${selectedDoc._id}`}>Ver ficha</Link>
                  {selectedEditableUrl && <a className="btn-outline px-4 py-2 text-sm" href={selectedEditableUrl} target="_blank" rel="noreferrer">Abrir editable</a>}
                  {selectedVersion?.vigente && (
                    <Link className="btn-outline px-4 py-2 text-sm" href={`/dashboard/sgc/documentos/${selectedDoc._id}/versiones/${selectedVersion.vigente._id}/download`}>
                      Descargar oficial
                    </Link>
                  )}
                </div>

                <dl className="grid gap-4 text-sm">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Version oficial</dt>
                    <dd className="mt-1 text-[var(--foreground)]">
                      {selectedVersion?.vigente ? `v${selectedVersion.vigente.version} · ${selectedVersion.vigente.fileName ?? 'archivo oficial'}${formatBytes(selectedVersion.vigente.size) ? ` · ${formatBytes(selectedVersion.vigente.size)}` : ''}` : 'Sin version registrada'}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Gobierno</dt>
                    <dd className="mt-1 text-[var(--foreground)]">Responsable: {selectedDoc.responsable ?? selectedDoc.propietario}</dd>
                    <dd className="text-[var(--foreground-muted)]">Criticidad: {selectedDoc.criticidad} · Visibilidad: {selectedDoc.visibilidad ?? 'interna'}</dd>
                  </div>
                  {(selectedDoc.notas || selectedDoc.ubicacionFuente || selectedDoc.externalLabel) && (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-3">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Notas</dt>
                      {selectedDoc.notas && <dd className="mt-1 text-[var(--foreground)]">{selectedDoc.notas}</dd>}
                      {selectedDoc.ubicacionFuente && <dd className="mt-1 text-[var(--foreground-muted)]">{selectedDoc.ubicacionFuente}</dd>}
                      {selectedDoc.externalLabel && <dd className="mt-1 text-[var(--foreground-muted)]">{selectedDoc.externalLabel}</dd>}
                    </div>
                  )}
                </dl>
              </DriveDetailAside>
            )}
          </div>
        )}
      </section>

      {canEdit && (
        <details className="card">
          <summary className="cursor-pointer px-5 py-4 text-lg font-semibold text-[var(--foreground)]">Crear documento maestro</summary>
          <form action={guardarDocumentoMaestroAction} className="grid gap-3 border-t border-[var(--border)] p-5 md:grid-cols-3">
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
        </details>
      )}
    </div>
  )
}
