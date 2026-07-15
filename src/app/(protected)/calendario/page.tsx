import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/server/auth'
import { getMyCalendar } from '@/server/rondas'
import { CalendarView } from './CalendarView'

export default async function CalendarioPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (isAdmin(auth)) redirect('/dashboard')
  const items = await getMyCalendar()

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
      <header className="header-bar flex flex-col gap-4 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pt-primary-dark)]">Todas sus rondas</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">Calendario de hitos</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">Fechas operativas visibles durante todo el ciclo del ensayo de aptitud.</p>
        </div>
        <Link href="/calendario/ics" className="btn-primary">Exportar ICS</Link>
      </header>
      <CalendarView items={items} />
    </main>
  )
}
