'use server'

// Acciones de evidencias y justificaciones.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  getSgcDownloadUrl,
  generateSgcUploadUrl,
  guardarJustificacionSgc,
  registrarEvidenciaVersion,
  retirarJustificacionSgc,
  retirarEvidenciaVersion,
} from '@/server/sgc'
import { assertEvidenciaVersionBelongsToRonda, pageUrl, parseFormatoJustificable, parseText, redirectWith, requireAdmin } from './comunes'

export async function subirEvidenciaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const formatoFocus = parseText(formData, 'formato_focus')
  try {
    const serieId = parseText(formData, 'serie_id')
    const file = formData.get('archivo')
    if (!(file instanceof File) || file.size === 0) throw new Error('Seleccione un archivo.')
    const uploadUrl = await generateSgcUploadUrl()
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!response.ok) throw new Error('No fue posible subir el archivo.')
    const { storageId } = await response.json()
    await registrarEvidenciaVersion({
      serieId,
      storageId,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      hash: null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Evidencia registrada.', formatoFocus)
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible registrar la evidencia.', formatoFocus)
  }
}

export async function retirarEvidenciaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const formatoFocus = parseText(formData, 'formato_focus')
  try {
    const evidenciaVersionId = parseText(formData, 'evidencia_version_id')
    await assertEvidenciaVersionBelongsToRonda(evidenciaVersionId, rondaId)
    await retirarEvidenciaVersion(evidenciaVersionId, parseText(formData, 'motivo'))
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Evidencia retirada.', formatoFocus)
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible retirar la evidencia.', formatoFocus)
  }
}

export async function guardarJustificacionAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const formatoFocus = parseText(formData, 'formato_focus')
  try {
    await guardarJustificacionSgc(
      rondaId,
      parseFormatoJustificable(parseText(formData, 'formato')),
      parseText(formData, 'alcance') || 'ronda',
      parseText(formData, 'razon')
    )
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Justificacion SGC registrada.', formatoFocus)
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible registrar la justificacion.', formatoFocus)
  }
}

export async function retirarJustificacionAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const formatoFocus = parseText(formData, 'formato_focus')
  try {
    await retirarJustificacionSgc(parseText(formData, 'justificacion_id'), parseText(formData, 'motivo'))
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Justificacion SGC retirada.', formatoFocus)
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible retirar la justificacion.', formatoFocus)
  }
}

export async function descargarEvidenciaAction(formData: FormData) {
  const rondaId = parseText(formData, 'ronda_id')
  const formatoFocus = parseText(formData, 'formato_focus')
  await requireAdmin()
  let url: string | null = null
  try {
    const evidenciaVersionId = parseText(formData, 'evidencia_version_id')
    await assertEvidenciaVersionBelongsToRonda(evidenciaVersionId, rondaId)
    url = await getSgcDownloadUrl(evidenciaVersionId)
    if (!url) {
      redirectWith(rondaId, 'error', 'No fue posible generar la URL de descarga.', formatoFocus)
    }
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible generar la URL de descarga.', formatoFocus)
  }
  redirect(url)
}
