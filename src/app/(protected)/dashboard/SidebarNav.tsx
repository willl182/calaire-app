'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { LogoUnal } from '@/components/LogoUnal'
import { signOutAction } from './actions'

const PT_APP_URL = 'https://w421.shinyapps.io/pt_app/'

type NavItem = {
  label: string
  href: string
  tabKey: string | null
  external?: boolean
}

const GESTION_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', tabKey: '__gestion_home__' },
  { label: 'Rondas', href: '/dashboard/rondas', tabKey: '__gestion_rondas__' },
  { label: 'Registros', href: '/dashboard/registros', tabKey: '__gestion_registros__' },
  { label: 'Participantes', href: '/dashboard/participantes', tabKey: '__gestion_participantes__' },
  { label: 'Resultados', href: '/dashboard/resultados', tabKey: '__gestion_resultados__' },
]

const SGC_NAV_ITEMS: NavItem[] = [
  { label: 'Inicio Sistema de Gestión', href: '/dashboard/sgc', tabKey: '__sgc_home__' },
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
  const isSgcDashboard = pathname.startsWith('/dashboard/sgc')
  const navItems = !canViewSgcMaestro ? [] : isSgcDashboard ? SGC_NAV_ITEMS : GESTION_NAV_ITEMS
  const areaItems: NavItem[] = [
    { label: 'Gestión de rondas', href: '/dashboard', tabKey: '__gestion__' },
    ...(canViewSgcMaestro ? [{ label: 'Sistema de Gestión', href: '/dashboard/sgc', tabKey: '__sgc__' }] : []),
    { label: 'pt_app', href: PT_APP_URL, tabKey: '__external__', external: true },
  ]

  function isActive(item: NavItem): boolean {
    if (item.external) return false
    if (item.tabKey === '__gestion_home__') return pathname === '/dashboard'
    if (item.tabKey === '__gestion_rondas__') return pathname.startsWith('/dashboard/rondas')
    if (item.tabKey === '__gestion_registros__') return pathname.startsWith('/dashboard/registros')
    if (item.tabKey === '__gestion_participantes__') return pathname.startsWith('/dashboard/participantes')
    if (item.tabKey === '__gestion_resultados__') return pathname.startsWith('/dashboard/resultados')
    if (item.tabKey === '__sgc_documentos__') return pathname.startsWith('/dashboard/sgc/documentos')
    if (item.tabKey === '__sgc_normativa__') return pathname.startsWith('/dashboard/sgc/normativa')
    if (item.tabKey === '__sgc_mapa__') return pathname.startsWith('/dashboard/sgc/mapa')
    if (item.tabKey === '__sgc_home__') return pathname === '/dashboard/sgc'
    return false
  }

  const header = (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--pt-primary)] bg-[var(--surface-panel)] shadow-sm">
      <div className="flex items-stretch gap-5 px-6 max-w-screen-2xl mx-auto">
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
          aria-label={isSgcDashboard ? 'Secciones Sistema de Gestión' : 'Secciones gestión de ronda'}
        >
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} isActive={isActive(item)} />
          ))}
        </nav>
      </div>
    </header>
  )

  return (
    <>
      {header}
      <div className="border-b border-[var(--border-soft)] bg-[var(--surface-panel)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-5">
            <LogoUnal height={56} />
            <div className="min-w-0 space-y-0.5">
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Ensayos de Aptitud</span>
              </h1>
              <p className="text-base font-medium text-[var(--pt-primary-dark)]">
                Gases Contaminantes Criterio
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
              </p>
            </div>
          </div>
          <form action={signOutAction} className="shrink-0">
            <button type="submit" className="btn-outline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </>
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
