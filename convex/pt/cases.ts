import { ConvexError, v } from 'convex/values'
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'
import { requireAdminIdentity, requireIdentity, requireParticipantForRonda } from '../access'
import { buildCodigoCaso, identityRoles, isManagerRole, writeAudit } from '../sgc/shared'

const category = v.union(v.literal('analisis_causa'), v.literal('plan_accion'), v.literal('implementacion'), v.literal('verificacion_eficacia'))
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])
const REQUIRED_CATEGORIES = ['analisis_causa', 'plan_accion', 'implementacion'] as const
const EDITABLE_CASE_STATES = new Set<Doc<'sgcCasos'>['estado']>(['abierto', 'esperando_participante'])

function actor(identity: { email?: string; name?: string; tokenIdentifier: string }) {
  return identity.email ?? identity.name ?? identity.tokenIdentifier
}

async function caseAccess(ctx: QueryCtx | MutationCtx, casoId: Id<'sgcCasos'>) {
  const identity = await requireIdentity(ctx)
  const caso = await ctx.db.get(casoId)
  if (!caso) throw new ConvexError('Caso no encontrado.')
  const admin = isManagerRole(identityRoles(identity))
  if (!admin) {
    if (!caso.rondaParticipanteId) throw new ConvexError('No tiene acceso a este caso.')
    const participant = await ctx.db.get(caso.rondaParticipanteId)
    if (!participant || participant.workosUserId !== identity.subject) throw new ConvexError('No tiene acceso a este caso.')
  }
  return { identity, caso, admin }
}

async function notifyParticipant(ctx: MutationCtx, caso: Doc<'sgcCasos'>, title: string, message: string, by: string) {
  if (!caso.rondaParticipanteId) return
  const participant = await ctx.db.get(caso.rondaParticipanteId)
  if (!participant) return
  await ctx.db.insert('sgcNotificaciones', {
    rondaId: caso.rondaId, rondaParticipanteId: participant._id, destinatarioEmail: participant.email,
    titulo: title, mensaje: message, tipo: 'sgc', estado: 'publicada', leidaAt: null,
    createdAt: Date.now(), createdBy: by, updatedAt: Date.now(), updatedBy: by,
  })
}

async function getPublishedEvaluation(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', q => q.eq('rondaId', rondaId)).unique()
  return evaluation?.estado === 'publicada' ? evaluation : null
}

function isSameParticipant(
  first: Doc<'rondaParticipantes'>,
  second: Doc<'rondaParticipantes'>,
) {
  return first.workosUserId === second.workosUserId
    || (first.directorioParticipanteId != null
      && first.directorioParticipanteId === second.directorioParticipanteId)
}

async function reopenAfterFailedVerification(ctx: MutationCtx, caso: Doc<'sgcCasos'>, by: string) {
  const current = await ctx.db.get(caso._id)
  if (!current?.documentacionAceptadaAt) return
  const now = Date.now()
  await ctx.db.patch(caso._id, {
    estado: 'esperando_participante',
    documentacionAceptadaAt: null,
    documentacionAceptadaBy: null,
    updatedAt: now,
    updatedBy: by,
  })
  await writeAudit(ctx, {
    rondaId: current.rondaId,
    actor: by,
    evento: 'pt.caso.verificacion.no_satisfactoria',
    detalle: 'El resultado posterior no fue satisfactorio; se requiere una nueva iteración documental.',
    targetTipo: 'sgcCasos',
    targetId: caso._id,
  })
  await notifyParticipant(
    ctx,
    current,
    'Nueva iteración de mejora requerida',
    'El resultado posterior no fue satisfactorio. Actualice la documentación del expediente y envíela nuevamente a revisión.',
    by,
  )
}

