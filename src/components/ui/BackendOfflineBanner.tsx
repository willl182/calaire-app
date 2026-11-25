type Props = {
  detail?: string
}

export function BackendOfflineBanner({ detail }: Props) {
  return (
    <div className="rounded-xl border border-warning-border bg-warning-soft px-5 py-4 text-warning-strong">
      <h2 className="text-sm font-semibold">Backend de Convex no disponible</h2>
      <p className="mt-1 text-xs">
        No se pudo conectar con Convex en <code>127.0.0.1:3212</code> (ECONNREFUSED). Inicia
        <code className="mx-1">pnpm exec convex dev</code> y recarga la pagina. Los datos se
        mostraran vacios hasta que el backend responda.
      </p>
      {detail && <p className="mt-2 text-xs text-warning-strong/80">{detail}</p>}
    </div>
  )
}
