'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/lib/auth'
import {
  actualizarHitoRonda,
  cerrarDocumentalmente,
  crearHitoRonda,
  finalizarPlanRonda,
  finalizarRevisionDatos,
  getEvidenciaVersionContext,
  getSgcDownloadUrl,
  generateSgcUploadUrl,
  guardarJustificacionSgc,
  guardarPlanRonda,
  guardarRevisionDatos,
  pasarADocumentacionPendiente,
  registrarEvidenciaVersion,
  retirarJustificacionSgc,
  retirarEvidenciaVersion,
  reabrirRondaSgc,
} from '@/lib/sgc'

function pageUrl(rondaId: string) {
  return `/dashboard/rondas/${rondaId}/sgc`
}

function redirectWith(rondaId: string, key: 'success' | 'error', message: string): never {
  redirect(`${pageUrl(rondaId)}?${key}=${encodeURIComponent(message)}`)
}

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function parseHitoEstado(value: string) {
  if (['pendiente', 'en_progreso', 'completado', 'vencido', 'cancelado', 'no_aplica'].includes(value)) {
    return value as 'pendiente' | 'en_progreso' | 'completado' | 'vencido' | 'cancelado' | 'no_aplica'
  }
  return 'pendiente'
}

function parseFormatoJustificable(value: string) {
  if (value === 'F-PSEA-05' || value === 'F-PSEA-05A' || value === 'F-PSEA-12') return value
  throw new Error('Formato no justificable en Fase 1.')
}

async function requireAdmin() {
  const auth = await requireAuth()
  if (!isAdmin(auth)) redirect('/denied?reason=role')
}

async function assertEvidenciaVersionBelongsToRonda(evidenciaVersionId: string, rondaId: string) {
  const version = await getEvidenciaVersionContext(evidenciaVersionId)
  if (!version || String(version.rondaId) !== rondaId) {
    throw new Error('La evidencia no pertenece a esta ronda.')
  }
}

export async function guardarPlanRondaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const bloques: Record<string, string> = {}
    for (const key of 'abcdefghijklmnopqrstu'.split('')) {
      bloques[key] = parseText(formData, `bloque_${key}`)
    }
    await guardarPlanRonda(
      rondaId,
      bloques,
      {
        responsable: parseText(formData, 'responsable'),
        fecha_plan: parseText(formData, 'fecha_plan'),
      },
      parseText(formData, 'motivo_revision') || undefined
    )
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Plan de ronda guardado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible guardar el plan.')
  }
}

export async function finalizarPlanRondaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await finalizarPlanRonda(rondaId)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Plan de ronda finalizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible finalizar el plan.')
  }
}

export async function guardarRevisionDatosAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const keys = String(formData.get('check_keys') ?? '').split(',').filter(Boolean)
    const checks: Record<string, { cumple: boolean; observacion: string | null }> = {}
    for (const key of keys) {
      checks[key] = {
        cumple: formData.get(`check_${key}`) === 'on',
        observacion: parseText(formData, `obs_${key}`) || null,
      }
    }
    await guardarRevisionDatos(rondaId, checks, {})
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Revision F-PSEA-13 guardada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible guardar la revision.')
  }
}

export async function finalizarRevisionDatosAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await finalizarRevisionDatos(rondaId)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'F-PSEA-13 finalizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible finalizar F-PSEA-13.')
  }
}

export async function crearHitoRondaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await crearHitoRonda({
      rondaId,
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      fase: parseText(formData, 'fase') || 'cierre',
      fechaObjetivo: parseText(formData, 'fecha_objetivo') || null,
      fechaReal: null,
      estado: 'pendiente',
      responsable: parseText(formData, 'responsable') || 'Coordinacion SGC',
      visibleParticipante: false,
      bloqueaCierre: formData.get('bloquea_cierre') === 'on',
      formatoRelacionado: parseText(formData, 'formato_relacionado') || null,
      notas: parseText(formData, 'notas') || null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Hito creado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible crear el hito.')
  }
}

export async function actualizarHitoRondaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await actualizarHitoRonda({
      hitoId: parseText(formData, 'hito_id'),
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      fase: parseText(formData, 'fase') || 'cierre',
      fechaObjetivo: parseText(formData, 'fecha_objetivo') || null,
      fechaReal: parseText(formData, 'fecha_real') || null,
      estado: parseHitoEstado(parseText(formData, 'estado')),
      responsable: parseText(formData, 'responsable') || 'Coordinacion SGC',
      visibleParticipante: formData.get('visible_participante') === 'on',
      bloqueaCierre: formData.get('bloquea_cierre') === 'on',
      formatoRelacionado: parseText(formData, 'formato_relacionado') || null,
      notas: parseText(formData, 'notas') || null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Hito actualizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible actualizar el hito.')
  }
}

export async function subirEvidenciaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
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
    redirectWith(rondaId, 'success', 'Evidencia registrada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible registrar la evidencia.')
  }
}

export async function retirarEvidenciaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const evidenciaVersionId = parseText(formData, 'evidencia_version_id')
    await assertEvidenciaVersionBelongsToRonda(evidenciaVersionId, rondaId)
    await retirarEvidenciaVersion(evidenciaVersionId, parseText(formData, 'motivo'))
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Evidencia retirada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible retirar la evidencia.')
  }
}

export async function guardarJustificacionAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await guardarJustificacionSgc(
      rondaId,
      parseFormatoJustificable(parseText(formData, 'formato')),
      parseText(formData, 'alcance') || 'ronda',
      parseText(formData, 'razon')
    )
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Justificacion SGC registrada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible registrar la justificacion.')
  }
}

export async function retirarJustificacionAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await retirarJustificacionSgc(parseText(formData, 'justificacion_id'), parseText(formData, 'motivo'))
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Justificacion SGC retirada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible retirar la justificacion.')
  }
}

export async function descargarEvidenciaAction(formData: FormData) {
  const rondaId = parseText(formData, 'ronda_id')
  await requireAdmin()
  try {
    const evidenciaVersionId = parseText(formData, 'evidencia_version_id')
    await assertEvidenciaVersionBelongsToRonda(evidenciaVersionId, rondaId)
    const url = await getSgcDownloadUrl(evidenciaVersionId)
    if (!url) {
      redirectWith(rondaId, 'error', 'No fue posible generar la URL de descarga.')
    }
    redirect(url)
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible generar la URL de descarga.')
  }
}

export async function transicionSgcAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const accion = parseText(formData, 'accion')
  try {
    if (accion === 'documentacion_pendiente') await pasarADocumentacionPendiente(rondaId)
    else if (accion === 'cerrar') await cerrarDocumentalmente(rondaId)
    else if (accion === 'reabrir') await reabrirRondaSgc(rondaId, parseText(formData, 'motivo'))
    else throw new Error('Accion no soportada.')
    revalidatePath(`/dashboard/rondas/${rondaId}`)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Estado SGC actualizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible actualizar el estado.')
  }
}
