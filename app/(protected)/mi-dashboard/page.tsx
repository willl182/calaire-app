import { signOut } from '@workos-inc/authkit-nextjs'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Alert } from '@/app/(protected)/dashboard/components/Alert'
import { LogoUnal } from '@/app/components/LogoUnal'
import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { isAdmin, requireAuth } from '@/lib/auth'
import { getRondaParticipanteLandingPath, listRondasParticipante, type Ronda, type RondaParticipanteAsignada } from '@/lib/rondas'
import { getHitosVisibleParticipante, getEvidenciasPublicas, listDriveRecursosParticipante, listPublicacionesParticipante, listMisComentariosRonda, listMisNotificaciones } from '@/lib/sgc'
import { crearComentarioParticipanteAction, marcarNotificacionLeidaAction } from './actions'

function estadoParticipanteBadge(estado: Ronda['estado']) {
  if (estado === 'activa') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'cerrada') return 'bg-slate-200 text-slate-700'
  return 'bg-amber-100 text-amber-800'
}

function FichaBadge({ estado }: { estado: RondaParticipanteAsignada['ficha_estado'] }) {
  if (estado === 'enviado') {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        Ficha enviada ✓
      </span>
    )
  }
  if (estado === 'borrador') {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Ficha en borrador
      </span>
    )
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      Ficha no iniciada
    </span>
  )
}

type SgcDatosParticipante = {
  hitos: Awaited<ReturnType<typeof getHitosVisibleParticipante>>
  evidencias: Awaited<ReturnType<typeof getEvidenciasPublicas>>
  driveRecursos: Awaited<ReturnType<typeof listDriveRecursosParticipante>>
  publicaciones: Awaited<ReturnType<typeof listPublicacionesParticipante>>
  comentarios: Awaited<ReturnType<typeof listMisComentariosRonda>>
  notificaciones: Awaited<ReturnType<typeof listMisNotificaciones>>
}

