import Link from 'next/link'

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
      href: '/dashboard/rondas',
      negative: false,
    },
    {
      label: 'Fichas pendientes',
      value: fichasPendientes,
      href: '/dashboard/participantes',
      negative: true,
    },
    {
      label: 'Cupos sin reclamar',
      value: enlacesSinReclamar,
      href: '/dashboard/participantes#sin-enlace',
      negative: true,
    },
    {
      label: 'Listas para exportar',
      value: rondasListasParaExportar,
      href: '/dashboard/resultados',
      negative: false,
    },
    {
      label: 'En borrador',
      value: rondasBorrador,
      href: '/dashboard/rondas',
      negative: false,
    },
  ]

  return (
    <div className="sgc-kpis sgc-kpis-five">
      {kpis.map(({ label, value, href, negative }) => (
        <Link
          key={label}
          href={href}
          className={`sgc-kpi hover:no-underline ${value > 0 && negative ? 'bg-warning-soft/50' : ''}`}
        >
          <p className="sgc-kpi-label">
            {label}
          </p>
          <div className={`sgc-kpi-value numeric ${
            value > 0 && negative ? 'text-warning-strong' : 'text-[var(--foreground)]'
          }`}>
            {value}
          </div>
        </Link>
      ))}
    </div>
  )
}

export const CoordinatorKpis = CoordinatorKpiBar
