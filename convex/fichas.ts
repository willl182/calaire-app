import { v } from 'convex/values'
import { query, mutation, QueryCtx, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'

async function getLatestFichaByRondaParticipante(
  ctx: QueryCtx | MutationCtx,
  rondaParticipanteId: Id<'rondaParticipantes'>
): Promise<Doc<'fichasRegistro'> | null> {
  const fichas = await ctx.db
    .query('fichasRegistro')
    .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', rondaParticipanteId))
    .collect()
  fichas.sort((a, b) => b.updatedAt - a.updatedAt)
  return fichas[0] ?? null
}

async function getDirectorioById(
  ctx: QueryCtx | MutationCtx,
  directorioParticipanteId: Id<'directorioParticipantes'> | null | undefined
) {
  if (!directorioParticipanteId) return null
  return ctx.db.get(directorioParticipanteId)
}

async function getDirectorioByLookup(
  ctx: QueryCtx | MutationCtx,
  lookup: string
) {
  const normalized = lookup.trim().toLowerCase()
  if (!normalized) return null
  const byNit = await ctx.db
    .query('directorioParticipantes')
    .withIndex('by_nit', (q) => q.eq('nit', lookup.trim()))
    .first()
  if (byNit) return byNit
  return ctx.db
    .query('directorioParticipantes')
    .withIndex('by_correo', (q) => q.eq('correo', normalized))
    .first()
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase()
}

async function getRondaByFichaId(
  ctx: QueryCtx | MutationCtx,
  fichaId: Id<'fichasRegistro'>
) {
  const ficha = await ctx.db.get(fichaId)
  if (!ficha) return null
  const rp = await ctx.db.get(ficha.rondaParticipanteId)
  if (!rp) return null
  return ctx.db.get(rp.rondaId)
}

function assertRondaAbierta(ronda: Doc<'rondas'> | null) {
  if (ronda?.estado === 'cerrada') {
    throw new Error('La ronda está cerrada y no admite edición')
  }
}

// ---------------------------------------------------------------------------
// Fichas — read
// ---------------------------------------------------------------------------

export const getFichaById = query({
  args: { fichaId: v.id('fichasRegistro') },
  handler: async (ctx, { fichaId }) => {
    return ctx.db.get(fichaId)
  },
})

export const getFichaByRondaParticipante = query({
  args: { rondaParticipanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { rondaParticipanteId }) => {
    const ficha = await getLatestFichaByRondaParticipante(ctx, rondaParticipanteId)
    if (!ficha) return null

    const [acompanantes, analizadores, instrumentos] = await Promise.all([
      ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
    ])

    acompanantes.sort((a, b) => a.sortOrder - b.sortOrder)
    analizadores.sort((a, b) => a.sortOrder - b.sortOrder)
    instrumentos.sort((a, b) => a.sortOrder - b.sortOrder)

    const acompanantesConUrl = await Promise.all(
      acompanantes.map(async (acompanante) => ({
        ...acompanante,
        seguridadSocialArlUrl: acompanante.seguridadSocialArlStorageId
          ? await ctx.storage.getUrl(acompanante.seguridadSocialArlStorageId)
          : null,
      }))
    )

    return { ...ficha, acompanantes: acompanantesConUrl, analizadores, instrumentos }
  },
})

export const getFichaDirectorioPreview = query({
  args: { lookup: v.string() },
  handler: async (ctx, { lookup }) => {
    const directorio = await getDirectorioByLookup(ctx, lookup)
    if (!directorio) return null
    return {
      id: directorio._id,
      nit: directorio.nit,
      correo: directorio.correo,
      nombre_laboratorio: directorio.nombreLaboratorio ?? null,
      nombre_responsable: directorio.nombreResponsable ?? null,
      cargo: directorio.cargo ?? null,
      ciudad: directorio.ciudad ?? null,
      departamento: directorio.departamento ?? null,
      telefono: directorio.telefono ?? null,
    }
  },
})

export const getFichaResumenByRondaParticipante = query({
  args: { rondaParticipanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { rondaParticipanteId }) => {
    const ficha = await getLatestFichaByRondaParticipante(ctx, rondaParticipanteId)
    if (!ficha) return null
    return { id: ficha._id, rondaParticipanteId: ficha.rondaParticipanteId, estado: ficha.estado }
  },
})

export const findFichaTemplateByLookup = query({
  args: {
    lookup: v.string(),
    excludeFichaId: v.optional(v.id('fichasRegistro')),
  },
  handler: async (ctx, { lookup, excludeFichaId }) => {
    const normalizedLookup = normalizeLookupValue(lookup)
    if (!normalizedLookup) return null

    const fichas = await ctx.db.query('fichasRegistro').collect()
    const matches = fichas.filter((ficha) => {
      if (excludeFichaId && ficha._id === excludeFichaId) return false
      const correo = normalizeLookupValue(String(ficha.correoLaboratorio ?? ''))
      const nit = normalizeLookupValue(String(ficha.nitLaboratorio ?? ''))
      return correo === normalizedLookup || nit === normalizedLookup
    })

    if (matches.length === 0) return null

    matches.sort((a, b) => b.updatedAt - a.updatedAt)
    const ficha = matches[0]

    const [acompanantes, analizadores, instrumentos] = await Promise.all([
      ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
    ])

    acompanantes.sort((a, b) => a.sortOrder - b.sortOrder)
    analizadores.sort((a, b) => a.sortOrder - b.sortOrder)
    instrumentos.sort((a, b) => a.sortOrder - b.sortOrder)

    const acompanantesConUrl = await Promise.all(
      acompanantes.map(async (acompanante) => ({
        ...acompanante,
        seguridadSocialArlUrl: acompanante.seguridadSocialArlStorageId
          ? await ctx.storage.getUrl(acompanante.seguridadSocialArlStorageId)
          : null,
      }))
    )

    return { ...ficha, acompanantes: acompanantesConUrl, analizadores, instrumentos }
  },
})

export const generateFichaUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl()
  },
})

