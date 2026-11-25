'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type ConfirmOptions = {
  title?: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` para acciones irreversibles. */
  tone?: 'danger' | 'primary'
}

type ConfirmDialogProps = ConfirmOptions & {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Diálogo modal de confirmación (reemplaza `window.confirm`). Usa `<dialog>`
 * nativo: atrapa el foco, se cierra con Escape y devuelve el foco al disparador.
 * El foco inicial va a "Cancelar" para que Enter no confirme por accidente.
 */
export function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        // Clic en el fondo (fuera del contenido) cancela.
        if (event.target === ref.current) onCancel()
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-[var(--border)] bg-[var(--surface-panel)] p-0 text-[var(--foreground)] shadow-xl backdrop:bg-black/40"
    >
      <div className="grid gap-3 p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <div id={messageId} className="text-sm text-[var(--foreground-muted)]">
          {message}
        </div>
        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} type="button" className="btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={tone === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

/**
 * Versión imperativa: `const { confirm, dialog } = useConfirm()`; renderice
 * `{dialog}` y use `if (await confirm({ message })) …`.
 */
export function useConfirm() {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })),
    []
  )

  const close = (ok: boolean) => {
    state?.resolve(ok)
    setState(null)
  }

  const dialog = (
    <ConfirmDialog
      open={state !== null}
      title={state?.title}
      message={state?.message ?? ''}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      tone={state?.tone}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  )

  return { confirm, dialog }
}
