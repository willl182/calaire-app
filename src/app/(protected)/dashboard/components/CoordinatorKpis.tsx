import Link from 'next/link'

import type { Ronda } from '@/server/rondas'

type CoordinatorKpiBarProps = {
  rondasActivas: number
  rondasBorrador: number
  fichasPendientes: number
  enlacesSinReclamar: number
  rondasListasParaExportar: number
}

function CoordinatorKpiBar({
  rondasActivas,
  rondasBorrador,
  fichasPendientes,
  enlacesSinReclamar,
  rondasListasParaExportar,
}: CoordinatorKpiBarProps) {
  const kpis = [
    {
      label: 'Rondas activas',
      value: rondasActivas,
      detail: 'Disponibles para gestión',
      href: '/dashboard?tab=rondas',
      negative: false,
    },
    {
      label: 'Fichas pendientes',
      value: fichasPendientes,
      detail: 'Por revisar o completar',
      href: '/dashboard?tab=participantes',
      negative: true,
    },
    {
      label: 'Cupos sin reclamar',
      value: enlacesSinReclamar,
      detail: 'Invitaciones pendientes',
      href: '/dashboard?tab=participantes',
      negative: true,
    },
    {
      label: 'Listas para exportar',
      value: rondasListasParaExportar,
      detail: 'Con resultados finales',
      href: '/dashboard?tab=resultados',
      negative: false,
    },
    {
      label: 'En borrador',
      value: rondasBorrador,
      detail: 'Rondas aún no activas',
      href: '/dashboard?tab=rondas',
      negative: false,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map(({ label, value, detail, href, negative }) => (
        <Link
          key={label}
          href={href}
          className={`card-accent px-5 py-4 transition hover:border-[var(--pt-primary)] ${
            value > 0 && negative ? 'border-amber-300 bg-amber-50/50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
            {label}
          </p>
          <div className={`numeric mt-2 text-3xl font-semibold ${
            value > 0 && negative ? 'text-amber-700' : 'text-[var(--foreground)]'
          }`}>
            {value}
          </div>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">{detail}</p>
        </Link>
      ))}
    </div>
  )
}

export function CoordinatorKpis({
  rondas,
  rondasActivas,
  fichasPendientesCount,
  enlacesSinReclamar,
  rondasListasParaExportar,
}: {
  rondas: Ronda[]
  rondasActivas: Ronda[]
  fichasPendientesCount: number
  enlacesSinReclamar: number
  rondasListasParaExportar: number
}) {
  return (
    <CoordinatorKpiBar
      rondasActivas={rondasActivas.length}
      rondasBorrador={rondas.filter((r) => r.estado === 'borrador').length}
      fichasPendientes={fichasPendientesCount}
      enlacesSinReclamar={enlacesSinReclamar}
      rondasListasParaExportar={rondasListasParaExportar}
    />
  )
}

