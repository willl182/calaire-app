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
    <div className="sgc-kpis">
      {items.map((item) => (
        <div key={item.label} className="sgc-kpi">
          <div className="sgc-kpi-label">{item.label}</div>
          <div className={`sgc-kpi-value numeric ${VALUE_TONES[item.tone ?? 'default']}`}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}
