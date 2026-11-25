// Evidencias y justificaciones (convex/sgc/evidencias).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken, withStatus } from '@/server/convex'
import type { SgcFormatoCodigo } from './catalog'

export async function guardarJustificacionSgc(
  rondaId: string,
  formato: 'F-PSEA-05' | 'F-PSEA-05A' | 'F-PSEA-12' | 'F-PSEA-14',
  alcance: string,
  razon: string
) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.upsertJustificacion, {
    rondaId: rondaId as Id<'rondas'>,
    formato,
    alcance,
    razon
  }, { token })
}

export async function retirarJustificacionSgc(justificacionId: string, motivo: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.retirarJustificacion, {
    justificacionId: justificacionId as Id<'sgcJustificaciones'>,
    motivo
  }, { token })
}

export async function crearSerieEvidencia(
  rondaId: string,
  formato: SgcFormatoCodigo,
  nombre: string
) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.createEvidenciaSeries, {
    rondaId: rondaId as Id<'rondas'>,
    formato,
    seccion: null,
    nombre,
    requerida: true,
    publicaParticipante: false
  }, { token })
}

export async function registrarEvidenciaVersion(args: {
  serieId: string
  storageId: string
  fileName: string
  contentType: string
  size: number
  hash: string | null
}) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.registrarEvidenciaVersion, {
    ...args,
    serieId: args.serieId as Id<'sgcEvidenciaSeries'>,
    storageId: args.storageId as Id<'_storage'>
  }, { token })
}

export async function retirarEvidenciaVersion(evidenciaVersionId: string, motivo: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.retirarEvidenciaVersion, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>,
    motivo
  }, { token })
}

export async function getSgcDownloadUrl(evidenciaVersionId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getDownloadUrl, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>
  }, { token })
}

export async function getEvidenciaVersionContext(evidenciaVersionId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getEvidenciaVersionContext, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>
  }, { token })
}

export async function getEvidenciasPublicas(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getEvidenciasPublicas, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export const getEvidenciasPublicasWithStatus = withStatus('getEvidenciasPublicas', getEvidenciasPublicas, [])
