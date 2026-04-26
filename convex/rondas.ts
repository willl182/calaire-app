import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PENDING_PREFIX = 'pendiente:'
const CONTAMINANTES_ORDER = ['CO', 'SO2', 'O3', 'NO', 'NO2'] as const

function contaminanteIdx(c: string): number {
  return CONTAMINANTES_ORDER.indexOf(c as (typeof CONTAMINANTES_ORDER)[number])
}

// ---------------------------------------------------------------------------
// Rondas — read
// ---------------------------------------------------------------------------

export const getRonda = query({
  args: { id: v.id('rondas') },
  handler: async (ctx, { id }) => {
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
  args: { codigo: v.string() },
  handler: async (ctx, { codigo }) => {
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

export const listRondas = query({
  args: {},
  handler: async (ctx) => {
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

        const planeados = participantes.length
        const asignados = participantes.filter(
          (p) => !p.workosUserId.startsWith(PENDING_PREFIX)
        ).length

        return { ...ronda, contaminantes, participantes_planeados: planeados, participantes_asignados: asignados }
      })
    )

    return results
  },
})

// ---------------------------------------------------------------------------
// Participantes — read
// ---------------------------------------------------------------------------

export const listParticipantes = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
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
      const key = e.rondaParticipanteId
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }

    return rows.map((p) => ({
      ...p,
      envios_count: countMap.get(p._id) ?? 0,
      estado: p.workosUserId.startsWith(PENDING_PREFIX) ? 'pendiente' : 'asignado',
      slot_token: p.workosUserId.startsWith(PENDING_PREFIX)
        ? p.workosUserId.slice(PENDING_PREFIX.length)
        : null,
    }))
  },
})

export const listRondasParticipante = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const rpRows = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_user', (q) => q.eq('workosUserId', userId))
      .collect()
    rpRows.sort((a, b) => b.invitadoAt - a.invitadoAt)

    const results = await Promise.all(
      rpRows.map(async (rp) => {
        const ronda = await ctx.db.get(rp.rondaId)
        if (!ronda) return null

        const contaminantes = await ctx.db
          .query('rondaContaminantes')
          .withIndex('by_ronda', (q) => q.eq('rondaId', ronda._id))
          .collect()
        contaminantes.sort((a, b) => contaminanteIdx(a.contaminante) - contaminanteIdx(b.contaminante))

        const ficha = await ctx.db
          .query('fichasRegistro')
          .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', rp._id))
          .unique()

        const fichaEstado: 'no_iniciada' | 'borrador' | 'enviado' =
          ficha ? (ficha.estado as 'borrador' | 'enviado') : 'no_iniciada'

        return {
          ...ronda,
          contaminantes,
          invitado_at: new Date(rp.invitadoAt).toISOString(),
          ronda_participante_id: rp._id,
          ficha_estado: fichaEstado,
        }
      })
    )

    return results.filter((r): r is NonNullable<typeof r> => r !== null)
  },
})

export const listAllParticipantes = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('rondaParticipantes').collect()
    const claimed = rows.filter((r) => !r.workosUserId.startsWith(PENDING_PREFIX))

    const envioRows = await ctx.db.query('envios').collect()
    const envioCount = new Map<string, Map<string, number>>()
    for (const e of envioRows) {
      const rondaMap = envioCount.get(e.workosUserId) ?? new Map<string, number>()
      rondaMap.set(e.rondaId, (rondaMap.get(e.rondaId) ?? 0) + 1)
      envioCount.set(e.workosUserId, rondaMap)
    }

    const rondaCache = new Map<string, Doc<'rondas'> | null>()

    type ParticipanteGlobal = {
      workos_user_id: string
      email: string
      rondas: { id: string; codigo: string; nombre: string; estado: string; envios_count: number }[]
      total_envios: number
    }

    const grouped = new Map<string, ParticipanteGlobal>()

    for (const row of claimed) {
      let ronda = rondaCache.get(row.rondaId)
      if (ronda === undefined) {
        ronda = await ctx.db.get(row.rondaId)
        rondaCache.set(row.rondaId, ronda)
      }
      if (!ronda) continue

      let entry = grouped.get(row.workosUserId)
      if (!entry) {
        entry = { workos_user_id: row.workosUserId, email: row.email, rondas: [], total_envios: 0 }
        grouped.set(row.workosUserId, entry)
      }
      const rondaEnvios = envioCount.get(row.workosUserId)?.get(row.rondaId) ?? 0
      entry.rondas.push({ id: ronda._id, codigo: ronda.codigo, nombre: ronda.nombre, estado: ronda.estado, envios_count: rondaEnvios })
      entry.total_envios += rondaEnvios
    }

    return Array.from(grouped.values()).sort((a, b) => a.email.localeCompare(b.email))
  },
})

export const isInvitado = query({
  args: { rondaId: v.id('rondas'), userId: v.string() },
  handler: async (ctx, { rondaId, userId }) => {
    const row = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', userId))
      .unique()
    return !!row
  },
})

// ---------------------------------------------------------------------------
// Envios regulares — read
// ---------------------------------------------------------------------------

