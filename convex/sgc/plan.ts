import { v } from 'convex/values'
import { requireSgcManage, writeAudit, getPlan, createSnapshot, SgcQueryConfig, SgcMutationConfig } from './shared'

const getPlanRondaArgs = { rondaId: v.id('rondas') }

export const getPlanRondaConfig = {
  args: getPlanRondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcManage(ctx)
    return getPlan(ctx, rondaId)
  },
} satisfies SgcQueryConfig<typeof getPlanRondaArgs>

const createOrUpdatePlanRondaArgs = {
    rondaId: v.id('rondas'),
    bloques: v.record(v.string(), v.string()),
    camposEstructurados: v.record(v.string(), v.string()),
    motivoRevision: v.optional(v.string()),
  }

export const createOrUpdatePlanRondaConfig = {
  args: createOrUpdatePlanRondaArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const now = Date.now()
    const existing = await getPlan(ctx, args.rondaId)
    if (existing?.estado === 'finalizado' && !args.motivoRevision?.trim()) {
      throw new Error('Editar un plan finalizado exige motivo.')
    }
    if (existing) {
      await ctx.db.patch(existing._id, {
        bloques: args.bloques,
        camposEstructurados: args.camposEstructurados,
        motivoRevision: args.motivoRevision ?? existing.motivoRevision ?? null,
        estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado,
        updatedAt: now,
        updatedBy: actor,
      })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.plan.actualizado', targetTipo: 'sgcPlanRonda', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcPlanRonda', {
      rondaId: args.rondaId,
      estado: 'borrador',
      bloques: args.bloques,
      camposEstructurados: args.camposEstructurados,
      motivoRevision: args.motivoRevision ?? null,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.plan.creado', targetTipo: 'sgcPlanRonda', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof createOrUpdatePlanRondaArgs>

const finalizarPlanRondaArgs = { rondaId: v.id('rondas') }

export const finalizarPlanRondaConfig = {
  args: finalizarPlanRondaArgs,
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcManage(ctx)
    const plan = await getPlan(ctx, rondaId)
    if (!plan) throw new Error('No existe plan de ronda.')
    const now = Date.now()
    await ctx.db.patch(plan._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    const updated = await ctx.db.get(plan._id)
    await createSnapshot(ctx, { rondaId, tipoRegistro: 'plan_ronda', registroId: String(plan._id), payload: updated, actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.plan.finalizado', targetTipo: 'sgcPlanRonda', targetId: plan._id })
  },
} satisfies SgcMutationConfig<typeof finalizarPlanRondaArgs>

