import Link from 'next/link'
import { FolderIcon } from './DriveIcons'

export function FolderCard({
  href,
  nombre,
  sublabel,
  badge,
}: {
  href: string
  nombre: string
  sublabel: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="group card overflow-hidden p-0 transition hover:border-[var(--pt-primary)] hover:no-underline"
    >
      <div className="relative flex h-36 items-center justify-center bg-[var(--surface-muted)]">
        <FolderIcon className="h-16 w-16 transition group-hover:scale-105" />
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-[var(--surface-panel)] px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground-muted)] shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <div className="border-t border-[var(--border)] px-4 py-3">
        <div className="truncate font-semibold text-[var(--foreground)]">{nombre}</div>
        <div className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">{sublabel}</div>
      </div>
    </Link>
  )
}
