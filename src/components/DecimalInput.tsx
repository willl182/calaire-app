'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
}

/**
 * Input numérico de texto: acepta coma o punto decimal (ver `parseDecimal`
 * en `@/lib/decimal`), abre el teclado decimal en móvil y no cambia el valor
 * con la rueda del mouse ni con las flechas (a diferencia de type="number").
 * El valor se mantiene como texto; la normalización ocurre al validar/guardar.
 */
export const DecimalInput = forwardRef<HTMLInputElement, Props>(function DecimalInput(
  { value, onValueChange, ...rest },
  ref
) {
  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    />
  )
})
