// Calendario del participante.
import { api } from '@/convex/_generated/api'
import { authedQuery as fetchQuery } from '@/server/convex'

export async function getMyCalendar() {
  return fetchQuery(api.pt.calendar.getMiCalendario, {})
}
