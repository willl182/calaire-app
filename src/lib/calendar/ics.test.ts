import { describe, expect, test } from 'vitest'
import { buildCalendarIcs } from './ics'

describe('buildCalendarIcs', () => {
  test('genera eventos de día completo y escapa texto iCalendar', () => {
    const ics = buildCalendarIcs([{ id: 'hito-1', title: 'Entrega, final', description: 'Ronda; R1', date: '2026-07-20' }], new Date('2026-07-14T13:00:00Z'))
    expect(ics).toContain('DTSTART;VALUE=DATE:20260720')
    expect(ics).toContain('DTEND;VALUE=DATE:20260721')
    expect(ics).toContain('SUMMARY:Entrega\\, final')
    expect(ics).toContain('DESCRIPTION:Ronda\\; R1')
    expect(ics.endsWith('\r\n')).toBe(true)
  })
})
