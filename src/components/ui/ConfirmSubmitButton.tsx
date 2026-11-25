'use client'

import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

import { ConfirmDialog, type ConfirmOptions } from './ConfirmDialog'
import { Spinner } from './Spinner'

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<ConfirmOptions, 'message'> & {
    message: ReactNode
    children: ReactNode
    pendingLabel?: ReactNode
  }

/**
 * Botón de envío que pide confirmación en un diálogo antes de enviar el
 * formulario, y queda deshabilitado mientras la acción está en curso.
 */
export function ConfirmSubmitButton({
  message,
  title,
  confirmLabel,
  cancelLabel,
  tone,
  pendingLabel,
  onClick,
  children,
  disabled,
  ...props
}: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { pending } = useFormStatus()

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        type="submit"
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          // requestSubmit (al confirmar) no dispara click, así que aquí siempre se pregunta.
          event.preventDefault()
          setOpen(true)
        }}
      >
        {pending && <Spinner />}
        {pending ? (pendingLabel ?? children) : children}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        tone={tone}
        onCancel={() => {
          setOpen(false)
          buttonRef.current?.focus()
        }}
        onConfirm={() => {
          setOpen(false)
          const button = buttonRef.current
          button?.form?.requestSubmit(button)
        }}
      />
    </>
  )
}
