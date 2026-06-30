import type { Contaminante, RondaPTItem, RondaPTSampleGroup } from './client'

const CONTAMINANTES = ['CO', 'SO2', 'O3', 'NO', 'NO2'] as const

function isInitialConcentrationLevel(item: RondaPTItem, ptItems: RondaPTItem[]): boolean {
  const sameContaminante = ptItems.filter((candidate) => candidate.contaminante === item.contaminante)
  if (sameContaminante.length === 0) return false
  const lowestSortOrder = Math.min(...sameContaminante.map((candidate) => candidate.sort_order))
  const normalizedLevel = item.level_label.trim().toLowerCase().replace(/,/g, '.')
  const numericMatch = normalizedLevel.match(/^[+-]?(\d+\.?\d*|\.\d+)/)
  const numericLevel = numericMatch ? parseFloat(numericMatch[0]) : NaN

  return item.sort_order === lowestSortOrder || normalizedLevel === 'cero' || numericLevel === 0
}

function getRequiredPTReplicateCount(item: RondaPTItem, ptItems: RondaPTItem[]): 1 | 3 {
  return isInitialConcentrationLevel(item, ptItems) ? 1 : 3
}

export type ParsedReferenciaRow = {
  rowNumber: number
  source: string
  pollutant: Contaminante
  level: string
  unit: string
  instrument: string
  meanH1: number
  meanH2: number | null
  meanH3: number | null
  meanValue: number
  sdValue: number | null
  ux: number
  k: number | null
  uxExp: number | null
  nHours: number
  hourStarts: string
}

export type ReferenciaImportCell = {
  ptItemId: string
  sampleGroupId: string
  d1: number
  d2: number | null
  d3: number | null
  meanValue: number
  sdValue: number
  ux: number
  k: number
  uxExp: number
}

export type ReferenciaImportPreview = {
  rowsRead: number
  cells: ReferenciaImportCell[]
  warnings: string[]
  errors: string[]
}

const REQUIRED_COLUMNS = [
  'source',
  'pollutant',
  'level',
  'unit',
  'instrument',
  'mean_value',
  'sd_value',
  'u_value',
  'u_exp',
  'n_hours',
  'hour_starts',
] as const

function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (inQuotes) throw new Error('El CSV tiene comillas sin cerrar.')
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((record) => record.some((value) => value.trim() !== ''))
}

export function normalizePollutant(value: string): Contaminante | null {
  const normalized = value.trim().toUpperCase()
  return CONTAMINANTES.includes(normalized as Contaminante) ? (normalized as Contaminante) : null
}

export function normalizeLevel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/ppm|ppb/g, '')
}

function parseRequiredNumber(value: string, label: string, rowNumber: number): number {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.toUpperCase() === 'NA') {
    throw new Error(`Fila ${rowNumber}: ${label} es requerido.`)
  }
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Fila ${rowNumber}: ${label} debe ser numerico.`)
  }
  return parsed
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.toUpperCase() === 'NA') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function parseOptionalNonNegativeNumber(value: string, label: string, rowNumber: number): number | null {
  const parsed = parseOptionalNumber(value)
  if (parsed == null) return null
  if (parsed < 0) {
    throw new Error(`Fila ${rowNumber}: ${label} debe ser mayor o igual a cero.`)
  }
  return parsed
}

export function parseReferenciaCsv(text: string): ParsedReferenciaRow[] {
  const records = parseCsvRecords(text)
  if (records.length === 0) return []

  const header = records[0].map((column) => column.trim())
  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column))
  if (missing.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missing.join(', ')}.`)
  }

  const indexByColumn = new Map(header.map((column, index) => [column, index]))
  const getValue = (record: string[], column: string) =>
    record[indexByColumn.get(column) ?? -1]?.trim() ?? ''

  return records.slice(1).map((record, index) => {
    const rowNumber = index + 2
    const pollutant = normalizePollutant(getValue(record, 'pollutant'))
    if (!pollutant) {
      throw new Error(`Fila ${rowNumber}: contaminante no reconocido (${getValue(record, 'pollutant')}).`)
    }

    const sdRaw = getValue(record, 'sd_value')
    const sdValue = sdRaw === '' || sdRaw.toUpperCase() === 'NA' ? null : parseRequiredNumber(sdRaw, 'sd_value', rowNumber)
    const meanValue = parseRequiredNumber(getValue(record, 'mean_value'), 'mean_value', rowNumber)

    return {
      rowNumber,
      source: getValue(record, 'source'),
      pollutant,
      level: getValue(record, 'level'),
      unit: getValue(record, 'unit'),
      instrument: getValue(record, 'instrument'),
      meanH1: indexByColumn.has('mean_h1') ? (parseOptionalNumber(getValue(record, 'mean_h1')) ?? meanValue) : meanValue,
      meanH2: indexByColumn.has('mean_h2') ? parseOptionalNumber(getValue(record, 'mean_h2')) : meanValue,
      meanH3: indexByColumn.has('mean_h3') ? parseOptionalNumber(getValue(record, 'mean_h3')) : meanValue,
      meanValue,
      sdValue,
      ux: parseRequiredNumber(getValue(record, 'u_value'), 'u_value', rowNumber),
      k: indexByColumn.has('k') ? parseOptionalNonNegativeNumber(getValue(record, 'k'), 'k', rowNumber) : null,
      uxExp: indexByColumn.has('u_exp') ? parseOptionalNonNegativeNumber(getValue(record, 'u_exp'), 'u_exp', rowNumber) : null,
      nHours: parseRequiredNumber(getValue(record, 'n_hours'), 'n_hours', rowNumber),
      hourStarts: getValue(record, 'hour_starts'),
    }
  })
}

