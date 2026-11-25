'use client'

import { useId, useState, type InputHTMLAttributes, type Ref } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Texto del botón (por defecto "Elegir archivo"). */
  buttonLabel?: string
  ref?: Ref<HTMLInputElement>
  /**
   * Nombre a mostrar cuando el padre controla el archivo elegido (p. ej. lo limpia
   * por código tras importar). Si se omite, se usa el último archivo elegido.
   */
  fileName?: string | null
}

/**
 * Selector de archivos en español. El input nativo queda accesible (foco,
 * `required`, validación) pero oculto visualmente; el nombre del archivo
 * elegido se muestra al lado del botón.
 */
export function FileInput({ buttonLabel = 'Elegir archivo', multiple, onChange, className, id, disabled, fileName, ...props }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [nombres, setNombres] = useState<string[]>([])

  const elegidos = fileName !== undefined ? (fileName ? [fileName] : []) : nombres
  const texto =
    elegidos.length === 0
      ? 'Ningún archivo seleccionado'
      : elegidos.length === 1
        ? elegidos[0]
        : `${elegidos.length} archivos seleccionados`

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-3 ${className ?? ''}`}>
      <input
        {...props}
        id={inputId}
        type="file"
        multiple={multiple}
        disabled={disabled}
        className="peer sr-only"
        onChange={(event) => {
          setNombres(Array.from(event.currentTarget.files ?? []).map((file) => file.name))
          onChange?.(event)
        }}
      />
      <label
        htmlFor={inputId}
        aria-hidden="true"
        className={`btn-outline min-h-[44px] shrink-0 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-outline)] ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
      >
        {buttonLabel}
      </label>
      <span className="min-w-0 truncate text-sm text-[var(--foreground-muted)]" aria-live="polite">
        {texto}
      </span>
    </div>
  )
}
