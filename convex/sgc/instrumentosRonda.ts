import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { requireSgcAdmin, requireSgcManage, type SgcMutationConfig, type SgcQueryConfig, writeAudit } from './shared'

const tipoValidator = v.union(
  v.literal('analizador'),
  v.literal('aire_cero'),
  v.literal('calibrador_dinamico'),
  v.literal('cilindro'),
  v.literal('otro')
)
type TipoInstrumento = 'analizador' | 'aire_cero' | 'calibrador_dinamico' | 'cilindro' | 'otro'

const MINIMOS: TipoInstrumento[] = ['analizador', 'analizador', 'analizador', 'analizador', 'aire_cero', 'calibrador_dinamico', 'cilindro']

async function getRelacion(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcInstrumentosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
}
async function getItems(ctx: QueryCtx | MutationCtx, relacionId: Id<'sgcInstrumentosRonda'>) {
  return ctx.db.query('sgcInstrumentosRondaItems').withIndex('by_relacionId', (q) => q.eq('relacionId', relacionId)).collect()
}

async function getRecurso(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db
    .query('sgcDriveRecursos')
    .withIndex('by_rondaId_and_codigo', (q) => q.eq('rondaId', rondaId).eq('codigo', 'F-PSEA-21'))
    .first()
}
function evaluar(items: Array<{
  tipo: TipoInstrumento
  codigoInterno: string
  marca: string
  modelo: string
  serialIdentificacion: string
  fotoGeneralStorageId?: Id<'_storage'> | null
  fotoPlacaStorageId?: Id<'_storage'> | null
}>) {
  const porTipo = {
    analizadores: items.filter((item) => item.tipo === 'analizador').length,
    aireCero: items.filter((item) => item.tipo === 'aire_cero').length,
    calibradores: items.filter((item) => item.tipo === 'calibrador_dinamico').length,
    cilindros: items.filter((item) => item.tipo === 'cilindro').length,
  }
  const itemsSinIdentificacion = items.filter((item) => !item.codigoInterno.trim() || !item.marca.trim() || !item.modelo.trim() || !item.serialIdentificacion.trim()).length
  const itemsSinFotoGeneral = items.filter((item) => !item.fotoGeneralStorageId).length
  const itemsSinFotoPlaca = items.filter((item) => !item.fotoPlacaStorageId).length
  const errores: string[] = []
  if (items.length < 7) errores.push('Se requieren al menos siete instrumentos.')
  if (porTipo.analizadores < 4) errores.push('Se requieren cuatro analizadores.')
  if (porTipo.aireCero < 1) errores.push('Se requiere un sistema de aire cero.')
  if (porTipo.calibradores < 1) errores.push('Se requiere un calibrador dinamico.')
  if (porTipo.cilindros < 1) errores.push('Se requiere un cilindro.')
  if (itemsSinIdentificacion) errores.push(`${itemsSinIdentificacion} instrumento(s) sin identificacion completa.`)
  if (itemsSinFotoGeneral) errores.push(`${itemsSinFotoGeneral} instrumento(s) sin foto general.`)
  if (itemsSinFotoPlaca) errores.push(`${itemsSinFotoPlaca} instrumento(s) sin foto de placa o serial.`)
  return { completo: errores.length === 0, total: items.length, ...porTipo, itemsSinIdentificacion, itemsSinFotoGeneral, itemsSinFotoPlaca, errores }
}

async function invalidar(ctx: MutationCtx, relacionId: Id<'sgcInstrumentosRonda'>, actor: string) {
  const relacion = await ctx.db.get(relacionId)
  if (!relacion) throw new Error('Relacion no encontrada.')
  await ctx.db.patch(relacionId, {
    estado: relacion.estado === 'validado' ? 'requiere_ajustes' : 'borrador',
    revision: relacion.revision + 1,
    coordinadorNombre: null,
    validadoAt: null,
    pdfStorageId: null,
    pdfRevision: null,
    xlsxStorageId: null,
    xlsxRevision: null,
    updatedAt: Date.now(),
    updatedBy: actor,
  })
  return relacion
}

const getArgs = { rondaId: v.id('rondas') }
export const getRelacionInstrumentosRondaConfig = {
  args: getArgs,
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, { rondaId }) => {
    await requireSgcManage(ctx)
    const relacion = await getRelacion(ctx, rondaId)
    if (!relacion) return null
    const items = (await getItems(ctx, relacion._id)).sort((a, b) => a.sortOrder - b.sortOrder)
    return { ...relacion, items, resumen: evaluar(items) }
  },
} satisfies SgcQueryConfig<typeof getArgs>

