// Notificaciones al participante (convex/sgc/notificaciones).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken, withStatus } from '@/server/convex'

export async function crearNotificacion(args: {
  rondaId: string
  rondaParticipanteId: string | null
  destinatarioEmail: string
  titulo: string
  mensaje: string
  tipo: 'recordatorio' | 'cronograma' | 'resultado' | 'sgc' | 'otro'
}) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.crearNotificacion, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>,
    rondaParticipanteId: args.rondaParticipanteId as Id<'rondaParticipantes'> | null
  }, { token })
}

export async function listMisNotificaciones(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listMisNotificaciones, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export const listMisNotificacionesWithStatus = withStatus('listMisNotificaciones', listMisNotificaciones, [])

export async function marcarNotificacionLeida(notificacionId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.marcarNotificacionLeida, {
    notificacionId: notificacionId as Id<'sgcNotificaciones'>
  }, { token })
}
