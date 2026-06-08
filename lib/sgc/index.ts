import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { cookies } from 'next/headers'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  agruparChecklistPorFase,
  calcularChecklistSgc,
  derivarBloqueantes,
  type SgcChecklistItem,
} from './checklist'
import type { SgcFase, SgcFormatoCodigo } from './catalog'

async function sgcToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('workos-access-token')?.value
  if (!token) {
    throw new Error('No hay sesion activa para operar SGC.')
  }
  return token
}

export type SgcPanel = {
  ronda: {
    _id: string
    codigo: string
    nombre: string
    estado: string
  }
  plan: {
    _id: string
    estado: 'borrador' | 'finalizado' | 'requiere_revision'
    bloques: Record<string, string>
    camposEstructurados: Record<string, string>
    finalizadoAt?: number | null
    finalizadoBy?: string | null
    updatedAt: number
    updatedBy: string
  } | null
  revision: {
    _id: string
    estado: 'borrador' | 'finalizado' | 'requiere_revision'
    checks: Record<string, { cumple: boolean; observacion: string | null; updatedAt: number; updatedBy: string }>
    metricas: Record<string, string | number | boolean | null>
    finalizadoAt?: number | null
    finalizadoBy?: string | null
    updatedAt: number
    updatedBy: string
  } | null
  hitos: Array<{
    _id: string
    codigo: string
    nombre: string
    fase: string
    fechaObjetivo?: string | null
    fechaReal?: string | null
    estado: string
    responsable: string
    visibleParticipante: boolean
    bloqueaCierre: boolean
    formatoRelacionado?: string | null
    notas?: string | null
  }>
  series: Array<{
    _id: string
    formato: SgcFormatoCodigo
    nombre: string
    requerida: boolean
    publicaParticipante: boolean
  }>
  justificaciones: Array<{
    _id: string
    formato: SgcFormatoCodigo
    alcance: string
    razon: string
    estado: 'vigente' | 'reemplazada' | 'retirada'
    updatedAt: number
    updatedBy: string
  }>
  versiones: Array<{
    serieId: string
    vigente: {
      _id: string
      fileName: string
      version: number
      estado: string
      createdAt: number
      createdBy: string
    } | null
  }>
  audit: Array<{
    _id: string
    actor: string
    evento: string
    detalle?: string | null
    createdAt: number
  }>
  snapshots: Array<{
    _id: string
    tipoRegistro: string
    registroId: string
    version: number
    createdAt: number
    createdBy: string
    resumen: string
  }>
  metricasActuales: Record<string, string | number | boolean | null>
  checklist: SgcChecklistItem[]
  checklistPorFase: Record<SgcFase, SgcChecklistItem[]>
  bloqueantes: string[]
}

export async function getPanelSgc(rondaId: string): Promise<SgcPanel | null> {
  const token = await sgcToken()
  const raw = await fetchQuery(api.sgc.getPanelSgc, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
  if (!raw) return null
  const checklist = calcularChecklistSgc(raw.coverage)
  return {
    ronda: raw.ronda,
    plan: raw.plan,
    revision: raw.revision,
    hitos: raw.hitos,
    series: raw.series as SgcPanel['series'],
    justificaciones: raw.justificaciones as SgcPanel['justificaciones'],
    versiones: raw.versiones as SgcPanel['versiones'],
    snapshots: raw.snapshots,
    audit: raw.audit,
    metricasActuales: raw.metricasActuales,
    checklist,
    checklistPorFase: agruparChecklistPorFase(checklist),
    bloqueantes: derivarBloqueantes(checklist),
  }
}

export async function guardarJustificacionSgc(
  rondaId: string,
  actor: string,
  formato: 'F-PSEA-05' | 'F-PSEA-05A' | 'F-PSEA-12',
  alcance: string,
  razon: string
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.upsertJustificacion, {
    rondaId: rondaId as Id<'rondas'>,
    actor,
    formato,
    alcance,
    razon
  }, { token })
}

