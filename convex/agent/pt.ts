import { v } from 'convex/values'
import { defineAgentQuery } from './definitions'
import { requireAgentAuth } from './shared'

export const listPTItemsDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const items = await ctx.db
      .query('rondaPtItems')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    items.sort((a, b) => {
      if (a.contaminante !== b.contaminante) return a.contaminante.localeCompare(b.contaminante)
      return a.sortOrder - b.sortOrder
    })
    return items
  },
})

export const listPTSampleGroupsDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const groups = await ctx.db
      .query('rondaPtSampleGroups')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    groups.sort((a, b) => a.sortOrder - b.sortOrder)
    return groups
  },
})

export const listEnviosPTRoundDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const envios = await ctx.db
      .query('enviosPt')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()

    const submitted = envios.filter((e) => e.finalSubmittedAt !== undefined && e.finalSubmittedAt !== null)

    const [items, sampleGroups, participantes] = await Promise.all([
      ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('rondaPtSampleGroups').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ])

    const itemMap = new Map(items.map((i) => [i._id, i]))
    const groupMap = new Map(sampleGroups.map((g) => [g._id, g]))
    const participanteMap = new Map(participantes.map((p) => [p._id, p]))

    const exported = submitted
      .map((e) => {
        const item = itemMap.get(e.ptItemId)
        const group = groupMap.get(e.sampleGroupId)
        const participante = participanteMap.get(e.rondaParticipanteId)
        if (!item || !group || !participante) return null

        return {
          pollutant: item.contaminante.toLowerCase(),
          run: item.runCode,
          level: item.levelLabel,
          participant_id: participante.participantCode ?? '',
          replicate: participante.replicateCode ?? 0,
          sample_group: group.sampleGroup,
          d1: e.d1 ?? null,
          d2: e.d2 ?? null,
          d3: e.d3 ?? null,
          mean_value: e.meanValue,
          sd_value: e.sdValue,
          ux: e.ux ?? null,
          k: e.k ?? null,
          ux_exp: e.uxExp ?? null,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    exported.sort((a, b) => {
      if (a.pollutant !== b.pollutant) return a.pollutant.localeCompare(b.pollutant)
      if (a.run !== b.run) return a.run.localeCompare(b.run)
      if (a.level !== b.level) return a.level.localeCompare(b.level)
      if (a.participant_id !== b.participant_id) return a.participant_id.localeCompare(b.participant_id)
      if (a.replicate !== b.replicate) return a.replicate - b.replicate
      return a.sample_group.localeCompare(b.sample_group)
    })

    return exported
  },
})

export const listAllEnviosPTDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const [envios, items, sampleGroups, participantes] = await Promise.all([
      ctx.db.query('enviosPt').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('rondaPtSampleGroups').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ])

    const itemMap = new Map(items.map((item) => [item._id, item]))
    const groupMap = new Map(sampleGroups.map((group) => [group._id, group]))
    const participanteMap = new Map(participantes.map((participante) => [participante._id, participante]))

    return envios
      .map((envio) => {
        const ptItem = itemMap.get(envio.ptItemId)
        const sampleGroup = groupMap.get(envio.sampleGroupId)
        const participante = participanteMap.get(envio.rondaParticipanteId)
        if (!ptItem || !sampleGroup || !participante) return null
        return { envio, ptItem, sampleGroup, participante }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
  },
})
