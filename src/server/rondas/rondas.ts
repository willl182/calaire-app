// Rondas: lectura y configuración (crear, editar, transicionar, borrar).
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { safeConvexCallWithStatus } from '@/lib/convex-fallback'
import { authedMutation as fetchMutation, authedQuery as fetchQuery, dataOf } from '@/server/convex'
import type { Contaminante, ParticipantePerfil } from './types'
import { mapRondaWithContaminantes } from './mappers'

export const getRonda = dataOf(getRondaWithStatus)

export async function getRondaWithStatus(id: string) {
  const result = await safeConvexCallWithStatus(
    'getRonda',
    () => fetchQuery(api.rondas.index.getRonda, { id: id as Id<'rondas'> }),
    null,
  )
  return {
    data: result.data ? mapRondaWithContaminantes(result.data) : null,
    offline: result.offline,
  }
}

export const getRondaByCodigo = dataOf(getRondaByCodigoWithStatus)

export async function getRondaByCodigoWithStatus(codigo: string) {
  const result = await safeConvexCallWithStatus(
    'getRondaByCodigo',
    () => fetchQuery(api.rondas.index.getRondaByCodigo, { codigo }),
    null,
  )
  return {
    data: result.data ? mapRondaWithContaminantes(result.data) : null,
    offline: result.offline,
  }
}

export const listRondas = dataOf(listRondasWithStatus)

export async function listRondasWithStatus() {
  const result = await safeConvexCallWithStatus(
    'listRondas',
    () => fetchQuery(api.rondas.index.listRondas, {}),
    [],
  )
  return { data: result.data.map(mapRondaWithContaminantes), offline: result.offline }
}

export async function createConfiguredRonda(
  nombre: string,
  codigo: string,
  contaminantes: { contaminante: Contaminante; niveles: number; replicas: 2 | 3 }[],
  slots: { workosUserId: string; email: string; participantProfile: ParticipantePerfil }[]
): Promise<string> {
  const id = await fetchMutation(api.rondas.index.createConfiguredRonda, {
    nombre,
    codigo,
    contaminantes,
    slots,
  })
  return id as string
}

export async function updateRondaConfig(
  rondaId: string,
  nombre: string,
  codigo: string,
  contaminantes: { contaminante: Contaminante; niveles: number; replicas: 2 | 3 }[]
): Promise<void> {
  await fetchMutation(api.rondas.index.updateRondaConfig, {
    id: rondaId as Id<'rondas'>,
    nombre,
    codigo,
    contaminantes,
  })
}

export async function updateRondaReplicas(
  rondaId: string,
  items: { contaminante: Contaminante; replicas: 2 | 3 }[]
): Promise<void> {
  await fetchMutation(api.rondas.index.updateRondaReplicas, {
    rondaId: rondaId as Id<'rondas'>,
    items,
  })
}

export async function updateRondaBasicInfo(
  rondaId: string,
  nombre: string,
  codigo: string
): Promise<void> {
  await fetchMutation(api.rondas.index.updateRondaBasicInfo, {
    id: rondaId as Id<'rondas'>,
    nombre,
    codigo,
  })
}

export async function transitionRondaEstado(
  rondaId: string,
  nextState: 'activa' | 'documentacion_pendiente' | 'cerrada'
): Promise<void> {
  await fetchMutation(api.rondas.index.transitionRondaEstado, {
    id: rondaId as Id<'rondas'>,
    nextState,
  })
}

export async function reabrirRonda(rondaId: string): Promise<void> {
  await fetchMutation(api.rondas.index.reabrirRonda, {
    id: rondaId as Id<'rondas'>,
  })
}

export async function deleteRonda(rondaId: string): Promise<string> {
  return fetchMutation(api.rondas.index.deleteRonda, {
    id: rondaId as Id<'rondas'>,
  })
}
