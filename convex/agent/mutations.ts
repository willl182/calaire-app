import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { defineAgentMutation } from './definitions'
import { assertAllowedEstadoTransition, generateUniqueParticipantCode, getDirectorioByLookup, requireAgentAdmin } from './shared'

export const createRondaDefinition = defineAgentMutation({
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

export const createConfiguredRondaDefinition = defineAgentMutation({
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

export const updateRondaEstadoDefinition = defineAgentMutation({
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

export const updateRondaConfigDefinition = defineAgentMutation({
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

export const updateRondaBasicInfoDefinition = defineAgentMutation({
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

export const deleteRondaDefinition = defineAgentMutation({
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

export const addContaminanteDefinition = defineAgentMutation({
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

export const addParticipanteDefinition = defineAgentMutation({
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

export const updateParticipanteAdminDefinition = defineAgentMutation({
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

export const removeParticipanteDefinition = defineAgentMutation({
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

export const createPTItemDefinition = defineAgentMutation({
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

export const createPTItemsBulkDefinition = defineAgentMutation({
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

export const createPTSampleGroupDefinition = defineAgentMutation({
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
