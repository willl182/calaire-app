import {
  listAllParticipantes,
  listParticipantesRondaResumen,
  listPTItems,
  listPTSampleGroups,
  listResultadosPTRonda,
  listRondas,
  listRondasParticipante,
  type Ronda,
} from '@/lib/rondas'
import { listWorkOSUsers } from '@/lib/workos'
import type { ResultadoDashboardRonda } from './view-model'

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
  }
}

export async function loadParticipanteDashboardData(userId: string) {
  return listRondasParticipante(userId)
}
