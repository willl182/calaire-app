import { ConvexError, v } from 'convex/values'
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { requireAdminIdentity, requireIdentity, requireParticipantForRonda, requireParticipantOrAdminForRonda } from '../access'
import { writeAudit } from '../sgc/shared'

const classification = v.union(v.literal('satisfactorio'), v.literal('no_satisfactorio'))
const nullableNumber = v.union(v.number(), v.null())
const scoreRow = v.object({
  participantCode: v.string(), contaminante: v.string(), runCode: v.string(), levelLabel: v.string(), unidad: v.string(), metodo: v.string(),
  valorAsignado: v.number(), incertidumbreAsignada: nullableNumber, sigmaPt: nullableNumber, valorParticipante: v.number(),
  uParticipante: nullableNumber, UParticipante: nullableNumber, z: nullableNumber, zPrima: nullableNumber, zeta: nullableNumber, en: nullableNumber,
  clasificacion: classification,
})
type ScoreInput = {
  participantCode: string; contaminante: string; runCode: string; levelLabel: string; unidad: string; metodo: string
  valorAsignado: number; incertidumbreAsignada: number | null; sigmaPt: number | null; valorParticipante: number
  uParticipante: number | null; UParticipante: number | null; z: number | null; zPrima: number | null; zeta: number | null; en: number | null
  clasificacion: 'satisfactorio' | 'no_satisfactorio'
}
type ValidatedScore = ScoreInput & { rondaParticipanteId: Id<'rondaParticipantes'>; ptItemId: Id<'rondaPtItems'> }
type ValidationError = { fila: number; campo: string; mensaje: string }

async function validateRows(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>, rows: ScoreInput[], offset = 0) {
  const [ronda, participantes, items] = await Promise.all([
    ctx.db.get(rondaId),
    ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).take(5000),
    ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).take(5000),
  ])
  if (!ronda) throw new ConvexError('Ronda no encontrada.')
  const participantMap = new Map(participantes.filter((p) => p.claimedAt && p.participantCode).map((p) => [p.participantCode!, p]))
  const itemMap = new Map(items.map((item) => [`${item.contaminante}\u0000${item.runCode}\u0000${item.levelLabel}`, item]))
  const seen = new Set<string>()
  const errors: ValidationError[] = []
  const valid: ValidatedScore[] = []
  rows.forEach((row, index) => {
    const fila = offset + index + 2
    const participant = participantMap.get(row.participantCode)
    const item = itemMap.get(`${row.contaminante.toUpperCase()}\u0000${row.runCode}\u0000${row.levelLabel}`)
    if (!participant) errors.push({ fila, campo: 'participant_code', mensaje: 'Participante desconocido o no reclamado en esta ronda.' })
    if (!item) errors.push({ fila, campo: 'item', mensaje: 'No existe el contaminante, run y nivel en esta ronda.' })
    if (!row.metodo.trim()) errors.push({ fila, campo: 'metodo', mensaje: 'El método es obligatorio.' })
    if (!row.unidad.trim()) errors.push({ fila, campo: 'unidad', mensaje: 'La unidad es obligatoria.' })
    const numbers = [row.valorAsignado, row.incertidumbreAsignada, row.sigmaPt, row.valorParticipante, row.uParticipante, row.UParticipante, row.z, row.zPrima, row.zeta, row.en]
    if (numbers.some((value) => value !== null && !Number.isFinite(value))) errors.push({ fila, campo: 'numero', mensaje: 'Todos los números deben ser finitos.' })
    const key = `${row.participantCode}\u0000${item?._id ?? 'invalid'}\u0000${row.metodo}`
    if (seen.has(key)) errors.push({ fila, campo: 'metodo', mensaje: 'Duplicado participante × ítem × método.' })
    seen.add(key)
    if (participant && item && !errors.some((error) => error.fila === fila)) valid.push({ ...row, rondaParticipanteId: participant._id, ptItemId: item._id })
  })
  return { valid, errors }
}

export const previewImport = query({
  args: { rondaId: v.id('rondas'), rows: v.array(scoreRow) },
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx)
    if (args.rows.length > 2000) throw new ConvexError('El preview admite máximo 2000 filas.')
    const result = await validateRows(ctx, args.rondaId, args.rows)
    return { importables: result.valid.length, errores: result.errors, noSatisfactorios: result.valid.filter((row) => row.clasificacion === 'no_satisfactorio').length }
  },
})

