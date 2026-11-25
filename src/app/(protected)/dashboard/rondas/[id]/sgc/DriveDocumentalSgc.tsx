import Link from 'next/link'
import type { ReactNode } from 'react'
import { CopyInvitationLinkButton } from '@/components/ui/CopyInvitationLinkButton'
import { DocGrid, driveSplitGrid } from '@/components/ui/drive/DocGrid'
import { DocMetaDot, DocRow } from '@/components/ui/drive/DocRow'
import { DriveBreadcrumb } from '@/components/ui/drive/DriveBreadcrumb'
import { DriveDetailAside } from '@/components/ui/drive/DriveDetailAside'
import { FolderCard } from '@/components/ui/drive/FolderCard'
import type { FileTone } from '@/components/ui/drive/DriveIcons'
import { estadoBadgeTone } from '@/components/ui/drive/estadoTone'
import type { EstadoDriveRonda, SgcAvanceItem, SgcDriveRecurso, SgcDriveTree, SgcPanel } from '@/server/sgc'
import F20Control from './F20Control'
import { nombrarUsuarios, notaVisible } from './notas'
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
import { FileInput } from '@/components/ui/FileInput'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { etiquetaVisible } from '@/lib/sgc/etiquetas'

type Props = {
  drive: SgcDriveTree
  panel: SgcPanel
  avanceItems: SgcAvanceItem[]
  estadoDrive: EstadoDriveRonda & { integracionConectada: boolean }
  nombresUsuarios: Record<string, string>
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
        <span className="rounded-md bg-success-soft px-2.5 py-1 text-xs font-semibold text-success-strong">
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
      {recurso.codigo === 'F-PSEA-20' && <F20Control rondaId={rondaId} recurso={recurso} />}
      <FormSection title={recurso.webUrl ? 'Reemplazar enlace editable' : 'Enlace editable'}>
        {!recurso.webUrl ? (
          <form action={guardarDriveEditableAction} className="grid gap-2">
            <HiddenRecursoFields recurso={recurso} rondaId={rondaId} />
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px]">
              <input id={`web-url-${recurso._id}`} className="input" name="web_url" type="url" placeholder="https://drive.google.com/..." required />
              <SubmitButton className="btn-primary px-3 text-xs">Registrar</SubmitButton>
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
              <SubmitButton className="btn-outline px-3 text-xs">Reemplazar</SubmitButton>
            </div>
            <input className="input" name="motivo" placeholder="Motivo obligatorio de reemplazo" required />
          </form>
        )}
      </FormSection>

      {recurso.tipo !== 'carpeta' && recurso.codigo !== 'F-PSEA-20' && (
        <FormSection title="Versión definitiva">
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
                <SubmitButton className="btn-outline px-3 text-xs">Guardar</SubmitButton>
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
                <FileInput id={`def-file-${recurso._id}`} name="archivo" required />
                <select className="input" name="definitivo_tipo" defaultValue="pdf">
                  <option value="pdf">PDF</option>
                  <option value="documento">Doc</option>
                  <option value="archivo">Archivo</option>
                </select>
                <SubmitButton className="btn-outline px-3 text-xs" pendingLabel="Cargando…">Cargar</SubmitButton>
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
            <SubmitButton className="btn-outline w-full px-3 text-xs"  disabled={!recurso.webUrl || recurso.estado === 'diligenciado'}>
              Marcar diligenciado
            </SubmitButton>
          </form>
          <form action={cambiarEstadoDriveAction} className="grid gap-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input type="hidden" name="estado" value="no_aplica" />
            <input className="input" name="notas" placeholder="Justificación de no aplica" required />
            <SubmitButton className="btn-outline px-3 text-xs">No aplica</SubmitButton>
          </form>
          <form action={retirarDriveRecursoAction} className="grid gap-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input className="input" name="motivo" placeholder="Motivo de retiro" required />
            <SubmitButton className="btn-outline px-3 text-xs">Retirar</SubmitButton>
          </form>
        </div>
      </FormSection>

      {recurso.tipo !== 'carpeta' && !['F-PSEA-20', 'F-PSEA-21'].includes(recurso.codigo) && (
        <FormSection title="Visibilidad">
          <form action={cambiarVisibilidadDriveAction} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-surface px-3 py-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input type="hidden" name="publica_participante" value={recurso.publicaParticipante ? 'false' : 'true'} />
            <div>
              <div className="text-xs font-semibold text-[var(--foreground)]">Visible para participantes</div>
              <div className="text-xs text-[var(--foreground-muted)]">
                {recurso.publicaParticipante ? 'Publicado explícitamente' : 'Interno por defecto'}
              </div>
              {recurso.publicaParticipante && (
                <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                  El participante solo ve el archivo que usted cargue como documento definitivo en la
                  app; no recibe enlaces de Drive. Sin archivo cargado, este documento no le aparece.
                </div>
              )}
              {recurso.evidenciaSerieId && (
                <div className="mt-1 text-xs text-warning-strong">
                  Esta acción aplica a todos los documentos Drive de la misma serie.
                </div>
              )}
            </div>
            <SubmitButton className="btn-outline px-3 text-xs">
              {recurso.publicaParticipante ? 'Despublicar' : 'Publicar'}
            </SubmitButton>
          </form>
        </FormSection>
      )}
    </div>
  )
}