export const inicializarRelacionInstrumentosConfig = {
  args: getArgs,
  returns: v.object({ relacionId: v.id('sgcInstrumentosRonda'), creada: v.boolean(), precargados: v.number(), minimosAgregados: v.number() }),
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcManage(ctx)
    const existing = await getRelacion(ctx, rondaId)
    if (existing) return { relacionId: existing._id, creada: false, precargados: 0, minimosAgregados: 0 }
    if (!(await ctx.db.get(rondaId))) throw new Error('Ronda no encontrada.')
    const now = Date.now()
    const relacionId = await ctx.db.insert('sgcInstrumentosRonda', {
      rondaId, estado: 'borrador', revision: 1, tecnicoNombre: null, enviadoAt: null,
      coordinadorNombre: null, validadoAt: null, observacionDevolucion: null,
      pdfStorageId: null, pdfRevision: null, xlsxStorageId: null, xlsxRevision: null,
      createdAt: now, createdBy: actor, updatedAt: now, updatedBy: actor,
    })
    for (let index = 0; index < MINIMOS.length; index += 1) {
      await ctx.db.insert('sgcInstrumentosRondaItems', {
        relacionId, tipo: MINIMOS[index], origen: 'placeholder_minimo', codigoInterno: '', marca: '', modelo: '',
        serialIdentificacion: '', observaciones: '', fotoGeneralStorageId: null, fotoGeneralFileName: null,
        fotoPlacaStorageId: null, fotoPlacaFileName: null, sortOrder: index, createdAt: now, updatedAt: now, updatedBy: actor,
      })
    }
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.f21.inicializada', detalle: 'Siete placeholders minimos creados.', targetTipo: 'sgcInstrumentosRonda', targetId: relacionId })
    return { relacionId, creada: true, precargados: 0, minimosAgregados: MINIMOS.length }
  },
} satisfies SgcMutationConfig<typeof getArgs>

