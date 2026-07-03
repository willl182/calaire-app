import { v, type GenericValidator, type ObjectType, type PropertyValidators } from 'convex/values'

import { SGC_FORMATOS_FASE_1, SGC_RONDA_ETAPAS } from '../_lib/sgc/catalog'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { normalizeCodigoDocumento, requireParticipanteOAdmin, requireSgcAdmin, requireSgcViewer, writeAudit } from './shared'
import { esRecursoVisibleParaParticipante } from '../../src/server/sgc/drive-visibility'

const DRIVE_ROOT_CODIGO = 'DRIVE_ROOT'

const driveTipoValidator = v.union(
  v.literal('carpeta'),
  v.literal('documento'),
  v.literal('hoja_calculo'),
  v.literal('pdf'),
  v.literal('archivo'),
  v.literal('enlace')
)

const driveEstadoValidator = v.union(
  v.literal('pendiente'),
  v.literal('creado'),
  v.literal('diligenciado'),
  v.literal('reemplazado'),
  v.literal('retirado'),
  v.literal('no_aplica')
)

const definitivoEnlaceValidator = v.object({
  driveFileId: v.optional(v.union(v.string(), v.null())),
  webUrl: v.string(),
  tipo: v.optional(v.union(v.string(), v.null())),
})
const definitivoArchivoValidator = v.object({
  storageId: v.id('_storage'),
  fileName: v.optional(v.union(v.string(), v.null())),
  contentType: v.optional(v.union(v.string(), v.null())),
  size: v.optional(v.union(v.number(), v.null())),
  tipo: v.optional(v.union(v.string(), v.null())),
})
const definitivoValidator = v.union(definitivoEnlaceValidator, definitivoArchivoValidator, v.null())

type DefinitivoDoc =
  | { driveFileId?: string | null; webUrl: string; tipo?: string | null }
  | { storageId: Id<'_storage'>; fileName?: string | null; contentType?: string | null; size?: number | null; tipo?: string | null }
  | null
  | undefined

function definitivoWebUrl(definitivo: DefinitivoDoc) {
  return definitivo && 'webUrl' in definitivo ? definitivo.webUrl : undefined
}
function definitivoDriveFileId(definitivo: DefinitivoDoc) {
  return definitivo && 'driveFileId' in definitivo ? definitivo.driveFileId ?? undefined : undefined
}
function definitivoStorageId(definitivo: DefinitivoDoc) {
  return definitivo && 'storageId' in definitivo ? String(definitivo.storageId) : undefined
}

const nullableStringArg = v.optional(v.union(v.string(), v.null()))

type DriveTipo = 'carpeta' | 'documento' | 'hoja_calculo' | 'pdf' | 'archivo' | 'enlace'
type DriveEstado = 'pendiente' | 'creado' | 'diligenciado' | 'reemplazado' | 'retirado' | 'no_aplica'

type DriveQueryConfig<Args extends PropertyValidators> = {
  args: Args
  returns: GenericValidator
  handler: (ctx: QueryCtx, args: ObjectType<Args>) => unknown | Promise<unknown>
}