export const listFichaResumenesByRpIds = query({
  args: { rpIds: v.array(v.id('rondaParticipantes')) },
  handler: async (ctx, { rpIds }) => {
    if (rpIds.length === 0) return {}
    const fichas = await Promise.all(
      rpIds.map((rpId) => getLatestFichaByRondaParticipante(ctx, rpId))
    )
    const result: Record<string, { id: string; rondaParticipanteId: string; estado: string }> = {}
    for (const ficha of fichas) {
      if (ficha) result[ficha.rondaParticipanteId] = { id: ficha._id, rondaParticipanteId: ficha.rondaParticipanteId, estado: ficha.estado }
    }
    return result
  },
})

export const listFichaResumenesByRonda = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const participantes = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
      .collect()

    const fichas = await Promise.all(
      participantes.map((p) => getLatestFichaByRondaParticipante(ctx, p._id))
    )

    const result: Record<string, { id: string; rondaParticipanteId: string; estado: string }> = {}
    for (const ficha of fichas) {
      if (ficha) result[ficha.rondaParticipanteId] = { id: ficha._id, rondaParticipanteId: ficha.rondaParticipanteId, estado: ficha.estado }
    }
    return result
  },
})

// ---------------------------------------------------------------------------
// Fichas — mutations
// ---------------------------------------------------------------------------

