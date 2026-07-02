import Link from 'next/link'
import { CopyInvitationLinkButton } from '@/app/(protected)/dashboard/components/CopyInvitationLinkButton'
import type { SgcDriveRecurso, SgcDriveTree } from '@/lib/sgc'
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
}

const ESTADO_LABELS: Record<SgcDriveRecurso['estado'], string> = {
  pendiente: 'Pendiente',
  creado: 'Creado',
  diligenciado: 'Diligenciado',
  reemplazado: 'Reemplazado',
  retirado: 'Retirado',
  no_aplica: 'No aplica',
}

function estadoClasses(estado: SgcDriveRecurso['estado']) {
  if (estado === 'diligenciado') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'creado') return 'bg-sky-100 text-sky-800'
  if (estado === 'no_aplica') return 'bg-slate-100 text-slate-700'
  if (estado === 'reemplazado') return 'bg-violet-100 text-violet-800'
  if (estado === 'retirado') return 'bg-rose-100 text-rose-800'
  return 'bg-amber-100 text-amber-800'
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

function RecursoForms({ recurso, rondaId }: { recurso: SgcDriveRecurso; rondaId: string }) {
  return (
    <div className="grid gap-3">
      {!recurso.webUrl ? (
        <form action={guardarDriveEditableAction} className="grid gap-2">
          <HiddenRecursoFields recurso={recurso} rondaId={rondaId} />
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]" htmlFor={`web-url-${recurso._id}`}>
            Enlace editable
          </label>
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
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]" htmlFor={`replace-url-${recurso._id}`}>
            Reemplazar enlace
          </label>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px]">
            <input id={`replace-url-${recurso._id}`} className="input" name="web_url" type="url" placeholder="Nueva URL de Drive" required />
            <button className="btn-outline px-3 text-xs" type="submit">Reemplazar</button>
          </div>
          <input className="input" name="motivo" placeholder="Motivo obligatorio de reemplazo" required />
        </form>
      )}

      {recurso.tipo !== 'carpeta' && (
        <form action={guardarDriveDefinitivoAction} className="grid gap-2">
          <HiddenRecursoFields recurso={recurso} rondaId={rondaId} />
          <input type="hidden" name="web_url" value={recurso.webUrl ?? ''} />
          <input type="hidden" name="notas" value={recurso.notas ?? ''} />
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]" htmlFor={`def-url-${recurso._id}`}>
            Version definitiva (enlace)
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
      )}

      {recurso.tipo !== 'carpeta' && (
        <form action={subirDriveDefinitivoAction} className="grid gap-2">
          <HiddenRecursoFields recurso={recurso} rondaId={rondaId} />
          <input type="hidden" name="web_url" value={recurso.webUrl ?? ''} />
          <input type="hidden" name="notas" value={recurso.notas ?? ''} />
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]" htmlFor={`def-file-${recurso._id}`}>
            Version definitiva (cargar archivo)
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
      )}

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

      {recurso.tipo !== 'carpeta' && (
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
      )}
    </div>
  )
}

function RecursoRow({ recurso, rondaId }: { recurso: SgcDriveRecurso; rondaId: string }) {
  const isFolder = recurso.tipo === 'carpeta'
  return (
    <article id={`drive-${recurso.codigo}`} className="grid gap-4 border-t border-[var(--border)] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{isFolder ? 'Carpeta' : tipoLabel(recurso.tipo)}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClasses(recurso.estado)}`}>{ESTADO_LABELS[recurso.estado]}</span>
          {recurso.critico && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Critico</span>}
          {recurso.publicaParticipante && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Publicado</span>}
          {recurso.formatoRelacionado && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--foreground-muted)]">{recurso.formatoRelacionado}</span>}
        </div>
        <h4 className="mt-2 font-semibold text-[var(--foreground)]">{recurso.codigo}</h4>
        <p className="mt-1 text-sm text-[var(--foreground)]">{recurso.nombre}</p>
        {recurso.notas && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{recurso.notas}</p>}
        <div className="mt-3 text-xs text-[var(--foreground-muted)]">
          Actualizado: {fmtDate(recurso.updatedAt)} por {recurso.updatedBy}
        </div>
        <div className="mt-3">
          <LinkActions recurso={recurso} />
        </div>
      </div>
      <RecursoForms recurso={recurso} rondaId={rondaId} />
    </article>
  )
}

