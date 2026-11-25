type Props = {
  detail?: string
}

export function BackendOfflineBanner({ detail }: Props) {
  return (
    <div role="status" className="rounded-xl border border-warning-border bg-warning-soft px-5 py-4 text-warning-strong">
      <h2 className="text-sm font-semibold">Servidor de datos no disponible</h2>
      <p className="mt-1 text-xs">
        No hay conexión con el servidor de datos. Los datos se mostrarán vacíos hasta que responda; recargue la
        página en unos minutos.
        {process.env.NODE_ENV === 'development' && (
          <> (Desarrollo: inicie <code className="mx-1">pnpm exec convex dev</code>.)</>
        )}
      </p>
      {detail && <p className="mt-2 text-xs">{detail}</p>}
    </div>
  )
}