type DriveMutationConfig<Args extends PropertyValidators> = {
  args: Args
  returns: GenericValidator
  handler: (ctx: MutationCtx, args: ObjectType<Args>) => unknown | Promise<unknown>
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function extractGoogleDriveId(url: string | null | undefined) {
  const value = url?.trim()
  if (!value) return null

  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function inferTipoFromUrl(url: string | null | undefined, fallback: DriveTipo): DriveTipo {
  const value = url?.toLowerCase() ?? ''
  if (value.includes('/folders/')) return 'carpeta'
  if (value.includes('/spreadsheets/')) return 'hoja_calculo'
  if (value.includes('/document/')) return 'documento'
  if (value.includes('.pdf')) return 'pdf'
  return fallback
}

function sameNullableString(left: string | null | undefined, right: string | null | undefined) {
  return (left ?? null) === (right ?? null)
}

async function findRecursoByCodigo(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>, codigo: string) {
  return ctx.db
    .query('sgcDriveRecursos')
    .withIndex('by_rondaId_and_codigo', (q) => q.eq('rondaId', rondaId).eq('codigo', normalizeCodigoDocumento(codigo)))
    .first()
}

function isFormatoCritico(formatoRelacionado: string | null) {
  if (!formatoRelacionado) return false
  return SGC_FORMATOS_FASE_1.some((formato) => formato.codigo === formatoRelacionado && formato.critico)
}

async function resolveCatalogLinks(
  ctx: MutationCtx,
  rondaId: Id<'rondas'>,
  documentoCodigo: string,
  formatoRelacionado: string | null
) {
  const codigoMaestro = formatoRelacionado ?? documentoCodigo

  const [serie, documento] = await Promise.all([
    formatoRelacionado
      ? ctx.db
          .query('sgcEvidenciaSeries')
          .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', rondaId).eq('formato', formatoRelacionado))
          .first()
      : Promise.resolve(null),
    ctx.db.query('documentosSgc').withIndex('by_codigo', (q) => q.eq('codigo', codigoMaestro)).first(),
  ])

  let documentoSgcVersionId: Id<'documentoSgcVersiones'> | null = null
  if (documento) {
    const vigente = await ctx.db
      .query('documentoSgcVersiones')
      .withIndex('by_documentoId_and_estado', (q) => q.eq('documentoId', documento._id).eq('estado', 'vigente'))
      .first()
    documentoSgcVersionId = vigente?._id ?? documento.versionVigenteId ?? null
  }

  return {
    evidenciaSerieId: serie?._id ?? null,
    documentoSgcId: documento?._id ?? null,
    documentoSgcVersionId,
    critico: isFormatoCritico(formatoRelacionado),
    publicaParticipante: serie?.publicaParticipante ?? false,
  }
}

function toParticipanteDto(recurso: {
  _id: Id<'sgcDriveRecursos'>
  codigo: string
  nombre: string
  tipo: DriveTipo
  fase?: string | null
  formatoRelacionado?: string | null
  definitivo?: { driveFileId?: string | null; webUrl: string; tipo?: string | null } | null
  updatedAt: number
}) {
  // El participante nunca recibe el enlace de trabajo editable (`webUrl`). Solo se le entrega el
  // archivo que el admin subio a la app, ya resuelto a URL de descarga firmada en `definitivo`.
  return {
    _id: recurso._id,
    codigo: recurso.codigo,
    nombre: recurso.nombre,
    tipo: recurso.tipo,
    fase: recurso.fase ?? null,
    formatoRelacionado: recurso.formatoRelacionado ?? null,
    webUrl: null,
    definitivo: recurso.definitivo ?? null,
    updatedAt: recurso.updatedAt,
  }
}

// El participante nunca recibe permisos, IDs ni enlaces de Drive. Solo se resuelve el archivo que
// el admin subio a la app (Convex storage) como URL de descarga firmada. Un definitivo que sea
// enlace externo de Drive no se expone (devuelve null): el participante no debe ver el Drive.
async function resolveDefinitivoParticipante(
  ctx: QueryCtx,
  definitivo: DefinitivoDoc
): Promise<{ webUrl: string; tipo?: string | null } | null> {
  if (!definitivo) return null
  if ('storageId' in definitivo) {
    const url = await ctx.storage.getUrl(definitivo.storageId)
    if (!url) return null
    return { webUrl: url, tipo: definitivo.tipo ?? null }
  }
  return null
}

const listDriveRecursosArgs = { rondaId: v.id('rondas') }

export const listDriveRecursosConfig = {
  args: listDriveRecursosArgs,
  returns: v.array(v.any()),
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    return ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
} satisfies DriveQueryConfig<typeof listDriveRecursosArgs>

const getDriveTreeArgs = { rondaId: v.id('rondas') }

export const getDriveTreeConfig = {
  args: getDriveTreeArgs,
  returns: v.object({
    root: v.union(v.any(), v.null()),
    recursos: v.array(v.any()),
  }),
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    const recursos = await ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
    return {
      root: recursos.find((recurso) => recurso.codigo === DRIVE_ROOT_CODIGO) ?? null,
      recursos,
    }
  },
} satisfies DriveQueryConfig<typeof getDriveTreeArgs>

const inicializarDriveRondaArgs = { rondaId: v.id('rondas') }

export const inicializarDriveRondaConfig = {
  args: inicializarDriveRondaArgs,
  returns: v.object({
    rootId: v.id('sgcDriveRecursos'),
    creados: v.number(),
    reutilizados: v.number(),
    reparados: v.number(),
  }),
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')

    const now = Date.now()
    let creados = 0
    let reutilizados = 0
    let reparados = 0

    const rootNombre = `${ronda.codigo} - Expediente documental SGC`
    let root = await findRecursoByCodigo(ctx, rondaId, DRIVE_ROOT_CODIGO)
    if (!root) {
      const rootId = await ctx.db.insert('sgcDriveRecursos', {
        rondaId,
        parentId: null,
        proveedor: 'google_drive',
        tipo: 'carpeta',
        codigo: DRIVE_ROOT_CODIGO,
        nombre: rootNombre,
        fase: 'raiz',
        formatoRelacionado: null,
        documentoSgcId: null,
        documentoSgcVersionId: null,
        evidenciaSerieId: null,
        critico: false,
        publicaParticipante: false,
        driveFileId: null,
        driveFolderId: null,
        webUrl: null,
        templateUrl: null,
        definitivo: null,
        estado: 'pendiente',
        notas: null,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      })
      root = await ctx.db.get(rootId)
      creados += 1
    } else {
      reutilizados += 1
      const rootPatch: Partial<{
        parentId: null
        proveedor: 'google_drive'
        tipo: 'carpeta'
        nombre: string
        fase: string
        critico: boolean
        publicaParticipante: boolean
        updatedAt: number
        updatedBy: string
      }> = {}
      if ((root.parentId ?? null) !== null) rootPatch.parentId = null
      if (root.proveedor !== 'google_drive') rootPatch.proveedor = 'google_drive'
      if (root.tipo !== 'carpeta') rootPatch.tipo = 'carpeta'
      if (root.nombre !== rootNombre) rootPatch.nombre = rootNombre
      if ((root.fase ?? null) !== 'raiz') rootPatch.fase = 'raiz'
      if ((root.critico ?? false) !== false) rootPatch.critico = false
      if ((root.publicaParticipante ?? false) !== false) rootPatch.publicaParticipante = false
      if (Object.keys(rootPatch).length > 0) {
        await ctx.db.patch(root._id, { ...rootPatch, updatedAt: now, updatedBy: actor })
        root = await ctx.db.get(root._id)
        reparados += 1
      }
    }
    if (!root) throw new Error('No fue posible inicializar la raiz Drive.')

    for (const etapa of SGC_RONDA_ETAPAS) {
      const carpetaCodigo = normalizeCodigoDocumento(etapa.key)
      const carpetaNombre = etapa.nombre
      let carpeta = await findRecursoByCodigo(ctx, rondaId, carpetaCodigo)
      if (!carpeta) {
        const carpetaId = await ctx.db.insert('sgcDriveRecursos', {
          rondaId,
          parentId: root._id,
          proveedor: 'google_drive',
          tipo: 'carpeta',
          codigo: carpetaCodigo,
          nombre: carpetaNombre,
          fase: etapa.foco,
          formatoRelacionado: null,
          documentoSgcId: null,
          documentoSgcVersionId: null,
          evidenciaSerieId: null,
          critico: false,
          publicaParticipante: false,
          driveFileId: null,
          driveFolderId: null,
          webUrl: null,
          templateUrl: null,
          definitivo: null,
          estado: 'pendiente',
          notas: etapa.carpeta,
          createdAt: now,
          createdBy: actor,
          updatedAt: now,
          updatedBy: actor,
        })
        carpeta = await ctx.db.get(carpetaId)
        creados += 1
      } else {
        reutilizados += 1
        const carpetaPatch: Partial<{
          parentId: Id<'sgcDriveRecursos'>
          tipo: 'carpeta'
          nombre: string
          fase: string
          critico: boolean
          publicaParticipante: boolean
          notas: string | null
          updatedAt: number
          updatedBy: string
        }> = {}
        if (carpeta.parentId !== root._id) carpetaPatch.parentId = root._id
        if (carpeta.tipo !== 'carpeta') carpetaPatch.tipo = 'carpeta'
        if (carpeta.nombre !== carpetaNombre) carpetaPatch.nombre = carpetaNombre
        if (carpeta.fase !== etapa.foco) carpetaPatch.fase = etapa.foco
        if ((carpeta.critico ?? false) !== false) carpetaPatch.critico = false
        if ((carpeta.publicaParticipante ?? false) !== false) carpetaPatch.publicaParticipante = false
        if ((carpeta.notas ?? null) !== etapa.carpeta && !carpeta.webUrl) carpetaPatch.notas = etapa.carpeta
        if (Object.keys(carpetaPatch).length > 0) {
          await ctx.db.patch(carpeta._id, { ...carpetaPatch, updatedAt: now, updatedBy: actor })
          carpeta = await ctx.db.get(carpeta._id)
          reparados += 1
        }
      }
      if (!carpeta) continue

      for (const documento of etapa.documentos) {
        const documentoCodigo = normalizeCodigoDocumento(documento.codigo)
        const formatoRelacionado = documento.formatoOperativo ?? null
        const links = await resolveCatalogLinks(ctx, rondaId, documentoCodigo, formatoRelacionado)
        const existing = await findRecursoByCodigo(ctx, rondaId, documentoCodigo)
        if (!existing) {
          await ctx.db.insert('sgcDriveRecursos', {
            rondaId,
            parentId: carpeta._id,
            proveedor: 'google_drive',
            tipo: 'documento',
            codigo: documentoCodigo,
            nombre: documento.nombre,
            fase: etapa.foco,
            formatoRelacionado,
            documentoSgcId: links.documentoSgcId,
            documentoSgcVersionId: links.documentoSgcVersionId,
            evidenciaSerieId: links.evidenciaSerieId,
            critico: links.critico,
            publicaParticipante: links.publicaParticipante,
            driveFileId: null,
            driveFolderId: null,
            webUrl: null,
            templateUrl: documento.archivoBase ?? null,
            definitivo: null,
            estado: 'pendiente',
            notas: documento.nota,
            createdAt: now,
            createdBy: actor,
            updatedAt: now,
            updatedBy: actor,
          })
          creados += 1
          continue
        }

        reutilizados += 1
        const patch: Partial<{
          parentId: Id<'sgcDriveRecursos'>
          nombre: string
          fase: string
          formatoRelacionado: string | null
          documentoSgcId: Id<'documentosSgc'> | null
          documentoSgcVersionId: Id<'documentoSgcVersiones'> | null
          evidenciaSerieId: Id<'sgcEvidenciaSeries'> | null
          critico: boolean
          templateUrl: string | null
          notas: string | null
          updatedAt: number
          updatedBy: string
        }> = {}
        if (existing.parentId !== carpeta._id) patch.parentId = carpeta._id
        if (existing.nombre !== documento.nombre) patch.nombre = documento.nombre
        if (existing.fase !== etapa.foco) patch.fase = etapa.foco
        if ((existing.formatoRelacionado ?? null) !== formatoRelacionado) patch.formatoRelacionado = formatoRelacionado
        if ((existing.documentoSgcId ?? null) !== links.documentoSgcId) patch.documentoSgcId = links.documentoSgcId
        if ((existing.documentoSgcVersionId ?? null) !== links.documentoSgcVersionId) patch.documentoSgcVersionId = links.documentoSgcVersionId
        if ((existing.evidenciaSerieId ?? null) !== links.evidenciaSerieId) patch.evidenciaSerieId = links.evidenciaSerieId
        if ((existing.critico ?? false) !== links.critico) patch.critico = links.critico
        // No se re-hereda publicaParticipante desde la serie al reparar: la visibilidad Drive
        // es explicita y su fuente de verdad es sgcDriveRecursos.publicaParticipante (ver F1/F2).
        if ((existing.templateUrl ?? null) !== (documento.archivoBase ?? null)) patch.templateUrl = documento.archivoBase ?? null
        if ((existing.notas ?? null) !== documento.nota && !existing.webUrl) patch.notas = documento.nota
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(existing._id, { ...patch, updatedAt: now, updatedBy: actor })
          reparados += 1
        }
      }
    }

    await writeAudit(ctx, {
      rondaId,
      actor,
      evento: reutilizados > 0 || reparados > 0 ? 'sgc.drive.reparado' : 'sgc.drive.inicializado',
      detalle: `creados=${creados}; reutilizados=${reutilizados}; reparados=${reparados}`,
      targetTipo: 'sgcDriveRecursos',
      targetId: root._id,
    })

    return { rootId: root._id, creados, reutilizados, reparados }
  },
} satisfies DriveMutationConfig<typeof inicializarDriveRondaArgs>

