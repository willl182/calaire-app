import { v } from 'convex/values'
import { query, mutation, type QueryCtx, type MutationCtx } from './_generated/server'
import { Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// Agent auth helper
// ---------------------------------------------------------------------------

async function requireAgentAuth(ctx: QueryCtx | MutationCtx, apiKey: string): Promise<{ email: string; scopes: string[] }> {
  if (!apiKey || apiKey.length < 32) {
    throw new Error('Agent API key requerida.')
  }

  const hash = await cryptoHash(apiKey)
  const record = await ctx.db
    .query('agentApiKeys')
    .withIndex('by_api_key_hash', (q) => q.eq('apiKeyHash', hash))
    .unique()

  if (!record) {
    throw new Error('API key invalida.')
  }
  if (record.revokedAt != null) {
    throw new Error('API key revocada.')
  }
  if (record.expiresAt < Date.now()) {
    throw new Error('API key expirada.')
  }

  return { email: record.email, scopes: record.scopes }
}

async function requireAgentAdmin(ctx: QueryCtx | MutationCtx, apiKey: string): Promise<{ email: string; scopes: string[] }> {
  const agent = await requireAgentAuth(ctx, apiKey)
  if (!agent.scopes.includes('calaire.agent.admin')) {
    throw new Error('Scope calaire.agent.admin requerido para esta operacion.')
  }
  return agent
}

async function cryptoHash(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Constants (copied from rondas.ts for sort / logic parity)
// ---------------------------------------------------------------------------
const CONTAMINANTES_ORDER = ['CO', 'SO2', 'O3', 'NO', 'NO2'] as const
const PENDING_PREFIX = 'pendiente:'

function contaminanteIdx(c: string): number {
  return CONTAMINANTES_ORDER.indexOf(c as (typeof CONTAMINANTES_ORDER)[number])
}

function assertAllowedEstadoTransition(current: string, next: string) {
  if (current === next) return
  const transitions: Record<string, string[]> = {
    borrador: ['activa'],
    activa: ['documentacion_pendiente'],
    documentacion_pendiente: ['cerrada'],
    cerrada: ['documentacion_pendiente'],
  }
  if (!transitions[current]?.includes(next)) {
    throw new Error(`Transicion no permitida: ${current} -> ${next}`)
  }
}

// ---------------------------------------------------------------------------
// Rondas — read
// ---------------------------------------------------------------------------

export const listRondas = query({
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

export const getRonda = query({
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

export const getRondaByCodigo = query({
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

// ---------------------------------------------------------------------------
// Participantes — read
// ---------------------------------------------------------------------------

export const listParticipantes = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const rows = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    rows.sort((a, b) => a.invitadoAt - b.invitadoAt)

    const enviosPt = await ctx.db
      .query('enviosPt')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()

    const countMap = new Map<string, number>()
    for (const e of enviosPt) {
      countMap.set(e.rondaParticipanteId, (countMap.get(e.rondaParticipanteId) ?? 0) + 1)
    }

    return rows.map((p) => ({
      ...p,
      envios_count: countMap.get(p._id) ?? 0,
      estado: p.workosUserId.startsWith(PENDING_PREFIX) ? 'pendiente' : 'asignado',
      slot_token: p.workosUserId.startsWith(PENDING_PREFIX) ? p.workosUserId.slice(PENDING_PREFIX.length) : null,
    }))
  },
})

export const listParticipantesRondaResumen = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAuth(ctx, apiKey)
    const rows = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    rows.sort((a, b) => a.invitadoAt - b.invitadoAt)

    const enviosPt = await ctx.db
      .query('enviosPt')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()

    const enviosPtCount = new Map<string, number>()
    for (const envio of enviosPt) {
      enviosPtCount.set(envio.rondaParticipanteId, (enviosPtCount.get(envio.rondaParticipanteId) ?? 0) + 1)
    }

    return Promise.all(
      rows.map(async (p) => {
        const fichas = await ctx.db
          .query('fichasRegistro')
          .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', p._id))
          .collect()
        const ficha = fichas.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
        const workosUserId = p.workosUserId ?? ''
        const pendiente = workosUserId.startsWith(PENDING_PREFIX)

        return {
          ronda_participante_id: p._id,
          ronda_id: p.rondaId,
          email: p.email ?? '',
          workos_user_id: pendiente ? null : workosUserId,
          participant_profile: p.participantProfile ?? 'member',
          participant_code: p.participantCode ?? null,
          replicate_code: p.replicateCode ?? null,
          estado: pendiente ? 'pendiente' : 'reclamado',
          slot_token: pendiente ? workosUserId.slice(PENDING_PREFIX.length) : null,
          claimed_at: p.claimedAt ? new Date(p.claimedAt).toISOString() : null,
          invitado_at: new Date(p.invitadoAt).toISOString(),
          ficha_estado: ficha ? ficha.estado : 'no_iniciada',
          envios_pt_count: enviosPtCount.get(p._id) ?? 0,
        }
      })
    )
  },
})

export const listDirectorioParticipantes = query({
  args: { apiKey: v.string() },
  handler: async (ctx, { apiKey }) => {
    await requireAgentAuth(ctx, apiKey)
    const rows = await ctx.db.query('directorioParticipantes').collect()
    rows.sort((a, b) => {
      const nitCmp = a.nit.localeCompare(b.nit)
      if (nitCmp !== 0) return nitCmp
      return a.correo.localeCompare(b.correo)
    })

    const links = await ctx.db.query('rondaParticipantes').collect()
    const linkCount = new Map<string, number>()
    for (const link of links) {
      if (!link.directorioParticipanteId) continue
      const key = String(link.directorioParticipanteId)
      linkCount.set(key, (linkCount.get(key) ?? 0) + 1)
    }

    return rows.map((row) => ({
      id: row._id,
      nit: row.nit,
      correo: row.correo,
      nombre_laboratorio: row.nombreLaboratorio ?? null,
      nombre_responsable: row.nombreResponsable ?? null,
      cargo: row.cargo ?? null,
      ciudad: row.ciudad ?? null,
      departamento: row.departamento ?? null,
      telefono: row.telefono ?? null,
      workos_user_id: row.workosUserId ?? null,
      rondas_count: linkCount.get(String(row._id)) ?? 0,
      created_at: new Date(row.createdAt).toISOString(),
      updated_at: new Date(row.updatedAt).toISOString(),
    }))
  },
})

// ---------------------------------------------------------------------------
// Resultados — read
// ---------------------------------------------------------------------------

export const listResultados = query({
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

export const listResultadosRonda = query({
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

// ---------------------------------------------------------------------------
// PT — read
// ---------------------------------------------------------------------------

export const listPTItems = query({
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

export const listPTSampleGroups = query({
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

export const listEnviosPTRound = query({
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

export const listAllEnviosPT = query({
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

// ---------------------------------------------------------------------------
// Fichas — read
// ---------------------------------------------------------------------------

export const getFichaById = query({
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

export const getFichaByRondaParticipante = query({
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

export const getFichaResumenByRondaParticipante = query({
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

// ---------------------------------------------------------------------------
// SGC — read
// ---------------------------------------------------------------------------

export const getPanelSgc = query({
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

export const getPlanRonda = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
  },
})

export const getRevisionDatos = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
  },
})

export const listHitosRonda = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
})

export const listEvidenciaSeries = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
})

export const listEvidenciaVersiones = query({
  args: { apiKey: v.string(), serieId: v.id('sgcEvidenciaSeries') },
  handler: async (ctx, { apiKey, serieId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId', (q) => q.eq('serieId', serieId)).order('desc').collect()
  },
})

export const listAuditLog = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcAuditLog').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
})

export const listSnapshots = query({
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

export const listComunicaciones = query({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    await requireAgentAdmin(ctx, apiKey)
    return ctx.db.query('sgcComunicaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
})

export const listPublicaciones = query({
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

export const getDownloadUrl = query({
  args: { apiKey: v.string(), evidenciaVersionId: v.id('sgcEvidenciaVersiones') },
  handler: async (ctx, { apiKey, evidenciaVersionId }) => {
    await requireAgentAdmin(ctx, apiKey)
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) return null
    return ctx.storage.getUrl(version.storageId)
  },
})

// ---------------------------------------------------------------------------
// Rondas — mutations
// ---------------------------------------------------------------------------

export const createRonda = mutation({
  args: {
    apiKey: v.string(),
    codigo: v.string(),
    nombre: v.string(),
    estado: v.union(v.literal('borrador'), v.literal('activa'), v.literal('documentacion_pendiente'), v.literal('cerrada')),
  },
  handler: async (ctx, { apiKey, codigo, nombre, estado }) => {
    await requireAgentAdmin(ctx, apiKey)
    const existing = await ctx.db
      .query('rondas')
      .withIndex('by_codigo', (q) => q.eq('codigo', codigo))
      .first()
    if (existing) throw new Error('Ya existe una ronda con ese codigo.')
    return ctx.db.insert('rondas', { codigo, nombre, estado, createdAt: Date.now() })
  },
})

export const createConfiguredRonda = mutation({
  args: {
    apiKey: v.string(),
    codigo: v.string(),
    nombre: v.string(),
    contaminantes: v.array(v.object({
      contaminante: v.union(v.literal('CO'), v.literal('SO2'), v.literal('O3'), v.literal('NO'), v.literal('NO2')),
      niveles: v.number(),
      replicas: v.union(v.literal(2), v.literal(3)),
    })),
    slots: v.array(v.object({
      workosUserId: v.string(),
      email: v.string(),
      participantProfile: v.union(v.literal('member'), v.literal('member_special')),
    })),
  },
  handler: async (ctx, { apiKey, codigo, nombre, contaminantes, slots }) => {
    await requireAgentAdmin(ctx, apiKey)
    const existing = await ctx.db
      .query('rondas')
      .withIndex('by_codigo', (q) => q.eq('codigo', codigo))
      .first()
    if (existing) throw new Error('Ya existe una ronda con ese codigo.')

    const now = Date.now()
    const rondaId = await ctx.db.insert('rondas', { codigo, nombre, estado: 'borrador', createdAt: now })

    await ctx.db.insert('rondaPtSampleGroups', { rondaId, sampleGroup: 'A', sortOrder: 1, createdAt: now })

    await Promise.all(contaminantes.map((item) =>
      ctx.db.insert('rondaContaminantes', { rondaId, contaminante: item.contaminante, niveles: item.niveles, replicas: item.replicas })
    ))

    for (const slot of slots) {
      const participantCode = await generateUniqueParticipantCode(ctx, rondaId)
      const directorio = await getDirectorioByLookup(ctx, slot.email)
      await ctx.db.insert('rondaParticipantes', {
        rondaId,
        workosUserId: slot.workosUserId,
        email: slot.email.trim().toLowerCase(),
        directorioParticipanteId: directorio?._id ?? null,
        participantProfile: slot.participantProfile,
        participantCode,
        invitadoAt: now,
      })
    }

    return rondaId
  },
})

export const updateRondaEstado = mutation({
  args: {
    apiKey: v.string(),
    id: v.id('rondas'),
    estado: v.union(v.literal('borrador'), v.literal('activa'), v.literal('documentacion_pendiente'), v.literal('cerrada')),
  },
  handler: async (ctx, { apiKey, id, estado }) => {
    await requireAgentAdmin(ctx, apiKey)
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    assertAllowedEstadoTransition(ronda.estado, estado)
    await ctx.db.patch(id, { estado })
  },
})

export const updateRondaConfig = mutation({
  args: {
    apiKey: v.string(),
    id: v.id('rondas'),
    codigo: v.string(),
    nombre: v.string(),
    contaminantes: v.array(v.object({
      contaminante: v.union(v.literal('CO'), v.literal('SO2'), v.literal('O3'), v.literal('NO'), v.literal('NO2')),
      niveles: v.number(),
      replicas: v.union(v.literal(2), v.literal(3)),
    })),
  },
  handler: async (ctx, { apiKey, id, codigo, nombre, contaminantes }) => {
    await requireAgentAdmin(ctx, apiKey)
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede editar una ronda cerrada.')

    const sameCode = await ctx.db.query('rondas').withIndex('by_codigo', (q) => q.eq('codigo', codigo)).first()
    if (sameCode && sameCode._id !== id) throw new Error('Ya existe una ronda con ese codigo.')

    await ctx.db.patch(id, { codigo, nombre })

    const envios = await ctx.db.query('envios').withIndex('by_ronda', (q) => q.eq('rondaId', id)).first()
    if (envios) throw new Error('No se puede modificar la configuracion de contaminantes porque la ronda ya tiene envios.')
    const enviosPt = await ctx.db.query('enviosPt').withIndex('by_ronda', (q) => q.eq('rondaId', id)).first()
    if (enviosPt) throw new Error('No se puede modificar la configuracion de contaminantes porque la ronda ya tiene envios PT.')

    const existing = await ctx.db.query('rondaContaminantes').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect()
    await Promise.all(existing.map((row) => ctx.db.delete(row._id)))
    await Promise.all(contaminantes.map((item) =>
      ctx.db.insert('rondaContaminantes', { rondaId: id, contaminante: item.contaminante, niveles: item.niveles, replicas: item.replicas })
    ))
  },
})

export const updateRondaBasicInfo = mutation({
  args: {
    apiKey: v.string(),
    id: v.id('rondas'),
    codigo: v.string(),
    nombre: v.string(),
  },
  handler: async (ctx, { apiKey, id, codigo, nombre }) => {
    await requireAgentAdmin(ctx, apiKey)
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede editar una ronda cerrada.')

    const sameCode = await ctx.db.query('rondas').withIndex('by_codigo', (q) => q.eq('codigo', codigo)).first()
    if (sameCode && sameCode._id !== id) throw new Error('Ya existe una ronda con ese codigo.')

    await ctx.db.patch(id, { codigo, nombre })
  },
})

export const deleteRonda = mutation({
  args: { apiKey: v.string(), id: v.id('rondas') },
  handler: async (ctx, { apiKey, id }) => {
    await requireAgentAdmin(ctx, apiKey)
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')

    const participantes = await ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect()
    for (const participante of participantes) {
      const fichas = await ctx.db
        .query('fichasRegistro')
        .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', participante._id))
        .collect()
      for (const ficha of fichas) {
        const [acompanantes, analizadores, instrumentos] = await Promise.all([
          ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
          ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
          ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
        ])
        await Promise.all([
          ...acompanantes.map((row) => ctx.db.delete(row._id)),
          ...analizadores.map((row) => ctx.db.delete(row._id)),
          ...instrumentos.map((row) => ctx.db.delete(row._id)),
        ])
        await ctx.db.delete(ficha._id)
      }
    }

    const [contaminantes, ptItems, sampleGroups, envios, enviosPt] = await Promise.all([
      ctx.db.query('rondaContaminantes').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('rondaPtSampleGroups').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('envios').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('enviosPt').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
    ])

    await Promise.all([
      ...enviosPt.map((row) => ctx.db.delete(row._id)),
      ...envios.map((row) => ctx.db.delete(row._id)),
      ...sampleGroups.map((row) => ctx.db.delete(row._id)),
      ...ptItems.map((row) => ctx.db.delete(row._id)),
      ...contaminantes.map((row) => ctx.db.delete(row._id)),
      ...participantes.map((row) => ctx.db.delete(row._id)),
    ])

    await ctx.db.delete(id)
    return ronda.nombre
  },
})

export const addContaminante = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    contaminante: v.union(v.literal('CO'), v.literal('SO2'), v.literal('O3'), v.literal('NO'), v.literal('NO2')),
    niveles: v.number(),
    replicas: v.union(v.literal(2), v.literal(3)),
  },
  handler: async (ctx, { apiKey, rondaId, contaminante, niveles, replicas }) => {
    await requireAgentAdmin(ctx, apiKey)
    const existing = await ctx.db
      .query('rondaContaminantes')
      .withIndex('by_ronda_contaminante', (q) => q.eq('rondaId', rondaId).eq('contaminante', contaminante))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { niveles, replicas })
      return existing._id
    }
    return ctx.db.insert('rondaContaminantes', { rondaId, contaminante, niveles, replicas })
  },
})

// ---------------------------------------------------------------------------
// Participantes — mutations
// ---------------------------------------------------------------------------

export const addParticipante = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    workosUserId: v.string(),
    email: v.string(),
    participantProfile: v.union(v.literal('member'), v.literal('member_special')),
    participantCode: v.optional(v.string()),
    replicateCode: v.optional(v.number()),
  },
  handler: async (ctx, { apiKey, rondaId, workosUserId, email, participantProfile, participantCode, replicateCode }) => {
    await requireAgentAdmin(ctx, apiKey)
    const existing = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', workosUserId))
      .unique()
    if (existing) throw new Error('Este usuario ya esta asignado a esta ronda.')

    const assignedParticipantCode = participantCode ?? await generateUniqueParticipantCode(ctx, rondaId)
    const directorio = await getDirectorioByLookup(ctx, email)

    return ctx.db.insert('rondaParticipantes', {
      rondaId,
      workosUserId,
      email: email.trim().toLowerCase(),
      directorioParticipanteId: directorio?._id ?? null,
      participantProfile,
      participantCode: assignedParticipantCode,
      replicateCode,
      invitadoAt: Date.now(),
    })
  },
})

export const updateParticipanteAdmin = mutation({
  args: {
    apiKey: v.string(),
    participanteId: v.id('rondaParticipantes'),
    email: v.string(),
    participantProfile: v.union(v.literal('member'), v.literal('member_special')),
    participantCode: v.union(v.string(), v.null()),
    replicateCode: v.union(v.number(), v.null()),
  },
  handler: async (ctx, { apiKey, participanteId, email, participantProfile, participantCode, replicateCode }) => {
    await requireAgentAdmin(ctx, apiKey)
    const participante = await ctx.db.get(participanteId)
    if (!participante) throw new Error('Participante no encontrado.')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) throw new Error('El correo es obligatorio.')

    const normalizedCode = participantCode?.trim().toUpperCase() || null
    if (normalizedCode) {
      const participantes = await ctx.db
        .query('rondaParticipantes')
        .withIndex('by_ronda', (q) => q.eq('rondaId', participante.rondaId))
        .collect()
      const duplicate = participantes.find((p) => p._id !== participanteId && p.participantCode === normalizedCode)
      if (duplicate) throw new Error('Ya existe otro cupo con ese codigo en la ronda.')
    }

    await ctx.db.patch(participanteId, {
      email: normalizedEmail,
      participantProfile,
      participantCode: normalizedCode,
      replicateCode,
    })

    const directorio = await getDirectorioByLookup(ctx, normalizedEmail)
    if (directorio) {
      await ctx.db.patch(participanteId, { directorioParticipanteId: directorio._id })
    }
  },
})

export const removeParticipante = mutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas'), participanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { apiKey, rondaId, participanteId }) => {
    await requireAgentAdmin(ctx, apiKey)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede modificar la lista de una ronda cerrada.')

    const participante = await ctx.db.get(participanteId)
    if (!participante || participante.rondaId !== rondaId) throw new Error('No se encontro el participante.')

    const enviosPt = await ctx.db
      .query('enviosPt')
      .withIndex('by_participante', (q) => q.eq('rondaParticipanteId', participanteId))
      .collect()
    const envios = await ctx.db
      .query('envios')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', participante.workosUserId))
      .collect()
    const fichas = await ctx.db
      .query('fichasRegistro')
      .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', participanteId))
      .collect()

    for (const ficha of fichas) {
      const [acompanantes, analizadores, instrumentos] = await Promise.all([
        ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
        ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
        ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ])
      await Promise.all([
        ...acompanantes.map((row) => ctx.db.delete(row._id)),
        ...analizadores.map((row) => ctx.db.delete(row._id)),
        ...instrumentos.map((row) => ctx.db.delete(row._id)),
      ])
      await ctx.db.delete(ficha._id)
    }

    await Promise.all([
      ...enviosPt.map((row) => ctx.db.delete(row._id)),
      ...envios.map((row) => ctx.db.delete(row._id)),
    ])
    await ctx.db.delete(participanteId)
  },
})

// ---------------------------------------------------------------------------
// PT — mutations
// ---------------------------------------------------------------------------

export const createPTItem = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    contaminante: v.union(v.literal('CO'), v.literal('SO2'), v.literal('O3'), v.literal('NO'), v.literal('NO2')),
    runCode: v.string(),
    levelLabel: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, { apiKey, rondaId, contaminante, runCode, levelLabel, sortOrder }) => {
    await requireAgentAdmin(ctx, apiKey)
    const id = await ctx.db.insert('rondaPtItems', { rondaId, contaminante, runCode, levelLabel, sortOrder, createdAt: Date.now() })
    return ctx.db.get(id)
  },
})

