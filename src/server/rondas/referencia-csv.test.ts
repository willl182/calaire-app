import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  buildReferenciaImportPreview,
  parseReferenciaCsv,
  type ParsedReferenciaRow,
} from './referencia-csv.ts'
import type { RondaPTItem, RondaPTSampleGroup } from './client'

const ptItems: RondaPTItem[] = [
  makeItem('co-0', 'CO', '0 ppm', 1),
  makeItem('co-63', 'CO', '6.3 ppm', 2),
  makeItem('so2-0', 'SO2', '0 ppb', 1),
  makeItem('so2-179', 'SO2', '179 ppb', 2),
]

const sampleGroups: RondaPTSampleGroup[] = [
  {
    id: 'group-1',
    ronda_id: 'ronda-1',
    sample_group: 'A',
    sort_order: 1,
    created_at: '2026-05-06T00:00:00.000Z',
  },
]

function withUxExpColumn(csv: string): string {
  const [header, ...rows] = csv.trim().split('\n')
  return [
    header.replace('"u_value","n_hours"', '"u_value","u_exp","n_hours"'),
    ...rows.map((row) => {
      const columns = row.split(',')
      const ux = Number(columns[10])
      columns.splice(11, 0, Number.isFinite(ux) ? String(ux * 2) : '')
      return columns.join(',')
    }),
  ].join('\n')
}

function makeItem(id: string, contaminante: 'CO' | 'SO2', level: string, sortOrder: number): RondaPTItem {
  return {
    id,
    ronda_id: 'ronda-1',
    contaminante,
    run_code: id,
    level_label: level,
    sort_order: sortOrder,
    created_at: '2026-05-06T00:00:00.000Z',
  }
}

test('lee el CSV de referencia y reconoce CO y SO2', () => {
  const csv = withUxExpColumn(readFileSync('data/referencia_ronda.csv', 'utf8'))
  const rows = parseReferenciaCsv(csv)

  assert.equal(rows.length, 10)
  assert.deepEqual(new Set(rows.map((row) => row.pollutant)), new Set(['CO', 'SO2']))
})

test('mapea niveles flexibles y convierte NA de sd_value a cero para nivel inicial', () => {
  const rows = parseReferenciaCsv(withUxExpColumn(readFileSync('data/referencia_ronda.csv', 'utf8'))).filter(
    (row) =>
      (row.pollutant === 'CO' && ['0-ppm', '6.3-ppm'].includes(row.level)) ||
      (row.pollutant === 'SO2' && ['0-ppb', '179-ppb'].includes(row.level))
  )
  const preview = buildReferenciaImportPreview(rows, ptItems, sampleGroups)

  assert.deepEqual(preview.errors, [])
  assert.equal(preview.cells.length, 4)
  assert.equal(preview.cells.find((cell) => cell.ptItemId === 'co-0')?.sdValue, 0)
  assert.equal(preview.cells.find((cell) => cell.ptItemId === 'so2-0')?.sdValue, 0)

  const co63 = preview.cells.find((cell) => cell.ptItemId === 'co-63')
  assert.equal(co63?.d1, 6.2805)
  assert.equal(co63?.d2, 6.2807)
  assert.equal(co63?.d3, 6.31706666666667)
  assert.equal(co63?.meanValue, 6.29275555555556)
  assert.equal(co63?.k, 2)
  assert.equal(co63?.uxExp, co63 ? co63.ux * 2 : undefined)
})

test('acepta k opcional por fila y valor grupal por defecto', () => {
  const rows = parseReferenciaCsv(
    [
      '"source","pollutant","level","unit","instrument","mean_value","sd_value","u_value","u_exp","k","n_hours","hour_starts"',
      '"ronda","co","0-ppm","ppm","ref",0,NA,0.5,0.8,1.5,1,"2026-04-23 12:30:00"',
      '"ronda","co","6.3-ppm","ppm","ref",6.2,0.1,0.2,0.7,,3,"2026-04-23 12:30:00"',
    ].join('\n')
  )

  const preview = buildReferenciaImportPreview(rows, ptItems, sampleGroups, new Set(), 3)
  assert.deepEqual(preview.errors, [])
  assert.equal(preview.cells.find((cell) => cell.ptItemId === 'co-0')?.k, 1.5)
  assert.equal(preview.cells.find((cell) => cell.ptItemId === 'co-0')?.uxExp, 0.8)
  assert.equal(preview.cells.find((cell) => cell.ptItemId === 'co-63')?.k, 3)
  assert.equal(preview.cells.find((cell) => cell.ptItemId === 'co-63')?.uxExp, 0.7)
})

test('rechaza NA en mean_value o u_value', () => {
  assert.throws(
    () =>
      parseReferenciaCsv(
        [
          '"source","pollutant","level","unit","instrument","mean_value","sd_value","u_value","u_exp","n_hours","hour_starts"',
          '"ronda","co","0-ppm","ppm","ref",NA,NA,1,1,"2026-04-23 12:30:00"',
        ].join('\n')
      ),
    /mean_value es requerido/
  )

  assert.throws(
    () =>
      parseReferenciaCsv(
        [
          '"source","pollutant","level","unit","instrument","mean_value","sd_value","u_value","u_exp","n_hours","hour_starts"',
          '"ronda","co","0-ppm","ppm","ref",0,NA,NA,1,1,"2026-04-23 12:30:00"',
        ].join('\n')
      ),
    /u_value es requerido/
  )
})

test('reporta contaminantes y niveles sin configuracion', () => {
  const rows: ParsedReferenciaRow[] = [
    {
      rowNumber: 2,
      source: 'ronda',
      pollutant: 'O3',
      level: '1-ppb',
      unit: 'ppb',
      instrument: 'ref',
      meanH1: 1,
      meanH2: 1,
      meanH3: 1,
      meanValue: 1,
      sdValue: 0.1,
      ux: 0.1,
      k: null,
      uxExp: 0.2,
      nHours: 3,
      hourStarts: '',
    },
    {
      rowNumber: 3,
      source: 'ronda',
      pollutant: 'CO',
      level: '999-ppm',
      unit: 'ppm',
      instrument: 'ref',
      meanH1: 1,
      meanH2: 1,
      meanH3: 1,
      meanValue: 1,
      sdValue: 0.1,
      ux: 0.1,
      k: null,
      uxExp: 0.2,
      nHours: 3,
      hourStarts: '',
    },
  ]

  const preview = buildReferenciaImportPreview(rows, ptItems, sampleGroups)
  assert.equal(preview.errors.length, 2)
  assert.match(preview.errors[0], /O3 no esta configurado/)
  assert.match(preview.errors[1], /no hay nivel PT/)
})
