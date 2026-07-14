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

// Rol staff: gestiona SGC y rondas, pero no publica.
test('staff lee las superficies de rondas como viewer', async () => {
  const t = convexTest(schema, modules)

  const asStaff = t.withIdentity({ subject: 'staff-1', role: 'staff' })

  await expect(asStaff.query(api.rondas.index.listRondas, {})).resolves.toBeInstanceOf(Array)
  await expect(asStaff.query(api.rondas.index.listAllParticipantes, {})).resolves.toBeInstanceOf(Array)
  await expect(
    asStaff.query(api.rondas.index.listRondasParticipante, { userId: 'otro-user' })
  ).resolves.toBeInstanceOf(Array)
})

test('staff edita rondas y gestiona SGC, pero no puede publicar', async () => {
  const t = convexTest(schema, modules)

  const rondaId = await t.run(async (ctx) =>
    ctx.db.insert('rondas', {
      codigo: 'R-STAFF',
      nombre: 'Ronda staff',
      estado: 'borrador',
      createdAt: Date.now(),
    })
  )

  const asStaff = t.withIdentity({ subject: 'staff-2', role: 'staff' })

  await expect(
    asStaff.mutation(api.rondas.index.updateRondaBasicInfo, {
      id: rondaId,
      codigo: 'R-STAFF-EDITADA',
      nombre: 'Ronda editada por staff',
    })
  ).resolves.toBeNull()

  // Gestion SGC: staff crea un hito.
  await expect(
    asStaff.mutation(api.sgc.index.createHitoRonda, {
      rondaId,
      codigo: 'H1',
      nombre: 'Hito 1',
      fase: 'planificacion',
      fechaObjetivo: null,
      fechaReal: null,
      estado: 'pendiente',
      responsable: 'staff',
      visibleParticipante: false,
      bloqueaCierre: false,
      formatoRelacionado: null,
      notas: null,
    })
  ).resolves.toBeDefined()

  // Publicar sigue siendo admin-only: staff es rechazado.
  await expect(
    asStaff.mutation(api.sgc.index.createPublicacion, {
      rondaId,
      titulo: 'No permitido',
      contenido: 'x',
      tipo: 'comunicado',
      visibleDesde: Date.now(),
      visibleHasta: null,
    })
  ).rejects.toThrow(/Permisos insuficientes/)
})

test('un participante (sin rol) no puede gestionar SGC', async () => {
  const t = convexTest(schema, modules)

  const rondaId = await t.run(async (ctx) =>
    ctx.db.insert('rondas', {
      codigo: 'R-SIN-ROL',
      nombre: 'Ronda para participante sin rol',
      estado: 'borrador',
      createdAt: Date.now(),
    })
  )

  const asMember = t.withIdentity({ subject: 'user-plain' })

  await expect(
    asMember.mutation(api.sgc.index.createHitoRonda, {
      rondaId,
      codigo: 'H1',
      nombre: 'Hito 1',
      fase: 'planificacion',
      fechaObjetivo: null,
      fechaReal: null,
      estado: 'pendiente',
      responsable: 'x',
      visibleParticipante: false,
      bloqueaCierre: false,
      formatoRelacionado: null,
      notas: null,
    })
  ).rejects.toThrow(/Permisos insuficientes/)
})

test('pt upsert valida referencias de la misma ronda y estado activo', async () => {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const rondaA = await ctx.db.insert('rondas', { codigo: 'PT-SEC-A', nombre: 'PT A', estado: 'activa', createdAt: Date.now() })
    const rondaB = await ctx.db.insert('rondas', { codigo: 'PT-SEC-B', nombre: 'PT B', estado: 'activa', createdAt: Date.now() })
    const participanteA = await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaA, workosUserId: 'pt-sec', email: 'pt-sec@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const itemA = await ctx.db.insert('rondaPtItems', { rondaId: rondaA, contaminante: 'CO', runCode: 'R1', levelLabel: 'L1', sortOrder: 1, createdAt: Date.now() })
    const itemB = await ctx.db.insert('rondaPtItems', { rondaId: rondaB, contaminante: 'CO', runCode: 'R1', levelLabel: 'L1', sortOrder: 1, createdAt: Date.now() })
    const groupA = await ctx.db.insert('rondaPtSampleGroups', { rondaId: rondaA, sampleGroup: 'G1', sortOrder: 1, createdAt: Date.now() })
    const groupB = await ctx.db.insert('rondaPtSampleGroups', { rondaId: rondaB, sampleGroup: 'G1', sortOrder: 1, createdAt: Date.now() })
    return { rondaA, participanteA, itemA, itemB, groupA, groupB }
  })
  const asParticipant = t.withIdentity({ subject: 'pt-sec' })
  const base = { rondaId: ids.rondaA, rondaParticipanteId: ids.participanteA, d1: 1, d2: 1, meanValue: 1, sdValue: 0 }

  await expect(asParticipant.mutation(api.pt.index.upsertEnvioPT, { ...base, ptItemId: ids.itemB, sampleGroupId: ids.groupA })).rejects.toThrow(/no pertenecen a la ronda/)
  await expect(asParticipant.mutation(api.pt.index.upsertEnvioPT, { ...base, ptItemId: ids.itemA, sampleGroupId: ids.groupB })).rejects.toThrow(/no pertenecen a la ronda/)
  await expect(asParticipant.mutation(api.pt.index.upsertEnvioPT, { ...base, ptItemId: ids.itemA, sampleGroupId: ids.groupA })).resolves.toBeDefined()
})