export const createPTItemsBulk = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    contaminante: v.union(v.literal('CO'), v.literal('SO2'), v.literal('O3'), v.literal('NO'), v.literal('NO2')),
    items: v.array(v.object({ runCode: v.string(), levelLabel: v.string(), sortOrder: v.number() })),
  },
  handler: async (ctx, { apiKey, rondaId, contaminante, items }) => {
    await requireAgentAdmin(ctx, apiKey)
    const now = Date.now()
    const ids: Id<'rondaPtItems'>[] = []
    for (const item of items) {
      const id = await ctx.db.insert('rondaPtItems', { rondaId, contaminante, runCode: item.runCode, levelLabel: item.levelLabel, sortOrder: item.sortOrder, createdAt: now })
      ids.push(id)
    }
    return Promise.all(ids.map((id) => ctx.db.get(id)))
  },
})

export const createPTSampleGroup = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    sampleGroup: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, { apiKey, rondaId, sampleGroup, sortOrder }) => {
    await requireAgentAdmin(ctx, apiKey)
    const id = await ctx.db.insert('rondaPtSampleGroups', { rondaId, sampleGroup, sortOrder, createdAt: Date.now() })
    return ctx.db.get(id)
  },
})

// ---------------------------------------------------------------------------
// SGC — mutations
// ---------------------------------------------------------------------------

