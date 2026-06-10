'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/lib/auth'
import { generateSgcUploadUrl, registrarDocumentoSgcVersion, upsertDocumentoSgc, getDocumentoSgcDownloadUrl, type DocumentoSgc } from '@/lib/sgc'

const pageUrl = '/dashboard/sgc'

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

async function requireAdmin() {
  const auth = await requireAuth()
  if (!isAdmin(auth)) redirect('/denied?reason=role')
}

function redirectWith(key: 'success' | 'error', message: string, docId?: string): never {
  const url = docId 
    ? `${pageUrl}?${key}=${encodeURIComponent(message)}&docId=${encodeURIComponent(docId)}`
    : `${pageUrl}?${key}=${encodeURIComponent(message)}`;
  redirect(url);
}

function parseTipo(value: string): DocumentoSgc['tipo'] {
  if (['formato', 'procedimiento', 'instructivo', 'plantilla', 'registro', 'otro'].includes(value)) {
    return value as DocumentoSgc['tipo']
  }
  return 'otro'
}

function parseEstado(value: string): DocumentoSgc['estado'] {
  if (['borrador', 'vigente', 'obsoleto', 'en_revision'].includes(value)) {
    return value as DocumentoSgc['estado']
  }
  return 'borrador'
}

function parseCriticidad(value: string): DocumentoSgc['criticidad'] {
  if (value === 'baja' || value === 'media' || value === 'alta') return value
  return 'media'
}

export async function guardarDocumentoSgcAction(formData: FormData) {
  await requireAdmin()
  const docIdInput = parseText(formData, 'documento_id') || null
  try {
    const docId = await upsertDocumentoSgc({
      documentoId: docIdInput,
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      proceso: parseText(formData, 'proceso'),
      tipo: parseTipo(parseText(formData, 'tipo')),
      estado: parseEstado(parseText(formData, 'estado')),
      propietario: parseText(formData, 'propietario') || 'Coordinacion SGC',
      criticidad: parseCriticidad(parseText(formData, 'criticidad')),
      retencion: parseText(formData, 'retencion') || null,
      ubicacionFuente: parseText(formData, 'ubicacion_fuente') || null,
      notas: parseText(formData, 'notas') || null,
    })
    revalidatePath(pageUrl)
    redirectWith('success', 'Documento SGC guardado.', docId || docIdInput || undefined)
  } catch (error) {
    redirectWith('error', error instanceof Error ? error.message : 'No fue posible guardar el documento.', docIdInput || undefined)
  }
}

export async function registrarDocumentoVersionAction(formData: FormData) {
  await requireAdmin()
  const documentoId = parseText(formData, 'documento_id')
  try {
    const file = formData.get('archivo')
    let storageId: string | null = null
    let fileName: string | null = null
    let contentType: string | null = null
    let size: number | null = null
    if (file instanceof File && file.size > 0) {
      const uploadUrl = await generateSgcUploadUrl()
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!response.ok) throw new Error('No fue posible subir el archivo de version.')
      const uploaded = await response.json()
      storageId = uploaded.storageId
      fileName = file.name
      contentType = file.type || 'application/octet-stream'
      size = file.size
    }
    await registrarDocumentoSgcVersion({
      documentoId,
      fechaVigencia: parseText(formData, 'fecha_vigencia') || null,
      cambioResumen: parseText(formData, 'cambio_resumen'),
      storageId,
      fileName,
      contentType,
      size,
      hash: null,
    })
    revalidatePath(pageUrl)
    redirectWith('success', 'Version documental registrada.', documentoId)
  } catch (error) {
    redirectWith('error', error instanceof Error ? error.message : 'No fue posible registrar la version.', documentoId)
  }
}


export async function getDocumentoDownloadUrlAction(versionId: string) {
  await requireAdmin()
  try {
    const url = await getDocumentoSgcDownloadUrl(versionId)
    return { url }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible obtener el archivo.' }
  }
}

