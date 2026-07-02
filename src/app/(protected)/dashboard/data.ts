import {
  listAllParticipantesWithStatus,
  listParticipantesRondaResumenWithStatus,
  listPTItemsWithStatus,
  listPTSampleGroupsWithStatus,
  listResultadosPTRondaWithStatus,
  listRondasWithStatus,
  listRondasParticipante,
  type Ronda,
} from '@/server/rondas'
import { listWorkOSUsers } from '@/server/auth/workos'
import type { ResultadoDashboardRonda } from './view-model'

export type AdminDashboardData = Awaited<ReturnType<typeof loadAdminDashboardData>>

export async function loadResultadosDashboard(rondas: Ronda[]): Promise<ResultadoDashboardRonda[]> {
  const resultados = await Promise.all(
    rondas.map(async (ronda) => {
      const [ptItemsResult, sampleGroupsResult, resultadosResult] = await Promise.all([
        listPTItemsWithStatus(ronda.id),
        listPTSampleGroupsWithStatus(ronda.id),
        listResultadosPTRondaWithStatus(ronda.id),
      ])

      return {
        data: {
          ronda,
          ptItems: ptItemsResult.data,
          sampleGroups: sampleGroupsResult.data,
          resultados: resultadosResult.data,
        },
        offline: ptItemsResult.offline || sampleGroupsResult.offline || resultadosResult.offline,
      }
    })
  )
  return resultados.map((resultado) => resultado.data)
}

export async function loadResultadosDashboardWithStatus(rondas: Ronda[]) {
  const resultados = await Promise.all(
    rondas.map(async (ronda) => {
      const [ptItemsResult, sampleGroupsResult, resultadosResult] = await Promise.all([
        listPTItemsWithStatus(ronda.id),
        listPTSampleGroupsWithStatus(ronda.id),
        listResultadosPTRondaWithStatus(ronda.id),
      ])

      return {
        data: {
          ronda,
          ptItems: ptItemsResult.data,
          sampleGroups: sampleGroupsResult.data,
          resultados: resultadosResult.data,
        },
        offline: ptItemsResult.offline || sampleGroupsResult.offline || resultadosResult.offline,
      }
    })
  )

  return {
    data: resultados.map((resultado) => resultado.data),
    offline: resultados.some((resultado) => resultado.offline),
  }
}

export async function loadAdminDashboardData(activeTab: string) {
  const [rondasResult, allParticipantesResult, workosUsers] = await Promise.all([
    listRondasWithStatus(),
    listAllParticipantesWithStatus(),
    listWorkOSUsers(),
  ])
  const rondas = rondasResult.data
  const rondasResultadosResult = activeTab === 'resultados'
    ? await loadResultadosDashboardWithStatus(rondas)
    : { data: [], offline: false }
  const rondasActivas = rondas.filter((r) => r.estado === 'activa')
  const participantesRondasActivasResults = await Promise.all(
    rondasActivas.map((r) => listParticipantesRondaResumenWithStatus(r.id))
  )

  return {
    rondas,
    allParticipantes: allParticipantesResult.data,
    workosUsers,
    rondasResultados: rondasResultadosResult.data,
    rondasActivas,
    participantesRondasActivas: participantesRondasActivasResults.map((result) => result.data),
    backendOffline: (
      rondasResult.offline ||
      allParticipantesResult.offline ||
      rondasResultadosResult.offline ||
      participantesRondasActivasResults.some((result) => result.offline)
    ),
  }
}

export async function loadParticipanteDashboardData(userId: string) {
  return listRondasParticipante(userId)
}
