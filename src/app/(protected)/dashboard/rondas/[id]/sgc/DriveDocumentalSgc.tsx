import Link from 'next/link'
import type { ReactNode } from 'react'
import { CopyInvitationLinkButton } from '@/components/ui/CopyInvitationLinkButton'
import { DocGrid, driveSplitGrid } from '@/components/ui/drive/DocGrid'
import { DocMetaDot, DocRow } from '@/components/ui/drive/DocRow'
import { DriveBreadcrumb } from '@/components/ui/drive/DriveBreadcrumb'
import { DriveDetailAside } from '@/components/ui/drive/DriveDetailAside'
import { DriveStatsBar } from '@/components/ui/drive/DriveStatsBar'
import { FolderCard } from '@/components/ui/drive/FolderCard'
import type { FileTone } from '@/components/ui/drive/DriveIcons'
import { estadoBadgeTone } from '@/components/ui/drive/estadoTone'
import type { SgcDriveRecurso, SgcDriveTree, SgcPanel } from '@/server/sgc'
import { SgcRegistroDiligenciable } from './SgcRegistroDiligenciable'
import {
  cambiarEstadoDriveAction,
  cambiarVisibilidadDriveAction,
  crearDriveGoogleAction,
  guardarDriveDefinitivoAction,
  guardarDriveEditableAction,
  inicializarDriveRondaAction,
  reemplazarDriveRecursoAction,
  retirarDriveRecursoAction,
  subirDriveDefinitivoAction,
} from './actions'

type Props = {
  drive: SgcDriveTree
  panel: SgcPanel
  rondaId: string
  rondaCodigo: string
  rondaNombre: string
  driveGoogleReady: boolean
  driveGoogleConfig: {
    clientEmail: boolean
    privateKey: boolean
    rootFolderId: boolean
    templateMap: boolean
    sharedDriveId: boolean
  }
  selectedCarpeta: string | null
  selectedDocId: string | null
}

function tipoTone(tipo: SgcDriveRecurso['tipo']): FileTone {
  if (tipo === 'hoja_calculo') return 'emerald'
  if (tipo === 'pdf') return 'rose'
  if (tipo === 'enlace') return 'violet'
  return 'slate'
}

const ESTADO_LABELS: Record<SgcDriveRecurso['estado'], string> = {
  pendiente: 'Pendiente',
  creado: 'Creado',
  diligenciado: 'Diligenciado',
  reemplazado: 'Reemplazado',
  retirado: 'Retirado',
  no_aplica: 'No aplica',
}

function tipoLabel(tipo: SgcDriveRecurso['tipo']) {
  if (tipo === 'hoja_calculo') return 'Hoja'
  return tipo.charAt(0).toUpperCase() + tipo.slice(1)
}

function fmtDate(ms?: number | null) {
  if (!ms) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms))
}

function childrenOf(recursos: SgcDriveRecurso[], parentId: string | null) {
  return recursos
    .filter((recurso) => (recurso.parentId ?? null) === parentId)
    .sort((a, b) => {
      if (a.tipo === 'carpeta' && b.tipo !== 'carpeta') return -1
      if (a.tipo !== 'carpeta' && b.tipo === 'carpeta') return 1
      return a.codigo.localeCompare(b.codigo)
    })
}

function HiddenRecursoFields({ recurso, rondaId }: { recurso: SgcDriveRecurso; rondaId: string }) {
  return (
    <>
      <input type="hidden" name="ronda_id" value={rondaId} />
      <input type="hidden" name="recurso_id" value={recurso._id} />
      <input type="hidden" name="parent_id" value={recurso.parentId ?? ''} />
      <input type="hidden" name="codigo" value={recurso.codigo} />
      <input type="hidden" name="nombre" value={recurso.nombre} />
      <input type="hidden" name="fase" value={recurso.fase ?? ''} />
      <input type="hidden" name="tipo" value={recurso.tipo} />
      <input type="hidden" name="formato_relacionado" value={recurso.formatoRelacionado ?? ''} />
      <input type="hidden" name="template_url" value={recurso.templateUrl ?? ''} />
    </>
  )
}

function LinkActions({ recurso }: { recurso: SgcDriveRecurso }) {
  return (
    <div className="flex flex-wrap gap-2">
      {recurso.webUrl && (
        <>
          <Link className="btn-outline px-3 py-1 text-xs" href={recurso.webUrl} target="_blank" rel="noreferrer">
            Abrir editable
          </Link>
          <CopyInvitationLinkButton url={recurso.webUrl} />
        </>
      )}
      {recurso.definitivo && 'webUrl' in recurso.definitivo && (
        <Link className="btn-outline px-3 py-1 text-xs" href={recurso.definitivo.webUrl} target="_blank" rel="noreferrer">
          Abrir definitivo
        </Link>
      )}
      {recurso.definitivo && 'storageId' in recurso.definitivo && (
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Archivo cargado{recurso.definitivo.fileName ? `: ${recurso.definitivo.fileName}` : ''}
        </span>
      )}
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-lg border border-[var(--border)] bg-white">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
        {title}
      </summary>
      <div className="border-t border-[var(--border)] p-3">{children}</div>
    </details>
  )
}

