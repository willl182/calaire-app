'use client'

import { useEffect, type ReactNode } from 'react'

import { isConvexOffline } from '@/lib/convex-fallback'

type Props = {
  error: Error & { digest?: string }
  retry: () => void
  section: string
  title?: ReactNode
  children?: ReactNode
}

export function ConvexErrorView({ error, retry, section, title, children }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const offline = isConvexOffline(error)
  const heading = title ?? (offline ? 'Backend de Convex no disponible' : 'No se pudo cargar la vista')
  const description = offline
    ? `No se pudo conectar con Convex en 127.0.0.1:3212 (ECONNREFUSED). Inicia pnpm exec convex dev y recarga la pagina.`
    : 'La ruta esta disponible, pero una consulta de datos fallo durante la carga. Intente de nuevo; si persiste, revise los logs de Convex con el request ID del error.'

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">{section}</h1>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <h2 className="text-lg font-semibold">{heading}</h2>
        <p className="mt-2 text-sm">{description}</p>
        {children}
        {error.digest && (
          <p className="mt-3 text-xs font-medium text-amber-900">Digest: {error.digest}</p>
        )}
        <button type="button" onClick={() => retry()} className="btn-primary mt-4 text-sm">
          Reintentar
        </button>
      </div>
    </div>
  )
}
