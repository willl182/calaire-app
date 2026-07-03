'use server'

import { isAdmin, requireAuth } from '@/server/auth'
import {
  deleteParticipanteEnviosPT,
  getEstadoEnvioPTParticipante,
  getRequiredPTReplicateCount,
  getRonda,
  getRondaParticipantePT,
  isMemberSpecialRole,
  isInvitado,
  listPTItems,
  listPTSampleGroups,
  submitFinalPT,
  upsertEnvioPT,
} from '@/server/rondas'
import type { ReferenciaImportCell } from '@/server/rondas/referencia-csv'

export async function guardarEnvioAction(
  rondaId: string,
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
  const auth = await requireAuth()
  if (!auth.user) return { error: 'No autenticado' }

  const ronda = await getRonda(rondaId)
  if (!ronda) return { error: 'La ronda no existe o ya no está disponible.' }
  if (ronda.estado !== 'activa') return { error: 'La ronda no admite cambios en este momento.' }

  if (!isAdmin(auth)) {
    const invitado = await isInvitado(rondaId)
    if (!invitado) return { error: 'No tienes acceso a esta ronda.' }
  }

  const estadoEnvio = await getEstadoEnvioPTParticipante(rondaId)
  if (estadoEnvio.enviado) {
    return { error: 'Ya enviaste tus resultados finales. Solo puedes consultarlos.' }
  }

  const participante = await getRondaParticipantePT(rondaId)
  if (!participante) {
    return { error: 'No fue posible encontrar la asignación del participante para esta ronda.' }
  }
  if (!participante.participant_code || participante.replicate_code == null) {
    return {
      error:
        'Aún no tienes código PT o código de réplica asignado. Contacta al coordinador para continuar.',
    }
  }

  const [items, sampleGroups] = await Promise.all([listPTItems(rondaId), listPTSampleGroups(rondaId)])
  if (!items.some((item) => item.id === ptItemId)) {
    return { error: 'La combinación de corrida PT no pertenece a esta ronda.' }
  }
  if (!sampleGroups.some((group) => group.id === sampleGroupId)) {
    return { error: 'El grupo de muestra no pertenece a esta ronda.' }
  }

  const item = items.find((candidate) => candidate.id === ptItemId)
  const requiredReplicates = item ? getRequiredPTReplicateCount(item, items) : 3
  if (!Number.isFinite(d1)) {
    return { error: 'd1 debe ser un número válido.' }
  }
  if (requiredReplicates === 3 && (!Number.isFinite(d2) || !Number.isFinite(d3))) {
    return { error: 'd2 y d3 deben ser números válidos para niveles distintos de la concentración inicial.' }
  }
  if (!Number.isFinite(meanValue)) {
    return { error: 'El promedio debe ser un número válido.' }
  }
  if (!Number.isFinite(sdValue) || sdValue < 0) {
    return { error: 'La desviación estándar debe ser un número válido mayor o igual a cero.' }
  }
  if (!Number.isFinite(ux) || ux < 0) {
    return { error: 'u(x) debe ser un número válido mayor o igual a cero.' }
  }
  if (!Number.isFinite(k) || k < 0) {
    return { error: 'k debe ser un número válido mayor o igual a cero.' }
  }
  if (!Number.isFinite(uxExp) || uxExp < 0) {
    return { error: 'u(x) exp debe ser un número válido mayor o igual a cero.' }
  }

  try {
    await upsertEnvioPT(rondaId, participante.id, ptItemId, sampleGroupId, d1, d2, d3, meanValue, sdValue, ux, uxExp, k)
    return { ok: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'No fue posible guardar el envío PT.',
    }
  }
}

const MAX_IMPORT_ROWS = 500

