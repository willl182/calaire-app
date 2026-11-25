// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { nextReplicateCode, planReplicateCodes } from './rondas/codes'

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

type FilaPlan = Parameters<typeof planReplicateCodes>[0][number]

function fila(id: string, perfil: 'member' | 'member_special', replicateCode: number | null | undefined, alta: number): FilaPlan {
  return { _id: id, participantProfile: perfil, replicateCode, invitadoAt: alta, _creationTime: alta }
}

function aplicar(rows: FilaPlan[]) {
  const cambios = planReplicateCodes(rows)
  const porId = new Map(cambios.map((c) => [c.participanteId, c.replicateCode]))
  return Object.fromEntries(rows.map((r) => [r._id, porId.get(r._id) ?? r.replicateCode ?? null]))
}

test('planReplicateCodes: la referencia recibe 1 aunque un participante lo tenga a mano (caso EA-PP-R3)', () => {
  const rows = [
    fila('depulgar', 'member', 1, 1),
    fila('ref', 'member_special', null, 2),
    fila('p02', 'member', null, 3),
    fila('p03', 'member', null, 4),
  ]
  expect(planReplicateCodes(rows)).toEqual([
    { participanteId: 'ref', anterior: null, replicateCode: 1 },
    { participanteId: 'depulgar', anterior: 1, replicateCode: 2 },
    { participanteId: 'p02', anterior: null, replicateCode: 3 },
    { participanteId: 'p03', anterior: null, replicateCode: 4 },
  ])
})

test('planReplicateCodes: referencia y participante con 1 (datos heredados) renumera solo al participante', () => {
  const rows = [fila('ref', 'member_special', 1, 1), fila('lab', 'member', 1, 2)]
  expect(planReplicateCodes(rows)).toEqual([{ participanteId: 'lab', anterior: 1, replicateCode: 2 }])
})

test('planReplicateCodes: conserva codigos validos, mueve la referencia a 1 y resuelve repetidos por orden de alta', () => {
  const rows = [
    fila('a', 'member', 3, 1),
    fila('ref', 'member_special', 5, 2),
    fila('b', 'member', 3, 3),
    fila('c', 'member', 0, 4),
    fila('d', 'member', 2, 5),
  ]
  expect(aplicar(rows)).toEqual({ a: 3, ref: 1, b: 4, c: 5, d: 2 })
})

test('planReplicateCodes: sin referencia el 1 queda reservado', () => {
  expect(aplicar([fila('x', 'member', 1, 1), fila('y', 'member', null, 2)])).toEqual({ x: 2, y: 3 })
})

test('planReplicateCodes: varias referencias, la principal es la que ya tiene 1', () => {
  const rows = [fila('r1', 'member_special', null, 1), fila('r2', 'member_special', 1, 2), fila('m', 'member', 2, 3)]
  expect(aplicar(rows)).toEqual({ r1: 3, r2: 1, m: 2 })
})

test('planReplicateCodes: es idempotente', () => {
  const rows = [fila('depulgar', 'member', 1, 1), fila('ref', 'member_special', null, 2), fila('p', 'member', 1, 3)]
  const aplicado = aplicar(rows)
  const segunda = rows.map((r) => ({ ...r, replicateCode: aplicado[r._id] }))
  expect(planReplicateCodes(segunda)).toEqual([])
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