export const getOrCreateFicha = mutation({
  args: { rondaParticipanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { rondaParticipanteId }) => {
    const participante = await ctx.db.get(rondaParticipanteId)
    if (!participante) throw new Error('Participante no encontrado.')

    const existing = await getLatestFichaByRondaParticipante(ctx, rondaParticipanteId)
    if (existing) return existing._id

    const directorio = await getDirectorioById(ctx, participante.directorioParticipanteId)
    const now = Date.now()
    const insertedId = await ctx.db.insert('fichasRegistro', {
      rondaParticipanteId,
      directorioParticipanteId: participante.directorioParticipanteId ?? null,
      nitLaboratorio: directorio?.nit ?? null,
      correoLaboratorio: directorio?.correo ?? participante.email ?? null,
      nombreLaboratorio: directorio?.nombreLaboratorio ?? null,
      nombreResponsable: directorio?.nombreResponsable ?? null,
      cargo: directorio?.cargo ?? null,
      ciudad: directorio?.ciudad ?? null,
      departamento: directorio?.departamento ?? null,
      telefono: directorio?.telefono ?? null,
      estacionamiento: false,
      decDatosCorrectos: false,
      decAceptaCondiciones: false,
      decCompromisos: false,
      decProcedimientosCalaire: false,
      decFirmaAutorizada: false,
      estado: 'borrador',
      createdAt: now,
      updatedAt: now,
    })
    const inserted = await getLatestFichaByRondaParticipante(ctx, rondaParticipanteId)
    return inserted?._id ?? insertedId
  },
})

export const upsertFichaScalar = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    field: v.union(
      v.literal('nitLaboratorio'),
      v.literal('correoLaboratorio'),
      v.literal('nombreLaboratorio'),
      v.literal('nombreResponsable'),
      v.literal('cargo'),
      v.literal('ciudad'),
      v.literal('departamento'),
      v.literal('telefono'),
      v.literal('transporte'),
      v.literal('diaLlegada'),
      v.literal('horaLlegada'),
      v.literal('estacionamiento'),
      v.literal('observaciones'),
      v.literal('justificacionCambioEquipo'),
      v.literal('decDatosCorrectos'),
      v.literal('decAceptaCondiciones'),
      v.literal('decCompromisos'),
      v.literal('decProcedimientosCalaire'),
      v.literal('decFirmaAutorizada'),
      v.literal('nombreFirma'),
    ),
    valueString:  v.optional(v.union(v.string(), v.null())),
    valueBoolean: v.optional(v.boolean()),
  },
  handler: async (ctx, { fichaId, field, valueString, valueBoolean }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const ronda = await getRondaByFichaId(ctx, fichaId)
    assertRondaAbierta(ronda)

    const hasValue = valueBoolean !== undefined || valueString !== undefined
    if (!hasValue) {
      await ctx.db.patch(fichaId, { updatedAt: Date.now() })
      return
    }

    const value = valueBoolean !== undefined ? valueBoolean : valueString
    await ctx.db.patch(fichaId, { [field]: value, updatedAt: Date.now() })

    if ([
      'nitLaboratorio',
      'correoLaboratorio',
      'nombreLaboratorio',
      'nombreResponsable',
      'cargo',
      'ciudad',
      'departamento',
      'telefono',
    ].includes(field)) {
      const directorio = await getDirectorioById(ctx, ficha.directorioParticipanteId)
      if (directorio) {
        const patch: Record<string, string | null> = {}
        if (field === 'nitLaboratorio' && typeof value === 'string') patch.nit = value.trim()
        if (field === 'correoLaboratorio' && typeof value === 'string') patch.correo = value.trim().toLowerCase()
        if (field === 'nombreLaboratorio') patch.nombreLaboratorio = value as string | null
        if (field === 'nombreResponsable') patch.nombreResponsable = value as string | null
        if (field === 'cargo') patch.cargo = value as string | null
        if (field === 'ciudad') patch.ciudad = value as string | null
        if (field === 'departamento') patch.departamento = value as string | null
        if (field === 'telefono') patch.telefono = value as string | null
        await ctx.db.patch(directorio._id, {
          ...patch,
          updatedAt: Date.now(),
        } as never)
      }
    }
  },
})