export const prepareAutomaticCases = internalMutation({
  args: { rondaId: v.id('rondas'), actor: v.string() },
  handler: async (ctx, args) => {
    const evaluation = await getPublishedEvaluation(ctx, args.rondaId)
    if (!evaluation?.importToken) return
    const participants = await ctx.db.query('rondaParticipantes').withIndex('by_ronda', q => q.eq('rondaId', args.rondaId)).take(5000)
    for (const participant of participants) {
      const scores = await ctx.db.query('ptScores').withIndex('by_rondaParticipanteId', q => q.eq('rondaParticipanteId', participant._id)).take(2000)
      const origins = scores.filter(score => score.rondaId === args.rondaId && score.importToken === evaluation.importToken && score.clasificacion === 'no_satisfactorio')
      if (!origins.length) continue
      let caso = await ctx.db.query('sgcCasos').withIndex(
        'by_rondaId_and_rondaParticipanteId_and_tipo_and_automatico',
        q => q
          .eq('rondaId', args.rondaId)
          .eq('rondaParticipanteId', participant._id)
          .eq('tipo', 'nc_capa')
          .eq('automatico', true),
      ).unique()
      if (!caso) {
        const count = (await ctx.db.query('sgcCasos').withIndex('by_rondaId', q => q.eq('rondaId', args.rondaId)).take(1000)).length
        const now = Date.now()
        const id = await ctx.db.insert('sgcCasos', {
          rondaId: args.rondaId, rondaParticipanteId: participant._id, codigo: buildCodigoCaso(count), tipo: 'nc_capa', severidad: 'alta', estado: 'abierto',
          titulo: 'Expediente de mejora por resultados no satisfactorios', descripcion: `Agrupa ${origins.length} resultado(s) no satisfactorio(s) publicados.`,
          responsable: participant.email, formatoRelacionado: 'F-PSEA-14', evidenciaSerieId: null, fechaObjetivo: null, automatico: true,
          documentacionAceptadaAt: null, documentacionAceptadaBy: null, resolucion: null, cerradoAt: null, cerradoBy: null,
          createdAt: now, createdBy: args.actor, updatedAt: now, updatedBy: args.actor,
        })
        caso = await ctx.db.get(id)
        if (!caso) continue
        await writeAudit(ctx, { rondaId: args.rondaId, actor: args.actor, evento: 'pt.caso_automatico.creado', detalle: `${participant.participantCode ?? participant.email}: ${origins.length} origen(es)`, targetTipo: 'sgcCasos', targetId: id })
        await notifyParticipant(ctx, caso, 'Expediente de mejora creado', 'Se creó un expediente por resultados no satisfactorios. Cargue análisis de causa, plan de acción e implementación.', args.actor)
      }
      for (const score of origins) {
        const linked = await ctx.db.query('casoResultadosOrigen').withIndex('by_ptScoreId', q => q.eq('ptScoreId', score._id)).unique()
        if (!linked) {
          await ctx.db.insert('casoResultadosOrigen', { casoId: caso._id, ptScoreId: score._id })
          await ctx.db.insert('casoVerificaciones', { casoId: caso._id, ptScoreOrigenId: score._id, ptScorePosteriorId: null, rondaPosteriorId: null, resultado: 'pendiente', vinculacion: null, updatedAt: Date.now(), updatedBy: args.actor })
        }
      }
    }
    await matchPublishedResults(ctx, args.rondaId, args.actor)
  },
})

