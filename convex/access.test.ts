// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')
delete modules['./access.test.ts']

test('rondas rechaza una consulta protegida sin identidad', async () => {
  const t = convexTest(schema, modules)

  await expect(t.query(api.rondas.index.listRondasParticipante, {})).rejects.toThrow(/Autenticacion requerida/)
})

test('fichas rechaza una mutacion protegida sin identidad', async () => {
  const t = convexTest(schema, modules)

  await expect(t.mutation(api.fichas.index.generateFichaUploadUrl)).rejects.toThrow(/Autenticacion requerida/)
})

test('pt rechaza una consulta protegida sin identidad incluso con una ronda valida', async () => {
  const t = convexTest(schema, modules)
  const rondaId = await t.run(async (ctx) =>
    ctx.db.insert('rondas', {
      codigo: 'R-ACCESO',
      nombre: 'Ronda de acceso',
      estado: 'borrador',
      createdAt: Date.now(),
    })
  )

  await expect(t.query(api.pt.index.listPTItems, { rondaId })).rejects.toThrow(/Autenticacion requerida/)
})

// F23: cierra la brecha que dejo pasar F19 — no basta con probar el rechazo sin
// identidad; hay que ejercer el camino autenticado (exito propio) y el rechazo
// cross-tenant (participante de una ronda no puede leer otra).
test('participante autenticado lee su ronda pero es rechazado en otra ronda', async () => {
  const t = convexTest(schema, modules)

  const { rondaA, rondaB } = await t.run(async (ctx) => {
    const rondaA = await ctx.db.insert('rondas', {
      codigo: 'R-A',
      nombre: 'Ronda A',
      estado: 'borrador',
      createdAt: Date.now(),
    })
    const rondaB = await ctx.db.insert('rondas', {
      codigo: 'R-B',
      nombre: 'Ronda B',
      estado: 'borrador',
      createdAt: Date.now(),
    })
    await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaA,
      workosUserId: 'user-a',
      email: 'a@lab.test',
      invitadoAt: Date.now(),
      participantProfile: 'member',
    })
    return { rondaA, rondaB }
  })

  const asUserA = t.withIdentity({ subject: 'user-a' })

  // Exito propio: es participante de la ronda A.
  await expect(
    asUserA.query(api.rondas.index.listParticipantesRondaResumen, { rondaId: rondaA })
  ).resolves.toBeInstanceOf(Array)

  // Rechazo cross-tenant: no es participante de la ronda B.
  await expect(
    asUserA.query(api.rondas.index.listParticipantesRondaResumen, { rondaId: rondaB })
  ).rejects.toThrow(/No tiene acceso a esta ronda/)
})

test('admin autenticado lee cualquier ronda sin ser participante', async () => {
  const t = convexTest(schema, modules)

  const rondaId = await t.run(async (ctx) =>
    ctx.db.insert('rondas', {
      codigo: 'R-ADM',
      nombre: 'Ronda admin',
      estado: 'borrador',
      createdAt: Date.now(),
    })
  )

  const asAdmin = t.withIdentity({ subject: 'admin-1', role: 'admin' })

  await expect(
    asAdmin.query(api.rondas.index.listParticipantesRondaResumen, { rondaId })
  ).resolves.toBeInstanceOf(Array)
})

// F20: las lecturas sensibles ya no son solo-autenticacion. Las superficies admin
// (listado global de participantes/rondas, resultados agregados) exigen rol admin;
// un participante no puede ver datos de otros laboratorios.
test('las superficies admin rechazan a un usuario autenticado no admin', async () => {
  const t = convexTest(schema, modules)

  const asMember = t.withIdentity({ subject: 'user-member' })

  await expect(
    asMember.query(api.rondas.index.listAllParticipantes, {})
  ).rejects.toThrow(/Permisos insuficientes/)
  await expect(
    asMember.query(api.rondas.index.listRondas, {})
  ).rejects.toThrow(/Permisos insuficientes/)
})

test('un admin puede leer las superficies admin', async () => {
  const t = convexTest(schema, modules)

  const asAdmin = t.withIdentity({ subject: 'admin-2', role: 'admin' })

  await expect(asAdmin.query(api.rondas.index.listAllParticipantes, {})).resolves.toBeInstanceOf(Array)
  await expect(asAdmin.query(api.rondas.index.listRondas, {})).resolves.toBeInstanceOf(Array)
})

// F20: listPTItems (config PT que el participante necesita para su propio envio)
// pasa de requireIdentity a exigir membresia de la ronda: cualquier autenticado ya
// no puede leer la config de una ronda ajena.
test('listPTItems exige ser participante de la ronda, no solo estar autenticado', async () => {
  const t = convexTest(schema, modules)

  const { rondaA, rondaB } = await t.run(async (ctx) => {
    const rondaA = await ctx.db.insert('rondas', {
      codigo: 'PT-A',
      nombre: 'PT ronda A',
      estado: 'borrador',
      createdAt: Date.now(),
    })
    const rondaB = await ctx.db.insert('rondas', {
      codigo: 'PT-B',
      nombre: 'PT ronda B',
      estado: 'borrador',
      createdAt: Date.now(),
    })
    await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaA,
      workosUserId: 'user-pt',
      email: 'pt@lab.test',
      invitadoAt: Date.now(),
      participantProfile: 'member',
    })
    return { rondaA, rondaB }
  })

  const asUser = t.withIdentity({ subject: 'user-pt' })

  await expect(asUser.query(api.pt.index.listPTItems, { rondaId: rondaA })).resolves.toBeInstanceOf(Array)
  await expect(asUser.query(api.pt.index.listPTItems, { rondaId: rondaB })).rejects.toThrow(/No tiene acceso a esta ronda/)
})

// F22 (bug funcional): listRondasParticipante acepta un userId opcional; solo un
// admin puede consultar las rondas de otro usuario (self para el resto).
test('listRondasParticipante: solo un admin puede consultar las rondas de otro userId', async () => {
  const t = convexTest(schema, modules)

  const asMember = t.withIdentity({ subject: 'user-self' })
  // Un no-admin no puede pedir las rondas de otro userId.
  await expect(
    asMember.query(api.rondas.index.listRondasParticipante, { userId: 'otro-user' })
  ).rejects.toThrow(/No tiene acceso a estas rondas/)
  // Pero si puede pedir las suyas (self), con o sin userId.
  await expect(
    asMember.query(api.rondas.index.listRondasParticipante, { userId: 'user-self' })
  ).resolves.toBeInstanceOf(Array)

  const asAdmin = t.withIdentity({ subject: 'admin-3', role: 'admin' })
  await expect(
    asAdmin.query(api.rondas.index.listRondasParticipante, { userId: 'otro-user' })
  ).resolves.toBeInstanceOf(Array)
})
