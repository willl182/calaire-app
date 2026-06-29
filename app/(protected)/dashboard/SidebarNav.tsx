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
  external?: boolean
}

const GESTION_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', tabKey: null },
  { label: 'Rondas', href: '/dashboard?tab=rondas', tabKey: 'rondas' },
  { label: 'Registros', href: '/dashboard?tab=registros', tabKey: 'registros' },
  { label: 'Participantes', href: '/dashboard?tab=participantes', tabKey: 'participantes' },
  { label: 'Resultados', href: '/dashboard?tab=resultados', tabKey: 'resultados' },
]

const SGC_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio SGC', href: '/dashboard/sgc', tabKey: '__sgc_home__' },
  { label: 'Documentos', href: '/dashboard/sgc/documentos', tabKey: '__sgc_documentos__' },
  { label: 'Normativa', href: '/dashboard/sgc/normativa', tabKey: '__sgc_normativa__' },
  { label: 'Mapa', href: '/dashboard/sgc/mapa', tabKey: '__sgc_mapa__' },
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

function AreaLink({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  const className =
    'inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ' +
    (isActive
      ? 'bg-[var(--pt-primary)] text-[var(--foreground)] shadow-sm'
      : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]')

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={`${className} gap-1`}>
        {item.label}
        <span className="text-[9px] opacity-60" aria-hidden="true">↗</span>
        <span className="sr-only">(abre en nueva pestaña)</span>
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  )
}

function TopNavInner({ canViewSgcMaestro }: { canViewSgcMaestro: boolean }) {
  const pathname   = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const isSgcDashboard = pathname.startsWith('/dashboard/sgc')
  const navItems = !canViewSgcMaestro ? [] : isSgcDashboard ? SGC_NAV_ITEMS : GESTION_NAV_ITEMS
  const areaItems: NavItem[] = [
    { label: 'Gestión de rondas', href: '/dashboard', tabKey: '__gestion__' },
    ...(canViewSgcMaestro ? [{ label: 'SGC', href: '/sgc', tabKey: '__sgc__' }] : []),
    { label: 'pt_app', href: PT_APP_URL, tabKey: '__external__', external: true },
  ]

  function isActive(item: NavItem): boolean {
    if (item.external) return false
    if (item.tabKey === null) return pathname === '/dashboard' && !tab
    if (item.tabKey === '__sgc_documentos__') return pathname.startsWith('/dashboard/sgc/documentos')
    if (item.tabKey === '__sgc_normativa__') return pathname.startsWith('/dashboard/sgc/normativa')
    if (item.tabKey === '__sgc_mapa__') return pathname.startsWith('/dashboard/sgc/mapa')
    if (item.tabKey === '__sgc_home__') return pathname === '/dashboard/sgc'
    if (item.tabKey === 'registros') return tab === 'registros'
    return tab === item.tabKey
  }

  return (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--pt-primary)]" style={{ background: 'linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)' }}>
      <div className="flex items-stretch gap-5 px-6 max-w-screen-2xl mx-auto">
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

        <nav className="flex items-center gap-1 border-r border-[var(--border-soft)] pr-5" aria-label="Áreas principales">
          {areaItems.map((item) => (
            <AreaLink
              key={item.label}
              item={item}
              isActive={!item.external && (item.tabKey === '__sgc__' ? isSgcDashboard : !isSgcDashboard)}
            />
          ))}
        </nav>

        <nav
          className="flex min-w-0 flex-1 items-stretch gap-5 overflow-x-auto"
          aria-label={isSgcDashboard ? 'Secciones SGC' : 'Secciones gestión de ronda'}
        >
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} isActive={isActive(item)} />
          ))}
        </nav>
      </div>
    </header>
  )
}

export function Sidebar({ canViewSgcMaestro }: { canViewSgcMaestro: boolean }) {
  return (
    <Suspense>
      <TopNavInner canViewSgcMaestro={canViewSgcMaestro} />
    </Suspense>
  )
}

export function MobileNav() {
  return null
}