export function buildReferenciaImportPreview(
  rows: ParsedReferenciaRow[],
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  existingCells: Set<string> = new Set(),
  defaultK = 2
): ReferenciaImportPreview {
  const warnings: string[] = []
  const errors: string[] = []
  const cells: ReferenciaImportCell[] = []

  if (!Number.isFinite(defaultK) || defaultK < 0) {
    errors.push('El valor grupal de k debe ser un numero mayor o igual a cero.')
  }

  if (sampleGroups.length === 0) {
    errors.push('La ronda no tiene grupos de muestra configurados.')
  } else if (sampleGroups.length > 1) {
    warnings.push('El CSV no incluye columna sample_group; se aplicara a todos los grupos configurados.')
  }

  for (const row of rows) {
    const item = ptItems.find(
      (candidate) =>
        candidate.contaminante === row.pollutant &&
        normalizeLevel(candidate.level_label) === normalizeLevel(row.level)
    )

    if (!item) {
      const hasPollutant = ptItems.some((candidate) => candidate.contaminante === row.pollutant)
      errors.push(
        hasPollutant
          ? `Fila ${row.rowNumber}: no hay nivel PT para ${row.pollutant} ${row.level}.`
          : `Fila ${row.rowNumber}: el contaminante ${row.pollutant} no esta configurado en la ronda.`
      )
      continue
    }

    const requiredReplicates = getRequiredPTReplicateCount(item, ptItems)
    if (row.sdValue == null && requiredReplicates !== 1) {
      errors.push(`Fila ${row.rowNumber}: sd_value es requerido para niveles con tres replicas.`)
      continue
    }

    if (requiredReplicates === 3 && (row.meanH2 == null || row.meanH3 == null)) {
      errors.push(`Fila ${row.rowNumber}: mean_h2 y mean_h3 son requeridos para niveles con tres replicas.`)
      continue
    }

    if (row.uxExp == null) {
      errors.push(`Fila ${row.rowNumber}: u_exp es requerido.`)
      continue
    }

    const sdValue = row.sdValue ?? 0
    const k = row.k ?? defaultK
    const d1 = row.meanH1
    const d2 = requiredReplicates === 1 ? null : row.meanH2
    const d3 = requiredReplicates === 1 ? null : row.meanH3

    for (const group of sampleGroups) {
      const cellKey = `${item.id}::${group.id}`
      if (existingCells.has(cellKey)) {
        warnings.push(`Se sobrescribira una celda existente: ${row.pollutant} ${item.level_label} / ${group.sample_group}.`)
      }
      cells.push({
        ptItemId: item.id,
        sampleGroupId: group.id,
        d1,
        d2,
        d3,
        meanValue: row.meanValue,
        sdValue,
        ux: row.ux,
        k,
        uxExp: row.uxExp,
      })
    }
  }

  return { rowsRead: rows.length, cells, warnings, errors }
}
