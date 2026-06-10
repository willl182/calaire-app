import { v } from 'convex/values'
import { contaminanteValidator, participantProfileValidator, replicasValidator, rondaEstadoValidator } from './validators'
import { defineRondaMutation } from './definitions'
import { generateUniqueParticipantCode } from './codes'
import { getDirectorioByLookup, normalizeEmail } from './directorio'
import { assertAllowedEstadoTransition } from './state'

export const createRondaDefinition = defineRondaMutation({
  args: {
    codigo:  v.string(),
    nombre:  v.string(),
    estado:  rondaEstadoValidator,
  },
  handler: async (ctx, { codigo, nombre, estado }) => {
    const existing = await ctx.db
      .query('rondas')
      .withIndex('by_codigo', (q) => q.eq('codigo', codigo))
      .first()
    if (existing) throw new Error('Ya existe una ronda con ese codigo.')

    return ctx.db.insert('rondas', { codigo, nombre, estado, createdAt: Date.now() })
  },
})

export const updateRondaEstadoDefinition = defineRondaMutation({
  args: {
    id: v.id('rondas'),
    estado: rondaEstadoValidator
  },
  handler: async (ctx, { id, estado }) => {
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    assertAllowedEstadoTransition(ronda.estado, estado)
    await ctx.db.patch(id, { estado })
  },
})

export const addContaminanteDefinition = defineRondaMutation({
  args: {
    rondaId:      v.id('rondas'),
    contaminante: contaminanteValidator,
    niveles:   v.number(),
    replicas:  replicasValidator,
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

export const addParticipanteDefinition = defineRondaMutation({
  args: {
    rondaId:            v.id('rondas'),
    workosUserId:       v.string(),
    email:              v.string(),
    participantProfile: participantProfileValidator,
    participantCode:    v.optional(v.string()),
    replicateCode:      v.optional(v.number()),
  },
  handler: async (ctx, { rondaId, workosUserId, email, participantProfile, participantCode, replicateCode }) => {
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
      email: normalizeEmail(email),
      directorioParticipanteId: directorio?._id ?? null,
      participantProfile,
      participantCode: assignedParticipantCode,
      replicateCode,
      invitadoAt: Date.now(),
    })
  },
})

export const updateParticipanteAdminDefinition = defineRondaMutation({
  args: {
    participanteId: v.id('rondaParticipantes'),
    email: v.string(),
    participantProfile: participantProfileValidator,
    participantCode: v.union(v.string(), v.null()),
    replicateCode: v.union(v.number(), v.null()),
  },
  handler: async (ctx, { participanteId, email, participantProfile, participantCode, replicateCode }) => {
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
      if (duplicate) throw new Error('Ya existe otro cupo con ese código en la ronda.')
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

export const createConfiguredRondaDefinition = defineRondaMutation({
  args: {
    codigo: v.string(),
    nombre: v.string(),
    contaminantes: v.array(v.object({
      contaminante: contaminanteValidator,
      niveles: v.number(),
      replicas: replicasValidator,
    })),
    slots: v.array(v.object({
      workosUserId: v.string(),
      email: v.string(),
      participantProfile: participantProfileValidator,
    })),
  },
  handler: async (ctx, { codigo, nombre, contaminantes, slots }) => {
    const existing = await ctx.db
      .query('rondas')
      .withIndex('by_codigo', (q) => q.eq('codigo', codigo))
      .first()
    if (existing) throw new Error('Ya existe una ronda con ese codigo.')

    const now = Date.now()
    const rondaId = await ctx.db.insert('rondas', { codigo, nombre, estado: 'borrador', createdAt: now })

    await ctx.db.insert('rondaPtSampleGroups', {
      rondaId,
      sampleGroup: 'A',
      sortOrder: 1,
      createdAt: now,
    })

    await Promise.all(contaminantes.map((item) =>
      ctx.db.insert('rondaContaminantes', {
        rondaId,
        contaminante: item.contaminante,
        niveles: item.niveles,
        replicas: item.replicas,
      })
    ))

    for (const slot of slots) {
      const participantCode = await generateUniqueParticipantCode(ctx, rondaId)
      const directorio = await getDirectorioByLookup(ctx, slot.email)
      await ctx.db.insert('rondaParticipantes', {
        rondaId,
        workosUserId: slot.workosUserId,
        email: normalizeEmail(slot.email),
        directorioParticipanteId: directorio?._id ?? null,
        participantProfile: slot.participantProfile,
        participantCode,
        invitadoAt: now,
      })
    }

    return rondaId
  },
})

export const updateRondaConfigDefinition = defineRondaMutation({
  args: {
    id: v.id('rondas'),
    codigo: v.string(),
    nombre: v.string(),
    contaminantes: v.array(v.object({
      contaminante: contaminanteValidator,
      niveles: v.number(),
      replicas: replicasValidator,
    })),
  },
  handler: async (ctx, { id, codigo, nombre, contaminantes }) => {
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') {
      throw new Error('No se puede editar una ronda cerrada.')
    }

    const sameCode = await ctx.db
      .query('rondas')
      .withIndex('by_codigo', (q) => q.eq('codigo', codigo))
      .first()
    if (sameCode && sameCode._id !== id) throw new Error('Ya existe una ronda con ese codigo.')

    await ctx.db.patch(id, { codigo, nombre })

    const envios = await ctx.db
      .query('envios')
      .withIndex('by_ronda', (q) => q.eq('rondaId', id))
      .first()
    if (envios) {
      throw new Error('No se puede modificar la configuracion de contaminantes porque la ronda ya tiene envios.')
    }
    const enviosPt = await ctx.db
      .query('enviosPt')
      .withIndex('by_ronda', (q) => q.eq('rondaId', id))
      .first()
    if (enviosPt) {
      throw new Error('No se puede modificar la configuracion de contaminantes porque la ronda ya tiene envios PT.')
    }

    const existing = await ctx.db
      .query('rondaContaminantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', id))
      .collect()
    await Promise.all(existing.map((row) => ctx.db.delete(row._id)))
    await Promise.all(contaminantes.map((item) =>
      ctx.db.insert('rondaContaminantes', {
        rondaId: id,
        contaminante: item.contaminante,
        niveles: item.niveles,
        replicas: item.replicas,
      })
    ))
  },
})

export const updateRondaBasicInfoDefinition = defineRondaMutation({
  args: {
    id: v.id('rondas'),
    codigo: v.string(),
    nombre: v.string(),
  },
  handler: async (ctx, { id, codigo, nombre }) => {
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') {
      throw new Error('No se puede editar una ronda cerrada.')
    }

    const sameCode = await ctx.db
      .query('rondas')
      .withIndex('by_codigo', (q) => q.eq('codigo', codigo))
      .first()
    if (sameCode && sameCode._id !== id) throw new Error('Ya existe una ronda con ese codigo.')

    await ctx.db.patch(id, { codigo, nombre })
  },
})

export const transitionRondaEstadoDefinition = defineRondaMutation({
  args: {
    id: v.id('rondas'),
    nextState: v.union(
      v.literal('activa'),
      v.literal('documentacion_pendiente'),
      v.literal('cerrada')
    ),
  },
  handler: async (ctx, { id, nextState }) => {
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    assertAllowedEstadoTransition(ronda.estado, nextState)
    await ctx.db.patch(id, { estado: nextState })
  },
})

export const reabrirRondaDefinition = defineRondaMutation({
  args: { id: v.id('rondas') },
  handler: async (ctx, { id }) => {
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'cerrada') throw new Error('Solo se pueden reabrir rondas cerradas.')
    await ctx.db.patch(id, { estado: 'documentacion_pendiente' })
  },
})

