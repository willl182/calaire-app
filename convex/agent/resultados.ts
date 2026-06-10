import { v } from 'convex/values'
import { defineAgentQuery } from './definitions'
import { requireAgentAuth, contaminanteIdx } from './shared'

export const listResultadosDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) return []

    const contaminantes = await ctx.db
      .query('rondaContaminantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    contaminantes.sort((a, b) => contaminanteIdx(a.contaminante) - contaminanteIdx(b.contaminante))

    const participantes = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    participantes.sort((a, b) => a.invitadoAt - b.invitadoAt)

    const enviosAll = await ctx.db
      .query('envios')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()

    const envioIndex = new Map<string, typeof enviosAll[0]>()
    for (const e of enviosAll) {
      envioIndex.set(`${e.workosUserId}|${e.contaminante}|${e.nivel}`, e)
    }

    return contaminantes.map((rc) => {
      const niveles = Array.from({ length: rc.niveles }, (_, i) => {
        const nivelNum = i + 1
        const partData = participantes.map((p) => {
          const envio = envioIndex.get(`${p.workosUserId}|${rc.contaminante}|${nivelNum}`)
          return {
            email: p.email,
            userId: p.workosUserId,
            promedio: envio?.promedio ?? null,
            incertidumbre: envio?.incertidumbre ?? null,
            valores: envio?.valores ?? [],
          }
        })

        const vals = partData.map((p) => p.promedio).filter((v): v is number => v !== null)
        let media: number | null = null
        let desviacion: number | null = null
        let cv: number | null = null

        if (vals.length > 0) {
          media = vals.reduce((a, b) => a + b, 0) / vals.length
          if (vals.length > 1) {
            const variance = vals.reduce((acc, v) => acc + (v - media!) ** 2, 0) / (vals.length - 1)
            desviacion = Math.sqrt(variance)
            if (media !== 0) cv = (desviacion / Math.abs(media)) * 100
          }
        }

        return { nivel: nivelNum, participantes: partData, media, desviacion, cv }
      })

      return { contaminante: rc.contaminante, replicas: rc.replicas, niveles }
    })
  },
})

export const listResultadosRondaDefinition = defineAgentQuery({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')

    const contaminantes = await ctx.db
      .query('rondaContaminantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    const totalEsperado = contaminantes.reduce((sum, c) => sum + c.niveles, 0)

    const participantes = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    participantes.sort((a, b) => a.invitadoAt - b.invitadoAt)

    const enviosAll = await ctx.db
      .query('envios')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()

    const enviosPorUsuario = new Map<string, typeof enviosAll>()
    for (const e of enviosAll) {
      const list = enviosPorUsuario.get(e.workosUserId) ?? []
      list.push(e)
      enviosPorUsuario.set(e.workosUserId, list)
    }

    return participantes.map((p) => {
      const envios = enviosPorUsuario.get(p.workosUserId) ?? []
      const completados = envios.length
      const latest = envios.reduce<number | null>((max, e) => (max === null || e.updatedAt > max ? e.updatedAt : max), null)

      return {
        workos_user_id: p.workosUserId,
        email: p.email,
        completados,
        total_esperado: totalEsperado,
        porcentaje_completitud: totalEsperado > 0 ? Math.round((completados / totalEsperado) * 100) : 0,
        enviados_at: latest !== null ? new Date(latest).toISOString() : null,
        envios: envios.map((e) => ({
          ...e,
          submitted_at: new Date(e.submittedAt).toISOString(),
          updated_at: new Date(e.updatedAt).toISOString(),
        })),
      }
    })
  },
})
