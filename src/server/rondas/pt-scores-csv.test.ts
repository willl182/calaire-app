import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parsePtScoresCsv, PT_SCORE_COLUMNS } from './pt-scores-csv'

const fixture = readFileSync('_workspace/Puntajes_Finales_PT_2026-07-12.csv', 'utf8')

describe('parsePtScoresCsv', () => {
  it('acepta el fixture UTF-8 real y normaliza sin reclasificar', () => {
    const result = parsePtScoresCsv(fixture)
    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(20)
    expect(result.rows.filter((row) => row.clasificacion === 'satisfactorio')).toHaveLength(12)
    expect(result.rows.filter((row) => row.clasificacion === 'no_satisfactorio')).toHaveLength(8)
  })

  it('convierte opcionales vacíos a null', () => {
    const line = ['p1', 'co', '1', '0', 'ppm', '1', '1', '', '', '1', '', '', '', '', '', '', 'Satisfactorio']
    const result = parsePtScoresCsv(`${PT_SCORE_COLUMNS.join(',')}\n${line.join(',')}\n`)
    expect(result.errors).toEqual([])
    expect(result.rows[0].z).toBeNull()
    expect(result.rows[0].incertidumbreAsignada).toBeNull()
  })

  it.each([
    ['columnas', fixture.replace('"participant_code",', '')],
    ['finito', fixture.replace(',-0.024,', ',NaN,')],
    ['clasificacion', fixture.replace('"Satisfactorio"', '"Aceptable"')],
    ['duplicado', `${fixture}${fixture.split('\n')[1]}\n`],
  ])('rechaza %s inválido', (_name, csv) => expect(parsePtScoresCsv(csv).errors.length).toBeGreaterThan(0))
})
