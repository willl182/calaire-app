import Link from 'next/link'

import type { AvisoPanel, EstadoRondaVisible } from '@/lib/rondas/estado-visible'
import { TONO_AVISO, TONO_INSIGNIA } from '@/lib/ui/tonos'
import type { Ronda, RondaMetricas } from '@/server/rondas'

/* ─── Attention List ─────────────────────────────────────────────────── */
function AttentionList({ items }: { items: AvisoPanel[] }) {
  if (items.length === 0) return null
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
        Requiere atención
      </h2>
      <ul className="grid gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition hover:border-[var(--pt-primary)] hover:no-underline ${TONO_AVISO[item.tono]}`}
            >
              <span>{item.mensaje}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-0.5 text-xs font-semibold">
                  {item.cantidad}
                </span>
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─── Estado Operativo Badge ─────────────────────────────────────────── */
function EstadoOperativoBadge({ estado }: { estado: EstadoRondaVisible }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap ${TONO_INSIGNIA[estado.tono]}`}>
      {estado.etiqueta}
    </span>
  )
}

/* ─── Mini Progress Bar ──────────────────────────────────────────────── */
function MiniProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="mt-1 h-1.5 w-full max-w-[5rem] rounded-full bg-[var(--border)]" title={`${pct}%`}>
      <div
        className="h-full rounded-full bg-[var(--pt-primary)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ─── Rondas en Curso (inicio view) ──────────────────────────────────── */
function RondasEnCurso({
  rondasActivas,
  estados,
  metricas,
}: {
  rondasActivas: Ronda[]
  estados: EstadoRondaVisible[]
  metricas: RondaMetricas[]
}) {
  if (rondasActivas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay rondas activas en este momento.
      </div>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
        Rondas en curso
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem]">
            <thead>
              <tr className="border-b-2 border-[var(--pt-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ronda</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Cupos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Fichas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Envíos PT</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]"></th>
              </tr>
            </thead>
            <tbody>
              {rondasActivas.map((ronda, i) => {
                const estado = estados[i]
                const m = metricas[i]
                return (
                  <tr key={ronda.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      <EstadoOperativoBadge estado={estado} />
                      <Link
                        href={estado.href}
                        className="mt-1.5 block text-xs text-[var(--foreground-muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
                      >
                        {estado.accion}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm text-[var(--foreground)]">{ronda.nombre}</div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{ronda.codigo}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">
                        {m.cupos_reclamados}/{m.cupos_totales}
                      </span>
                      <MiniProgressBar current={m.cupos_reclamados} total={m.cupos_totales} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">
                        {m.fichas_enviadas}/{m.cupos_reclamados}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">{m.envios_finales}/{m.envios_esperados}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/rondas/${ronda.id}`}
                        className="inline-flex items-center rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)]"
                      >
                        Abrir →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export function CoordinatorOverview({
  rondasActivas,
  estados,
  metricas,
  avisos,
}: {
  rondasActivas: Ronda[]
  estados: EstadoRondaVisible[]
  metricas: RondaMetricas[]
  avisos: AvisoPanel[]
}) {
  return (
    <>
      <AttentionList items={avisos} />
      <RondasEnCurso rondasActivas={rondasActivas} estados={estados} metricas={metricas} />
      <a
        href="https://w421.shinyapps.io/pt_app/"
        target="_blank"
        rel="noopener noreferrer"
        className="card flex items-center justify-between gap-4 p-5 transition hover:border-[var(--pt-primary)]"
      >
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Herramienta de análisis PT App</p>
          <p className="text-xs text-[var(--foreground-muted)]">Aplicativo R/Shiny para el procesamiento estadístico de resultados</p>
        </div>
        <span className="btn-primary shrink-0">Abrir →</span>
      </a>
    </>
  )
}
