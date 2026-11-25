// Hitos de la ronda (convex/sgc/hitos).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken, withStatus } from '@/server/convex'

export async function crearHitoRonda(args: {
  rondaId: string
  codigo: string
  nombre: string
  fase: string
  fechaObjetivo: string | null
  fechaReal: string | null
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'vencido' | 'cancelado' | 'no_aplica'
  responsable: string
  visibleParticipante: boolean
  bloqueaCierre: boolean
  formatoRelacionado: string | null
  notas: string | null
}) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.createHitoRonda, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>
  }, { token })
}

export async function actualizarHitoRonda(args: {
  hitoId: string
  codigo: string
  nombre: string
  fase: string
  fechaObjetivo: string | null
  fechaReal: string | null
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'vencido' | 'cancelado' | 'no_aplica'
  responsable: string
  visibleParticipante: boolean
  bloqueaCierre: boolean
  formatoRelacionado: string | null
  notas: string | null
}) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.updateHitoRonda, {
    ...args,
    hitoId: args.hitoId as Id<'sgcHitosRonda'>
  }, { token })
}

export async function getHitosVisibleParticipante(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getHitosVisibleParticipante, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export const getHitosVisibleParticipanteWithStatus = withStatus('getHitosVisibleParticipante', getHitosVisibleParticipante, [])
