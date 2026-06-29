import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import { canReadDocumentoSgc, DOCUMENTO_SGC_CONTENT_TYPES, normalizeCodigoDocumento, requireSgcAdmin, requireSgcViewer, requireSgcViewerAccess, SgcMutationConfig, SgcQueryConfig, writeGlobalAudit } from './shared'

const familiaValidator = v.union(v.literal('DG'), v.literal('P'), v.literal('I'), v.literal('F'), v.literal('OTRO'))
const estadoDocumentoValidator = v.union(v.literal('borrador'), v.literal('vigente'), v.literal('obsoleto'), v.literal('en_revision'))
const modoDiligenciamientoValidator = v.union(v.literal('no_diligenciable'), v.literal('solo_archivo'), v.literal('ui_nativo'), v.literal('ui_nativo_exportable'))
const visibilidadValidator = v.union(v.literal('interna'), v.literal('participantes'), v.literal('publica'))
const modoControlValidator = v.union(v.literal('app_oficial'), v.literal('externo_referenciado'), v.literal('mixto'))
const criticidadValidator = v.union(v.literal('baja'), v.literal('media'), v.literal('alta'), v.literal('pendiente'))
const estadoVersionValidator = v.union(v.literal('vigente'), v.literal('reemplazada'), v.literal('retirada'))
const tipoCoberturaValidator = v.union(v.literal('cubre'), v.literal('apoya'), v.literal('evidencia'), v.literal('no_aplica_justificado'))
const estadoCoberturaValidator = v.union(v.literal('cubierto'), v.literal('parcial'), v.literal('pendiente'), v.literal('no_aplica'))
const entidadTipoValidator = v.union(v.literal('ronda'), v.literal('equipo'), v.literal('proveedor'), v.literal('auditoria'), v.literal('caso'), v.literal('transversal'))

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeHttpUrl(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
  } catch {
    return null
  }
  return null
}

function mapRelationKey(item: {
  bloque: string
  rutaCritica?: string | null
  origenCodigo: string
  destinoCodigo?: string | null
  tipoRelacion: string
  ambito: string
  destinoTipo: string
  origenFuente?: string | null
}) {
  return [
    item.bloque.trim(),
    item.rutaCritica?.trim() ?? '',
    normalizeCodigoDocumento(item.origenCodigo),
    item.destinoCodigo ? normalizeCodigoDocumento(item.destinoCodigo) : '',
    item.tipoRelacion,
    item.ambito.trim(),
    item.destinoTipo,
    item.origenFuente?.trim() ?? '',
  ].join('|')
}

function inferTipoFromFamilia(familia: string) {
  if (familia === 'F') return 'formato'
  if (familia === 'P') return 'procedimiento'
  if (familia === 'I') return 'instructivo'
  if (familia === 'DG') return 'otro'
  return 'otro'
}

async function collectDocumentBundle(ctx: QueryCtx, documentoId: Id<'documentosSgc'>, access: { canReadInternal: boolean }) {
  const documento = await ctx.db.get(documentoId)
  if (!documento) return null
  if (!canReadDocumentoSgc(documento, access)) return null
  const [versiones, registros, relaciones] = await Promise.all([
    ctx.db.query('documentoSgcVersiones').withIndex('by_documentoId', (q) => q.eq('documentoId', documentoId)).order('desc').collect(),
    ctx.db.query('registrosSgc').withIndex('by_documentoId', (q) => q.eq('documentoId', documentoId)).order('desc').collect(),
    ctx.db.query('documentoRequisitos').withIndex('by_documentoId', (q) => q.eq('documentoId', documentoId)).collect(),
  ])
  const requisitos = await Promise.all(
    relaciones.map(async (relacion) => {
      const requisito = await ctx.db.get(relacion.requisitoId)
      return requisito ? { relacion, requisito } : null
    })
  )
  const versionesNormalizadas = versiones.map((version) => ({
    ...version,
    resumenCambios: version.resumenCambios ?? (version as { cambioResumen?: string | null }).cambioResumen ?? null,
  }))

  return {
    documento,
    versiones: versionesNormalizadas,
    versionVigente: versionesNormalizadas.find((version) => version.estado === 'vigente') ?? null,
    registros,
    requisitos: requisitos.filter((item): item is NonNullable<typeof item> => item !== null),
  }
}

const listSgcMaestroArgs = {
  ambito: v.optional(v.union(v.string(), v.null())),
  familia: v.optional(v.union(familiaValidator, v.null())),
  estado: v.optional(v.union(estadoDocumentoValidator, v.null())),
  modoDiligenciamiento: v.optional(v.union(modoDiligenciamientoValidator, v.null())),
  texto: v.optional(v.union(v.string(), v.null())),
}

