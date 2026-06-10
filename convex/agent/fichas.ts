import { v } from 'convex/values'
import { defineAgentQuery } from './definitions'
import { requireAgentAuth } from './shared'

export const getFichaByIdDefinition = defineAgentQuery({
  args: { apiKey: v.string(), fichaId: v.id('fichasRegistro') },
  handler: async (ctx, { apiKey, fichaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) return null

    const [acompanantes, analizadores, instrumentos] = await Promise.all([
      ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
    ])

    acompanantes.sort((a, b) => a.sortOrder - b.sortOrder)
    analizadores.sort((a, b) => a.sortOrder - b.sortOrder)
    instrumentos.sort((a, b) => a.sortOrder - b.sortOrder)

    return { ...ficha, acompanantes, analizadores, instrumentos }
  },
})

export const getFichaByRondaParticipanteDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaParticipanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { apiKey, rondaParticipanteId }) => {
    await requireAgentAuth(ctx, apiKey)
    const fichas = await ctx.db
      .query('fichasRegistro')
      .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', rondaParticipanteId))
      .collect()
    const ficha = fichas.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
    if (!ficha) return null

    const [acompanantes, analizadores, instrumentos] = await Promise.all([
      ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
    ])

    acompanantes.sort((a, b) => a.sortOrder - b.sortOrder)
    analizadores.sort((a, b) => a.sortOrder - b.sortOrder)
    instrumentos.sort((a, b) => a.sortOrder - b.sortOrder)

    return { ...ficha, acompanantes, analizadores, instrumentos }
  },
})

export const getFichaResumenByRondaParticipanteDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaParticipanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { apiKey, rondaParticipanteId }) => {
    await requireAgentAuth(ctx, apiKey)
    const fichas = await ctx.db
      .query('fichasRegistro')
      .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', rondaParticipanteId))
      .collect()
    const ficha = fichas.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
    if (!ficha) return null
    return { id: ficha._id, rondaParticipanteId: ficha.rondaParticipanteId, estado: ficha.estado }
  },
})
