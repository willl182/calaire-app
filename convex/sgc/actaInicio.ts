import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import {
  requireParticipanteOAdmin,
  requireSgcAdmin,
  requireSgcManage,
  type SgcMutationConfig,
  type SgcQueryConfig,
  writeAudit,
} from './shared'

const ACTA_CODIGO = 'F-PSEA-19'
const LUGAR_INSTITUCIONAL = 'Laboratorio Calaire, Universidad Nacional de Colombia - Sede Medellin'

async function getActa(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcActasInicio').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
}

async function getFirmantes(ctx: QueryCtx | MutationCtx, actaId: Id<'sgcActasInicio'>) {
  return ctx.db.query('sgcActaInicioFirmantes').withIndex('by_actaId', (q) => q.eq('actaId', actaId)).collect()
}

async function getRecurso(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db
    .query('sgcDriveRecursos')
    .withIndex('by_rondaId_and_codigo', (q) => q.eq('rondaId', rondaId).eq('codigo', ACTA_CODIGO))
    .first()
}

const getActaInicioArgs = { rondaId: v.id('rondas') }
export const getActaInicioConfig = {
  args: getActaInicioArgs,
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, { rondaId }) => {
    await requireSgcManage(ctx)
    const acta = await getActa(ctx, rondaId)
    if (!acta) return null
    const firmantes = await getFirmantes(ctx, acta._id)
    return { ...acta, firmantes: firmantes.sort((a, b) => a.sortOrder - b.sortOrder) }
  },
} satisfies SgcQueryConfig<typeof getActaInicioArgs>

const inicializarArgs = { rondaId: v.id('rondas') }
export const inicializarActaInicioConfig = {
  args: inicializarArgs,
  returns: v.object({ actaId: v.id('sgcActasInicio'), creada: v.boolean(), firmantesCreados: v.number() }),
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcManage(ctx)
    const existing = await getActa(ctx, rondaId)
    if (existing) {
      const firmantes = await getFirmantes(ctx, existing._id)
      return { actaId: existing._id, creada: false, firmantesCreados: firmantes.length }
    }
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')
    const hitos = await ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
    const hitoInicio = hitos.find((hito) => hito.codigo === 'INICIO_RONDA' || hito.formatoRelacionado === ACTA_CODIGO)
    if (!hitoInicio?.fechaObjetivo) throw new Error('Configure el hito INICIO_RONDA con fecha objetivo antes de inicializar el acta.')

    const recurso = await getRecurso(ctx, rondaId)
    const now = Date.now()
    const actaId = await ctx.db.insert('sgcActasInicio', {
      rondaId,
      fecha: hitoInicio.fechaObjetivo,
      lugar: LUGAR_INSTITUCIONAL,
      textoInicio: 'Se declara formalmente iniciada la ronda y se referencia la relacion F-PSEA-21 de instrumentos Calaire usados.',
      estado: 'borrador',
      versionBaseId: recurso?.documentoSgcVersionId ?? null,
      docxStorageId: null,
      docxFileName: null,
      pdfStorageId: null,
      pdfFileName: null,
      publicaParticipante: false,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })

    const participantes = await ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect()
    let sortOrder = 0
    for (const participante of participantes) {
      const ficha = await ctx.db
        .query('fichasRegistro')
        .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', participante._id))
        .first()
      await ctx.db.insert('sgcActaInicioFirmantes', {
        actaId,
        tipo: 'participante',
        rondaParticipanteId: participante._id,
        nombre: ficha?.nombreFirma?.trim() || ficha?.nombreResponsable?.trim() || participante.email,
        entidad: ficha?.nombreLaboratorio?.trim() || 'Entidad pendiente',
        sortOrder: sortOrder++,
      })
    }
    for (let index = 0; index < 2; index += 1) {
      await ctx.db.insert('sgcActaInicioFirmantes', {
        actaId,
        tipo: 'organizador',
        rondaParticipanteId: null,
        nombre: '',
        entidad: 'Laboratorio Calaire',
        sortOrder: sortOrder++,
      })
    }
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.f19.inicializada', targetTipo: 'sgcActasInicio', targetId: actaId })
    return { actaId, creada: true, firmantesCreados: sortOrder }
  },
} satisfies SgcMutationConfig<typeof inicializarArgs>

