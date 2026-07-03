export default function SgcLoading() {
  return (
    <div className="grid min-w-0 gap-6">
      <div className="header-bar h-32 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card h-24 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card h-28 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
