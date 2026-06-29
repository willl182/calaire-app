'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canEditSgcMaestro, requireAuth } from '@/lib/auth'
import { requireHttpUrl } from '@/lib/safe-url'
import {
  crearRegistroSgc,
  generateSgcUploadUrl,
  registrarVersionOficial,
  upsertDocumentoMaestro,
  type DocumentoSgc,
  type DocumentoSgcVersion,
  type RegistroSgc,
} from '@/lib/sgc'

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function parseNullable(formData: FormData, key: string) {
  return parseText(formData, key) || null
}

async function requireSgcEditor() {
  const auth = await requireAuth()
  if (!canEditSgcMaestro(auth)) redirect('/denied?reason=role')
}

function parseFamilia(value: string): NonNullable<DocumentoSgc['familia']> {
  if (value === 'DG' || value === 'P' || value === 'I' || value === 'F' || value === 'OTRO') return value
  return 'OTRO'
}

function parseEstadoDocumento(value: string): DocumentoSgc['estado'] {
  if (value === 'borrador' || value === 'vigente' || value === 'obsoleto' || value === 'en_revision') return value
  return 'borrador'
}

function parseModo(value: string): NonNullable<DocumentoSgc['modoDiligenciamiento']> {
  if (value === 'no_diligenciable' || value === 'solo_archivo' || value === 'ui_nativo' || value === 'ui_nativo_exportable') return value
  return 'no_diligenciable'
}

function parseVisibilidad(value: string): NonNullable<DocumentoSgc['visibilidad']> {
  if (value === 'interna' || value === 'participantes' || value === 'publica') return value
  return 'interna'
}

function parseModoControl(value: string): NonNullable<DocumentoSgc['modoControl']> {
  if (value === 'app_oficial' || value === 'externo_referenciado' || value === 'mixto') return value
  return 'app_oficial'
}

function parseEstadoVersion(value: string): DocumentoSgcVersion['estado'] {
  if (value === 'vigente' || value === 'reemplazada' || value === 'retirada') return value
  return 'vigente'
}

function parseEntidadTipo(value: string): RegistroSgc['entidadTipo'] {
  if (value === 'ronda' || value === 'equipo' || value === 'proveedor' || value === 'auditoria' || value === 'caso' || value === 'transversal') return value
  return 'transversal'
}

function redirectDocument(documentoId: string, key: 'success' | 'error', message: string): never {
  redirect(`/dashboard/sgc/documentos/${documentoId}?${key}=${encodeURIComponent(message)}`)
}

export async function guardarDocumentoMaestroAction(formData: FormData) {
  await requireSgcEditor()
  const documentoId = parseNullable(formData, 'documento_id')
  let id: string
  try {
    id = String(await upsertDocumentoMaestro({
      documentoId,
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      familia: parseFamilia(parseText(formData, 'familia')),
      ambito: parseText(formData, 'ambito') || 'PEA / ISO 17043',
      proceso: parseText(formData, 'proceso') || 'SGC',
      subproceso: parseNullable(formData, 'subproceso'),
      estado: parseEstadoDocumento(parseText(formData, 'estado')),
      modoDiligenciamiento: parseModo(parseText(formData, 'modo_diligenciamiento')),
      visibilidad: parseVisibilidad(parseText(formData, 'visibilidad')),
      modoControl: parseModoControl(parseText(formData, 'modo_control')),
      fuenteEditableUrl: requireHttpUrl(parseNullable(formData, 'fuente_editable_url'), 'La URL editable externa'),
      responsable: parseText(formData, 'responsable') || 'Coordinacion SGC',
      retencion: parseNullable(formData, 'retencion'),
      ubicacionFuente: parseNullable(formData, 'ubicacion_fuente'),
      notas: parseNullable(formData, 'notas'),
    }))
  } catch (error) {
    if (documentoId) redirectDocument(documentoId, 'error', error instanceof Error ? error.message : 'No fue posible guardar el documento.')
    redirect(`/dashboard/sgc/documentos?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible guardar el documento.')}`)
  }
  revalidatePath('/dashboard/sgc/documentos')
  redirectDocument(id, 'success', 'Documento maestro guardado.')
}

export async function registrarVersionOficialAction(formData: FormData) {
  await requireSgcEditor()
  const documentoId = parseText(formData, 'documento_id')
  try {
    if (!documentoId) throw new Error('Selecciona un documento.')
    const file = formData.get('archivo')
    if (!(file instanceof File) || file.size === 0) throw new Error('La version oficial exige archivo.')
    const uploadUrl = await generateSgcUploadUrl()
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!response.ok) throw new Error('No fue posible subir el archivo oficial.')
    const uploaded = await response.json()
    await registrarVersionOficial({
      documentoId,
      version: Number(parseText(formData, 'version')) || null,
      estado: parseEstadoVersion(parseText(formData, 'estado')),
      storageId: uploaded.storageId,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      hash: null,
      resumenCambios: parseText(formData, 'resumen_cambios') || 'Version oficial registrada.',
      elaboradoPor: parseNullable(formData, 'elaborado_por'),
      revisadoPor: parseNullable(formData, 'revisado_por'),
      aprobadoPor: parseNullable(formData, 'aprobado_por'),
      fechaRevision: parseNullable(formData, 'fecha_revision'),
      fechaAprobacion: parseNullable(formData, 'fecha_aprobacion'),
      fechaVigencia: parseNullable(formData, 'fecha_vigencia'),
    })
  } catch (error) {
    if (documentoId) redirectDocument(documentoId, 'error', error instanceof Error ? error.message : 'No fue posible registrar la version oficial.')
    redirect(`/dashboard/sgc/documentos?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible registrar la version oficial.')}`)
  }
  revalidatePath(`/dashboard/sgc/documentos/${documentoId}`)
  redirectDocument(documentoId, 'success', 'Version oficial registrada.')
}

export async function crearRegistroDerivadoAction(formData: FormData) {
  await requireSgcEditor()
  const documentoId = parseText(formData, 'documento_id')
  try {
    if (!documentoId) throw new Error('Selecciona un documento.')
    await crearRegistroSgc({
      documentoId,
      versionBaseId: parseNullable(formData, 'version_base_id'),
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      entidadTipo: parseEntidadTipo(parseText(formData, 'entidad_tipo')),
      rondaId: parseNullable(formData, 'ronda_id'),
      entidadRef: parseNullable(formData, 'entidad_ref'),
      externalSystem: parseText(formData, 'external_system') === 'pt_app' ? 'pt_app' : null,
      externalRef: parseNullable(formData, 'external_ref'),
      externalUrl: requireHttpUrl(parseNullable(formData, 'external_url'), 'La URL externa contextual'),
      externalLabel: parseNullable(formData, 'external_label'),
    })
  } catch (error) {
    if (documentoId) redirectDocument(documentoId, 'error', error instanceof Error ? error.message : 'No fue posible crear el registro derivado.')
    redirect(`/dashboard/sgc/documentos?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible crear el registro derivado.')}`)
  }
  revalidatePath(`/dashboard/sgc/documentos/${documentoId}`)
  redirectDocument(documentoId, 'success', 'Registro derivado creado.')
}