const actualizarArgs = {
  actaId: v.id('sgcActasInicio'),
  fecha: v.string(),
  lugar: v.string(),
  textoInicio: v.string(),
  organizadores: v.array(v.object({ nombre: v.string(), entidad: v.string() })),
}
export const actualizarActaInicioConfig = {
  args: actualizarArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const acta = await ctx.db.get(args.actaId)
    if (!acta) throw new Error('Acta no encontrada.')
    if (args.organizadores.length !== 2) throw new Error('Debe registrar exactamente dos organizadores.')
    if (!args.fecha.trim() || !args.lugar.trim() || !args.textoInicio.trim()) throw new Error('Fecha, lugar y texto de inicio son obligatorios.')
    const organizadores = (await getFirmantes(ctx, acta._id)).filter((item) => item.tipo === 'organizador').sort((a, b) => a.sortOrder - b.sortOrder)
    if (organizadores.length !== 2) throw new Error('El acta debe contener exactamente dos filas de organizador.')
    for (let index = 0; index < 2; index += 1) {
      await ctx.db.patch(organizadores[index]._id, {
        nombre: args.organizadores[index].nombre.trim(),
        entidad: args.organizadores[index].entidad.trim(),
      })
    }
    const now = Date.now()
    await ctx.db.patch(acta._id, {
      fecha: args.fecha.trim(),
      lugar: args.lugar.trim(),
      textoInicio: args.textoInicio.trim(),
      estado: 'borrador',
      docxStorageId: null,
      docxFileName: null,
      pdfStorageId: null,
      pdfFileName: null,
      publicaParticipante: false,
      updatedAt: now,
      updatedBy: actor,
    })
    const recurso = await getRecurso(ctx, acta.rondaId)
    if (recurso) {
      await ctx.db.patch(recurso._id, {
        definitivo: null,
        estado: recurso.webUrl ? 'creado' : 'pendiente',
        publicaParticipante: false,
        updatedAt: now,
        updatedBy: actor,
      })
    }
    await writeAudit(ctx, { rondaId: acta.rondaId, actor, evento: 'sgc.f19.actualizada', targetTipo: 'sgcActasInicio', targetId: acta._id })
    return null
  },
} satisfies SgcMutationConfig<typeof actualizarArgs>

const registrarArchivoArgs = {
  actaId: v.id('sgcActasInicio'),
  storageId: v.id('_storage'),
  fileName: v.string(),
  contentType: v.string(),
  size: v.number(),
}

export const registrarDocxActaInicioConfig = {
  args: registrarArchivoArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const acta = await ctx.db.get(args.actaId)
    if (!acta) throw new Error('Acta no encontrada.')
    if (args.contentType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') throw new Error('El archivo generado debe ser DOCX.')
    const stored = await ctx.db.system.get(args.storageId)
    if (!stored || stored.size !== args.size) throw new Error('Archivo DOCX no disponible o metadata inconsistente.')
    if (stored.contentType && stored.contentType !== args.contentType) throw new Error('El objeto almacenado no es un DOCX.')
    const organizadores = (await getFirmantes(ctx, acta._id)).filter((item) => item.tipo === 'organizador')
    if (organizadores.length !== 2 || organizadores.some((item) => !item.nombre.trim() || !item.entidad.trim())) throw new Error('Complete exactamente dos organizadores antes de generar.')
    await ctx.db.patch(acta._id, { docxStorageId: args.storageId, docxFileName: args.fileName, estado: 'docx_generado', updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: acta.rondaId, actor, evento: 'sgc.f19.docx_generado', targetTipo: 'sgcActasInicio', targetId: acta._id })
    return null
  },
} satisfies SgcMutationConfig<typeof registrarArchivoArgs>