export const listSgcMaestroConfig = {
  args: listSgcMaestroArgs,
  handler: async (ctx, args) => {
    const access = await requireSgcViewerAccess(ctx)
    let documentos = (await ctx.db.query('documentosSgc').collect()).filter((doc) => canReadDocumentoSgc(doc, access))
    if (args.ambito?.trim()) documentos = documentos.filter((doc) => doc.ambito === args.ambito?.trim())
    if (args.familia) documentos = documentos.filter((doc) => doc.familia === args.familia)
    if (args.estado) documentos = documentos.filter((doc) => doc.estado === args.estado)
    if (args.modoDiligenciamiento) documentos = documentos.filter((doc) => doc.modoDiligenciamiento === args.modoDiligenciamiento)
    if (args.texto?.trim()) {
      const needle = args.texto.trim().toLowerCase()
      documentos = documentos.filter((doc) => `${doc.codigo} ${doc.nombre}`.toLowerCase().includes(needle))
    }
    documentos.sort((a, b) => (a.familia ?? '').localeCompare(b.familia ?? '') || a.codigo.localeCompare(b.codigo))
    const versiones = await Promise.all(
      documentos.map(async (documento) => {
        const vigente = await ctx.db
          .query('documentoSgcVersiones')
          .withIndex('by_documentoId_and_estado', (q) => q.eq('documentoId', documento._id).eq('estado', 'vigente'))
          .first()
        const registros = await ctx.db.query('registrosSgc').withIndex('by_documentoId', (q) => q.eq('documentoId', documento._id)).collect()
        const coberturas = await ctx.db.query('documentoRequisitos').withIndex('by_documentoId', (q) => q.eq('documentoId', documento._id)).collect()
        return { documentoId: documento._id, vigente, registros: registros.length, coberturas: coberturas.length }
      })
    )
    const ambitos = Array.from(new Set(documentos.map((doc) => doc.ambito).filter((ambito): ambito is string => Boolean(ambito)))).sort()
    const familias = Array.from(new Set(documentos.map((doc) => doc.familia).filter((familia): familia is NonNullable<typeof familia> => Boolean(familia)))).sort()
    return {
      documentos,
      versiones,
      ambitos,
      familias,
      resumen: {
        total: documentos.length,
        vigentes: documentos.filter((doc) => doc.estado === 'vigente').length,
        enRevision: documentos.filter((doc) => doc.estado === 'en_revision').length,
        sinVersion: versiones.filter((version) => !version.vigente).length,
      },
    }
  },
} satisfies SgcQueryConfig<typeof listSgcMaestroArgs>

const getDocumentoMaestroArgs = { documentoId: v.id('documentosSgc') }

export const getDocumentoMaestroConfig = {
  args: getDocumentoMaestroArgs,
  handler: async (ctx, { documentoId }) => {
    const access = await requireSgcViewerAccess(ctx)
    return collectDocumentBundle(ctx, documentoId, access)
  },
} satisfies SgcQueryConfig<typeof getDocumentoMaestroArgs>

const listNormativaSgcArgs = {
  norma: v.optional(v.union(v.string(), v.null())),
  estadoCobertura: v.optional(v.union(estadoCoberturaValidator, v.null())),
}

export const listNormativaSgcConfig = {
  args: listNormativaSgcArgs,
  handler: async (ctx, args) => {
    const access = await requireSgcViewerAccess(ctx)
    const activeRequisitos = await ctx.db.query('requisitosNormativos').withIndex('by_estado', (q) => q.eq('estado', 'activo')).collect()
    const requisitos = args.norma?.trim()
      ? activeRequisitos.filter((requisito) => requisito.norma === args.norma?.trim())
      : activeRequisitos
    requisitos.sort((a, b) => a.norma.localeCompare(b.norma) || a.clausula.localeCompare(b.clausula, undefined, { numeric: true }))
    const rows = await Promise.all(
      requisitos.map(async (requisito) => {
        const todasRelaciones = await ctx.db.query('documentoRequisitos').withIndex('by_requisitoId', (q) => q.eq('requisitoId', requisito._id)).collect()
        const relaciones = args.estadoCobertura ? todasRelaciones.filter((relacion) => relacion.estadoCobertura === args.estadoCobertura) : todasRelaciones
        const documentos = await Promise.all(relaciones.map((relacion) => ctx.db.get(relacion.documentoId)))
        const visibleDocumentos = documentos.filter((documento): documento is NonNullable<typeof documento> => documento !== null && canReadDocumentoSgc(documento, access))
        const visibleRelaciones = relaciones.filter((relacion) => visibleDocumentos.some((documento) => documento._id === relacion.documentoId))
        return {
          requisito,
          relaciones: visibleRelaciones,
          todasVisibles: todasRelaciones.filter((relacion) => visibleDocumentos.some((documento) => documento._id === relacion.documentoId)),
          matchesEstadoCobertura:
            !args.estadoCobertura ||
            visibleRelaciones.length > 0 ||
            (args.estadoCobertura === 'pendiente' && todasRelaciones.length === 0),
          documentos: visibleDocumentos,
        }
      })
    )
    return {
      normas: Array.from(new Set(requisitos.map((requisito) => requisito.norma))).sort(),
      rows: rows.filter((row) => row.matchesEstadoCobertura),
      resumen: {
        requisitos: requisitos.length,
        cubiertos: rows.filter((row) => row.todasVisibles.some((relacion) => relacion.estadoCobertura === 'cubierto')).length,
        parciales: rows.filter((row) => row.todasVisibles.some((relacion) => relacion.estadoCobertura === 'parcial')).length,
        pendientes: rows.filter((row) => row.todasVisibles.length === 0 || row.todasVisibles.every((relacion) => relacion.estadoCobertura === 'pendiente')).length,
      },
    }
  },
} satisfies SgcQueryConfig<typeof listNormativaSgcArgs>

