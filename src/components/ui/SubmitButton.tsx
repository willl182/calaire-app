'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

import { Spinner } from './Spinner'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  /** Texto mientras se envía el formulario (por defecto, el mismo texto). */
  pendingLabel?: ReactNode
}

/**
 * Botón de envío que se deshabilita y muestra un indicador mientras la acción
 * del formulario está en curso (evita el doble clic).
 */
export function SubmitButton({ children, pendingLabel, disabled, className = 'btn-primary', ...props }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={className}
    >
      {pending && <Spinner />}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  )
}
