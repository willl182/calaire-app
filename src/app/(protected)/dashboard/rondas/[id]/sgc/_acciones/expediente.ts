'use server'

// Acciones del expediente guiado: sincronizar, aplicabilidad, aprobación y transiciones.
import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import {
  cerrarDocumentalmente,
  pasarADocumentacionPendiente,
  reabrirRondaSgc,
  actualizarExpedienteSgc,
  aprobarDocumentoExpedienteSgc,
  marcarAplicaDocumentoSgc,
} from '@/server/sgc'
import { pageUrl, parseText, redirectWith, requireAdmin } from './comunes'

export async function actualizarExpedienteAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await actualizarExpedienteSgc(rondaId)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Expediente actualizado con los documentos nuevos del catálogo.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible actualizar el expediente.')
  }
}

export async function marcarAplicaDocumentoAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const codigo = parseText(formData, 'codigo')
  const aplica = parseText(formData, 'aplica') === 'true'
  try {
    await marcarAplicaDocumentoSgc(rondaId, codigo, aplica)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', aplica ? `${codigo} marcado como "aplica".` : `${codigo} marcado como "no aplica".`)
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible cambiar la aplicabilidad.')
  }
}

export async function aprobarDocumentoExpedienteAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const codigo = parseText(formData, 'codigo')
  const aprobado = parseText(formData, 'aprobado') !== 'false'
  try {
    await aprobarDocumentoExpedienteSgc(rondaId, codigo, aprobado)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', aprobado ? `${codigo} aprobado por el coordinador.` : `Aprobación de ${codigo} retirada.`)
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible registrar la aprobación.')
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
