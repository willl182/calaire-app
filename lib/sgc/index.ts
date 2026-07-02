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
  checklistBloqueantesCierre: string[]
  checklistBloqueantesDocumentacionPendiente: string[]
  driveCierre: {
    totalDocumentos: number
    recursosDocumentales: number
    bloqueantes: string[]
    advertencias: string[]
  }
}

export type DocumentoSgc = {
  _id: string
  codigo: string
  nombre: string
  familia?: 'DG' | 'P' | 'I' | 'F' | 'OTRO'
  ambito?: string | null
  proceso: string
  subproceso?: string | null
  tipo: 'formato' | 'procedimiento' | 'instructivo' | 'plantilla' | 'registro' | 'otro'
  estado: 'borrador' | 'vigente' | 'obsoleto' | 'en_revision'
  modoDiligenciamiento?: 'no_diligenciable' | 'solo_archivo' | 'ui_nativo' | 'ui_nativo_exportable'
  visibilidad?: 'interna' | 'participantes' | 'publica'
  modoControl?: 'app_oficial' | 'externo_referenciado' | 'mixto'
  fuenteEditableUrl?: string | null
  versionVigenteId?: string | null
  responsable?: string | null
  propietario: string
  criticidad: 'baja' | 'media' | 'alta'
  retencion?: string | null
  ubicacionFuente?: string | null
  origenFuente?: string | null
  externalSystem?: 'pt_app' | null
  externalRef?: string | null
  externalUrl?: string | null
  externalLabel?: string | null
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
  resumenCambios?: string | null
  fileName?: string | null
  contentType?: string | null
  size?: number | null
  elaboradoPor?: string | null
  revisadoPor?: string | null
  aprobadoPor?: string | null
  fechaRevision?: string | null
  fechaAprobacion?: string | null
  createdAt: number
  createdBy: string
}

export type RegistroSgc = {
  _id: string
  documentoId: string
  versionBaseId?: string | null
  codigo: string
  nombre: string
  estado: 'borrador' | 'vigente' | 'cerrado' | 'anulado'
  entidadTipo: 'ronda' | 'equipo' | 'proveedor' | 'auditoria' | 'caso' | 'transversal'
  rondaId?: string | null
  entidadRef?: string | null
  externalSystem?: 'pt_app' | null
  externalRef?: string | null
  externalUrl?: string | null
  externalLabel?: string | null
  updatedAt: number
  updatedBy: string
}

export type RequisitoNormativo = {
  _id: string
  norma: string
  versionNorma: string
  clausula: string
  titulo: string
  descripcion: string
  ambito: string
  criticidad: 'baja' | 'media' | 'alta' | 'pendiente'
  estado: 'activo' | 'placeholder' | 'retirado'
  origenFuente?: string | null
}

export type DocumentoRequisito = {
  _id: string
  documentoId: string
  requisitoId: string
  tipoCobertura: 'cubre' | 'apoya' | 'evidencia' | 'no_aplica_justificado'
  estadoCobertura: 'cubierto' | 'parcial' | 'pendiente' | 'no_aplica'
  responsable?: string | null
  observacion?: string | null
  fechaRevision?: string | null
}

export type SgcMaestroList = {
  documentos: DocumentoSgc[]
  versiones: Array<{
    documentoId: string
    vigente: DocumentoSgcVersion | null
    registros: number
    coberturas: number
  }>
  ambitos: string[]
  familias: Array<NonNullable<DocumentoSgc['familia']>>
  resumen: {
    total: number
    vigentes: number
    enRevision: number
    sinVersion: number
  }
}

export type DocumentoMaestroDetalle = {
  documento: DocumentoSgc
  versiones: DocumentoSgcVersion[]
  versionVigente: DocumentoSgcVersion | null
  registros: RegistroSgc[]
  requisitos: Array<{
    relacion: DocumentoRequisito
    requisito: RequisitoNormativo
  }>
} | null

