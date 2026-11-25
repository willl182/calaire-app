// Expediente guiado: sincronización, avance, siguiente paso (convex/sgc/expediente).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'
import type {
  EstadoDriveRonda,
  SgcAvanceExpediente,
  SincronizacionExpediente,
} from '../../../convex/_lib/sgc/expediente'

export type { SincronizacionExpediente } from '../../../convex/_lib/sgc/expediente'

export async function getSincronizacionExpedienteSgc(rondaId: string): Promise<SincronizacionExpediente> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getSincronizacionExpediente, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function actualizarExpedienteSgc(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.actualizarExpediente, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export type { SgcAvanceExpediente, SgcAvanceItem, SgcNivelPendiente } from '../../../convex/_lib/sgc/expediente'

export async function getAvanceExpedienteSgc(rondaId: string): Promise<SgcAvanceExpediente> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getAvanceExpediente, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export type { EstadoDriveRonda } from '../../../convex/_lib/sgc/expediente'

/** Estado Drive guardado en Convex (sin saber si la integracion del servidor esta conectada). */
export async function getEstadoDriveRondaGuardado(rondaId: string): Promise<EstadoDriveRonda> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getEstadoDriveRonda, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export type { PasoPrevio, PasoPrevioKey, SiguientePaso } from '../../../convex/_lib/sgc/expediente'

/** Barra "Siguiente paso": pasos previos no SGC + primer documento obligatorio pendiente. */
export async function getSiguientePasoExpedienteSgc(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getSiguientePasoExpediente, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function marcarAplicaDocumentoSgc(rondaId: string, codigo: string, aplica: boolean) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.marcarAplicaDocumento, {
    rondaId: rondaId as Id<'rondas'>, codigo, aplica
  }, { token })
}

export async function aprobarDocumentoExpedienteSgc(rondaId: string, codigo: string, aprobado: boolean) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.aprobarDocumentoExpediente, {
    rondaId: rondaId as Id<'rondas'>, codigo, aprobado
  }, { token })
}
