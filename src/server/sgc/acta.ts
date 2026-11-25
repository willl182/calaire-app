// F-PSEA-19: acta de inicio (convex/sgc/actaInicio).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'

export async function getActaInicio(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getActaInicio, { rondaId: rondaId as Id<'rondas'> }, { token })
}

export async function inicializarActaInicio(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.inicializarActaInicio, { rondaId: rondaId as Id<'rondas'> }, { token })
}

export async function actualizarActaInicio(args: { actaId: string; fecha: string; lugar: string; textoInicio: string; organizadores: Array<{ nombre: string; entidad: string }> }) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.actualizarActaInicio, { ...args, actaId: args.actaId as Id<'sgcActasInicio'> }, { token })
}

export async function registrarArchivoActaInicio(args: { actaId: string; storageId: string; fileName: string; contentType: string; size: number; tipo: 'docx' | 'pdf' }) {
  const token = await getConvexToken('operar SGC')
  const payload = { actaId: args.actaId as Id<'sgcActasInicio'>, storageId: args.storageId as Id<'_storage'>, fileName: args.fileName, contentType: args.contentType, size: args.size }
  if (args.tipo === 'docx') return fetchMutation(api.sgc.index.registrarDocxActaInicio, payload, { token })
  return fetchMutation(api.sgc.index.registrarPdfFirmadoActaInicio, payload, { token })
}

export async function cambiarPublicacionActaInicio(actaId: string, publicaParticipante: boolean) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.cambiarPublicacionActaInicio, { actaId: actaId as Id<'sgcActasInicio'>, publicaParticipante }, { token })
}

export async function getActaInicioDownloadUrl(rondaId: string, tipo: 'docx' | 'pdf_firmado' | 'pdf_firmado_interno') {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getActaInicioDownloadUrl, { rondaId: rondaId as Id<'rondas'>, tipo }, { token })
}
