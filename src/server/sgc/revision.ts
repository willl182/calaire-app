// F-PSEA-11 / F-PSEA-13: revisión de datos y de homogeneidad (convex/sgc/revision).
import { fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'

export async function guardarRevisionDatos(
  rondaId: string,
  checks: Record<string, { cumple: boolean; observacion: string | null }>,
  metricas: Record<string, string | number | boolean | null>
) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.createOrUpdateRevisionDatos, {
    rondaId: rondaId as Id<'rondas'>,
    checks,
    metricas
  }, { token })
}

export async function finalizarRevisionDatos(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.finalizarRevisionDatos, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function guardarRevisionHomogeneidad(
  rondaId: string,
  checks: Record<string, { cumple: boolean; observacion: string | null }>,
  metricas: Record<string, string | number | boolean | null>,
  conclusiones: string | null
) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.createOrUpdateRevisionHomogeneidad, {
    rondaId: rondaId as Id<'rondas'>,
    checks,
    metricas,
    conclusiones
  }, { token })
}

export async function finalizarRevisionHomogeneidad(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.finalizarRevisionHomogeneidad, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}
