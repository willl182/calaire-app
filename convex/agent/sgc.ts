import { v } from 'convex/values'
import { defineAgentQuery } from './definitions'
import { requireAgentAdmin } from './shared'

export const getPanelSgcDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) return null
    const [plan, revision, hitos, series, justificaciones, snapshots, audit] = await Promise.all([
      ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first(),
      ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first(),
      ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcJustificaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcRegistroSnapshots').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(10),
      ctx.db.query('sgcAuditLog').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(20),
    ])
    const versiones = await Promise.all(
      series.map(async (serie) => {
        const vigente = await ctx.db
          .query('sgcEvidenciaVersiones')
          .withIndex('by_serieId_and_estado', (q) => q.eq('serieId', serie._id).eq('estado', 'vigente'))
          .first()
        return { serieId: serie._id, vigente }
      })
    )
    return { ronda, plan, revision, hitos, series, justificaciones, versiones, snapshots, audit }
  },
})

export const getPlanRondaDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
  },
})

export const getRevisionDatosDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
  },
})

export const listHitosRondaDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
})

export const listEvidenciaSeriesDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
})

export const listEvidenciaVersionesDefinition = defineAgentQuery({
  args: { apiKey: v.string(), serieId: v.id('sgcEvidenciaSeries') },
  handler: async (ctx, { apiKey, serieId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId', (q) => q.eq('serieId', serieId)).order('desc').collect()
  },
})

export const listAuditLogDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcAuditLog').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
})

export const listSnapshotsDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas'), tipoRegistro: v.string() },
  handler: async (ctx, { apiKey, rondaId, tipoRegistro }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db
      .query('sgcRegistroSnapshots')
      .withIndex('by_rondaId_and_tipoRegistro', (q) => q.eq('rondaId', rondaId).eq('tipoRegistro', tipoRegistro))
      .order('desc')
      .collect()
  },
})

export const listComunicacionesDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcComunicaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
})

export const listPublicacionesDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    const now = Date.now()
    return ctx.db
      .query('sgcPublicaciones')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId))
      .filter((q) => q.lte(q.field('visibleDesde'), now))
      .order('desc')
      .collect()
  },
})

export const getDownloadUrlDefinition = defineAgentQuery({
  args: { apiKey: v.string(), evidenciaVersionId: v.id('sgcEvidenciaVersiones') },
  handler: async (ctx, { apiKey, evidenciaVersionId }) => {
    await requireAgentAdmin(ctx, apiKey)
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) return null
    return ctx.storage.getUrl(version.storageId)
  },
})
