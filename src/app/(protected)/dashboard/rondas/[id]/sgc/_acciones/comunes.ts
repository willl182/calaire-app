// Utilidades comunes de las acciones SGC (sin 'use server': no son acciones expuestas).
import { redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/server/auth'
import { limpiarMensajeError } from '../mensajes'
import { getEvidenciaVersionContext, type SgcDriveEstado, type SgcDriveTipo } from '@/server/sgc'

export function pageUrl(rondaId: string) {
  return `/dashboard/rondas/${rondaId}/sgc`
}

export function redirectWith(rondaId: string, key: 'success' | 'error', message: string, formatoFocus?: string, subpagina?: string): never {
  const params = new URLSearchParams({ [key]: key === 'error' ? limpiarMensajeError(message) : message })
  if (formatoFocus) params.set('formato', formatoFocus)
  redirect(`${pageUrl(rondaId)}${subpagina ? `/${subpagina}` : ''}?${params.toString()}`)
}

/** Subpágina de retorno permitida (p. ej. el registro F-PSEA-06 a pantalla completa). */
export function parseVolver(formData: FormData) {
  return parseText(formData, 'volver') === 'f-psea-06' ? 'f-psea-06' : undefined
}

export function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export function parseHitoEstado(value: string) {
  if (['pendiente', 'en_progreso', 'completado', 'vencido', 'cancelado', 'no_aplica'].includes(value)) {
    return value as 'pendiente' | 'en_progreso' | 'completado' | 'vencido' | 'cancelado' | 'no_aplica'
  }
  return 'pendiente'
}

export function parseFormatoJustificable(value: string) {
  if (value === 'F-PSEA-05' || value === 'F-PSEA-05A' || value === 'F-PSEA-12' || value === 'F-PSEA-14') return value
  throw new Error('Formato no justificable en Fase 1.')
}

export function parseCasoTipo(value: string) {
  if (['consulta', 'desviacion', 'queja', 'apelacion', 'nc_capa', 'otro'].includes(value)) {
    return value as 'consulta' | 'desviacion' | 'queja' | 'apelacion' | 'nc_capa' | 'otro'
  }
  return 'otro'
}

export function parseCasoSeveridad(value: string) {
  if (['baja', 'media', 'alta', 'critica'].includes(value)) {
    return value as 'baja' | 'media' | 'alta' | 'critica'
  }
  return 'media'
}

export function parseCasoEstado(value: string) {
  if (['abierto', 'en_revision', 'esperando_participante', 'resuelto', 'cerrado'].includes(value)) {
    return value as 'abierto' | 'en_revision' | 'esperando_participante' | 'resuelto' | 'cerrado'
  }
  return 'abierto'
}

export function parseDriveTipo(value: string): SgcDriveTipo {
  if (['carpeta', 'documento', 'hoja_calculo', 'pdf', 'archivo', 'enlace'].includes(value)) return value as SgcDriveTipo
  return 'documento'
}

export function parseDriveEstado(value: string): SgcDriveEstado {
  if (['pendiente', 'creado', 'diligenciado', 'reemplazado', 'retirado', 'no_aplica'].includes(value)) return value as SgcDriveEstado
  return 'pendiente'
}

export async function requireAdmin() {
  const auth = await requireAuth()
  if (!isAdmin(auth)) redirect('/denied?reason=role')
}

export async function assertEvidenciaVersionBelongsToRonda(evidenciaVersionId: string, rondaId: string) {
  const version = await getEvidenciaVersionContext(evidenciaVersionId)
  if (!version || String(version.rondaId) !== rondaId) {
    throw new Error('La evidencia no pertenece a esta ronda.')
  }
}