export const getEstadoEvaluacionAdmin = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireAdminIdentity(ctx)
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).unique()
    if (!evaluation) return null
    return { ...evaluation, informeUrl: evaluation.informeStorageId ? await ctx.storage.getUrl(evaluation.informeStorageId) : null }
  },
})

export const generateUploadUrl = mutation({
  args: {}, handler: async (ctx) => { await requireAdminIdentity(ctx); return ctx.storage.generateUploadUrl() },
})

export const startDraftImport = mutation({
  args: { rondaId: v.id('rondas'), importToken: v.string(), filasEsperadas: v.number() },
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx)
    if (!args.importToken.trim() || args.filasEsperadas < 1 || args.filasEsperadas > 2000) throw new ConvexError('Importación inválida.')
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).unique()
    if (evaluation?.estado === 'publicada') throw new ConvexError('Una evaluación publicada es inmutable.')
    const [oldScores, oldStats] = await Promise.all([
      ctx.db.query('ptScores').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).take(5000),
      ctx.db.query('ptScoreRondaStats').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).take(5000),
    ])
    for (const row of oldScores) await ctx.db.delete(row._id)
    for (const row of oldStats) await ctx.db.delete(row._id)
    const patch = { estado: 'importando' as const, importToken: args.importToken, filasEsperadas: args.filasEsperadas, filasImportadas: 0, updatedAt: Date.now(), updatedBy: identity.subject }
    if (evaluation) await ctx.db.patch(evaluation._id, patch)
    else await ctx.db.insert('ptEvaluaciones', { rondaId: args.rondaId, ...patch, csvStorageId: null, informeStorageId: null, informeNombreArchivo: null, publicadaAt: null, publicadaBy: null })
    return null
  },
})

export const importDraftBatch = mutation({
  args: { rondaId: v.id('rondas'), importToken: v.string(), offset: v.number(), rows: v.array(scoreRow) },
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx)
    if (args.rows.length < 1 || args.rows.length > 100) throw new ConvexError('Cada lote debe contener entre 1 y 100 filas.')
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).unique()
    if (!evaluation || evaluation.estado !== 'importando' || evaluation.importToken !== args.importToken) throw new ConvexError('La importación no está activa.')
    const checked = await validateRows(ctx, args.rondaId, args.rows, args.offset)
    if (checked.errors.length) throw new ConvexError({ message: 'El lote contiene errores.', errores: checked.errors })
    // Sin errores de validación, checked.valid conserva el orden y largo de args.rows.
    for (const [index, row] of checked.valid.entries()) {
      const existing = await ctx.db.query('ptScores').withIndex('by_rondaParticipanteId_and_ptItemId_and_metodo', (q) => q.eq('rondaParticipanteId', row.rondaParticipanteId).eq('ptItemId', row.ptItemId).eq('metodo', row.metodo)).unique()
      if (existing) throw new ConvexError(`Duplicado participante × ítem × método en fila ${args.offset + index + 2}.`)
      await ctx.db.insert('ptScores', { ...row, rondaId: args.rondaId, importToken: args.importToken, importadoAt: Date.now(), importadoBy: identity.subject })
    }
    await ctx.db.patch(evaluation._id, { filasImportadas: (evaluation.filasImportadas ?? 0) + checked.valid.length, updatedAt: Date.now(), updatedBy: identity.subject })
    return checked.valid.length
  },
})

function histogram(values: number[]) {
  if (!values.length) return []
  const min = Math.min(...values), max = Math.max(...values)
  if (min === max) return [{ desde: min, hasta: max, n: values.length }]
  const width = (max - min) / Math.min(10, Math.max(3, Math.ceil(Math.sqrt(values.length))))
  return Array.from({ length: Math.ceil((max - min) / width) }, (_, index) => {
    const desde = min + index * width, hasta = index === Math.ceil((max - min) / width) - 1 ? max : desde + width
    return { desde, hasta, n: values.filter((value) => value >= desde && (value < hasta || hasta === max && value <= hasta)).length }
  })
}

