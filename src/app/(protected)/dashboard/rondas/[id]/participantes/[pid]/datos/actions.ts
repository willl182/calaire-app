'use server'

import { requireAdminAuth } from '@/server/auth'
import {
  deleteParticipanteEnviosPT,
  getEstadoEnvioPTByParticipante,
  getParticipanteRondaResumen,
  getRonda,
  isMemberSpecialRole,
  listPTItems,
  listPTSampleGroups,
  reabrirEnvioFinalPT,
  submitFinalPTByParticipante,
  upsertEnvioPT,
} from '@/server/rondas'
import type { ReferenciaImportCell } from '@/server/rondas/referencia-csv'

const MAX_IMPORT_ROWS = 500

async function getAdminTarget(rondaId: string, participanteId: string) {
  await requireAdminAuth()
  const [ronda, participante] = await Promise.all([
    getRonda(rondaId),
    getParticipanteRondaResumen(participanteId),
  ])
  if (!ronda) return { error: 'La ronda no existe o ya no está disponible.' } as const
  if (!participante || participante.ronda_id !== rondaId) {
    return { error: 'El participante no pertenece a esta ronda.' } as const
  }
  return { ronda, participante } as const
}

function validateNumbers(values: {
  d1: number
  d2: number | null
  d3: number | null
  meanValue: number
  sdValue: number
  ux: number
  uxExp: number
  k: number
}): string | null {
  if (!Number.isFinite(values.d1)) return 'd1 debe ser un número válido.'
  if (values.d2 != null && !Number.isFinite(values.d2)) return 'd2 debe ser un número válido o quedar en NA.'
  if (values.d3 != null && !Number.isFinite(values.d3)) return 'd3 debe ser un número válido o quedar en NA.'
  if (!Number.isFinite(values.meanValue)) return 'El promedio debe ser un número válido.'
  if (!Number.isFinite(values.sdValue) || values.sdValue < 0) return 'La desviación estándar debe ser mayor o igual a cero.'
  if (!Number.isFinite(values.ux) || values.ux < 0) return 'u(x) debe ser mayor o igual a cero.'
  if (!Number.isFinite(values.uxExp) || values.uxExp < 0) return 'U(X) debe ser mayor o igual a cero.'
  if (!Number.isFinite(values.k) || values.k < 0) return 'k debe ser mayor o igual a cero.'
  return null
}

export async function adminGuardarEnvioAction(
  rondaId: string,
  participanteId: string,
  ptItemId: string,
  sampleGroupId: string,
  d1: number,
  d2: number | null,
  d3: number | null,
  meanValue: number,
  sdValue: number,
  ux: number,
  uxExp: number,
  k = 2,
): Promise<{ ok?: boolean; error?: string }> {
  const target = await getAdminTarget(rondaId, participanteId)
  if ('error' in target) return target
  if (target.ronda.estado !== 'activa') return { error: 'La ronda no admite cambios en este momento.' }
  if (!target.participante.participant_code || target.participante.replicate_code == null) {
    return { error: 'El participante no tiene código PT o código de réplica asignado.' }
  }

  const [items, sampleGroups] = await Promise.all([listPTItems(rondaId), listPTSampleGroups(rondaId)])
  if (!items.some((item) => item.id === ptItemId)) return { error: 'La corrida PT no pertenece a esta ronda.' }
  if (!sampleGroups.some((group) => group.id === sampleGroupId)) return { error: 'El grupo de muestra no pertenece a esta ronda.' }

  const numberError = validateNumbers({ d1, d2, d3, meanValue, sdValue, ux, uxExp, k })
  if (numberError) return { error: numberError }

  try {
    await upsertEnvioPT(rondaId, participanteId, ptItemId, sampleGroupId, d1, d2, d3, meanValue, sdValue, ux, uxExp, k)
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible guardar el dato PT.' }
  }
}

export async function adminEnviarInformeFinalAction(
  rondaId: string,
  participanteId: string,
): Promise<{ ok?: boolean; error?: string; submittedAt?: string }> {
  const target = await getAdminTarget(rondaId, participanteId)
  if ('error' in target) return target
  if (target.ronda.estado !== 'activa') return { error: 'La ronda no admite envíos finales en este momento.' }
  if (!target.participante.participant_code || target.participante.replicate_code == null) {
    return { error: 'No se puede enviar sin código PT y código de réplica.' }
  }

  const estado = await getEstadoEnvioPTByParticipante(participanteId)
  if (estado.enviado) return { ok: true, submittedAt: estado.enviados_at ?? undefined }
  if (!estado.completo) {
    return { error: `Debes completar y guardar todas las combinaciones PT antes del envío (${estado.total_guardado}/${estado.total_esperado}).` }
  }

  try {
    const submittedAt = await submitFinalPTByParticipante(participanteId)
    return { ok: true, submittedAt }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible enviar el informe final PT.' }
  }
}

