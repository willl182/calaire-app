import { describe, expect, it } from 'vitest'
import { ddMmAaaaAIso, isoADdMmAaaa } from './fechas'

describe('fechas SGC', () => {
  it('muestra ISO como dd/mm/aaaa', () => {
    expect(isoADdMmAaaa('2026-11-24')).toBe('24/11/2026')
    expect(isoADdMmAaaa('')).toBe('')
  })

  it('convierte dd/mm/aaaa a ISO y rechaza fechas inválidas', () => {
    expect(ddMmAaaaAIso('24/11/2026')).toBe('2026-11-24')
    expect(ddMmAaaaAIso('1/2/2026')).toBe('2026-02-01')
    expect(ddMmAaaaAIso('2026-11-24')).toBe('2026-11-24')
    expect(ddMmAaaaAIso('')).toBe('')
    expect(ddMmAaaaAIso('31/02/2026')).toBeNull()
    expect(ddMmAaaaAIso('mañana')).toBeNull()
  })
})
