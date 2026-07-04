import Link from 'next/link'

import { LogoUnal } from '@/components/LogoUnal'

export function ParticipantTopNav({ hasRondas }: { hasRondas: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-[var(--pt-primary)] bg-[var(--surface-panel)] shadow-sm">
      <div className="mx-auto flex max-w-screen-2xl items-stretch gap-6 px-6">
        <div className="flex items-center gap-3 border-r border-[var(--border-soft)] py-4 pr-6">
          <LogoUnal height={32} />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
            CALAIRE-APP{' '}
            <span className="inline-block rounded bg-[var(--pt-primary)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--foreground)]">
              EA
            </span>
          </span>
        </div>

        <nav className="flex items-stretch" aria-label="Navegación del participante">
          <Link
            href="/mi-dashboard"
            className="relative inline-flex self-stretch items-center px-1 py-0 text-sm font-medium whitespace-nowrap text-[var(--foreground)] transition-colors duration-150 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-[var(--pt-primary)] after:transition-all after:duration-200"
            aria-current="page"
          >
            Inicio
          </Link>
          {hasRondas && (
            <a
              href="/guia.html"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex self-stretch items-center px-4 py-0 text-sm font-medium whitespace-nowrap text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors duration-150"
              title="Abrir guía del participante en nueva pestaña"
            >
              Guía
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5 opacity-60"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
