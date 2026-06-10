import { v } from 'convex/values'
import { defineAgentQuery } from './definitions'
import { requireAgentAuth, PENDING_PREFIX } from './shared'

export const listParticipantesDefinition = defineAgentQuery({
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

export const listParticipantesRondaResumenDefinition = defineAgentQuery({
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

export const listDirectorioParticipantesDefinition = defineAgentQuery({
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