export const finishDraftImport = mutation({
  args: { rondaId: v.id('rondas'), importToken: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx)
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).unique()
    if (!evaluation || evaluation.estado !== 'importando' || evaluation.importToken !== args.importToken) throw new ConvexError('La importación no está activa.')
    const scores = await ctx.db.query('ptScores').withIndex('by_rondaId_and_importToken', (q) => q.eq('rondaId', args.rondaId).eq('importToken', args.importToken)).take(5000)
    if (scores.length !== evaluation.filasEsperadas || scores.length !== evaluation.filasImportadas) throw new ConvexError('La importación está incompleta; no puede validarse.')
    const groups = new Map<string, typeof scores>()
    for (const score of scores) { const key = `${score.ptItemId}\u0000${score.metodo}`; groups.set(key, [...(groups.get(key) ?? []), score]) }
    for (const rows of groups.values()) await ctx.db.insert('ptScoreRondaStats', { rondaId: args.rondaId, ptItemId: rows[0].ptItemId, metodo: rows[0].metodo, n: rows.length, bins: histogram(rows.map((row) => row.valorParticipante)), importToken: args.importToken, importadoAt: Date.now(), importadoBy: identity.subject })
    await ctx.db.patch(evaluation._id, { estado: 'borrador_validado', updatedAt: Date.now(), updatedBy: identity.subject })
    await writeAudit(ctx, { rondaId: args.rondaId, actor: identity.subject, evento: 'pt.evaluacion.borrador_importado', detalle: `${scores.length} filas`, targetTipo: 'ptEvaluaciones', targetId: evaluation._id })
    return scores.length
  },
})

export const registrarInformeGeneral = mutation({
  args: { rondaId: v.id('rondas'), storageId: v.id('_storage'), nombreArchivo: v.string(), contentType: v.string(), size: v.number() },
  handler: async (ctx, args) => {
    const identity = await requireAdminIdentity(ctx)
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).unique()
    if (!evaluation || evaluation.estado === 'publicada') throw new ConvexError('Primero importe un borrador no publicado.')
    if (args.contentType !== 'application/pdf' || args.size > 20 * 1024 * 1024) throw new ConvexError('Solo se admite PDF de máximo 20 MB.')
    const metadata = await ctx.db.system.get('_storage', args.storageId)
    if (!metadata || metadata.size !== args.size) throw new ConvexError('Archivo de storage inválido.')
    await ctx.db.patch(evaluation._id, { informeStorageId: args.storageId, informeNombreArchivo: args.nombreArchivo, updatedAt: Date.now(), updatedBy: identity.subject })
    return null
  },
})

export const publicarResultados = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const identity = await requireAdminIdentity(ctx)
    const [ronda, evaluation] = await Promise.all([ctx.db.get(rondaId), ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).unique()])
    if (!ronda || !['documentacion_pendiente', 'cerrada'].includes(ronda.estado)) throw new ConvexError('Solo se publica durante cierre documental o con la ronda cerrada.')
    if (!evaluation || evaluation.estado !== 'borrador_validado' || !evaluation.informeStorageId) throw new ConvexError('Se requiere un borrador validado y el informe general PDF.')
    const now = Date.now()
    await ctx.db.patch(evaluation._id, { estado: 'publicada', publicadaAt: now, publicadaBy: identity.subject, updatedAt: now, updatedBy: identity.subject })
    await writeAudit(ctx, { rondaId, actor: identity.subject, evento: 'pt.evaluacion.publicada', targetTipo: 'ptEvaluaciones', targetId: evaluation._id })
    await ctx.scheduler.runAfter(0, internal.pt.scores.prepareCertificates, { rondaId, actor: identity.subject })
    await ctx.scheduler.runAfter(0, internal.pt.cases.prepareAutomaticCases, { rondaId, actor: identity.subject })
    return now
  },
})

export const prepareCertificates = internalMutation({
  args: { rondaId: v.id('rondas'), actor: v.string() },
  handler: async (ctx, args) => {
    const participants = await ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', args.rondaId)).take(5000)
    for (const participant of participants) {
      const submissions = await ctx.db.query('enviosPt').withIndex('by_participante', (q) => q.eq('rondaParticipanteId', participant._id)).take(5000)
      if (!submissions.some((row) => row.rondaId === args.rondaId && row.finalSubmittedAt)) continue
      const existing = await ctx.db.query('ptCertificados').withIndex('by_rondaId_and_rondaParticipanteId', (q) => q.eq('rondaId', args.rondaId).eq('rondaParticipanteId', participant._id)).unique()
      if (!existing) {
        const certificateId = await ctx.db.insert('ptCertificados', { rondaId: args.rondaId, rondaParticipanteId: participant._id, estado: 'pendiente', storageId: null, error: null, intentos: 0, createdAt: Date.now(), createdBy: args.actor, updatedAt: Date.now() })
        await ctx.scheduler.runAfter(0, internal.pt.certificate_generation.generate, { certificateId })
      }
    }
  },
})

