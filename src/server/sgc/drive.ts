// Recursos Drive del expediente (convex/sgc/drive).
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken, withStatus } from '@/server/convex'
import type { SgcPoliticaDocumento } from '../../../convex/_lib/sgc/expediente'

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
  bloqueaCierre?: boolean
  usadoEnRonda?: boolean
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
  // Politica vigente leida del catalogo (no de la copia guardada). Ver convex/_lib/sgc/expediente.ts.
  politica?: SgcPoliticaDocumento
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

export async function getDriveTreeSgc(rondaId: string): Promise<SgcDriveTree> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getDriveTree, {
    rondaId: rondaId as Id<'rondas'>
  }, { token }) as Promise<SgcDriveTree>
}

export async function listDriveRecursosParticipante(rondaId: string): Promise<SgcDriveRecursoParticipante[]> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.listDriveRecursosParticipante, {
    rondaId: rondaId as Id<'rondas'>
  }, { token }) as Promise<SgcDriveRecursoParticipante[]>
}

export const listDriveRecursosParticipanteWithStatus = withStatus('listDriveRecursosParticipante', listDriveRecursosParticipante, [])

export async function inicializarDriveRonda(rondaId: string) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.inicializarDriveRonda, {
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
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.upsertDriveRecurso, {
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
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.reemplazarDriveRecurso, {
    ...args,
    recursoId: args.recursoId as Id<'sgcDriveRecursos'>,
  }, { token })
}

export async function actualizarEstadoDriveRecurso(
  recursoId: string,
  estado: SgcDriveEstado,
  notas: string | null
) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.actualizarEstadoDriveRecurso, {
    recursoId: recursoId as Id<'sgcDriveRecursos'>,
    estado,
    notas
  }, { token })
}

export async function actualizarVisibilidadDriveRecurso(recursoId: string, publicaParticipante: boolean) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.actualizarVisibilidadDriveRecurso, {
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
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.registrarAutomatizacionDrive, {
    rondaId: args.rondaId as Id<'rondas'>,
    evento: args.evento,
    detalle: args.detalle,
    targetId: args.targetId as Id<'sgcDriveRecursos'> | null | undefined,
  }, { token })
}

export async function retirarDriveRecurso(recursoId: string, motivo: string) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.retirarDriveRecurso, {
    recursoId: recursoId as Id<'sgcDriveRecursos'>,
    motivo
  }, { token })
}

export async function marcarDriveRecursoUsado(recursoId: string, usado: boolean) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.marcarDriveRecursoUsado, { recursoId: recursoId as Id<'sgcDriveRecursos'>, usado }, { token })
}
