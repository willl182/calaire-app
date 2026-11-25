/**
 * Normalización de entradas decimales escritas por el usuario.
 *
 * Acepta un único separador decimal, coma o punto ("12,5" y "12.5" -> 12.5).
 * Rechaza explícitamente los separadores de miles o mezclas ("1.234,5",
 * "1,234.5", "1.234.5") porque son ambiguos en la captura de resultados PT.
 * Nota: "1,234" se interpreta como 1.234 (un solo separador = decimal).
 */
export type DecimalParse =
  | { kind: 'empty' }
  | { kind: 'ok'; value: number }
  | { kind: 'invalid'; reason: string }

const DECIMAL_RE = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)([eE][+-]?\d+)?$/

export function parseDecimal(raw: string): DecimalParse {
  const trimmed = raw.trim()
  if (trimmed === '') return { kind: 'empty' }
  const separators = trimmed.match(/[.,]/g)?.length ?? 0
  if (separators > 1) {
    return { kind: 'invalid', reason: 'use un solo separador decimal (coma o punto), sin separador de miles' }
  }
  if (!DECIMAL_RE.test(trimmed)) {
    return { kind: 'invalid', reason: 'debe ser un número válido' }
  }
  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value)) return { kind: 'invalid', reason: 'debe ser un número válido' }
  return { kind: 'ok', value }
}

/** Número finito, o null si está vacío o es inválido. */
export function toDecimal(raw: string): number | null {
  const parsed = parseDecimal(raw)
  return parsed.kind === 'ok' ? parsed.value : null
}

/** Número guardado → texto con coma decimal para mostrar en la captura (10.1 → "10,1"). */
export function formatDecimal(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return ''
  return String(value).replace('.', ',')
}

export function isValidDecimal(raw: string): boolean {
  return parseDecimal(raw).kind === 'ok'
}

/**
 * Tolerancia para comparar promedio/desviación escritos con los calculados
 * desde Dato 1–3: diferencia relativa de hasta 0,5 % del valor calculado, con
 * un piso absoluto de 0,001 (valores cercanos a cero). Cubre el redondeo
 * habitual a 2–3 decimales sin ocultar errores de digitación.
 */
export const STATS_REL_TOLERANCE = 0.005
export const STATS_ABS_TOLERANCE = 0.001

export function differsBeyondTolerance(written: number, computed: number): boolean {
  const tol = Math.max(STATS_ABS_TOLERANCE, Math.abs(computed) * STATS_REL_TOLERANCE)
  return Math.abs(written - computed) > tol
}

/** Promedio y desviación estándar muestral (n-1) de los datos no vacíos. */
export function computeStats(values: Array<number | null>): { mean: number; sd: number | null } | null {
  const nums = values.filter((v): v is number => v != null)
  if (nums.length === 0) return null
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  if (nums.length < 2) return { mean, sd: null }
  const variance = nums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (nums.length - 1)
  return { mean, sd: Math.sqrt(variance) }
}

/**
 * Advertencias no bloqueantes cuando el promedio o la desviación escritos
 * difieren de lo calculado con los datos. Nunca reemplaza el valor escrito
 * (decisión del usuario 2026-11-24: no autocalcular).
 */
export function statsWarnings(input: {
  d1: string
  d2: string
  d3: string
  meanValue: string
  sdValue: string
}): string[] {
  const stats = computeStats([toDecimal(input.d1), toDecimal(input.d2), toDecimal(input.d3)])
  if (!stats) return []
  const warnings: string[] = []
  const mean = toDecimal(input.meanValue)
  if (mean != null && differsBeyondTolerance(mean, stats.mean)) {
    warnings.push(`El promedio difiere del calculado con los datos (${formatNum(stats.mean)}).`)
  }
  const sd = toDecimal(input.sdValue)
  if (sd != null && stats.sd != null && differsBeyondTolerance(sd, stats.sd)) {
    warnings.push(`La desv. est. difiere de la calculada con los datos (${formatNum(stats.sd)}).`)
  }
  return warnings
}

function formatNum(value: number): string {
  return Number(value.toPrecision(6)).toLocaleString('es-CO', { maximumFractionDigits: 6 })
}
