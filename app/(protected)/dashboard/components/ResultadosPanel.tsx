import Link from 'next/link'

import type { Contaminante } from '@/lib/rondas'
import {
  getResultadoColumns,
  getResultadosSummary,
  type ResultadoDashboardRonda,
} from '../view-model'
import { statusClasses } from '../view-model'

import { ResultadosDashboardTable } from './ResultadosDashboardTable'

export function ResultadosGlobalView({
  rondasResultados,
  activeContaminante,
}: {
  rondasResultados: ResultadoDashboardRonda[]
  activeContaminante: Contaminante | null
}) {
  if (rondasResultados.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay rondas creadas todavía.
      </div>
    )
  }

  const { rondasConConfig, totalParticipantes, totalEnviosFinales, contaminantes, activeTab } = getResultadosSummary(rondasResultados, activeContaminante)
  const baseHref = '/dashboard?tab=resultados'

  return (
    <div className="grid gap-6">
      <header className="header-bar px-6 py-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Resultados PT</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Dashboard global de resultados. Ingrese por ronda o revise una pestaña específica por contaminante.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent border-l-[var(--pt-primary)] px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Rondas</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{rondasResultados.length}</div>
        </div>
        <div className="card-accent border-l-[var(--pt-primary)] px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Participantes</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{totalParticipantes}</div>
        </div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Envíos finales</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{totalEnviosFinales}</div>
        </div>
        <div className="card-accent border-l-[var(--pt-primary)] px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Contaminantes</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{contaminantes.length}</div>
        </div>
      </section>

      <nav
        className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm"
        style={{ background: 'linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)' }}
      >
        <div className="flex gap-0 overflow-x-auto px-2">
          <Link
            href={baseHref}
            aria-current={activeTab === 'rondas' ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'rondas'
                ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
            }`}
          >
            Rondas
          </Link>
          {contaminantes.map((contaminante) => (
            <Link
              key={contaminante}
              href={`${baseHref}&contaminante=${contaminante}`}
              aria-current={activeTab === contaminante ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === contaminante
                  ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              {contaminante}
            </Link>
          ))}
        </div>
      </nav>

      {rondasConConfig.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
          No hay resultados PT configurados todavía.
        </div>
      ) : activeTab === 'rondas' ? (
        <section className="card overflow-hidden">
          <div className="border-b border-[var(--border-soft)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Rondas con resultados</h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              Tabla global para entrar a la matriz de resultados de cada ronda.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem]">
              <thead>
                <tr className="border-b-2 border-[var(--pt-primary)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ronda</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Contaminantes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Participantes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Envíos finales</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rondasConConfig.map(({ ronda, ptItems, resultados }) => {
                  const enviosFinales = resultados.filter((resultado) => resultado.enviados_at !== null).length
                  const contaminantesRonda = Array.from(new Set(ptItems.map((item) => item.contaminante)))
                  return (
                    <tr key={ronda.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusClasses(ronda.estado)}`}>
                          {ronda.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-sm text-[var(--foreground)]">{ronda.nombre}</div>
                        <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">{ronda.codigo}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {contaminantesRonda.map((contaminante) => (
                            <span key={`${ronda.id}-${contaminante}`} className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--foreground-muted)]">
                              {contaminante}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="numeric text-sm text-[var(--foreground)]">{resultados.length}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="numeric rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          {enviosFinales}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/dashboard/rondas/${ronda.id}/resultados`}
                          className="btn-primary inline-flex px-3 py-1 text-xs"
                        >
                          Ingresar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="grid gap-6">
          {rondasConConfig
            .map((item) => ({
              ...item,
              columnas: getResultadoColumns(item.ptItems, item.sampleGroups, activeTab as Contaminante),
            }))
            .filter((item) => item.columnas.length > 0)
            .map(({ ronda, resultados, columnas }) => (
              <article key={`${activeTab}-${ronda.id}`} className="card overflow-hidden">
                <div className="border-b border-[var(--border-soft)] px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{ronda.nombre}</h3>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {ronda.codigo} · resultados para {activeTab}
                      </p>
                    </div>
                    <Link href={`/dashboard/rondas/${ronda.id}/resultados`} className="btn-outline self-start">
                      Ingresar
                    </Link>
                  </div>
                </div>
                <ResultadosDashboardTable resultados={resultados} columnas={columnas} />
              </article>
            ))}
        </section>
      )}
      </div>
  )
}
