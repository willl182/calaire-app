'use client'

import { useEffect } from 'react'

export default function SgcResumenError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">Resumen SGC</h1>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <h2 className="text-lg font-semibold">No se pudo cargar la vista SGC</h2>
        <p className="mt-2 text-sm">
          La ruta esta disponible, pero una consulta de datos fallo durante la carga. Intente de nuevo; si persiste,
          revise los logs de Convex con el request ID del error.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs font-medium text-amber-900">Digest: {error.digest}</p>
        )}
        <button type="button" onClick={() => unstable_retry()} className="btn-primary mt-4 text-sm">
          Reintentar
        </button>
      </div>
    </div>
  )
}
