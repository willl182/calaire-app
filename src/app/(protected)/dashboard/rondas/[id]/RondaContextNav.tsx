'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type Props = { rondaId: string; rondaCodigo: string; ptConfigurado?: boolean }

const TABS = [
  { label: 'Resumen', href: (id: string) => `/dashboard/rondas/${id}` },
  { label: 'Configuración PT', href: (id: string) => `/dashboard/rondas/${id}/configuracion-pt` },
  { label: 'Participantes', href: (id: string) => `/dashboard/rondas/${id}/participantes` },
  { label: 'Resultados', href: (id: string) => `/dashboard/rondas/${id}/resultados` },
  { label: 'SGC', href: (id: string) => `/dashboard/rondas/${id}/sgc` },
]

export function RondaContextNav({ rondaId, rondaCodigo }: Props) {
  const pathname = usePathname()

  function isActive(tab: (typeof TABS)[number]) {
    const tabPath = tab.href(rondaId)
    // "Resumen" tab: exact match only (no trailing segment)
    if (tab.label === 'Resumen') {
      return pathname === tabPath
    }
    // Other tabs: startsWith for nested routes
    return pathname.startsWith(tabPath)
  }

  return (
    <nav className="card overflow-hidden p-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-5 pt-3 pb-0">
        <Link
          href="/dashboard"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
        >
          Dashboard
        </Link>
        <span className="text-[var(--border)] text-xs">/</span>
        <Link
          href={`/dashboard/rondas/${rondaId}`}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
        >
          {rondaCodigo}
        </Link>
      </div>
      {/* Tabs */}
      <div className="tab-nav overflow-x-auto px-2">
        {TABS.map((tab) => {
          const active = isActive(tab)
          const href = tab.href(rondaId)
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap ${active ? 'tab-active' : ''}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
