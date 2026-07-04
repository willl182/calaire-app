import Link from 'next/link'
import type { ReactNode } from 'react'

export function DriveBreadcrumb({
  rootLabel,
  rootHref,
  folderLabel,
  actions,
}: {
  rootLabel: string
  rootHref: string
  folderLabel?: string | null
  actions?: ReactNode
}) {
  return (
    <nav aria-label="Ruta" className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-slate-50 px-6 py-3 text-sm">
      <Link href={rootHref} className={`font-semibold ${folderLabel ? 'text-sky-700 hover:underline' : 'text-[var(--foreground)]'}`}>
        {rootLabel}
      </Link>
      {folderLabel && (
        <>
          <span className="text-[var(--foreground-muted)]">/</span>
          <span className="font-semibold text-[var(--foreground)]">{folderLabel}</span>
        </>
      )}
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </nav>
  )
}
