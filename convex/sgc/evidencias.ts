import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { FORMATOS_ARCHIVO, formatoValidator, requireSgcAdmin, requireParticipanteOAdmin, writeAudit, SgcQueryConfig, SgcMutationConfig } from './shared'

const listEvidenciaSeriesArgs = { rondaId: v.id('rondas') }

export const listEvidenciaSeriesConfig = {
  args: listEvidenciaSeriesArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
} satisfies SgcQueryConfig<typeof listEvidenciaSeriesArgs>

const listEvidenciaVersionesArgs = { serieId: v.id('sgcEvidenciaSeries'), paginationOpts: paginationOptsValidator }

export const listEvidenciaVersionesConfig = {
  args: listEvidenciaVersionesArgs,
  handler: async (ctx, { serieId, paginationOpts }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId', (q) => q.eq('serieId', serieId)).order('desc').paginate(paginationOpts)
  },
} satisfies SgcQueryConfig<typeof listEvidenciaVersionesArgs>

const getDownloadUrlArgs = { evidenciaVersionId: v.id('sgcEvidenciaVersiones') }

export const getDownloadUrlConfig = {
  args: getDownloadUrlArgs,
  handler: async (ctx, { evidenciaVersionId }) => {
    await requireSgcAdmin(ctx)
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) return null
    return ctx.storage.getUrl(version.storageId)
  },
} satisfies SgcQueryConfig<typeof getDownloadUrlArgs>

const getEvidenciaVersionContextArgs = { evidenciaVersionId: v.id('sgcEvidenciaVersiones') }

export const getEvidenciaVersionContextConfig = {
  args: getEvidenciaVersionContextArgs,
  handler: async (ctx, { evidenciaVersionId }) => {
    await requireSgcAdmin(ctx)
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) return null
    return {
      _id: version._id,
      rondaId: version.rondaId,
      serieId: version.serieId,
      estado: version.estado,
      fileName: version.fileName,
    }
  },
} satisfies SgcQueryConfig<typeof getEvidenciaVersionContextArgs>

const createEvidenciaSeriesArgs = {
    rondaId: v.id('rondas'),
    formato: formatoValidator,
    seccion: v.union(v.string(), v.null()),
    nombre: v.string(),
    requerida: v.boolean(),
    publicaParticipante: v.boolean(),
  }

export const createEvidenciaSeriesConfig = {
  args: createEvidenciaSeriesArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const existing = await ctx.db
      .query('sgcEvidenciaSeries')
      .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', args.rondaId).eq('formato', args.formato))
      .first()
    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { nombre: args.nombre, requerida: args.requerida, publicaParticipante: args.publicaParticipante, seccion: args.seccion, updatedAt: now, updatedBy: actor })
      return existing._id
    }
    const id = await ctx.db.insert('sgcEvidenciaSeries', { rondaId: args.rondaId, formato: args.formato, seccion: args.seccion, nombre: args.nombre, requerida: args.requerida, publicaParticipante: args.publicaParticipante, createdAt: now, createdBy: actor, updatedAt: now, updatedBy: actor })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.evidencia.serie_creada', targetTipo: 'sgcEvidenciaSeries', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof createEvidenciaSeriesArgs>

const registrarEvidenciaVersionArgs = {
    serieId: v.id('sgcEvidenciaSeries'),
    storageId: v.id('_storage'),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    hash: v.union(v.string(), v.null()),
  }