test('pt bloquea upsert y submit final cuando la ronda no esta activa', async () => {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const rondaId = await ctx.db.insert('rondas', { codigo: 'PT-DOC', nombre: 'PT doc', estado: 'documentacion_pendiente', createdAt: Date.now() })
    const participanteId = await ctx.db.insert('rondaParticipantes', {
      rondaId, workosUserId: 'pt-doc', email: 'pt-doc@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const ptItemId = await ctx.db.insert('rondaPtItems', { rondaId, contaminante: 'CO', runCode: 'R1', levelLabel: 'L1', sortOrder: 1, createdAt: Date.now() })
    const sampleGroupId = await ctx.db.insert('rondaPtSampleGroups', { rondaId, sampleGroup: 'G1', sortOrder: 1, createdAt: Date.now() })
    return { rondaId, participanteId, ptItemId, sampleGroupId }
  })
  const asParticipant = t.withIdentity({ subject: 'pt-doc' })

  await expect(asParticipant.mutation(api.pt.index.upsertEnvioPT, {
    rondaId: ids.rondaId, rondaParticipanteId: ids.participanteId, ptItemId: ids.ptItemId, sampleGroupId: ids.sampleGroupId,
    d1: 1, d2: 1, meanValue: 1, sdValue: 0,
  })).rejects.toThrow(/no está activa/)
  await expect(asParticipant.mutation(api.pt.index.submitFinalPT, { rondaId: ids.rondaId })).rejects.toThrow(/no está activa/)
})

test('pt bloquea edicion despues del envio final', async () => {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const rondaId = await ctx.db.insert('rondas', { codigo: 'PT-FINAL', nombre: 'PT final', estado: 'activa', createdAt: Date.now() })
    const participanteId = await ctx.db.insert('rondaParticipantes', {
      rondaId, workosUserId: 'pt-final', email: 'pt-final@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const ptItemId = await ctx.db.insert('rondaPtItems', { rondaId, contaminante: 'CO', runCode: 'R1', levelLabel: 'L1', sortOrder: 1, createdAt: Date.now() })
    const sampleGroupId = await ctx.db.insert('rondaPtSampleGroups', { rondaId, sampleGroup: 'G1', sortOrder: 1, createdAt: Date.now() })
    return { rondaId, participanteId, ptItemId, sampleGroupId }
  })
  const asParticipant = t.withIdentity({ subject: 'pt-final' })
  const args = { rondaId: ids.rondaId, rondaParticipanteId: ids.participanteId, ptItemId: ids.ptItemId, sampleGroupId: ids.sampleGroupId, d1: 1, d2: 1, meanValue: 1, sdValue: 0 }

  await asParticipant.mutation(api.pt.index.upsertEnvioPT, args)
  await asParticipant.mutation(api.pt.index.submitFinalPT, { rondaId: ids.rondaId })
  await expect(asParticipant.mutation(api.pt.index.upsertEnvioPT, { ...args, meanValue: 2 })).rejects.toThrow(/envio final ya fue enviado/)
})

