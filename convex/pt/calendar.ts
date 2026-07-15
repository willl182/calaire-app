import { v } from 'convex/values'
import { internalMutation, query } from '../_generated/server'
import { internal } from '../_generated/api'

const BOGOTA_TIME_ZONE = 'America/Bogota'
const REMINDER_THRESHOLDS = [7, 3, 1] as const

function dateInBogota(now: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BOGOTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(now))
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

function addCivilDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number)
  const result = new Date(Date.UTC(year, month - 1, day + days))
  return result.toISOString().slice(0, 10)
}

export const getMiCalendario = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Autenticacion requerida.')

    const memberships = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_user', (q) => q.eq('workosUserId', identity.subject))
      .take(100)

    const groups = await Promise.all(memberships.map(async (membership) => {
      const [ronda, hitos] = await Promise.all([
        ctx.db.get(membership.rondaId),
        ctx.db.query('sgcHitosRonda')
          .withIndex('by_rondaId_and_visibleParticipante', (q) =>
            q.eq('rondaId', membership.rondaId).eq('visibleParticipante', true))
          .take(250),
      ])
      if (!ronda) return []
      return hitos
        .filter((hito) => Boolean(hito.fechaObjetivo))
        .map((hito) => ({
          id: hito._id,
          rondaId: ronda._id,
          rondaCodigo: ronda.codigo,
          rondaNombre: ronda.nombre,
          rondaEstado: ronda.estado,
          nombre: hito.nombre,
          codigo: hito.codigo,
          fase: hito.fase,
          fechaObjetivo: hito.fechaObjetivo!,
          fechaReal: hito.fechaReal ?? null,
          estado: hito.estado,
        }))
    }))

    return groups.flat().sort((a, b) =>
      a.fechaObjetivo.localeCompare(b.fechaObjetivo) || a.nombre.localeCompare(b.nombre))
  },
})

export const scheduleDailyReminders = internalMutation({
  args: { now: v.optional(v.number()) },
  handler: async (ctx, { now }) => {
    const today = dateInBogota(now ?? Date.now())
    const targetDates = new Map(REMINDER_THRESHOLDS.map((days) => [addCivilDays(today, days), days]))
    const hitos = await ctx.db
      .query('sgcHitosRonda')
      .withIndex('by_visibleParticipante_and_fechaObjetivo', (q) =>
        q.eq('visibleParticipante', true)
          .gte('fechaObjetivo', addCivilDays(today, 1))
          .lte('fechaObjetivo', addCivilDays(today, 7)))
      .take(200)

    let scheduled = 0
    for (const hito of hitos) {
      if (!hito.fechaObjetivo || ['completado', 'cancelado', 'no_aplica'].includes(hito.estado)) continue
      const threshold = targetDates.get(hito.fechaObjetivo)
      if (!threshold) continue
      await ctx.scheduler.runAfter(0, internal.pt.calendar.deliverHitoReminderBatch, {
        hitoId: hito._id,
        umbralDias: threshold,
        fechaObjetivo: hito.fechaObjetivo,
        cursor: null,
      })
      scheduled += 1
    }
    return { today, scheduled }
  },
})

export const deliverHitoReminderBatch = internalMutation({
  args: {
    hitoId: v.id('sgcHitosRonda'),
    umbralDias: v.union(v.literal(7), v.literal(3), v.literal(1)),
    fechaObjetivo: v.string(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const hito = await ctx.db.get(args.hitoId)
    if (!hito || !hito.visibleParticipante || hito.fechaObjetivo !== args.fechaObjetivo ||
        ['completado', 'cancelado', 'no_aplica'].includes(hito.estado)) return { delivered: 0, done: true }

    const page = await ctx.db.query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', hito.rondaId))
      .paginate({ numItems: 40, cursor: args.cursor })
    let delivered = 0
    for (const participant of page.page) {
      const existing = await ctx.db.query('sgcHitoRecordatorios')
        .withIndex('by_hitoId_and_rondaParticipanteId_and_umbralDias', (q) =>
          q.eq('hitoId', hito._id).eq('rondaParticipanteId', participant._id).eq('umbralDias', args.umbralDias))
        .unique()
      if (existing) continue
      const now = Date.now()
      const notificationId = await ctx.db.insert('sgcNotificaciones', {
        rondaId: hito.rondaId,
        rondaParticipanteId: participant._id,
        destinatarioEmail: participant.email,
        titulo: `Recordatorio: ${hito.nombre}`,
        mensaje: `${hito.nombre} está programado para ${args.fechaObjetivo}. Faltan ${args.umbralDias} día${args.umbralDias === 1 ? '' : 's'}.`,
        tipo: 'recordatorio',
        estado: 'publicada',
        leidaAt: null,
        createdAt: now,
        createdBy: 'sistema:calendario',
        updatedAt: now,
        updatedBy: 'sistema:calendario',
      })
      await ctx.db.insert('sgcHitoRecordatorios', {
        hitoId: hito._id,
        rondaId: hito.rondaId,
        rondaParticipanteId: participant._id,
        umbralDias: args.umbralDias,
        fechaObjetivoNotificada: args.fechaObjetivo,
        notificacionId: notificationId,
        createdAt: now,
      })
      delivered += 1
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.pt.calendar.deliverHitoReminderBatch, { ...args, cursor: page.continueCursor })
    }
    return { delivered, done: page.isDone }
  },
})
