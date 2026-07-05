import { requireAdminAuth } from '@/server/auth'
import { AdminDashboardFrame } from '../AdminDashboardFrame'
import { RegistrosTabView } from '../components/RegistrosPanel'
import { loadDashboardRegistrosData } from '../data'
import { getParamValue } from '../view-model'

type DashboardRegistrosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardRegistrosPage({ searchParams }: DashboardRegistrosPageProps) {
  const auth = await requireAdminAuth()
  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const data = await loadDashboardRegistrosData()

  return (
    <AdminDashboardFrame
      {...data}
      title="Registros"
      userEmail={auth.user?.email ?? ''}
      success={success}
      error={error}
    >
      <RegistrosTabView participantesGlobal={data.allParticipantes} workosUsers={data.workosUsers} />
    </AdminDashboardFrame>
  )
}
