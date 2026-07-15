/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

async function seedPublishedFailure(t: ReturnType<typeof convexTest>) {
  return t.run(async ctx => {
    const now = Date.now(), rondaId = await ctx.db.insert('rondas', { codigo: 'PT-FAIL', nombre: 'PT Fail', estado: 'cerrada', createdAt: now })
    const participantId = await ctx.db.insert('rondaParticipantes', { rondaId, workosUserId: 'owner', email: 'owner@example.com', invitadoAt: now, participantProfile: 'member', participantCode: 'LAB-1', claimedAt: now })
    const itemId = await ctx.db.insert('rondaPtItems', { rondaId, contaminante: 'CO', runCode: 'R1', levelLabel: 'N1', sortOrder: 1, createdAt: now })
    const importToken = 'token'
    await ctx.db.insert('ptEvaluaciones', { rondaId, estado: 'publicada', importToken, filasEsperadas: 2, filasImportadas: 2, publicadaAt: now, publicadaBy: 'admin', updatedAt: now, updatedBy: 'admin' })
    for (const metodo of ['A', 'B']) await ctx.db.insert('ptScores', { rondaId, rondaParticipanteId: participantId, ptItemId: itemId, metodo, valorAsignado: 1, incertidumbreAsignada: null, sigmaPt: null, valorParticipante: 2, uParticipante: null, UParticipante: null, unidad: 'ppm', z: 4, zPrima: null, zeta: null, en: null, clasificacion: 'no_satisfactorio', importToken, importadoAt: now, importadoBy: 'admin' })
    return { rondaId, participantId }
  })
}

async function prepareCase(t: ReturnType<typeof convexTest>) {
  const ids = await seedPublishedFailure(t)
  await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
  const casoId = await t.run(async ctx => (await ctx.db.query('sgcCasos').first())!._id) as Id<'sgcCasos'>
  return { ...ids, casoId }
}

async function uploadVersion(
  t: ReturnType<typeof convexTest>,
  casoId: Awaited<ReturnType<typeof prepareCase>>['casoId'],
  categoria: 'analisis_causa' | 'plan_accion' | 'implementacion',
  name = `${categoria}.pdf`,
) {
  const storageId = await t.run(ctx => ctx.storage.store(new Blob(['contenido'], { type: 'application/pdf' })))
  return t.withIdentity({ subject: 'owner', email: 'owner@example.com' }).mutation(api.pt.cases.addDocumentVersion, {
    casoId, categoria, storageId, nombreArchivo: name, contentType: 'application/pdf',
  })
}

async function acceptDocumentation(t: ReturnType<typeof convexTest>, casoId: Awaited<ReturnType<typeof prepareCase>>['casoId']) {
  const owner = t.withIdentity({ subject: 'owner', email: 'owner@example.com' })
  for (const categoria of ['analisis_causa', 'plan_accion', 'implementacion'] as const) await uploadVersion(t, casoId, categoria)
  await owner.mutation(api.pt.cases.submitForReview, { casoId })
  await t.withIdentity({ subject: 'admin-user', email: 'admin@example.com', role: 'admin' }).mutation(api.pt.cases.reviewDocumentation, {
    casoId, decision: 'aceptar', observacion: 'Documentación completa y aceptada.',
  })
}

async function seedLaterResults(
  t: ReturnType<typeof convexTest>,
  options: { methods: string[]; clasificacion?: 'satisfactorio' | 'no_satisfactorio'; contaminante?: 'CO' | 'NO2'; nivel?: string },
) {
  return t.run(async ctx => {
    const createdAt = Date.now() + 10_000
    const rondaId = await ctx.db.insert('rondas', { codigo: `PT-LATER-${createdAt}`, nombre: 'PT posterior', estado: 'cerrada', createdAt })
    const participantId = await ctx.db.insert('rondaParticipantes', { rondaId, workosUserId: 'owner', email: 'owner@example.com', invitadoAt: createdAt, participantProfile: 'member', participantCode: 'LAB-NEW', claimedAt: createdAt })
    const itemId = await ctx.db.insert('rondaPtItems', { rondaId, contaminante: options.contaminante ?? 'CO', runCode: 'R2', levelLabel: options.nivel ?? 'N1', sortOrder: 1, createdAt })
    const importToken = `later-${createdAt}`
    await ctx.db.insert('ptEvaluaciones', { rondaId, estado: 'publicada', importToken, filasEsperadas: options.methods.length, filasImportadas: options.methods.length, publicadaAt: createdAt, publicadaBy: 'admin', updatedAt: createdAt, updatedBy: 'admin' })
    const scoreIds = []
    for (const metodo of options.methods) scoreIds.push(await ctx.db.insert('ptScores', { rondaId, rondaParticipanteId: participantId, ptItemId: itemId, metodo, valorAsignado: 1, incertidumbreAsignada: null, sigmaPt: null, valorParticipante: 1, uParticipante: null, UParticipante: null, unidad: 'ppm', z: 0, zPrima: null, zeta: null, en: null, clasificacion: options.clasificacion ?? 'satisfactorio', importToken, importadoAt: createdAt, importadoBy: 'admin' }))
    return { rondaId, participantId, scoreIds }
  })
}

