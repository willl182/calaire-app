// Resultados: envíos regulares, resultados por ronda y evaluación PT (scores).
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { safeConvexCall } from '@/lib/convex-fallback'
import { authedMutation as fetchMutation, authedQuery as fetchQuery } from '@/server/convex'
import type { Contaminante, Envio, PtScoreImportRow, ResultadoParticipante } from './types'
import { mapEnvioDoc } from './mappers'

export async function previewPtScoreImport(rondaId: string, rows: PtScoreImportRow[]) {
  return fetchQuery(api.pt.scores.previewImport, { rondaId: rondaId as Id<'rondas'>, rows })
}

export async function importPtScoreDraft(rondaId: string, rows: PtScoreImportRow[]) {
  const importToken = crypto.randomUUID()
  await fetchMutation(api.pt.scores.startDraftImport, { rondaId: rondaId as Id<'rondas'>, importToken, filasEsperadas: rows.length })
  for (let offset = 0; offset < rows.length; offset += 100) {
    await fetchMutation(api.pt.scores.importDraftBatch, { rondaId: rondaId as Id<'rondas'>, importToken, offset, rows: rows.slice(offset, offset + 100) })
  }
  return fetchMutation(api.pt.scores.finishDraftImport, { rondaId: rondaId as Id<'rondas'>, importToken })
}

export async function getPtEvaluationAdmin(rondaId: string) {
  return fetchQuery(api.pt.scores.getEstadoEvaluacionAdmin, { rondaId: rondaId as Id<'rondas'> })
}

export async function uploadPtGeneralReport(rondaId: string, file: File) {
  const uploadUrl = await fetchMutation(api.pt.scores.generateUploadUrl, {})
  const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
  if (!response.ok) throw new Error('No se pudo subir el informe a storage.')
  const uploaded = await response.json() as { storageId: string }
  await fetchMutation(api.pt.scores.registrarInformeGeneral, {
    rondaId: rondaId as Id<'rondas'>, storageId: uploaded.storageId as Id<'_storage'>,
    nombreArchivo: file.name, contentType: file.type, size: file.size,
  })
}

export async function publishPtResults(rondaId: string) {
  return fetchMutation(api.pt.scores.publicarResultados, { rondaId: rondaId as Id<'rondas'> })
}

export async function getMyPtResults(rondaId: string) {
  return fetchQuery(api.pt.scores.getMisResultados, { rondaId: rondaId as Id<'rondas'> })
}

export async function getMyPtPerformance() {
  return fetchQuery(api.pt.scores.getMiDesempeno, {})
}

export async function getMyPtReport(rondaId: string) {
  return fetchQuery(api.pt.scores.getMiInformeUrl, { rondaId: rondaId as Id<'rondas'> })
}

export async function listEnvios(rondaId: string): Promise<Envio[]> {
  const rows = await safeConvexCall(
    'listEnvios',
    () => fetchQuery(api.rondas.index.listEnvios, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    [],
  )
  return rows.map(mapEnvioDoc)
}

export type EstadoEnvioParticipante = {
  completo: boolean
  enviado: boolean
  enviados_at: string | null
  total_esperado: number
  total_guardado: number
}

export async function getEstadoEnvioParticipante(
  rondaId: string
): Promise<EstadoEnvioParticipante> {
  return safeConvexCall(
    'getEstadoEnvioParticipante',
    () => fetchQuery(api.rondas.index.getEstadoEnvioParticipante, {
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

export type CeldaParticipante = {
  email: string
  userId: string
  promedio: number | null
  incertidumbre: number | null
  valores: number[]
}

export type ResultadoNivel = {
  nivel: number
  participantes: CeldaParticipante[]
  media: number | null
  desviacion: number | null
  cv: number | null
}

export type ResultadoContaminante = {
  contaminante: Contaminante
  replicas: number
  niveles: ResultadoNivel[]
}

export async function listResultados(rondaId: string): Promise<ResultadoContaminante[]> {
  return safeConvexCall(
    'listResultados',
    () => fetchQuery(api.rondas.index.listResultados, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
}

export async function listResultadosRonda(rondaId: string): Promise<ResultadoParticipante[]> {
  const rows = await safeConvexCall(
    'listResultadosRonda',
    () => fetchQuery(api.rondas.index.listResultadosRonda, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return rows.map((row) => ({
    workos_user_id: row.workos_user_id,
    email: row.email,
    completados: row.completados,
    total_esperado: row.total_esperado,
    porcentaje_completitud: row.porcentaje_completitud,
    enviados_at: row.enviados_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    envios: (row.envios as any[]).map(mapEnvioDoc),
  }))
}