const FORMATOS_ARCHIVO = ['F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-14'] as const
const REVISION_CHECKS = [
  'participantes_revisados',
  'fichas_revisadas',
  'envios_finales_revisados',
  'metricas_revisadas',
  'evidencias_revisadas',
  'inconsistencias_resueltas',
] as const

async function writeAudit(
  ctx: MutationCtx,
  args: {
    rondaId: Id<'rondas'>
    actor: string
    evento: string
    detalle?: string | null
    targetTipo?: string | null
    targetId?: string | null
  }
) {
  await ctx.db.insert('sgcAuditLog', {
    rondaId: args.rondaId,
    actor: args.actor,
    evento: args.evento,
    detalle: args.detalle ?? null,
    targetTipo: args.targetTipo ?? null,
    targetId: args.targetId ?? null,
    createdAt: Date.now(),
  })
}

export const createOrUpdatePlanRonda = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    bloques: v.record(v.string(), v.string()),
    camposEstructurados: v.record(v.string(), v.string()),
    motivoRevision: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const existing = await ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).first()
    if (existing?.estado === 'finalizado' && !args.motivoRevision?.trim()) {
      throw new Error('Editar un plan finalizado exige motivo.')
    }
    if (existing) {
      await ctx.db.patch(existing._id, {
        bloques: args.bloques,
        camposEstructurados: args.camposEstructurados,
        motivoRevision: args.motivoRevision ?? existing.motivoRevision ?? null,
        estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado,
        updatedAt: now,
        updatedBy: actor,
      })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.plan.actualizado', targetTipo: 'sgcPlanRonda', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcPlanRonda', {
      rondaId: args.rondaId,
      estado: 'borrador',
      bloques: args.bloques,
      camposEstructurados: args.camposEstructurados,
      motivoRevision: args.motivoRevision ?? null,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.plan.creado', targetTipo: 'sgcPlanRonda', targetId: id })
    return id
  },
})

