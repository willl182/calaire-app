import type { Contaminante, RondaPTItem, RondaPTSampleGroup } from './rondas'

const CONTAMINANTES = ['CO', 'SO2', 'O3', 'NO', 'NO2'] as const

function isInitialConcentrationLevel(item: RondaPTItem, ptItems: RondaPTItem[]): boolean {
  const sameContaminante = ptItems.filter((candidate) => candidate.contaminante === item.contaminante)
  const lowestSortOrder = Math.min(...sameContaminante.map((candidate) => candidate.sort_order))
  const normalizedLevel = item.level_label.trim().toLowerCase().replace(',', '.')
  const numericLevel = Number(normalizedLevel)

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
  meanValue: number
  sdValue: number | null
  ux: number
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
    .replace(',', '.')
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

export function parseReferenciaCsv(text: string): ParsedReferenciaRow[] {
  const records = parseCsvRecords(text)
  if (records.length === 0) return []

  const header = records[0].map((column) => column.trim())
  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column))
  if (missing.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missing.join(', ')}.`)
  }

  const indexByColumn = new Map(header.map((column, index) => [column, index]))
  const getValue = (record: string[], column: (typeof REQUIRED_COLUMNS)[number]) =>
    record[indexByColumn.get(column) ?? -1]?.trim() ?? ''

  return records.slice(1).map((record, index) => {
    const rowNumber = index + 2
    const pollutant = normalizePollutant(getValue(record, 'pollutant'))
    if (!pollutant) {
      throw new Error(`Fila ${rowNumber}: contaminante no reconocido (${getValue(record, 'pollutant')}).`)
    }

    const sdRaw = getValue(record, 'sd_value')
    const sdValue = sdRaw === '' || sdRaw.toUpperCase() === 'NA' ? null : parseRequiredNumber(sdRaw, 'sd_value', rowNumber)

    return {
      rowNumber,
      source: getValue(record, 'source'),
      pollutant,
      level: getValue(record, 'level'),
      unit: getValue(record, 'unit'),
      instrument: getValue(record, 'instrument'),
      meanValue: parseRequiredNumber(getValue(record, 'mean_value'), 'mean_value', rowNumber),
      sdValue,
      ux: parseRequiredNumber(getValue(record, 'u_value'), 'u_value', rowNumber),
      nHours: parseRequiredNumber(getValue(record, 'n_hours'), 'n_hours', rowNumber),
      hourStarts: getValue(record, 'hour_starts'),
    }
  })
}

export function buildReferenciaImportPreview(
  rows: ParsedReferenciaRow[],
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  existingCells: Set<string> = new Set()
): ReferenciaImportPreview {
  const warnings: string[] = []
  const errors: string[] = []
  const cells: ReferenciaImportCell[] = []

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

    const sdValue = row.sdValue ?? 0
    const d2 = requiredReplicates === 1 ? null : row.meanValue
    const d3 = requiredReplicates === 1 ? null : row.meanValue

    for (const group of sampleGroups) {
      const cellKey = `${item.id}::${group.id}`
      if (existingCells.has(cellKey)) {
        warnings.push(`Se sobrescribira una celda existente: ${row.pollutant} ${item.level_label} / ${group.sample_group}.`)
      }
      cells.push({
        ptItemId: item.id,
        sampleGroupId: group.id,
        d1: row.meanValue,
        d2,
        d3,
        meanValue: row.meanValue,
        sdValue,
        ux: row.ux,
        uxExp: row.ux * 2,
      })
    }
  }

  return { rowsRead: rows.length, cells, warnings, errors }
}
