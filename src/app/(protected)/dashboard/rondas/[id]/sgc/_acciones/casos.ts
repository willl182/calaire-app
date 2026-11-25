'use server'

// Acciones de resultados PT en la app y casos SGC.
import { revalidatePath } from 'next/cache'
import { actualizarCasoSgc, crearCasoSgc, upsertResultadoPtApp } from '@/server/sgc'
import { pageUrl, parseCasoEstado, parseCasoSeveridad, parseCasoTipo, parseText, redirectWith, requireAdmin } from './comunes'

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