export const getMisResultados = query({
  args: { rondaId: v.id('rondas'), rondaParticipanteId: v.optional(v.id('rondaParticipantes')) },
  handler: async (ctx, { rondaId, rondaParticipanteId }) => {
    let { participante } = await requireParticipantOrAdminForRonda(ctx, rondaId)
    if (!participante) {
      // Admin sin fila propia: consulta los resultados del participante indicado.
      if (!rondaParticipanteId) throw new ConvexError('Indique el participante a consultar.')
      const target = await ctx.db.get(rondaParticipanteId)
      if (!target || target.rondaId !== rondaId) throw new ConvexError('El participante no pertenece a la ronda.')
      participante = target
    }
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).unique()
    if (!evaluation || evaluation.estado !== 'publicada') return { estado: 'pendiente' as const }
    const scores = (await ctx.db.query('ptScores').withIndex('by_rondaParticipanteId', (q) => q.eq('rondaParticipanteId', participante._id)).take(2000)).filter((row) => row.rondaId === rondaId && row.importToken === evaluation.importToken)
    const enriched = await Promise.all(scores.map(async (score) => {
      const [item, stats] = await Promise.all([ctx.db.get(score.ptItemId), ctx.db.query('ptScoreRondaStats').withIndex('by_rondaId_and_ptItemId_and_metodo', (q) => q.eq('rondaId', rondaId).eq('ptItemId', score.ptItemId).eq('metodo', score.metodo)).unique()])
      return { ...score, item: item ? { contaminante: item.contaminante, runCode: item.runCode, levelLabel: item.levelLabel } : null, stats: stats && stats.importToken === evaluation.importToken ? { n: stats.n, bins: stats.n >= 3 ? stats.bins : [] } : null }
    }))
    return { estado: 'publicada' as const, publicadaAt: evaluation.publicadaAt ?? null, resultados: enriched, anonimizationThreshold: 3 }
  },
})

export const getMiDesempeno = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    const participaciones = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_user', (q) => q.eq('workosUserId', identity.subject))
      .take(100)

    const puntos: Array<{
      rondaCodigo: string
      fecha: number
      contaminante: string
      nivel: string
      metodo: string
      z: number | null
      zPrima: number | null
      zeta: number | null
      en: number | null
      clasificacion: 'satisfactorio' | 'no_satisfactorio'
    }> = []

    for (const participacion of participaciones) {
      const [ronda, evaluacion] = await Promise.all([
        ctx.db.get(participacion.rondaId),
        ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', participacion.rondaId)).unique(),
      ])
      if (!ronda || evaluacion?.estado !== 'publicada' || !evaluacion.importToken) continue

      const scores = await ctx.db
        .query('ptScores')
        .withIndex('by_rondaParticipanteId', (q) => q.eq('rondaParticipanteId', participacion._id))
        .take(2000)
      const publicados = scores.filter((score) => score.rondaId === ronda._id && score.importToken === evaluacion.importToken)

      for (const score of publicados) {
        const item = await ctx.db.get(score.ptItemId)
        if (!item || item.rondaId !== ronda._id) continue
        puntos.push({
          rondaCodigo: ronda.codigo,
          fecha: evaluacion.publicadaAt ?? ronda.createdAt,
          contaminante: item.contaminante,
          nivel: item.levelLabel,
          metodo: score.metodo,
          z: score.z,
          zPrima: score.zPrima,
          zeta: score.zeta,
          en: score.en,
          clasificacion: score.clasificacion,
        })
      }
    }

    puntos.sort((a, b) => a.fecha - b.fecha || a.rondaCodigo.localeCompare(b.rondaCodigo))
    const seriesMap = new Map<string, { contaminante: string; nivel: string; metodo: string; puntos: typeof puntos }>()
    for (const punto of puntos) {
      const key = `${punto.contaminante}\u0000${punto.nivel}\u0000${punto.metodo}`
      const serie = seriesMap.get(key) ?? { contaminante: punto.contaminante, nivel: punto.nivel, metodo: punto.metodo, puntos: [] }
      serie.puntos.push(punto)
      seriesMap.set(key, serie)
    }

    const rondasMap = new Map<string, { rondaCodigo: string; fecha: number; satisfactorios: number; noSatisfactorios: number }>()
    for (const punto of puntos) {
      const resumen = rondasMap.get(punto.rondaCodigo) ?? { rondaCodigo: punto.rondaCodigo, fecha: punto.fecha, satisfactorios: 0, noSatisfactorios: 0 }
      if (punto.clasificacion === 'satisfactorio') resumen.satisfactorios += 1
      else resumen.noSatisfactorios += 1
      rondasMap.set(punto.rondaCodigo, resumen)
    }

    return {
      fechaConsulta: Date.now(),
      series: [...seriesMap.values()],
      rondas: [...rondasMap.values()].map((ronda) => ({
        ...ronda,
        porcentajeSatisfactorio: (ronda.satisfactorios / (ronda.satisfactorios + ronda.noSatisfactorios)) * 100,
      })),
    }
  },
})

