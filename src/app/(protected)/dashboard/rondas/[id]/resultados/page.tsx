import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { isAdmin, requireAuth } from '@/server/auth'
import {
  getRonda,
  listPTItems,
  listPTSampleGroups,
  listResultadosPTRonda,
  type ResultadoParticipantePT,
} from '@/server/rondas'
import { RondaContextNav } from '../RondaContextNav'
import { EstadoBadge } from '../../../components/EstadoBadge'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type ColumnaPT = {
  key: string
  run: string
  level: string
  sampleGroup: string
  contaminante: string
}

function formatDate(value: string | null) {
  if (!value) return 'Sin envío final'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  )
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function completitudBadge(resultado: ResultadoParticipantePT) {
  const done = resultado.completados >= resultado.total_esperado && resultado.total_esperado > 0
  return (
    <span
      className={`numeric rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {resultado.completados}/{resultado.total_esperado} ({resultado.porcentaje_completitud}%)
    </span>
  )
}

function getCellMap(resultado: ResultadoParticipantePT) {
  return resultado.celdas.reduce<Record<string, { mean_value: number; sd_value: number }>>((acc, celda) => {
    acc[`${celda.pt_item_id}::${celda.sample_group_id}`] = {
      mean_value: celda.mean_value,
      sd_value: celda.sd_value,
    }
    return acc
  }, {})
}

function MetricaCard({
  label,
  value,
  total,
  variant = 'default',
}: {
  label: string
  value: number | string
  total?: number | string
  variant?: 'default' | 'success' | 'warning'
}) {
  const variantClass = {
    default: 'border-l-[var(--pt-primary)]',
    success: 'border-l-emerald-500 bg-emerald-50/40',
    warning: 'border-l-amber-500 bg-amber-50/50',
  }[variant]

  return (
    <div className={`card-accent px-5 py-4 ${variantClass}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
        {label}
      </div>
      <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">
        {value}
        {total !== undefined && (
          <span className="text-xl font-normal text-[var(--foreground-muted)]"> / {total}</span>
        )}
      </div>
    </div>
  )
}

function ResultadosTable({
  resultados,
  columnas,
  minWidth = '1280px',
}: {
  resultados: ResultadoParticipantePT[]
  columnas: ColumnaPT[]
  minWidth?: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0 text-sm" style={{ minWidth }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-20 border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Participante
            </th>
            <th className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Estado
            </th>
            <th className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Envío final
            </th>
            {columnas.map((columna) => (
              <th
                key={columna.key}
                className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]"
              >
                <div className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                  {columna.contaminante}
                </div>
                <div className="text-sm">{columna.run}</div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {columna.level} · {columna.sampleGroup}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultados.map((resultado) => {
            const celdas = getCellMap(resultado)
            return (
              <tr key={resultado.participante_id} className="align-top">
                <td className="sticky left-0 z-10 border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 py-4">
                  <div className="font-medium text-[var(--foreground)]">{resultado.email}</div>
                  <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                    participant_id:{' '}
                    <span className="numeric text-[var(--foreground)]">
                      {resultado.participant_code ?? '—'}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    replicate:{' '}
                    <span className="numeric text-[var(--foreground)]">
                      {resultado.replicate_code ?? '—'}
                    </span>
                  </div>
                </td>
                <td className="border-b border-[var(--border-soft)] px-4 py-4">
                  {completitudBadge(resultado)}
                </td>
                <td className="border-b border-[var(--border-soft)] px-4 py-4 text-[var(--foreground-muted)]">
                  {formatDate(resultado.enviados_at)}
                </td>
                {columnas.map((columna) => {
                  const celda = celdas[columna.key]
                  return (
                    <td
                      key={`${resultado.participante_id}-${columna.key}`}
                      className="border-b border-[var(--border-soft)] px-4 py-4"
                    >
                      {celda ? (
                        <div className="space-y-1">
                          <div className="numeric text-sm font-medium text-[var(--foreground)]">
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function ResultadosPage({ params, searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const { id: rondaId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const ronda = await getRonda(rondaId)
  if (!ronda) notFound()

  const [ptItems, sampleGroups, resultados] = await Promise.all([
    listPTItems(rondaId),
    listPTSampleGroups(rondaId),
    listResultadosPTRonda(rondaId),
  ])

  const columnas: ColumnaPT[] = ptItems.flatMap((item) =>
    sampleGroups.map((group) => ({
      key: `${item.id}::${group.id}`,
      run: item.run_code,
      level: item.level_label,
      sampleGroup: group.sample_group,
      contaminante: item.contaminante,
    }))
  )
  const finalizados = resultados.filter((row) => row.enviados_at != null).length
  const incompletos = resultados.filter((row) => row.completados < row.total_esperado).length
  const canExport = finalizados > 0
  const activeView = getParam(resolvedSearchParams.vista) === 'contaminante' ? 'contaminante' : 'ronda'
  const contaminantes = Array.from(new Set(columnas.map((columna) => columna.contaminante)))
  const baseHref = `/dashboard/rondas/${ronda.id}/resultados`

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Context Navigation */}
        <RondaContextNav rondaId={rondaId} rondaCodigo={ronda.codigo} />

        <header className="header-bar px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">Resultados PT</h1>
                <EstadoBadge estado={ronda.estado} />
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                {ronda.nombre} · Código <span className="font-medium text-[var(--foreground)]">{ronda.codigo}</span>
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Revise la matriz completa por ronda o agrupada por contaminante.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {canExport ? (
                <a href={`/dashboard/rondas/${ronda.id}/resultados/export-pt.csv`} className="btn-primary">
                  Exportar CSV PT
                </a>
              ) : (
                <span className="btn-outline cursor-not-allowed opacity-70">
                  Exportar CSV PT (sin envíos finales)
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricaCard label="Participantes" value={resultados.length} />
          <MetricaCard
            label="Envíos finales"
            value={finalizados}
            total={resultados.length}
            variant={finalizados === resultados.length && resultados.length > 0 ? 'success' : finalizados > 0 ? 'warning' : 'default'}
          />
          <MetricaCard
            label="Incompletos"
            value={incompletos}
            variant={incompletos > 0 ? 'warning' : 'success'}
          />
          <MetricaCard label="Contaminantes" value={contaminantes.length} />
        </section>

        <nav
          className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm"
          style={{ background: 'linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)' }}
        >
          <div className="flex gap-0 overflow-x-auto px-2">
            <Link
              href={baseHref}
              aria-current={activeView === 'ronda' ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeView === 'ronda'
                  ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              Por ronda
            </Link>
            <Link
              href={`${baseHref}?vista=contaminante`}
              aria-current={activeView === 'contaminante' ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeView === 'contaminante'
                  ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              Por contaminante
            </Link>
          </div>
        </nav>

        {!canExport && resultados.length > 0 && (
          <section className="card p-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              El CSV PT exporta únicamente combinaciones con envío final confirmado.
            </div>
          </section>
        )}

        {columnas.length === 0 ? (
          <section className="card p-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No hay columnas PT para revisar. Configura corridas y grupos de muestra en “Configuración PT”.
            </div>
          </section>
        ) : (
          <section className="card p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {activeView === 'ronda' ? 'Resultados por ronda' : 'Resultados por contaminante'}
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                {activeView === 'ronda'
                  ? 'Matriz completa por participante y combinación exacta de corrida, nivel y grupo de muestra.'
                  : 'La misma matriz separada por contaminante para revisar cada bloque analítico.'}
              </p>
            </div>

            {activeView === 'ronda' ? (
              <ResultadosTable resultados={resultados} columnas={columnas} />
            ) : (
              <div className="grid gap-6">
                {contaminantes.map((contaminante) => {
                  const columnasContaminante = columnas.filter((columna) => columna.contaminante === contaminante)
                  return (
                    <article key={contaminante} className="overflow-hidden rounded-xl border border-[var(--border-soft)]">
                      <div className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3">
                        <h3 className="text-base font-semibold text-[var(--foreground)]">{contaminante}</h3>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          {columnasContaminante.length} columna{columnasContaminante.length !== 1 ? 's' : ''} configurada{columnasContaminante.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ResultadosTable resultados={resultados} columnas={columnasContaminante} minWidth="960px" />
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
