// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')
delete modules['./participantes-global.test.ts']

test('un mismo correo con un cupo reclamado y otro pendiente se agrupa en una sola entrada', async () => {
  const t = convexTest(schema, modules)

  await t.run(async (ctx) => {
    const r1 = await ctx.db.insert('rondas', { codigo: 'R1', nombre: 'Ronda 1', estado: 'activa', createdAt: Date.now() })
    const r2 = await ctx.db.insert('rondas', { codigo: 'R2', nombre: 'Ronda 2', estado: 'activa', createdAt: Date.now() })
    await ctx.db.insert('rondaParticipantes', {
      rondaId: r1,
      workosUserId: 'user-lab',
      email: 'lab@ejemplo.test',
      invitadoAt: Date.now(),
      participantProfile: 'member',
    })
    await ctx.db.insert('rondaParticipantes', {
      rondaId: r2,
      workosUserId: 'pendiente:abc',
      email: 'Lab@Ejemplo.test',
      invitadoAt: Date.now(),
      participantProfile: 'member',
    })
    // Dos cupos pendientes con correo de marcador siguen separados.
    for (const token of ['x1', 'x2']) {
      await ctx.db.insert('rondaParticipantes', {
        rondaId: r2,
        workosUserId: `pendiente:${token}`,
        email: 'Participante (pendiente)',
        invitadoAt: Date.now(),
        participantProfile: 'member',
      })
    }
  })

  const asAdmin = t.withIdentity({ subject: 'admin-1', role: 'admin' })
  const rows = await asAdmin.query(api.rondas.index.listAllParticipantes, {})

  const lab = rows.filter((r) => r.email.toLowerCase() === 'lab@ejemplo.test')
  expect(lab).toHaveLength(1)
  expect(lab[0].workos_user_id).toBe('user-lab')
  expect(lab[0].rondas.map((r) => r.estado_enlace).sort()).toEqual(['pendiente', 'reclamado'])
  expect(rows.filter((r) => r.email === 'Participante (pendiente)')).toHaveLength(2)
})