const listMapaSgcArgs = { ambito: v.optional(v.union(v.string(), v.null())) }

export const listMapaSgcConfig = {
  args: listMapaSgcArgs,
  handler: async (ctx, args) => {
    const access = await requireSgcViewerAccess(ctx)
    let relaciones = await ctx.db.query('mapaSgcRelaciones').collect()
    if (args.ambito?.trim()) relaciones = relaciones.filter((relacion) => relacion.ambito === args.ambito?.trim())
    relaciones.sort((a, b) => a.bloque.localeCompare(b.bloque) || (a.rutaCritica ?? '').localeCompare(b.rutaCritica ?? '') || a.origenCodigo.localeCompare(b.origenCodigo))
    const documentoIds = Array.from(new Set(relaciones.flatMap((relacion) => [relacion.documentoOrigenId, relacion.documentoDestinoId]).filter((id): id is Id<'documentosSgc'> => Boolean(id))))
    const documentos = await Promise.all(documentoIds.map((id) => ctx.db.get(id)))
    return {
      relaciones,
      documentos: documentos.filter((documento): documento is NonNullable<typeof documento> => documento !== null && canReadDocumentoSgc(documento, access)),
      bloques: Array.from(new Set(relaciones.map((relacion) => relacion.bloque))).sort(),
      ambitos: Array.from(new Set(relaciones.map((relacion) => relacion.ambito))).sort(),
      pendientes: relaciones.filter((relacion) => relacion.estadoResolucion === 'pendiente').length,
    }
  },
} satisfies SgcQueryConfig<typeof listMapaSgcArgs>

const listExpedientesSgcArgs = {}

export const listExpedientesSgcConfig = {
  args: listExpedientesSgcArgs,
  handler: async (ctx) => {
    await requireSgcViewer(ctx)
    const rondas = await ctx.db.query('rondas').order('desc').collect()
    return Promise.all(
      rondas.map(async (ronda) => {
        const [registros, series, hitos] = await Promise.all([
          ctx.db.query('registrosSgc').withIndex('by_rondaId', (q) => q.eq('rondaId', ronda._id)).collect(),
          ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', ronda._id)).collect(),
          ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', ronda._id)).collect(),
        ])
        const versiones = await Promise.all(
          series.map((serie) =>
            ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId_and_estado', (q) => q.eq('serieId', serie._id).eq('estado', 'vigente')).first()
          )
        )
        const totalEsperado = Math.max(series.filter((serie) => serie.requerida).length + hitos.filter((hito) => hito.bloqueaCierre).length, 1)
        const completado = series.filter((serie, index) => serie.requerida && versiones[index]).length + hitos.filter((hito) => hito.estado === 'completado' && hito.bloqueaCierre).length
        const faltantesCriticos = [
          ...series.filter((serie, index) => serie.requerida && !versiones[index]).map((serie) => `${serie.formato} sin evidencia vigente`),
          ...hitos.filter((hito) => hito.bloqueaCierre && hito.estado !== 'completado').map((hito) => `${hito.codigo} ${hito.nombre}`),
        ].slice(0, 6)
        return {
          ronda,
          progreso: Math.min(100, Math.round((completado / totalEsperado) * 100)),
          registros: registros.length,
          evidenciasVigentes: versiones.filter(Boolean).length,
          faltantesCriticos,
          externalRefs: registros.filter((registro) => registro.externalSystem === 'pt_app').map((registro) => ({
            label: registro.externalLabel ?? registro.externalRef ?? 'pt_app',
            url: registro.externalUrl,
          })),
        }
      })
    )
  },
} satisfies SgcQueryConfig<typeof listExpedientesSgcArgs>