export const registrarEvidenciaVersionConfig = {
  args: registrarEvidenciaVersionArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const serie = await ctx.db.get(args.serieId)
    if (!serie) throw new Error('Serie de evidencia no encontrada.')
    if (!FORMATOS_ARCHIVO.includes(serie.formato as (typeof FORMATOS_ARCHIVO)[number])) {
      throw new Error('Este formato no admite evidencia de archivo en Fase 1.')
    }
    if (args.size > 10 * 1024 * 1024) throw new Error('El archivo excede el limite de 10 MB.')
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'image/png', 'image/jpeg']
    if (!allowed.includes(args.contentType)) throw new Error('Tipo de archivo no permitido.')

    const anteriores = await ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId', (q) => q.eq('serieId', args.serieId)).collect()
    for (const anterior of anteriores.filter((v0) => v0.estado === 'vigente')) {
      await ctx.db.patch(anterior._id, { estado: 'reemplazada', updatedAt: Date.now(), updatedBy: actor })
    }
    const now = Date.now()
    const id = await ctx.db.insert('sgcEvidenciaVersiones', {
      serieId: args.serieId,
      rondaId: serie.rondaId,
      storageId: args.storageId,
      version: anteriores.length + 1,
      estado: 'vigente',
      fileName: args.fileName,
      contentType: args.contentType,
      size: args.size,
      hash: args.hash,
      motivoRetiro: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: serie.rondaId, actor, evento: 'sgc.evidencia.version_registrada', targetTipo: 'sgcEvidenciaVersiones', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof registrarEvidenciaVersionArgs>

const retirarEvidenciaVersionArgs = { evidenciaVersionId: v.id('sgcEvidenciaVersiones'), motivo: v.string() }

export const retirarEvidenciaVersionConfig = {
  args: retirarEvidenciaVersionArgs,
  handler: async (ctx, { evidenciaVersionId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    if (!motivo.trim()) throw new Error('Retirar evidencia exige motivo.')
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) throw new Error('Version no encontrada.')
    await ctx.db.patch(evidenciaVersionId, { estado: 'retirada', motivoRetiro: motivo, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: version.rondaId, actor, evento: 'sgc.evidencia.version_retirada', detalle: motivo, targetTipo: 'sgcEvidenciaVersiones', targetId: evidenciaVersionId })
  },
} satisfies SgcMutationConfig<typeof retirarEvidenciaVersionArgs>

const upsertJustificacionArgs = {
    rondaId: v.id('rondas'),
    formato: v.union(v.literal('F-PSEA-05'), v.literal('F-PSEA-05A'), v.literal('F-PSEA-12')),
    alcance: v.string(),
    razon: v.string(),
  }

export const upsertJustificacionConfig = {
  args: upsertJustificacionArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    if (!args.razon.trim()) throw new Error('La justificacion exige una razon documentada.')
    const now = Date.now()
    const anteriores = await ctx.db
      .query('sgcJustificaciones')
      .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', args.rondaId).eq('formato', args.formato))
      .collect()
    for (const anterior of anteriores.filter((row) => row.estado === 'vigente')) {
      await ctx.db.patch(anterior._id, { estado: 'reemplazada', updatedAt: now, updatedBy: actor })
    }
    const id = await ctx.db.insert('sgcJustificaciones', {
      rondaId: args.rondaId,
      formato: args.formato,
      alcance: args.alcance.trim() || 'ronda',
      razon: args.razon.trim(),
      estado: 'vigente',
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.justificacion.registrada', detalle: args.formato, targetTipo: 'sgcJustificaciones', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof upsertJustificacionArgs>

const retirarJustificacionArgs = {
    justificacionId: v.id('sgcJustificaciones'),
    motivo: v.string(),
  }

export const retirarJustificacionConfig = {
  args: retirarJustificacionArgs,
  handler: async (ctx, { justificacionId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    if (!motivo.trim()) throw new Error('Retirar una justificacion exige motivo.')
    const justificacion = await ctx.db.get(justificacionId)
    if (!justificacion) throw new Error('Justificacion no encontrada.')
    await ctx.db.patch(justificacionId, { estado: 'retirada', updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: justificacion.rondaId, actor, evento: 'sgc.justificacion.retirada', detalle: motivo, targetTipo: 'sgcJustificaciones', targetId: justificacionId })
  },
} satisfies SgcMutationConfig<typeof retirarJustificacionArgs>

const getEvidenciasPublicasArgs = { rondaId: v.id('rondas') }

export const getEvidenciasPublicasConfig = {
  args: getEvidenciasPublicasArgs,
  handler: async (ctx, { rondaId }) => {
    await requireParticipanteOAdmin(ctx, rondaId)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')
    const series = await ctx.db
      .query('sgcEvidenciaSeries')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId))
      .filter((q) => q.eq(q.field('publicaParticipante'), true))
      .collect()
    const results = await Promise.all(
      series.map(async (serie) => {
        const vigente = await ctx.db
          .query('sgcEvidenciaVersiones')
          .withIndex('by_serieId_and_estado', (q) => q.eq('serieId', serie._id).eq('estado', 'vigente'))
          .first()
        return { serie, vigente }
      })
    )
    return results
  },
} satisfies SgcQueryConfig<typeof getEvidenciasPublicasArgs>