async function matchPublishedResults(ctx: MutationCtx, publishedRondaId: Id<'rondas'>, by: string) {
  const laterRonda = await ctx.db.get(publishedRondaId)
  const publishedEvaluation = await getPublishedEvaluation(ctx, publishedRondaId)
  if (!laterRonda || !publishedEvaluation?.importToken) return
  const participants = await ctx.db.query('rondaParticipantes').withIndex('by_ronda', q => q.eq('rondaId', publishedRondaId)).take(5000)
  for (const laterParticipant of participants) {
    const newerScores = (await ctx.db.query('ptScores').withIndex('by_rondaParticipanteId', q => q.eq('rondaParticipanteId', laterParticipant._id)).take(2000))
      .filter(score => score.rondaId === publishedRondaId && score.importToken === publishedEvaluation.importToken)
    const priorParticipations = await ctx.db.query('rondaParticipantes').withIndex('by_user', q => q.eq('workosUserId', laterParticipant.workosUserId)).take(100)
    for (const prior of priorParticipations) {
      if (prior.rondaId === publishedRondaId || !isSameParticipant(prior, laterParticipant)) continue
      const priorRonda = await ctx.db.get(prior.rondaId)
      if (!priorRonda || laterRonda.createdAt <= priorRonda.createdAt) continue
      const caso = await ctx.db.query('sgcCasos').withIndex(
        'by_rondaId_and_rondaParticipanteId_and_tipo_and_automatico',
        q => q
          .eq('rondaId', prior.rondaId)
          .eq('rondaParticipanteId', prior._id)
          .eq('tipo', 'nc_capa')
          .eq('automatico', true),
      ).unique()
      if (!caso || caso.estado === 'cerrado') continue
      const originLinks = await ctx.db.query('casoResultadosOrigen').withIndex('by_casoId', q => q.eq('casoId', caso._id)).take(200)
      for (const link of originLinks) {
        const [origin, verification] = await Promise.all([
          ctx.db.get(link.ptScoreId),
          ctx.db.query('casoVerificaciones').withIndex('by_ptScoreOrigenId', q => q.eq('ptScoreOrigenId', link.ptScoreId)).unique(),
        ])
        if (!origin || !verification || verification.resultado === 'satisfactorio') continue
        const originItem = await ctx.db.get(origin.ptItemId)
        if (!originItem) continue
        for (const candidate of newerScores) {
          const candidateItem = await ctx.db.get(candidate.ptItemId)
          if (!candidateItem || candidate.metodo !== origin.metodo || candidateItem.contaminante !== originItem.contaminante || candidateItem.levelLabel !== originItem.levelLabel) continue
          await ctx.db.patch(verification._id, { ptScorePosteriorId: candidate._id, rondaPosteriorId: publishedRondaId, resultado: candidate.clasificacion, vinculacion: 'automatica', updatedAt: Date.now(), updatedBy: by })
          if (candidate.clasificacion === 'no_satisfactorio') await reopenAfterFailedVerification(ctx, caso, by)
          break
        }
      }
      await closeIfComplete(ctx, caso._id, by)
    }
  }
}

async function closeIfComplete(ctx: MutationCtx, casoId: Id<'sgcCasos'>, by: string) {
  const caso = await ctx.db.get(casoId)
  if (!caso?.documentacionAceptadaAt || caso.estado === 'cerrado') return false
  const checks = await ctx.db.query('casoVerificaciones').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(200)
  if (!checks.length || checks.some(check => check.resultado !== 'satisfactorio')) return false
  const now = Date.now()
  await ctx.db.patch(casoId, { estado: 'cerrado', resolucion: 'Documentación aceptada y eficacia comprobada mediante resultados posteriores satisfactorios.', cerradoAt: now, cerradoBy: by, updatedAt: now, updatedBy: by })
  await writeAudit(ctx, { rondaId: caso.rondaId, actor: by, evento: 'pt.caso.cerrado_eficacia', targetTipo: 'sgcCasos', targetId: casoId })
  await notifyParticipant(ctx, caso, 'Expediente de mejora cerrado', 'La documentación y la eficacia posterior fueron verificadas.', by)
  return true
}

export const misCasos = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const { participante } = await requireParticipantForRonda(ctx, rondaId)
    return ctx.db.query('sgcCasos')
      .withIndex('by_rondaId_and_rondaParticipanteId_and_tipo', q =>
        q.eq('rondaId', rondaId).eq('rondaParticipanteId', participante._id))
      .order('desc')
      .take(100)
  },
})

export const listCasesAdmin = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => { await requireAdminIdentity(ctx); return ctx.db.query('sgcCasos').withIndex('by_rondaId', q => q.eq('rondaId', rondaId)).order('desc').take(500) },
})

