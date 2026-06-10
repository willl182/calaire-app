import { v } from 'convex/values'
import { defineAgentQuery } from './definitions'
import { requireAgentAuth, contaminanteIdx, PENDING_PREFIX } from './shared'

export const listRondasDefinition = defineAgentQuery({
  args: { apiKey: v.string() },
  handler: async (ctx, { apiKey }) => {
    await requireAgentAuth(ctx, apiKey)
    const rondas = await ctx.db.query('rondas').order('desc').collect()
    const results = await Promise.all(
      rondas.map(async (ronda) => {
        const contaminantes = await ctx.db
          .query('rondaContaminantes')
          .withIndex('by_ronda', (q) => q.eq('rondaId', ronda._id))
          .collect()
        contaminantes.sort((a, b) => contaminanteIdx(a.contaminante) - contaminanteIdx(b.contaminante))
        const participantes = await ctx.db
          .query('rondaParticipantes')
          .withIndex('by_ronda', (q) => q.eq('rondaId', ronda._id))
          .collect()
        return {
          ...ronda,
          contaminantes,
          participantes_planeados: participantes.length,
          participantes_asignados: participantes.filter((p) => !p.workosUserId.startsWith(PENDING_PREFIX)).length,
        }
      })
    )
    return results
  },
})

export const getRondaDefinition = defineAgentQuery({
  args: { apiKey: v.string(), id: v.id('rondas') },
  handler: async (ctx, { apiKey, id }) => {
    await requireAgentAuth(ctx, apiKey)
    const ronda = await ctx.db.get(id)
    if (!ronda) return null
    const contaminantes = await ctx.db
      .query('rondaContaminantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', id))
      .collect()
    contaminantes.sort((a, b) => contaminanteIdx(a.contaminante) - contaminanteIdx(b.contaminante))
    return { ...ronda, contaminantes }
  },
})

export const getRondaByCodigoDefinition = defineAgentQuery({
  args: { apiKey: v.string(), codigo: v.string() },
  handler: async (ctx, { apiKey, codigo }) => {
    await requireAgentAuth(ctx, apiKey)
    const ronda = await ctx.db
      .query('rondas')
      .withIndex('by_codigo', (q) => q.eq('codigo', codigo))
      .unique()
    if (!ronda) return null
    const contaminantes = await ctx.db
      .query('rondaContaminantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', ronda._id))
      .collect()
    contaminantes.sort((a, b) => contaminanteIdx(a.contaminante) - contaminanteIdx(b.contaminante))
    return { ...ronda, contaminantes }
  },
})
