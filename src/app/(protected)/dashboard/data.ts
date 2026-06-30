import {
  listAllParticipantes,
  listParticipantesRondaResumen,
  listPTItems,
  listPTSampleGroups,
  listResultadosPTRonda,
  listRondas,
  listRondasParticipante,
  type Ronda,
} from '@/server/rondas'
import { listWorkOSUsers } from '@/server/auth/workos'
import { isConvexOffline } from '@/lib/convex-fallback'
import type { ResultadoDashboardRonda } from './view-model'

export type AdminDashboardData = Awaited<ReturnType<typeof loadAdminDashboardData>>

export async function loadResultadosDashboard(rondas: Ronda[]): Promise<ResultadoDashboardRonda[]> {
  return Promise.all(
    rondas.map(async (ronda) => {
      const [ptItems, sampleGroups, resultados] = await Promise.all([
        listPTItems(ronda.id),
        listPTSampleGroups(ronda.id),
        listResultadosPTRonda(ronda.id),
      ])

      return { ronda, ptItems, sampleGroups, resultados }
    })
  )
}

export async function loadAdminDashboardData(activeTab: string) {
  try {
    const [rondas, allParticipantes, workosUsers] = await Promise.all([
      listRondas(),
      listAllParticipantes(),
      listWorkOSUsers(),
    ])
    const rondasResultados = activeTab === 'resultados' ? await loadResultadosDashboard(rondas) : []
    const rondasActivas = rondas.filter((r) => r.estado === 'activa')
    const participantesRondasActivas = await Promise.all(
      rondasActivas.map((r) => listParticipantesRondaResumen(r.id))
    )

    return {
      rondas,
      allParticipantes,
      workosUsers,
      rondasResultados,
      rondasActivas,
      participantesRondasActivas,
      backendOffline: false as const,
    }
  } catch (error) {
    if (isConvexOffline(error)) {
      return {
        rondas: [],
        allParticipantes: [],
        workosUsers: [],
        rondasResultados: [],
        rondasActivas: [],
        participantesRondasActivas: [],
        backendOffline: true as const,
      }
    }
    throw error
  }
}

export async function loadParticipanteDashboardData(userId: string) {
  return listRondasParticipante(userId)
}
