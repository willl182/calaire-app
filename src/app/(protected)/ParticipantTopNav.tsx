'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoUnal } from '@/components/LogoUnal'

import { signOutAction } from './dashboard/actions'
import { SubmitButton } from '@/components/ui/SubmitButton'

const linkBase =
  'relative inline-flex self-stretch items-center px-3 py-0 text-sm font-medium whitespace-nowrap transition-colors duration-150 ' +
  'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:transition-all after:duration-200'

function linkClass(active: boolean) {
  return (
    linkBase +
    (active
      ? ' text-[var(--foreground)] after:bg-[var(--pt-primary)]'
      : ' text-[var(--foreground-muted)] hover:text-[var(--foreground)] after:bg-transparent')
  )
}

export function ParticipantTopNav({ hasRondas }: { hasRondas: boolean }) {
  const pathname = usePathname()
  const inicioActive = pathname === '/mi-dashboard' || pathname.startsWith('/ronda/') || pathname === '/inicio'
  const calendarioActive = pathname.startsWith('/calendario')

  return (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--pt-primary)] bg-[var(--surface-panel)] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-stretch gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/mi-dashboard" className="flex shrink-0 items-center gap-3 py-3 sm:border-r sm:border-[var(--border-soft)] sm:pr-6">
          <LogoUnal height={32} />
          <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)] md:inline">
            CALAIRE-APP{' '}
            <span className="inline-block rounded bg-[var(--pt-primary)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--foreground)]">
              EA
            </span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-stretch overflow-x-auto" aria-label="Navegación del participante">
          <Link href="/mi-dashboard" className={linkClass(inicioActive)} aria-current={inicioActive ? 'page' : undefined}>
            Inicio
          </Link>
          {hasRondas && (
            <Link href="/calendario" className={linkClass(calendarioActive)} aria-current={calendarioActive ? 'page' : undefined}>
              Calendario
            </Link>
          )}
          {hasRondas && (
            <a
              href="/guia.html"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass(false)}
              title="Abrir guía del participante en nueva pestaña"
            >
              Guía
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 opacity-60" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span className="sr-only">(abre en nueva pestaña)</span>
            </a>
          )}
        </nav>

        <form action={signOutAction} className="flex shrink-0 items-center">
          <SubmitButton className="btn-outline whitespace-nowrap">
            Cerrar sesión
          </SubmitButton>
        </form>
      </div>
    </header>
  )
}
