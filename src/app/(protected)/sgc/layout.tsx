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
      <header className="sticky top-0 z-40 bg-[var(--surface-panel)]">
        <div className="topbar-v2 app-shell">
          <Link href="/inicio" className="topbar-v2-brand hover:no-underline">
            <div className="topbar-v2-logo">
              <LogoUnal height={32} />
            </div>
            <span className="topbar-v2-word">
              CALAIRE-<br />APP
            </span>
            <span className="topbar-v2-ea">EA</span>
          </Link>

          <nav className="topbar-v2-modules" aria-label="Áreas principales">
            <Link className="topbar-v2-module" href="/dashboard">Gestión de rondas</Link>
            <Link className="topbar-v2-module topbar-v2-module-active" href="/sgc">SGC</Link>
            <a className="topbar-v2-module" href={PT_APP_URL} target="_blank" rel="noopener noreferrer">pt_app ↗</a>
          </nav>

          <nav className="topbar-v2-mainnav" aria-label="Secciones SGC">
            {SGC_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/sgc' && pathname.startsWith(`${item.href}/`))
              return (
                <Link
                  key={item.href}
                  className={`topbar-v2-link ${isActive ? 'topbar-v2-link-active' : ''}`}
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

      <div className="px-4 py-4 sm:px-6">
        <div className="app-shell app-workspace min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
