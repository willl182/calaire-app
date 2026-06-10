import { v } from 'convex/values'
import { requireSgcAdmin, writeAudit, getRevision, getRevisionHomogeneidadDoc, collectCoverage, buildRevisionMetricas, buildHomogeneidadMetricas, createSnapshot, SgcQueryConfig, SgcMutationConfig } from './shared'

const getRevisionDatosArgs = { rondaId: v.id('rondas') }

export const getRevisionDatosConfig = {
  args: getRevisionDatosArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return getRevision(ctx, rondaId)
  },
} satisfies SgcQueryConfig<typeof getRevisionDatosArgs>

const getRevisionHomogeneidadArgs = { rondaId: v.id('rondas') }

export const getRevisionHomogeneidadConfig = {
  args: getRevisionHomogeneidadArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return getRevisionHomogeneidadDoc(ctx, rondaId)
  },
} satisfies SgcQueryConfig<typeof getRevisionHomogeneidadArgs>

const createOrUpdateRevisionDatosArgs = {
    rondaId: v.id('rondas'),
    checks: v.record(v.string(), v.object({ cumple: v.boolean(), observacion: v.union(v.string(), v.null()) })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
  }

export const createOrUpdateRevisionDatosConfig = {
  args: createOrUpdateRevisionDatosArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    const coverage = await collectCoverage(ctx, args.rondaId)
    const metricas = { ...buildRevisionMetricas(coverage), ...args.metricas }
    const checks = Object.fromEntries(
      Object.entries(args.checks).map(([key, value]) => [key, { ...value, updatedAt: now, updatedBy: actor }])
    )
    const existing = await getRevision(ctx, args.rondaId)
    if (existing) {
      await ctx.db.patch(existing._id, { checks, metricas, estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado, updatedAt: now, updatedBy: actor })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.revision.actualizada', targetTipo: 'sgcRevisionDatos', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcRevisionDatos', {
      rondaId: args.rondaId,
      estado: 'borrador',
      checks,
      metricas,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.revision.creada', targetTipo: 'sgcRevisionDatos', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof createOrUpdateRevisionDatosArgs>

const finalizarRevisionDatosArgs = { rondaId: v.id('rondas') }

export const finalizarRevisionDatosConfig = {
  args: finalizarRevisionDatosArgs,
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const revision = await getRevision(ctx, rondaId)
    if (!revision) throw new Error('No existe revision de datos.')
    for (const [key, check] of Object.entries(revision.checks)) {
      if (!check.cumple && !check.observacion?.trim()) {
        throw new Error(`El check ${key} no cumple y requiere observacion.`)
      }
    }
    const now = Date.now()
    await ctx.db.patch(revision._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    const updated = await ctx.db.get(revision._id)
    await createSnapshot(ctx, { rondaId, tipoRegistro: 'revision_datos', registroId: String(revision._id), payload: updated, actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.revision.finalizada', targetTipo: 'sgcRevisionDatos', targetId: revision._id })
  },
} satisfies SgcMutationConfig<typeof finalizarRevisionDatosArgs>

const createOrUpdateRevisionHomogeneidadArgs = {
    rondaId: v.id('rondas'),
    checks: v.record(v.string(), v.object({ cumple: v.boolean(), observacion: v.union(v.string(), v.null()) })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
    conclusiones: v.union(v.string(), v.null()),
  }

export const createOrUpdateRevisionHomogeneidadConfig = {
  args: createOrUpdateRevisionHomogeneidadArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    const coverage = await collectCoverage(ctx, args.rondaId)
    const resultados = await ctx.db
      .query('sgcResultadosPtApp')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId))
      .collect()
    const metricas = {
      ...buildHomogeneidadMetricas(coverage),
      resultado_homogeneidad_aprobado: resultados.some((row) => row.tipoResultado === 'homogeneidad' && row.estado === 'aprobado'),
      resultado_estabilidad_aprobado: resultados.some((row) => row.tipoResultado === 'estabilidad' && row.estado === 'aprobado'),
      ...args.metricas,
    }
    const checks = Object.fromEntries(
      Object.entries(args.checks).map(([key, value]) => [key, { ...value, updatedAt: now, updatedBy: actor }])
    )
    const existing = await getRevisionHomogeneidadDoc(ctx, args.rondaId)
    if (existing) {
      await ctx.db.patch(existing._id, {
        checks,
        metricas,
        conclusiones: args.conclusiones,
        estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado,
        updatedAt: now,
        updatedBy: actor,
      })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.f_psea_08.actualizado', targetTipo: 'sgcRevisionHomogeneidad', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcRevisionHomogeneidad', {
      rondaId: args.rondaId,
      estado: 'borrador',
      checks,
      metricas,
      conclusiones: args.conclusiones,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.f_psea_08.creado', targetTipo: 'sgcRevisionHomogeneidad', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof createOrUpdateRevisionHomogeneidadArgs>

const finalizarRevisionHomogeneidadArgs = { rondaId: v.id('rondas') }

export const finalizarRevisionHomogeneidadConfig = {
  args: finalizarRevisionHomogeneidadArgs,
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const revision = await getRevisionHomogeneidadDoc(ctx, rondaId)
    if (!revision) throw new Error('No existe revision F-PSEA-08.')
    if (!revision.conclusiones?.trim()) throw new Error('Finalizar F-PSEA-08 exige una conclusion documentada.')
    for (const [key, check] of Object.entries(revision.checks)) {
      if (!check.cumple && !check.observacion?.trim()) {
        throw new Error(`El check ${key} no cumple y requiere observacion.`)
      }
    }
    const now = Date.now()
    await ctx.db.patch(revision._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    const updated = await ctx.db.get(revision._id)
    await createSnapshot(ctx, { rondaId, tipoRegistro: 'revision_homogeneidad', registroId: String(revision._id), payload: updated, actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.f_psea_08.finalizado', targetTipo: 'sgcRevisionHomogeneidad', targetId: revision._id })
  },
} satisfies SgcMutationConfig<typeof finalizarRevisionHomogeneidadArgs>

