'use server'

// Acciones de registros nativos: F-PSEA-06 (plan), F-PSEA-11 y F-PSEA-13 (revisiones).
import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { SGC_PLAN_BLOQUES, type SgcPlanBloques } from '@/server/sgc/catalog'
import { ddMmAaaaAIso } from '../fechas'
import {
  finalizarPlanRonda,
  finalizarRevisionDatos,
  finalizarRevisionHomogeneidad,
  guardarPlanRonda,
  guardarRevisionDatos,
  guardarRevisionHomogeneidad,
} from '@/server/sgc'
import { pageUrl, parseText, parseVolver, redirectWith, requireAdmin } from './comunes'

export async function guardarPlanRondaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const volver = parseVolver(formData)
  try {
    const fechaPlan = ddMmAaaaAIso(parseText(formData, 'fecha_plan'))
    if (fechaPlan === null) throw new Error('Fecha del plan inválida: use dd/mm/aaaa.')
    const bloques: SgcPlanBloques = {}
    for (const { key } of SGC_PLAN_BLOQUES) {
      bloques[key] = parseText(formData, `bloque_${key}`)
    }
    await guardarPlanRonda(
      rondaId,
      bloques,
      {
        responsable: parseText(formData, 'responsable'),
        fecha_plan: fechaPlan,
      },
      parseText(formData, 'motivo_revision') || undefined
    )
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Plan de ronda guardado.', undefined, volver)
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible guardar el plan.', undefined, volver)
  }
}

export async function finalizarPlanRondaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const volver = parseVolver(formData)
  try {
    await finalizarPlanRonda(rondaId)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Registro F-PSEA-06 finalizado.', undefined, volver)
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible finalizar el plan.', undefined, volver)
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
    redirectWith(rondaId, 'success', 'Revision F-PSEA-11 guardada.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible guardar F-PSEA-11.')
  }
}

export async function finalizarRevisionHomogeneidadAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await finalizarRevisionHomogeneidad(rondaId)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'F-PSEA-11 finalizado.')
  } catch (error) {
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible finalizar F-PSEA-11.')
  }
}