export const finalizarPlanRonda = mutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const plan = await ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
    if (!plan) throw new Error('No existe plan de ronda.')
    const now = Date.now()
    await ctx.db.patch(plan._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.plan.finalizado', targetTipo: 'sgcPlanRonda', targetId: plan._id })
  },
})

export const createOrUpdateRevisionDatos = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    checks: v.record(v.string(), v.object({ cumple: v.boolean(), observacion: v.union(v.string(), v.null()) })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const existing = await ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).first()
    const checks = Object.fromEntries(
      Object.entries(args.checks).map(([key, value]) => [key, { ...value, updatedAt: now, updatedBy: actor }])
    )
    if (existing) {
      await ctx.db.patch(existing._id, { checks, metricas: args.metricas, estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado, updatedAt: now, updatedBy: actor })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.revision.actualizada', targetTipo: 'sgcRevisionDatos', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcRevisionDatos', {
      rondaId: args.rondaId,
      estado: 'borrador',
      checks,
      metricas: args.metricas,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.revision.creada', targetTipo: 'sgcRevisionDatos', targetId: id })
    return id
  },
})

export const finalizarRevisionDatos = mutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const revision = await ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
    if (!revision) throw new Error('No existe revision de datos.')
    for (const [key, check] of Object.entries(revision.checks)) {
      if (!check.cumple && !check.observacion?.trim()) {
        throw new Error(`El check ${key} no cumple y requiere observacion.`)
      }
    }
    const now = Date.now()
    await ctx.db.patch(revision._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.revision.finalizada', targetTipo: 'sgcRevisionDatos', targetId: revision._id })
  },
})

