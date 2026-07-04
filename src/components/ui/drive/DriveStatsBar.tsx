export type DriveStat = {
  label: string
  value: string | number
  tone?: 'default' | 'emerald' | 'amber' | 'rose' | 'sky'
}

const VALUE_TONES: Record<NonNullable<DriveStat['tone']>, string> = {
  default: 'text-[var(--foreground)]',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
  sky: 'text-sky-700',
}

// Franja horizontal compacta de stats, compartida por el centro documental y
// el drive de ronda.
export function DriveStatsBar({ items }: { items: DriveStat[] }) {
  return (
    <div className="card flex flex-wrap items-stretch divide-x divide-[var(--border)] overflow-hidden p-0">
      {items.map((item) => (
        <div key={item.label} className="min-w-36 flex-1 px-5 py-4">
          <div className={`numeric text-2xl font-semibold ${VALUE_TONES[item.tone ?? 'default']}`}>{item.value}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
