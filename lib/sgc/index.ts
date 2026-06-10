import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { requireAuth } from '@/lib/auth'
import {
  agruparChecklistPorFase,
  calcularChecklistSgc,
  derivarBloqueantes,
  type SgcChecklistItem,
} from './checklist'
import type { SgcFase, SgcFormatoCodigo } from './catalog'

async function sgcToken() {
  const auth = await requireAuth()
  const token = auth.accessToken
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
}

export type DocumentoSgc = {
  _id: string
  codigo: string
  nombre: string
  proceso: string
  tipo: 'formato' | 'procedimiento' | 'instructivo' | 'plantilla' | 'registro' | 'otro'
  estado: 'borrador' | 'vigente' | 'obsoleto' | 'en_revision'
  propietario: string
  criticidad: 'baja' | 'media' | 'alta'
  retencion?: string | null
  ubicacionFuente?: string | null
  notas?: string | null
  updatedAt: number
  updatedBy: string
}

export type DocumentoSgcVersion = {
  _id: string
  documentoId: string
  version: number
  estado: 'vigente' | 'reemplazada' | 'retirada'
  fechaVigencia?: string | null
  cambioResumen: string
  fileName?: string | null
  createdAt: number
  createdBy: string
}

export type MatrizDocumentalSgc = {
  documentos: DocumentoSgc[]
  versiones: Array<{
    documentoId: string
    vigente: DocumentoSgcVersion | null
    historial: DocumentoSgcVersion[]
  }>
  procesos: string[]
  resumen: {
    total: number
    vigentes: number
    enRevision: number
    obsoletos: number
  }
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
    bloqueantes: derivarBloqueantes(checklist),
  }
}

export async function guardarJustificacionSgc(
  rondaId: string,
  formato: 'F-PSEA-05' | 'F-PSEA-05A' | 'F-PSEA-12',
  alcance: string,
  razon: string
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.upsertJustificacion, {
    rondaId: rondaId as Id<'rondas'>,
    formato,
    alcance,
    razon
  }, { token })
}

export async function retirarJustificacionSgc(justificacionId: string, motivo: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.retirarJustificacion, {
    justificacionId: justificacionId as Id<'sgcJustificaciones'>,
    motivo
  }, { token })
}

export async function inicializarPanelSgc(rondaId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.inicializarPanelSgc, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function listMatrizDocumentalSgc(): Promise<MatrizDocumentalSgc> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listMatrizDocumentalSgc, {}, { token }) as Promise<MatrizDocumentalSgc>
}

export async function upsertDocumentoSgc(args: {
  documentoId: string | null
  codigo: string
  nombre: string
  proceso: string
  tipo: DocumentoSgc['tipo']
  estado: DocumentoSgc['estado']
  propietario: string
  criticidad: DocumentoSgc['criticidad']
  retencion: string | null
  ubicacionFuente: string | null
  notas: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.upsertDocumentoSgc, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'> | null
  }, { token })
}

export async function registrarDocumentoSgcVersion(args: {
  documentoId: string
  fechaVigencia: string | null
  cambioResumen: string
  storageId: string | null
  fileName: string | null
  contentType: string | null
  size: number | null
  hash: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.registrarDocumentoSgcVersion, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'>,
    storageId: args.storageId as Id<'_storage'> | null
  }, { token })
}

export async function guardarPlanRonda(
  rondaId: string,
  bloques: Record<string, string>,
  camposEstructurados: Record<string, string>,
  motivoRevision?: string
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.createOrUpdatePlanRonda, {
    rondaId: rondaId as Id<'rondas'>,
    bloques,
    camposEstructurados,
    motivoRevision
  }, { token })
}

export async function finalizarPlanRonda(rondaId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.finalizarPlanRonda, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function guardarRevisionDatos(
  rondaId: string,
  checks: Record<string, { cumple: boolean; observacion: string | null }>,
  metricas: Record<string, string | number | boolean | null>
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.createOrUpdateRevisionDatos, {
    rondaId: rondaId as Id<'rondas'>,
    checks,
    metricas
  }, { token })
}

export async function finalizarRevisionDatos(rondaId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.finalizarRevisionDatos, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function guardarRevisionHomogeneidad(
  rondaId: string,
  checks: Record<string, { cumple: boolean; observacion: string | null }>,
  metricas: Record<string, string | number | boolean | null>,
  conclusiones: string | null
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.createOrUpdateRevisionHomogeneidad, {
    rondaId: rondaId as Id<'rondas'>,
    checks,
    metricas,
    conclusiones
  }, { token })
}

export async function finalizarRevisionHomogeneidad(rondaId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.finalizarRevisionHomogeneidad, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function crearHitoRonda(args: {
  rondaId: string
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
  formato: SgcFormatoCodigo,
  nombre: string
) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.createEvidenciaSeries, {
    rondaId: rondaId as Id<'rondas'>,
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

export async function retirarEvidenciaVersion(evidenciaVersionId: string, motivo: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.retirarEvidenciaVersion, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>,
    motivo
  }, { token })
}

export async function getSgcDownloadUrl(evidenciaVersionId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getDownloadUrl, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>
  }, { token })
}

