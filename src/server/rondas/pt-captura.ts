// Captura PT: ítems, grupos de muestra, participantes y envíos PT.
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { safeConvexCall, safeConvexCallWithStatus } from '@/lib/convex-fallback'
import { authedMutation as fetchMutation, authedQuery as fetchQuery, dataOf } from '@/server/convex'
import type {
  Contaminante,
  EnvioPT,
  EnvioPTConMetadatos,
  EnvioPTWithRelations,
  RondaParticipantePT,
  RondaPTItem,
  RondaPTItemInput,
  RondaPTSampleGroup,
} from './types'
import { mapEnvioPTDoc, mapPTItemDoc, mapPTSampleGroupDoc, mapParticipantePTDoc } from './mappers'
import type { EstadoEnvioParticipante } from './resultados'

export const listPTItems = dataOf(listPTItemsWithStatus)

export async function listPTItemsWithStatus(rondaId: string) {
  const result = await safeConvexCallWithStatus(
    'listPTItems',
    () => fetchQuery(api.pt.index.listPTItems, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return { data: result.data.map(mapPTItemDoc), offline: result.offline }
}

export const listPTSampleGroups = dataOf(listPTSampleGroupsWithStatus)

export async function listPTSampleGroupsWithStatus(rondaId: string) {
  const result = await safeConvexCallWithStatus(
    'listPTSampleGroups',
    () => fetchQuery(api.pt.index.listPTSampleGroups, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return { data: result.data.map(mapPTSampleGroupDoc), offline: result.offline }
}

export const getRondaParticipantePT = dataOf(getRondaParticipantePTWithStatus)

export async function getRondaParticipantePTWithStatus(
  rondaId: string
) {
  const result = await safeConvexCallWithStatus(
    'getRondaParticipantePT',
    () => fetchQuery(api.pt.index.getRondaParticipantePT, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    null,
  )
  return {
    data: result.data ? mapParticipantePTDoc(result.data) : null,
    offline: result.offline,
  }
}

export async function listParticipantesPT(rondaId: string): Promise<RondaParticipantePT[]> {
  const rows = await safeConvexCall(
    'listParticipantesPT',
    () => fetchQuery(api.pt.index.listParticipantesPT, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return rows.map(mapParticipantePTDoc)
}

export const listEnviosPT = dataOf(listEnviosPTWithStatus)

export async function listEnviosPTWithStatus(rondaId: string) {
  const result = await safeConvexCallWithStatus(
    'listEnviosPT',
    () => fetchQuery(api.pt.index.listEnviosPT, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    [],
  )
  return { data: result.data.map(mapEnvioPTDoc), offline: result.offline }
}

export async function listEnviosPTByParticipante(rondaParticipanteId: string): Promise<EnvioPT[]> {
  const rows = await safeConvexCall(
    'listEnviosPTByParticipante',
    () => fetchQuery(api.pt.index.listEnviosPTByParticipante, {
      rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    }),
    [],
  )
  return rows.map(mapEnvioPTDoc)
}

export async function getEnvioPT(
  rondaParticipanteId: string,
  ptItemId: string,
  sampleGroupId: string
): Promise<EnvioPT | null> {
  const row = await safeConvexCall(
    'getEnvioPT',
    () => fetchQuery(api.pt.index.getEnvioPT, {
      rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
      ptItemId: ptItemId as Id<'rondaPtItems'>,
      sampleGroupId: sampleGroupId as Id<'rondaPtSampleGroups'>,
    }),
    null,
  )
  if (!row) return null
  return mapEnvioPTDoc(row)
}

export const getEstadoEnvioPTParticipante = dataOf(getEstadoEnvioPTParticipanteWithStatus)

export async function getEstadoEnvioPTParticipanteWithStatus(
  rondaId: string
) {
  return safeConvexCallWithStatus(
    'getEstadoEnvioPTParticipante',
    () => fetchQuery(api.pt.index.getEstadoEnvioPTParticipante, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    {
      completo: false,
      enviado: false,
      enviados_at: null,
      total_esperado: 0,
      total_guardado: 0,
    },
  )
}

export async function getEstadoEnvioPTByParticipante(
  rondaParticipanteId: string
): Promise<EstadoEnvioParticipante> {
  return safeConvexCall(
    'getEstadoEnvioPTByParticipante',
    () => fetchQuery(api.pt.index.getEstadoEnvioPTByParticipante, {
      rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    }),
    {
      completo: false,
      enviado: false,
      enviados_at: null,
      total_esperado: 0,
      total_guardado: 0,
    },
  )
}

export const listResultadosPTRonda = dataOf(listResultadosPTRondaWithStatus)

export async function listResultadosPTRondaWithStatus(rondaId: string) {
  return safeConvexCallWithStatus(
    'listResultadosPTRonda',
    () => fetchQuery(api.pt.index.listResultadosPTRonda, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
}

export async function listEnviosPTRound(rondaId: string): Promise<EnvioPTConMetadatos[]> {
  return safeConvexCall(
    'listEnviosPTRound',
    () => fetchQuery(api.pt.index.listEnviosPTRound, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
}

export async function upsertEnvioPT(
  rondaId: string,
  rondaParticipanteId: string,
  ptItemId: string,
  sampleGroupId: string,
  d1: number,
  d2: number | null,
  d3: number | null,
  meanValue: number,
  sdValue: number,
  ux: number,
  uxExp: number,
  k = 2,
): Promise<EnvioPT> {
  await fetchMutation(api.pt.index.upsertEnvioPT, {
    rondaId: rondaId as Id<'rondas'>,
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    ptItemId: ptItemId as Id<'rondaPtItems'>,
    sampleGroupId: sampleGroupId as Id<'rondaPtSampleGroups'>,
    d1,
    d2: d2 ?? undefined,
    d3: d3 ?? undefined,
    meanValue,
    sdValue,
    ux,
    uxExp,
    k,
  })
  const row = await fetchQuery(api.pt.index.getEnvioPT, {
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    ptItemId: ptItemId as Id<'rondaPtItems'>,
    sampleGroupId: sampleGroupId as Id<'rondaPtSampleGroups'>,
  })
  if (!row) throw new Error('No fue posible recuperar el envio PT tras guardarlo')
  return mapEnvioPTDoc(row)
}

export async function deleteParticipanteEnviosPT(rondaId: string, rondaParticipanteId: string): Promise<number> {
  return fetchMutation(api.pt.index.deleteParticipanteEnviosPT, {
    rondaId: rondaId as Id<'rondas'>,
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
  })
}

export async function submitFinalPT(rondaId: string): Promise<string> {
  return fetchMutation(api.pt.index.submitFinalPT, {
    rondaId: rondaId as Id<'rondas'>,
  })
}

export async function submitFinalPTByParticipante(rondaParticipanteId: string): Promise<string> {
  return fetchMutation(api.pt.index.submitFinalPTByParticipante, {
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
  })
}

export async function reabrirEnvioFinalPT(rondaParticipanteId: string): Promise<{
  previousSubmittedAt: string | null
  updatedCells: number
}> {
  return fetchMutation(api.pt.index.reabrirEnvioFinalPT, {
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
  })
}

export async function createPTItem(
  rondaId: string,
  contaminante: Contaminante,
  runCode: string,
  levelLabel: string,
  sortOrder: number
): Promise<RondaPTItem> {
  const doc = await fetchMutation(api.pt.index.createPTItem, {
    rondaId: rondaId as Id<'rondas'>,
    contaminante,
    runCode,
    levelLabel,
    sortOrder,
  })
  if (!doc) throw new Error('No fue posible recuperar el item PT tras crearlo')
  return {
    id: doc._id as string,
    ronda_id: doc.rondaId as string,
    contaminante: doc.contaminante,
    run_code: doc.runCode,
    level_label: doc.levelLabel,
    sort_order: doc.sortOrder,
    created_at: new Date(doc._creationTime).toISOString(),
  }
}

export async function createPTItemsBulk(
  rondaId: string,
  contaminante: Contaminante,
  items: RondaPTItemInput[]
): Promise<RondaPTItem[]> {
  const docs = await fetchMutation(api.pt.index.createPTItemsBulk, {
    rondaId: rondaId as Id<'rondas'>,
    contaminante,
    items,
  })
  return docs.map((doc) => {
    if (!doc) throw new Error('No fue posible recuperar un item PT tras crearlo')
    return {
      id: doc._id as string,
      ronda_id: doc.rondaId as string,
      contaminante: doc.contaminante,
      run_code: doc.runCode,
      level_label: doc.levelLabel,
      sort_order: doc.sortOrder,
      created_at: new Date(doc._creationTime).toISOString(),
    }
  })
}

export async function createPTSampleGroup(
  rondaId: string,
  sampleGroup: string,
  sortOrder: number
): Promise<RondaPTSampleGroup> {
  const doc = await fetchMutation(api.pt.index.createPTSampleGroup, {
    rondaId: rondaId as Id<'rondas'>,
    sampleGroup,
    sortOrder,
  })
  if (!doc) throw new Error('No fue posible recuperar el grupo de muestra PT tras crearlo')
  return {
    id: doc._id as string,
    ronda_id: doc.rondaId as string,
    sample_group: doc.sampleGroup,
    sort_order: doc.sortOrder,
    created_at: new Date(doc._creationTime).toISOString(),
  }
}

export async function updateParticipantePT(
  participanteId: string,
  participantCode: string | null,
  replicateCode: number | null
): Promise<void> {
  await fetchMutation(api.pt.index.updateParticipantePT, {
    participanteId: participanteId as Id<'rondaParticipantes'>,
    participantCode,
    replicateCode,
  })
}

export async function updatePTItem(
  rondaId: string,
  itemId: string,
  runCode: string,
  levelLabel: string
): Promise<RondaPTItem> {
  const doc = await fetchMutation(api.pt.index.updatePTItem, {
    rondaId: rondaId as Id<'rondas'>,
    itemId: itemId as Id<'rondaPtItems'>,
    runCode,
    levelLabel,
  })
  if (!doc) throw new Error('No fue posible recuperar el item PT tras actualizarlo')
  return {
    id: doc._id as string,
    ronda_id: doc.rondaId as string,
    contaminante: doc.contaminante,
    run_code: doc.runCode,
    level_label: doc.levelLabel,
    sort_order: doc.sortOrder,
    created_at: new Date(doc._creationTime).toISOString(),
  }
}

export async function deletePTItem(rondaId: string, itemId: string): Promise<void> {
  await fetchMutation(api.pt.index.deletePTItem, {
    rondaId: rondaId as Id<'rondas'>,
    itemId: itemId as Id<'rondaPtItems'>,
  })
}

export async function deletePTSampleGroup(rondaId: string, groupId: string): Promise<void> {
  await fetchMutation(api.pt.index.deletePTSampleGroup, {
    rondaId: rondaId as Id<'rondas'>,
    groupId: groupId as Id<'rondaPtSampleGroups'>,
  })
}

export async function listAllEnviosPT(rondaId: string): Promise<EnvioPTWithRelations[]> {
  const rows = await safeConvexCall(
    'listAllEnviosPT',
    () => fetchQuery(api.pt.index.listAllEnviosPT, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )

  return rows.map(({ envio, ptItem, sampleGroup, participante }) => ({
    ...mapEnvioPTDoc(envio),
    pt_item: mapPTItemDoc(ptItem),
    sample_group: mapPTSampleGroupDoc(sampleGroup),
    participante: mapParticipantePTDoc(participante),
  }))
}
