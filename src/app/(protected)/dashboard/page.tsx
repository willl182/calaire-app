import { signOut } from '@workos-inc/authkit-nextjs'

import { buildAbsoluteAppUrl } from '@/lib/app-url'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Alert } from '@/components/ui/Alert'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { isAdmin, requireAuth } from '@/server/auth'
import { buildAttentionItems } from '@/server/rondas/service'
import type { Contaminante } from '@/server/rondas'
import { CoordinatorKpis } from './components/CoordinatorKpis'
import { CoordinatorOverview } from './components/CoordinatorOverview'
import { DirectorioPanel } from './components/DirectorioPanel'
import { ParticipantesGlobalView } from './components/ParticipantesPanel'
import { RegistrosTabView } from './components/RegistrosPanel'
import { ParticipanteDashboard } from './components/ParticipanteDashboard'
import { ResultadosGlobalView } from './components/ResultadosPanel'
import { RondasTable } from './components/RondasTable'
import { loadAdminDashboardData, loadParticipanteDashboardData } from './data'
import { getParamValue } from './view-model'

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
  const activeTab = getParamValue(params.tab) ?? 'inicio'
  const editando = getParamValue(params.editando) ?? ''
  const resultadosContaminante = (getParamValue(params.contaminante) ?? null) as Contaminante | null

  const adminData = admin ? await loadAdminDashboardData(activeTab) : null
  const rondasParticipante = !admin ? await loadParticipanteDashboardData(auth.user.id) : []

  const rondas = adminData?.rondas ?? []
  const allParticipantes = adminData?.allParticipantes ?? []
  const workosUsers = adminData?.workosUsers ?? []
  const rondasResultados = adminData?.rondasResultados ?? []
  const rondasActivas = adminData?.rondasActivas ?? []
  const participantesRondasActivas = adminData?.participantesRondasActivas ?? []
  const fichasPendientesCount = participantesRondasActivas
    .flat()
    .filter((p) => p.ficha_estado !== 'enviado').length

  const enlacesSinReclamar = participantesRondasActivas
    .flat()
    .filter((p) => p.estado === 'pendiente').length
  const rondasListasParaExportar = rondasActivas.filter((_, i) =>
    participantesRondasActivas[i]?.some((p) => p.envios_pt_count > 0)
  ).length
  const attentionItems = admin
    ? buildAttentionItems(rondas, participantesRondasActivas)
    : []
  const pageTitleByTab: Record<string, string> = {
    inicio: 'Panel de coordinación',
    rondas: 'Rondas',
    registros: 'Registros',
    participantes: 'Participantes',
    resultados: 'Resultados',
  }
  const pageTitle = pageTitleByTab[activeTab] ?? 'Panel de coordinación'

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="header-bar px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pt-primary-dark)]">
                Gestión de rondas
              </p>
              <h1 className="text-2xl font-bold leading-tight text-[var(--foreground)]">
                {pageTitle}
              </h1>
              <p className="text-sm text-[var(--foreground-muted)]">
                Ensayos de Aptitud · {auth.user.email} · {admin ? 'Coordinador' : 'Participante'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {admin && (
                <Link
                  href="/dashboard/rondas/nueva"
                  className="btn-primary"
                >
                  ＋ Nueva ronda
                </Link>
              )}
              <form
                action={async () => {
                  'use server'
                  await signOut({ returnTo: buildAbsoluteAppUrl('/login') })
                }}
              >
                <button type="submit" className="btn-outline">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </header>

        <Alert tone="success" message={success} />
        <Alert tone="error" message={error} />
        {adminData?.backendOffline && <BackendOfflineBanner />}

        {!admin ? (
          <ParticipanteDashboard rondas={rondasParticipante} />
        ) : (
          <div className="grid gap-6">
            <CoordinatorKpis
              rondas={rondas}
              rondasActivas={rondasActivas}
              fichasPendientesCount={fichasPendientesCount}
              enlacesSinReclamar={enlacesSinReclamar}
              rondasListasParaExportar={rondasListasParaExportar}
            />

            <CoordinatorOverview
              activeTab={activeTab}
              rondasActivas={rondasActivas}
              participantesRondasActivas={participantesRondasActivas}
              attentionItems={attentionItems}
            />

            {/* ── Tab rondas: lista completa ──────────────────── */}
            {activeTab === 'rondas' && (
              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground-muted)]">
                    {rondas.length} ronda{rondas.length !== 1 ? 's' : ''} registrada{rondas.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <RondasTable rondas={rondas} editando={editando} />
              </div>
            )}

            {activeTab === 'registros' && (
              <RegistrosTabView participantesGlobal={allParticipantes} workosUsers={workosUsers} />
            )}

            {activeTab === 'participantes' && (
              <div className="grid gap-6">
                <DirectorioPanel allParticipantes={allParticipantes} />
                <ParticipantesGlobalView participantes={allParticipantes} />
              </div>
            )}

            {activeTab === 'resultados' && (
              <ResultadosGlobalView
                rondasResultados={rondasResultados}
                activeContaminante={resultadosContaminante}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
