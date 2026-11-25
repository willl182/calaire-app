// Comunicaciones de la ronda (convex/sgc/comunicaciones).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'

export async function listComunicaciones(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listComunicaciones, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function createComunicacion(args: {
  rondaId: string
  tipo: 'email' | 'llamada' | 'reunion' | 'otro'
  destinatario: string
  asunto: string
  notas: string | null
  fecha: string
  responsable: string
}) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.createComunicacion, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>
  }, { token })
}

export async function updateComunicacion(args: {
  comunicacionId: string
  tipo: 'email' | 'llamada' | 'reunion' | 'otro'
  destinatario: string
  asunto: string
  notas: string | null
  fecha: string
  responsable: string
}) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.updateComunicacion, {
    ...args,
    comunicacionId: args.comunicacionId as Id<'sgcComunicaciones'>
  }, { token })
}

export async function deleteComunicacion(comunicacionId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.deleteComunicacion, {
    comunicacionId: comunicacionId as Id<'sgcComunicaciones'>
  }, { token })
}