const upsertDriveRecursoArgs = {
  recursoId: v.optional(v.union(v.id('sgcDriveRecursos'), v.null())),
  rondaId: v.id('rondas'),
  parentId: v.optional(v.union(v.id('sgcDriveRecursos'), v.null())),
  codigo: v.string(),
  nombre: v.string(),
  fase: nullableStringArg,
  tipo: driveTipoValidator,
  formatoRelacionado: nullableStringArg,
  webUrl: nullableStringArg,
  templateUrl: nullableStringArg,
  notas: nullableStringArg,
  definitivo: v.optional(definitivoValidator),
}

export const upsertDriveRecursoConfig = {
  args: upsertDriveRecursoArgs,
  returns: v.id('sgcDriveRecursos'),
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const ronda = await ctx.db.get(args.rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')
    const codigo = normalizeCodigoDocumento(args.codigo)
    const nombre = args.nombre.trim()
    if (!codigo || !nombre) throw new Error('Codigo y nombre son obligatorios.')

    const existing = args.recursoId ? await ctx.db.get(args.recursoId) : await findRecursoByCodigo(ctx, args.rondaId, codigo)
    if (existing && existing.rondaId !== args.rondaId) throw new Error('El recurso no pertenece a la ronda.')

    if (args.parentId) {
      if (existing && args.parentId === existing._id) throw new Error('Un recurso no puede ser su propia carpeta padre.')
      const parent = await ctx.db.get(args.parentId)
      if (!parent || parent.rondaId !== args.rondaId) throw new Error('La carpeta padre no pertenece a la ronda.')
      if (parent.tipo !== 'carpeta') throw new Error('La carpeta padre debe ser de tipo carpeta.')
    }

    if (args.recursoId) {
      const recursoConCodigo = await findRecursoByCodigo(ctx, args.rondaId, codigo)
      if (recursoConCodigo && (!existing || recursoConCodigo._id !== existing._id)) {
        throw new Error('Ya existe un recurso Drive con ese codigo en la ronda.')
      }
    }

    const webUrl = trimToNull(args.webUrl)
    const tipo = inferTipoFromUrl(webUrl, args.tipo)
    const driveId = extractGoogleDriveId(webUrl)
    const formatoRelacionado = trimToNull(args.formatoRelacionado)
    const links = await resolveCatalogLinks(ctx, args.rondaId, codigo, formatoRelacionado)
    const now = Date.now()
    const editableSinCambios = existing && (existing.webUrl ?? null) === webUrl
    const reemplazoSinMotivo = existing?.webUrl && webUrl && existing.webUrl !== webUrl && !trimToNull(args.notas)
    if (reemplazoSinMotivo) throw new Error('Reemplazar un enlace Drive exige motivo.')
    const estado: DriveEstado = editableSinCambios ? existing.estado : webUrl ? 'creado' : existing?.estado ?? 'pendiente'
    const definitivo: DefinitivoDoc = args.definitivo === undefined ? existing?.definitivo ?? null : args.definitivo
    const definitivoNormalizado: DefinitivoDoc =
      definitivo && 'webUrl' in definitivo
        ? { ...definitivo, driveFileId: definitivo.driveFileId ?? extractGoogleDriveId(definitivo.webUrl) }
        : definitivo
    const definitivoChanged =
      args.definitivo !== undefined &&
      (!sameNullableString(definitivoWebUrl(existing?.definitivo), definitivoWebUrl(definitivoNormalizado)) ||
        !sameNullableString(definitivoDriveFileId(existing?.definitivo), definitivoDriveFileId(definitivoNormalizado)) ||
        !sameNullableString(definitivoStorageId(existing?.definitivo), definitivoStorageId(definitivoNormalizado)) ||
        !sameNullableString(existing?.definitivo?.tipo ?? undefined, definitivoNormalizado?.tipo ?? undefined))

    const patch = {
      parentId: args.parentId ?? null,
      proveedor: 'google_drive' as const,
      tipo,
      codigo,
      nombre,
      fase: trimToNull(args.fase),
      formatoRelacionado,
      documentoSgcId: links.documentoSgcId,
      documentoSgcVersionId: links.documentoSgcVersionId,
      evidenciaSerieId: links.evidenciaSerieId,
      critico: links.critico,
      // La visibilidad Drive es explicita: solo se hereda de la serie al crear el recurso;
      // al actualizar se preserva la decision existente (ver F1/F2 en review_drive.md).
      publicaParticipante: existing
        ? existing.publicaParticipante ?? false
        : links.evidenciaSerieId
          ? links.publicaParticipante
          : false,
      driveFileId: tipo === 'carpeta' ? null : driveId,
      driveFolderId: tipo === 'carpeta' ? driveId : null,
      webUrl,
      templateUrl: trimToNull(args.templateUrl),
      definitivo: definitivoNormalizado ?? null,
      estado,
      notas: trimToNull(args.notas),
      updatedAt: now,
      updatedBy: actor,
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch)
      const evento = definitivoChanged
        ? 'sgc.drive.definitivo_registrado'
        : codigo === DRIVE_ROOT_CODIGO && webUrl
          ? 'sgc.drive.root_registrado'
          : webUrl
            ? 'sgc.drive.recurso_enlazado'
            : 'sgc.drive.recurso_actualizado'
      await writeAudit(ctx, {
        rondaId: args.rondaId,
        actor,
        evento,
        detalle: codigo,
        targetTipo: 'sgcDriveRecursos',
        targetId: existing._id,
      })
      return existing._id
    }

    const id = await ctx.db.insert('sgcDriveRecursos', {
      rondaId: args.rondaId,
      ...patch,
      createdAt: now,
      createdBy: actor,
    })
    const evento = definitivoChanged
      ? 'sgc.drive.definitivo_registrado'
      : codigo === DRIVE_ROOT_CODIGO && webUrl
        ? 'sgc.drive.root_registrado'
        : webUrl
          ? 'sgc.drive.recurso_enlazado'
          : 'sgc.drive.recurso_creado'
    await writeAudit(ctx, {
      rondaId: args.rondaId,
      actor,
      evento,
      detalle: codigo,
      targetTipo: 'sgcDriveRecursos',
      targetId: id,
    })
    return id
  },
} satisfies DriveMutationConfig<typeof upsertDriveRecursoArgs>