export const createHitoRonda = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    codigo: v.string(),
    nombre: v.string(),
    fase: v.string(),
    fechaObjetivo: v.union(v.string(), v.null()),
    fechaReal: v.union(v.string(), v.null()),
    estado: v.union(v.literal('pendiente'), v.literal('en_progreso'), v.literal('completado'), v.literal('vencido'), v.literal('cancelado'), v.literal('no_aplica')),
    responsable: v.string(),
    visibleParticipante: v.boolean(),
    bloqueaCierre: v.boolean(),
    formatoRelacionado: v.union(v.string(), v.null()),
    notas: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const id = await ctx.db.insert('sgcHitosRonda', {
      rondaId: args.rondaId,
      codigo: args.codigo,
      nombre: args.nombre,
      fase: args.fase,
      fechaObjetivo: args.fechaObjetivo,
      fechaReal: args.fechaReal,
      estado: args.estado,
      responsable: args.responsable,
      visibleParticipante: args.visibleParticipante,
      bloqueaCierre: args.bloqueaCierre,
      formatoRelacionado: args.formatoRelacionado,
      notas: args.notas,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.hito.creado', targetTipo: 'sgcHitosRonda', targetId: id })
    return id
  },
})

export const updateHitoRonda = mutation({
  args: {
    apiKey: v.string(),
    hitoId: v.id('sgcHitosRonda'),
    codigo: v.string(),
    nombre: v.string(),
    fase: v.string(),
    fechaObjetivo: v.union(v.string(), v.null()),
    fechaReal: v.union(v.string(), v.null()),
    estado: v.union(v.literal('pendiente'), v.literal('en_progreso'), v.literal('completado'), v.literal('vencido'), v.literal('cancelado'), v.literal('no_aplica')),
    responsable: v.string(),
    visibleParticipante: v.boolean(),
    bloqueaCierre: v.boolean(),
    formatoRelacionado: v.union(v.string(), v.null()),
    notas: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const hito = await ctx.db.get(args.hitoId)
    if (!hito) throw new Error('Hito no encontrado.')
    await ctx.db.patch(args.hitoId, {
      codigo: args.codigo,
      nombre: args.nombre,
      fase: args.fase,
      fechaObjetivo: args.fechaObjetivo,
      fechaReal: args.fechaReal,
      estado: args.estado,
      responsable: args.responsable,
      visibleParticipante: args.visibleParticipante,
      bloqueaCierre: args.bloqueaCierre,
      formatoRelacionado: args.formatoRelacionado,
      notas: args.notas,
      updatedAt: Date.now(),
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: hito.rondaId, actor, evento: 'sgc.hito.actualizado', targetTipo: 'sgcHitosRonda', targetId: args.hitoId })
  },
})

