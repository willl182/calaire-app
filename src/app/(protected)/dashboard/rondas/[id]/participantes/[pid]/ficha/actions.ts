'use server'

import { requireAdminAuth } from '@/server/auth'
import {
  adminReplaceAcompanantes,
  adminReplaceAnalizadores,
  adminReplaceInstrumentos,
  FICHA_SCALAR_ALLOWLIST,
  type FichaScalarField,
  type AcompananteInput,
  type AnalizadorInput,
  type InstrumentoInput,
  adminUpsertFichaScalars,
  generateFichaUploadUrl,
} from '@/server/rondas/fichas'

const MAX_ACOMPANANTE_PDF_SIZE = 10 * 1024 * 1024

async function uploadAcompanantePdf(file: File) {
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('El archivo de seguridad social y ARL debe ser PDF.')
  }
  if (file.size > MAX_ACOMPANANTE_PDF_SIZE) {
    throw new Error('El archivo de seguridad social y ARL no puede superar 10 MB.')
  }

  const uploadUrl = await generateFichaUploadUrl()
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/pdf' },
    body: file,
  })
  if (!response.ok) throw new Error('No fue posible subir el PDF de seguridad social y ARL.')
  const uploaded = await response.json()
  return {
    storageId: uploaded.storageId as string,
    fileName: file.name,
    contentType: file.type || 'application/pdf',
    size: file.size,
  }
}

export async function adminGuardarCampoFichaAction(
  fichaId: string,
  field: string,
  value: string | boolean | null
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdminAuth()

  if (!(FICHA_SCALAR_ALLOWLIST as readonly string[]).includes(field)) {
    return { error: 'Campo no permitido' }
  }

  try {
    await adminUpsertFichaScalars(fichaId, field as FichaScalarField, value)
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al guardar el campo'
    return { error: `No fue posible guardar el campo: ${msg}` }
  }
}

export async function adminGuardarListasAction(
  fichaId: string,
  acompanantes: AcompananteInput[],
  analizadores: AnalizadorInput[],
  instrumentos: InstrumentoInput[]
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdminAuth()

  try {
    await Promise.all([
      adminReplaceAcompanantes(fichaId, acompanantes),
      adminReplaceAnalizadores(fichaId, analizadores),
      adminReplaceInstrumentos(fichaId, instrumentos),
    ])
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar listas' }
  }
}

export async function adminCargarPdfAcompananteAction(
  formData: FormData
): Promise<{
  ok?: boolean
  error?: string
  archivo?: { storageId: string; fileName: string; contentType: string; size: number }
}> {
  await requireAdminAuth()

  const file = formData.get('archivo')
  if (!(file instanceof File) || file.size === 0) return { error: 'Seleccione un PDF.' }

  try {
    return { ok: true, archivo: await uploadAcompanantePdf(file) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible subir el PDF.' }
  }
}
