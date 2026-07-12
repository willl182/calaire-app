import { v } from 'convex/values'
import { requireSgcManage, writeAudit, SgcQueryConfig, SgcMutationConfig } from './shared'

const listComunicacionesArgs = { rondaId: v.id('rondas') }

export const listComunicacionesConfig = {
  args: listComunicacionesArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcManage(ctx)
    return ctx.db.query('sgcComunicaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
} satisfies SgcQueryConfig<typeof listComunicacionesArgs>

const createComunicacionArgs = {
    rondaId: v.id('rondas'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  }

export const createComunicacionConfig = {
  args: createComunicacionArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
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
} satisfies SgcMutationConfig<typeof createComunicacionArgs>

const updateComunicacionArgs = {
    comunicacionId: v.id('sgcComunicaciones'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  }

export const updateComunicacionConfig = {
  args: updateComunicacionArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
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
} satisfies SgcMutationConfig<typeof updateComunicacionArgs>

const deleteComunicacionArgs = { comunicacionId: v.id('sgcComunicaciones') }

export const deleteComunicacionConfig = {
  args: deleteComunicacionArgs,
  handler: async (ctx, { comunicacionId }) => {
    const actor = await requireSgcManage(ctx)
    const comunicacion = await ctx.db.get(comunicacionId)
    if (!comunicacion) throw new Error('Comunicacion no encontrada.')
    await ctx.db.delete(comunicacionId)
    await writeAudit(ctx, { rondaId: comunicacion.rondaId, actor, evento: 'sgc.comunicacion.eliminada', targetTipo: 'sgcComunicaciones', targetId: comunicacionId })
  },
} satisfies SgcMutationConfig<typeof deleteComunicacionArgs>

