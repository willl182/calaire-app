import Link from 'next/link'

import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import type { listMapaSgc, listNormativaSgc, listSgcMaestro } from '@/server/sgc'

type SgcResumenViewProps = {
  email: string
  documentos: Awaited<ReturnType<typeof listSgcMaestro>>
  normativa: Awaited<ReturnType<typeof listNormativaSgc>>
  mapa: Awaited<ReturnType<typeof listMapaSgc>>
  backendOffline: boolean
  basePath: '/sgc' | '/dashboard/sgc'
}

export function SgcResumenView({
  email,
  documentos,
  normativa,
  mapa,
  backendOffline,
  basePath,
}: SgcResumenViewProps) {
  const inDashboard = basePath === '/dashboard/sgc'
  const totalDocumentos = documentos.resumen.total
  const sinVersion = documentos.resumen.sinVersion
  const requisitos = normativa.resumen.requisitos
  const relaciones = mapa.relaciones.length

  return (
    <div className="app-workspace min-w-0">
      <SgcHeader
        title={<>Sistema de Gestión Maestro <span className="font-medium text-[var(--foreground-muted)]">CALAIRE</span></>}
        accent="Repositorio global de documentos, versiones, requisitos y mapa documental"
        description={inDashboard ? null : 'Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín'}
        email={email}
        compact={inDashboard}
      />

      {backendOffline && (
        <BackendOfflineBanner detail="Los contadores y accesos SGC se muestran con datos vacios hasta que Convex responda." />
      )}

      <section className="sgc-kpis">
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Documentos</div>
          <div className="sgc-kpi-value numeric">{totalDocumentos}</div>
        </div>
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Sin version</div>
          <div className="sgc-kpi-value numeric">{sinVersion}</div>
        </div>
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Requisitos</div>
          <div className="sgc-kpi-value numeric">{requisitos}</div>
        </div>
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Relaciones</div>
          <div className="sgc-kpi-value numeric">{relaciones}</div>
        </div>
      </section>

      <nav className="sgc-quicknav" aria-label="Accesos SGC">
        {[
          ['Centro documental', `${basePath}/documentos`, 'Documentos maestros, fuente editable y version oficial.'],
          ['Matriz normativa', `${basePath}/normativa`, 'Requisitos 17043/13528 y cobertura documental.'],
          ['Mapa SGC', `${basePath}/mapa`, 'Relaciones navegables desde el inventario maestro.'],
        ].map(([label, href, description]) => (
          <Link key={href} href={href}>
            <div>{label}</div>
            <div className="mt-2 text-xs text-[var(--foreground-muted)]">{description}</div>
          </Link>
        ))}
      </nav>
    </div>
  )
}
