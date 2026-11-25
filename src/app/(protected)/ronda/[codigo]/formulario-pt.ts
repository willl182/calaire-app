// Lógica pura de la captura PT compartida por FormularioRonda y FormularioReferencia:
// celdas (corrida × grupo), validación decimal, completitud y estado inicial.
import { isValidDecimal, toDecimal } from '@/lib/decimal'
import type { EnvioPT, RondaPTItem, RondaPTSampleGroup } from '@/server/rondas'

export type AdminPTTarget = {
  rondaParticipanteId: string
  backHref: string
}

export type CellKey = `${string}::${string}` // `${ptItemId}::${sampleGroupId}`
export type CellData = {
  d1: string
  d2: string
  d3: string
  meanValue: string
  sdValue: string
  ux: string
  k: string
  uxExp: string
}
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
export type ImportStatus = 'idle' | 'previewing' | 'ready' | 'saving' | 'saved' | 'error'
export type KMode = 'individual' | 'grupal'

export function toCellKey(ptItemId: string, sampleGroupId: string): CellKey {
  return `${ptItemId}::${sampleGroupId}`
}

export function fromCellKey(key: CellKey) {
  const [ptItemId, sampleGroupId] = key.split('::')
  return { ptItemId, sampleGroupId }
}

export function isValidNumberInput(value: string): boolean {
  return isValidDecimal(value)
}

/** Valor normalizado (coma o punto); NaN si vacío o inválido. */
export function num(value: string): number {
  return toDecimal(value) ?? NaN
}

export function getCellIssue(data: CellData): string | null {
  const fields = [['Dato 1', data.d1], ['Dato 2', data.d2], ['Dato 3', data.d3]] as const

  for (const [label, field] of fields) {
    if (field.trim() !== '' && !isValidNumberInput(field)) {
      return `${label} debe ser un número válido.`
    }
  }
  if (data.meanValue.trim() !== '' && !isValidNumberInput(data.meanValue)) {
    return 'El promedio debe ser un número válido.'
  }
  if (data.sdValue.trim() !== '' && (!isValidNumberInput(data.sdValue) || num(data.sdValue) < 0)) {
    return 'La desviación estándar debe ser ≥ 0.'
  }
  if (data.ux.trim() !== '' && (!isValidNumberInput(data.ux) || num(data.ux) < 0)) {
    return 'La incertidumbre estándar u(x) debe ser ≥ 0.'
  }
  if (data.k.trim() !== '' && (!isValidNumberInput(data.k) || num(data.k) < 0)) {
    return 'El factor de cobertura k debe ser ≥ 0.'
  }
  if (data.uxExp.trim() !== '' && (!isValidNumberInput(data.uxExp) || num(data.uxExp) < 0)) {
    return 'La incertidumbre expandida U(X) debe ser ≥ 0.'
  }
  return null
}

export const FIELD_ORDER = ['d1', 'd2', 'd3', 'meanValue', 'sdValue', 'ux', 'k', 'uxExp'] as const
export const REQUIRED_FIELDS = new Set<string>(['d1', 'meanValue', 'sdValue', 'ux', 'k', 'uxExp'])

/** Primer campo vacío obligatorio o inválido, para llevar el foco desde "Faltan N celdas". */
export function firstPendingField(data: CellData): (typeof FIELD_ORDER)[number] {
  for (const field of FIELD_ORDER) {
    const value = data[field]
    if (value.trim() === '') {
      if (REQUIRED_FIELDS.has(field)) return field
      continue
    }
    if (!isValidNumberInput(value)) return field
  }
  return 'd1'
}

export function isCellComplete(data: CellData): boolean {
  // Solo d1 es obligatorio. d2 y d3 pueden quedar vacios (NA) y se guardan como
  // null; no participan en ningun calculo.
  return (
    isValidNumberInput(data.d1) &&
    isValidNumberInput(data.meanValue) &&
    isValidNumberInput(data.sdValue) &&
    num(data.sdValue) >= 0 &&
    isValidNumberInput(data.ux) &&
    num(data.ux) >= 0 &&
    isValidNumberInput(data.k) &&
    num(data.k) >= 0 &&
    isValidNumberInput(data.uxExp) &&
    num(data.uxExp) >= 0
  )
}

export function initCells(
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  envios: EnvioPT[]
): Record<CellKey, CellData> {
  const enviosMap = new Map(
    envios.map((envio) => [toCellKey(envio.pt_item_id, envio.sample_group_id), envio])
  )
  const cells = {} as Record<CellKey, CellData>

  for (const item of ptItems) {
    for (const group of sampleGroups) {
      const key = toCellKey(item.id, group.id)
      const envio = enviosMap.get(key)
      cells[key] = {
        d1: envio?.d1 != null ? String(envio.d1) : '',
        d2: envio?.d2 != null ? String(envio.d2) : '',
        d3: envio?.d3 != null ? String(envio.d3) : '',
        meanValue: envio != null ? String(envio.mean_value) : '',
        sdValue: envio != null ? String(envio.sd_value) : '',
        ux: envio?.ux != null ? String(envio.ux) : '',
        k: envio?.k != null ? String(envio.k) : '2',
        uxExp: envio?.ux_exp != null ? String(envio.ux_exp) : '',
      }
    }
  }

  return cells
}

export function initStatus(
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  envios: EnvioPT[]
): Record<CellKey, SaveStatus> {
  const existing = new Set(envios.map((envio) => toCellKey(envio.pt_item_id, envio.sample_group_id)))
  const status = {} as Record<CellKey, SaveStatus>

  for (const item of ptItems) {
    for (const group of sampleGroups) {
      const key = toCellKey(item.id, group.id)
      status[key] = existing.has(key) ? 'saved' : 'idle'
    }
  }

  return status
}
