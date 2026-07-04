export default function SgcLoading() {
  return (
    <div className="app-workspace min-w-0">
      <div className="header-bar min-h-32 animate-pulse px-8 py-6">
        <div className="flex h-full items-center gap-6">
          <div className="h-16 w-28 rounded bg-[var(--surface-muted)]" />
          <div className="grid min-w-0 flex-1 gap-2">
            <div className="h-5 w-72 max-w-full rounded bg-[var(--surface-muted)]" />
            <div className="h-4 w-[28rem] max-w-full rounded bg-[var(--surface-muted)]" />
            <div className="h-3 w-96 max-w-full rounded bg-[var(--surface-muted)]" />
          </div>
        </div>
      </div>

      <div className="sgc-kpis animate-pulse">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="sgc-kpi">
            <div className="h-2 w-24 max-w-full rounded bg-[var(--surface-muted)]" />
            <div className="mt-3 h-6 w-10 rounded bg-[var(--surface-muted)]" />
          </div>
        ))}
      </div>

      <div className="sgc-quicknav animate-pulse">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <div className="h-4 w-40 max-w-full rounded bg-[var(--surface-muted)]" />
            <div className="mt-3 h-3 w-full rounded bg-[var(--surface-muted)]" />
            <div className="mt-2 h-3 w-4/5 rounded bg-[var(--surface-muted)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
