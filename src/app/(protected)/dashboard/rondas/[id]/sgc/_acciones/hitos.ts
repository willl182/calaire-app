'use server'

// Acciones de hitos de la ronda.
import { revalidatePath } from 'next/cache'
import { actualizarHitoRonda, crearHitoRonda } from '@/server/sgc'
import { pageUrl, parseHitoEstado, parseText, redirectWith, requireAdmin } from './comunes'

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
