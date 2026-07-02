export default function RondaLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <div className="header-bar h-32 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card h-28 animate-pulse" />
          ))}
        </div>
        <div className="card h-40 animate-pulse" />
      </div>
    </div>
  )
}
