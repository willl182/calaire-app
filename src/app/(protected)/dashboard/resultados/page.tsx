import type { Contaminante } from '@/server/rondas'
import { requireAdminAuth } from '@/server/auth'
import { AdminDashboardFrame } from '../AdminDashboardFrame'
import { ResultadosGlobalView } from '../components/ResultadosPanel'
import { loadDashboardResultadosData } from '../data'
import { getParamValue } from '../view-model'

type DashboardResultadosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardResultadosPage({ searchParams }: DashboardResultadosPageProps) {
  const auth = await requireAdminAuth()
  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const activeContaminante = (getParamValue(params.contaminante) ?? null) as Contaminante | null
  const data = await loadDashboardResultadosData()

  return (
    <AdminDashboardFrame
      {...data}
      title="Resultados"
      userEmail={auth.user?.email ?? ''}
      success={success}
      error={error}
    >
      <ResultadosGlobalView
        rondasResultados={data.rondasResultados}
        activeContaminante={activeContaminante}
      />
    </AdminDashboardFrame>
  )
}