export const createEvidenciaSeries = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    formato: v.union(
      v.literal('F-PPSEA-03'), v.literal('F-PSEA-05'), v.literal('F-PSEA-05A'), v.literal('F-PSEA-06'),
      v.literal('F-PSEA-07'), v.literal('F-PSEA-08'), v.literal('F-PSEA-09'), v.literal('F-PSEA-10'),
      v.literal('F-PSEA-11'), v.literal('F-PSEA-12'), v.literal('F-PSEA-13'), v.literal('F-PSEA-14')
    ),
    seccion: v.union(v.string(), v.null()),
    nombre: v.string(),
    requerida: v.boolean(),
    publicaParticipante: v.boolean(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const existing = await ctx.db
      .query('sgcEvidenciaSeries')
      .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', args.rondaId).eq('formato', args.formato))
      .first()
    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { nombre: args.nombre, requerida: args.requerida, publicaParticipante: args.publicaParticipante, seccion: args.seccion, updatedAt: now, updatedBy: actor })
      return existing._id
    }
    const id = await ctx.db.insert('sgcEvidenciaSeries', {
      rondaId: args.rondaId,
      formato: args.formato,
      seccion: args.seccion,
      nombre: args.nombre,
      requerida: args.requerida,
      publicaParticipante: args.publicaParticipante,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.evidencia.serie_creada', targetTipo: 'sgcEvidenciaSeries', targetId: id })
    return id
  },
})

