'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { LogoUnal } from '@/app/components/LogoUnal'

const PT_APP_URL = 'https://w421.shinyapps.io/pt_app/'

type NavItem = {
  label: string
  href: string
  tabKey: string | null
  group: 'sgc' | 'gestion' | 'externos'
  external?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio',        href: '/dashboard',                  tabKey: null, group: 'gestion' },
  { label: 'Rondas',        href: '/dashboard?tab=rondas',       tabKey: 'rondas', group: 'gestion' },
  { label: 'Expedientes',   href: '/dashboard/rondas/expedientes', tabKey: '__ronda_expedientes__', group: 'gestion' },
  { label: 'Registros',     href: '/dashboard?tab=registros',    tabKey: 'registros', group: 'gestion' },
  { label: 'Participantes', href: '/dashboard?tab=participantes', tabKey: 'participantes', group: 'gestion' },
  { label: 'Resultados',    href: '/dashboard?tab=resultados',   tabKey: 'resultados', group: 'gestion' },
  { label: 'SGC inicio',    href: '/dashboard/sgc',              tabKey: '__sgc_home__', group: 'sgc' },
  { label: 'Documentos',    href: '/dashboard/sgc/documentos',   tabKey: '__sgc_documentos__', group: 'sgc' },
  { label: 'Normativa',     href: '/dashboard/sgc/normativa',    tabKey: '__sgc_normativa__', group: 'sgc' },
  { label: 'Mapa',          href: '/dashboard/sgc/mapa',         tabKey: '__sgc_mapa__', group: 'sgc' },
  { label: 'pt_app', href: PT_APP_URL, tabKey: '__external__', group: 'externos', external: true },
]

const NAV_GROUPS: Array<{ key: NavItem['group']; label: string }> = [
  { key: 'sgc', label: 'SGC' },
  { key: 'gestion', label: 'Gestion' },
  { key: 'externos', label: 'Sistemas externos' },
]

function NavLink({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  const base =
    'relative inline-flex items-center self-stretch px-1 py-0 text-sm font-medium whitespace-nowrap transition-colors duration-150 ' +
    'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:transition-all after:duration-200'

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={
          `${base} text-[var(--foreground-muted)] hover:text-[var(--foreground)] ` +
          `after:bg-transparent hover:after:bg-[var(--border)] gap-1`
        }
      >
        {item.label}
        <span className="text-[9px] opacity-50" aria-hidden="true">↗</span>
        <span className="sr-only">(abre en nueva pestaña)</span>
      </a>
    )
  }

  return (
    <Link
      href={item.href}
      className={
        `${base} ` +
        (isActive
          ? 'text-[var(--foreground)] after:bg-[var(--pt-primary)]'
          : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] after:bg-transparent hover:after:bg-[var(--border)]')
      }
    >
      {item.label}
    </Link>
  )
}

function TopNavInner() {
  const pathname   = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  function isActive(item: NavItem): boolean {
    if (item.external) return false
    if (item.tabKey === null) return pathname === '/dashboard' && !tab
    if (item.tabKey === '__sgc_home__') return pathname === '/dashboard/sgc'
    if (item.tabKey === '__sgc_documentos__') return pathname.startsWith('/dashboard/sgc/documentos')
    if (item.tabKey === '__sgc_normativa__') return pathname.startsWith('/dashboard/sgc/normativa')
    if (item.tabKey === '__sgc_mapa__') return pathname.startsWith('/dashboard/sgc/mapa')
    if (item.tabKey === '__ronda_expedientes__') return pathname.startsWith('/dashboard/rondas/expedientes')
    if (item.tabKey === 'registros') return tab === 'registros'
    return tab === item.tabKey
  }

  return (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--pt-primary)]" style={{ background: 'linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)' }}>
      <div className="flex items-stretch gap-6 px-6 max-w-screen-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 pr-6 border-r border-[var(--border-soft)] py-4">
          <LogoUnal height={32} />
          <span className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--foreground)]">
            CALAIRE-APP{' '}
            <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider bg-[var(--pt-primary)] text-[var(--foreground)]">
              EA
            </span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex items-stretch gap-6 overflow-x-auto" aria-label="Navegación principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.key} className="flex items-stretch gap-3">
              <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                {group.label}
              </div>
              <div className="flex items-stretch gap-4">
                {NAV_ITEMS.filter((item) => item.group === group.key).map((item) => (
                  <NavLink key={item.label} item={item} isActive={isActive(item)} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </header>
  )
}

export function Sidebar() {
  return (
    <Suspense>
      <TopNavInner />
    </Suspense>
  )
}

export function MobileNav() {
  return null
}
