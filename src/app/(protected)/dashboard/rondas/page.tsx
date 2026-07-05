import { requireAdminAuth } from '@/server/auth'
import { AdminDashboardFrame } from '../AdminDashboardFrame'
import { RondasTable } from '../components/RondasTable'
import { loadDashboardRondasData } from '../data'
import { getParamValue } from '../view-model'

type DashboardRondasPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardRondasPage({ searchParams }: DashboardRondasPageProps) {
  const auth = await requireAdminAuth()
  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const editando = getParamValue(params.editando) ?? ''
  const data = await loadDashboardRondasData()

  return (
    <AdminDashboardFrame
      {...data}
      title="Rondas"
      userEmail={auth.user?.email ?? ''}
      success={success}
      error={error}
    >
      <div className="grid gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--foreground-muted)]">
            {data.rondas.length} ronda{data.rondas.length !== 1 ? 's' : ''} registrada{data.rondas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <RondasTable rondas={data.rondas} editando={editando} />
      </div>
    </AdminDashboardFrame>
  )
}
