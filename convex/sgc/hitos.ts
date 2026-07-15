import { v } from 'convex/values'
import { requireSgcManage, requireParticipanteOAdmin, writeAudit, SgcQueryConfig, SgcMutationConfig } from './shared'

const listHitosRondaArgs = { rondaId: v.id('rondas') }

export const listHitosRondaConfig = {
  args: listHitosRondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcManage(ctx)
    return ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
} satisfies SgcQueryConfig<typeof listHitosRondaArgs>

const createHitoRondaArgs = {
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
  }

export const createHitoRondaConfig = {
  args: createHitoRondaArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
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
} satisfies SgcMutationConfig<typeof createHitoRondaArgs>

const updateHitoRondaArgs = {
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
  }

export const updateHitoRondaConfig = {
  args: updateHitoRondaArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
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
} satisfies SgcMutationConfig<typeof updateHitoRondaArgs>

const getHitosVisibleParticipanteArgs = { rondaId: v.id('rondas') }

export const getHitosVisibleParticipanteConfig = {
  args: getHitosVisibleParticipanteArgs,
  handler: async (ctx, { rondaId }) => {
    await requireParticipanteOAdmin(ctx, rondaId)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')
    return ctx.db
      .query('sgcHitosRonda')
      .withIndex('by_rondaId_and_visibleParticipante', (q) =>
        q.eq('rondaId', rondaId).eq('visibleParticipante', true))
      .take(250)
  },
} satisfies SgcQueryConfig<typeof getHitosVisibleParticipanteArgs>
