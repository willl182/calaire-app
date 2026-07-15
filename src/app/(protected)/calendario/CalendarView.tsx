'use client'

import { useMemo, useState } from 'react'

type CalendarItem = {
  id: string
  rondaCodigo: string
  rondaNombre: string
  nombre: string
  codigo: string
  fase: string
  fechaObjetivo: string
  fechaReal: string | null
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'vencido' | 'cancelado' | 'no_aplica'
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function todayBogota() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

function itemType(item: CalendarItem) {
  return item.codigo.split(/[._-]/)[0] || item.codigo
}

function operativeStatus(item: CalendarItem, today: string) {
  if (item.estado === 'completado') return 'completado'
  if (item.estado === 'cancelado') return 'cancelado'
  if (item.estado === 'no_aplica') return 'no_aplica'
  if (item.estado === 'vencido' || item.fechaObjetivo < today) return 'vencido'
  return 'proximo'
}

const STATUS_LABELS = { proximo: 'Próximo', completado: 'Completado', vencido: 'Vencido', cancelado: 'Cancelado', no_aplica: 'No aplica' }
const STATUS_CLASSES = {
  proximo: 'border-sky-200 bg-sky-50 text-sky-800',
  completado: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  vencido: 'border-rose-200 bg-rose-50 text-rose-800',
  cancelado: 'border-slate-200 bg-slate-100 text-slate-600',
  no_aplica: 'border-stone-200 bg-stone-50 text-stone-600',
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function CalendarView({ items }: { items: CalendarItem[] }) {
  const today = todayBogota()
  const initial = items.find((item) => item.fechaObjetivo >= today)?.fechaObjetivo ?? today
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(`${initial.slice(0, 7)}-01T00:00:00Z`))
  const [phase, setPhase] = useState('todas')
  const [type, setType] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [round, setRound] = useState('todas')
  const phases = [...new Set(items.map((item) => item.fase))].sort()
  const types = [...new Set(items.map(itemType))].sort()
  const rounds = [...new Set(items.map((item) => item.rondaCodigo))].sort()
  const filtered = useMemo(() => items.filter((item) =>
    (phase === 'todas' || item.fase === phase) &&
    (type === 'todos' || itemType(item) === type) &&
    (round === 'todas' || item.rondaCodigo === round) &&
    (status === 'todos' || operativeStatus(item, today) === status)
  ), [items, phase, round, status, today, type])

  const year = visibleMonth.getUTCFullYear()
  const month = visibleMonth.getUTCMonth()
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const leading = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7
  const cells = Array.from({ length: leading + days }, (_, index) => index < leading ? null : index - leading + 1)
  const currentMonth = monthKey(visibleMonth)

  function moveMonth(offset: number) {
    setVisibleMonth(new Date(Date.UTC(year, month + offset, 1)))
  }

  return (
    <div className="space-y-6">
      <section className="card p-5" aria-label="Filtros del calendario">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-[var(--foreground)]">Ronda
            <select value={round} onChange={(event) => setRound(event.target.value)} className="input mt-1 w-full">
              <option value="todas">Todas</option>{rounds.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--foreground)]">Tipo
            <select value={type} onChange={(event) => setType(event.target.value)} className="input mt-1 w-full">
              <option value="todos">Todos</option>{types.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--foreground)]">Fase
            <select value={phase} onChange={(event) => setPhase(event.target.value)} className="input mt-1 w-full">
              <option value="todas">Todas</option>{phases.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--foreground)]">Estado
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="input mt-1 w-full">
              <option value="todos">Todos</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="card overflow-hidden" aria-labelledby="month-title">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
          <button type="button" className="btn-secondary" onClick={() => moveMonth(-1)} aria-label="Mes anterior">←</button>
          <h2 id="month-title" className="text-lg font-bold capitalize text-[var(--foreground)]">{MONTHS[month]} de {year}</h2>
          <button type="button" className="btn-secondary" onClick={() => moveMonth(1)} aria-label="Mes siguiente">→</button>
        </div>
        <div className="grid grid-cols-7 border-b border-[var(--border-soft)] bg-[var(--surface-muted)]">
          {WEEKDAYS.map((day) => <div key={day} className="px-2 py-2 text-center text-xs font-bold text-[var(--foreground-muted)]">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-[var(--border-soft)] bg-[var(--surface-muted)]/40" />
            const date = `${currentMonth}-${String(day).padStart(2, '0')}`
            const dayItems = filtered.filter((item) => item.fechaObjetivo === date)
            return <div key={date} className={`min-h-24 border-b border-r border-[var(--border-soft)] p-2 ${date === today ? 'ring-2 ring-inset ring-[var(--pt-primary)]' : ''}`}>
              <div className="mb-1 text-xs font-bold text-[var(--foreground-muted)]">{day}</div>
              <div className="space-y-1">{dayItems.map((item) => {
                const state = operativeStatus(item, today)
                return <div key={item.id} title={`${item.nombre} · ${item.rondaNombre}`} className={`truncate rounded border px-1.5 py-1 text-[11px] font-semibold ${STATUS_CLASSES[state]}`}>{item.rondaCodigo} · {item.nombre}</div>
              })}</div>
            </div>
          })}
        </div>
      </section>

      <section className="card p-5" aria-labelledby="agenda-title">
        <h2 id="agenda-title" className="text-lg font-bold text-[var(--foreground)]">Agenda cronológica</h2>
        <div className="mt-4 divide-y divide-[var(--border-soft)]">
          {filtered.length === 0 && <p className="py-6 text-sm text-[var(--foreground-muted)]">No hay hitos para estos filtros.</p>}
          {filtered.map((item) => {
            const state = operativeStatus(item, today)
            return <article key={item.id} className="grid gap-3 py-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
              <time dateTime={item.fechaObjetivo} className="font-mono text-sm font-semibold text-[var(--foreground)]">{item.fechaObjetivo}</time>
              <div><h3 className="font-semibold text-[var(--foreground)]">{item.nombre}</h3><p className="text-sm text-[var(--foreground-muted)]">{item.rondaCodigo} · {item.fase}{item.fechaReal ? ` · completado ${item.fechaReal}` : ''}</p></div>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[state]}`}>{STATUS_LABELS[state]}</span>
            </article>
          })}
        </div>
      </section>
    </div>
  )
}