function RecursoForms({ recurso, rondaId }: { recurso: SgcDriveRecurso; rondaId: string }) {
  return (
    <div className="grid gap-2">
      <FormSection title={recurso.webUrl ? 'Reemplazar enlace editable' : 'Enlace editable'}>
        {!recurso.webUrl ? (
          <form action={guardarDriveEditableAction} className="grid gap-2">
            <HiddenRecursoFields recurso={recurso} rondaId={rondaId} />
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px]">
              <input id={`web-url-${recurso._id}`} className="input" name="web_url" type="url" placeholder="https://drive.google.com/..." required />
              <button className="btn-primary px-3 text-xs" type="submit">Registrar</button>
            </div>
            <input className="input" name="notas" placeholder="Notas" defaultValue={recurso.notas ?? ''} />
          </form>
        ) : (
          <form action={reemplazarDriveRecursoAction} className="grid gap-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input type="hidden" name="tipo" value={recurso.tipo} />
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px]">
              <input id={`replace-url-${recurso._id}`} className="input" name="web_url" type="url" placeholder="Nueva URL de Drive" required />
              <button className="btn-outline px-3 text-xs" type="submit">Reemplazar</button>
            </div>
            <input className="input" name="motivo" placeholder="Motivo obligatorio de reemplazo" required />
          </form>
        )}
      </FormSection>

      {recurso.tipo !== 'carpeta' && (
        <FormSection title="Version definitiva">
          <div className="grid gap-3">
            <form action={guardarDriveDefinitivoAction} className="grid gap-2">
              <HiddenRecursoFields recurso={recurso} rondaId={rondaId} />
              <input type="hidden" name="web_url" value={recurso.webUrl ?? ''} />
              <input type="hidden" name="notas" value={recurso.notas ?? ''} />
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]" htmlFor={`def-url-${recurso._id}`}>
                Enlace
              </label>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_96px_120px]">
                <input id={`def-url-${recurso._id}`} className="input" name="definitivo_url" type="url" placeholder="URL PDF o copia final" defaultValue={recurso.definitivo && 'webUrl' in recurso.definitivo ? recurso.definitivo.webUrl : ''} />
                <select className="input" name="definitivo_tipo" defaultValue={recurso.definitivo?.tipo ?? 'pdf'}>
                  <option value="pdf">PDF</option>
                  <option value="documento">Doc</option>
                  <option value="archivo">Archivo</option>
                </select>
                <button className="btn-outline px-3 text-xs" type="submit">Guardar</button>
              </div>
            </form>

            <form action={subirDriveDefinitivoAction} className="grid gap-2">
              <HiddenRecursoFields recurso={recurso} rondaId={rondaId} />
              <input type="hidden" name="web_url" value={recurso.webUrl ?? ''} />
              <input type="hidden" name="notas" value={recurso.notas ?? ''} />
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]" htmlFor={`def-file-${recurso._id}`}>
                Cargar archivo
              </label>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_96px_120px]">
                <input id={`def-file-${recurso._id}`} className="input" name="archivo" type="file" required />
                <select className="input" name="definitivo_tipo" defaultValue="pdf">
                  <option value="pdf">PDF</option>
                  <option value="documento">Doc</option>
                  <option value="archivo">Archivo</option>
                </select>
                <button className="btn-outline px-3 text-xs" type="submit">Cargar</button>
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">
                El participante lo descarga desde la app (solo lectura); no requiere permisos ni cuenta de Google Drive.
              </p>
            </form>
          </div>
        </FormSection>
      )}

      <FormSection title="Estado">
        <div className="grid gap-2 md:grid-cols-3">
          <form action={cambiarEstadoDriveAction}>
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input type="hidden" name="estado" value="diligenciado" />
            <button className="btn-outline w-full px-3 text-xs" type="submit" disabled={!recurso.webUrl || recurso.estado === 'diligenciado'}>
              Marcar diligenciado
            </button>
          </form>
          <form action={cambiarEstadoDriveAction} className="grid gap-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input type="hidden" name="estado" value="no_aplica" />
            <input className="input" name="notas" placeholder="Justificacion no aplica" required />
            <button className="btn-outline px-3 text-xs" type="submit">No aplica</button>
          </form>
          <form action={retirarDriveRecursoAction} className="grid gap-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input className="input" name="motivo" placeholder="Motivo de retiro" required />
            <button className="btn-outline px-3 text-xs" type="submit">Retirar</button>
          </form>
        </div>
      </FormSection>

      {recurso.tipo !== 'carpeta' && (
        <FormSection title="Visibilidad">
          <form action={cambiarVisibilidadDriveAction} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-slate-50 px-3 py-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input type="hidden" name="publica_participante" value={recurso.publicaParticipante ? 'false' : 'true'} />
            <div>
              <div className="text-xs font-semibold text-[var(--foreground)]">Visible para participantes</div>
              <div className="text-xs text-[var(--foreground-muted)]">
                {recurso.publicaParticipante ? 'Publicado explicitamente' : 'Interno por defecto'}
              </div>
              {recurso.publicaParticipante && (
                <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                  El participante solo ve el archivo que usted cargue como documento definitivo en la
                  app; no recibe enlaces de Drive. Sin archivo cargado, este documento no le aparece.
                </div>
              )}
              {recurso.evidenciaSerieId && (
                <div className="mt-1 text-xs text-amber-700">
                  Esta accion aplica a todos los documentos Drive de la misma serie.
                </div>
              )}
            </div>
            <button className="btn-outline px-3 text-xs" type="submit">
              {recurso.publicaParticipante ? 'Despublicar' : 'Publicar'}
            </button>
          </form>
        </FormSection>
      )}
    </div>
  )
}