export const adminUpsertFichaScalar = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    field: v.union(
      v.literal('nitLaboratorio'),
      v.literal('correoLaboratorio'),
      v.literal('nombreLaboratorio'),
      v.literal('nombreResponsable'),
      v.literal('cargo'),
      v.literal('ciudad'),
      v.literal('departamento'),
      v.literal('telefono'),
      v.literal('transporte'),
      v.literal('diaLlegada'),
      v.literal('horaLlegada'),
      v.literal('estacionamiento'),
      v.literal('observaciones'),
      v.literal('justificacionCambioEquipo'),
      v.literal('decDatosCorrectos'),
      v.literal('decAceptaCondiciones'),
      v.literal('decCompromisos'),
      v.literal('decProcedimientosCalaire'),
      v.literal('decFirmaAutorizada'),
      v.literal('nombreFirma'),
    ),
    valueString:  v.optional(v.union(v.string(), v.null())),
    valueBoolean: v.optional(v.boolean()),
  },
  handler: async (ctx, { fichaId, field, valueString, valueBoolean }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const hasValue = valueBoolean !== undefined || valueString !== undefined
    if (!hasValue) {
      await ctx.db.patch(fichaId, { updatedAt: Date.now() })
      return
    }

    const value = valueBoolean !== undefined ? valueBoolean : valueString
    await ctx.db.patch(fichaId, { [field]: value, updatedAt: Date.now() })
  },
})

export const replaceAcompanantes = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    items: v.array(v.object({
      sortOrder:          v.number(),
      nombreCompleto:     v.string(),
      documentoIdentidad: v.string(),
      correo:             v.optional(v.union(v.string(), v.null())),
      telefono:           v.optional(v.union(v.string(), v.null())),
      rol:                v.string(),
      seguridadSocialArlStorageId: v.optional(v.union(v.id('_storage'), v.null())),
      seguridadSocialArlFileName:  v.optional(v.union(v.string(), v.null())),
      seguridadSocialArlContentType: v.optional(v.union(v.string(), v.null())),
      seguridadSocialArlSize:      v.optional(v.union(v.number(), v.null())),
    })),
  },
  handler: async (ctx, { fichaId, items }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const ronda = await getRondaByFichaId(ctx, fichaId)
    assertRondaAbierta(ronda)

    const existing = await ctx.db
      .query('fichasAcompanantes')
      .withIndex('by_ficha', (q) => q.eq('fichaId', fichaId))
      .collect()
    await Promise.all(existing.map((r) => ctx.db.delete(r._id)))
    await Promise.all(items.map((item) => ctx.db.insert('fichasAcompanantes', { fichaId, ...item })))
    await ctx.db.patch(fichaId, { updatedAt: Date.now() })
  },
})

export const adminReplaceAcompanantes = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    items: v.array(v.object({
      sortOrder:          v.number(),
      nombreCompleto:     v.string(),
      documentoIdentidad: v.string(),
      correo:             v.optional(v.union(v.string(), v.null())),
      telefono:           v.optional(v.union(v.string(), v.null())),
      rol:                v.string(),
      seguridadSocialArlStorageId: v.optional(v.union(v.id('_storage'), v.null())),
      seguridadSocialArlFileName:  v.optional(v.union(v.string(), v.null())),
      seguridadSocialArlContentType: v.optional(v.union(v.string(), v.null())),
      seguridadSocialArlSize:      v.optional(v.union(v.number(), v.null())),
    })),
  },
  handler: async (ctx, { fichaId, items }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const existing = await ctx.db
      .query('fichasAcompanantes')
      .withIndex('by_ficha', (q) => q.eq('fichaId', fichaId))
      .collect()
    await Promise.all(existing.map((r) => ctx.db.delete(r._id)))
    await Promise.all(items.map((item) => ctx.db.insert('fichasAcompanantes', { fichaId, ...item })))
    await ctx.db.patch(fichaId, { updatedAt: Date.now() })
  },
})

export const replaceAnalizadores = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    items: v.array(v.object({
      sortOrder:              v.number(),
      analito:                v.string(),
      fabricante:             v.string(),
      modelo:                 v.string(),
      numeroSerie:            v.string(),
      metodoEpa:              v.string(),
      fechaUltimaCalibracion: v.optional(v.string()),
      tipoVerificacion:       v.string(),
      incertidumbreDeclarada: v.string(),
      unidadSalida:           v.string(),
    })),
  },
  handler: async (ctx, { fichaId, items }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const ronda = await getRondaByFichaId(ctx, fichaId)
    assertRondaAbierta(ronda)

    const existing = await ctx.db
      .query('fichasAnalizadores')
      .withIndex('by_ficha', (q) => q.eq('fichaId', fichaId))
      .collect()
    await Promise.all(existing.map((r) => ctx.db.delete(r._id)))
    await Promise.all(items.map((item) => ctx.db.insert('fichasAnalizadores', { fichaId, ...item })))
    await ctx.db.patch(fichaId, { updatedAt: Date.now() })
  },
})