const itemArgs = {
  relacionId: v.id('sgcInstrumentosRonda'), tipo: tipoValidator, codigoInterno: v.string(), marca: v.string(),
  modelo: v.string(), serialIdentificacion: v.string(), observaciones: v.string(),
}
export const crearInstrumentoRondaConfig = {
  args: itemArgs,
  returns: v.object({ itemId: v.id('sgcInstrumentosRondaItems') }),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const relacion = await invalidar(ctx, args.relacionId, actor)
    const items = await getItems(ctx, args.relacionId)
    const itemId = await ctx.db.insert('sgcInstrumentosRondaItems', {
      ...args, origen: 'manual', fotoGeneralStorageId: null, fotoGeneralFileName: null, fotoPlacaStorageId: null,
      fotoPlacaFileName: null, sortOrder: items.length, createdAt: Date.now(), updatedAt: Date.now(), updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.instrumento_creado', targetTipo: 'sgcInstrumentosRondaItems', targetId: itemId })
    return { itemId }
  },
} satisfies SgcMutationConfig<typeof itemArgs>

const actualizarItemArgs = { itemId: v.id('sgcInstrumentosRondaItems'), tipo: tipoValidator, codigoInterno: v.string(), marca: v.string(), modelo: v.string(), serialIdentificacion: v.string(), observaciones: v.string() }
export const actualizarInstrumentoRondaConfig = {
  args: actualizarItemArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error('Instrumento no encontrado.')
    const relacion = await invalidar(ctx, item.relacionId, actor)
    await ctx.db.patch(item._id, { tipo: args.tipo, codigoInterno: args.codigoInterno.trim(), marca: args.marca.trim(), modelo: args.modelo.trim(), serialIdentificacion: args.serialIdentificacion.trim(), observaciones: args.observaciones.trim(), updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.instrumento_actualizado', targetTipo: 'sgcInstrumentosRondaItems', targetId: item._id })
    return null
  },
} satisfies SgcMutationConfig<typeof actualizarItemArgs>

const fotoArgs = { itemId: v.id('sgcInstrumentosRondaItems'), tipoFoto: v.union(v.literal('general'), v.literal('placa_serial')), storageId: v.id('_storage'), fileName: v.string(), contentType: v.string(), size: v.number() }
export const registrarFotoInstrumentoRondaConfig = {
  args: fotoArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error('Instrumento no encontrado.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(args.contentType)) throw new Error('Foto debe ser JPEG, PNG o WebP.')
    if (args.size <= 0 || args.size > 10 * 1024 * 1024) throw new Error('Foto vacia o superior a 10 MB.')
    const stored = await ctx.db.system.get(args.storageId)
    if (!stored || stored.size !== args.size) throw new Error('Foto no disponible o metadata inconsistente.')
    const relacion = await invalidar(ctx, item.relacionId, actor)
    await ctx.db.patch(item._id, args.tipoFoto === 'general'
      ? { fotoGeneralStorageId: args.storageId, fotoGeneralFileName: args.fileName, updatedAt: Date.now(), updatedBy: actor }
      : { fotoPlacaStorageId: args.storageId, fotoPlacaFileName: args.fileName, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.foto_registrada', detalle: args.tipoFoto, targetTipo: 'sgcInstrumentosRondaItems', targetId: item._id })
    return null
  },
} satisfies SgcMutationConfig<typeof fotoArgs>

const enviarArgs = { relacionId: v.id('sgcInstrumentosRonda'), tecnicoNombre: v.string() }
export const enviarRelacionInstrumentosAValidacionConfig = {
  args: enviarArgs,
  returns: v.object({ estado: v.literal('pendiente_validacion') }),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const relacion = await ctx.db.get(args.relacionId)
    if (!relacion) throw new Error('Relacion no encontrada.')
    const resumen = evaluar(await getItems(ctx, relacion._id))
    if (!resumen.completo) throw new Error(resumen.errores.join(' '))
    if (!args.tecnicoNombre.trim()) throw new Error('Nombre del tecnico es obligatorio.')
    await ctx.db.patch(relacion._id, { estado: 'pendiente_validacion', tecnicoNombre: args.tecnicoNombre.trim(), enviadoAt: Date.now(), observacionDevolucion: null, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.enviada_validacion', targetTipo: 'sgcInstrumentosRonda', targetId: relacion._id })
    return { estado: 'pendiente_validacion' as const }
  },
} satisfies SgcMutationConfig<typeof enviarArgs>

const validarArgs = { relacionId: v.id('sgcInstrumentosRonda'), coordinadorNombre: v.string() }
export const validarRelacionInstrumentosConfig = {
  args: validarArgs,
  returns: v.object({ estado: v.literal('validado') }),
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const relacion = await ctx.db.get(args.relacionId)
    if (!relacion) throw new Error('Relacion no encontrada.')
    if (relacion.estado !== 'pendiente_validacion') throw new Error('Relacion no esta pendiente de validacion.')
    const resumen = evaluar(await getItems(ctx, relacion._id))
    if (!resumen.completo) throw new Error(resumen.errores.join(' '))
    if (!args.coordinadorNombre.trim()) throw new Error('Nombre del coordinador es obligatorio.')
    await ctx.db.patch(relacion._id, { estado: 'validado', coordinadorNombre: args.coordinadorNombre.trim(), validadoAt: Date.now(), updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.validada', targetTipo: 'sgcInstrumentosRonda', targetId: relacion._id })
    return { estado: 'validado' as const }
  },
} satisfies SgcMutationConfig<typeof validarArgs>

const devolverArgs = { relacionId: v.id('sgcInstrumentosRonda'), observacion: v.string() }
export const devolverRelacionInstrumentosConfig = {
  args: devolverArgs,
  returns: v.object({ estado: v.literal('requiere_ajustes') }),
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const relacion = await ctx.db.get(args.relacionId)
    if (!relacion) throw new Error('Relacion no encontrada.')
    if (!args.observacion.trim()) throw new Error('Observacion es obligatoria.')
    await ctx.db.patch(relacion._id, { estado: 'requiere_ajustes', observacionDevolucion: args.observacion.trim(), updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.devuelta', detalle: args.observacion.trim(), targetTipo: 'sgcInstrumentosRonda', targetId: relacion._id })
    return { estado: 'requiere_ajustes' as const }
  },
} satisfies SgcMutationConfig<typeof devolverArgs>

const eliminarItemArgs = { itemId: v.id('sgcInstrumentosRondaItems') }
export const eliminarInstrumentoRondaConfig = {
  args: eliminarItemArgs,
  returns: v.null(),
  handler: async (ctx, { itemId }) => {
    const actor = await requireSgcManage(ctx)
    const item = await ctx.db.get(itemId)
    if (!item) throw new Error('Instrumento no encontrado.')
    const relacion = await invalidar(ctx, item.relacionId, actor)
    await ctx.db.delete(item._id)
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.instrumento_eliminado', targetTipo: 'sgcInstrumentosRondaItems', targetId: item._id })
    return null
  },
} satisfies SgcMutationConfig<typeof eliminarItemArgs>

const retirarFotoArgs = {
  itemId: v.id('sgcInstrumentosRondaItems'),
  tipoFoto: v.union(v.literal('general'), v.literal('placa_serial')),
}
export const retirarFotoInstrumentoRondaConfig = {
  args: retirarFotoArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error('Instrumento no encontrado.')
    const relacion = await invalidar(ctx, item.relacionId, actor)
    await ctx.db.patch(item._id, args.tipoFoto === 'general'
      ? { fotoGeneralStorageId: null, fotoGeneralFileName: null, updatedAt: Date.now(), updatedBy: actor }
      : { fotoPlacaStorageId: null, fotoPlacaFileName: null, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: 'sgc.f21.foto_retirada', detalle: args.tipoFoto, targetTipo: 'sgcInstrumentosRondaItems', targetId: item._id })
    return null
  },
} satisfies SgcMutationConfig<typeof retirarFotoArgs>

const registrarExportacionArgs = {
  relacionId: v.id('sgcInstrumentosRonda'),
  tipo: v.union(v.literal('pdf'), v.literal('xlsx')),
  storageId: v.id('_storage'),
  fileName: v.string(),
  contentType: v.string(),
  size: v.number(),
  revision: v.number(),
}
export const registrarExportacionInstrumentosConfig = {
  args: registrarExportacionArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const relacion = await ctx.db.get(args.relacionId)
    if (!relacion) throw new Error('Relacion no encontrada.')
    if (relacion.estado !== 'validado') throw new Error('Valide la relacion antes de exportar.')
    if (relacion.revision !== args.revision) throw new Error('La revision exportada no coincide con la revision vigente.')
    const expected = args.tipo === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if (args.contentType !== expected) throw new Error(`Tipo de archivo ${args.tipo.toUpperCase()} invalido.`)
    const stored = await ctx.db.system.get(args.storageId)
    if (!stored || stored.size !== args.size) throw new Error('Exportacion no disponible o metadata inconsistente.')
    const now = Date.now()
    if (args.tipo === 'pdf') {
      await ctx.db.patch(relacion._id, { pdfStorageId: args.storageId, pdfRevision: args.revision, updatedAt: now, updatedBy: actor })
      const recurso = await getRecurso(ctx, relacion.rondaId)
      if (recurso) {
        await ctx.db.patch(recurso._id, {
          definitivo: { storageId: args.storageId, fileName: args.fileName, contentType: args.contentType, size: args.size, tipo: 'pdf' },
          estado: 'diligenciado',
          publicaParticipante: false,
          updatedAt: now,
          updatedBy: actor,
        })
      }
    } else {
      await ctx.db.patch(relacion._id, { xlsxStorageId: args.storageId, xlsxRevision: args.revision, updatedAt: now, updatedBy: actor })
    }
    await writeAudit(ctx, { rondaId: relacion.rondaId, actor, evento: `sgc.f21.${args.tipo}_generado`, detalle: `revision=${args.revision}`, targetTipo: 'sgcInstrumentosRonda', targetId: relacion._id })
    return null
  },
} satisfies SgcMutationConfig<typeof registrarExportacionArgs>

const downloadArgs = {
  rondaId: v.id('rondas'),
  tipo: v.union(v.literal('pdf'), v.literal('xlsx')),
}
export const getExportacionInstrumentosUrlConfig = {
  args: downloadArgs,
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireSgcManage(ctx)
    const relacion = await getRelacion(ctx, args.rondaId)
    if (!relacion) return null
    const storageId = args.tipo === 'pdf' ? relacion.pdfStorageId : relacion.xlsxStorageId
    return storageId ? ctx.storage.getUrl(storageId) : null
  },
} satisfies SgcQueryConfig<typeof downloadArgs>