export const verificationCandidates = query({
  args: { casoId: v.id('sgcCasos'), ptScoreOrigenId: v.id('ptScores') },
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx)
    const [caso, origin, verification] = await Promise.all([
      ctx.db.get(args.casoId),
      ctx.db.get(args.ptScoreOrigenId),
      ctx.db.query('casoVerificaciones').withIndex('by_ptScoreOrigenId', q => q.eq('ptScoreOrigenId', args.ptScoreOrigenId)).unique(),
    ])
    if (!caso?.rondaParticipanteId || !origin || verification?.casoId !== caso._id) throw new ConvexError('Caso u origen inválido.')
    const participant = await ctx.db.get(caso.rondaParticipanteId); if (!participant) return []
    const originRonda = await ctx.db.get(caso.rondaId); if (!originRonda) return []
    const participations = await ctx.db.query('rondaParticipantes').withIndex('by_user', q => q.eq('workosUserId', participant.workosUserId)).take(100)
    const result = []
    for (const participation of participations) {
      const evaluation = await getPublishedEvaluation(ctx, participation.rondaId)
      if (participation.rondaId === caso.rondaId || !evaluation?.importToken || !isSameParticipant(participant, participation)) continue
      const ronda = await ctx.db.get(participation.rondaId)
      if (!ronda || ronda.createdAt <= originRonda.createdAt) continue
      for (const score of (await ctx.db.query('ptScores').withIndex('by_rondaParticipanteId', q => q.eq('rondaParticipanteId', participation._id)).take(2000)).filter(item => item.rondaId === participation.rondaId && item.importToken === evaluation.importToken)) {
        const item = await ctx.db.get(score.ptItemId)
        result.push({ scoreId: score._id, rondaId: score.rondaId, rondaCodigo: ronda?.codigo ?? '', clasificacion: score.clasificacion, metodo: score.metodo, contaminante: item?.contaminante ?? '', nivel: item?.levelLabel ?? '' })
      }
    }
    return result.slice(0, 1000)
  },
})

export const getCaso = query({
  args: { casoId: v.id('sgcCasos') },
  handler: async (ctx, { casoId }) => {
    const { caso, admin } = await caseAccess(ctx, casoId)
    const [originLinks, documents, messages, verificationRows] = await Promise.all([
      ctx.db.query('casoResultadosOrigen').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(200),
      ctx.db.query('casoDocumentos').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(100),
      ctx.db.query('sgcCasoMensajes').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(500),
      ctx.db.query('casoVerificaciones').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(200),
    ])
    const origins = await Promise.all(originLinks.map(async link => {
      const score = await ctx.db.get(link.ptScoreId); if (!score) return null
      const item = await ctx.db.get(score.ptItemId)
      return { ...score, item: item ? { contaminante: item.contaminante, nivel: item.levelLabel, runCode: item.runCode } : null }
    }))
    const verifications = await Promise.all(verificationRows.map(async verification => {
      const posterior = verification.ptScorePosteriorId ? await ctx.db.get(verification.ptScorePosteriorId) : null
      const [item, ronda] = posterior
        ? await Promise.all([ctx.db.get(posterior.ptItemId), ctx.db.get(posterior.rondaId)])
        : [null, null]
      return { ...verification, posterior: posterior ? { rondaCodigo: ronda?.codigo ?? '', contaminante: item?.contaminante ?? '', nivel: item?.levelLabel ?? '', metodo: posterior.metodo, clasificacion: posterior.clasificacion } : null }
    }))
    const documentDetails = await Promise.all(documents.map(async document => ({ ...document, versiones: (await ctx.db.query('casoDocumentoVersiones').withIndex('by_documentoId', q => q.eq('documentoId', document._id)).take(100)).map(version => ({ ...version, storageId: admin ? version.storageId : undefined })) })))
    return { caso, origins: origins.filter(Boolean), documents: documentDetails, messages, verifications, admin }
  },
})

export const getDocumentDownload = query({
  args: { casoId: v.id('sgcCasos'), versionId: v.id('casoDocumentoVersiones') },
  handler: async (ctx, args) => {
    await caseAccess(ctx, args.casoId)
    const version = await ctx.db.get(args.versionId); if (!version) throw new ConvexError('Versión no encontrada.')
    const document = await ctx.db.get(version.documentoId)
    if (!document || document.casoId !== args.casoId) throw new ConvexError('La versión no pertenece al caso.')
    return { url: await ctx.storage.getUrl(version.storageId), nombreArchivo: version.nombreArchivo, contentType: version.contentType }
  },
})

