import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { EstadoBadge } from '../../components/EstadoBadge'
import { isAdmin, requireAuth } from '@/server/auth'
import {
  listPTItems,
  listPTSampleGroups,
  listResultadosPTRonda,
  listRondasParticipante,
  type ResultadoParticipantePT,
  type RondaParticipanteAsignada,
} from '@/server/rondas'

type PageProps = {
  params: Promise<{ uid: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type ResultadoRonda = {
  ronda: RondaParticipanteAsignada
  resultado: ResultadoParticipantePT | null
  columnas: {
    key: string
    contaminante: string
    run: string
    level: string
    sampleGroup: string
  }[]
}

function formatDate(value: string | null) {
  if (!value) return 'Sin envío final'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  )
}

function fichaBadge(estado: RondaParticipanteAsignada['ficha_estado']) {
  if (estado === 'enviado') return 'Enviada'
  if (estado === 'borrador') return 'Borrador'
  return 'No iniciada'
}

function perfilLabel(perfil: RondaParticipanteAsignada['participant_profile']) {
  return perfil === 'member_special' ? 'Referencia' : 'Participante'
}

function perfilBadgeClasses(perfil: RondaParticipanteAsignada['participant_profile']) {
  return perfil === 'member_special'
    ? 'bg-violet-100 text-violet-800'
    : 'bg-[var(--pt-primary)] text-black'
}

function getCellMap(resultado: ResultadoParticipantePT | null) {
  if (!resultado) return {}
  return resultado.celdas.reduce<Record<string, { mean_value: number; sd_value: number }>>(
    (acc, celda) => {
      acc[`${celda.pt_item_id}::${celda.sample_group_id}`] = {
        mean_value: celda.mean_value,
        sd_value: celda.sd_value,
      }
      return acc
    },
    {}
  )
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function estadoOperativoParticipante(rondas: RondaParticipanteAsignada[]) {
  const fichasPendientes = rondas.filter((ronda) => ronda.ficha_estado !== 'enviado').length
  const enviosFinales = rondas.filter((ronda) => ronda.envio_pt_enviado).length

  if (fichasPendientes > 0) {
    return {
      label: 'Revisar fichas',
      message: 'Hay fichas pendientes para este participante.',
      classes: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '⚡',
    }
  }

  if (enviosFinales < rondas.length) {
    return {
      label: 'Revisar incompletos',
      message: 'Hay rondas en las que el participante no ha enviado resultados.',
      classes: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '⚡',
    }
  }

  return {
    label: 'Completo',
    message: 'El participante tiene fichas y envíos finales completos en sus rondas.',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '✓',
  }
}

function EstadoOperativoBadge({
  estado,
}: {
  estado: ReturnType<typeof estadoOperativoParticipante>
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${estado.classes}`}>
      <span>{estado.icon}</span>
      {estado.label}
    </span>
  )
}

function MetricaCard({
  label,
  value,
  total,
  variant = 'default',
  href,
}: {
  label: string
  value: number | string
  total?: number | string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  href?: string
}) {
  const variantClass = {
    default: 'border-l-[var(--pt-primary)]',
    success: 'border-l-emerald-500 bg-emerald-50/40',
    warning: 'border-l-amber-500 bg-amber-50/50',
    danger: 'border-l-rose-500 bg-rose-50/50',
  }[variant]

  const inner = (
    <>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
        {label}
      </div>
      <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">
        {value}
        {total !== undefined && (
          <span className="text-xl font-normal text-[var(--foreground-muted)]"> / {total}</span>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={`card-accent px-5 py-4 transition hover:border-[var(--pt-primary)] hover:shadow-md ${variantClass}`}>
        {inner}
      </Link>
    )
  }

  return <div className={`card-accent px-5 py-4 ${variantClass}`}>{inner}</div>
}

async function loadResultadosPorRonda(rondas: RondaParticipanteAsignada[]): Promise<ResultadoRonda[]> {
  return Promise.all(
    rondas.map(async (ronda) => {
      const [ptItems, sampleGroups, resultados] = await Promise.all([
        listPTItems(ronda.id),
        listPTSampleGroups(ronda.id),
        listResultadosPTRonda(ronda.id),
      ])

      const columnas = ptItems.flatMap((item) =>
        sampleGroups.map((group) => ({
          key: `${item.id}::${group.id}`,
          contaminante: item.contaminante,
          run: item.run_code,
          level: item.level_label,
          sampleGroup: group.sample_group,
        }))
      )

      return {
        ronda,
        resultado:
          resultados.find((row) => row.participante_id === ronda.ronda_participante_id) ?? null,
        columnas,
      }
    })
  )
}

export default async function ParticipanteDashboardPage({ params, searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const { uid } = await params
  const resolvedSearchParams = await searchParams
  const userId = decodeURIComponent(uid)
  const activeTab = getParam(resolvedSearchParams?.tab) === 'resultados' ? 'resultados' : 'rondas'
  const rondas = await listRondasParticipante(userId)
  if (rondas.length === 0) notFound()

  const email = rondas[0]?.email ?? userId
  const resultadosPorRonda = activeTab === 'resultados' ? await loadResultadosPorRonda(rondas) : []
  const enviosFinales = rondas.filter((ronda) => ronda.envio_pt_enviado).length
  const fichasEnviadas = rondas.filter((ronda) => ronda.ficha_estado === 'enviado').length
  const rondasActivas = rondas.filter((ronda) => ronda.estado === 'activa').length
  const rondasParticipante = rondas.filter((ronda) => ronda.participant_profile !== 'member_special').length
  const rondasReferencia = rondas.filter((ronda) => ronda.participant_profile === 'member_special').length
  const estadoOperativo = estadoOperativoParticipante(rondas)
  const participantBaseHref = `/dashboard/participantes/${encodeURIComponent(userId)}`

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <nav
          className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm"
          style={{ background: 'linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)' }}
        >
          <div className="flex items-center gap-2 px-5 pt-3 pb-0">
            <Link
              href="/dashboard"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            >
              Dashboard
            </Link>
            <span className="text-xs text-[var(--border)]">/</span>
            <Link
              href="/dashboard?tab=participantes"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            >
              Participantes
            </Link>
          </div>
          <div className="flex gap-0 overflow-x-auto px-2">
            <Link
              href={participantBaseHref}
              aria-current={activeTab === 'rondas' ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'rondas'
                  ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              Rondas
            </Link>
            <Link
              href={`${participantBaseHref}?tab=resultados`}
              aria-current={activeTab === 'resultados' ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'resultados'
                  ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              Resultados
            </Link>
          </div>
        </nav>

        <header className="header-bar px-6 py-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{email}</h1>
              <span className="rounded-full bg-[var(--pt-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black">
                {rondasReferencia > 0 && rondasParticipante === 0 ? 'Referencia' : 'Participante'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground-muted)]">
              <span>{rondasParticipante} ronda{rondasParticipante !== 1 ? 's' : ''} como participante</span>
              <span>·</span>
              <span>{rondasReferencia} ronda{rondasReferencia !== 1 ? 's' : ''} como referencia</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <EstadoOperativoBadge estado={estadoOperativo} />
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">{estadoOperativo.message}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricaCard label="Rondas" value={rondas.length} />
          <MetricaCard
            label="Activas"
            value={rondasActivas}
            total={rondas.length}
            variant={rondasActivas > 0 ? 'success' : 'default'}
          />
          <MetricaCard
            label="Fichas"
            value={fichasEnviadas}
            total={rondas.length}
            variant={fichasEnviadas === rondas.length ? 'success' : 'warning'}
          />
          <MetricaCard
            label="Envíos PT"
            value={enviosFinales}
            total={rondas.length}
            variant={enviosFinales === rondas.length ? 'success' : enviosFinales > 0 ? 'warning' : 'default'}
            href={`${participantBaseHref}?tab=resultados`}
          />
        </section>

        {enviosFinales > 0 && (
          <Link
            href={`${participantBaseHref}?tab=resultados`}
            className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            <span>
              {enviosFinales} envío{enviosFinales !== 1 ? 's' : ''} final
              {enviosFinales !== 1 ? 'es' : ''} disponible{enviosFinales !== 1 ? 's' : ''}.
            </span>
            <span className="text-xs opacity-70">→</span>
          </Link>
        )}

        {activeTab === 'rondas' && (
        <section className="card p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Rondas del participante</h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              Desde aquí se edita la ficha o los datos PT de cada ronda específica.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--pt-primary)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Ronda</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Ficha</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Resultados</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rondas.map((ronda) => {
                  return (
                    <tr key={ronda.ronda_participante_id} className="border-b border-[var(--border-soft)] last:border-0">
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--foreground)]">{ronda.nombre}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">{ronda.codigo}</div>
                      </td>
                      <td className="px-4 py-4">
                        <EstadoBadge estado={ronda.estado} />
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${perfilBadgeClasses(ronda.participant_profile)}`}>
                          {perfilLabel(ronda.participant_profile)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">
                          {fichaBadge(ronda.ficha_estado)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="numeric rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                          {ronda.envios_pt_count} envío{ronda.envios_pt_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/dashboard/rondas/${ronda.id}/participantes/${ronda.ronda_participante_id}/ficha`}
                            className="rounded-lg border border-[var(--pt-primary)] bg-[var(--pt-primary-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--pt-primary)] hover:text-black"
                          >
                            Editar ficha
                          </Link>
                          <Link
                            href={`/dashboard/rondas/${ronda.id}/participantes/${ronda.ronda_participante_id}/datos`}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
                          >
                            Editar datos
                          </Link>
                          <Link
                            href={`/dashboard/rondas/${ronda.id}`}
                            className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)]"
                          >
                            Abrir ronda
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === 'resultados' && (
        <section className="grid max-w-full gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Resultados por ronda</h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              Vista filtrada de la matriz PT para este participante.
            </p>
          </div>

          {resultadosPorRonda.map(({ ronda, resultado, columnas }) => {
            const celdas = getCellMap(resultado)
            return (
              <article key={ronda.ronda_participante_id} className="card overflow-hidden p-6">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{ronda.nombre}</h3>
                      <EstadoBadge estado={ronda.estado} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {ronda.codigo} · envío final: {formatDate(resultado?.enviados_at ?? null)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/rondas/${ronda.id}/resultados`}
                    className="btn-outline self-start"
                  >
                    Ver matriz completa
                  </Link>
                </div>

                {columnas.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Esta ronda todavía no tiene columnas PT configuradas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
                      <thead>
                        <tr>
                          {columnas.map((columna) => (
                            <th
                              key={columna.key}
                              className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]"
                            >
                              <div className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                                {columna.contaminante}
                              </div>
                              <div>{columna.run}</div>
                              <div className="text-xs text-[var(--foreground-muted)]">
                                {columna.level} · {columna.sampleGroup}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {columnas.map((columna) => {
                            const celda = celdas[columna.key]
                            return (
                              <td key={columna.key} className="border-b border-[var(--border-soft)] px-4 py-4">
                                {celda ? (
                                  <div className="space-y-1">
                                    <div className="numeric font-medium text-[var(--foreground)]">
                                      mean {celda.mean_value}
                                    </div>
                                    <div className="numeric text-xs text-[var(--foreground-muted)]">
                                      sd {celda.sd_value}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[var(--border)]">Sin dato</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            )
          })}
        </section>
        )}
      </div>
    </div>
  )
}
