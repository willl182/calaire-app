'use server'

import { requireAdminAuth } from '@/lib/auth'
import {
  getRequiredPTReplicateCount,
  listPTItems,
  listPTSampleGroups,
  upsertEnvioPT,
} from '@/lib/rondas'

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function parseNumber(formData: FormData, key: string): number | null {
  const raw = parseText(formData, key)
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export async function adminGuardarDatoPTAction(
  _prevState: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdminAuth()

  const rondaId = parseText(formData, 'ronda_id')
  const participanteId = parseText(formData, 'participante_id')
  const ptItemId = parseText(formData, 'pt_item_id')
  const sampleGroupId = parseText(formData, 'sample_group_id')

  if (!rondaId || !participanteId || !ptItemId || !sampleGroupId) {
    return { error: 'Datos incompletos para guardar.' }
  }

  const [items, sampleGroups] = await Promise.all([listPTItems(rondaId), listPTSampleGroups(rondaId)])
  const item = items.find((candidate) => candidate.id === ptItemId)
  if (!item) return { error: 'La corrida PT no pertenece a esta ronda.' }
  if (!sampleGroups.some((group) => group.id === sampleGroupId)) {
    return { error: 'El grupo de muestra no pertenece a esta ronda.' }
  }

  const requiredReplicates = getRequiredPTReplicateCount(item, items)
  const d1 = parseNumber(formData, 'd1')
  const d2 = requiredReplicates === 1 ? null : parseNumber(formData, 'd2')
  const d3 = requiredReplicates === 1 ? null : parseNumber(formData, 'd3')
  const meanValue = parseNumber(formData, 'mean_value')
  const sdValue = parseNumber(formData, 'sd_value')
  const ux = parseNumber(formData, 'ux')
  const uxExp = parseNumber(formData, 'ux_exp')
  const k = parseNumber(formData, 'k') ?? 2

  if (d1 == null) return { error: 'd1 es obligatorio.' }
  if (requiredReplicates === 3 && (d2 == null || d3 == null)) {
    return { error: 'd2 y d3 son obligatorios para este nivel.' }
  }
  if (meanValue == null) return { error: 'El promedio es obligatorio.' }
  if (sdValue == null || sdValue < 0) return { error: 'La desviación estándar debe ser mayor o igual a cero.' }
  if (ux == null || ux < 0) return { error: 'u(x) debe ser mayor o igual a cero.' }
  if (uxExp == null || uxExp < 0) return { error: 'u(x) exp debe ser mayor o igual a cero.' }
  if (k < 0) return { error: 'k debe ser mayor o igual a cero.' }

  try {
    await upsertEnvioPT(
      rondaId,
      participanteId,
      ptItemId,
      sampleGroupId,
      d1,
      d2,
      d3,
      meanValue,
      sdValue,
      ux,
      uxExp,
      k
    )
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible guardar el dato PT.' }
  }
}
