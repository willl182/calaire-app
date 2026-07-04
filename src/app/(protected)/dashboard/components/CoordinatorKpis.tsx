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
      href: '/dashboard?tab=rondas',
      negative: false,
    },
    {
      label: 'Fichas pendientes',
      value: fichasPendientes,
      href: '/dashboard?tab=participantes',
      negative: true,
    },
    {
      label: 'Cupos sin reclamar',
      value: enlacesSinReclamar,
      href: '/dashboard?tab=participantes',
      negative: true,
    },
    {
      label: 'Listas para exportar',
      value: rondasListasParaExportar,
      href: '/dashboard?tab=resultados',
      negative: false,
    },
    {
      label: 'En borrador',
      value: rondasBorrador,
      href: '/dashboard?tab=rondas',
      negative: false,
    },
  ]

  return (
    <div className="sgc-kpis sgc-kpis-five">
      {kpis.map(({ label, value, href, negative }) => (
        <Link
          key={label}
          href={href}
          className={`sgc-kpi hover:no-underline ${value > 0 && negative ? 'bg-amber-50/50' : ''}`}
        >
          <p className="sgc-kpi-label">
            {label}
          </p>
          <div className={`sgc-kpi-value numeric ${
            value > 0 && negative ? 'text-amber-700' : 'text-[var(--foreground)]'
          }`}>
            {value}
          </div>
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
