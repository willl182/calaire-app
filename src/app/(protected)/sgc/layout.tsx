'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoUnal } from '@/components/LogoUnal'

const PT_APP_URL = 'https://w421.shinyapps.io/pt_app/'

const SGC_NAV_ITEMS = [
  { label: 'Inicio SGC', href: '/sgc' },
  { label: 'Documentos', href: '/sgc/documentos' },
  { label: 'Normativa', href: '/sgc/normativa' },
  { label: 'Mapa', href: '/sgc/mapa' },
]

export default function SgcRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b-4 border-[var(--pt-primary)] bg-[var(--surface-panel)] shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl items-stretch gap-5 px-6">
          <Link href="/inicio" className="flex items-center gap-3 border-r border-[var(--border-soft)] py-4 pr-6 hover:no-underline">
            <LogoUnal height={32} />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
              CALAIRE-APP <span className="inline-block rounded bg-[var(--pt-primary)] px-1.5 py-0.5 text-[10px]">EA</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 border-r border-[var(--border-soft)] pr-5" aria-label="Áreas principales">
            <Link className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]" href="/dashboard">Gestión de rondas</Link>
            <Link className="inline-flex h-9 items-center rounded-md bg-[var(--pt-primary)] px-3 text-sm font-semibold text-[var(--foreground)] shadow-sm" href="/sgc">SGC</Link>
            <a className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]" href={PT_APP_URL} target="_blank" rel="noopener noreferrer">pt_app ↗</a>
          </nav>

          <nav className="flex min-w-0 flex-1 items-stretch gap-5 overflow-x-auto" aria-label="Secciones SGC">
            {SGC_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/sgc' && pathname.startsWith(`${item.href}/`))
              return (
                <Link
                  key={item.href}
                  className={[
                    'relative inline-flex items-center self-stretch px-1 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[var(--foreground)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-[var(--pt-primary)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]',
                  ].join(' ')}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
          {children}
        </div>
      </div>
    </div>
  )
}
