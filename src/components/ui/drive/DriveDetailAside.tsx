import Link from 'next/link'
import type { ReactNode } from 'react'

export function DriveDetailAside({
  chips,
  codigo,
  nombre,
  subtitle,
  closeHref,
  children,
}: {
  chips?: ReactNode
  codigo: string
  nombre: string
  subtitle?: ReactNode
  closeHref: string
  children: ReactNode
}) {
  return (
    <aside className="border-t border-[var(--border)] bg-slate-50 p-5 lg:border-l lg:border-t-0">
      <div className="sticky top-24">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {chips && <div className="flex flex-wrap items-center gap-2">{chips}</div>}
            <h4 className="mt-3 text-xl font-semibold text-[var(--foreground)]">{codigo}</h4>
            <p className="mt-1 text-sm text-[var(--foreground)]">{nombre}</p>
            {subtitle}
          </div>
          <Link
            href={closeHref}
            className="shrink-0 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--foreground-muted)] hover:bg-slate-100"
            aria-label="Cerrar detalle"
          >
            Cerrar
          </Link>
        </div>
        {children}
      </div>
    </aside>
  )
}