export const adminReplaceAnalizadores = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    items: v.array(v.object({
      sortOrder:              v.number(),
      analito:                v.string(),
      fabricante:             v.string(),
      modelo:                 v.string(),
      numeroSerie:            v.string(),
      metodoEpa:              v.string(),
      fechaUltimaCalibracion: v.optional(v.string()),
      tipoVerificacion:       v.string(),
      incertidumbreDeclarada: v.string(),
      unidadSalida:           v.string(),
    })),
  },
  handler: async (ctx, { fichaId, items }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const existing = await ctx.db
      .query('fichasAnalizadores')
      .withIndex('by_ficha', (q) => q.eq('fichaId', fichaId))
      .collect()
    await Promise.all(existing.map((r) => ctx.db.delete(r._id)))
    await Promise.all(items.map((item) => ctx.db.insert('fichasAnalizadores', { fichaId, ...item })))
    await ctx.db.patch(fichaId, { updatedAt: Date.now() })
  },
})

export const replaceInstrumentos = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    items: v.array(v.object({
      sortOrder:   v.number(),
      equipo:      v.string(),
      marcaModelo: v.string(),
      numeroSerie: v.string(),
      cantidad:    v.number(),
    })),
  },
  handler: async (ctx, { fichaId, items }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const ronda = await getRondaByFichaId(ctx, fichaId)
    assertRondaAbierta(ronda)

    const existing = await ctx.db
      .query('fichasInstrumentos')
      .withIndex('by_ficha', (q) => q.eq('fichaId', fichaId))
      .collect()
    await Promise.all(existing.map((r) => ctx.db.delete(r._id)))
    await Promise.all(items.map((item) => ctx.db.insert('fichasInstrumentos', { fichaId, ...item })))
    await ctx.db.patch(fichaId, { updatedAt: Date.now() })
  },
})

export const adminReplaceInstrumentos = mutation({
  args: {
    fichaId: v.id('fichasRegistro'),
    items: v.array(v.object({
      sortOrder:   v.number(),
      equipo:      v.string(),
      marcaModelo: v.string(),
      numeroSerie: v.string(),
      cantidad:    v.number(),
    })),
  },
  handler: async (ctx, { fichaId, items }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')

    const existing = await ctx.db
      .query('fichasInstrumentos')
      .withIndex('by_ficha', (q) => q.eq('fichaId', fichaId))
      .collect()
    await Promise.all(existing.map((r) => ctx.db.delete(r._id)))
    await Promise.all(items.map((item) => ctx.db.insert('fichasInstrumentos', { fichaId, ...item })))
    await ctx.db.patch(fichaId, { updatedAt: Date.now() })
  },
})

export const submitFicha = mutation({
  args: { fichaId: v.id('fichasRegistro') },
  handler: async (ctx, { fichaId }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')
    if (ficha.estado !== 'borrador') throw new Error('Ficha no en estado borrador')

    const ronda = await getRondaByFichaId(ctx, fichaId)
    assertRondaAbierta(ronda)

    await ctx.db.patch(fichaId, { estado: 'enviado', updatedAt: Date.now() })
  },
})

export const reabrirFicha = mutation({
  args: { fichaId: v.id('fichasRegistro') },
  handler: async (ctx, { fichaId }) => {
    const ficha = await ctx.db.get(fichaId)
    if (!ficha) throw new Error('Ficha no encontrada')
    if (ficha.estado !== 'enviado') throw new Error('Ficha no enviada')

    await ctx.db.patch(fichaId, { estado: 'borrador', updatedAt: Date.now() })
  },
})
