import type { ReactNode } from 'react'
import Link from 'next/link'

import { LogoUnal } from '@/app/components/LogoUnal'

const PT_APP_URL = 'https://w421.shinyapps.io/pt_app/'

export function SgcHeader({
  title,
  accent,
  description,
  email,
  actions,
}: {
  title: ReactNode
  accent: ReactNode
  description: ReactNode
  email?: string | null
  actions?: ReactNode
}) {
  return (
    <header className="header-bar w-full min-w-0 max-w-full px-8 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <LogoUnal height={64} />
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
            <p className="text-base font-medium text-[var(--pt-primary-dark)]">{accent}</p>
            <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
            {email && <p className="text-sm text-[var(--foreground-muted)]">{email} · Coordinador</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link className="btn-outline" href="/dashboard">
            Gestión de ronda
          </Link>
          <a className="btn-outline" href={PT_APP_URL} target="_blank" rel="noopener noreferrer">
            pt_app ↗
          </a>
          {actions}
        </div>
      </div>
    </header>
  )
}
