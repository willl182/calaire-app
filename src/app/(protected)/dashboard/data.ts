import {
  getRondaMetricasCompletasWithStatus,
  listAllParticipantesWithStatus,
  listDirectorioParticipantes,
  listParticipantesRondaResumenWithStatus,
  listPTItemsWithStatus,
  listPTSampleGroupsWithStatus,
  listResultadosPTRondaWithStatus,
  listRondasWithStatus,
  listRondasParticipante,
  type Ronda,
} from '@/server/rondas'
import { listWorkOSUsersCached } from '@/server/auth/workos'
import type { ResultadoDashboardRonda } from './view-model'

export type AdminDashboardBaseData = Awaited<ReturnType<typeof loadDashboardBaseData>>

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

async function loadDashboardBaseData() {
  const rondasResult = await listRondasWithStatus()
  const rondas = rondasResult.data
  const rondasActivas = rondas.filter((r) => r.estado === 'activa')
  const [participantesRondasActivasResults, metricasRondasActivasResults] = await Promise.all([
    Promise.all(rondasActivas.map((r) => listParticipantesRondaResumenWithStatus(r.id))),
    // Mismas métricas que el detalle de ronda, para que el estado visible coincida.
    Promise.all(rondasActivas.map((r) => getRondaMetricasCompletasWithStatus(r.id, r))),
  ])

  return {
    rondas,
    rondasActivas,
    participantesRondasActivas: participantesRondasActivasResults.map((result) => result.data),
    metricasRondasActivas: metricasRondasActivasResults.map((result) => result.data),
    backendOffline: (
      rondasResult.offline ||
      participantesRondasActivasResults.some((result) => result.offline) ||
      metricasRondasActivasResults.some((result) => result.offline)
    ),
  }
}

export async function loadDashboardHomeData() {
  return loadDashboardBaseData()
}

export async function loadDashboardRondasData() {
  return loadDashboardBaseData()
}

export async function loadDashboardRegistrosData() {
  const [base, allParticipantesResult, workosUsers] = await Promise.all([
    loadDashboardBaseData(),
    listAllParticipantesWithStatus(),
    listWorkOSUsersCached(),
  ])

  return {
    ...base,
    allParticipantes: allParticipantesResult.data,
    workosUsers,
    backendOffline: base.backendOffline || allParticipantesResult.offline,
  }
}

export async function loadDashboardParticipantesData() {
  const [base, allParticipantesResult, directorio] = await Promise.all([
    loadDashboardBaseData(),
    listAllParticipantesWithStatus(),
    listDirectorioParticipantes(),
  ])

  return {
    ...base,
    allParticipantes: allParticipantesResult.data,
    directorio,
    backendOffline: base.backendOffline || allParticipantesResult.offline,
  }
}

export async function loadDashboardResultadosData() {
  const base = await loadDashboardBaseData()
  const rondasResultadosResult = await loadResultadosDashboardWithStatus(base.rondas)

  return {
    ...base,
    rondasResultados: rondasResultadosResult.data,
    backendOffline: base.backendOffline || rondasResultadosResult.offline,
  }
}

export async function loadParticipanteDashboardData(userId: string) {
  return listRondasParticipante(userId)
}
