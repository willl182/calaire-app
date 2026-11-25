'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/**
 * Menú desplegable de acciones secundarias de una fila. Los hijos son enlaces o
 * formularios; usar la clase `menu-item` para que tengan el estilo y el área táctil.
 * Se cierra con Escape, al hacer clic fuera o al elegir una opción.
 */
export function ActionsMenu({ label = 'Acciones', children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) rootRef.current?.querySelector<HTMLElement>('[data-menu] a, [data-menu] button')?.focus()
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="btn-outline min-h-[44px] gap-1.5 px-3 text-xs"
      >
        {label}
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}>
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          id={menuId}
          data-menu
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a, button[type="submit"]')) setOpen(false)
          }}
          className="absolute right-0 z-30 mt-1 grid min-w-56 gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-panel)] p-1.5 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  )
}
