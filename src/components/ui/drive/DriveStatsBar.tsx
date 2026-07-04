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
    <div className="flex flex-wrap items-stretch divide-x divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)] bg-white">
      {items.map((item) => (
        <div key={item.label} className="min-w-28 flex-1 px-4 py-2">
          <div className={`numeric text-xl font-semibold ${VALUE_TONES[item.tone ?? 'default']}`}>{item.value}</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
