import { v } from 'convex/values'
import { defineRondaMutation, defineRondaQuery } from './definitions'
import { getDirectorioByLookup, upsertDirectorioFromParticipant } from './directorio'
import { mapDirectorioParticipante } from './mapping'

export const listDirectorioParticipantesDefinition = defineRondaQuery({
  args: {},
  handler: async (ctx) => {
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
      ...mapDirectorioParticipante(row),
      rondas_count: linkCount.get(String(row._id)) ?? 0,
    }))
  },
})

export const getDirectorioParticipanteByLookupDefinition = defineRondaQuery({
  args: { lookup: v.string() },
  handler: async (ctx, { lookup }) => {
    const row = await getDirectorioByLookup(ctx, lookup)
    if (!row) return null
    return mapDirectorioParticipante(row)
  },
})

export const upsertDirectorioParticipanteDefinition = defineRondaMutation({
  args: {
    nit: v.string(),
    correo: v.string(),
    nombreLaboratorio: v.optional(v.union(v.string(), v.null())),
    nombreResponsable: v.optional(v.union(v.string(), v.null())),
    cargo: v.optional(v.union(v.string(), v.null())),
    ciudad: v.optional(v.union(v.string(), v.null())),
    departamento: v.optional(v.union(v.string(), v.null())),
    telefono: v.optional(v.union(v.string(), v.null())),
    workosUserId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    return upsertDirectorioFromParticipant(ctx, args)
  },
})

