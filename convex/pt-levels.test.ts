// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')
delete modules['./pt-levels.test.ts']

const admin = { subject: 'admin-user', email: 'admin@example.com', role: 'admin' }

async function setup() {
  const t = convexTest(schema, modules)
  const rondaId = await t.run(async (ctx) => {
    const id = await ctx.db.insert('rondas', { codigo: 'EA-CIL-2026', nombre: 'CIL', estado: 'borrador', createdAt: Date.now() })
    await ctx.db.insert('rondaContaminantes', { rondaId: id, contaminante: 'O3', niveles: 2, replicas: 2 })
    return id
  })
  return { t, staff: t.withIdentity(admin), rondaId }
}

const nivel = (n: number) => ({ runCode: String(n), levelLabel: String(n), sortOrder: n })

test('no permite cargar mas niveles PT que los definidos para el gas', async () => {
  const { staff, rondaId } = await setup()

  await expect(
    staff.mutation(api.pt.index.createPTItemsBulk, { rondaId, contaminante: 'O3', items: [nivel(1), nivel(2), nivel(3)] })
  ).rejects.toThrow(/O3 tiene 2 nivel/)

  await staff.mutation(api.pt.index.createPTItemsBulk, { rondaId, contaminante: 'O3', items: [nivel(1), nivel(2)] })
  await expect(
    staff.mutation(api.pt.index.createPTItem, { rondaId, contaminante: 'O3', ...nivel(3) })
  ).rejects.toThrow(/ya hay 2 nivel/)
})

test('no permite cargar niveles PT de un gas que no esta en la ronda', async () => {
  const { staff, rondaId } = await setup()

  await expect(
    staff.mutation(api.pt.index.createPTItem, { rondaId, contaminante: 'CO', ...nivel(1) })
  ).rejects.toThrow(/CO no esta incluido/)
})

test('no permite activar la ronda hasta que los niveles PT coincidan', async () => {
  const { staff, rondaId } = await setup()

  await staff.mutation(api.pt.index.createPTItem, { rondaId, contaminante: 'O3', ...nivel(1) })
  await expect(
    staff.mutation(api.rondas.index.transitionRondaEstado, { id: rondaId, nextState: 'activa' })
  ).rejects.toThrow(/O3: 1 nivel\(es\) PT de 2/)

  await staff.mutation(api.pt.index.createPTItem, { rondaId, contaminante: 'O3', ...nivel(2) })
  await staff.mutation(api.rondas.index.transitionRondaEstado, { id: rondaId, nextState: 'activa' })
})