describe('expedientes correctivos PT', () => {
  test('el job es idempotente y agrupa todos los resultados en un caso', async () => {
    const t = convexTest(schema, modules), ids = await seedPublishedFailure(t)
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    const result = await t.run(async ctx => ({
      cases: await ctx.db.query('sgcCasos').withIndex('by_rondaParticipanteId', q => q.eq('rondaParticipanteId', ids.participantId)).collect(),
      origins: await ctx.db.query('casoResultadosOrigen').collect(),
      verifications: await ctx.db.query('casoVerificaciones').collect(),
    }))
    expect(result.cases).toHaveLength(1)
    expect(result.cases[0]).toMatchObject({ tipo: 'nc_capa', automatico: true, estado: 'abierto' })
    expect(result.origins).toHaveLength(2)
    expect(result.verifications).toHaveLength(2)
    expect(result.verifications.every(item => item.resultado === 'pendiente')).toBe(true)
  })

  test('no mezcla un caso nc_capa manual con el expediente automático', async () => {
    const t = convexTest(schema, modules), ids = await seedPublishedFailure(t)
    await t.run(async ctx => {
      const now = Date.now()
      await ctx.db.insert('sgcCasos', {
        rondaId: ids.rondaId, rondaParticipanteId: ids.participantId, codigo: 'SGC-MANUAL',
        tipo: 'nc_capa', severidad: 'media', estado: 'abierto', titulo: 'NC manual',
        descripcion: 'Creada por una causa distinta a los puntajes PT.', responsable: 'admin@example.com',
        automatico: false, createdAt: now, createdBy: 'admin', updatedAt: now, updatedBy: 'admin',
      })
    })

    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })

    const result = await t.run(async ctx => ({
      cases: await ctx.db.query('sgcCasos').withIndex('by_rondaParticipanteId', q => q.eq('rondaParticipanteId', ids.participantId)).collect(),
      origins: await ctx.db.query('casoResultadosOrigen').collect(),
    }))
    expect(result.cases).toHaveLength(2)
    expect(result.cases.filter(item => item.automatico === true)).toHaveLength(1)
    expect(result.cases.filter(item => item.automatico === false)).toHaveLength(1)
    expect(result.origins).toHaveLength(2)
    expect(result.origins.every(link => link.casoId === result.cases.find(item => item.automatico === true)!._id)).toBe(true)
  })

  test('no crea expediente sin resultados no satisfactorios publicados', async () => {
    const t = convexTest(schema, modules), ids = await seedPublishedFailure(t)
    await t.run(async ctx => {
      for (const score of await ctx.db.query('ptScores').collect()) {
        await ctx.db.patch(score._id, { clasificacion: 'satisfactorio' })
      }
    })
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    const cases = await t.run(async ctx => ctx.db.query('sgcCasos').collect())
    expect(cases).toHaveLength(0)
  })

  test('el participante no puede leer casos ajenos', async () => {
    const t = convexTest(schema, modules), ids = await seedPublishedFailure(t)
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    const casoId = await t.run(async ctx => (await ctx.db.query('sgcCasos').first())!._id)
    await expect(t.withIdentity({ subject: 'intruder' }).query(api.pt.cases.getCaso, { casoId })).rejects.toThrow('No tiene acceso')
  })

  test('mantiene separados los casos voluntarios', async () => {
    const t = convexTest(schema, modules), ids = await seedPublishedFailure(t)
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    await t.withIdentity({ subject: 'owner', email: 'owner@example.com' }).mutation(api.pt.cases.createVoluntaryCase, { rondaId: ids.rondaId, tipo: 'apelacion', titulo: 'Revisión', descripcion: 'Solicito revisar el informe.' })
    const cases = await t.withIdentity({ subject: 'owner' }).query(api.pt.cases.misCasos, { rondaId: ids.rondaId })
    expect(cases.map(item => item.tipo).sort()).toEqual(['apelacion', 'nc_capa'])
  })

  test('lista solamente los casos de la ronda solicitada', async () => {
    const t = convexTest(schema, modules), ids = await seedPublishedFailure(t)
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    const other = await t.run(async ctx => {
      const now = Date.now()
      const rondaId = await ctx.db.insert('rondas', { codigo: 'PT-OTHER', nombre: 'Otra ronda', estado: 'cerrada', createdAt: now })
      const participantId = await ctx.db.insert('rondaParticipantes', { rondaId, workosUserId: 'owner', email: 'owner@example.com', invitadoAt: now, participantProfile: 'member', participantCode: 'LAB-1', claimedAt: now })
      await ctx.db.insert('sgcCasos', {
        rondaId, rondaParticipanteId: participantId, codigo: 'CASO-OTHER', tipo: 'consulta', severidad: 'baja', estado: 'abierto',
        titulo: 'Caso de otra ronda', descripcion: 'No debe aparecer.', responsable: 'owner@example.com',
        createdAt: now, createdBy: 'owner', updatedAt: now, updatedBy: 'owner',
      })
      return rondaId
    })

    const currentCases = await t.withIdentity({ subject: 'owner' }).query(api.pt.cases.misCasos, { rondaId: ids.rondaId })
    const otherCases = await t.withIdentity({ subject: 'owner' }).query(api.pt.cases.misCasos, { rondaId: other })
    expect(currentCases.map(item => item.codigo)).toEqual(['SGC-0001'])
    expect(otherCases.map(item => item.codigo)).toEqual(['CASO-OTHER'])
  })

  test('exige causa, plan e implementación y sella las versiones al enviar', async () => {
    const t = convexTest(schema, modules), { casoId } = await prepareCase(t)
    const owner = t.withIdentity({ subject: 'owner', email: 'owner@example.com' })

    await uploadVersion(t, casoId, 'analisis_causa')
    await expect(owner.mutation(api.pt.cases.submitForReview, { casoId })).rejects.toThrow('Falta plan_accion')
    await uploadVersion(t, casoId, 'plan_accion')
    await uploadVersion(t, casoId, 'implementacion')
    await owner.mutation(api.pt.cases.submitForReview, { casoId })

    const submitted = await t.run(async ctx => ({
      caso: await ctx.db.get(casoId),
      versions: await ctx.db.query('casoDocumentoVersiones').collect(),
      audits: await ctx.db.query('sgcAuditLog').collect(),
      notifications: await ctx.db.query('sgcNotificaciones').collect(),
    }))
    expect(submitted.caso?.estado).toBe('en_revision')
    expect(submitted.versions).toHaveLength(3)
    expect(submitted.versions.every(version => version.estado === 'enviada' && version.enviadaAt)).toBe(true)
    expect(submitted.audits.some(item => item.evento === 'pt.caso.enviado_revision')).toBe(true)
    expect(submitted.notifications.some(item => item.titulo === 'Documentación enviada a revisión')).toBe(true)

    const extraStorageId = await t.run(ctx => ctx.storage.store(new Blob(['cambio'], { type: 'application/pdf' })))
    await expect(owner.mutation(api.pt.cases.addDocumentVersion, {
      casoId, categoria: 'analisis_causa', storageId: extraStorageId,
      nombreArchivo: 'cambio.pdf', contentType: 'application/pdf',
    })).rejects.toThrow('no admite documentos')
    expect(await t.run(ctx => ctx.db.query('casoDocumentoVersiones').collect())).toHaveLength(3)
  })

  test('tras ajustes permite una versión nueva sin reemplazar las tres y bloquea cargas admin', async () => {
    const t = convexTest(schema, modules), { casoId } = await prepareCase(t)
    const owner = t.withIdentity({ subject: 'owner', email: 'owner@example.com' })
    const admin = t.withIdentity({ subject: 'admin-user', email: 'admin@example.com', role: 'admin' })
    for (const categoria of ['analisis_causa', 'plan_accion', 'implementacion'] as const) await uploadVersion(t, casoId, categoria)
    await owner.mutation(api.pt.cases.submitForReview, { casoId })
    await admin.mutation(api.pt.cases.reviewDocumentation, { casoId, decision: 'ajustes', observacion: 'Actualizar únicamente el plan.' })

    await expect(admin.mutation(api.pt.cases.generateUploadUrl, { casoId })).rejects.toThrow('Solo el responsable')
    await expect(owner.mutation(api.pt.cases.submitForReview, { casoId })).rejects.toThrow('al menos una versión nueva')
    await uploadVersion(t, casoId, 'plan_accion', 'plan-v2.pdf')
    await owner.mutation(api.pt.cases.submitForReview, { casoId })

    const result = await t.run(async ctx => ({
      caso: await ctx.db.get(casoId),
      documents: await ctx.db.query('casoDocumentos').collect(),
      versions: await ctx.db.query('casoDocumentoVersiones').collect(),
      messages: await ctx.db.query('sgcCasoMensajes').collect(),
      audits: await ctx.db.query('sgcAuditLog').collect(),
      notifications: await ctx.db.query('sgcNotificaciones').collect(),
    }))
    const plan = result.documents.find(document => document.categoria === 'plan_accion')!
    const planVersions = result.versions.filter(version => version.documentoId === plan._id)
    expect(result.caso?.estado).toBe('en_revision')
    expect(planVersions.map(version => ({ version: version.version, estado: version.estado }))).toEqual([
      { version: 1, estado: 'enviada' }, { version: 2, estado: 'enviada' },
    ])
    expect(result.messages.some(message => message.texto === 'Actualizar únicamente el plan.')).toBe(true)
    expect(result.audits.some(item => item.evento === 'pt.caso.documentacion.ajustes')).toBe(true)
    expect(result.notifications.some(item => item.titulo === 'Ajustes requeridos')).toBe(true)
  })

  test('propone y vincula automáticamente solo coincidencias publicadas de participante, contaminante, nivel y método', async () => {
    const t = convexTest(schema, modules), { casoId } = await prepareCase(t)
    const later = await seedLaterResults(t, { methods: ['A'] })

    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: later.rondaId, actor: 'system' })

    const checks = await t.run(async ctx => ctx.db.query('casoVerificaciones').withIndex('by_casoId', q => q.eq('casoId', casoId)).collect())
    expect(checks.filter(check => check.resultado === 'satisfactorio')).toHaveLength(1)
    expect(checks.filter(check => check.resultado === 'pendiente')).toHaveLength(1)
    expect(checks.find(check => check.resultado === 'satisfactorio')).toMatchObject({ vinculacion: 'automatica', rondaPosteriorId: later.rondaId })
    expect((await t.run(ctx => ctx.db.get(casoId)))?.estado).not.toBe('cerrado')
  })

  test('cierra únicamente al aceptar documentos y verificar satisfactoriamente cada origen', async () => {
    const t = convexTest(schema, modules), { casoId } = await prepareCase(t)
    const later = await seedLaterResults(t, { methods: ['A', 'B'] })

    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: later.rondaId, actor: 'system' })
    expect((await t.run(ctx => ctx.db.get(casoId)))?.estado).toBe('abierto')

    await acceptDocumentation(t, casoId)
    const result = await t.run(async ctx => ({
      caso: await ctx.db.get(casoId),
      checks: await ctx.db.query('casoVerificaciones').withIndex('by_casoId', q => q.eq('casoId', casoId)).collect(),
      audits: await ctx.db.query('sgcAuditLog').collect(),
    }))
    expect(result.checks.every(check => check.resultado === 'satisfactorio')).toBe(true)
    expect(result.caso).toMatchObject({ estado: 'cerrado', cerradoBy: 'admin@example.com' })
    expect(result.audits.some(item => item.evento === 'pt.caso.cerrado_eficacia')).toBe(true)
  })

  test('permite vínculo manual auditado con identificadores técnicos distintos entre rondas', async () => {
    const t = convexTest(schema, modules), { casoId } = await prepareCase(t)
    const later = await seedLaterResults(t, { methods: ['Método nuevo'], contaminante: 'NO2', nivel: 'Nivel nuevo' })
    const originId = await t.run(async ctx => (await ctx.db.query('casoResultadosOrigen').withIndex('by_casoId', q => q.eq('casoId', casoId)).first())!.ptScoreId)
    const admin = t.withIdentity({ subject: 'admin-user', email: 'admin@example.com', role: 'admin' })

    const candidates = await admin.query(api.pt.cases.verificationCandidates, { casoId, ptScoreOrigenId: originId })
    expect(candidates.map(candidate => candidate.scoreId)).toContain(later.scoreIds[0])
    await admin.mutation(api.pt.cases.linkVerificationManually, { casoId, ptScoreOrigenId: originId, ptScorePosteriorId: later.scoreIds[0], motivo: 'El método fue renombrado y el nivel fue reestructurado.' })

    const result = await t.run(async ctx => ({
      check: await ctx.db.query('casoVerificaciones').withIndex('by_ptScoreOrigenId', q => q.eq('ptScoreOrigenId', originId)).unique(),
      audits: await ctx.db.query('sgcAuditLog').collect(),
    }))
    expect(result.check).toMatchObject({ resultado: 'satisfactorio', vinculacion: 'manual', ptScorePosteriorId: later.scoreIds[0] })
    expect(result.audits.some(item => item.evento === 'pt.caso.verificacion.manual' && item.detalle?.includes('renombrado'))).toBe(true)
  })

  test('un resultado posterior no satisfactorio reabre la iteración documental y mantiene el caso abierto', async () => {
    const t = convexTest(schema, modules), { casoId } = await prepareCase(t)
    await acceptDocumentation(t, casoId)
    const later = await seedLaterResults(t, { methods: ['A'], clasificacion: 'no_satisfactorio' })

    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: later.rondaId, actor: 'system' })

    const result = await t.run(async ctx => ({ caso: await ctx.db.get(casoId), audits: await ctx.db.query('sgcAuditLog').collect(), notifications: await ctx.db.query('sgcNotificaciones').collect() }))
    expect(result.caso).toMatchObject({ estado: 'esperando_participante', documentacionAceptadaAt: null })
    expect(result.audits.some(item => item.evento === 'pt.caso.verificacion.no_satisfactoria')).toBe(true)
    expect(result.notifications.some(item => item.titulo === 'Nueva iteración de mejora requerida')).toBe(true)
  })

  test('mensajes: participante limitado por estado y respuesta voluntaria vuelve a revisión', async () => {
    const t = convexTest(schema, modules), ids = await seedPublishedFailure(t)
    const owner = t.withIdentity({ subject: 'owner', email: 'owner@example.com' })
    const admin = t.withIdentity({ subject: 'admin-user', email: 'admin@example.com', role: 'admin' })

    // Caso voluntario abierto: el participante puede escribir sin cambiar el estado.
    const voluntaryId = await owner.mutation(api.pt.cases.createVoluntaryCase, { rondaId: ids.rondaId, tipo: 'queja', titulo: 'Queja', descripcion: 'Detalle de la queja.' })
    await owner.mutation(api.pt.cases.addMessage, { casoId: voluntaryId, texto: 'Amplío la queja.' })
    expect((await t.run(ctx => ctx.db.get(voluntaryId)))?.estado).toBe('abierto')

    // esperando_participante: la respuesta del participante devuelve el caso voluntario a revisión.
    await t.run(async ctx => { await ctx.db.patch(voluntaryId, { estado: 'esperando_participante' }) })
    await owner.mutation(api.pt.cases.addMessage, { casoId: voluntaryId, texto: 'Respondo la solicitud.' })
    expect((await t.run(ctx => ctx.db.get(voluntaryId)))?.estado).toBe('en_revision')

    // en_revision: el participante no puede escribir; el admin sí y no altera el estado.
    await expect(owner.mutation(api.pt.cases.addMessage, { casoId: voluntaryId, texto: 'Otro mensaje.' })).rejects.toThrow('Solo puede responder')
    await admin.mutation(api.pt.cases.addMessage, { casoId: voluntaryId, texto: 'En revisión.' })
    expect((await t.run(ctx => ctx.db.get(voluntaryId)))?.estado).toBe('en_revision')

    // Caso automático en esperando_participante: el mensaje no cambia el estado (submitForReview lo hace).
    await t.mutation(internal.pt.cases.prepareAutomaticCases, { rondaId: ids.rondaId, actor: 'admin' })
    const automaticId = await t.run(async ctx => (await ctx.db.query('sgcCasos').collect()).find(caso => caso.automatico)!._id)
    await t.run(async ctx => { await ctx.db.patch(automaticId, { estado: 'esperando_participante' }) })
    await owner.mutation(api.pt.cases.addMessage, { casoId: automaticId, texto: 'Ajustaré la documentación.' })
    expect((await t.run(ctx => ctx.db.get(automaticId)))?.estado).toBe('esperando_participante')

    // Cerrado: nadie escribe.
    await t.run(async ctx => { await ctx.db.patch(voluntaryId, { estado: 'cerrado' }) })
    await expect(admin.mutation(api.pt.cases.addMessage, { casoId: voluntaryId, texto: 'Tarde.' })).rejects.toThrow('cerrado')
  })
})