export function DriveDocumentalSgc({ drive, rondaId, rondaCodigo, rondaNombre, driveGoogleReady, driveGoogleConfig }: Props) {
  const root = drive.root
  const recursos = drive.recursos
  const folders = root ? childrenOf(recursos, root._id).filter((recurso) => recurso.tipo === 'carpeta') : []
  const documentos = recursos.filter((recurso) => recurso.tipo !== 'carpeta')
  const completados = documentos.filter((recurso) => recurso.estado === 'diligenciado' || recurso.estado === 'no_aplica').length
  const conEditable = documentos.filter((recurso) => Boolean(recurso.webUrl)).length
  const conDefinitivo = documentos.filter((recurso) => Boolean(recurso.definitivo)).length

  return (
    <section className="card overflow-hidden" aria-labelledby="drive-documental-title">
      <div className="border-b border-[var(--border)] bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{rondaCodigo}</p>
            <h2 id="drive-documental-title" className="mt-1 text-xl font-semibold text-[var(--foreground)]">Drive documental SGC</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-muted)]">
              <span>Mi unidad</span>
              <span>/</span>
              <span>{root?.nombre ?? 'Expediente no inicializado'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
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

        <div className={`mt-4 rounded-lg border p-3 text-sm ${driveGoogleReady ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          <div className="font-semibold">
            {driveGoogleReady ? 'Automatizacion Google Drive lista' : 'Automatizacion Google Drive pendiente de configuracion'}
          </div>
          <div className="mt-1">
            Cuenta: {driveGoogleConfig.clientEmail ? 'configurada' : 'faltante'} · Llave: {driveGoogleConfig.privateKey ? 'configurada' : 'faltante'} · Raiz: {driveGoogleConfig.rootFolderId ? 'configurada' : 'faltante'} · Plantillas: {driveGoogleConfig.templateMap ? 'mapeadas' : 'sin mapa'}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--border)] bg-slate-50 px-3 py-2">
            <div className="text-lg font-semibold">{folders.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Carpetas</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-slate-50 px-3 py-2">
            <div className="text-lg font-semibold">{conEditable}/{documentos.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Editables</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-slate-50 px-3 py-2">
            <div className="text-lg font-semibold">{completados}/{documentos.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Cubiertos</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-slate-50 px-3 py-2">
            <div className="text-lg font-semibold">{conDefinitivo}/{documentos.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Definitivos</div>
          </div>
        </div>

        {root && (
          <div className="mt-5 rounded-lg border border-[var(--border)] bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)]">Carpeta raiz Drive</div>
                <div className="text-xs text-[var(--foreground-muted)]">{root.driveFolderId ?? 'Sin folderId registrado'}</div>
              </div>
              <LinkActions recurso={root} />
            </div>
            <RecursoForms recurso={root} rondaId={rondaId} />
          </div>
        )}
      </div>

      {!root && (
        <div className="px-6 py-8 text-sm text-[var(--foreground-muted)]">
          Inicializa el expediente para crear el arbol virtual de carpetas y documentos esperados de esta ronda.
        </div>
      )}

      {root && (
        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-[var(--border)] bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <div className="sticky top-4 grid gap-2">
              {folders.map((folder) => {
                const folderChildren = childrenOf(recursos, folder._id).filter((recurso) => recurso.tipo !== 'carpeta')
                const folderDone = folderChildren.filter((recurso) => recurso.estado === 'diligenciado' || recurso.estado === 'no_aplica').length
                return (
                  <a key={folder._id} href={`#drive-${folder.codigo}`} className="rounded-lg border border-transparent px-3 py-2 text-sm transition hover:border-[var(--border)] hover:bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[var(--foreground)]">{folder.nombre}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground-muted)]">{folderDone}/{folderChildren.length}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">{folder.codigo}</div>
                  </a>
                )
              })}
            </div>
          </aside>

          <div className="grid gap-5 p-5">
            {folders.map((folder) => {
              const folderChildren = childrenOf(recursos, folder._id)
              return (
                <section key={folder._id} id={`drive-${folder.codigo}`} className="rounded-lg border border-[var(--border)] bg-white">
                  <div className="px-4 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Carpeta</div>
                        <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{folder.nombre}</h3>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{folder.notas ?? folder.codigo}</p>
                      </div>
                      <LinkActions recurso={folder} />
                    </div>
                    <div className="mt-4">
                      <RecursoForms recurso={folder} rondaId={rondaId} />
                    </div>
                  </div>
                  {folderChildren.filter((recurso) => recurso._id !== folder._id).map((recurso) => (
                    <RecursoRow key={recurso._id} recurso={recurso} rondaId={rondaId} />
                  ))}
                </section>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
