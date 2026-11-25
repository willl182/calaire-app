// Publicaciones al participante (convex/sgc/publicaciones).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken, withStatus } from '@/server/convex'

export async function listPublicaciones(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listPublicaciones, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function createPublicacion(args: {
  rondaId: string
  titulo: string
  contenido: string
  tipo: 'resultado' | 'comunicado' | 'cronograma' | 'evidencia'
  visibleDesde: number
  visibleHasta: number | null
}) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.createPublicacion, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>
  }, { token })
}

export async function deletePublicacion(publicacionId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.deletePublicacion, {
    publicacionId: publicacionId as Id<'sgcPublicaciones'>
  }, { token })
}

export async function listPublicacionesParticipante(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listPublicaciones, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export const listPublicacionesParticipanteWithStatus = withStatus('listPublicacionesParticipante', listPublicacionesParticipante, [])