export type NormativaSgc = {
  normas: string[]
  rows: Array<{
    requisito: RequisitoNormativo
    relaciones: DocumentoRequisito[]
    documentos: DocumentoSgc[]
  }>
  pagination: {
    page: number
    pageSize: number
    totalRows: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  resumen: {
    requisitos: number
    cubiertos: number
    parciales: number
    pendientes: number
  }
}

export type MapaSgc = {
  relaciones: Array<{
    _id: string
    bloque: string
    rutaCritica?: string | null
    origenCodigo: string
    destinoCodigo?: string | null
    documentoOrigenId?: string | null
    documentoDestinoId?: string | null
    tipoRelacion: 'define' | 'usa' | 'genera' | 'evidencia' | 'referencia' | 'externo'
    ambito: string
    destinoTipo: 'documento' | 'requisito' | 'registro' | 'gestion' | 'externo' | 'pendiente'
    externalSystem?: 'pt_app' | null
    externalUrl?: string | null
    estadoResolucion: 'resuelto' | 'pendiente'
  }>
  documentos: DocumentoSgc[]
  bloques: string[]
  ambitos: string[]
  pendientes: number
}

export type ExpedienteSgcResumen = {
  ronda: {
    _id: string
    codigo: string
    nombre: string
    estado: string
  }
  progreso: number
  registros: number
  evidenciasVigentes: number
  faltantesCriticos: string[]
  externalRefs: Array<{ label: string; url?: string | null }>
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

export type SgcDriveTipo = 'carpeta' | 'documento' | 'hoja_calculo' | 'pdf' | 'archivo' | 'enlace'
export type SgcDriveEstado = 'pendiente' | 'creado' | 'diligenciado' | 'reemplazado' | 'retirado' | 'no_aplica'

export type SgcDriveDefinitivoEnlace = {
  driveFileId?: string | null
  webUrl: string
  tipo?: string | null
}
export type SgcDriveDefinitivoArchivo = {
  storageId: string
  fileName?: string | null
  contentType?: string | null
  size?: number | null
  tipo?: string | null
}
export type SgcDriveDefinitivo = SgcDriveDefinitivoEnlace | SgcDriveDefinitivoArchivo

export type SgcDriveRecurso = {
  _id: string
  _creationTime: number
  rondaId: string
  parentId?: string | null
  proveedor: 'google_drive'
  tipo: SgcDriveTipo
  codigo: string
  nombre: string
  fase?: string | null
  formatoRelacionado?: string | null
  documentoSgcId?: string | null
  documentoSgcVersionId?: string | null
  evidenciaSerieId?: string | null
  critico?: boolean
  publicaParticipante?: boolean
  driveFileId?: string | null
  driveFolderId?: string | null
  webUrl?: string | null
  templateUrl?: string | null
  definitivo?: SgcDriveDefinitivo | null
  estado: SgcDriveEstado
  notas?: string | null
  createdAt: number
  createdBy: string
  updatedAt: number
  updatedBy: string
}

export type SgcDriveTree = {
  root: SgcDriveRecurso | null
  recursos: SgcDriveRecurso[]
}

export type SgcDriveRecursoParticipante = Pick<
  SgcDriveRecurso,
  '_id' | 'codigo' | 'nombre' | 'tipo' | 'fase' | 'formatoRelacionado' | 'webUrl' | 'updatedAt'
> & {
  // Al participante el definitivo siempre llega como enlace visualizable (URL de descarga
  // firmada si el registro fue cargado como archivo en la app).
  definitivo?: SgcDriveDefinitivoEnlace | null
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
    bloqueantes: raw.checklistBloqueantesCierre ?? derivarBloqueantes(checklist),
    checklistBloqueantesCierre: raw.checklistBloqueantesCierre ?? derivarBloqueantes(checklist),
    checklistBloqueantesDocumentacionPendiente: raw.checklistBloqueantesDocumentacionPendiente ?? [],
    driveCierre: raw.driveCierre ?? {
      totalDocumentos: 0,
      recursosDocumentales: 0,
      bloqueantes: [],
      advertencias: [],
    },
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

export async function getDriveTreeSgc(rondaId: string): Promise<SgcDriveTree> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getDriveTree, {
    rondaId: rondaId as Id<'rondas'>
  }, { token }) as Promise<SgcDriveTree>
}

export async function listDriveRecursosParticipante(rondaId: string): Promise<SgcDriveRecursoParticipante[]> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listDriveRecursosParticipante, {
    rondaId: rondaId as Id<'rondas'>
  }, { token }) as Promise<SgcDriveRecursoParticipante[]>
}

