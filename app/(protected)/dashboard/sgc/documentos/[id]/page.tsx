import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { canEditSgcMaestro, canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { normalizeHttpUrl } from '@/lib/safe-url'
import { getDocumentoMaestro } from '@/lib/sgc'
import { crearRegistroDerivadoAction, guardarDocumentoMaestroAction, registrarVersionOficialAction } from '../actions'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function fmtDate(value?: string | number | null) {
  if (!value) return 'Sin fecha'
  if (typeof value === 'number') return new Date(value).toLocaleDateString('es-CO')
  return value
}

export default async function DocumentoDetallePage({ params, searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')
  const { id } = await params
  const messages = (await searchParams) ?? {}
  const detalle = await getDocumentoMaestro(id)
  if (!detalle) notFound()
  const { documento, versionVigente, versiones, registros, requisitos } = detalle
  const canEdit = canEditSgcMaestro(auth)
  const fuenteEditableUrl = normalizeHttpUrl(documento.fuenteEditableUrl)

  return (
    <div className="grid min-w-0 gap-6">
      <header className="header-bar px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link className="text-sm font-medium text-[var(--pt-primary-dark)] underline-offset-4 hover:underline" href="/dashboard/sgc/documentos">Centro documental</Link>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{documento.codigo} · {documento.nombre}</h1>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Documento maestro del SGC. Crear o actualizar este registro no publica una version oficial por si mismo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-outline" href="/dashboard/sgc/normativa">Ver normativa</Link>
            <Link className="btn-outline" href="/dashboard/sgc/mapa">Ver mapa</Link>
          </div>
        </div>
      </header>

      {firstParam(messages.success) && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{firstParam(messages.success)}</div>}
      {firstParam(messages.error) && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{firstParam(messages.error)}</div>}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Ficha maestra</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ambito</dt><dd className="font-medium">{documento.ambito ?? 'Sin ambito'}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Proceso</dt><dd className="font-medium">{documento.proceso}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Familia</dt><dd className="font-medium">{documento.familia ?? 'OTRO'}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Estado</dt><dd className="font-medium">{documento.estado}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Modo</dt><dd className="font-medium">{documento.modoDiligenciamiento ?? 'no_diligenciable'}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Responsable</dt><dd className="font-medium">{documento.responsable ?? documento.propietario}</dd></div>
          </dl>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Fuente editable</div>
              {fuenteEditableUrl ? (
                <a className="mt-2 inline-flex text-sm font-semibold text-[var(--pt-primary-dark)] underline" href={fuenteEditableUrl} target="_blank" rel="noreferrer">Abrir Drive/SharePoint</a>
              ) : documento.fuenteEditableUrl ? (
                <p className="mt-2 text-sm text-[var(--foreground-muted)] break-all">{documento.fuenteEditableUrl}</p>
              ) : (
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">No registrada. Esto no afecta la version oficial congelada.</p>
              )}
            </div>
            <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Version oficial vigente</div>
              {versionVigente ? (
                <div className="mt-2 text-sm">
                  <div className="font-semibold">v{versionVigente.version} · {versionVigente.fileName ?? 'archivo oficial'}</div>
                  <div className="text-[var(--foreground-muted)]">Vigente desde {fmtDate(versionVigente.fechaVigencia)}</div>
                  {versionVigente.fileName && (
                    <Link className="mt-2 inline-flex text-sm font-semibold text-[var(--pt-primary-dark)] underline" href={`/dashboard/sgc/documentos/${documento._id}/versiones/${versionVigente._id}/download`}>
                      Descargar oficial
                    </Link>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-rose-700">Sin version oficial vigente.</p>
              )}
            </div>
          </div>
        </div>

        {canEdit && <div className="card p-5">
          <h2 className="text-lg font-semibold">Actualizar metadatos</h2>
          <form action={guardarDocumentoMaestroAction} className="mt-4 grid gap-3">
            <input type="hidden" name="documento_id" value={documento._id} />
            <input className="input" name="codigo" defaultValue={documento.codigo} aria-label="Codigo del documento" required />
            <input className="input" name="nombre" defaultValue={documento.nombre} aria-label="Nombre del documento" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input" name="familia" defaultValue={documento.familia ?? 'OTRO'} aria-label="Familia documental">
                <option value="DG">DG</option><option value="P">P</option><option value="I">I</option><option value="F">F</option><option value="OTRO">OTRO</option>
              </select>
              <select className="input" name="estado" defaultValue={documento.estado} aria-label="Estado del documento">
                <option value="borrador">Borrador</option><option value="en_revision">En revision</option><option value="vigente">Vigente</option><option value="obsoleto">Obsoleto</option>
              </select>
            </div>
            <input className="input" name="ambito" defaultValue={documento.ambito ?? ''} aria-label="Ambito del documento" />
            <input className="input" name="proceso" defaultValue={documento.proceso} aria-label="Proceso del documento" />
            <input className="input" name="responsable" defaultValue={documento.responsable ?? documento.propietario} aria-label="Responsable del documento" />
            <select className="input" name="modo_diligenciamiento" defaultValue={documento.modoDiligenciamiento ?? 'no_diligenciable'} aria-label="Modo de diligenciamiento">
              <option value="no_diligenciable">No diligenciable</option><option value="solo_archivo">Solo archivo</option><option value="ui_nativo">UI nativo</option><option value="ui_nativo_exportable">UI nativo exportable</option>
            </select>
            <select className="input" name="visibilidad" defaultValue={documento.visibilidad ?? 'interna'} aria-label="Visibilidad del documento">
              <option value="interna">Interna</option><option value="participantes">Participantes</option><option value="publica">Publica</option>
            </select>
            <select className="input" name="modo_control" defaultValue={documento.modoControl ?? 'app_oficial'} aria-label="Modo de control documental">
              <option value="app_oficial">App oficial</option><option value="mixto">Mixto</option><option value="externo_referenciado">Externo referenciado</option>
            </select>
            <input className="input" name="fuente_editable_url" defaultValue={documento.fuenteEditableUrl ?? ''} placeholder="URL editable externa" aria-label="URL editable externa" />
            <input className="input" name="ubicacion_fuente" defaultValue={documento.ubicacionFuente ?? ''} placeholder="Ubicacion / control original" aria-label="Ubicacion o control original" />
            <input type="hidden" name="subproceso" value={documento.subproceso ?? ''} />
            <input type="hidden" name="retencion" value={documento.retencion ?? ''} />
            <textarea className="input" name="notas" defaultValue={documento.notas ?? ''} rows={3} aria-label="Notas del documento" />
            <button className="btn-primary justify-self-start" type="submit">Guardar metadatos</button>
          </form>
        </div>}
      </section>

      {canEdit && <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Registrar version oficial</h2>
          <form action={registrarVersionOficialAction} className="mt-4 grid gap-3" encType="multipart/form-data">
            <input type="hidden" name="documento_id" value={documento._id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" name="version" type="number" min="1" placeholder={`Sugerida ${versiones.length + 1}`} aria-label="Numero de version oficial" />
              <select className="input" name="estado" defaultValue="vigente" aria-label="Estado de la version oficial">
                <option value="vigente">Vigente</option>
                <option value="reemplazada">Historica</option>
                <option value="retirada">Retirada</option>
              </select>
            </div>
            <input className="input" type="file" name="archivo" aria-label="Archivo oficial" required />
            <textarea className="input" name="resumen_cambios" placeholder="Resumen de cambios" rows={3} aria-label="Resumen de cambios" required />
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="input" name="elaborado_por" placeholder="Elaborado por" aria-label="Elaborado por" />
              <input className="input" name="revisado_por" placeholder="Revisado por" aria-label="Revisado por" />
              <input className="input" name="aprobado_por" placeholder="Aprobado por" aria-label="Aprobado por" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="input" name="fecha_revision" type="date" aria-label="Fecha de revision" />
              <input className="input" name="fecha_aprobacion" type="date" aria-label="Fecha de aprobacion" />
              <input className="input" name="fecha_vigencia" type="date" aria-label="Fecha de vigencia" />
            </div>
            <button className="btn-primary justify-self-start" type="submit">Subir version oficial</button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold">Crear registro derivado</h2>
          {!versionVigente && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">No hay version vigente; el registro puede crearse, pero quedara sin version base.</p>}
          <form action={crearRegistroDerivadoAction} className="mt-4 grid gap-3">
            <input type="hidden" name="documento_id" value={documento._id} />
            <input type="hidden" name="version_base_id" value={versionVigente?._id ?? ''} />
            <input className="input" name="codigo" placeholder="Codigo del registro" aria-label="Codigo del registro" required />
            <input className="input" name="nombre" placeholder="Nombre del registro" aria-label="Nombre del registro" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input" name="entidad_tipo" defaultValue="ronda" aria-label="Tipo de entidad del registro">
                <option value="ronda">Ronda</option><option value="equipo">Equipo</option><option value="proveedor">Proveedor</option><option value="auditoria">Auditoria</option><option value="caso">Caso</option><option value="transversal">Transversal</option>
              </select>
              <input className="input" name="ronda_id" placeholder="Id ronda si aplica" aria-label="Id de ronda si aplica" />
            </div>
            <input className="input" name="entidad_ref" placeholder="Referencia operacional" aria-label="Referencia operacional" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input" name="external_system" defaultValue="" aria-label="Sistema externo">
                <option value="">Sin sistema externo</option>
                <option value="pt_app">pt_app externo</option>
              </select>
              <input className="input" name="external_label" placeholder="Etiqueta externa" aria-label="Etiqueta externa" />
            </div>
            <input className="input" name="external_url" placeholder="URL externa contextual" aria-label="URL externa contextual" />
            <input className="input" name="external_ref" placeholder="Referencia externa" aria-label="Referencia externa" />
            <button className="btn-primary justify-self-start" type="submit">Crear registro</button>
          </form>
        </div>
      </section>}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Historial de versiones</h2>
          <div className="mt-4 space-y-3">
            {versiones.map((version) => (
              <div key={version._id} className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">v{version.version} · {version.estado}</div>
                    <div className="text-sm text-[var(--foreground-muted)]">{version.fileName ?? 'Sin archivo registrado'} · {fmtDate(version.fechaVigencia)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-[var(--foreground-muted)]">{fmtDate(version.createdAt)}</div>
                    {version.fileName && (
                      <Link className="text-xs font-semibold text-[var(--pt-primary-dark)] underline" href={`/dashboard/sgc/documentos/${documento._id}/versiones/${version._id}/download`}>
                        Descargar
                      </Link>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm">{version.resumenCambios ?? version.cambioResumen}</p>
              </div>
            ))}
            {versiones.length === 0 && <p className="text-sm text-[var(--foreground-muted)]">Sin versiones registradas.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold">Registros y cobertura</h2>
          <div className="mt-4 space-y-3">
            {registros.map((registro) => (
              <div key={registro._id} className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
                {(() => {
                  const externalUrl = normalizeHttpUrl(registro.externalUrl)
                  return (
                    <>
                <div className="font-semibold">{registro.codigo}</div>
                <div className="text-sm text-[var(--foreground-muted)]">{registro.nombre} · {registro.entidadTipo} · {registro.estado}</div>
                {registro.externalSystem === 'pt_app' && externalUrl && <a className="mt-2 inline-flex text-sm text-[var(--pt-primary-dark)] underline" href={externalUrl} target="_blank" rel="noreferrer">pt_app externo</a>}
                {registro.externalSystem === 'pt_app' && !externalUrl && <span className="mt-2 inline-flex text-sm text-[var(--foreground-muted)]">pt_app externo</span>}
                    </>
                  )
                })()}
              </div>
            ))}
            {registros.length === 0 && <p className="text-sm text-[var(--foreground-muted)]">Sin registros derivados.</p>}
          </div>
          <div className="mt-6 border-t border-[var(--border-soft)] pt-4">
            <h3 className="font-semibold">Requisitos relacionados</h3>
            <div className="mt-3 space-y-2">
              {requisitos.map(({ relacion, requisito }) => (
                <div key={relacion._id} className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm">
                  <span className="font-semibold">{requisito.norma} {requisito.clausula}</span> · {relacion.estadoCobertura}
                </div>
              ))}
              {requisitos.length === 0 && <p className="text-sm text-[var(--foreground-muted)]">Sin relaciones normativas verificadas.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
