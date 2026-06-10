import Link from 'next/link'

import type { AttentionItem, EstadoOperativo } from '@/lib/operativo'
import { derivarEstadoOperativo } from '@/lib/operativo'
import type { ParticipanteRondaResumen, Ronda } from '@/lib/rondas'

/* ─── Attention List ─────────────────────────────────────────────────── */
function AttentionList({ items }: { items: AttentionItem[] }) {
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
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition hover:border-[var(--pt-primary)] ${
                item.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50/60 text-amber-800'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
              }`}
            >
              <span>{item.message}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                item.severity === 'warning'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-[var(--pt-primary-subtle)] text-[var(--foreground)]'
              }`}>
                {item.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─── Estado Operativo Badge ─────────────────────────────────────────── */
const estadoColorClasses: Record<EstadoOperativo['color'], string> = {
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  slate: 'bg-slate-200 text-slate-700',
  violet: 'bg-violet-100 text-violet-800',
}

function EstadoOperativoBadge({ estado }: { estado: EstadoOperativo }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap ${estadoColorClasses[estado.color]}`}>
      {estado.label}
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
  participantesPorRonda,
}: {
  rondasActivas: Ronda[]
  participantesPorRonda: ParticipanteRondaResumen[][]
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
                const participantes = participantesPorRonda[i] ?? []
                const estado = derivarEstadoOperativo(ronda, participantes)
                const fichasEnviadas = participantes.filter((p) => p.ficha_estado === 'enviado').length
                const totalEnviosPT = participantes.reduce((sum, p) => sum + p.envios_pt_count, 0)
                return (
                  <tr key={ronda.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      <EstadoOperativoBadge estado={estado} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm text-[var(--foreground)]">{ronda.nombre}</div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{ronda.codigo}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">
                        {ronda.participantes_asignados ?? 0}/{ronda.participantes_planeados ?? 0}
                      </span>
                      <MiniProgressBar current={ronda.participantes_asignados ?? 0} total={ronda.participantes_planeados ?? 0} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">
                        {fichasEnviadas}/{participantes.length}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">{totalEnviosPT}</span>
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
  activeTab,
  rondasActivas,
  participantesRondasActivas,
  attentionItems,
}: {
  activeTab: string
  rondasActivas: Ronda[]
  participantesRondasActivas: ParticipanteRondaResumen[][]
  attentionItems: AttentionItem[]
}) {
  if (activeTab !== 'inicio') return null

  return (
    <>
      <AttentionList items={attentionItems} />
      <RondasEnCurso
        rondasActivas={rondasActivas}
        participantesPorRonda={participantesRondasActivas}
      />
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