const reemplazarDriveRecursoArgs = {
  recursoId: v.id('sgcDriveRecursos'),
  webUrl: v.string(),
  motivo: v.string(),
  tipo: v.optional(driveTipoValidator),
}

export const reemplazarDriveRecursoConfig = {
  args: reemplazarDriveRecursoArgs,
  returns: v.null(),
  handler: async (ctx, { recursoId, webUrl, motivo, tipo: tipoArg }) => {
    const actor = await requireSgcAdmin(ctx)
    const recurso = await ctx.db.get(recursoId)
    if (!recurso) throw new Error('Recurso Drive no encontrado.')
    const nuevoWebUrl = trimToNull(webUrl)
    const detalle = trimToNull(motivo)
    if (!nuevoWebUrl) throw new Error('La nueva URL Drive es obligatoria.')
    if (!detalle) throw new Error('Reemplazar un enlace Drive exige motivo.')
    if ((recurso.webUrl ?? null) === nuevoWebUrl) throw new Error('La nueva URL debe ser diferente al enlace vigente.')

    const tipo = inferTipoFromUrl(nuevoWebUrl, tipoArg ?? recurso.tipo)
    const driveId = extractGoogleDriveId(nuevoWebUrl)
    await ctx.db.patch(recursoId, {
      tipo,
      driveFileId: tipo === 'carpeta' ? null : driveId,
      driveFolderId: tipo === 'carpeta' ? driveId : null,
      webUrl: nuevoWebUrl,
      estado: 'creado',
      notas: detalle,
      updatedAt: Date.now(),
      updatedBy: actor,
    })
    await writeAudit(ctx, {
      rondaId: recurso.rondaId,
      actor,
      evento: 'sgc.drive.recurso_reemplazado',
      detalle: `motivo=${detalle}; anterior=${recurso.webUrl ?? 'sin_enlace'}; nuevo=${nuevoWebUrl}`,
      targetTipo: 'sgcDriveRecursos',
      targetId: recursoId,
    })
    return null
  },
} satisfies DriveMutationConfig<typeof reemplazarDriveRecursoArgs>

