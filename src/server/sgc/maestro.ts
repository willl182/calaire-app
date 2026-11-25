// Listado maestro, normativa y mapa documental (convex/sgc/maestro).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken, withStatus } from '@/server/convex'
import type { DocumentoSgc, DocumentoSgcVersion } from './documentos'

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

export async function listSgcMaestro(filters: {
  ambito?: string | null
  familia?: DocumentoSgc['familia'] | null
  estado?: DocumentoSgc['estado'] | null
  modoDiligenciamiento?: DocumentoSgc['modoDiligenciamiento'] | null
  texto?: string | null
} = {}): Promise<SgcMaestroList> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listSgcMaestro, filters, { token }) as Promise<SgcMaestroList>
}

export const listSgcMaestroWithStatus = withStatus('listSgcMaestro', listSgcMaestro, { documentos: [], versiones: [], ambitos: [], familias: [], resumen: { total: 0, vigentes: 0, enRevision: 0, sinVersion: 0 } } satisfies SgcMaestroList)

export async function getDocumentoMaestro(documentoId: string): Promise<DocumentoMaestroDetalle> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getDocumentoMaestro, {
    documentoId: documentoId as Id<'documentosSgc'>,
  }, { token }) as Promise<DocumentoMaestroDetalle>
}

export async function listNormativaSgc(filters: {
  norma?: string | null
  estadoCobertura?: DocumentoRequisito['estadoCobertura'] | null
  page?: number
  pageSize?: number
} = {}): Promise<NormativaSgc> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listNormativaSgc, filters, { token }) as Promise<NormativaSgc>
}

export const listNormativaSgcWithStatus = withStatus('listNormativaSgc', listNormativaSgc, {
  normas: [],
  rows: [],
  pagination: { page: 1, pageSize: 0, totalRows: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
  resumen: { requisitos: 0, cubiertos: 0, parciales: 0, pendientes: 0 },
} satisfies NormativaSgc)

export async function listMapaSgc(filters: { ambito?: string | null } = {}): Promise<MapaSgc> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listMapaSgc, filters, { token }) as Promise<MapaSgc>
}

export const listMapaSgcWithStatus = withStatus('listMapaSgc', listMapaSgc, { relaciones: [], documentos: [], bloques: [], ambitos: [], pendientes: 0 } satisfies MapaSgc)

export async function listExpedientesSgc(): Promise<ExpedienteSgcResumen[]> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listExpedientesSgc, {}, { token }) as Promise<ExpedienteSgcResumen[]>
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
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.upsertDocumentoMaestro, {
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
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.registrarVersionOficial, {
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
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.crearRegistroSgc, {
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
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.upsertDocumentoRequisito, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'>,
    requisitoId: args.requisitoId as Id<'requisitosNormativos'>,
  }, { token })
}
