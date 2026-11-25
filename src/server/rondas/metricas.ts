// Métricas operativas de la ronda (la derivación pura está en ./estados).
import { dataOf } from '@/server/convex'
import { derivarEstadoOperativo } from './estados'
import type { Ronda } from './types'
import { listParticipantesRondaResumenWithStatus } from './participantes'
import { listPTItemsWithStatus, listResultadosPTRondaWithStatus } from './pt-captura'

export const getRondaMetricasCompletas = dataOf(getRondaMetricasCompletasWithStatus)

export async function getRondaMetricasCompletasWithStatus(
  rondaId: string,
  ronda: Pick<Ronda, 'estado'>
) {
  const [participantesResult, resultadosPTResult, ptItemsResult] = await Promise.all([
    listParticipantesRondaResumenWithStatus(rondaId),
    listResultadosPTRondaWithStatus(rondaId),
    listPTItemsWithStatus(rondaId),
  ])
  const participantes = participantesResult.data
  const resultadosPT = resultadosPTResult.data
  const ptItems = ptItemsResult.data
  const offline = participantesResult.offline || resultadosPTResult.offline || ptItemsResult.offline

  const cupos_totales = participantes.length
  const cupos_reclamados = participantes.filter((p) => p.estado === 'reclamado').length
  const fichas_enviadas = participantes.filter((p) => p.ficha_estado === 'enviado').length
  const fichas_pendientes = cupos_reclamados - fichas_enviadas
  const envios_esperados = cupos_reclamados
  const envios_finales = resultadosPT.filter((r) => r.enviados_at !== null).length
  const pt_configurado = ptItems.length > 0

  const datos = {
    cupos_totales,
    cupos_reclamados,
    fichas_enviadas,
    fichas_pendientes,
    envios_finales,
    envios_esperados,
    pt_configurado,
  }

  const { estado_operativo, accion_recomendada } = derivarEstadoOperativo(ronda, datos)

  return { data: { ...datos, estado_operativo, accion_recomendada }, offline }
}