export async function retirarJustificacionSgc(justificacionId: string, actor: string, motivo: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.retirarJustificacion, {
    justificacionId: justificacionId as Id<'sgcJustificaciones'>,
    actor,
    motivo
  }, { token })
}

export async function inicializarPanelSgc(rondaId: string, actor: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.inicializarPanelSgc, {
    rondaId: rondaId as Id<'rondas'>,
    actor
  }, { token })
}

export async function guardarPlanRonda(
  rondaId: string,
  actor: string,
  bloques: Record<string, string>,
  camposEstructurados: Record<string, string>,
  motivoRevision?: string
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.createOrUpdatePlanRonda, {
    rondaId: rondaId as Id<'rondas'>,
    actor,
    bloques,
    camposEstructurados,
    motivoRevision
  }, { token })
}

export async function finalizarPlanRonda(rondaId: string, actor: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.finalizarPlanRonda, {
    rondaId: rondaId as Id<'rondas'>,
    actor
  }, { token })
}

export async function guardarRevisionDatos(
  rondaId: string,
  actor: string,
  checks: Record<string, { cumple: boolean; observacion: string | null }>,
  metricas: Record<string, string | number | boolean | null>
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.createOrUpdateRevisionDatos, {
    rondaId: rondaId as Id<'rondas'>,
    actor,
    checks,
    metricas
  }, { token })
}

export async function finalizarRevisionDatos(rondaId: string, actor: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.finalizarRevisionDatos, {
    rondaId: rondaId as Id<'rondas'>,
    actor
  }, { token })
}

export async function crearHitoRonda(args: {
  rondaId: string
  actor: string
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
  const token = await sgcToken()
  await fetchMutation(api.sgc.createHitoRonda, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>
  }, { token })
}

export async function actualizarHitoRonda(args: {
  hitoId: string
  actor: string
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
  const token = await sgcToken()
  await fetchMutation(api.sgc.updateHitoRonda, {
    ...args,
    hitoId: args.hitoId as Id<'sgcHitosRonda'>
  }, { token })
}

export async function crearSerieEvidencia(
  rondaId: string,
  actor: string,
  formato: SgcFormatoCodigo,
  nombre: string
) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.createEvidenciaSeries, {
    rondaId: rondaId as Id<'rondas'>,
    actor,
    formato,
    seccion: null,
    nombre,
    requerida: true,
    publicaParticipante: false
  }, { token })
}

export async function generateSgcUploadUrl() {
  const token = await sgcToken()
  return fetchMutation(api.sgc.generateUploadUrl, {}, { token })
}

export async function registrarEvidenciaVersion(args: {
  serieId: string
  storageId: string
  actor: string
  fileName: string
  contentType: string
  size: number
  hash: string | null
}) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.registrarEvidenciaVersion, {
    ...args,
    serieId: args.serieId as Id<'sgcEvidenciaSeries'>,
    storageId: args.storageId as Id<'_storage'>
  }, { token })
}

export async function retirarEvidenciaVersion(evidenciaVersionId: string, actor: string, motivo: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.retirarEvidenciaVersion, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>,
    actor,
    motivo
  }, { token })
}

export async function getSgcDownloadUrl(evidenciaVersionId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getDownloadUrl, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>
  }, { token })
}

export async function getEvidenciaVersionContext(evidenciaVersionId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getEvidenciaVersionContext, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>
  }, { token })
}

export async function pasarADocumentacionPendiente(rondaId: string, actor: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.transitionRondaToDocumentacionPendiente, {
    rondaId: rondaId as Id<'rondas'>,
    actor
  }, { token })
}

export async function cerrarDocumentalmente(rondaId: string, actor: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.transitionRondaToCerrada, {
    rondaId: rondaId as Id<'rondas'>,
    actor
  }, { token })
}

export async function reabrirRondaSgc(rondaId: string, actor: string, motivo: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.reabrirRondaSgc, {
    rondaId: rondaId as Id<'rondas'>,
    actor,
    motivo
  }, { token })
}