export const generateUploadUrl = mutation({
  args: { casoId: v.id('sgcCasos') },
  handler: async (ctx, { casoId }) => {
    const { caso, admin } = await caseAccess(ctx, casoId)
    if (admin) throw new ConvexError('Solo el responsable puede cargar documentos.')
    if (!EDITABLE_CASE_STATES.has(caso.estado)) throw new ConvexError('El caso no admite documentos en este estado.')
    return ctx.storage.generateUploadUrl()
  },
})

export const addDocumentVersion = mutation({
  args: { casoId: v.id('sgcCasos'), categoria: category, storageId: v.id('_storage'), nombreArchivo: v.string(), contentType: v.string() },
  handler: async (ctx, args) => {
    const { identity, caso, admin } = await caseAccess(ctx, args.casoId)
    if (admin) throw new ConvexError('Solo el responsable puede cargar documentos.')
    if (!EDITABLE_CASE_STATES.has(caso.estado)) throw new ConvexError('El caso no admite documentos en este estado.')
    if (!ALLOWED_CONTENT_TYPES.has(args.contentType) || !args.nombreArchivo.trim()) throw new ConvexError('Solo se admiten PDF, imágenes y hojas de cálculo.')
    const metadata = await ctx.db.system.get(args.storageId)
    if (!metadata || metadata.size > 15 * 1024 * 1024) throw new ConvexError('El archivo no existe o supera 15 MB.')
    let document = await ctx.db.query('casoDocumentos').withIndex('by_casoId_and_categoria', q => q.eq('casoId', args.casoId).eq('categoria', args.categoria)).unique()
    const by = actor(identity), now = Date.now()
    if (!document) { const id = await ctx.db.insert('casoDocumentos', { casoId: args.casoId, categoria: args.categoria, createdAt: now, createdBy: by }); document = await ctx.db.get(id) }
    if (!document) throw new ConvexError('No fue posible crear el documento.')
    const versions = await ctx.db.query('casoDocumentoVersiones').withIndex('by_documentoId', q => q.eq('documentoId', document._id)).take(100)
    const id = await ctx.db.insert('casoDocumentoVersiones', { documentoId: document._id, version: versions.length + 1, storageId: args.storageId, nombreArchivo: args.nombreArchivo.trim(), contentType: args.contentType, estado: 'borrador', createdAt: now, createdBy: by, enviadaAt: null })
    await writeAudit(ctx, { rondaId: caso.rondaId, actor: by, evento: 'pt.caso.documento_version.creada', detalle: `${args.categoria} v${versions.length + 1}`, targetTipo: 'casoDocumentoVersiones', targetId: id })
    return id
  },
})

export const submitForReview = mutation({
  args: { casoId: v.id('sgcCasos') },
  handler: async (ctx, { casoId }) => {
    const { identity, caso, admin } = await caseAccess(ctx, casoId); if (admin) throw new ConvexError('Solo el responsable envía documentación.')
    if (!EDITABLE_CASE_STATES.has(caso.estado)) throw new ConvexError('El caso no está listo para envío.')
    const documents = await ctx.db.query('casoDocumentos').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(100)
    let draftCount = 0
    for (const required of REQUIRED_CATEGORIES) {
      const document = documents.find(item => item.categoria === required)
      if (!document) throw new ConvexError(`Falta ${required}.`)
      const versions = await ctx.db.query('casoDocumentoVersiones').withIndex('by_documentoId', q => q.eq('documentoId', document._id)).take(100)
      if (!versions.length) throw new ConvexError(`Falta ${required}.`)
      draftCount += versions.filter(version => version.estado === 'borrador').length
    }
    if (!draftCount) throw new ConvexError('Debe agregar al menos una versión nueva antes de reenviar.')
    const now = Date.now(), by = actor(identity)
    for (const document of documents) for (const version of await ctx.db.query('casoDocumentoVersiones').withIndex('by_documentoId', q => q.eq('documentoId', document._id)).take(100)) if (version.estado === 'borrador') await ctx.db.patch(version._id, { estado: 'enviada', enviadaAt: now })
    await ctx.db.patch(casoId, { estado: 'en_revision', updatedAt: now, updatedBy: by })
    await writeAudit(ctx, { rondaId: caso.rondaId, actor: by, evento: 'pt.caso.enviado_revision', targetTipo: 'sgcCasos', targetId: casoId })
    await notifyParticipant(ctx, caso, 'Documentación enviada a revisión', 'Calaire recibió la documentación del expediente para revisión.', by)
  },
})

