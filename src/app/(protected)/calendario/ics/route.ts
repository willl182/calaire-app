import { buildCalendarIcs } from '@/lib/calendar/ics'
import { getMyCalendar } from '@/server/rondas'

export async function GET() {
  try {
    const hitos = await getMyCalendar()
    const body = buildCalendarIcs(hitos.map((hito) => ({
      id: hito.id,
      title: `${hito.nombre} — ${hito.rondaCodigo}`,
      description: `${hito.rondaNombre}. Fase: ${hito.fase}. Estado: ${hito.estado}.`,
      date: hito.fechaObjetivo,
    })))
    return new Response(body, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendario-calaire.ics"',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return new Response('No autorizado.', { status: 401 })
  }
}