export async function getDocumentoSgcDownloadUrl(versionId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getDocumentoSgcDownloadUrl, {
    versionId: versionId as Id<'documentoSgcVersiones'>
  }, { token })
}


export async function getEvidenciaVersionContext(evidenciaVersionId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getEvidenciaVersionContext, {
    evidenciaVersionId: evidenciaVersionId as Id<'sgcEvidenciaVersiones'>
  }, { token })
}

export async function pasarADocumentacionPendiente(rondaId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.transitionRondaToDocumentacionPendiente, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function cerrarDocumentalmente(rondaId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.transitionRondaToCerrada, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function reabrirRondaSgc(rondaId: string, motivo: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.reabrirRondaSgc, {
    rondaId: rondaId as Id<'rondas'>,
    motivo
  }, { token })
}

export async function listRondasSgcResumen() {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listRondasSgcResumen, {}, { token })
}

export async function listComunicaciones(rondaId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listComunicaciones, {
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
  const token = await sgcToken()
  return fetchMutation(api.sgc.createComunicacion, {
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
  const token = await sgcToken()
  await fetchMutation(api.sgc.updateComunicacion, {
    ...args,
    comunicacionId: args.comunicacionId as Id<'sgcComunicaciones'>
  }, { token })
}

export async function deleteComunicacion(comunicacionId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.deleteComunicacion, {
    comunicacionId: comunicacionId as Id<'sgcComunicaciones'>
  }, { token })
}

export async function listPublicaciones(rondaId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listPublicaciones, {
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
  const token = await sgcToken()
  return fetchMutation(api.sgc.createPublicacion, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>
  }, { token })
}

export async function deletePublicacion(publicacionId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.deletePublicacion, {
    publicacionId: publicacionId as Id<'sgcPublicaciones'>
  }, { token })
}

export async function getHitosVisibleParticipante(rondaId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getHitosVisibleParticipante, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function getEvidenciasPublicas(rondaId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getEvidenciasPublicas, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function listPublicacionesParticipante(rondaId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listPublicaciones, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function createComentarioRonda(rondaId: string, mensaje: string) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.createComentarioRonda, {
    rondaId: rondaId as Id<'rondas'>,
    mensaje
  }, { token })
}

export async function listMisComentariosRonda(rondaId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listMisComentariosRonda, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function responderComentarioRonda(comentarioId: string, respuesta: string, cerrar: boolean) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.responderComentarioRonda, {
    comentarioId: comentarioId as Id<'sgcComentariosRonda'>,
    respuesta,
    cerrar
  }, { token })
}

export async function crearNotificacion(args: {
  rondaId: string
  rondaParticipanteId: string | null
  destinatarioEmail: string
  titulo: string
  mensaje: string
  tipo: 'recordatorio' | 'cronograma' | 'resultado' | 'sgc' | 'otro'
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.crearNotificacion, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>,
    rondaParticipanteId: args.rondaParticipanteId as Id<'rondaParticipantes'> | null
  }, { token })
}

export async function listMisNotificaciones(rondaId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listMisNotificaciones, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function marcarNotificacionLeida(notificacionId: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.marcarNotificacionLeida, {
    notificacionId: notificacionId as Id<'sgcNotificaciones'>
  }, { token })
}

export async function upsertResultadoPtApp(args: {
  rondaId: string
  tipoResultado: 'homogeneidad' | 'estabilidad' | 'estadistico'
  evidenciaSerieId: string
  evidenciaVersionId: string | null
  estado: 'pendiente' | 'cargado' | 'en_revision' | 'aprobado' | 'rechazado'
  observaciones: string | null
  fechaCalculo: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.upsertResultadoPtApp, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>,
    evidenciaSerieId: args.evidenciaSerieId as Id<'sgcEvidenciaSeries'>,
    evidenciaVersionId: args.evidenciaVersionId as Id<'sgcEvidenciaVersiones'> | null
  }, { token })
}

export async function crearCasoSgc(args: {
  rondaId: string
  rondaParticipanteId: string | null
  tipo: 'consulta' | 'desviacion' | 'queja' | 'apelacion' | 'nc_capa' | 'otro'
  severidad: 'baja' | 'media' | 'alta' | 'critica'
  titulo: string
  descripcion: string
  responsable: string
  formatoRelacionado: string | null
  evidenciaSerieId: string | null
  fechaObjetivo: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.crearCasoSgc, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>,
    rondaParticipanteId: args.rondaParticipanteId as Id<'rondaParticipantes'> | null,
    evidenciaSerieId: args.evidenciaSerieId as Id<'sgcEvidenciaSeries'> | null
  }, { token })
}

export async function actualizarCasoSgc(args: {
  casoId: string
  estado: 'abierto' | 'en_revision' | 'esperando_participante' | 'resuelto' | 'cerrado'
  severidad: 'baja' | 'media' | 'alta' | 'critica'
  responsable: string
  fechaObjetivo: string | null
  resolucion: string | null
}) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.actualizarCasoSgc, {
    ...args,
    casoId: args.casoId as Id<'sgcCasos'>
  }, { token })
}
