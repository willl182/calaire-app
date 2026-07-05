import { redirect } from 'next/navigation'

import { isAdmin, requireAuth } from '@/server/auth'
import { ParticipanteDashboard } from './components/ParticipanteDashboard'
import { AdminDashboardFrame } from './AdminDashboardFrame'
import { loadDashboardHomeData, loadParticipanteDashboardData } from './data'
import { getLegacyDashboardTabRedirect, getParamValue } from './view-model'

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')

  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const admin = isAdmin(auth)
  const legacyRedirect = admin ? getLegacyDashboardTabRedirect(params) : null
  if (legacyRedirect) redirect(legacyRedirect)

  const adminData = admin ? await loadDashboardHomeData() : null
  const rondasParticipante = !admin ? await loadParticipanteDashboardData(auth.user.id) : []

  if (!admin || !adminData) return <ParticipanteDashboard rondas={rondasParticipante} />

  return (
    <AdminDashboardFrame
      {...adminData}
      title="Panel de coordinación"
      userEmail={auth.user.email}
      success={success}
      error={error}
      showOverview
    />
  )
}
