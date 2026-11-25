// Comentarios del participante sobre la ronda (convex/sgc/comentarios).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken, withStatus } from '@/server/convex'

export async function createComentarioRonda(rondaId: string, mensaje: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.createComentarioRonda, {
    rondaId: rondaId as Id<'rondas'>,
    mensaje
  }, { token })
}

export async function listMisComentariosRonda(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listMisComentariosRonda, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export const listMisComentariosRondaWithStatus = withStatus('listMisComentariosRonda', listMisComentariosRonda, [])

export async function responderComentarioRonda(comentarioId: string, respuesta: string, cerrar: boolean) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.responderComentarioRonda, {
    comentarioId: comentarioId as Id<'sgcComentariosRonda'>,
    respuesta,
    cerrar
  }, { token })
}
