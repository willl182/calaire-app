import { requireAdminAuth } from '@/server/auth'
import { AdminDashboardFrame } from '../AdminDashboardFrame'
import { DirectorioPanel } from '../components/DirectorioPanel'
import { ParticipantesGlobalView } from '../components/ParticipantesPanel'
import { loadDashboardParticipantesData } from '../data'
import { getParamValue } from '../view-model'

type DashboardParticipantesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardParticipantesPage({ searchParams }: DashboardParticipantesPageProps) {
  const auth = await requireAdminAuth()
  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const data = await loadDashboardParticipantesData()

  return (
    <AdminDashboardFrame
      {...data}
      title="Participantes"
      userEmail={auth.user?.email ?? ''}
      success={success}
      error={error}
    >
      <div className="grid gap-6">
        <DirectorioPanel allParticipantes={data.allParticipantes} />
        <ParticipantesGlobalView participantes={data.allParticipantes} />
      </div>
    </AdminDashboardFrame>
  )
}