export const registrarEvidenciaVersion = mutation({
  args: {
    apiKey: v.string(),
    serieId: v.id('sgcEvidenciaSeries'),
    storageId: v.id('_storage'),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    hash: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const serie = await ctx.db.get(args.serieId)
    if (!serie) throw new Error('Serie de evidencia no encontrada.')
    if (!FORMATOS_ARCHIVO.includes(serie.formato as (typeof FORMATOS_ARCHIVO)[number])) {
      throw new Error('Este formato no admite evidencia de archivo en Fase 1.')
    }
    if (args.size > 10 * 1024 * 1024) throw new Error('El archivo excede el limite de 10 MB.')
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'image/png', 'image/jpeg']
    if (!allowed.includes(args.contentType)) throw new Error('Tipo de archivo no permitido.')

    const anteriores = await ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId', (q) => q.eq('serieId', args.serieId)).collect()
    for (const anterior of anteriores.filter((v0) => v0.estado === 'vigente')) {
      await ctx.db.patch(anterior._id, { estado: 'reemplazada', updatedAt: Date.now(), updatedBy: actor })
    }
    const now = Date.now()
    const id = await ctx.db.insert('sgcEvidenciaVersiones', {
      serieId: args.serieId,
      rondaId: serie.rondaId,
      storageId: args.storageId,
      version: anteriores.length + 1,
      estado: 'vigente',
      fileName: args.fileName,
      contentType: args.contentType,
      size: args.size,
      hash: args.hash,
      motivoRetiro: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: serie.rondaId, actor, evento: 'sgc.evidencia.version_registrada', targetTipo: 'sgcEvidenciaVersiones', targetId: id })
    return id
  },
})

export const retirarEvidenciaVersion = mutation({
  args: { apiKey: v.string(), evidenciaVersionId: v.id('sgcEvidenciaVersiones'), motivo: v.string() },
  handler: async (ctx, { apiKey, evidenciaVersionId, motivo }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    if (!motivo.trim()) throw new Error('Retirar evidencia exige motivo.')
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) throw new Error('Version no encontrada.')
    await ctx.db.patch(evidenciaVersionId, { estado: 'retirada', motivoRetiro: motivo, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: version.rondaId, actor, evento: 'sgc.evidencia.version_retirada', detalle: motivo, targetTipo: 'sgcEvidenciaVersiones', targetId: evidenciaVersionId })
  },
})

export const upsertJustificacion = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    formato: v.union(v.literal('F-PSEA-05'), v.literal('F-PSEA-05A'), v.literal('F-PSEA-12')),
    alcance: v.string(),
    razon: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    if (!args.razon.trim()) throw new Error('La justificacion exige una razon documentada.')
    const now = Date.now()
    const anteriores = await ctx.db
      .query('sgcJustificaciones')
      .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', args.rondaId).eq('formato', args.formato))
      .collect()
    for (const anterior of anteriores.filter((row) => row.estado === 'vigente')) {
      await ctx.db.patch(anterior._id, { estado: 'reemplazada', updatedAt: now, updatedBy: actor })
    }
    const id = await ctx.db.insert('sgcJustificaciones', {
      rondaId: args.rondaId,
      formato: args.formato,
      alcance: args.alcance.trim() || 'ronda',
      razon: args.razon.trim(),
      estado: 'vigente',
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.justificacion.registrada', detalle: args.formato, targetTipo: 'sgcJustificaciones', targetId: id })
    return id
  },
})

export const retirarJustificacion = mutation({
  args: { apiKey: v.string(), justificacionId: v.id('sgcJustificaciones'), motivo: v.string() },
  handler: async (ctx, { apiKey, justificacionId, motivo }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    if (!motivo.trim()) throw new Error('Retirar una justificacion exige motivo.')
    const justificacion = await ctx.db.get(justificacionId)
    if (!justificacion) throw new Error('Justificacion no encontrada.')
    await ctx.db.patch(justificacionId, { estado: 'retirada', updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: justificacion.rondaId, actor, evento: 'sgc.justificacion.retirada', detalle: motivo, targetTipo: 'sgcJustificaciones', targetId: justificacionId })
  },
})

export const createComunicacion = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const id = await ctx.db.insert('sgcComunicaciones', {
      rondaId: args.rondaId,
      tipo: args.tipo,
      destinatario: args.destinatario,
      asunto: args.asunto,
      notas: args.notas,
      fecha: args.fecha,
      responsable: args.responsable,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.comunicacion.creada', targetTipo: 'sgcComunicaciones', targetId: id })
    return id
  },
})

