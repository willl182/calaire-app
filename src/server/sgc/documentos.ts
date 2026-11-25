// Documentos SGC de la ronda y matriz documental (convex/sgc/documentos).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'

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

export async function listMatrizDocumentalSgc(): Promise<MatrizDocumentalSgc> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listMatrizDocumentalSgc, {}, { token }) as Promise<MatrizDocumentalSgc>
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
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.upsertDocumentoSgc, {
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
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.registrarDocumentoSgcVersion, {
    ...args,
    documentoId: args.documentoId as Id<'documentosSgc'>,
    storageId: args.storageId as Id<'_storage'> | null
  }, { token })
}

export async function getDocumentoSgcDownloadUrl(documentoId: string, versionId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getDocumentoSgcDownloadUrl, {
    documentoId: documentoId as Id<'documentosSgc'>,
    versionId: versionId as Id<'documentoSgcVersiones'>
  }, { token })
}