export async function inicializarDriveRonda(rondaId: string) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.inicializarDriveRonda, {
    rondaId: rondaId as Id<'rondas'>
  }, { token })
}

export async function upsertDriveRecurso(args: {
  recursoId?: string | null
  rondaId: string
  parentId?: string | null
  codigo: string
  nombre: string
  fase?: string | null
  tipo: SgcDriveTipo
  formatoRelacionado?: string | null
  webUrl?: string | null
  templateUrl?: string | null
  notas?: string | null
  definitivo?: SgcDriveRecurso['definitivo']
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.upsertDriveRecurso, {
    ...args,
    recursoId: args.recursoId as Id<'sgcDriveRecursos'> | null | undefined,
    rondaId: args.rondaId as Id<'rondas'>,
    parentId: args.parentId as Id<'sgcDriveRecursos'> | null | undefined,
    definitivo: args.definitivo as
      | SgcDriveDefinitivoEnlace
      | (Omit<SgcDriveDefinitivoArchivo, 'storageId'> & { storageId: Id<'_storage'> })
      | null
      | undefined,
  }, { token })
}

export async function reemplazarDriveRecurso(args: {
  recursoId: string
  webUrl: string
  motivo: string
  tipo?: SgcDriveTipo
}) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.reemplazarDriveRecurso, {
    ...args,
    recursoId: args.recursoId as Id<'sgcDriveRecursos'>,
  }, { token })
}

export async function actualizarEstadoDriveRecurso(
  recursoId: string,
  estado: SgcDriveEstado,
  notas: string | null
) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.actualizarEstadoDriveRecurso, {
    recursoId: recursoId as Id<'sgcDriveRecursos'>,
    estado,
    notas
  }, { token })
}

export async function actualizarVisibilidadDriveRecurso(recursoId: string, publicaParticipante: boolean) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.actualizarVisibilidadDriveRecurso, {
    recursoId: recursoId as Id<'sgcDriveRecursos'>,
    publicaParticipante
  }, { token })
}

export async function registrarAutomatizacionDrive(args: {
  rondaId: string
  evento: 'sgc.drive.google_api_completado' | 'sgc.drive.google_api_parcial' | 'sgc.drive.google_api_fallo'
  detalle: string
  targetId?: string | null
}) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.registrarAutomatizacionDrive, {
    rondaId: args.rondaId as Id<'rondas'>,
    evento: args.evento,
    detalle: args.detalle,
    targetId: args.targetId as Id<'sgcDriveRecursos'> | null | undefined,
  }, { token })
}

export async function retirarDriveRecurso(recursoId: string, motivo: string) {
  const token = await sgcToken()
  await fetchMutation(api.sgc.retirarDriveRecurso, {
    recursoId: recursoId as Id<'sgcDriveRecursos'>,
    motivo
  }, { token })
}

export async function listMatrizDocumentalSgc(): Promise<MatrizDocumentalSgc> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listMatrizDocumentalSgc, {}, { token }) as Promise<MatrizDocumentalSgc>
}

export async function listSgcMaestro(filters: {
  ambito?: string | null
  familia?: DocumentoSgc['familia'] | null
  estado?: DocumentoSgc['estado'] | null
  modoDiligenciamiento?: DocumentoSgc['modoDiligenciamiento'] | null
  texto?: string | null
} = {}): Promise<SgcMaestroList> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listSgcMaestro, filters, { token }) as Promise<SgcMaestroList>
}

