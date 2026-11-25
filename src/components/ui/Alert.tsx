import { Toast } from './Toast'

/**
 * Mensajes de resultado de una acción (`?success=` / `?error=`).
 * Éxito: aviso emergente que se cierra solo. Error: recuadro fijo en la página.
 */
export function Alert({ tone, message }: { tone: 'error' | 'success'; message?: string }) {
  if (!message) return null

  if (tone === 'success') return <Toast message={message} tone="success" param="success" />

  return (
    <div role="alert" className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-strong">
      {message}
    </div>
  )
}
