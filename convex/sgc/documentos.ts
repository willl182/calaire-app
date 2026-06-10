import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { DOCUMENTO_SGC_CONTENT_TYPES, requireSgcAdmin, writeGlobalAudit, normalizeCodigoDocumento, SgcQueryConfig, SgcMutationConfig } from './shared'

const listDocumentosSgcArgs = {
    proceso: v.optional(v.union(v.string(), v.null())),
    estado: v.optional(v.union(v.literal('borrador'), v.literal('vigente'), v.literal('obsoleto'), v.literal('en_revision'), v.null())),
  }

export const listDocumentosSgcConfig = {
  args: listDocumentosSgcArgs,
  handler: async (ctx, args) => {
    await requireSgcAdmin(ctx)
    if (args.proceso?.trim() && args.estado) {
      return ctx.db
        .query('documentosSgc')
        .withIndex('by_proceso_and_estado', (q) => q.eq('proceso', args.proceso!.trim()).eq('estado', args.estado!))
        .collect()
    }
    if (args.proceso?.trim()) {
      return ctx.db.query('documentosSgc').withIndex('by_proceso', (q) => q.eq('proceso', args.proceso!.trim())).collect()
    }
    if (args.estado) {
      return ctx.db.query('documentosSgc').withIndex('by_estado', (q) => q.eq('estado', args.estado!)).collect()
    }
    return ctx.db.query('documentosSgc').collect()
  },
} satisfies SgcQueryConfig<typeof listDocumentosSgcArgs>

const listMatrizDocumentalSgcArgs = {}

export const listMatrizDocumentalSgcConfig = {
  args: listMatrizDocumentalSgcArgs,
  handler: async (ctx) => {
    try {
      const documentos = await ctx.db.query('documentosSgc').collect()
      const versiones = await Promise.all(
        documentos.map(async (documento) => {
          const vigente = await ctx.db
            .query('documentoSgcVersiones')
            .withIndex('by_documentoId_and_estado', (q) => q.eq('documentoId', documento._id).eq('estado', 'vigente'))
            .first()
          const historial = await ctx.db
            .query('documentoSgcVersiones')
            .withIndex('by_documentoId', (q) => q.eq('documentoId', documento._id))
            .order('desc')
            .take(5)
          return { documentoId: documento._id, vigente, historial }
        })
      )
      const procesos = Array.from(new Set(documentos.map((doc) => doc.proceso))).sort((a, b) => a.localeCompare(b))
      return {
        documentos: documentos.sort((a, b) => a.proceso.localeCompare(b.proceso) || a.codigo.localeCompare(b.codigo)),
        versiones,
        procesos,
        resumen: {
          total: documentos.length,
          vigentes: documentos.filter((doc) => doc.estado === 'vigente').length,
          enRevision: documentos.filter((doc) => doc.estado === 'en_revision').length,
          obsoletos: documentos.filter((doc) => doc.estado === 'obsoleto').length,
        },
      }
    } catch {
      return {
        documentos: [],
        versiones: [],
        procesos: [],
        resumen: { total: 0, vigentes: 0, enRevision: 0, obsoletos: 0 },
      }
    }
  },
} satisfies SgcQueryConfig<typeof listMatrizDocumentalSgcArgs>

const listDocumentoSgcVersionesArgs = { documentoId: v.id('documentosSgc'), paginationOpts: paginationOptsValidator }

export const listDocumentoSgcVersionesConfig = {
  args: listDocumentoSgcVersionesArgs,
  handler: async (ctx, { documentoId, paginationOpts }) => {
    await requireSgcAdmin(ctx)
    return ctx.db
      .query('documentoSgcVersiones')
      .withIndex('by_documentoId', (q) => q.eq('documentoId', documentoId))
      .order('desc')
      .paginate(paginationOpts)
  },
} satisfies SgcQueryConfig<typeof listDocumentoSgcVersionesArgs>

const getDocumentoSgcDownloadUrlArgs = { versionId: v.id('documentoSgcVersiones') }

export const getDocumentoSgcDownloadUrlConfig = {
  args: getDocumentoSgcDownloadUrlArgs,
  handler: async (ctx, { versionId }) => {
    await requireSgcAdmin(ctx)
    const version = await ctx.db.get(versionId)
    if (!version?.storageId) return null
    return ctx.storage.getUrl(version.storageId)
  },
} satisfies SgcQueryConfig<typeof getDocumentoSgcDownloadUrlArgs>

const upsertDocumentoSgcArgs = {
    documentoId: v.union(v.id('documentosSgc'), v.null()),
    codigo: v.string(),
    nombre: v.string(),
    proceso: v.string(),
    tipo: v.union(v.literal('formato'), v.literal('procedimiento'), v.literal('instructivo'), v.literal('plantilla'), v.literal('registro'), v.literal('otro')),
    estado: v.union(v.literal('borrador'), v.literal('vigente'), v.literal('obsoleto'), v.literal('en_revision')),
    propietario: v.string(),
    criticidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta')),
    retencion: v.union(v.string(), v.null()),
    ubicacionFuente: v.union(v.string(), v.null()),
    notas: v.union(v.string(), v.null()),
  }

