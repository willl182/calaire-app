/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

async function seedCalendar(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const now = Date.now()
    const rondaA = await ctx.db.insert('rondas', { codigo: 'R-A', nombre: 'Ronda A', estado: 'activa', createdAt: now })
    const rondaB = await ctx.db.insert('rondas', { codigo: 'R-B', nombre: 'Ronda B', estado: 'cerrada', createdAt: now })
    const participantA = await ctx.db.insert('rondaParticipantes', { rondaId: rondaA, workosUserId: 'owner', email: 'owner@example.com', invitadoAt: now, participantProfile: 'member' })
    await ctx.db.insert('rondaParticipantes', { rondaId: rondaB, workosUserId: 'other', email: 'other@example.com', invitadoAt: now, participantProfile: 'member' })
    const visibleHito = await ctx.db.insert('sgcHitosRonda', {
      rondaId: rondaA, codigo: 'H-1', nombre: 'Entrega final', fase: 'resultados', fechaObjetivo: '2026-07-21', fechaReal: null,
      estado: 'pendiente', responsable: 'CALAIRE', visibleParticipante: true, bloqueaCierre: false, formatoRelacionado: null, notas: null,
      createdAt: now, createdBy: 'admin', updatedAt: now, updatedBy: 'admin',
    })
    await ctx.db.insert('sgcHitosRonda', {
      rondaId: rondaA, codigo: 'H-2', nombre: 'Hito interno', fase: 'interno', fechaObjetivo: '2026-07-20', fechaReal: null,
      estado: 'pendiente', responsable: 'CALAIRE', visibleParticipante: false, bloqueaCierre: false, formatoRelacionado: null, notas: null,
      createdAt: now, createdBy: 'admin', updatedAt: now, updatedBy: 'admin',
    })
    await ctx.db.insert('sgcHitosRonda', {
      rondaId: rondaB, codigo: 'H-3', nombre: 'Hito ajeno', fase: 'cierre', fechaObjetivo: '2026-07-22', fechaReal: null,
      estado: 'pendiente', responsable: 'CALAIRE', visibleParticipante: true, bloqueaCierre: false, formatoRelacionado: null, notas: null,
      createdAt: now, createdBy: 'admin', updatedAt: now, updatedBy: 'admin',
    })
    return { rondaA, participantA, visibleHito }
  })
}

describe('calendario del participante', () => {
  test('solo devuelve hitos visibles de las rondas propias en cualquier estado', async () => {
    const t = convexTest(schema, modules)
    await seedCalendar(t)
    const result = await t.withIdentity({ subject: 'owner' }).query(api.pt.calendar.getMiCalendario, {})
    expect(result.map((item) => item.nombre)).toEqual(['Entrega final'])
    expect(result[0]).toMatchObject({ rondaCodigo: 'R-A', fechaObjetivo: '2026-07-21' })
  })

  test('rechaza identidad ausente', async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.pt.calendar.getMiCalendario, {})).rejects.toThrow('Autenticacion requerida')
  })

  test('recordatorio 7/3/1 es idempotente incluso si cambia la fecha', async () => {
    const t = convexTest(schema, modules)
    const ids = await seedCalendar(t)
    const args = { hitoId: ids.visibleHito, umbralDias: 7 as const, fechaObjetivo: '2026-07-21', cursor: null }
    await t.mutation(internal.pt.calendar.deliverHitoReminderBatch, args)
    await t.mutation(internal.pt.calendar.deliverHitoReminderBatch, args)
    await t.run((ctx) => ctx.db.patch(ids.visibleHito, { fechaObjetivo: '2026-07-28' }))
    await t.mutation(internal.pt.calendar.deliverHitoReminderBatch, { ...args, fechaObjetivo: '2026-07-28' })

    const rows = await t.run((ctx) => ctx.db.query('sgcHitoRecordatorios').collect())
    const notifications = await t.run((ctx) => ctx.db.query('sgcNotificaciones').collect())
    expect(rows).toHaveLength(1)
    expect(notifications).toHaveLength(1)
    expect(rows[0]).toMatchObject({ rondaParticipanteId: ids.participantA, umbralDias: 7 })
  })

  test('no recuerda hitos cancelados o no aplicables', async () => {
    const t = convexTest(schema, modules)
    const ids = await seedCalendar(t)
    await t.run((ctx) => ctx.db.patch(ids.visibleHito, { estado: 'cancelado' }))
    const result = await t.mutation(internal.pt.calendar.deliverHitoReminderBatch, { hitoId: ids.visibleHito, umbralDias: 1, fechaObjetivo: '2026-07-21', cursor: null })
    expect(result).toEqual({ delivered: 0, done: true })
    expect(await t.run((ctx) => ctx.db.query('sgcNotificaciones').collect())).toHaveLength(0)
  })
})
