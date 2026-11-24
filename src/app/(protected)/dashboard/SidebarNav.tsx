'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useState } from 'react'
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
      aria-current={isActive ? 'page' : undefined}
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
    <Link href={item.href} className={className} aria-current={isActive ? 'page' : undefined}>
      {item.label}
    </Link>
  )
}

function UserMenu({ userEmail }: { userEmail: string }) {
  return (
    <details className="group relative">
      <summary
        className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md px-2 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] [&::-webkit-details-marker]:hidden"
        aria-label="Menú de usuario"
      >
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pt-primary)] text-xs font-bold uppercase text-[var(--foreground)]"
          aria-hidden="true"
        >
          {userEmail.charAt(0) || '?'}
        </span>
        <span className="hidden max-w-[14rem] truncate lg:inline">{userEmail}</span>
        <span className="text-[10px] opacity-60" aria-hidden="true">▾</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-md border border-[var(--border-soft)] bg-[var(--surface-panel)] p-3 shadow-lg">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">{userEmail}</p>
        <p className="text-xs text-[var(--foreground-muted)]">Coordinador · Laboratorio CALAIRE</p>
        <form action={signOutAction} className="mt-3">
          <button type="submit" className="btn-outline w-full">
            Cerrar sesión
          </button>
        </form>
      </div>
    </details>
  )
}

function TopNavInner({ canViewSgcMaestro, userEmail }: { canViewSgcMaestro: boolean; userEmail: string }) {
  const pathname   = usePathname()
  const isSgcDashboard = pathname.startsWith('/dashboard/sgc')
  const navItems = !canViewSgcMaestro ? [] : isSgcDashboard ? SGC_NAV_ITEMS : GESTION_NAV_ITEMS
  const areaItems: NavItem[] = [
    { label: 'Gestión de rondas', href: '/dashboard', tabKey: '__gestion__' },
    ...(canViewSgcMaestro ? [{ label: 'Sistema de Gestión', href: '/dashboard/sgc', tabKey: '__sgc__' }] : []),
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

  const externalItems: NavItem[] = [
    { label: 'Aplicativo de cálculo PT (Shiny)', href: PT_APP_URL, tabKey: '__external__', external: true },
  ]
  const sectionsLabel = isSgcDashboard ? 'Secciones Sistema de Gestión' : 'Secciones gestión de ronda'
  const isAreaActive = (item: NavItem) =>
    !item.external && (item.tabKey === '__sgc__' ? isSgcDashboard : !isSgcDashboard)

  const header = (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--pt-primary)] bg-[var(--surface-panel)] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-stretch gap-3 px-4 sm:px-6 lg:gap-5">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-3 py-3 lg:border-r lg:border-[var(--border-soft)] lg:pr-6">
          <LogoUnal height={32} />
          <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)] sm:inline">
            CALAIRE-APP{' '}
            <span className="inline-block rounded bg-[var(--pt-primary)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--foreground)]">
              EA
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 border-r border-[var(--border-soft)] pr-5 lg:flex" aria-label="Áreas principales">
          {areaItems.map((item) => (
            <AreaLink key={item.label} item={item} isActive={isAreaActive(item)} />
          ))}
        </nav>

        <nav className="hidden min-w-0 flex-1 items-stretch gap-5 overflow-x-auto lg:flex" aria-label={sectionsLabel}>
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} isActive={isActive(item)} />
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <a
            href={PT_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline lg:inline-flex"
            title="Aplicativo externo de cálculo de ensayos de aptitud (pt_app, Shiny)"
          >
            Cálculo PT (Shiny)
            <span className="text-[9px] opacity-60" aria-hidden="true">↗</span>
            <span className="sr-only">(aplicativo externo, abre en nueva pestaña)</span>
          </a>
          <UserMenu userEmail={userEmail} />
          <MobileNav
            areaItems={areaItems}
            navItems={navItems}
            externalItems={externalItems}
            sectionsLabel={sectionsLabel}
            isAreaActive={isAreaActive}
            isActive={isActive}
          />
        </div>
      </div>
    </header>
  )

  return header
}

export function Sidebar({ canViewSgcMaestro, userEmail }: { canViewSgcMaestro: boolean; userEmail: string }) {
  return (
    <Suspense>
      <TopNavInner canViewSgcMaestro={canViewSgcMaestro} userEmail={userEmail} />
    </Suspense>
  )
}

export function MobileNav({
  areaItems,
  navItems,
  externalItems,
  sectionsLabel,
  isAreaActive,
  isActive,
}: {
  areaItems: NavItem[]
  navItems: NavItem[]
  externalItems: NavItem[]
  sectionsLabel: string
  isAreaActive: (item: NavItem) => boolean
  isActive: (item: NavItem) => boolean
}) {
  const [open, setOpen] = useState(false)
  // Cierra el menú al navegar.
  const close = () => setOpen(false)

  const itemClass = (active: boolean) =>
    'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium ' +
    (active
      ? 'bg-[var(--pt-primary)] text-[var(--foreground)]'
      : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]')

  const renderItem = (item: NavItem, active: boolean) =>
    item.external ? (
      <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={itemClass(false)} onClick={close}>
        {item.label}
        <span className="text-[9px] opacity-60" aria-hidden="true">↗</span>
        <span className="sr-only">(abre en nueva pestaña)</span>
      </a>
    ) : (
      <Link key={item.label} href={item.href} className={itemClass(active)} onClick={close} aria-current={active ? 'page' : undefined}>
        {item.label}
      </Link>
    )

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 shadow-lg"
        >
          <nav aria-label="Áreas principales (móvil)" className="flex flex-col gap-1">
            {areaItems.map((item) => renderItem(item, isAreaActive(item)))}
          </nav>
          {navItems.length > 0 && (
            <nav aria-label={`${sectionsLabel} (móvil)`} className="mt-3 flex flex-col gap-1 border-t border-[var(--border-soft)] pt-3">
              {navItems.map((item) => renderItem(item, isActive(item)))}
            </nav>
          )}
          <nav aria-label="Enlaces externos (móvil)" className="mt-3 flex flex-col gap-1 border-t border-[var(--border-soft)] pt-3">
            {externalItems.map((item) => renderItem(item, false))}
          </nav>
        </div>
      )}
    </div>
  )
}