export function DriveDocumentalSgc({ drive, panel, rondaId, rondaCodigo, rondaNombre, driveGoogleReady, driveGoogleConfig, selectedCarpeta, selectedDocId }: Props) {
  const root = drive.root
  const recursos = drive.recursos
  const folders = root ? childrenOf(recursos, root._id).filter((recurso) => recurso.tipo === 'carpeta') : []
  const documentos = recursos.filter((recurso) => recurso.tipo !== 'carpeta')
  const completados = documentos.filter((recurso) => recurso.estado === 'diligenciado' || recurso.estado === 'no_aplica').length
  const conEditable = documentos.filter((recurso) => Boolean(recurso.webUrl)).length
  const conDefinitivo = documentos.filter((recurso) => Boolean(recurso.definitivo)).length

  const basePath = `/dashboard/rondas/${rondaId}/sgc`
  const activeFolder = folders.find((folder) => folder.codigo === selectedCarpeta) ?? null
  const folderDocs = activeFolder ? childrenOf(recursos, activeFolder._id).filter((recurso) => recurso._id !== activeFolder._id) : []
  const selectedDoc = activeFolder ? folderDocs.find((recurso) => recurso._id === selectedDocId) ?? null : null

  return (
    <section className="card overflow-hidden" aria-labelledby="drive-documental-title">
      <div className="border-b border-[var(--border)] bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{rondaCodigo}</p>
            <h2 id="drive-documental-title" className="mt-1 text-xl font-semibold text-[var(--foreground)]">Drive documental SGC</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {driveGoogleReady && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Drive conectado</span>
            )}
            <form action={inicializarDriveRondaAction}>
              <input type="hidden" name="ronda_id" value={rondaId} />
              <button className="btn-outline" type="submit">{root ? 'Reparar expediente' : 'Inicializar expediente documental'}</button>
            </form>
            <form action={crearDriveGoogleAction}>
              <input type="hidden" name="ronda_id" value={rondaId} />
              <input type="hidden" name="ronda_codigo" value={rondaCodigo} />
              <input type="hidden" name="ronda_nombre" value={rondaNombre} />
              <button className="btn-primary" type="submit" disabled={!driveGoogleReady}>Crear en Google Drive</button>
            </form>
          </div>
        </div>

        {!driveGoogleReady && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-semibold">Automatizacion Google Drive pendiente de configuracion</div>
            <div className="mt-1">
              Cuenta: {driveGoogleConfig.clientEmail ? 'configurada' : 'faltante'} · Llave: {driveGoogleConfig.privateKey ? 'configurada' : 'faltante'} · Raiz: {driveGoogleConfig.rootFolderId ? 'configurada' : 'faltante'} · Plantillas: {driveGoogleConfig.templateMap ? 'mapeadas' : 'sin mapa'}
            </div>
          </div>
        )}

        <div className="mt-4">
          <DriveStatsBar
            items={[
              { label: 'Carpetas', value: folders.length },
              { label: 'Editables', value: `${conEditable}/${documentos.length}`, tone: 'sky' },
              { label: 'Cubiertos', value: `${completados}/${documentos.length}`, tone: 'emerald' },
              { label: 'Definitivos', value: `${conDefinitivo}/${documentos.length}`, tone: 'emerald' },
            ]}
          />
        </div>

        {root && (
          <details className="mt-4 rounded-lg border border-[var(--border)] bg-slate-50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Administrar carpeta raiz</summary>
            <div className="border-t border-[var(--border)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--foreground-muted)]">{root.driveFolderId ?? 'Sin folderId registrado'}</div>
                <LinkActions recurso={root} />
              </div>
              <RecursoForms recurso={root} rondaId={rondaId} />
            </div>
          </details>
        )}
      </div>

      {!root && (
        <div className="px-6 py-8 text-sm text-[var(--foreground-muted)]">
          Inicializa el expediente para crear el arbol virtual de carpetas y documentos esperados de esta ronda.
        </div>
      )}

      {root && (
        <div>
          <DriveBreadcrumb
            rootLabel={`Expediente ${rondaCodigo}`}
            rootHref={basePath}
            folderLabel={activeFolder?.nombre ?? null}
          />

          {!activeFolder ? (
            /* Nivel raiz: tarjetas de carpeta */
            <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => {
                const folderChildren = childrenOf(recursos, folder._id).filter((recurso) => recurso.tipo !== 'carpeta')
                const folderDone = folderChildren.filter((recurso) => recurso.estado === 'diligenciado' || recurso.estado === 'no_aplica').length
                return (
                  <FolderCard
                    key={folder._id}
                    href={`${basePath}?carpeta=${encodeURIComponent(folder.codigo)}`}
                    nombre={folder.nombre}
                    sublabel={`Carpeta · ${folderChildren.length} documento${folderChildren.length === 1 ? '' : 's'}`}
                    badge={`${folderDone}/${folderChildren.length}`}
                  />
                )
              })}
              {folders.length === 0 && (
                <p className="text-sm text-[var(--foreground-muted)]">Este expediente aun no tiene carpetas. Usa &quot;Reparar expediente&quot;.</p>
              )}
            </div>
          ) : (
            /* Dentro de una carpeta: items compactos + panel de detalle */
            <div className={selectedDoc ? driveSplitGrid : ''}>
              <div className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">{activeFolder.nombre}</h3>
                    <p className="text-sm text-[var(--foreground-muted)]">{activeFolder.notas ?? activeFolder.codigo}</p>
                  </div>
                  <LinkActions recurso={activeFolder} />
                </div>
                <DocGrid collapsed={Boolean(selectedDoc)}>
                  {folderDocs.map((recurso) => (
                    <DocRow
                      key={recurso._id}
                      href={`${basePath}?carpeta=${encodeURIComponent(activeFolder.codigo)}&doc=${recurso._id}`}
                      active={recurso._id === selectedDocId}
                      iconTone={tipoTone(recurso.tipo)}
                      estado={recurso.estado}
                      estadoLabel={ESTADO_LABELS[recurso.estado]}
                      codigo={recurso.codigo}
                      nombre={recurso.nombre}
                      meta={
                        <>
                          <span>{tipoLabel(recurso.tipo)}</span>
                          {recurso.webUrl && <DocMetaDot label="Enlace editable disponible" tone="sky" />}
                          {recurso.definitivo && <DocMetaDot label="Version definitiva disponible" tone="emerald" />}
                          {recurso.publicaParticipante && <DocMetaDot label="Publico para participantes" tone="violet" />}
                          {recurso.critico && <DocMetaDot label="Critico" tone="rose" />}
                        </>
                      }
                      trailing={
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoBadgeTone(recurso.estado)}`}>
                          {ESTADO_LABELS[recurso.estado]}
                        </span>
                      }
                    />
                  ))}
                  {folderDocs.length === 0 && (
                    <p className="text-sm text-[var(--foreground-muted)]">Esta carpeta no tiene documentos.</p>
                  )}
                </DocGrid>
              </div>

              {selectedDoc && (
                <DriveDetailAside
                  chips={
                    <>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">{tipoLabel(selectedDoc.tipo)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoBadgeTone(selectedDoc.estado)}`}>{ESTADO_LABELS[selectedDoc.estado]}</span>
                      {selectedDoc.formatoRelacionado && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--foreground-muted)]">{selectedDoc.formatoRelacionado}</span>}
                    </>
                  }
                  codigo={selectedDoc.codigo}
                  nombre={selectedDoc.nombre}
                  subtitle={
                    <>
                      {selectedDoc.notas && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{selectedDoc.notas}</p>}
                      <div className="mt-2 text-xs text-[var(--foreground-muted)]">Actualizado: {fmtDate(selectedDoc.updatedAt)} por {selectedDoc.updatedBy}</div>
                    </>
                  }
                  closeHref={`${basePath}?carpeta=${encodeURIComponent(activeFolder.codigo)}`}
                >
                  <div className="mb-3">
                    <LinkActions recurso={selectedDoc} />
                  </div>
                  <RecursoForms recurso={selectedDoc} rondaId={rondaId} />
                  <SgcRegistroDiligenciable codigo={selectedDoc.codigo} panel={panel} rondaId={rondaId} />
                </DriveDetailAside>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