export const addMessage = mutation({
  args: { casoId: v.id('sgcCasos'), texto: v.string() },
  handler: async (ctx, { casoId, texto }) => {
    const { identity, caso, admin } = await caseAccess(ctx, casoId)
    const clean = texto.trim()
    if (!clean) throw new ConvexError('El mensaje no puede estar vacío.')
    if (caso.estado === 'cerrado') throw new ConvexError('El caso está cerrado y no admite mensajes.')
    if (!admin && !EDITABLE_CASE_STATES.has(caso.estado)) throw new ConvexError('Solo puede responder cuando el caso está abierto o esperando su respuesta.')
    const by = actor(identity), now = Date.now()
    const id = await ctx.db.insert('sgcCasoMensajes', { casoId, autorTipo: admin ? 'admin' : 'participante', autorId: by, texto: clean, createdAt: now })
    // Caso voluntario: la respuesta del participante devuelve el caso a revisión de Calaire.
    if (!admin && !caso.automatico && caso.estado === 'esperando_participante') {
      await ctx.db.patch(casoId, { estado: 'en_revision', updatedAt: now, updatedBy: by })
    }
    await writeAudit(ctx, { rondaId: caso.rondaId, actor: by, evento: 'pt.caso.mensaje', targetTipo: 'sgcCasoMensajes', targetId: id })
    return id
  },
})

export const reviewDocumentation = mutation({
  args: { casoId: v.id('sgcCasos'), decision: v.union(v.literal('aceptar'), v.literal('ajustes')), observacion: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx); const caso = await ctx.db.get(args.casoId); if (!caso || caso.estado !== 'en_revision') throw new ConvexError('El caso no está en revisión.')
    const observation = args.observacion.trim(); if (!observation) throw new ConvexError('La revisión exige una observación.')
    const by = actor(identity), now = Date.now(); await ctx.db.insert('sgcCasoMensajes', { casoId: caso._id, autorTipo: 'admin', autorId: by, texto: observation, createdAt: now })
    // 'resuelto' representa "en espera de verificación de eficacia": documentación aceptada
    // (documentacionAceptadaAt sellado) pero el cierre exige resultados posteriores satisfactorios.
    await ctx.db.patch(caso._id, args.decision === 'aceptar' ? { estado: 'resuelto', documentacionAceptadaAt: now, documentacionAceptadaBy: by, updatedAt: now, updatedBy: by } : { estado: 'esperando_participante', documentacionAceptadaAt: null, documentacionAceptadaBy: null, updatedAt: now, updatedBy: by })
    await writeAudit(ctx, { rondaId: caso.rondaId, actor: by, evento: `pt.caso.documentacion.${args.decision}`, detalle: observation, targetTipo: 'sgcCasos', targetId: caso._id })
    await notifyParticipant(ctx, caso, args.decision === 'aceptar' ? 'Documentación aceptada' : 'Ajustes requeridos', observation, by)
    if (args.decision === 'aceptar') await closeIfComplete(ctx, caso._id, by)
  },
})