export async function guardarReferenciaCsvAction(
  rondaId: string,
  rows: ReferenciaImportCell[]
): Promise<{ ok?: boolean; saved?: number; errors?: string[]; error?: string }> {
  if (rows.length > MAX_IMPORT_ROWS) {
    return { error: `El archivo excede el máximo permitido de ${MAX_IMPORT_ROWS} filas (recibidas: ${rows.length}).` }
  }

  const auth = await requireAuth()
  if (!auth.user) return { error: 'No autenticado' }

  const ronda = await getRonda(rondaId)
  if (!ronda) return { error: 'La ronda no existe o ya no está disponible.' }
  if (ronda.estado !== 'activa') return { error: 'La ronda no admite cambios en este momento.' }

  if (!isAdmin(auth)) {
    const invitado = await isInvitado(rondaId)
    if (!invitado) return { error: 'No tienes acceso a esta ronda.' }
  }

  const participante = await getRondaParticipantePT(rondaId)
  if (!participante) {
    return { error: 'No fue posible encontrar la asignación del participante para esta ronda.' }
  }
  if (!isMemberSpecialRole(participante.participant_profile)) {
    return { error: 'La carga CSV solo está habilitada para el laboratorio de referencia.' }
  }
  if (!participante.participant_code || participante.replicate_code == null) {
    return {
      error:
        'Aún no tienes código PT o código de réplica asignado. Contacta al coordinador para continuar.',
    }
  }

  const estadoEnvio = await getEstadoEnvioPTParticipante(rondaId)
  if (estadoEnvio.enviado) {
    return { error: 'Ya enviaste tus resultados finales. Solo puedes consultarlos.' }
  }

  const [items, sampleGroups] = await Promise.all([listPTItems(rondaId), listPTSampleGroups(rondaId)])
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const sampleGroupIds = new Set(sampleGroups.map((group) => group.id))
  const errors: string[] = []

  rows.forEach((row, index) => {
    const label = `Fila importada ${index + 1}`
    const item = itemsById.get(row.ptItemId)
    if (!item) errors.push(`${label}: la corrida PT no pertenece a esta ronda.`)
    if (!sampleGroupIds.has(row.sampleGroupId)) errors.push(`${label}: el grupo de muestra no pertenece a esta ronda.`)

    const requiredReplicates = item ? getRequiredPTReplicateCount(item, items) : 3
    if (!Number.isFinite(row.d1)) errors.push(`${label}: d1 debe ser un número válido.`)
    if (requiredReplicates === 3 && (!Number.isFinite(row.d2) || !Number.isFinite(row.d3))) {
      errors.push(`${label}: d2 y d3 deben ser números válidos para niveles distintos de la concentración inicial.`)
    }
    if (!Number.isFinite(row.meanValue)) errors.push(`${label}: el promedio debe ser un número válido.`)
    if (!Number.isFinite(row.sdValue) || row.sdValue < 0) {
      errors.push(`${label}: la desviación estándar debe ser un número válido mayor o igual a cero.`)
    }
    if (!Number.isFinite(row.ux) || row.ux < 0) {
      errors.push(`${label}: u(x) debe ser un número válido mayor o igual a cero.`)
    }
    if (!Number.isFinite(row.k) || row.k < 0) {
      errors.push(`${label}: k debe ser un número válido mayor o igual a cero.`)
    }
    if (!Number.isFinite(row.uxExp) || row.uxExp < 0) {
      errors.push(`${label}: u(x) exp debe ser un número válido mayor o igual a cero.`)
    }
  })

  if (errors.length > 0) return { ok: false, saved: 0, errors }

  let saved = 0
  try {
    for (const row of rows) {
      await upsertEnvioPT(
        rondaId,
        participante.id,
        row.ptItemId,
        row.sampleGroupId,
        row.d1,
        row.d2,
        row.d3,
        row.meanValue,
        row.sdValue,
        row.ux,
        row.uxExp,
        row.k
      )
      saved += 1
    }
    return { ok: true, saved, errors: [] }
  } catch (error) {
    return {
      ok: false,
      saved,
      error: `Error en la fila ${saved + 1}: ${error instanceof Error ? error.message : 'No fue posible guardar la importación CSV.'}`,
    }
  }
}

export async function enviarInformeFinalAction(
  rondaId: string
): Promise<{ ok?: boolean; error?: string; submittedAt?: string }> {
  const auth = await requireAuth()
  if (!auth.user) return { error: 'No autenticado' }

  const ronda = await getRonda(rondaId)
  if (!ronda) return { error: 'La ronda no existe o ya no está disponible.' }
  if (ronda.estado !== 'activa') {
    return { error: 'La ronda no admite envíos finales en este momento.' }
  }

  if (!isAdmin(auth)) {
    const invitado = await isInvitado(rondaId)
    if (!invitado) return { error: 'No tienes acceso a esta ronda.' }
  }

  const participante = await getRondaParticipantePT(rondaId)
  if (!participante) {
    return { error: 'No fue posible encontrar la asignación del participante para esta ronda.' }
  }
  if (!participante.participant_code || participante.replicate_code == null) {
    return {
      error:
        'No puedes enviar el informe final sin código PT y código de réplica asignados por coordinación.',
    }
  }

  const estadoEnvio = await getEstadoEnvioPTParticipante(rondaId)

  if (estadoEnvio.enviado) {
    return {
      ok: true,
      submittedAt: estadoEnvio.enviados_at ?? undefined,
    }
  }

  if (!estadoEnvio.completo) {
    return {
      error: `Debes completar y guardar todas las combinaciones PT antes de enviar el informe (${estadoEnvio.total_guardado}/${estadoEnvio.total_esperado}).`,
    }
  }

  try {
    const submittedAt = await submitFinalPT(rondaId)
    return { ok: true, submittedAt }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'No fue posible enviar el informe final PT.',
    }
  }
}

export async function limpiarEnviosReferenciaAction(
  rondaId: string
): Promise<{ ok?: boolean; deleted?: number; error?: string }> {
  const auth = await requireAuth()
  if (!auth.user) return { error: 'No autenticado' }

  const ronda = await getRonda(rondaId)
  if (!ronda) return { error: 'La ronda no existe o ya no está disponible.' }
  if (ronda.estado !== 'activa') return { error: 'La ronda no admite cambios en este momento.' }

  if (!isAdmin(auth)) {
    const invitado = await isInvitado(rondaId)
    if (!invitado) return { error: 'No tienes acceso a esta ronda.' }
  }

  const participante = await getRondaParticipantePT(rondaId)
  if (!participante) {
    return { error: 'No fue posible encontrar la asignación del participante para esta ronda.' }
  }
  if (!isMemberSpecialRole(participante.participant_profile)) {
    return { error: 'Solo el laboratorio de referencia puede limpiar los datos cargados.' }
  }

  const estadoEnvio = await getEstadoEnvioPTParticipante(rondaId)
  if (estadoEnvio.enviado) {
    return { error: 'Ya enviaste tus resultados finales. No puedes limpiar los datos.' }
  }

  try {
    const deleted = await deleteParticipanteEnviosPT(rondaId, participante.id)
    return { ok: true, deleted }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'No fue posible limpiar los datos cargados.',
    }
  }
}
