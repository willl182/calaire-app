import { v } from 'convex/values'
import { requireSgcAdmin, requireParticipanteOAdmin, writeAudit, SgcQueryConfig, SgcMutationConfig } from './shared'

const listPublicacionesArgs = { rondaId: v.id('rondas') }

export const listPublicacionesConfig = {
  args: listPublicacionesArgs,
  handler: async (ctx, { rondaId }) => {
    await requireParticipanteOAdmin(ctx, rondaId)
    const now = Date.now()
    return ctx.db
      .query('sgcPublicaciones')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId))
      .filter((q) => q.lte(q.field('visibleDesde'), now))
      .order('desc')
      .collect()
  },
} satisfies SgcQueryConfig<typeof listPublicacionesArgs>

const createPublicacionArgs = {
    rondaId: v.id('rondas'),
    titulo: v.string(),
    contenido: v.string(),
    tipo: v.union(v.literal('resultado'), v.literal('comunicado'), v.literal('cronograma'), v.literal('evidencia')),
    visibleDesde: v.number(),
    visibleHasta: v.union(v.number(), v.null()),
  }

export const createPublicacionConfig = {
  args: createPublicacionArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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
} satisfies SgcMutationConfig<typeof createPublicacionArgs>

const deletePublicacionArgs = { publicacionId: v.id('sgcPublicaciones') }

export const deletePublicacionConfig = {
  args: deletePublicacionArgs,
  handler: async (ctx, { publicacionId }) => {
    const actor = await requireSgcAdmin(ctx)
    const pub = await ctx.db.get(publicacionId)
    if (!pub) throw new Error('Publicacion no encontrada.')
    await ctx.db.delete(publicacionId)
    await writeAudit(ctx, { rondaId: pub.rondaId, actor, evento: 'sgc.publicacion.eliminada', targetTipo: 'sgcPublicaciones', targetId: publicacionId })
  },
} satisfies SgcMutationConfig<typeof deletePublicacionArgs>