const LEYENDA_PUNTOS = [
  { color: 'bg-warning', texto: 'Punto grande amarillo: pendiente' },
  { color: 'bg-info', texto: 'Punto grande azul: creado, falta diligenciar' },
  { color: 'bg-success', texto: 'Punto grande verde: diligenciado' },
  { color: 'bg-danger', texto: 'Punto grande rojo: retirado' },
  { color: 'bg-info', texto: 'Tiene enlace editable en Drive' },
  { color: 'bg-success', texto: 'Tiene versión definitiva cargada' },
  { color: 'bg-special', texto: 'Publicado para participantes' },
  { color: 'bg-danger', texto: 'Documento crítico' },
]

const GLOSARIO = [
  { termino: 'Diligenciado', definicion: 'El contenido del documento está completo (en Drive o en la app).' },
  { termino: 'Enlace editable', definicion: 'Dirección del documento de trabajo en Google Drive; solo la ve el equipo Calaire.' },
  { termino: 'Versión definitiva', definicion: 'Copia final (PDF o archivo) que queda como evidencia del expediente.' },
  { termino: 'Publicar', definicion: 'Hace visible la versión definitiva a los participantes en la app. No cambia el avance.' },
]

function LeyendaYGlosario() {
  return (
    <div className="mt-4 grid gap-3 text-xs text-[var(--foreground-muted)] md:grid-cols-2">
      <div>
        <h4 className="font-semibold text-[var(--foreground)]">Leyenda de puntos (el grande indica el estado; los pequeños, lo que tiene)</h4>
        <ul className="mt-1 grid gap-1">
          {LEYENDA_PUNTOS.map((punto) => (
            <li key={punto.texto} className="flex items-center gap-2">
              <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${punto.color}`} />
              {punto.texto}
            </li>
          ))}
        </ul>
      </div>
      <details>
        <summary className="cursor-pointer font-semibold text-[var(--foreground)]">Glosario</summary>
        <dl className="mt-1 grid gap-1">
          {GLOSARIO.map((item) => (
            <div key={item.termino}>
              <dt className="inline font-semibold text-[var(--foreground)]">{item.termino}: </dt>
              <dd className="inline">{item.definicion}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}

export function DriveDocumentalSgc({ drive, panel, avanceItems, estadoDrive, nombresUsuarios, rondaId, rondaCodigo, rondaNombre, driveGoogleReady, driveGoogleConfig, selectedCarpeta, selectedDocId }: Props) {
  const root = drive.root
  const recursos = drive.recursos
  const folders = root ? childrenOf(recursos, root._id).filter((recurso) => recurso.tipo === 'carpeta') : []

  const basePath = `/dashboard/rondas/${rondaId}/sgc`
  const activeFolder = folders.find((folder) => folder.codigo === selectedCarpeta) ?? null
  const folderDocs = activeFolder ? childrenOf(recursos, activeFolder._id).filter((recurso) => recurso._id !== activeFolder._id) : []
  const selectedDoc = activeFolder ? folderDocs.find((recurso) => recurso._id === selectedDocId) ?? null : null

  return (
    <>
      <section id="explorador" className="card scroll-mt-24 overflow-hidden" aria-labelledby="drive-documental-title">
        <div className="sgc-panel-head">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{rondaCodigo}</p>
            <h2 id="drive-documental-title">Explorador de carpetas</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`sgc-badge ${estadoDrive.integracionConectada ? '' : 'opacity-70'}`} title="Credenciales de Google Drive configuradas en el servidor">
              Integración Drive: {estadoDrive.integracionConectada ? 'conectada' : 'sin configurar'}
            </span>
            <span className="sgc-badge" title="Carpeta de esta ronda creada en Google Drive">
              Carpeta de la ronda: {estadoDrive.carpetaRondaCreada ? 'creada' : 'no creada'}
              {estadoDrive.carpetaRondaCreada && ` · ${estadoDrive.documentos.conEnlace}/${estadoDrive.documentos.total} con enlace`}
            </span>
            <form action={inicializarDriveRondaAction}>
              <input type="hidden" name="ronda_id" value={rondaId} />
              <SubmitButton className="btn-outline">{root ? 'Reparar expediente' : 'Inicializar expediente documental'}</SubmitButton>
            </form>
            <form action={crearDriveGoogleAction}>
              <input type="hidden" name="ronda_id" value={rondaId} />
              <input type="hidden" name="ronda_codigo" value={rondaCodigo} />
              <input type="hidden" name="ronda_nombre" value={rondaNombre} />
              <SubmitButton className="btn-primary"  disabled={!driveGoogleReady} aria-describedby="crear-drive-ayuda">Crear en Google Drive</SubmitButton>
            </form>
          </div>
        </div>
        <p id="crear-drive-ayuda" className="mx-5 mt-3 text-xs text-[var(--foreground-muted)]">
          &quot;Inicializar&quot; crea el índice del expediente en la app. &quot;Crear en Google Drive&quot; crea (o reutiliza) la carpeta de la ronda
          y sus subcarpetas por etapa, y copia las plantillas de los documentos que aún no tienen enlace. No modifica documentos ya diligenciados.
        </p>

        {!driveGoogleReady && (
          <div className="m-5 rounded-lg border border-warning-border bg-warning-soft p-3 text-sm text-warning-strong">
            <div className="font-semibold">Integración con Google Drive sin configurar</div>
            <div className="mt-1">
              Cuenta: {driveGoogleConfig.clientEmail ? 'configurada' : 'faltante'} · Llave: {driveGoogleConfig.privateKey ? 'configurada' : 'faltante'} · Raíz: {driveGoogleConfig.rootFolderId ? 'configurada' : 'faltante'} · Plantillas: {driveGoogleConfig.templateMap ? 'mapeadas' : 'sin mapa'}
            </div>
          </div>
        )}

        {root && (
          <details className="m-5 rounded-lg border border-[var(--border)] bg-surface">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Administrar carpeta raíz</summary>
            <div className="border-t border-[var(--border)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--foreground-muted)]">{root.driveFolderId ?? 'Sin folderId registrado'}</div>
                <LinkActions recurso={root} />
              </div>
              <RecursoForms recurso={root} rondaId={rondaId} />
            </div>
          </details>
        )}

        {!root && (
          <div className="px-6 py-8 text-sm text-[var(--foreground-muted)]">
            Inicializa el expediente para crear el árbol virtual de carpetas y documentos esperados de esta ronda.
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
                  const codigos = new Set(folderChildren.map((recurso) => recurso.codigo))
                  const cuentan = avanceItems.filter((item) => codigos.has(item.codigo) && item.cuentaEnAvance)
                  const folderDone = cuentan.filter((item) => item.estado === 'completo').length
                  return (
                    <FolderCard
                      key={folder._id}
                      href={`${basePath}?carpeta=${encodeURIComponent(folder.codigo)}#explorador`}
                      nombre={etiquetaVisible(folder.nombre)}
                      sublabel={`Carpeta · ${folderChildren.length} documento${folderChildren.length === 1 ? '' : 's'}`}
                      badge={`${folderDone}/${cuentan.length}`}
                    />
                  )
                })}
                {folders.length === 0 && (
                  <p className="text-sm text-[var(--foreground-muted)]">Este expediente aún no tiene carpetas. Usa &quot;Reparar expediente&quot;.</p>
                )}
              </div>
            ) : (
              /* Dentro de una carpeta: items compactos + panel de detalle */
              <div className={selectedDoc ? driveSplitGrid : ''}>
                <div className="p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{etiquetaVisible(activeFolder.nombre)}</h3>
                      <p className="text-sm text-[var(--foreground-muted)]">{notaVisible(activeFolder.notas) ?? activeFolder.codigo}</p>
                    </div>
                    <LinkActions recurso={activeFolder} />
                  </div>
                  <DocGrid collapsed={Boolean(selectedDoc)}>
                    {folderDocs.map((recurso) => (
                      <DocRow
                        key={recurso._id}
                        href={`${basePath}?carpeta=${encodeURIComponent(activeFolder.codigo)}&doc=${recurso._id}#explorador`}
                        active={recurso._id === selectedDocId}
                        iconTone={tipoTone(recurso.tipo)}
                        estado={recurso.estado}
                        estadoLabel={ESTADO_LABELS[recurso.estado]}
                        codigo={recurso.codigo}
                        nombre={etiquetaVisible(recurso.nombre)}
                        meta={
                          <>
                            <span>{tipoLabel(recurso.tipo)}</span>
                            {recurso.webUrl && <DocMetaDot label="Enlace editable disponible" tone="sky" />}
                            {recurso.definitivo && <DocMetaDot label="Versión definitiva disponible" tone="emerald" />}
                            {recurso.publicaParticipante && <DocMetaDot label="Público para participantes" tone="violet" />}
                            {recurso.critico && <DocMetaDot label="Crítico" tone="rose" />}
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
                  <LeyendaYGlosario />
                </div>

                {selectedDoc && (
                  <DriveDetailAside
                    chips={
                      <>
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-foreground">{tipoLabel(selectedDoc.tipo)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoBadgeTone(selectedDoc.estado)}`}>{ESTADO_LABELS[selectedDoc.estado]}</span>
                        {selectedDoc.formatoRelacionado && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--foreground-muted)]">{selectedDoc.formatoRelacionado}</span>}
                      </>
                    }
                    codigo={selectedDoc.codigo}
                    nombre={etiquetaVisible(selectedDoc.nombre)}
                    subtitle={
                      <>
                        {notaVisible(selectedDoc.notas) && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{notaVisible(selectedDoc.notas)}</p>}
                        <div className="mt-2 text-xs text-[var(--foreground-muted)]">Actualizado: {fmtDate(selectedDoc.updatedAt)} por {nombrarUsuarios(selectedDoc.updatedBy, nombresUsuarios)}</div>
                      </>
                    }
                    closeHref={`${basePath}?carpeta=${encodeURIComponent(activeFolder.codigo)}#explorador`}
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      <LinkActions recurso={selectedDoc} />
                      {selectedDoc.codigo === 'F-PSEA-19' && <a className="btn-primary" href={`${basePath}/f-psea-19`}>Gestionar acta</a>}
                      {selectedDoc.codigo === 'F-PSEA-21' && <a className="btn-primary" href={`${basePath}/f-psea-21`}>Gestionar instrumentos</a>}
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
    </>
  )
}
