export const PT_SCORE_COLUMNS = [
  'participant_code', 'contaminante', 'run_code', 'level_label', 'unidad', 'metodo',
  'valor_asignado', 'u_xpt', 'sigma_pt', 'valor_participante', 'u_lab', 'U_lab',
  'z', 'z_prima', 'zeta', 'en', 'clasificacion',
] as const

export type PtScoreCsvRow = Record<(typeof PT_SCORE_COLUMNS)[number], string>
export type PtScoreClassification = 'satisfactorio' | 'no_satisfactorio'

export type ParsedPtScoreRow = {
  participantCode: string
  contaminante: string
  runCode: string
  levelLabel: string
  unidad: string
  metodo: string
  valorAsignado: number
  incertidumbreAsignada: number | null
  sigmaPt: number | null
  valorParticipante: number
  uParticipante: number | null
  UParticipante: number | null
  z: number | null
  zPrima: number | null
  zeta: number | null
  en: number | null
  clasificacion: PtScoreClassification
}

export type PtScoreCsvError = { fila: number; campo: string; mensaje: string }

function parseCsvRecords(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '')
  const records: string[][] = []
  let record: string[] = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"'
        i += 1
      } else if (char === '"') quoted = false
      else value += char
    } else if (char === '"' && value.length === 0) quoted = true
    else if (char === ',') {
      record.push(value)
      value = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      record.push(value)
      if (record.some((cell) => cell.length > 0)) records.push(record)
      record = []
      value = ''
    } else value += char
  }
  if (quoted) throw new Error('CSV inválido: comillas sin cerrar.')
  if (value.length > 0 || record.length > 0) {
    record.push(value)
    if (record.some((cell) => cell.length > 0)) records.push(record)
  }
  return records
}

function numberValue(value: string, required: boolean, fila: number, campo: string, errors: PtScoreCsvError[]) {
  const clean = value.trim()
  if (!clean) {
    if (required) errors.push({ fila, campo, mensaje: 'El valor es obligatorio.' })
    return null
  }
  const parsed = Number(clean)
  if (!Number.isFinite(parsed)) {
    errors.push({ fila, campo, mensaje: 'Debe ser un número finito con decimal punto.' })
    return null
  }
  return parsed
}

export function parsePtScoresCsv(input: string): { rows: ParsedPtScoreRow[]; errors: PtScoreCsvError[] } {
  const errors: PtScoreCsvError[] = []
  let records: string[][]
  try {
    records = parseCsvRecords(input)
  } catch (error) {
    return { rows: [], errors: [{ fila: 1, campo: 'csv', mensaje: error instanceof Error ? error.message : 'CSV inválido.' }] }
  }
  if (records.length === 0) return { rows: [], errors: [{ fila: 1, campo: 'csv', mensaje: 'El archivo está vacío.' }] }

  const headers = records[0]
  if (headers.length !== PT_SCORE_COLUMNS.length || headers.some((value, i) => value !== PT_SCORE_COLUMNS[i])) {
    return { rows: [], errors: [{ fila: 1, campo: 'columnas', mensaje: `Se requieren exactamente: ${PT_SCORE_COLUMNS.join(', ')}.` }] }
  }

  const rows: ParsedPtScoreRow[] = []
  const keys = new Set<string>()
  for (let index = 1; index < records.length; index += 1) {
    const fila = index + 1
    const cells = records[index]
    if (cells.length !== PT_SCORE_COLUMNS.length) {
      errors.push({ fila, campo: 'columnas', mensaje: `Se esperaban ${PT_SCORE_COLUMNS.length} columnas y llegaron ${cells.length}.` })
      continue
    }
    const raw = Object.fromEntries(PT_SCORE_COLUMNS.map((column, i) => [column, cells[i] ?? ''])) as PtScoreCsvRow
    const requiredText = ['participant_code', 'contaminante', 'run_code', 'level_label', 'unidad', 'metodo'] as const
    for (const field of requiredText) if (!raw[field].trim()) errors.push({ fila, campo: field, mensaje: 'El valor es obligatorio.' })

    let clasificacion: PtScoreClassification | null = null
    if (raw.clasificacion === 'Satisfactorio') clasificacion = 'satisfactorio'
    else if (raw.clasificacion === 'No satisfactorio') clasificacion = 'no_satisfactorio'
    else errors.push({ fila, campo: 'clasificacion', mensaje: 'Use exactamente Satisfactorio o No satisfactorio.' })

    const valorAsignado = numberValue(raw.valor_asignado, true, fila, 'valor_asignado', errors)
    const valorParticipante = numberValue(raw.valor_participante, true, fila, 'valor_participante', errors)
    const nullable = {
      incertidumbreAsignada: numberValue(raw.u_xpt, false, fila, 'u_xpt', errors),
      sigmaPt: numberValue(raw.sigma_pt, false, fila, 'sigma_pt', errors),
      uParticipante: numberValue(raw.u_lab, false, fila, 'u_lab', errors),
      UParticipante: numberValue(raw.U_lab, false, fila, 'U_lab', errors),
      z: numberValue(raw.z, false, fila, 'z', errors),
      zPrima: numberValue(raw.z_prima, false, fila, 'z_prima', errors),
      zeta: numberValue(raw.zeta, false, fila, 'zeta', errors),
      en: numberValue(raw.en, false, fila, 'en', errors),
    }
    const key = `${raw.participant_code.trim()}\u0000${raw.contaminante.trim().toUpperCase()}\u0000${raw.run_code.trim()}\u0000${raw.level_label.trim()}\u0000${raw.metodo.trim()}`
    if (keys.has(key)) errors.push({ fila, campo: 'metodo', mensaje: 'Fila duplicada para participante × ítem × método.' })
    keys.add(key)

    if (errors.some((error) => error.fila === fila) || valorAsignado === null || valorParticipante === null || !clasificacion) continue
    rows.push({
      participantCode: raw.participant_code.trim(), contaminante: raw.contaminante.trim().toUpperCase(),
      runCode: raw.run_code.trim(), levelLabel: raw.level_label.trim(), unidad: raw.unidad.trim(), metodo: raw.metodo.trim(),
      valorAsignado, valorParticipante, clasificacion, ...nullable,
    })
  }
  return { rows, errors }
}
