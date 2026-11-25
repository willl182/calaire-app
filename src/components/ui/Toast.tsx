'use client'

import { useEffect, useState } from 'react'

const DURACION_MS = 6000

/**
 * Aviso emergente (abajo a la derecha) que se cierra solo. Al montarse quita
 * `param` de la URL para que el aviso no reaparezca al recargar.
 */
export function Toast({
  message,
  tone = 'success',
  param,
}: {
  message: string
  tone?: 'success' | 'error' | 'info'
  param?: string
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (param) {
      const url = new URL(window.location.href)
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param)
        window.history.replaceState(window.history.state, '', url)
      }
    }
    const timer = window.setTimeout(() => setVisible(false), DURACION_MS)
    return () => window.clearTimeout(timer)
  }, [param])

  if (!visible) return null

  const toneClass = {
    success: 'border-success-border bg-success-soft text-success-strong',
    error: 'border-danger-border bg-danger-soft text-danger-strong',
    info: 'border-info-border bg-info-soft text-info-strong',
  }[tone]

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-6">
      <div
        role={tone === 'error' ? 'alert' : 'status'}
        className={`toast-enter pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${toneClass}`}
      >
        <span className="pt-0.5">{message}</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar aviso"
          className="-my-2 -mr-2 inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg opacity-70 hover:opacity-100"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
