'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createComentarioRonda, marcarNotificacionLeida } from '@/lib/sgc'

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function crearComentarioParticipanteAction(formData: FormData) {
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await createComentarioRonda(rondaId, parseText(formData, 'mensaje'))
    revalidatePath('/mi-dashboard')
    redirect('/mi-dashboard?success=Comentario enviado.')
  } catch (error) {
    redirect(`/mi-dashboard?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible enviar el comentario.')}`)
  }
}

export async function marcarNotificacionLeidaAction(formData: FormData) {
  try {
    await marcarNotificacionLeida(parseText(formData, 'notificacion_id'))
    revalidatePath('/mi-dashboard')
    redirect('/mi-dashboard?success=Notificacion marcada como leida.')
  } catch (error) {
    redirect(`/mi-dashboard?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible actualizar la notificacion.')}`)
  }
}