export async function getDocumentoMaestro(documentoId: string): Promise<DocumentoMaestroDetalle> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getDocumentoMaestro, {
    documentoId: documentoId as Id<'documentosSgc'>,
  }, { token }) as Promise<DocumentoMaestroDetalle>
}

export async function listNormativaSgc(filters: {
  norma?: string | null
  estadoCobertura?: DocumentoRequisito['estadoCobertura'] | null
  page?: number
  pageSize?: number
} = {}): Promise<NormativaSgc> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listNormativaSgc, filters, { token }) as Promise<NormativaSgc>
}

export async function listMapaSgc(filters: { ambito?: string | null } = {}): Promise<MapaSgc> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listMapaSgc, filters, { token }) as Promise<MapaSgc>
}

export async function listExpedientesSgc(): Promise<ExpedienteSgcResumen[]> {
  const token = await sgcToken()
  return fetchQuery(api.sgc.listExpedientesSgc, {}, { token }) as Promise<ExpedienteSgcResumen[]>
}

export async function upsertDocumentoMaestro(args: {
  documentoId: string | null
  codigo: string
  nombre: string
  familia: NonNullable<DocumentoSgc['familia']>
  ambito: string
  proceso: string
  subproceso: string | null
  estado: DocumentoSgc['estado']
  modoDiligenciamiento: NonNullable<DocumentoSgc['modoDiligenciamiento']>
  visibilidad: NonNullable<DocumentoSgc['visibilidad']>
  modoControl: NonNullable<DocumentoSgc['modoControl']>
  fuenteEditableUrl: string | null
  responsable: string
  retencion: string | null
  ubicacionFuente: string | null
  notas: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.upsertDocumentoMaestro, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'> | null,
  }, { token })
}

export async function registrarVersionOficial(args: {
  documentoId: string
  version: number | null
  estado: DocumentoSgcVersion['estado']
  storageId: string
  fileName: string
  contentType: string
  size: number
  hash: string | null
  resumenCambios: string
  elaboradoPor: string | null
  revisadoPor: string | null
  aprobadoPor: string | null
  fechaRevision: string | null
  fechaAprobacion: string | null
  fechaVigencia: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.registrarVersionOficial, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'>,
    storageId: args.storageId as Id<'_storage'>,
  }, { token })
}

export async function crearRegistroSgc(args: {
  documentoId: string
  versionBaseId: string | null
  codigo: string
  nombre: string
  entidadTipo: RegistroSgc['entidadTipo']
  rondaId: string | null
  entidadRef: string | null
  externalSystem?: 'pt_app' | null
  externalRef?: string | null
  externalUrl?: string | null
  externalLabel?: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.crearRegistroSgc, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'>,
    versionBaseId: args.versionBaseId as Id<'documentoSgcVersiones'> | null,
    rondaId: args.rondaId as Id<'rondas'> | null,
  }, { token })
}

export async function upsertDocumentoRequisito(args: {
  documentoId: string
  requisitoId: string
  tipoCobertura: DocumentoRequisito['tipoCobertura']
  estadoCobertura: DocumentoRequisito['estadoCobertura']
  responsable: string | null
  observacion: string | null
  fechaRevision: string | null
}) {
  const token = await sgcToken()
  return fetchMutation(api.sgc.upsertDocumentoRequisito, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'>,
    requisitoId: args.requisitoId as Id<'requisitosNormativos'>,
  }, { token })
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
  resumenCambios: string
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

export async function getDocumentoSgcDownloadUrl(documentoId: string, versionId: string) {
  const token = await sgcToken()
  return fetchQuery(api.sgc.getDocumentoSgcDownloadUrl, {
    documentoId: documentoId as Id<'documentosSgc'>,
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
