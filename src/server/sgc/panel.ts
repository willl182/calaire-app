// Panel SGC de la ronda, transiciones documentales y carga a storage (convex/sgc/panel).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'
import {
  agruparChecklistPorFase,
  calcularChecklistSgc,
  derivarBloqueantes,
  type SgcChecklistItem,
} from './checklist'
import type { SgcFase, SgcFormatoCodigo } from './catalog'

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
  revisionHomogeneidad: {
    _id: string
    estado: 'borrador' | 'finalizado' | 'requiere_revision'
    checks: Record<string, { cumple: boolean; observacion: string | null; updatedAt: number; updatedBy: string }>
    metricas: Record<string, string | number | boolean | null>
    conclusiones?: string | null
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
  comentarios: Array<{
    _id: string
    autorNombre: string
    autorEmail: string
    mensaje: string
    estado: 'abierto' | 'respondido' | 'cerrado'
    respuestaAdmin?: string | null
    createdAt: number
  }>
  notificaciones: Array<{
    _id: string
    destinatarioEmail: string
    titulo: string
    mensaje: string
    tipo: string
    estado: string
    leidaAt?: number | null
    createdAt: number
  }>
  destinatariosNotificacion: Array<{
    _id: string
    email: string
    participantCode?: string | null
    participantProfile: 'member' | 'member_special'
    claimedAt?: number | null
  }>
  resultadosPtApp: Array<{
    _id: string
    tipoResultado: 'homogeneidad' | 'estabilidad' | 'estadistico'
    evidenciaSerieId: string
    evidenciaVersionId?: string | null
    estado: 'pendiente' | 'cargado' | 'en_revision' | 'aprobado' | 'rechazado'
    observaciones?: string | null
    version: number
    fechaCalculo?: string | null
    aprobadoAt?: number | null
    aprobadoBy?: string | null
  }>
  casos: Array<{
    _id: string
    rondaParticipanteId?: string | null
    codigo: string
    tipo: 'consulta' | 'desviacion' | 'queja' | 'apelacion' | 'nc_capa' | 'otro'
    severidad: 'baja' | 'media' | 'alta' | 'critica'
    estado: 'abierto' | 'en_revision' | 'esperando_participante' | 'resuelto' | 'cerrado'
    titulo: string
    descripcion: string
    responsable: string
    formatoRelacionado?: string | null
    evidenciaSerieId?: string | null
    fechaObjetivo?: string | null
    resolucion?: string | null
    cerradoAt?: number | null
    cerradoBy?: string | null
    createdAt: number
    updatedAt: number
  }>
  metricasActuales: Record<string, string | number | boolean | null>
  metricasHomogeneidadActuales: Record<string, string | number | boolean | null>
  checklist: SgcChecklistItem[]
  checklistPorFase: Record<SgcFase, SgcChecklistItem[]>
  bloqueantes: string[]
  checklistBloqueantesCierre: string[]
  checklistBloqueantesDocumentacionPendiente: string[]
  driveCierre: {
    totalDocumentos: number
    recursosDocumentales: number
    bloqueantes: string[]
    pendientesCriticos: string[]
    advertencias: string[]
  }
}

export async function getPanelSgc(rondaId: string): Promise<SgcPanel | null> {
  const token = await getConvexToken('operar SGC')
  const raw = await fetchQuery(api.sgc.index.getPanelSgc, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
  if (!raw) return null
  const checklist = calcularChecklistSgc(raw.coverage)
  return {
    ronda: raw.ronda,
    plan: raw.plan,
    revision: raw.revision,
    revisionHomogeneidad: raw.revisionHomogeneidad ?? null,
    hitos: raw.hitos,
    series: raw.series as SgcPanel['series'],
    justificaciones: raw.justificaciones as SgcPanel['justificaciones'],
    versiones: raw.versiones as SgcPanel['versiones'],
    snapshots: raw.snapshots,
    comentarios: raw.comentarios ?? [],
    notificaciones: raw.notificaciones ?? [],
    destinatariosNotificacion: raw.destinatariosNotificacion ?? [],
    resultadosPtApp: raw.resultadosPtApp ?? [],
    casos: raw.casos ?? [],
    audit: raw.audit,
    metricasActuales: raw.metricasActuales,
    metricasHomogeneidadActuales: raw.metricasHomogeneidadActuales ?? {},
    checklist,
    checklistPorFase: agruparChecklistPorFase(checklist),
    bloqueantes: raw.checklistBloqueantesCierre ?? derivarBloqueantes(checklist),
    checklistBloqueantesCierre: raw.checklistBloqueantesCierre ?? derivarBloqueantes(checklist),
    checklistBloqueantesDocumentacionPendiente: raw.checklistBloqueantesDocumentacionPendiente ?? [],
    driveCierre: raw.driveCierre ?? {
      totalDocumentos: 0,
      recursosDocumentales: 0,
      bloqueantes: [],
      pendientesCriticos: [],
      advertencias: [],
    },
  }
}

export async function inicializarPanelSgc(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.inicializarPanelSgc, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function generateSgcUploadUrl() {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.generateUploadUrl, {}, { token })
}

export async function pasarADocumentacionPendiente(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.transitionRondaToDocumentacionPendiente, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function cerrarDocumentalmente(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.transitionRondaToCerrada, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function reabrirRondaSgc(rondaId: string, motivo: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.reabrirRondaSgc, {
    rondaId: rondaId as Id<'rondas'>,
    motivo
  }, { token })
}

export async function listRondasSgcResumen() {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listRondasSgcResumen, {}, { token })
}
