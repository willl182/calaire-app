/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

async function seedScore(
  t: ReturnType<typeof convexTest>,
  options: { user: string; code: string; published: boolean; classification?: 'satisfactorio' | 'no_satisfactorio' },
) {
  return t.run(async (ctx) => {
    const now = Date.now()
    const rondaId = await ctx.db.insert('rondas', { codigo: options.code, nombre: options.code, estado: 'cerrada', createdAt: now })
    const participanteId = await ctx.db.insert('rondaParticipantes', {
      rondaId, workosUserId: options.user, email: `${options.user}@example.com`, invitadoAt: now,
      participantProfile: 'member', participantCode: options.user, claimedAt: now,
    })
    const itemId = await ctx.db.insert('rondaPtItems', {
      rondaId, contaminante: 'CO', runCode: 'R1', levelLabel: 'Nivel 1', sortOrder: 1, createdAt: now,
    })
    const importToken = `${options.code}-token`
    await ctx.db.insert('ptEvaluaciones', {
      rondaId, estado: options.published ? 'publicada' : 'borrador_validado', importToken,
      filasEsperadas: 1, filasImportadas: 1, publicadaAt: options.published ? now : null,
      publicadaBy: options.published ? 'admin' : null, updatedAt: now, updatedBy: 'admin',
    })
    await ctx.db.insert('ptScores', {
      rondaId, rondaParticipanteId: participanteId, ptItemId: itemId, metodo: 'NDIR',
      valorAsignado: 10, incertidumbreAsignada: null, sigmaPt: 1, valorParticipante: 11,
      uParticipante: null, UParticipante: null, unidad: 'ppm', z: 1, zPrima: 1.1, zeta: null, en: 0.5,
      clasificacion: options.classification ?? 'satisfactorio', importToken, importadoAt: now, importadoBy: 'admin',
    })
    return { rondaId, participanteId }
  })
}

describe('getMiDesempeno', () => {
  test('devuelve solo resultados publicados del usuario autenticado', async () => {
    const t = convexTest(schema, modules)
    await seedScore(t, { user: 'user-a', code: 'PUBLICADA-A', published: true })
    await seedScore(t, { user: 'user-a', code: 'BORRADOR-A', published: false })
    await seedScore(t, { user: 'user-b', code: 'PUBLICADA-B', published: true, classification: 'no_satisfactorio' })

    const result = await t.withIdentity({ subject: 'user-a' }).query(api.pt.scores.getMiDesempeno, {})

    expect(result.series).toHaveLength(1)
    expect(result.series[0].puntos.map((point) => point.rondaCodigo)).toEqual(['PUBLICADA-A'])
    expect(result.rondas).toMatchObject([{ rondaCodigo: 'PUBLICADA-A', satisfactorios: 1, noSatisfactorios: 0, porcentajeSatisfactorio: 100 }])
  })

  test('rechaza consultas sin identidad', async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.pt.scores.getMiDesempeno, {})).rejects.toThrow('Autenticacion requerida')
  })
})

describe('getMisResultados', () => {
  test('participante ve solo sus resultados publicados e ignora rondaParticipanteId ajeno', async () => {
    const t = convexTest(schema, modules)
    const own = await seedScore(t, { user: 'user-a', code: 'RONDA-A', published: true })
    const foreign = await seedScore(t, { user: 'user-b', code: 'RONDA-A2', published: true })
    await t.run(async (ctx) => { await ctx.db.patch(foreign.participanteId, { rondaId: own.rondaId }) })

    const result = await t.withIdentity({ subject: 'user-a' })
      .query(api.pt.scores.getMisResultados, { rondaId: own.rondaId, rondaParticipanteId: foreign.participanteId })

    expect(result.estado).toBe('publicada')
    expect(result.resultados?.map((row) => row.rondaParticipanteId)).toEqual([own.participanteId])
  })

  test('admin consulta los resultados del participante indicado', async () => {
    const t = convexTest(schema, modules)
    const ids = await seedScore(t, { user: 'user-a', code: 'RONDA-B', published: true })
    const asAdmin = t.withIdentity({ subject: 'admin-1', role: 'admin' })

    const result = await asAdmin.query(api.pt.scores.getMisResultados, { rondaId: ids.rondaId, rondaParticipanteId: ids.participanteId })
    expect(result.estado).toBe('publicada')
    expect(result.resultados).toHaveLength(1)

    await expect(asAdmin.query(api.pt.scores.getMisResultados, { rondaId: ids.rondaId }))
      .rejects.toThrow('Indique el participante')
  })

  test('admin no puede usar un participante de otra ronda', async () => {
    const t = convexTest(schema, modules)
    const first = await seedScore(t, { user: 'user-a', code: 'RONDA-C', published: true })
    const second = await seedScore(t, { user: 'user-b', code: 'RONDA-D', published: true })

    await expect(t.withIdentity({ subject: 'admin-1', role: 'admin' })
      .query(api.pt.scores.getMisResultados, { rondaId: first.rondaId, rondaParticipanteId: second.participanteId }))
      .rejects.toThrow('no pertenece a la ronda')
  })

  test('sin evaluación publicada responde pendiente', async () => {
    const t = convexTest(schema, modules)
    const ids = await seedScore(t, { user: 'user-a', code: 'RONDA-E', published: false })
    const result = await t.withIdentity({ subject: 'user-a' }).query(api.pt.scores.getMisResultados, { rondaId: ids.rondaId })
    expect(result).toEqual({ estado: 'pendiente' })
  })
})
