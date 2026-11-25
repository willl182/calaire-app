export type FileTone = 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

const FILE_TONES: Record<FileTone, string> = {
  sky: 'text-info-strong',
  violet: 'text-special-strong',
  emerald: 'text-success-strong',
  amber: 'text-warning-strong',
  rose: 'text-danger-strong',
  slate: 'text-muted',
}

export function FolderIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 text-info-strong ${className}`} fill="currentColor">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  )
}

export function FileIcon({ tone = 'slate', className = 'h-9 w-9' }: { tone?: FileTone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${FILE_TONES[tone]} ${className}`} fill="currentColor">
      <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5z" />
    </svg>
  )
}
