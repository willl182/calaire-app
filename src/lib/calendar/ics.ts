export type CalendarIcsEvent = {
  id: string
  title: string
  description: string
  date: string
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function foldLine(line: string) {
  const parts: string[] = []
  let remaining = line
  while (Buffer.byteLength(remaining, 'utf8') > 73) {
    let end = Math.min(73, remaining.length)
    while (Buffer.byteLength(remaining.slice(0, end), 'utf8') > 73) end -= 1
    parts.push(remaining.slice(0, end))
    remaining = remaining.slice(end)
  }
  parts.push(remaining)
  return parts.join('\r\n ')
}

function nextCivilDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}

export function buildCalendarIcs(events: CalendarIcsEvent[], generatedAt = new Date()) {
  const stamp = generatedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CALAIRE//Calendario PT//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CALAIRE - Ensayos de aptitud',
  ]
  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeIcs(event.id)}@calaire.unal.edu.co`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${event.date.replaceAll('-', '')}`,
      `DTEND;VALUE=DATE:${nextCivilDate(event.date).replaceAll('-', '')}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}
