import Link from 'next/link'
import type { ReactNode } from 'react'

import { Alert } from '@/components/ui/Alert'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import { buildAttentionItems } from '@/server/rondas/service'
import { CoordinatorKpis } from './components/CoordinatorKpis'
import { CoordinatorOverview } from './components/CoordinatorOverview'
import type { AdminDashboardBaseData } from './data'

type AdminDashboardFrameProps = AdminDashboardBaseData & {
  title: string
  userEmail: string
  success?: string
  error?: string
  showOverview?: boolean
  children?: ReactNode
}

export function AdminDashboardFrame({
  title,
  userEmail,
  success,
  error,
  showOverview = false,
  children,
  rondas,
  rondasActivas,
  participantesRondasActivas,
  backendOffline,
}: AdminDashboardFrameProps) {
  const participantesActivos = participantesRondasActivas.flat()
  const fichasPendientesCount = participantesActivos.filter((p) => p.ficha_estado !== 'enviado').length
  const enlacesSinReclamar = participantesActivos.filter((p) => p.estado === 'pendiente').length
  const rondasListasParaExportar = rondasActivas.filter((_, i) =>
    participantesRondasActivas[i]?.some((p) => p.envios_pt_count > 0)
  ).length
  const attentionItems = showOverview
    ? buildAttentionItems(rondas, participantesRondasActivas)
    : []

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <SgcHeader
          compact
          title={title}
          accent="Gestión de rondas"
          description={`${userEmail} · Coordinador`}
          actions={(
            <Link href="/dashboard/rondas/nueva" className="btn-primary">
              ＋ Nueva ronda
            </Link>
          )}
        />

        <Alert tone="success" message={success} />
        <Alert tone="error" message={error} />
        {backendOffline && <BackendOfflineBanner />}

        <div className="grid gap-6">
          <CoordinatorKpis
            rondas={rondas}
            rondasActivas={rondasActivas}
            fichasPendientesCount={fichasPendientesCount}
            enlacesSinReclamar={enlacesSinReclamar}
            rondasListasParaExportar={rondasListasParaExportar}
          />

          {showOverview && (
            <CoordinatorOverview
              activeTab="inicio"
              rondasActivas={rondasActivas}
              participantesRondasActivas={participantesRondasActivas}
              attentionItems={attentionItems}
            />
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
