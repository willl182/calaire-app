'use server'

// Acciones de comunicación con el participante: publicaciones, comentarios y notificaciones.
import { revalidatePath } from 'next/cache'
import {
  createPublicacion,
  deletePublicacion,
  responderComentarioRonda,
  crearNotificacion,
} from '@/server/sgc'
import { pageUrl, parseText, redirectWith, requireAdmin } from './comunes'

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