const actualizarEstadoDriveRecursoArgs = {
  recursoId: v.id('sgcDriveRecursos'),
  estado: driveEstadoValidator,
  notas: nullableStringArg,
}

export const actualizarEstadoDriveRecursoConfig = {
  args: actualizarEstadoDriveRecursoArgs,
  returns: v.null(),
  handler: async (ctx, { recursoId, estado, notas }) => {
    const actor = await requireSgcAdmin(ctx)
    const recurso = await ctx.db.get(recursoId)
    if (!recurso) throw new Error('Recurso Drive no encontrado.')
    const detalle = trimToNull(notas)
    if ((estado === 'no_aplica' || estado === 'retirado') && !detalle) {
      throw new Error('Este cambio de estado exige justificacion.')
    }

    await ctx.db.patch(recursoId, {
      estado,
      notas: detalle ?? recurso.notas ?? null,
      updatedAt: Date.now(),
      updatedBy: actor,
    })
    await writeAudit(ctx, {
      rondaId: recurso.rondaId,
      actor,
      evento: `sgc.drive.recurso_${estado}`,
      detalle,
      targetTipo: 'sgcDriveRecursos',
      targetId: recursoId,
    })
    return null
  },
} satisfies DriveMutationConfig<typeof actualizarEstadoDriveRecursoArgs>

