import { v } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import { defineRondaQuery } from './definitions'
import { PENDING_PREFIX, contaminanteIdx } from './state'
import { getLatestFichaByRondaParticipante } from './fichas'
import { isViewerIdentity, requireIdentity, requireParticipantOrAdminForRonda, requireParticipantOrAdminForRondaParticipante, requireViewerIdentity } from '../access'

export const getRondaDefinition = defineRondaQuery({
  args: { id: v.id('rondas') },
  handler: async (ctx, { id }) => {
    await requireIdentity(ctx)
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

export const getRondaByCodigoDefinition = defineRondaQuery({
  args: { codigo: v.string() },
  handler: async (ctx, { codigo }) => {
    await requireIdentity(ctx)
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

export const listRondasDefinition = defineRondaQuery({
  args: {},
  handler: async (ctx) => {
    await requireViewerIdentity(ctx)
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

export const listParticipantesDefinition = defineRondaQuery({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireParticipantOrAdminForRonda(ctx, rondaId)
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

export const listParticipantesRondaResumenDefinition = defineRondaQuery({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireParticipantOrAdminForRonda(ctx, rondaId)
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
      const key = envio.rondaParticipanteId
      enviosPtCount.set(key, (enviosPtCount.get(key) ?? 0) + 1)
    }

    return Promise.all(
      rows.map(async (p) => {
        const ficha = await getLatestFichaByRondaParticipante(ctx, p._id)
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

export const getParticipanteRondaResumenDefinition = defineRondaQuery({
  args: { participanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { participanteId }) => {
    await requireParticipantOrAdminForRondaParticipante(ctx, participanteId)
    const p = await ctx.db.get(participanteId)
    if (!p) return null

    const ficha = await getLatestFichaByRondaParticipante(ctx, p._id)
    const enviosPt = await ctx.db
      .query('enviosPt')
      .withIndex('by_participante', (q) => q.eq('rondaParticipanteId', p._id))
      .collect()
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
      envios_pt_count: enviosPt.length,
    }
  },
})

export const listRondasParticipanteDefinition = defineRondaQuery({
  // userId opcional: un participante consulta sus propias rondas (self); un admin
  // puede consultar las de otro participante (p.ej. /dashboard/participantes/[uid]).
  // Sin este guard el backend derivaba siempre del token e ignoraba el userId, asi
  // que el panel admin de participante devolvia las rondas del admin, no las del [uid].
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    const identity = await requireIdentity(ctx)
    let targetUserId = identity.subject
    if (userId && userId !== identity.subject) {
      if (!isViewerIdentity(identity)) throw new Error('No tiene acceso a estas rondas.')
      targetUserId = userId
    }
    const rpRows = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_user', (q) => q.eq('workosUserId', targetUserId))
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

        const ficha = await getLatestFichaByRondaParticipante(ctx, rp._id)

        const fichaEstado: 'no_iniciada' | 'borrador' | 'enviado' =
          ficha ? (ficha.estado as 'borrador' | 'enviado') : 'no_iniciada'
        const enviosPt = await ctx.db
          .query('enviosPt')
          .withIndex('by_participante', (q) => q.eq('rondaParticipanteId', rp._id))
          .collect()
        const envioPtEnviado = enviosPt.some((envio) => envio.finalSubmittedAt != null)

        return {
          ...ronda,
          contaminantes,
          email: rp.email,
          invitado_at: new Date(rp.invitadoAt).toISOString(),
          ronda_participante_id: rp._id,
          participant_profile: rp.participantProfile ?? 'member',
          ficha_estado: fichaEstado,
          envios_pt_count: enviosPt.length,
          envio_pt_enviado: envioPtEnviado,
        }
      })
    )

    return results.filter((r): r is NonNullable<typeof r> => r !== null)
  },
})

export const listAllParticipantesDefinition = defineRondaQuery({
  args: {},
  handler: async (ctx) => {
    await requireViewerIdentity(ctx)
    const directorioRows = await ctx.db.query('directorioParticipantes').collect()
    const rows = await ctx.db.query('rondaParticipantes').collect()

    const envioRows = await ctx.db.query('envios').collect()
    const envioCount = new Map<string, Map<string, number>>()
    for (const e of envioRows) {
      const rondaMap = envioCount.get(e.workosUserId) ?? new Map<string, number>()
      rondaMap.set(e.rondaId, (rondaMap.get(e.rondaId) ?? 0) + 1)
      envioCount.set(e.workosUserId, rondaMap)
    }

    const rondaCache = new Map<string, Doc<'rondas'> | null>()
    const fichaCache = new Map<string, Doc<'fichasRegistro'> | null>()
    const directorioByLookup = new Map<string, Doc<'directorioParticipantes'>>()
    for (const row of directorioRows) {
      directorioByLookup.set(row.nit.toLowerCase(), row)
      directorioByLookup.set(row.correo.toLowerCase(), row)
      if (row.workosUserId) directorioByLookup.set(row.workosUserId, row)
    }

    async function getFicha(rondaParticipanteId: Id<'rondaParticipantes'>) {
      const cached = fichaCache.get(rondaParticipanteId)
      if (cached !== undefined) return cached
      const ficha = await getLatestFichaByRondaParticipante(ctx, rondaParticipanteId)
      fichaCache.set(rondaParticipanteId, ficha)
      return ficha
    }

    type ParticipanteGlobal = {
      workos_user_id: string
      email: string
      nit: string | null
      nit_laboratorio: string | null
      correo_laboratorio: string | null
      ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
      rondas: {
        id: string
        codigo: string
        nombre: string
        estado: string
        envios_count: number
        participant_profile: string
        ronda_participante_id: string
        rondaParticipanteId: string
        ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
        nit_laboratorio: string | null
        correo_laboratorio: string | null
        estado_enlace: 'pendiente' | 'reclamado'
        directorio_id: string | null
      }[]
      total_envios: number
    }

    const grouped = new Map<string, ParticipanteGlobal>()

    for (const directorio of directorioRows) {
      grouped.set(directorio.nit.toLowerCase(), {
        workos_user_id: directorio.workosUserId ?? '',
        email: directorio.correo,
        nit: directorio.nit,
        nit_laboratorio: directorio.nit,
        correo_laboratorio: directorio.correo,
        ficha_estado: 'no_iniciada',
        rondas: [],
        total_envios: 0,
      })
    }

    for (const row of rows) {
      let ronda = rondaCache.get(row.rondaId)
      if (ronda === undefined) {
        ronda = await ctx.db.get(row.rondaId)
        rondaCache.set(row.rondaId, ronda)
      }
      if (!ronda) continue

      const ficha = await getFicha(row._id)
      const nitLaboratorio = ficha?.nitLaboratorio ?? null
      const correoLaboratorio = ficha?.correoLaboratorio ?? null
      const fichaEstado = ficha?.estado ?? 'no_iniciada'
      const estadoEnlace: 'pendiente' | 'reclamado' = row.workosUserId.startsWith(PENDING_PREFIX)
        ? 'pendiente'
        : 'reclamado'
      const directorio =
        (row.directorioParticipanteId ? await ctx.db.get(row.directorioParticipanteId) : null) ??
        directorioByLookup.get(row.email.toLowerCase()) ??
        directorioByLookup.get(row.workosUserId) ??
        null
      const groupKey = directorio?.nit.toLowerCase() ?? row.workosUserId

      let entry = grouped.get(groupKey)
      if (!entry) {
        entry = {
          workos_user_id: row.workosUserId,
          email: row.email,
          nit: directorio?.nit ?? null,
          nit_laboratorio: nitLaboratorio,
          correo_laboratorio: correoLaboratorio,
          ficha_estado: fichaEstado,
          rondas: [],
          total_envios: 0,
        }
        grouped.set(groupKey, entry)
      }

      if (entry.nit == null && directorio?.nit) entry.nit = directorio.nit
      if (entry.nit_laboratorio == null && directorio?.nit) entry.nit_laboratorio = directorio.nit
      if (entry.correo_laboratorio == null && directorio?.correo) entry.correo_laboratorio = directorio.correo
      if (entry.nit_laboratorio == null && nitLaboratorio != null) {
        entry.nit_laboratorio = nitLaboratorio
      }
      if (entry.correo_laboratorio == null && correoLaboratorio != null) {
        entry.correo_laboratorio = correoLaboratorio
      }
      if (entry.ficha_estado === 'no_iniciada' && fichaEstado !== 'no_iniciada') {
        entry.ficha_estado = fichaEstado
      }

      const rondaEnvios = envioCount.get(row.workosUserId)?.get(row.rondaId) ?? 0
      entry.rondas.push({
        id: ronda._id,
        codigo: ronda.codigo,
        nombre: ronda.nombre,
        estado: ronda.estado,
        envios_count: rondaEnvios,
        participant_profile: row.participantProfile ?? 'member',
        ronda_participante_id: row._id,
        rondaParticipanteId: row._id,
        ficha_estado: fichaEstado,
        nit_laboratorio: nitLaboratorio,
        correo_laboratorio: correoLaboratorio,
        estado_enlace: estadoEnlace,
        directorio_id: directorio?._id ?? null,
      })
      entry.total_envios += rondaEnvios
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const nitA = a.nit_laboratorio ?? ''
      const nitB = b.nit_laboratorio ?? ''
      if (nitA !== nitB) return nitA.localeCompare(nitB)
      return a.email.localeCompare(b.email)
    })
  },
})

export const isInvitadoDefinition = defineRondaQuery({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const identity = await requireIdentity(ctx)
    const row = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', identity.subject))
      .unique()
    return !!row
  },
})