const upsertDocumentoMaestroArgs = {
  documentoId: v.union(v.id('documentosSgc'), v.null()),
  codigo: v.string(),
  nombre: v.string(),
  familia: familiaValidator,
  ambito: v.string(),
  proceso: v.string(),
  subproceso: v.union(v.string(), v.null()),
  estado: estadoDocumentoValidator,
  modoDiligenciamiento: modoDiligenciamientoValidator,
  visibilidad: visibilidadValidator,
  modoControl: modoControlValidator,
  fuenteEditableUrl: v.union(v.string(), v.null()),
  responsable: v.string(),
  retencion: v.union(v.string(), v.null()),
  ubicacionFuente: v.union(v.string(), v.null()),
  notas: v.union(v.string(), v.null()),
}

export const upsertDocumentoMaestroConfig = {
  args: upsertDocumentoMaestroArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const codigo = normalizeCodigoDocumento(args.codigo)
    const nombre = args.nombre.trim()
    const proceso = args.proceso.trim()
    if (!codigo || !nombre || !proceso) throw new Error('Codigo, nombre y proceso son obligatorios.')
    const existingByCodigo = await ctx.db.query('documentosSgc').withIndex('by_codigo', (q) => q.eq('codigo', codigo)).first()
    if (existingByCodigo && existingByCodigo._id !== args.documentoId) throw new Error('Ya existe un documento SGC con ese codigo.')
    const now = Date.now()
    const patch = {
      codigo,
      nombre,
      familia: args.familia,
      ambito: args.ambito.trim(),
      proceso,
      subproceso: normalizeNullable(args.subproceso),
      tipo: inferTipoFromFamilia(args.familia) as 'formato' | 'procedimiento' | 'instructivo' | 'plantilla' | 'registro' | 'otro',
      estado: args.estado,
      modoDiligenciamiento: args.modoDiligenciamiento,
      visibilidad: args.visibilidad,
      modoControl: args.modoControl,
      fuenteEditableUrl: normalizeHttpUrl(args.fuenteEditableUrl),
      responsable: args.responsable.trim() || actor,
      propietario: args.responsable.trim() || actor,
      criticidad: 'media' as const,
      retencion: normalizeNullable(args.retencion),
      ubicacionFuente: normalizeNullable(args.ubicacionFuente),
      notas: normalizeNullable(args.notas),
      updatedAt: now,
      updatedBy: actor,
    }
    if (args.documentoId) {
      await ctx.db.patch(args.documentoId, patch)
      await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.documento_actualizado', detalle: codigo, targetTipo: 'documentosSgc', targetId: args.documentoId })
      return args.documentoId
    }
    const id = await ctx.db.insert('documentosSgc', { ...patch, createdAt: now, createdBy: actor })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.documento_creado', detalle: codigo, targetTipo: 'documentosSgc', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof upsertDocumentoMaestroArgs>

const registrarVersionOficialArgs = {
  documentoId: v.id('documentosSgc'),
  version: v.optional(v.union(v.number(), v.null())),
  estado: estadoVersionValidator,
  storageId: v.id('_storage'),
  fileName: v.string(),
  contentType: v.string(),
  size: v.number(),
  hash: v.union(v.string(), v.null()),
  resumenCambios: v.string(),
  elaboradoPor: v.union(v.string(), v.null()),
  revisadoPor: v.union(v.string(), v.null()),
  aprobadoPor: v.union(v.string(), v.null()),
  fechaRevision: v.union(v.string(), v.null()),
  fechaAprobacion: v.union(v.string(), v.null()),
  fechaVigencia: v.union(v.string(), v.null()),
}

export const registrarVersionOficialConfig = {
  args: registrarVersionOficialArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const documento = await ctx.db.get(args.documentoId)
    if (!documento) throw new Error('Documento SGC no encontrado.')
    if (!DOCUMENTO_SGC_CONTENT_TYPES.includes(args.contentType as (typeof DOCUMENTO_SGC_CONTENT_TYPES)[number])) throw new Error('Tipo de archivo no permitido para documento SGC.')
    const anteriores = await ctx.db.query('documentoSgcVersiones').withIndex('by_documentoId', (q) => q.eq('documentoId', args.documentoId)).collect()
    const now = Date.now()
    const version = args.version ?? Math.max(0, ...anteriores.map((item) => item.version ?? 0)) + 1
    if (!Number.isInteger(version) || version < 1) throw new Error('La version debe ser un entero positivo.')
    if (anteriores.some((item) => item.version === version)) throw new Error('Ya existe una version con ese numero para este documento.')
    if (args.estado === 'vigente') {
      for (const vigente of anteriores.filter((version) => version.estado === 'vigente')) {
        await ctx.db.patch(vigente._id, { estado: 'reemplazada', updatedAt: now, updatedBy: actor })
      }
    }
    const id = await ctx.db.insert('documentoSgcVersiones', {
      documentoId: args.documentoId,
      version,
      estado: args.estado,
      fechaVigencia: normalizeNullable(args.fechaVigencia),
      cambioResumen: args.resumenCambios.trim(),
      resumenCambios: args.resumenCambios.trim(),
      storageId: args.storageId,
      fileName: args.fileName,
      contentType: args.contentType,
      size: args.size,
      hash: normalizeNullable(args.hash),
      elaboradoPor: normalizeNullable(args.elaboradoPor),
      revisadoPor: normalizeNullable(args.revisadoPor),
      aprobadoPor: normalizeNullable(args.aprobadoPor),
      fechaRevision: normalizeNullable(args.fechaRevision),
      fechaAprobacion: normalizeNullable(args.fechaAprobacion),
      motivoObsolescencia: null,
      motivoRetiro: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    if (args.estado === 'vigente') {
      await ctx.db.patch(args.documentoId, { estado: 'vigente', versionVigenteId: id, updatedAt: now, updatedBy: actor })
    }
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.version_oficial_registrada', detalle: documento.codigo, targetTipo: 'documentoSgcVersiones', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof registrarVersionOficialArgs>

const crearRegistroSgcArgs = {
  documentoId: v.id('documentosSgc'),
  versionBaseId: v.union(v.id('documentoSgcVersiones'), v.null()),
  codigo: v.string(),
  nombre: v.string(),
  entidadTipo: entidadTipoValidator,
  rondaId: v.union(v.id('rondas'), v.null()),
  entidadRef: v.union(v.string(), v.null()),
  externalSystem: v.optional(v.union(v.literal('pt_app'), v.null())),
  externalRef: v.optional(v.union(v.string(), v.null())),
  externalUrl: v.optional(v.union(v.string(), v.null())),
  externalLabel: v.optional(v.union(v.string(), v.null())),
}

export const crearRegistroSgcConfig = {
  args: crearRegistroSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const documento = await ctx.db.get(args.documentoId)
    if (!documento) throw new Error('Documento SGC no encontrado.')
    if (args.versionBaseId) {
      const versionBase = await ctx.db.get(args.versionBaseId)
      if (!versionBase || versionBase.documentoId !== args.documentoId) {
        throw new Error('La version base no pertenece al documento SGC seleccionado.')
      }
    }
    const codigo = normalizeCodigoDocumento(args.codigo)
    const nombre = args.nombre.trim()
    if (!codigo || !nombre) throw new Error('Codigo y nombre son obligatorios.')
    const now = Date.now()
    const id = await ctx.db.insert('registrosSgc', {
      documentoId: args.documentoId,
      versionBaseId: args.versionBaseId,
      codigo,
      nombre,
      estado: 'borrador',
      visibilidad: 'interna',
      entidadTipo: args.entidadTipo,
      rondaId: args.rondaId,
      entidadRef: normalizeNullable(args.entidadRef),
      storageId: null,
      fileName: null,
      contentType: null,
      size: null,
      externalSystem: args.externalSystem ?? null,
      externalRef: normalizeNullable(args.externalRef),
      externalUrl: normalizeHttpUrl(args.externalUrl),
      externalLabel: normalizeNullable(args.externalLabel),
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.registro_derivado_creado', detalle: documento.codigo, targetTipo: 'registrosSgc', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof crearRegistroSgcArgs>

const upsertDocumentoRequisitoArgs = {
  documentoId: v.id('documentosSgc'),
  requisitoId: v.id('requisitosNormativos'),
  tipoCobertura: tipoCoberturaValidator,
  estadoCobertura: estadoCoberturaValidator,
  responsable: v.union(v.string(), v.null()),
  observacion: v.union(v.string(), v.null()),
  fechaRevision: v.union(v.string(), v.null()),
}

export const upsertDocumentoRequisitoConfig = {
  args: upsertDocumentoRequisitoArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const [documento, requisito] = await Promise.all([
      ctx.db.get(args.documentoId),
      ctx.db.get(args.requisitoId),
    ])
    if (!documento) throw new Error('Documento SGC no encontrado.')
    if (!requisito) throw new Error('Requisito normativo no encontrado.')
    const existing = await ctx.db
      .query('documentoRequisitos')
      .withIndex('by_requisitoId', (q) => q.eq('requisitoId', args.requisitoId))
      .collect()
    const relation = existing.find((item) => item.documentoId === args.documentoId)
    const now = Date.now()
    const patch = {
      tipoCobertura: args.tipoCobertura,
      estadoCobertura: args.estadoCobertura,
      responsable: normalizeNullable(args.responsable),
      observacion: normalizeNullable(args.observacion),
      fechaRevision: normalizeNullable(args.fechaRevision),
      updatedAt: now,
      updatedBy: actor,
    }
    if (relation) {
      await ctx.db.patch(relation._id, patch)
      return relation._id
    }
    return ctx.db.insert('documentoRequisitos', {
      documentoId: args.documentoId,
      requisitoId: args.requisitoId,
      ...patch,
      createdAt: now,
      createdBy: actor,
    })
  },
} satisfies SgcMutationConfig<typeof upsertDocumentoRequisitoArgs>

const seedDocumentoValidator = v.object({
  codigo: v.string(),
  nombre: v.string(),
  familia: familiaValidator,
  ambito: v.string(),
  proceso: v.string(),
  estado: estadoDocumentoValidator,
  modoDiligenciamiento: modoDiligenciamientoValidator,
  modoControl: modoControlValidator,
  ubicacionFuente: v.union(v.string(), v.null()),
  origenFuente: v.string(),
  externalSystem: v.union(v.literal('pt_app'), v.null()),
  externalRef: v.union(v.string(), v.null()),
  externalUrl: v.union(v.string(), v.null()),
  externalLabel: v.union(v.string(), v.null()),
})

const seedRequisitoValidator = v.object({
  norma: v.string(),
  versionNorma: v.string(),
  clausula: v.string(),
  titulo: v.string(),
  descripcion: v.string(),
  ambito: v.string(),
  criticidad: criticidadValidator,
  estado: v.union(v.literal('activo'), v.literal('placeholder'), v.literal('retirado')),
  origenFuente: v.string(),
})

const seedMapaValidator = v.object({
  bloque: v.string(),
  rutaCritica: v.union(v.string(), v.null()),
  origenCodigo: v.string(),
  destinoCodigo: v.union(v.string(), v.null()),
  tipoRelacion: v.union(v.literal('define'), v.literal('usa'), v.literal('genera'), v.literal('evidencia'), v.literal('referencia'), v.literal('externo')),
  ambito: v.string(),
  destinoTipo: v.union(v.literal('documento'), v.literal('requisito'), v.literal('registro'), v.literal('gestion'), v.literal('externo'), v.literal('pendiente')),
  externalSystem: v.union(v.literal('pt_app'), v.null()),
  externalUrl: v.union(v.string(), v.null()),
  estadoResolucion: v.union(v.literal('resuelto'), v.literal('pendiente')),
  origenFuente: v.string(),
})

const importarSeedSgcArgs = {
  documentos: v.array(seedDocumentoValidator),
  requisitos: v.array(seedRequisitoValidator),
  mapa: v.array(seedMapaValidator),
}

export const importarSeedSgcConfig = {
  args: importarSeedSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    const documentIds = new Map<string, Id<'documentosSgc'>>()
    let documentosUpserted = 0
    for (const item of args.documentos) {
      const codigo = normalizeCodigoDocumento(item.codigo)
      const existing = await ctx.db.query('documentosSgc').withIndex('by_codigo', (q) => q.eq('codigo', codigo)).first()
      const patch = {
        codigo,
        nombre: item.nombre.trim(),
        familia: item.familia,
        ambito: item.ambito,
        proceso: item.proceso,
        subproceso: null,
        tipo: inferTipoFromFamilia(item.familia) as 'formato' | 'procedimiento' | 'instructivo' | 'plantilla' | 'registro' | 'otro',
        estado: item.estado,
        modoDiligenciamiento: item.modoDiligenciamiento,
        visibilidad: 'interna' as const,
        modoControl: item.modoControl,
        fuenteEditableUrl: null,
        responsable: 'Coordinacion SGC',
        propietario: 'Coordinacion SGC',
        criticidad: 'media' as const,
        retencion: null,
        ubicacionFuente: item.ubicacionFuente,
        origenFuente: item.origenFuente,
        externalSystem: item.externalSystem,
        externalRef: item.externalRef,
        externalUrl: normalizeHttpUrl(item.externalUrl),
        externalLabel: item.externalLabel,
        notas: null,
        updatedAt: now,
        updatedBy: actor,
      }
      if (existing) {
        await ctx.db.patch(existing._id, patch)
        documentIds.set(codigo, existing._id)
      } else {
        const id = await ctx.db.insert('documentosSgc', { ...patch, createdAt: now, createdBy: actor })
        documentIds.set(codigo, id)
      }
      documentosUpserted += 1
    }
    let requisitosUpserted = 0
    for (const item of args.requisitos) {
      const existing = await ctx.db
        .query('requisitosNormativos')
        .withIndex('by_norma_and_versionNorma_and_clausula', (q) => q.eq('norma', item.norma).eq('versionNorma', item.versionNorma).eq('clausula', item.clausula))
        .first()
      const patch = {
        norma: item.norma,
        versionNorma: item.versionNorma,
        clausula: item.clausula,
        titulo: item.titulo,
        descripcion: item.descripcion,
        ambito: item.ambito,
        criticidad: item.criticidad,
        estado: item.estado,
        origenFuente: item.origenFuente,
        updatedAt: now,
        updatedBy: actor,
      }
      if (existing) await ctx.db.patch(existing._id, patch)
      else await ctx.db.insert('requisitosNormativos', { ...patch, createdAt: now, createdBy: actor })
      requisitosUpserted += 1
    }
    const existingRelaciones = await ctx.db.query('mapaSgcRelaciones').collect()
    const existingByKey = new Map(existingRelaciones.map((relacion) => [mapRelationKey(relacion), relacion]))
    let mapaInserted = 0
    for (const item of args.mapa) {
      if (item.destinoTipo === 'requisito') throw new Error('Las relaciones de mapa a requisito deben resolverse con requisitoId antes de importarse.')
      const documentoOrigenId = documentIds.get(normalizeCodigoDocumento(item.origenCodigo)) ?? null
      const documentoDestinoId = item.destinoCodigo ? documentIds.get(normalizeCodigoDocumento(item.destinoCodigo)) ?? null : null
      const existing = existingByKey.get(mapRelationKey(item))
      const patch = {
        bloque: item.bloque,
        rutaCritica: item.rutaCritica,
        origenCodigo: normalizeCodigoDocumento(item.origenCodigo),
        destinoCodigo: item.destinoCodigo ? normalizeCodigoDocumento(item.destinoCodigo) : null,
        documentoOrigenId,
        documentoDestinoId,
        requisitoId: null,
        tipoRelacion: item.tipoRelacion,
        ambito: item.ambito,
        destinoTipo: item.destinoTipo,
        externalSystem: item.externalSystem,
        externalUrl: normalizeHttpUrl(item.externalUrl),
        estadoResolucion: documentoOrigenId && (documentoDestinoId || item.destinoTipo !== 'documento') ? 'resuelto' : item.estadoResolucion,
        origenFuente: item.origenFuente,
        updatedAt: now,
        updatedBy: actor,
      }
      if (existing) await ctx.db.patch(existing._id, patch)
      else await ctx.db.insert('mapaSgcRelaciones', { ...patch, createdAt: now, createdBy: actor })
      mapaInserted += 1
    }
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.seed_importado', detalle: `${documentosUpserted} docs, ${requisitosUpserted} requisitos, ${mapaInserted} relaciones` })
    return { documentosUpserted, requisitosUpserted, mapaInserted }
  },
} satisfies SgcMutationConfig<typeof importarSeedSgcArgs>

const importarDocumentosSeedSgcArgs = { documentos: v.array(seedDocumentoValidator) }

export const importarDocumentosSeedSgcConfig = {
  args: importarDocumentosSeedSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    let documentosUpserted = 0
    for (const item of args.documentos) {
      const codigo = normalizeCodigoDocumento(item.codigo)
      const existing = await ctx.db.query('documentosSgc').withIndex('by_codigo', (q) => q.eq('codigo', codigo)).first()
      const patch = {
        codigo,
        nombre: item.nombre.trim(),
        familia: item.familia,
        ambito: item.ambito,
        proceso: item.proceso,
        subproceso: null,
        tipo: inferTipoFromFamilia(item.familia) as 'formato' | 'procedimiento' | 'instructivo' | 'plantilla' | 'registro' | 'otro',
        estado: item.estado,
        modoDiligenciamiento: item.modoDiligenciamiento,
        visibilidad: 'interna' as const,
        modoControl: item.modoControl,
        fuenteEditableUrl: null,
        responsable: 'Coordinacion SGC',
        propietario: 'Coordinacion SGC',
        criticidad: 'media' as const,
        retencion: null,
        ubicacionFuente: item.ubicacionFuente,
        origenFuente: item.origenFuente,
        externalSystem: item.externalSystem,
        externalRef: item.externalRef,
        externalUrl: normalizeHttpUrl(item.externalUrl),
        externalLabel: item.externalLabel,
        notas: null,
        updatedAt: now,
        updatedBy: actor,
      }
      if (existing) await ctx.db.patch(existing._id, patch)
      else await ctx.db.insert('documentosSgc', { ...patch, createdAt: now, createdBy: actor })
      documentosUpserted += 1
    }
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.seed_documentos_importado', detalle: `${documentosUpserted} documentos` })
    return { documentosUpserted }
  },
} satisfies SgcMutationConfig<typeof importarDocumentosSeedSgcArgs>

const importarRequisitosSeedSgcArgs = { requisitos: v.array(seedRequisitoValidator) }

export const importarRequisitosSeedSgcConfig = {
  args: importarRequisitosSeedSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    let requisitosUpserted = 0
    for (const item of args.requisitos) {
      const existing = await ctx.db
        .query('requisitosNormativos')
        .withIndex('by_norma_and_versionNorma_and_clausula', (q) => q.eq('norma', item.norma).eq('versionNorma', item.versionNorma).eq('clausula', item.clausula))
        .first()
      const patch = {
        norma: item.norma,
        versionNorma: item.versionNorma,
        clausula: item.clausula,
        titulo: item.titulo,
        descripcion: item.descripcion,
        ambito: item.ambito,
        criticidad: item.criticidad,
        estado: item.estado,
        origenFuente: item.origenFuente,
        updatedAt: now,
        updatedBy: actor,
      }
      if (existing) await ctx.db.patch(existing._id, patch)
      else await ctx.db.insert('requisitosNormativos', { ...patch, createdAt: now, createdBy: actor })
      requisitosUpserted += 1
    }
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.seed_requisitos_importado', detalle: `${requisitosUpserted} requisitos` })
    return { requisitosUpserted }
  },
} satisfies SgcMutationConfig<typeof importarRequisitosSeedSgcArgs>

const importarMapaSeedSgcArgs = {
  mapa: v.array(seedMapaValidator),
  reemplazar: v.boolean(),
}

export const importarMapaSeedSgcConfig = {
  args: importarMapaSeedSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    const documentos = await ctx.db.query('documentosSgc').collect()
    const documentIds = new Map(documentos.map((documento) => [documento.codigo, documento._id]))
    if (args.reemplazar) {
      const existingRelaciones = await ctx.db.query('mapaSgcRelaciones').collect()
      for (const relacion of existingRelaciones) await ctx.db.delete(relacion._id)
    }
    let mapaInserted = 0
    const existingRelaciones = args.reemplazar ? [] : await ctx.db.query('mapaSgcRelaciones').collect()
    const existingByKey = new Map(existingRelaciones.map((relacion) => [mapRelationKey(relacion), relacion]))
    for (const item of args.mapa) {
      if (item.destinoTipo === 'requisito') throw new Error('Las relaciones de mapa a requisito deben resolverse con requisitoId antes de importarse.')
      const documentoOrigenId = documentIds.get(normalizeCodigoDocumento(item.origenCodigo)) ?? null
      const documentoDestinoId = item.destinoCodigo ? documentIds.get(normalizeCodigoDocumento(item.destinoCodigo)) ?? null : null
      const existing = existingByKey.get(mapRelationKey(item))
      const patch = {
        bloque: item.bloque,
        rutaCritica: item.rutaCritica,
        origenCodigo: normalizeCodigoDocumento(item.origenCodigo),
        destinoCodigo: item.destinoCodigo ? normalizeCodigoDocumento(item.destinoCodigo) : null,
        documentoOrigenId,
        documentoDestinoId,
        requisitoId: null,
        tipoRelacion: item.tipoRelacion,
        ambito: item.ambito,
        destinoTipo: item.destinoTipo,
        externalSystem: item.externalSystem,
        externalUrl: normalizeHttpUrl(item.externalUrl),
        estadoResolucion: documentoOrigenId && (documentoDestinoId || item.destinoTipo !== 'documento') ? 'resuelto' : item.estadoResolucion,
        origenFuente: item.origenFuente,
        updatedAt: now,
        updatedBy: actor,
      }
      if (existing) await ctx.db.patch(existing._id, patch)
      else await ctx.db.insert('mapaSgcRelaciones', { ...patch, createdAt: now, createdBy: actor })
      mapaInserted += 1
    }
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.maestro.seed_mapa_importado', detalle: `${mapaInserted} relaciones` })
    return { mapaInserted }
  },
} satisfies SgcMutationConfig<typeof importarMapaSeedSgcArgs>