function RondaParticipanteCard({ ronda, sgc }: { ronda: RondaParticipanteAsignada; sgc?: SgcDatosParticipante }) {
  const esActiva = ronda.estado === 'activa'
  const fichaEnviada = ronda.ficha_estado === 'enviado'
  const fichaLabel =
    ronda.ficha_estado === 'enviado'
      ? 'Ver ficha'
      : ronda.ficha_estado === 'borrador'
        ? 'Continuar ficha'
        : 'Diligenciar ficha'
  const puedeCargarDatos = esActiva && fichaEnviada
  const mostrarSgc = ronda.estado === 'documentacion_pendiente' || ronda.estado === 'cerrada'

  return (
    <article id={`cierre-documental-${ronda.codigo}`} className="card grid gap-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{ronda.nombre}</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${estadoParticipanteBadge(ronda.estado)}`}
            >
              {ronda.estado}
            </span>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Código <span className="font-medium text-[var(--foreground)]">{ronda.codigo}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <FichaBadge estado={ronda.ficha_estado} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            <Link href={`/ronda/${ronda.codigo}/registro`} className="btn-primary self-start">
              {fichaLabel} →
            </Link>

            {puedeCargarDatos ? (
              <Link href={`/ronda/${ronda.codigo}`} className="btn-outline self-start">
                Cargar datos
              </Link>
            ) : (
              <span className="self-start rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)]">
                Cargar datos
              </span>
            )}
          </div>

          {!puedeCargarDatos && (
            <p className="max-w-64 text-left text-xs leading-5 text-[var(--foreground-muted)] sm:text-right">
              {ronda.estado === 'borrador'
                ? 'Diligencie la ficha ahora. La carga de datos se habilita cuando el coordinador active la ronda.'
                : fichaEnviada
                  ? 'La carga de datos no está disponible para esta ronda.'
                  : 'Complete la ficha para habilitar el ingreso de resultados.'}
            </p>
          )}
        </div>
      </div>

      {ronda.contaminantes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ronda.contaminantes.map((c) => (
            <span
              key={c.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--foreground-muted)]"
            >
              {c.contaminante} · {c.niveles}N · {c.replicas}R
            </span>
          ))}
        </div>
      )}

      {mostrarSgc && sgc && (
        <div className="mt-2 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
            Informacion de cierre documental
          </p>

          {sgc.hitos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Hitos visibles</p>
              <div className="grid gap-2">
                {sgc.hitos.map((hito) => (
                  <div key={hito._id} className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--card)] p-2 text-sm">
                    <div>
                      <span className="font-medium">{hito.nombre}</span>
                      <span className="ml-2 text-[var(--foreground-muted)]">{hito.estado}</span>
                    </div>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {hito.fechaObjetivo ?? 'Sin fecha objetivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sgc.evidencias.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Evidencias publicadas</p>
              <div className="grid gap-2">
                {sgc.evidencias.map(({ serie, vigente }) => (
                  <div key={serie._id} className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--card)] p-2 text-sm">
                    <div>
                      <span className="font-medium">{serie.nombre}</span>
                      {vigente && (
                        <span className="ml-2 text-[var(--foreground-muted)]">{vigente.fileName}</span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {vigente ? 'Vigente' : 'Sin version vigente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sgc.driveRecursos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Documentos Drive publicados</p>
              <div className="grid gap-2">
                {sgc.driveRecursos.map((recurso) => (
                  <div key={recurso._id} className="flex flex-col gap-2 rounded border border-[var(--border)] bg-[var(--card)] p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{recurso.nombre}</div>
                      <div className="text-xs text-[var(--foreground-muted)]">
                        {recurso.codigo}{recurso.formatoRelacionado ? ` · ${recurso.formatoRelacionado}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recurso.definitivo?.webUrl && (
                        <a className="btn-outline text-xs" href={recurso.definitivo.webUrl} target="_blank" rel="noopener noreferrer">
                          Descargar
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sgc.publicaciones.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Publicaciones</p>
              <div className="grid gap-2">
                {sgc.publicaciones.map((pub) => (
                  <div key={pub._id} className="rounded border border-[var(--border)] bg-[var(--card)] p-2 text-sm">
                    <div className="font-medium">{pub.titulo}</div>
                    <div className="mt-1 whitespace-pre-wrap text-[var(--foreground-muted)]">{pub.contenido}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sgc.notificaciones.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Notificaciones</p>
              <div className="grid gap-2">
                {sgc.notificaciones.map((notificacion) => (
                  <div key={notificacion._id} className="rounded border border-[var(--border)] bg-[var(--card)] p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{notificacion.titulo}</div>
                        <div className="mt-1 whitespace-pre-wrap text-[var(--foreground-muted)]">{notificacion.mensaje}</div>
                      </div>
                      {!notificacion.leidaAt && (
                        <form action={marcarNotificacionLeidaAction}>
                          <input type="hidden" name="notificacion_id" value={notificacion._id} />
                          <button className="btn-outline text-xs" type="submit">Leida</button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--foreground)]">Comentarios</p>
            <form action={crearComentarioParticipanteAction} className="grid gap-2">
              <input type="hidden" name="ronda_id" value={ronda.id} />
              <textarea className="input min-h-20" name="mensaje" placeholder="Escriba un comentario para el equipo SGC" required />
              <button className="btn-primary justify-self-start" type="submit">Enviar comentario</button>
            </form>
            <div className="grid gap-2">
              {sgc.comentarios.map((comentario) => (
                <div key={comentario._id} className="rounded border border-[var(--border)] bg-[var(--card)] p-2 text-sm">
                  <div className="font-medium">{comentario.estado}</div>
                  <div className="mt-1 whitespace-pre-wrap text-[var(--foreground-muted)]">{comentario.mensaje}</div>
                  {comentario.respuestaAdmin && (
                    <div className="mt-2 rounded border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--foreground-muted)]">{comentario.respuestaAdmin}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {sgc.hitos.length === 0 && sgc.evidencias.length === 0 && sgc.driveRecursos.length === 0 && sgc.publicaciones.length === 0 && sgc.notificaciones.length === 0 && sgc.comentarios.length === 0 && (
            <p className="text-sm text-[var(--foreground-muted)]">
              No hay informacion publicada visible en este momento.
            </p>
          )}
        </div>
      )}
    </article>
  )
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function EmptyParticipantState({ email }: { email: string }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(245,246,247,.95)_0%,rgba(245,245,240,.95)_100%)] px-8 py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pt-primary-dark)]">
          Acceso participante
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          Aún no tiene rondas asignadas
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--foreground-muted)]">
          La cuenta <span className="font-medium text-[var(--foreground)]">{email}</span> está
          registrada, pero todavía no fue vinculada a una ronda activa.
        </p>
      </div>

      <div className="px-8 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
          Qué hacer ahora
        </p>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--foreground)]">
          <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            1. Verifique que haya iniciado sesión con el correo correcto.
          </li>
          <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            2. Si esperaba tener una ronda, contacte al coordinador para que le asigne una.
          </li>
          <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            3. Cuando exista una asignación, aquí aparecerán las rondas disponibles para diligenciar la ficha y cargar resultados.
          </li>
        </ol>
      </div>
    </section>
  )
}

export default async function MiDashboardPage({ searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (isAdmin(auth)) redirect('/dashboard')

  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const rondas = await listRondasParticipante(auth.user.id)
  if (rondas.length > 0) {
    const ronda = rondas.find((item) => item.estado === 'activa') ?? rondas[0]
    const landingPath = getRondaParticipanteLandingPath(ronda)
    if (!landingPath.startsWith('/mi-dashboard')) redirect(landingPath)
  }

  const rondasSgc = new Map<string, SgcDatosParticipante>()
  await Promise.all(
    rondas.map(async (r) => {
      if (r.estado === 'documentacion_pendiente' || r.estado === 'cerrada') {
        try {
          const [hitos, evidencias, driveRecursos, publicaciones, comentarios, notificaciones] = await Promise.all([
            getHitosVisibleParticipante(r.id),
            getEvidenciasPublicas(r.id),
            listDriveRecursosParticipante(r.id),
            listPublicacionesParticipante(r.id),
            listMisComentariosRonda(r.id),
            listMisNotificaciones(r.id),
          ])
          rondasSgc.set(r.id, { hitos, evidencias, driveRecursos, publicaciones, comentarios, notificaciones })
        } catch {
          // Si no hay acceso, simplemente no mostrar datos SGC
        }
      }
    })
  )
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="header-bar px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <LogoUnal height={64} />
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Ensayos de Aptitud</span>
                </h1>
                <p className="text-base font-medium text-[var(--pt-primary-dark)]">
                  Gases Contaminantes Criterio
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {auth.user.email} · Participante
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <form
                action={async () => {
                  'use server'
                  await signOut({ returnTo: buildAbsoluteAppUrl('/login') })
                }}
              >
                <button type="submit" className="btn-outline">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </header>

        <Alert tone="success" message={success} />
        <Alert tone="error" message={error} />

        <section className="grid gap-6">
          {rondas.length === 0 ? (
            <EmptyParticipantState email={auth.user.email} />
          ) : (
            <>
              <div className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Mis rondas asignadas</h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Rondas en las que está habilitado para diligenciar ficha y cargar resultados.
                  </p>
                </div>
                <a
                  href="/guia.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline inline-flex items-center gap-2 self-start"
                  title="Abrir guía del participante en nueva pestaña"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  Guía del participante
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a3 3 0 0 1 3-3h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>

              {rondas.map((r) => {
                const sgcDatos = rondasSgc.get(r.id)
                return <RondaParticipanteCard key={r.id} ronda={r} sgc={sgcDatos} />
              })}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