export const upsertDocumentoSgcConfig = {
  args: upsertDocumentoSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const codigo = normalizeCodigoDocumento(args.codigo)
    const nombre = args.nombre.trim()
    const proceso = args.proceso.trim()
    if (!codigo || !nombre || !proceso) throw new Error('Codigo, nombre y proceso son obligatorios.')
    const existingByCodigo = await ctx.db.query('documentosSgc').withIndex('by_codigo', (q) => q.eq('codigo', codigo)).first()
    if (existingByCodigo && existingByCodigo._id !== args.documentoId) {
      throw new Error('Ya existe un documento SGC con ese codigo.')
    }
    const now = Date.now()
    const patch = {
      codigo,
      nombre,
      proceso,
      tipo: args.tipo,
      estado: args.estado,
      propietario: args.propietario.trim() || actor,
      criticidad: args.criticidad,
      retencion: args.retencion?.trim() || null,
      ubicacionFuente: args.ubicacionFuente?.trim() || null,
      notas: args.notas?.trim() || null,
      updatedAt: now,
      updatedBy: actor,
    }
    if (args.documentoId) {
      const documento = await ctx.db.get(args.documentoId)
      if (!documento) throw new Error('Documento SGC no encontrado.')
      await ctx.db.patch(args.documentoId, patch)
      await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.actualizado', detalle: codigo, targetTipo: 'documentosSgc', targetId: args.documentoId })
      return args.documentoId
    }
    const id = await ctx.db.insert('documentosSgc', {
      ...patch,
      createdAt: now,
      createdBy: actor,
    })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.creado', detalle: codigo, targetTipo: 'documentosSgc', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof upsertDocumentoSgcArgs>

const registrarDocumentoSgcVersionArgs = {
    documentoId: v.id('documentosSgc'),
    fechaVigencia: v.union(v.string(), v.null()),
    cambioResumen: v.string(),
    storageId: v.union(v.id('_storage'), v.null()),
    fileName: v.union(v.string(), v.null()),
    contentType: v.union(v.string(), v.null()),
    size: v.union(v.number(), v.null()),
    hash: v.union(v.string(), v.null()),
  }

export const registrarDocumentoSgcVersionConfig = {
  args: registrarDocumentoSgcVersionArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const documento = await ctx.db.get(args.documentoId)
    if (!documento) throw new Error('Documento SGC no encontrado.')
    const resumen = args.cambioResumen.trim()
    if (!resumen) throw new Error('Registrar una version exige resumen de cambios.')
    if (args.storageId) {
      if (!args.fileName || !args.contentType || !args.size) throw new Error('El archivo de version exige nombre, tipo y tamano.')
      if (args.size > 10 * 1024 * 1024) throw new Error('El archivo excede el limite de 10 MB.')
      if (!DOCUMENTO_SGC_CONTENT_TYPES.includes(args.contentType as (typeof DOCUMENTO_SGC_CONTENT_TYPES)[number])) {
        throw new Error('Tipo de archivo no permitido para documento SGC.')
      }
    }
    const anteriores = await ctx.db
      .query('documentoSgcVersiones')
      .withIndex('by_documentoId', (q) => q.eq('documentoId', args.documentoId))
      .collect()
    const now = Date.now()
    for (const vigente of anteriores.filter((version) => version.estado === 'vigente')) {
      await ctx.db.patch(vigente._id, { estado: 'reemplazada', updatedAt: now, updatedBy: actor })
    }
    const id = await ctx.db.insert('documentoSgcVersiones', {
      documentoId: args.documentoId,
      version: anteriores.length + 1,
      estado: 'vigente',
      fechaVigencia: args.fechaVigencia,
      cambioResumen: resumen,
      storageId: args.storageId,
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
    await ctx.db.patch(args.documentoId, { estado: 'vigente', updatedAt: now, updatedBy: actor })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.version_registrada', detalle: documento.codigo, targetTipo: 'documentoSgcVersiones', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof registrarDocumentoSgcVersionArgs>

const retirarDocumentoSgcVersionArgs = { versionId: v.id('documentoSgcVersiones'), motivo: v.string() }

export const retirarDocumentoSgcVersionConfig = {
  args: retirarDocumentoSgcVersionArgs,
  handler: async (ctx, { versionId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    const version = await ctx.db.get(versionId)
    if (!version) throw new Error('Version de documento no encontrada.')
    if (!motivo.trim()) throw new Error('Retirar una version exige motivo.')
    await ctx.db.patch(versionId, { estado: 'retirada', motivoRetiro: motivo.trim(), updatedAt: Date.now(), updatedBy: actor })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.version_retirada', detalle: motivo, targetTipo: 'documentoSgcVersiones', targetId: versionId })
  },
} satisfies SgcMutationConfig<typeof retirarDocumentoSgcVersionArgs>