export const assignParticipanteDefinition = defineRondaMutation({
  args: {
    rondaId: v.id('rondas'),
    workosUserId: v.string(),
    email: v.string(),
    participantProfile: participantProfileValidator,
  },
  handler: async (ctx, { rondaId, workosUserId, email, participantProfile }) => {
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede asignar participantes a una ronda cerrada.')

    const existing = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', workosUserId))
      .first()
    if (existing) throw new Error('Este usuario ya esta asignado a esta ronda.')

    const participantCode = await generateUniqueParticipantCode(ctx, rondaId)
    const directorio = await getDirectorioByLookup(ctx, email)

    return ctx.db.insert('rondaParticipantes', {
      rondaId,
      workosUserId,
      email: normalizeEmail(email),
      directorioParticipanteId: directorio?._id ?? null,
      participantProfile,
      participantCode,
      invitadoAt: Date.now(),
    })
  },
})

export const regenerateParticipanteSlotDefinition = defineRondaMutation({
  args: {
    rondaId: v.id('rondas'),
    participanteId: v.id('rondaParticipantes'),
    workosUserId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { rondaId, participanteId, workosUserId, email }) => {
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede modificar una ronda cerrada.')

    const participante = await ctx.db.get(participanteId)
    if (!participante || participante.rondaId !== rondaId) throw new Error('No se encontro el participante a regenerar.')

    // Preserve participantCode when regenerating the invitation link.
    await ctx.db.patch(participanteId, {
      workosUserId,
      email: normalizeEmail(email),
      claimedAt: undefined,
      invitadoAt: Date.now(),
    })
  },
})

export const updateParticipanteEmailDefinition = defineRondaMutation({
  args: {
    rondaId: v.id('rondas'),
    participanteId: v.id('rondaParticipantes'),
    email: v.string(),
  },
  handler: async (ctx, { rondaId, participanteId, email }) => {
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede modificar una ronda cerrada.')

    const participante = await ctx.db.get(participanteId)
    if (!participante || participante.rondaId !== rondaId) throw new Error('No se encontro el participante.')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) throw new Error('El correo es obligatorio.')

    const fichas = await ctx.db
      .query('fichasRegistro')
      .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', participanteId))
      .collect()

    await ctx.db.patch(participanteId, { email: normalizedEmail })

    const directorio = await getDirectorioByLookup(ctx, normalizedEmail)
    if (directorio) {
      await ctx.db.patch(participanteId, { directorioParticipanteId: directorio._id })
    }

    for (const ficha of fichas) {
      await ctx.db.patch(ficha._id, { correoLaboratorio: normalizedEmail, updatedAt: Date.now() } as never)
    }
  },
})

export const addReferenceSlotDefinition = defineRondaMutation({
  args: { rondaId: v.id('rondas'), workosUserId: v.string(), email: v.string() },
  handler: async (ctx, { rondaId, workosUserId, email }) => {
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede modificar una ronda cerrada.')

    const participantes = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()
    if (participantes.some((p) => p.participantProfile === 'member_special')) {
      throw new Error('Esta ronda ya tiene un enlace de referencia.')
    }

    const participantCode = await generateUniqueParticipantCode(ctx, rondaId)

    return ctx.db.insert('rondaParticipantes', {
      rondaId,
      workosUserId,
      email,
      participantProfile: 'member_special',
      participantCode,
      invitadoAt: Date.now(),
    })
  },
})
