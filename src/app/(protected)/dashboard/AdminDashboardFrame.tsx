import Link from 'next/link'
import type { ReactNode } from 'react'

import { Alert } from '@/components/ui/Alert'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import { resumirPanel } from '@/lib/rondas/estado-visible'
import { CoordinatorKpis } from './components/CoordinatorKpis'
import { CoordinatorOverview } from './components/CoordinatorOverview'
import type { AdminDashboardBaseData } from './data'

type AdminDashboardFrameProps = AdminDashboardBaseData & {
  title: string
  userEmail: string
  success?: string
  error?: string
  showOverview?: boolean
  /** Indicadores globales; las vistas con indicadores propios los ocultan. */
  showKpis?: boolean
  children?: ReactNode
}

export function AdminDashboardFrame({
  title,
  userEmail,
  success,
  error,
  showOverview = false,
  showKpis = true,
  children,
  rondas,
  rondasActivas,
  metricasRondasActivas,
  backendOffline,
}: AdminDashboardFrameProps) {
  const resumen = resumirPanel(
    rondas,
    rondasActivas.map((ronda, i) => ({ ronda, metricas: metricasRondasActivas[i] }))
  )

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
          {showKpis && (
            <CoordinatorKpis
              rondasActivas={rondasActivas.length}
              rondasBorrador={resumen.borradores}
              fichasPendientes={resumen.fichasPendientes}
              enlacesSinReclamar={resumen.cuposSinReclamar}
              rondasListasParaExportar={resumen.listasParaExportar}
            />
          )}

          {showOverview && (
            <CoordinatorOverview
              rondasActivas={rondasActivas}
              estados={resumen.estados}
              metricas={metricasRondasActivas}
              avisos={resumen.avisos}
            />
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
