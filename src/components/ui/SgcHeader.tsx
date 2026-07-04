import type { ReactNode } from 'react'

import { LogoUnal } from '@/components/LogoUnal'

export function SgcHeader({
  title,
  accent,
  description,
  email,
  actions,
  compact = false,
}: {
  title: ReactNode
  accent: ReactNode
  description: ReactNode
  email?: string | null
  actions?: ReactNode
  compact?: boolean
}) {
  return (
    <header className={`header-bar w-full min-w-0 max-w-full px-8 ${compact ? 'py-4' : 'py-6'}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-6">
          {!compact && <LogoUnal height={64} />}
          <div className="min-w-0 space-y-0.5">
            <h1 className={`font-bold leading-tight text-[var(--foreground)] ${compact ? 'text-lg' : 'text-xl'}`}>{title}</h1>
            <p className="text-base font-medium leading-snug text-[var(--pt-primary-dark)]">{accent}</p>
            <p className="text-sm leading-snug text-[var(--foreground-muted)]">{description}</p>
            {email && <p className="text-sm text-[var(--foreground-muted)]">{email} · Coordinador</p>}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