export const listEnvios = query({
  args: { rondaId: v.id('rondas'), userId: v.string() },
  handler: async (ctx, { rondaId, userId }) => {
    return ctx.db
      .query('envios')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', userId))
      .collect()
  },
})

export const getEstadoEnvioParticipante = query({
  args: { rondaId: v.id('rondas'), userId: v.string() },
  handler: async (ctx, { rondaId, userId }) => {
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) return { completo: false, enviado: false, enviados_at: null, total_esperado: 0, total_guardado: 0 }

    const contaminantes = await ctx.db
      .query('rondaContaminantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    const totalEsperado = contaminantes.reduce((sum, c) => sum + c.niveles, 0)

    const envios = await ctx.db
      .query('envios')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', userId))
      .collect()

    const completo = envios.length === totalEsperado && totalEsperado > 0
    const submittedTimes = Array.from(new Set(envios.map((e) => e.submittedAt)))
    const enviado = completo && submittedTimes.length === 1

    return {
      completo,
      enviado,
      enviados_at: enviado ? new Date(submittedTimes[0]!).toISOString() : null,
      total_esperado: totalEsperado,
      total_guardado: envios.length,
    }
  },
})

export const listResultados = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
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
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
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
// Mutations — participantes
// ---------------------------------------------------------------------------

export const claimParticipanteToken = mutation({
  args: {
    rondaId:   v.id('rondas'),
    token:     v.string(),
    userId:    v.string(),
    email:     v.string(),
    role:      v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { rondaId, token, userId, email }) => {
    const normalizedToken = token.trim()
    if (!normalizedToken) return 'invalid' as const

    const existing = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', userId))
      .unique()
    if (existing) return 'already-assigned' as const

    const placeholderId = `${PENDING_PREFIX}${normalizedToken}`
    const slot = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', placeholderId))
      .unique()
    if (!slot) return 'invalid' as const

    const now = Date.now()
    await ctx.db.patch(slot._id, {
      workosUserId: userId,
      email,
      invitadoAt: now,
      claimedAt: now,
    })

    return 'claimed' as const
  },
})

export const upsertEnvio = mutation({
  args: {
    rondaId:       v.id('rondas'),
    userId:        v.string(),
    contaminante:  v.union(
      v.literal('CO'), v.literal('SO2'), v.literal('O3'), v.literal('NO'), v.literal('NO2')
    ),
    nivel:         v.number(),
    valores:       v.array(v.number()),
    promedio:      v.optional(v.number()),
    incertidumbre: v.optional(v.number()),
  },
  handler: async (ctx, { rondaId, userId, contaminante, nivel, valores, promedio, incertidumbre }) => {
    const now = Date.now()
    const existing = await ctx.db
      .query('envios')
      .withIndex('by_ronda_user_cont_nivel', (q) =>
        q.eq('rondaId', rondaId).eq('workosUserId', userId).eq('contaminante', contaminante).eq('nivel', nivel)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { valores, promedio, incertidumbre, updatedAt: now })
      return existing._id
    }

    return ctx.db.insert('envios', {
      rondaId,
      workosUserId: userId,
      contaminante,
      nivel,
      valores,
      promedio,
      incertidumbre,
      submittedAt: now,
      updatedAt: now,
    })
  },
})

// ---------------------------------------------------------------------------
// Mutations — admin rondas
// ---------------------------------------------------------------------------

export const createRonda = mutation({
  args: {
    codigo:  v.string(),
    nombre:  v.string(),
    estado:  v.union(v.literal('borrador'), v.literal('activa'), v.literal('cerrada')),
  },
  handler: async (ctx, { codigo, nombre, estado }) => {
    return ctx.db.insert('rondas', { codigo, nombre, estado, createdAt: Date.now() })
  },
})

export const updateRondaEstado = mutation({
  args: { id: v.id('rondas'), estado: v.union(v.literal('borrador'), v.literal('activa'), v.literal('cerrada')) },
  handler: async (ctx, { id, estado }) => {
    await ctx.db.patch(id, { estado })
  },
})

export const addContaminante = mutation({
  args: {
    rondaId:      v.id('rondas'),
    contaminante: v.union(
      v.literal('CO'), v.literal('SO2'), v.literal('O3'), v.literal('NO'), v.literal('NO2')
    ),
    niveles:   v.number(),
    replicas:  v.union(v.literal(2), v.literal(3)),
  },
  handler: async (ctx, { rondaId, contaminante, niveles, replicas }) => {
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

export const addParticipante = mutation({
  args: {
    rondaId:            v.id('rondas'),
    workosUserId:       v.string(),
    email:              v.string(),
    participantProfile: v.union(v.literal('member'), v.literal('member_special')),
    participantCode:    v.optional(v.string()),
    replicateCode:      v.optional(v.number()),
  },
  handler: async (ctx, { rondaId, workosUserId, email, participantProfile, participantCode, replicateCode }) => {
    return ctx.db.insert('rondaParticipantes', {
      rondaId,
      workosUserId,
      email,
      participantProfile,
      participantCode,
      replicateCode,
      invitadoAt: Date.now(),
    })
  },
})
