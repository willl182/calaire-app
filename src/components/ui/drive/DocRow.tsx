import Link from 'next/link'
import type { ReactNode } from 'react'
import { FileIcon, type FileTone } from './DriveIcons'
import { estadoDotTone } from './estadoTone'

const META_DOT_TONES: Record<FileTone, string> = {
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
}

export function DocMetaDot({ label, tone }: { label: string; tone: FileTone }) {
  return <span aria-label={label} title={label} className={`h-1.5 w-1.5 rounded-full ${META_DOT_TONES[tone]}`} />
}

export function DocRow({
  href,
  active,
  iconTone,
  estado,
  estadoLabel,
  codigo,
  nombre,
  meta,
  trailing,
}: {
  href: string
  active?: boolean
  iconTone: FileTone
  estado: string
  estadoLabel?: string
  codigo: string
  nombre: string
  meta?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`group grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-2 transition hover:shadow-sm ${active ? 'border-[var(--pt-primary)] bg-[var(--pt-primary-subtle)] ring-2 ring-[var(--focus-ring)]' : 'border-[var(--border)] bg-[var(--surface-panel)] hover:border-[var(--pt-primary)]'}`}
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-muted)]">
        <FileIcon tone={iconTone} className="h-6 w-6 transition group-hover:scale-105" />
        <span
          aria-label={`Estado: ${estadoLabel ?? estado}`}
          title={estadoLabel ?? estado}
          className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ring-4 ${estadoDotTone(estado)}`}
        />
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-sm font-semibold text-[var(--foreground)]">{codigo}</span>
          <span className="truncate text-sm text-[var(--foreground-muted)]">{nombre}</span>
        </div>
        {meta && <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--foreground-muted)]">{meta}</div>}
      </div>
      {trailing}
    </Link>
  )
}
