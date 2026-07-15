import { v } from 'convex/values'
import { internalMutation, internalQuery, mutation, query } from '../_generated/server'
import { internal } from '../_generated/api'
import { requireAdminIdentity, requireParticipantForRonda } from '../access'
import { writeAudit } from '../sgc/shared'

export const getGenerationData = internalQuery({
  args: { certificateId: v.id('ptCertificados') },
  handler: async (ctx, { certificateId }) => {
    const certificate = await ctx.db.get(certificateId)
    if (!certificate) return null
    const [ronda, participant] = await Promise.all([ctx.db.get(certificate.rondaId), ctx.db.get(certificate.rondaParticipanteId)])
    if (!ronda || !participant) return null
    const directory = participant.directorioParticipanteId ? await ctx.db.get(participant.directorioParticipanteId) : null
    const scores = await ctx.db.query('ptScores').withIndex('by_rondaParticipanteId', (q) => q.eq('rondaParticipanteId', participant._id)).take(2000)
    const pollutants = new Set<string>()
    for (const score of scores.filter((row) => row.rondaId === ronda._id)) { const item = await ctx.db.get(score.ptItemId); if (item) pollutants.add(item.contaminante) }
    return { certificate, ronda: { codigo: ronda.codigo, nombre: ronda.nombre }, participantCode: participant.participantCode ?? 'Sin código', laboratory: directory?.nombreLaboratorio ?? participant.email, pollutants: [...pollutants] }
  },
})

export const markGenerating = internalMutation({
  args: { certificateId: v.id('ptCertificados') },
  handler: async (ctx, { certificateId }) => {
    const row = await ctx.db.get(certificateId)
    if (!row || row.estado === 'generado') return false
    await ctx.db.patch(certificateId, { estado: 'generando', intentos: row.intentos + 1, error: null, updatedAt: Date.now() })
    return true
  },
})

export const markResult = internalMutation({
  args: { certificateId: v.id('ptCertificados'), storageId: v.union(v.id('_storage'), v.null()), error: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.certificateId, { estado: args.storageId ? 'generado' : 'fallido', storageId: args.storageId, error: args.error, updatedAt: Date.now() })
  },
})

export const retry = mutation({
  args: { certificateId: v.id('ptCertificados') },
  handler: async (ctx, { certificateId }) => {
    await requireAdminIdentity(ctx)
    const row = await ctx.db.get(certificateId)
    if (!row || !['pendiente', 'fallido'].includes(row.estado)) throw new Error('El certificado no está disponible para reintento.')
    await ctx.scheduler.runAfter(0, internal.pt.certificate_generation.generate, { certificateId })
    return null
  },
})

export const getMine = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const { participante } = await requireParticipantForRonda(ctx, rondaId)
    const row = await ctx.db.query('ptCertificados').withIndex('by_rondaId_and_rondaParticipanteId', (q) => q.eq('rondaId', rondaId).eq('rondaParticipanteId', participante._id)).unique()
    return row ? { id: row._id, estado: row.estado, url: row.estado === 'generado' && row.storageId ? await ctx.storage.getUrl(row.storageId) : null } : null
  },
})

export const getMineDownload = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const { participante, identity } = await requireParticipantForRonda(ctx, rondaId)
    const row = await ctx.db.query('ptCertificados').withIndex('by_rondaId_and_rondaParticipanteId', (q) => q.eq('rondaId', rondaId).eq('rondaParticipanteId', participante._id)).unique()
    if (!row || row.estado !== 'generado' || !row.storageId) return null
    await writeAudit(ctx, { rondaId, actor: identity.subject, evento: 'pt.certificado.descargado', targetTipo: 'ptCertificados', targetId: row._id })
    return { url: await ctx.storage.getUrl(row.storageId), nombreArchivo: `certificado-${row._id}.pdf` }
  },
})

export const verify = query({
  args: { certificateId: v.id('ptCertificados') },
  handler: async (ctx, { certificateId }) => {
    const row = await ctx.db.get(certificateId)
    if (!row || row.estado !== 'generado') return null
    const ronda = await ctx.db.get(row.rondaId), participant = await ctx.db.get(row.rondaParticipanteId)
    return ronda && participant ? { valido: true, ronda: ronda.codigo, participantCode: participant.participantCode ?? null, emitidoAt: row.updatedAt } : null
  },
})