export const getMiInformeUrl = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireParticipantForRonda(ctx, rondaId)
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).unique()
    if (!evaluation || evaluation.estado !== 'publicada' || !evaluation.informeStorageId) return null
    return { url: await ctx.storage.getUrl(evaluation.informeStorageId), nombreArchivo: evaluation.informeNombreArchivo ?? 'informe-resultados.pdf' }
  },
})

export const importHttpDraft = internalMutation({
  args: { apiKeyHash: v.string(), rondaCodigo: v.string(), rows: v.array(scoreRow) },
  handler: async (ctx, args) => {
    const key = await ctx.db.query('agentApiKeys').withIndex('by_api_key_hash', (q) => q.eq('apiKeyHash', args.apiKeyHash)).unique()
    if (!key || key.revokedAt || key.expiresAt <= Date.now() || !key.scopes.some((scope) => ['pt:scores', 'pt:write', '*'].includes(scope))) throw new ConvexError({ code: 'unauthorized', message: 'API key inválida, expirada o sin alcance pt:scores.' })
    if (args.rows.length < 1 || args.rows.length > 500) throw new ConvexError({ code: 'bad_request', message: 'El endpoint admite entre 1 y 500 filas por solicitud.' })
    const ronda = await ctx.db.query('rondas').withIndex('by_codigo', (q) => q.eq('codigo', args.rondaCodigo)).unique()
    if (!ronda) throw new ConvexError({ code: 'not_found', message: 'Ronda no encontrada.' })
    const evaluation = await ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', ronda._id)).unique()
    if (evaluation?.estado === 'publicada') throw new ConvexError({ code: 'conflict', message: 'Una evaluación publicada es inmutable.' })
    const checked = await validateRows(ctx, ronda._id, args.rows)
    if (checked.errors.length) return { ok: false as const, importadas: 0, errores: checked.errors }
    const now = Date.now(), token = `http-${key._id}-${now}`, actor = `api:${key.email}`
    for (const row of await ctx.db.query('ptScores').withIndex('by_rondaId', (q) => q.eq('rondaId', ronda._id)).take(5000)) await ctx.db.delete(row._id)
    for (const row of await ctx.db.query('ptScoreRondaStats').withIndex('by_rondaId', (q) => q.eq('rondaId', ronda._id)).take(5000)) await ctx.db.delete(row._id)
    for (const row of checked.valid) await ctx.db.insert('ptScores', { ...row, rondaId: ronda._id, importToken: token, importadoAt: now, importadoBy: actor })
    const groups = new Map<string, typeof checked.valid>()
    for (const score of checked.valid) { const groupKey = `${score.ptItemId}\u0000${score.metodo}`; groups.set(groupKey, [...(groups.get(groupKey) ?? []), score]) }
    for (const rows of groups.values()) await ctx.db.insert('ptScoreRondaStats', { rondaId: ronda._id, ptItemId: rows[0].ptItemId, metodo: rows[0].metodo, n: rows.length, bins: histogram(rows.map((row) => row.valorParticipante)), importToken: token, importadoAt: now, importadoBy: actor })
    const patch = { estado: 'borrador_validado' as const, importToken: token, filasEsperadas: checked.valid.length, filasImportadas: checked.valid.length, updatedAt: now, updatedBy: actor }
    if (evaluation) await ctx.db.patch(evaluation._id, patch)
    else await ctx.db.insert('ptEvaluaciones', { rondaId: ronda._id, ...patch, csvStorageId: null, informeStorageId: null, informeNombreArchivo: null, publicadaAt: null, publicadaBy: null })
    await writeAudit(ctx, { rondaId: ronda._id, actor, evento: 'pt.evaluacion.borrador_importado_http', detalle: `${checked.valid.length} filas` })
    return { ok: true as const, importadas: checked.valid.length, errores: [] }
  },
})
