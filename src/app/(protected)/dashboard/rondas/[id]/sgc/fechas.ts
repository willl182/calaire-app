/** Fechas de la UI SGC: se muestran como dd/mm/aaaa y se guardan como aaaa-mm-dd. */

export function isoADdMmAaaa(value?: string | null) {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

/** Acepta dd/mm/aaaa (o d/m/aaaa, con / - .) y devuelve aaaa-mm-dd. Vacío → ''. Inválida → null. */
export function ddMmAaaaAIso(value: string) {
  const texto = value.trim()
  if (!texto) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(texto)
  if (!match) return null
  const [dia, mes, anio] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}
