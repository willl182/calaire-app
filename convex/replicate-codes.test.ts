// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { nextReplicateCode } from './rondas/codes'

const modules = import.meta.glob('./**/*.ts')
delete modules['./replicate-codes.test.ts']

const ADMIN = { subject: 'admin-rc', role: 'admin' }

async function seedRonda(t: ReturnType<typeof convexTest>, codigo = 'R-RC') {
  return t.run((ctx) => ctx.db.insert('rondas', { codigo, nombre: 'Ronda RC', estado: 'borrador', createdAt: Date.now() }))
}

async function codesByUser(t: ReturnType<typeof convexTest>, rondaId: string) {
  const rows = await t.run((ctx) =>
    ctx.db.query('rondaParticipantes').collect()
  )
  return Object.fromEntries(rows.filter((r) => r.rondaId === rondaId).map((r) => [r.workosUserId, r.replicateCode]))
}

async function sha256(value: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

test('nextReplicateCode: referencia 1, participantes desde 2, salta ocupados', () => {
  expect(nextReplicateCode([], 'member_special')).toBe(1)
  expect(nextReplicateCode([], 'member')).toBe(2)
  expect(nextReplicateCode([2, 3, null], 'member')).toBe(4)
  expect(nextReplicateCode([1, 2], 'member_special')).toBe(3)
})

test('alta individual asigna 2, 3... y la referencia recibe 1', async () => {
  const t = convexTest(schema, modules)
  const asAdmin = t.withIdentity(ADMIN)
  const rondaId = await seedRonda(t)

  await asAdmin.mutation(api.rondas.index.assignParticipante, { rondaId, workosUserId: 'u1', email: 'u1@lab.test', participantProfile: 'member' })
  await asAdmin.mutation(api.rondas.index.addParticipante, { rondaId, workosUserId: 'u2', email: 'u2@lab.test', participantProfile: 'member' })
  await asAdmin.mutation(api.rondas.index.addReferenceSlot, { rondaId, workosUserId: 'ref', email: 'ref@lab.test' })

  expect(await codesByUser(t, rondaId)).toEqual({ u1: 2, u2: 3, ref: 1 })
})

test('alta en lote (createConfiguredRonda) asigna referencia = 1 aunque venga despues', async () => {
  const t = convexTest(schema, modules)
  const asAdmin = t.withIdentity(ADMIN)
  const rondaId = await asAdmin.mutation(api.rondas.index.createConfiguredRonda, {
    codigo: 'R-LOTE',
    nombre: 'Lote',
    contaminantes: [],
    slots: [
      { workosUserId: 'a', email: 'a@lab.test', participantProfile: 'member' },
      { workosUserId: 'b', email: 'b@lab.test', participantProfile: 'member' },
      { workosUserId: 'ref', email: 'ref@lab.test', participantProfile: 'member_special' },
    ],
  })

  expect(await codesByUser(t, rondaId)).toEqual({ a: 2, b: 3, ref: 1 })
})

test('no pisa un codigo dado a mano y usa el siguiente libre', async () => {
  const t = convexTest(schema, modules)
  const asAdmin = t.withIdentity(ADMIN)
  const rondaId = await seedRonda(t)

  await asAdmin.mutation(api.rondas.index.addParticipante, { rondaId, workosUserId: 'm', email: 'm@lab.test', participantProfile: 'member', replicateCode: 2 })
  await asAdmin.mutation(api.rondas.index.addParticipante, { rondaId, workosUserId: 'x', email: 'x@lab.test', participantProfile: 'member' })

  expect(await codesByUser(t, rondaId)).toEqual({ m: 2, x: 3 })
})

test('agent API addParticipante asigna codigo de replica', async () => {
  const t = convexTest(schema, modules)
  const rondaId = await seedRonda(t)
  const apiKey = 'k'.repeat(40)
  const apiKeyHash = await sha256(apiKey)
  await t.run(async (ctx) => {
    const claimId = await ctx.db.insert('agentAuthClaims', {
      claimTokenHash: 'c', claimViewTokenHash: 'v', email: 'agent@lab.test', status: 'claimed', claimExpiresAt: Date.now() + 1e6,
      scopes: ['calaire.agent.admin'], createdAt: Date.now(), updatedAt: Date.now(),
    })
    await ctx.db.insert('agentApiKeys', {
      apiKeyHash, claimId, email: 'agent@lab.test', scopes: ['calaire.agent.admin'], expiresAt: Date.now() + 1e6, createdAt: Date.now(),
    })
  })

  await t.mutation(api.agent.index.addParticipante, { apiKey, rondaId, workosUserId: 'ag', email: 'ag@lab.test', participantProfile: 'member' })
  expect(await codesByUser(t, rondaId)).toEqual({ ag: 2 })
})

test('migracion backfillReplicateCodes es idempotente y no reasigna', async () => {
  const t = convexTest(schema, modules)
  const rondaId = await seedRonda(t)
  await t.run(async (ctx) => {
    const base = { rondaId, invitadoAt: 0 }
    await ctx.db.insert('rondaParticipantes', { ...base, workosUserId: 'p1', email: 'p1@x', participantProfile: 'member', invitadoAt: 1 })
    await ctx.db.insert('rondaParticipantes', { ...base, workosUserId: 'manual', email: 'm@x', participantProfile: 'member', replicateCode: 2 })
    await ctx.db.insert('rondaParticipantes', { ...base, workosUserId: 'p2', email: 'p2@x', participantProfile: 'member', invitadoAt: 2 })
    await ctx.db.insert('rondaParticipantes', { ...base, workosUserId: 'ref', email: 'r@x', participantProfile: 'member_special', invitadoAt: 3 })
  })

  const dry = await t.mutation(internal.migrations.backfillReplicateCodes, {})
  expect(dry).toMatchObject({ dryRun: true, missing: 3, updated: 0 })
  expect((await codesByUser(t, rondaId)).p1).toBeUndefined()

  const run = await t.mutation(internal.migrations.backfillReplicateCodes, { dryRun: false })
  expect(run).toMatchObject({ missing: 3, updated: 3 })
  expect(await codesByUser(t, rondaId)).toEqual({ p1: 3, manual: 2, p2: 4, ref: 1 })

  const again = await t.mutation(internal.migrations.backfillReplicateCodes, { dryRun: false })
  expect(again).toMatchObject({ missing: 0, updated: 0 })
})