export async function adminReabrirInformeFinalAction(
  rondaId: string,
  participanteId: string,
): Promise<{ ok?: boolean; error?: string; previousSubmittedAt?: string }> {
  const target = await getAdminTarget(rondaId, participanteId)
  if ('error' in target) return target
  if (target.ronda.estado !== 'activa') return { error: 'Solo se pueden reabrir envíos de una ronda activa.' }

  try {
    const result = await reabrirEnvioFinalPT(participanteId)
    return { ok: true, previousSubmittedAt: result.previousSubmittedAt }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible reabrir el informe final PT.' }
  }
}

export async function adminGuardarReferenciaCsvAction(
  rondaId: string,
  participanteId: string,
  rows: ReferenciaImportCell[],
): Promise<{ ok?: boolean; saved?: number; errors?: string[]; error?: string }> {
  if (rows.length > MAX_IMPORT_ROWS) {
    return { error: `El archivo excede el máximo permitido de ${MAX_IMPORT_ROWS} filas (recibidas: ${rows.length}).` }
  }
  const target = await getAdminTarget(rondaId, participanteId)
  if ('error' in target) return target
  if (target.ronda.estado !== 'activa') return { error: 'La ronda no admite cambios en este momento.' }
  if (!isMemberSpecialRole(target.participante.participant_profile)) {
    return { error: 'La carga CSV solo está habilitada para el laboratorio de referencia.' }
  }
  if (!target.participante.participant_code || target.participante.replicate_code == null) {
    return { error: 'El participante no tiene código PT o código de réplica asignado.' }
  }

  const estado = await getEstadoEnvioPTByParticipante(participanteId)
  if (estado.enviado) return { error: 'El informe final está enviado. Reábrelo antes de corregirlo.' }

  const [items, sampleGroups] = await Promise.all([listPTItems(rondaId), listPTSampleGroups(rondaId)])
  const itemIds = new Set(items.map((item) => item.id))
  const sampleGroupIds = new Set(sampleGroups.map((group) => group.id))
  const errors: string[] = []
  rows.forEach((row, index) => {
    const label = `Fila importada ${index + 1}`
    if (!itemIds.has(row.ptItemId)) errors.push(`${label}: la corrida PT no pertenece a esta ronda.`)
    if (!sampleGroupIds.has(row.sampleGroupId)) errors.push(`${label}: el grupo de muestra no pertenece a esta ronda.`)
    const numberError = validateNumbers(row)
    if (numberError) errors.push(`${label}: ${numberError}`)
  })
  if (errors.length > 0) return { ok: false, saved: 0, errors }

  let saved = 0
  try {
    for (const row of rows) {
      await upsertEnvioPT(rondaId, participanteId, row.ptItemId, row.sampleGroupId, row.d1, row.d2, row.d3, row.meanValue, row.sdValue, row.ux, row.uxExp, row.k)
      saved += 1
    }
    return { ok: true, saved, errors: [] }
  } catch (error) {
    return { ok: false, saved, error: `Error en la fila ${saved + 1}: ${error instanceof Error ? error.message : 'No fue posible guardar la importación CSV.'}` }
  }
}

export async function adminLimpiarEnviosReferenciaAction(
  rondaId: string,
  participanteId: string,
): Promise<{ ok?: boolean; deleted?: number; error?: string }> {
  const target = await getAdminTarget(rondaId, participanteId)
  if ('error' in target) return target
  if (target.ronda.estado !== 'activa') return { error: 'La ronda no admite cambios en este momento.' }
  if (!isMemberSpecialRole(target.participante.participant_profile)) {
    return { error: 'Solo el laboratorio de referencia puede limpiar datos cargados.' }
  }

  const estado = await getEstadoEnvioPTByParticipante(participanteId)
  if (estado.enviado) return { error: 'El informe final está enviado. Reábrelo antes de limpiar datos.' }

  try {
    const deleted = await deleteParticipanteEnviosPT(rondaId, participanteId)
    return { ok: true, deleted }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible limpiar los datos cargados.' }
  }
}
