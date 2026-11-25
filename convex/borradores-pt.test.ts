// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')
delete modules['./borradores-pt.test.ts']

async function seed(t: ReturnType<typeof convexTest>, claimed: boolean) {
  return t.run(async (ctx) => {
    const now = Date.now()
    const rondaId = await ctx.db.insert('rondas', { codigo: 'R-BORR', nombre: 'R', estado: 'activa', createdAt: now })
    const participanteId = await ctx.db.insert('rondaParticipantes', {
      rondaId, workosUserId: 'pending:x', email: 'participante 01 (pendiente)', participantProfile: 'member',
      participantCode: 'ZFT5R6', replicateCode: 2, invitadoAt: now, ...(claimed ? { claimedAt: now } : {}),
    })
    const ptItemId = await ctx.db.insert('rondaPtItems', { rondaId, contaminante: 'CO', runCode: 'R1', levelLabel: 'N1', sortOrder: 1, createdAt: now })
    const sampleGroupId = await ctx.db.insert('rondaPtSampleGroups', { rondaId, sampleGroup: 'A', sortOrder: 1, createdAt: now })
    const base = { rondaId, rondaParticipanteId: participanteId, ptItemId, sampleGroupId, meanValue: 1, sdValue: 0, draftSavedAt: now, updatedAt: now }
    await ctx.db.insert('enviosPt', base)
    await ctx.db.insert('enviosPt', base)
    await ctx.db.insert('enviosPt', { ...base, finalSubmittedAt: now })
    return participanteId
  })
}

const contar = (t: ReturnType<typeof convexTest>) => t.run(async (ctx) => (await ctx.db.query('enviosPt').collect()).length)

test('eliminarBorradoresPT: en seco no borra; aplicado borra solo los borradores', async () => {
  const t = convexTest(schema, modules)
  const participanteId = await seed(t, false)

  expect(await t.mutation(internal.migrations.eliminarBorradoresPT, { participanteId })).toMatchObject({ dryRun: true, borradores: 2, finalesConservados: 1, eliminados: 0 })
  expect(await contar(t)).toBe(3)

  expect(await t.mutation(internal.migrations.eliminarBorradoresPT, { participanteId, dryRun: false })).toMatchObject({ borradores: 2, eliminados: 2 })
  expect(await contar(t)).toBe(1)
  expect(await t.mutation(internal.migrations.eliminarBorradoresPT, { participanteId, dryRun: false })).toMatchObject({ borradores: 0, eliminados: 0 })
})

test('eliminarBorradoresPT: rechaza cupos ya reclamados', async () => {
  const t = convexTest(schema, modules)
  const participanteId = await seed(t, true)
  await expect(t.mutation(internal.migrations.eliminarBorradoresPT, { participanteId, dryRun: false })).rejects.toThrow(/reclamado/)
  expect(await contar(t)).toBe(3)
})