test('fichas no se crean ni editan fuera de una ronda activa', async () => {
  const t = convexTest(schema, modules)
  const participanteId = await t.run(async (ctx) => {
    const rondaId = await ctx.db.insert('rondas', { codigo: 'F-DOC', nombre: 'Ficha doc', estado: 'documentacion_pendiente', createdAt: Date.now() })
    return ctx.db.insert('rondaParticipantes', {
      rondaId, workosUserId: 'f-doc', email: 'f-doc@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
  })
  const asParticipant = t.withIdentity({ subject: 'f-doc' })

  await expect(asParticipant.mutation(api.fichas.index.getOrCreateFicha, { rondaParticipanteId: participanteId })).rejects.toThrow(/no está activa/)
})

test('pt rechaza participante de otra ronda y estados borrador o cerrada', async () => {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const rondaActiva = await ctx.db.insert('rondas', { codigo: 'PT-XP-A', nombre: 'PT activa', estado: 'activa', createdAt: Date.now() })
    const rondaOtra = await ctx.db.insert('rondas', { codigo: 'PT-XP-B', nombre: 'PT otra', estado: 'activa', createdAt: Date.now() })
    const rondaBorrador = await ctx.db.insert('rondas', { codigo: 'PT-BORR', nombre: 'PT borrador', estado: 'borrador', createdAt: Date.now() })
    const rondaCerrada = await ctx.db.insert('rondas', { codigo: 'PT-CERR', nombre: 'PT cerrada', estado: 'cerrada', createdAt: Date.now() })
    const participanteActiva = await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaActiva, workosUserId: 'pt-xp', email: 'pt-xp@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const participanteOtra = await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaOtra, workosUserId: 'pt-otra', email: 'pt-otra@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const itemActiva = await ctx.db.insert('rondaPtItems', { rondaId: rondaActiva, contaminante: 'CO', runCode: 'R1', levelLabel: 'L1', sortOrder: 1, createdAt: Date.now() })
    const groupActiva = await ctx.db.insert('rondaPtSampleGroups', { rondaId: rondaActiva, sampleGroup: 'G1', sortOrder: 1, createdAt: Date.now() })
    const participanteBorrador = await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaBorrador, workosUserId: 'pt-borr', email: 'pt-borr@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const itemBorrador = await ctx.db.insert('rondaPtItems', { rondaId: rondaBorrador, contaminante: 'CO', runCode: 'R1', levelLabel: 'L1', sortOrder: 1, createdAt: Date.now() })
    const groupBorrador = await ctx.db.insert('rondaPtSampleGroups', { rondaId: rondaBorrador, sampleGroup: 'G1', sortOrder: 1, createdAt: Date.now() })
    const participanteCerrada = await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaCerrada, workosUserId: 'pt-cerr', email: 'pt-cerr@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const itemCerrada = await ctx.db.insert('rondaPtItems', { rondaId: rondaCerrada, contaminante: 'CO', runCode: 'R1', levelLabel: 'L1', sortOrder: 1, createdAt: Date.now() })
    const groupCerrada = await ctx.db.insert('rondaPtSampleGroups', { rondaId: rondaCerrada, sampleGroup: 'G1', sortOrder: 1, createdAt: Date.now() })
    return { rondaActiva, participanteActiva, participanteOtra, itemActiva, groupActiva, rondaBorrador, participanteBorrador, itemBorrador, groupBorrador, rondaCerrada, participanteCerrada, itemCerrada, groupCerrada }
  })
  const asParticipant = t.withIdentity({ subject: 'pt-xp' })
  await expect(asParticipant.mutation(api.pt.index.upsertEnvioPT, {
    rondaId: ids.rondaActiva,
    rondaParticipanteId: ids.participanteOtra,
    ptItemId: ids.itemActiva,
    sampleGroupId: ids.groupActiva,
    d1: 1,
    d2: 1,
    meanValue: 1,
    sdValue: 0,
  })).rejects.toThrow(/No tiene acceso a este participante|no pertenecen a la ronda/)

  for (const [rondaId, participanteId, ptItemId, sampleGroupId] of [
    [ids.rondaBorrador, ids.participanteBorrador, ids.itemBorrador, ids.groupBorrador],
    [ids.rondaCerrada, ids.participanteCerrada, ids.itemCerrada, ids.groupCerrada],
  ] as const) {
    const subject = rondaId === ids.rondaBorrador ? 'pt-borr' : 'pt-cerr'
    await expect(t.withIdentity({ subject }).mutation(api.pt.index.upsertEnvioPT, {
      rondaId,
      rondaParticipanteId: participanteId,
      ptItemId,
      sampleGroupId,
      d1: 1,
      d2: 1,
      meanValue: 1,
      sdValue: 0,
    })).rejects.toThrow(/no está activa/)
    await expect(t.withIdentity({ subject }).mutation(api.pt.index.submitFinalPT, { rondaId })).rejects.toThrow(/no está activa/)
  }
})

test('fichas rechaza creacion en borrador y cerrada', async () => {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const rondaBorrador = await ctx.db.insert('rondas', { codigo: 'F-BORR', nombre: 'Ficha borrador', estado: 'borrador', createdAt: Date.now() })
    const rondaCerrada = await ctx.db.insert('rondas', { codigo: 'F-CERR', nombre: 'Ficha cerrada', estado: 'cerrada', createdAt: Date.now() })
    const participanteBorrador = await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaBorrador, workosUserId: 'f-borr', email: 'f-borr@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    const participanteCerrada = await ctx.db.insert('rondaParticipantes', {
      rondaId: rondaCerrada, workosUserId: 'f-cerr', email: 'f-cerr@lab.test', invitadoAt: Date.now(), participantProfile: 'member'
    })
    return { participanteBorrador, participanteCerrada }
  })

  await expect(t.withIdentity({ subject: 'f-borr' }).mutation(api.fichas.index.getOrCreateFicha, {
    rondaParticipanteId: ids.participanteBorrador,
  })).rejects.toThrow(/no está activa/)
  await expect(t.withIdentity({ subject: 'f-cerr' }).mutation(api.fichas.index.getOrCreateFicha, {
    rondaParticipanteId: ids.participanteCerrada,
  })).rejects.toThrow(/no está activa/)
})