export const updateComunicacion = mutation({
  args: {
    apiKey: v.string(),
    comunicacionId: v.id('sgcComunicaciones'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const comunicacion = await ctx.db.get(args.comunicacionId)
    if (!comunicacion) throw new Error('Comunicacion no encontrada.')
    await ctx.db.patch(args.comunicacionId, {
      tipo: args.tipo,
      destinatario: args.destinatario,
      asunto: args.asunto,
      notas: args.notas,
      fecha: args.fecha,
      responsable: args.responsable,
      updatedAt: Date.now(),
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: comunicacion.rondaId, actor, evento: 'sgc.comunicacion.actualizada', targetTipo: 'sgcComunicaciones', targetId: args.comunicacionId })
  },
})

export const deleteComunicacion = mutation({
  args: { apiKey: v.string(), comunicacionId: v.id('sgcComunicaciones') },
  handler: async (ctx, { apiKey, comunicacionId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const comunicacion = await ctx.db.get(comunicacionId)
    if (!comunicacion) throw new Error('Comunicacion no encontrada.')
    await ctx.db.delete(comunicacionId)
    await writeAudit(ctx, { rondaId: comunicacion.rondaId, actor, evento: 'sgc.comunicacion.eliminada', targetTipo: 'sgcComunicaciones', targetId: comunicacionId })
  },
})

export const createPublicacion = mutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    titulo: v.string(),
    contenido: v.string(),
    tipo: v.union(v.literal('resultado'), v.literal('comunicado'), v.literal('cronograma'), v.literal('evidencia')),
    visibleDesde: v.number(),
    visibleHasta: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const id = await ctx.db.insert('sgcPublicaciones', {
      rondaId: args.rondaId,
      titulo: args.titulo,
      contenido: args.contenido,
      tipo: args.tipo,
      visibleDesde: args.visibleDesde,
      visibleHasta: args.visibleHasta,
      createdAt: now,
      createdBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.publicacion.creada', targetTipo: 'sgcPublicaciones', targetId: id })
    return id
  },
})

export const deletePublicacion = mutation({
  args: { apiKey: v.string(), publicacionId: v.id('sgcPublicaciones') },
  handler: async (ctx, { apiKey, publicacionId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const pub = await ctx.db.get(publicacionId)
    if (!pub) throw new Error('Publicacion no encontrada.')
    await ctx.db.delete(publicacionId)
    await writeAudit(ctx, { rondaId: pub.rondaId, actor, evento: 'sgc.publicacion.eliminada', targetTipo: 'sgcPublicaciones', targetId: publicacionId })
  },
})

export const inicializarPanelSgc = mutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const now = Date.now()
    const existingRevision = await ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
    if (!existingRevision) {
      const checks: Record<string, { cumple: boolean; observacion: string | null; updatedAt: number; updatedBy: string }> = {}
      for (const key of REVISION_CHECKS) checks[key] = { cumple: false, observacion: null, updatedAt: now, updatedBy: actor }
      checks.f_psea_11_no_aplica = { cumple: true, observacion: 'No aplica en Fase 1 inicial.', updatedAt: now, updatedBy: actor }
      await ctx.db.insert('sgcRevisionDatos', {
        rondaId,
        estado: 'borrador',
        checks,
        metricas: {},
        finalizadoAt: null,
        finalizadoBy: null,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      })
    }
    for (const formato of FORMATOS_ARCHIVO) {
      const existing = await ctx.db
        .query('sgcEvidenciaSeries')
        .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', rondaId).eq('formato', formato as string))
        .first()
      if (!existing) {
        await ctx.db.insert('sgcEvidenciaSeries', {
          rondaId,
          formato: formato as string,
          seccion: null,
          nombre: formato as string,
          requerida: true,
          publicaParticipante: false,
          createdAt: now,
          createdBy: actor,
          updatedAt: now,
          updatedBy: actor,
        })
      }
    }
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.panel.inicializado' })
  },
})

export const transitionRondaToDocumentacionPendiente = mutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'activa') throw new Error('Solo una ronda activa puede pasar a documentacion pendiente.')
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.documentacion_pendiente' })
  },
})

export const transitionRondaToCerrada = mutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'documentacion_pendiente') throw new Error('Solo una ronda en documentacion pendiente puede cerrarse.')
    await ctx.db.patch(rondaId, { estado: 'cerrada' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.cerrada' })
  },
})

export const reabrirRondaSgc = mutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas'), motivo: v.string() },
  handler: async (ctx, { apiKey, rondaId, motivo }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    if (!motivo.trim()) throw new Error('Reabrir una ronda cerrada exige motivo.')
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'cerrada') throw new Error('Solo una ronda cerrada puede reabrirse.')
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.reabierta', detalle: motivo })
  },
})

// ---------------------------------------------------------------------------
// Helpers (copied from rondas.ts)
// ---------------------------------------------------------------------------

const PARTICIPANT_CODE_LENGTH = 6
const PARTICIPANT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PARTICIPANT_CODE_MAX_ATTEMPTS = 20

function generateParticipantCode(): string {
  let code = ''
  for (let i = 0; i < PARTICIPANT_CODE_LENGTH; i += 1) {
    const idx = Math.floor(Math.random() * PARTICIPANT_CODE_ALPHABET.length)
    code += PARTICIPANT_CODE_ALPHABET[idx]
  }
  return code
}

async function generateUniqueParticipantCode(ctx: MutationCtx, rondaId: Id<'rondas'>): Promise<string> {
  const existingCodes = new Set<string>()
  const participantes = ctx.db
    .query('rondaParticipantes')
    .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))

  for await (const participante of participantes) {
    if (participante.participantCode) {
      existingCodes.add(participante.participantCode)
    }
  }

  for (let attempt = 0; attempt < PARTICIPANT_CODE_MAX_ATTEMPTS; attempt += 1) {
    const code = generateParticipantCode()
    if (!existingCodes.has(code)) {
      return code
    }
  }

  throw new Error('No se pudo generar un codigo de participante unico para esta ronda.')
}

async function getDirectorioByLookup(ctx: QueryCtx | MutationCtx, lookup: string) {
  const normalized = lookup.trim().toLowerCase()
  if (!normalized) return null

  const nitMatch = await ctx.db
    .query('directorioParticipantes')
    .withIndex('by_nit', (q) => q.eq('nit', lookup.trim()))
    .first()
  if (nitMatch) return nitMatch

  return ctx.db
    .query('directorioParticipantes')
    .withIndex('by_correo', (q) => q.eq('correo', normalized))
    .first()
}