const retirarDriveRecursoArgs = {
  recursoId: v.id('sgcDriveRecursos'),
  motivo: v.string(),
}

export const retirarDriveRecursoConfig = {
  args: retirarDriveRecursoArgs,
  returns: v.null(),
  handler: async (ctx, { recursoId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    const detalle = motivo.trim()
    if (!detalle) throw new Error('Retirar un recurso exige motivo.')
    const recurso = await ctx.db.get(recursoId)
    if (!recurso) throw new Error('Recurso Drive no encontrado.')
    await ctx.db.patch(recursoId, {
      estado: 'retirado',
      notas: detalle,
      updatedAt: Date.now(),
      updatedBy: actor,
    })
    await writeAudit(ctx, {
      rondaId: recurso.rondaId,
      actor,
      evento: 'sgc.drive.recurso_retirado',
      detalle,
      targetTipo: 'sgcDriveRecursos',
      targetId: recursoId,
    })
    return null
  },
} satisfies DriveMutationConfig<typeof retirarDriveRecursoArgs>

const actualizarVisibilidadDriveRecursoArgs = {
  recursoId: v.id('sgcDriveRecursos'),
  publicaParticipante: v.boolean(),
}

export const actualizarVisibilidadDriveRecursoConfig = {
  args: actualizarVisibilidadDriveRecursoArgs,
  returns: v.null(),
  handler: async (ctx, { recursoId, publicaParticipante }) => {
    const actor = await requireSgcAdmin(ctx)
    const recurso = await ctx.db.get(recursoId)
    if (!recurso) throw new Error('Recurso Drive no encontrado.')
    if (publicaParticipante && recurso.tipo === 'carpeta') {
      throw new Error('No se publican carpetas completas para participantes; publique documentos individuales.')
    }

    const now = Date.now()
    // La visibilidad Drive es independiente de sgcEvidenciaSeries.publicaParticipante
    // (esa bandera controla "Evidencias publicadas"). Solo se togglean recursos Drive.
    // Si el recurso esta vinculado a una serie, se propaga a los demas documentos Drive de
    // esa misma serie por consistencia, pero nunca se escribe la serie (ver F1 en review_drive.md).
    const objetivos = recurso.evidenciaSerieId
      ? (
          await ctx.db
            .query('sgcDriveRecursos')
            .withIndex('by_rondaId_and_formatoRelacionado', (q) =>
              q.eq('rondaId', recurso.rondaId).eq('formatoRelacionado', recurso.formatoRelacionado ?? null)
            )
            .collect()
        ).filter((row) => row.evidenciaSerieId === recurso.evidenciaSerieId)
      : [recurso]
    for (const objetivo of objetivos) {
      await ctx.db.patch(objetivo._id, {
        publicaParticipante,
        updatedAt: now,
        updatedBy: actor,
      })
    }

    await writeAudit(ctx, {
      rondaId: recurso.rondaId,
      actor,
      evento: 'sgc.drive.visibilidad_actualizada',
      detalle: `${recurso.codigo}; publicaParticipante=${publicaParticipante ? 'true' : 'false'}`,
      targetTipo: 'sgcDriveRecursos',
      targetId: recursoId,
    })
    return null
  },
} satisfies DriveMutationConfig<typeof actualizarVisibilidadDriveRecursoArgs>

const registrarAutomatizacionDriveArgs = {
  rondaId: v.id('rondas'),
  evento: v.union(
    v.literal('sgc.drive.google_api_completado'),
    v.literal('sgc.drive.google_api_parcial'),
    v.literal('sgc.drive.google_api_fallo')
  ),
  detalle: v.string(),
  targetId: v.optional(v.union(v.id('sgcDriveRecursos'), v.null())),
}

export const registrarAutomatizacionDriveConfig = {
  args: registrarAutomatizacionDriveArgs,
  returns: v.null(),
  handler: async (ctx, { rondaId, evento, detalle, targetId }) => {
    const actor = await requireSgcAdmin(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')

    await writeAudit(ctx, {
      rondaId,
      actor,
      evento,
      detalle,
      targetTipo: 'sgcDriveRecursos',
      targetId: targetId ?? null,
    })
    return null
  },
} satisfies DriveMutationConfig<typeof registrarAutomatizacionDriveArgs>

const participanteDtoValidator = v.object({
  _id: v.id('sgcDriveRecursos'),
  codigo: v.string(),
  nombre: v.string(),
  tipo: driveTipoValidator,
  fase: v.union(v.string(), v.null()),
  formatoRelacionado: v.union(v.string(), v.null()),
  webUrl: v.union(v.string(), v.null()),
  definitivo: v.union(definitivoEnlaceValidator, v.null()),
  updatedAt: v.number(),
})

const listDriveRecursosParticipanteArgs = { rondaId: v.id('rondas') }

export const listDriveRecursosParticipanteConfig = {
  args: listDriveRecursosParticipanteArgs,
  returns: v.array(participanteDtoValidator),
  handler: async (ctx, { rondaId }) => {
    await requireParticipanteOAdmin(ctx, rondaId)
    // F5: los documentos Drive solo se exponen al participante cuando la ronda esta en
    // documentacion o cerrada; en otros estados no hay expediente publicado que mostrar.
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')
    if (ronda.estado !== 'documentacion_pendiente' && ronda.estado !== 'cerrada') {
      return []
    }
    const recursos = await ctx.db
      .query('sgcDriveRecursos')
      .withIndex('by_rondaId_and_publicaParticipante', (q) => q.eq('rondaId', rondaId).eq('publicaParticipante', true))
      .collect()
    // Solo se exponen recursos con archivo subido por el admin (definitivo storage). El resolver
    // devuelve null para cualquier otro caso, asi que se descartan tras resolver.
    const publicables = recursos
      .filter(esRecursoVisibleParaParticipante)
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
    const resueltos = await Promise.all(
      publicables.map(async (recurso) => {
        const definitivo = await resolveDefinitivoParticipante(ctx, recurso.definitivo)
        return definitivo ? toParticipanteDto({ ...recurso, definitivo }) : null
      })
    )
    return resueltos.filter((dto): dto is NonNullable<typeof dto> => dto !== null)
  },
} satisfies DriveQueryConfig<typeof listDriveRecursosParticipanteArgs>