export const linkVerificationManually = mutation({
  args: { casoId: v.id('sgcCasos'), ptScoreOrigenId: v.id('ptScores'), ptScorePosteriorId: v.id('ptScores'), motivo: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx), by = actor(identity), motivo = args.motivo.trim(); if (!motivo) throw new ConvexError('El vínculo manual exige justificación.')
    const [caso, origin, posterior, verification] = await Promise.all([ctx.db.get(args.casoId), ctx.db.get(args.ptScoreOrigenId), ctx.db.get(args.ptScorePosteriorId), ctx.db.query('casoVerificaciones').withIndex('by_ptScoreOrigenId', q => q.eq('ptScoreOrigenId', args.ptScoreOrigenId)).unique()])
    if (!caso?.rondaParticipanteId || !origin || !posterior || !verification || verification.casoId !== caso._id || posterior.rondaId === caso.rondaId) throw new ConvexError('La correspondencia seleccionada no es válida.')
    const [caseParticipant, posteriorParticipant] = await Promise.all([ctx.db.get(caso.rondaParticipanteId), ctx.db.get(posterior.rondaParticipanteId)])
    if (!caseParticipant || !posteriorParticipant || !isSameParticipant(caseParticipant, posteriorParticipant)) throw new ConvexError('La correspondencia seleccionada no es válida.')
    const [originRonda, posteriorRonda] = await Promise.all([ctx.db.get(caso.rondaId), ctx.db.get(posterior.rondaId)])
    if (!originRonda || !posteriorRonda || posteriorRonda.createdAt <= originRonda.createdAt) throw new ConvexError('El resultado debe pertenecer a una ronda posterior.')
    const evaluation = await getPublishedEvaluation(ctx, posterior.rondaId)
    if (!evaluation?.importToken || posterior.importToken !== evaluation.importToken) throw new ConvexError('El resultado posterior no está publicado.')
    await ctx.db.patch(verification._id, { ptScorePosteriorId: posterior._id, rondaPosteriorId: posterior.rondaId, resultado: posterior.clasificacion, vinculacion: 'manual', updatedAt: Date.now(), updatedBy: by })
    await writeAudit(ctx, { rondaId: caso.rondaId, actor: by, evento: 'pt.caso.verificacion.manual', detalle: motivo, targetTipo: 'casoVerificaciones', targetId: verification._id })
    if (posterior.clasificacion === 'no_satisfactorio') await reopenAfterFailedVerification(ctx, caso, by)
    await closeIfComplete(ctx, caso._id, by)
  },
})

export const createVoluntaryCase = mutation({
  args: { rondaId: v.id('rondas'), tipo: v.union(v.literal('consulta'), v.literal('queja'), v.literal('apelacion')), titulo: v.string(), descripcion: v.string() },
  handler: async (ctx, args) => { const { identity, participante } = await requireParticipantForRonda(ctx, args.rondaId); const title = args.titulo.trim(), description = args.descripcion.trim(); if (!title || !description) throw new ConvexError('Título y descripción son obligatorios.'); const count = (await ctx.db.query('sgcCasos').withIndex('by_rondaId', q => q.eq('rondaId', args.rondaId)).take(1000)).length; const now = Date.now(), by = actor(identity); const id = await ctx.db.insert('sgcCasos', { rondaId: args.rondaId, rondaParticipanteId: participante._id, codigo: buildCodigoCaso(count), tipo: args.tipo, severidad: 'media', estado: 'abierto', titulo: title, descripcion: description, responsable: participante.email, formatoRelacionado: null, evidenciaSerieId: null, fechaObjetivo: null, automatico: false, documentacionAceptadaAt: null, documentacionAceptadaBy: null, resolucion: null, cerradoAt: null, cerradoBy: null, createdAt: now, createdBy: by, updatedAt: now, updatedBy: by }); await writeAudit(ctx, { rondaId: args.rondaId, actor: by, evento: 'pt.caso.voluntario.creado', detalle: args.tipo, targetTipo: 'sgcCasos', targetId: id }); return id },
})

export const getArchiveData = query({
  args: { casoId: v.id('sgcCasos') },
  handler: async (ctx, { casoId }) => { const { caso } = await caseAccess(ctx, casoId); if (caso.estado !== 'cerrado') throw new ConvexError('El expediente ZIP solo está disponible al cerrar el caso.'); const detail = await Promise.all((await ctx.db.query('casoDocumentos').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(100)).map(async document => ({ categoria: document.categoria, versions: await Promise.all((await ctx.db.query('casoDocumentoVersiones').withIndex('by_documentoId', q => q.eq('documentoId', document._id)).take(100)).map(async version => ({ nombreArchivo: version.nombreArchivo, version: version.version, url: await ctx.storage.getUrl(version.storageId) }))) }))); const messages = await ctx.db.query('sgcCasoMensajes').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(500); const checks = await ctx.db.query('casoVerificaciones').withIndex('by_casoId', q => q.eq('casoId', casoId)).take(200); return { caso, documents: detail, messages, verifications: checks } },
})