export const registrarPdfFirmadoActaInicioConfig = {
  args: registrarArchivoArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const acta = await ctx.db.get(args.actaId)
    if (!acta) throw new Error('Acta no encontrada.')
    if (args.contentType !== 'application/pdf') throw new Error('El acta firmada debe ser PDF.')
    const fileName = args.fileName.trim()
    if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) throw new Error('El acta firmada debe tener nombre de archivo .pdf.')
    if (args.size <= 0 || args.size > 25 * 1024 * 1024) throw new Error('PDF vacio o superior a 25 MB.')
    const stored = await ctx.db.system.get(args.storageId)
    if (!stored || stored.size !== args.size) throw new Error('PDF no disponible o metadata inconsistente.')
    // El contentType confiable es el registrado por storage, no el enviado por el cliente.
    if (stored.contentType && stored.contentType !== 'application/pdf') throw new Error('El objeto almacenado no es un PDF.')
    await ctx.db.patch(acta._id, { pdfStorageId: args.storageId, pdfFileName: fileName, publicaParticipante: false, estado: 'pdf_firmado_cargado', updatedAt: Date.now(), updatedBy: actor })
    const recurso = await getRecurso(ctx, acta.rondaId)
    if (recurso) {
      await ctx.db.patch(recurso._id, {
        definitivo: { storageId: args.storageId, fileName, contentType: args.contentType, size: args.size, tipo: 'pdf' },
        estado: 'diligenciado',
        publicaParticipante: false,
        updatedAt: Date.now(),
        updatedBy: actor,
      })
    }
    await writeAudit(ctx, { rondaId: acta.rondaId, actor, evento: 'sgc.f19.pdf_firmado_cargado', targetTipo: 'sgcActasInicio', targetId: acta._id })
    return null
  },
} satisfies SgcMutationConfig<typeof registrarArchivoArgs>

const publicacionArgs = { actaId: v.id('sgcActasInicio'), publicaParticipante: v.boolean() }
export const cambiarPublicacionActaInicioConfig = {
  args: publicacionArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const acta = await ctx.db.get(args.actaId)
    if (!acta) throw new Error('Acta no encontrada.')
    if (args.publicaParticipante && !acta.pdfStorageId) throw new Error('Cargue PDF firmado antes de publicar.')
    await ctx.db.patch(acta._id, { publicaParticipante: args.publicaParticipante, estado: args.publicaParticipante ? 'publicado' : 'pdf_firmado_cargado', updatedAt: Date.now(), updatedBy: actor })
    const recurso = await getRecurso(ctx, acta.rondaId)
    if (recurso) await ctx.db.patch(recurso._id, { publicaParticipante: args.publicaParticipante, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: acta.rondaId, actor, evento: args.publicaParticipante ? 'sgc.f19.publicada' : 'sgc.f19.despublicada', targetTipo: 'sgcActasInicio', targetId: acta._id })
    return null
  },
} satisfies SgcMutationConfig<typeof publicacionArgs>

const downloadArgs = { rondaId: v.id('rondas'), tipo: v.union(v.literal('docx'), v.literal('pdf_firmado'), v.literal('pdf_firmado_interno')) }
export const getActaInicioDownloadUrlConfig = {
  args: downloadArgs,
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const acta = await getActa(ctx, args.rondaId)
    if (!acta) return null
    if (args.tipo === 'docx' || args.tipo === 'pdf_firmado_interno') {
      await requireSgcManage(ctx)
      const storageId = args.tipo === 'docx' ? acta.docxStorageId : acta.pdfStorageId
      return storageId ? ctx.storage.getUrl(storageId) : null
    }
    await requireParticipanteOAdmin(ctx, args.rondaId)
    if (!acta.publicaParticipante || !acta.pdfStorageId) return null
    return ctx.storage.getUrl(acta.pdfStorageId)
  },
} satisfies SgcQueryConfig<typeof downloadArgs>
