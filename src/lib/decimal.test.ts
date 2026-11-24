import { describe, expect, it } from 'vitest'
import { computeStats, differsBeyondTolerance, parseDecimal, statsWarnings } from './decimal'

describe('parseDecimal', () => {
  it('acepta coma decimal', () => {
    expect(parseDecimal('12,5')).toEqual({ kind: 'ok', value: 12.5 })
  })
  it('acepta punto decimal', () => {
    expect(parseDecimal('12.5')).toEqual({ kind: 'ok', value: 12.5 })
  })
  it('rechaza explícitamente separador de miles', () => {
    expect(parseDecimal('1.234,5').kind).toBe('invalid')
    expect(parseDecimal('1,234.5').kind).toBe('invalid')
    expect(parseDecimal('1.234.5').kind).toBe('invalid')
  })
  it('vacío es empty, no cero', () => {
    expect(parseDecimal('')).toEqual({ kind: 'empty' })
    expect(parseDecimal('   ')).toEqual({ kind: 'empty' })
  })
  it('rechaza texto y acepta negativos y exponentes', () => {
    expect(parseDecimal('abc').kind).toBe('invalid')
    expect(parseDecimal('12a').kind).toBe('invalid')
    expect(parseDecimal('-0,5')).toEqual({ kind: 'ok', value: -0.5 })
    expect(parseDecimal('1e-3')).toEqual({ kind: 'ok', value: 0.001 })
  })
})

describe('estadísticos', () => {
  it('calcula promedio y desviación muestral', () => {
    const s = computeStats([1, 2, 3])
    expect(s?.mean).toBe(2)
    expect(s?.sd).toBeCloseTo(1)
  })
  it('tolerancia relativa 0,5 %', () => {
    expect(differsBeyondTolerance(100.4, 100)).toBe(false)
    expect(differsBeyondTolerance(101, 100)).toBe(true)
  })
  it('advierte sin bloquear cuando difiere', () => {
    expect(statsWarnings({ d1: '1', d2: '2', d3: '3', meanValue: '2', sdValue: '1' })).toEqual([])
    expect(statsWarnings({ d1: '1', d2: '2', d3: '3', meanValue: '2,5', sdValue: '1' })).toHaveLength(1)
    expect(statsWarnings({ d1: '1', d2: '', d3: '', meanValue: '1', sdValue: '0,3' })).toEqual([])
  })
})
