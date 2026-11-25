// F-PSEA-06: plan de la ronda (convex/sgc/plan).
import { fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'

export async function guardarPlanRonda(
  rondaId: string,
  bloques: Record<string, string>,
  camposEstructurados: Record<string, string>,
  motivoRevision?: string
) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.createOrUpdatePlanRonda, {
    rondaId: rondaId as Id<'rondas'>,
    bloques,
    camposEstructurados,
    motivoRevision
  }, { token })
}

export async function finalizarPlanRonda(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.finalizarPlanRonda, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}
