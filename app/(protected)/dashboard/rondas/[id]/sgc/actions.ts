'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/lib/auth'
import { SGC_PLAN_BLOQUES, type SgcPlanBloques } from '@/lib/sgc/catalog'
import {
  actualizarHitoRonda,
  actualizarCasoSgc,
  cerrarDocumentalmente,
  crearCasoSgc,
  crearHitoRonda,
  createPublicacion,
  deletePublicacion,
  finalizarPlanRonda,
  finalizarRevisionDatos,
  finalizarRevisionHomogeneidad,
  getEvidenciaVersionContext,
  getSgcDownloadUrl,
  generateSgcUploadUrl,
  guardarJustificacionSgc,
  guardarPlanRonda,
  guardarRevisionDatos,
  guardarRevisionHomogeneidad,
  pasarADocumentacionPendiente,
  registrarEvidenciaVersion,
  retirarJustificacionSgc,
  retirarEvidenciaVersion,
  reabrirRondaSgc,
  responderComentarioRonda,
  upsertResultadoPtApp,
  crearNotificacion,
} from '@/lib/sgc'

function pageUrl(rondaId: string) {
  return `/dashboard/rondas/${rondaId}/sgc`
}

function redirectWith(rondaId: string, key: 'success' | 'error', message: string, formatoFocus?: string): never {
  const params = new URLSearchParams({ [key]: message })
  if (formatoFocus) params.set('formato', formatoFocus)
  redirect(`${pageUrl(rondaId)}?${params.toString()}`)
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

function parseCasoTipo(value: string) {
  if (['consulta', 'desviacion', 'queja', 'apelacion', 'nc_capa', 'otro'].includes(value)) {
    return value as 'consulta' | 'desviacion' | 'queja' | 'apelacion' | 'nc_capa' | 'otro'
  }
  return 'otro'
}

function parseCasoSeveridad(value: string) {
  if (['baja', 'media', 'alta', 'critica'].includes(value)) {
    return value as 'baja' | 'media' | 'alta' | 'critica'
  }
  return 'media'
}

function parseCasoEstado(value: string) {
  if (['abierto', 'en_revision', 'esperando_participante', 'resuelto', 'cerrado'].includes(value)) {
    return value as 'abierto' | 'en_revision' | 'esperando_participante' | 'resuelto' | 'cerrado'
  }
  return 'abierto'
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
    const bloques: SgcPlanBloques = {}
    for (const { key } of SGC_PLAN_BLOQUES) {
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

export async function guardarRevisionHomogeneidadAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const keys = String(formData.get('homogeneidad_check_keys') ?? '').split(',').filter(Boolean)
    const checks: Record<string, { cumple: boolean; observacion: string | null }> = {}
    for (const key of keys) {
      checks[key] = {
        cumple: formData.get(`homogeneidad_check_${key}`) === 'on',
        observacion: parseText(formData, `homogeneidad_obs_${key}`) || null,
      }
    }
    await guardarRevisionHomogeneidad(rondaId, checks, {}, parseText(formData, 'homogeneidad_conclusiones') || null)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Revision F-PSEA-08 guardada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible guardar F-PSEA-08.')
  }
}

export async function finalizarRevisionHomogeneidadAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await finalizarRevisionHomogeneidad(rondaId)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'F-PSEA-08 finalizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible finalizar F-PSEA-08.')
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

export async function crearPublicacionAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const visibleDesde = parseText(formData, 'visible_desde')
    const visibleHasta = parseText(formData, 'visible_hasta')
    await createPublicacion({
      rondaId,
      titulo: parseText(formData, 'titulo'),
      contenido: parseText(formData, 'contenido'),
      tipo: parseText(formData, 'tipo') as 'resultado' | 'comunicado' | 'cronograma' | 'evidencia',
      visibleDesde: visibleDesde ? new Date(visibleDesde).getTime() : Date.now(),
      visibleHasta: visibleHasta ? new Date(visibleHasta).getTime() : null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Publicacion creada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible crear la publicacion.')
  }
}

export async function eliminarPublicacionAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await deletePublicacion(parseText(formData, 'publicacion_id'))
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Publicacion eliminada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible eliminar la publicacion.')
  }
}

export async function responderComentarioAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await responderComentarioRonda(
      parseText(formData, 'comentario_id'),
      parseText(formData, 'respuesta'),
      formData.get('cerrar') === 'on'
    )
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Comentario respondido.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible responder el comentario.')
  }
}

export async function crearNotificacionAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const tipo = parseText(formData, 'tipo')
    await crearNotificacion({
      rondaId,
      rondaParticipanteId: parseText(formData, 'ronda_participante_id') || null,
      destinatarioEmail: parseText(formData, 'destinatario_email'),
      titulo: parseText(formData, 'titulo'),
      mensaje: parseText(formData, 'mensaje'),
      tipo: ['recordatorio', 'cronograma', 'resultado', 'sgc', 'otro'].includes(tipo)
        ? tipo as 'recordatorio' | 'cronograma' | 'resultado' | 'sgc' | 'otro'
        : 'sgc',
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Notificacion publicada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible crear la notificacion.')
  }
}

export async function guardarResultadoPtAppAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const tipoResultado = parseText(formData, 'tipo_resultado')
    const estado = parseText(formData, 'estado')
    await upsertResultadoPtApp({
      rondaId,
      tipoResultado: ['homogeneidad', 'estabilidad', 'estadistico'].includes(tipoResultado)
        ? tipoResultado as 'homogeneidad' | 'estabilidad' | 'estadistico'
        : 'estadistico',
      evidenciaSerieId: parseText(formData, 'serie_id'),
      evidenciaVersionId: parseText(formData, 'version_id') || null,
      estado: ['pendiente', 'cargado', 'en_revision', 'aprobado', 'rechazado'].includes(estado)
        ? estado as 'pendiente' | 'cargado' | 'en_revision' | 'aprobado' | 'rechazado'
        : 'pendiente',
      observaciones: parseText(formData, 'observaciones') || null,
      fechaCalculo: parseText(formData, 'fecha_calculo') || null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Resultado pt_app actualizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible actualizar el resultado pt_app.')
  }
}

export async function crearCasoSgcAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await crearCasoSgc({
      rondaId,
      rondaParticipanteId: parseText(formData, 'ronda_participante_id') || null,
      tipo: parseCasoTipo(parseText(formData, 'tipo')),
      severidad: parseCasoSeveridad(parseText(formData, 'severidad')),
      titulo: parseText(formData, 'titulo'),
      descripcion: parseText(formData, 'descripcion'),
      responsable: parseText(formData, 'responsable') || 'Coordinacion SGC',
      formatoRelacionado: parseText(formData, 'formato_relacionado') || null,
      evidenciaSerieId: parseText(formData, 'evidencia_serie_id') || null,
      fechaObjetivo: parseText(formData, 'fecha_objetivo') || null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Caso SGC creado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible crear el caso SGC.')
  }
}

export async function actualizarCasoSgcAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await actualizarCasoSgc({
      casoId: parseText(formData, 'caso_id'),
      estado: parseCasoEstado(parseText(formData, 'estado')),
      severidad: parseCasoSeveridad(parseText(formData, 'severidad')),
      responsable: parseText(formData, 'responsable') || 'Coordinacion SGC',
      fechaObjetivo: parseText(formData, 'fecha_objetivo') || null,
      resolucion: parseText(formData, 'resolucion') || null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Caso SGC actualizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible actualizar el caso SGC.')
  }
}
