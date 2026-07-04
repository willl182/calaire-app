export default function DashboardLoading() {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="header-bar animate-pulse px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid min-w-0 flex-1 gap-2">
              <div className="h-3 w-36 rounded bg-[var(--surface-muted)]" />
              <div className="h-7 w-56 max-w-full rounded bg-[var(--surface-muted)]" />
              <div className="h-3 w-96 max-w-full rounded bg-[var(--surface-muted)]" />
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-32 rounded bg-[var(--surface-muted)]" />
              <div className="h-9 w-28 rounded bg-[var(--surface-muted)]" />
            </div>
          </div>
        </div>

        <div className="sgc-kpis sgc-kpis-five animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="sgc-kpi">
              <div className="h-2 w-24 max-w-full rounded bg-[var(--surface-muted)]" />
              <div className="mt-3 h-6 w-10 rounded bg-[var(--surface-muted)]" />
            </div>
          ))}
        </div>

        <div className="card min-h-56 overflow-hidden animate-pulse">
          <div className="border-b-2 border-[var(--pt-primary)] px-4 py-3">
            <div className="h-3 w-36 rounded bg-[var(--surface-muted)]" />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[48rem] divide-y divide-[var(--border-soft)]">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="grid grid-cols-[9rem_1fr_7rem_7rem] gap-4 px-4 py-4">
                  <div className="h-5 rounded bg-[var(--surface-muted)]" />
                  <div className="h-5 rounded bg-[var(--surface-muted)]" />
                  <div className="h-5 rounded bg-[var(--surface-muted)]" />
                  <div className="h-5 rounded bg-[var(--surface-muted)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
