// F-PSEA-21: relación de instrumentos (convex/sgc/instrumentosRonda).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'

export async function getRelacionInstrumentosRonda(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getRelacionInstrumentosRonda, { rondaId: rondaId as Id<'rondas'> }, { token })
}

export async function inicializarRelacionInstrumentos(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.inicializarRelacionInstrumentos, { rondaId: rondaId as Id<'rondas'> }, { token })
}

type InstrumentoTipo = 'analizador' | 'aire_cero' | 'calibrador_dinamico' | 'cilindro' | 'otro'
type InstrumentoCampos = { tipo: InstrumentoTipo; codigoInterno: string; marca: string; modelo: string; serialIdentificacion: string; observaciones: string }

export async function crearInstrumentoRonda(relacionId: string, campos: InstrumentoCampos) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.crearInstrumentoRonda, { ...campos, relacionId: relacionId as Id<'sgcInstrumentosRonda'> }, { token })
}

export async function actualizarInstrumentoRonda(itemId: string, campos: InstrumentoCampos) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.actualizarInstrumentoRonda, { ...campos, itemId: itemId as Id<'sgcInstrumentosRondaItems'> }, { token })
}

export async function eliminarInstrumentoRonda(itemId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.eliminarInstrumentoRonda, { itemId: itemId as Id<'sgcInstrumentosRondaItems'> }, { token })
}

export async function registrarFotoInstrumentoRonda(args: { itemId: string; tipoFoto: 'general' | 'placa_serial'; storageId: string; fileName: string; contentType: string; size: number }) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.registrarFotoInstrumentoRonda, { ...args, itemId: args.itemId as Id<'sgcInstrumentosRondaItems'>, storageId: args.storageId as Id<'_storage'> }, { token })
}

export async function retirarFotoInstrumentoRonda(itemId: string, tipoFoto: 'general' | 'placa_serial') {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.retirarFotoInstrumentoRonda, { itemId: itemId as Id<'sgcInstrumentosRondaItems'>, tipoFoto }, { token })
}

export async function enviarRelacionInstrumentosAValidacion(relacionId: string, tecnicoNombre: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.enviarRelacionInstrumentosAValidacion, { relacionId: relacionId as Id<'sgcInstrumentosRonda'>, tecnicoNombre }, { token })
}

export async function validarRelacionInstrumentos(relacionId: string, coordinadorNombre: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.validarRelacionInstrumentos, { relacionId: relacionId as Id<'sgcInstrumentosRonda'>, coordinadorNombre }, { token })
}

export async function devolverRelacionInstrumentos(relacionId: string, observacion: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.devolverRelacionInstrumentos, { relacionId: relacionId as Id<'sgcInstrumentosRonda'>, observacion }, { token })
}

type ExportacionInstrumentosArchivo = {
  storageId: string
  fileName: string
  contentType: string
  size: number
}

export async function registrarExportacionesInstrumentos(args: {
  relacionId: string
  revision: number
  pdf: ExportacionInstrumentosArchivo
  xlsx: ExportacionInstrumentosArchivo
}) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.registrarExportacionesInstrumentos, {
    relacionId: args.relacionId as Id<'sgcInstrumentosRonda'>,
    revision: args.revision,
    pdf: { ...args.pdf, storageId: args.pdf.storageId as Id<'_storage'> },
    xlsx: { ...args.xlsx, storageId: args.xlsx.storageId as Id<'_storage'> },
  }, { token })
}

export async function getExportacionInstrumentosUrl(rondaId: string, tipo: 'pdf' | 'xlsx') {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getExportacionInstrumentosUrl, { rondaId: rondaId as Id<'rondas'>, tipo }, { token })
}
