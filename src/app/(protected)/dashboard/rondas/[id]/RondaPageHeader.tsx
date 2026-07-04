import type { ReactNode } from 'react'

import { EstadoBadge } from '@/components/ui/EstadoBadge'

type RondaHeaderData = {
  nombre: string
  codigo: string
  estado: string
}

export function RondaPageHeader({
  ronda,
  section,
  description,
  actions,
}: {
  ronda: RondaHeaderData
  section: string
  description: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="header-bar px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{ronda.nombre}</h1>
            <EstadoBadge estado={ronda.estado} />
          </div>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {section} · Código <span className="font-medium text-[var(--foreground)]">{ronda.codigo}</span>
          </p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}
