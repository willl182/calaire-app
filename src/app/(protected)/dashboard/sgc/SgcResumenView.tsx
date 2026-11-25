import Link from 'next/link'

import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import type { listMapaSgc, listNormativaSgc, listSgcMaestro } from '@/server/sgc'

const SGC_BASE_PATH = '/dashboard/sgc'

type SgcResumenViewProps = {
  email: string
  documentos: Awaited<ReturnType<typeof listSgcMaestro>>
  normativa: Awaited<ReturnType<typeof listNormativaSgc>>
  mapa: Awaited<ReturnType<typeof listMapaSgc>>
  backendOffline: boolean
}

export function SgcResumenView({
  email,
  documentos,
  normativa,
  mapa,
  backendOffline,
}: SgcResumenViewProps) {
  const totalDocumentos = documentos.resumen.total
  const sinVersion = documentos.resumen.sinVersion
  const requisitos = normativa.resumen.requisitos
  const relaciones = mapa.relaciones.length

  return (
    <div className="app-workspace min-w-0">
      <SgcHeader
        title={<>Sistema de Gestión Maestro <span className="font-medium text-[var(--foreground-muted)]">CALAIRE</span></>}
        accent="Repositorio global de documentos, versiones, requisitos y mapa documental"
        description={null}
        email={email}
        compact
      />

      {backendOffline && (
        <BackendOfflineBanner detail="Los contadores y accesos SGC se muestran con datos vacíos hasta que el servidor responda." />
      )}

      <section className="sgc-kpis" aria-label="Indicadores SGC">
        {[
          ['Documentos', totalDocumentos, `${SGC_BASE_PATH}/documentos`],
          ['Sin versión', sinVersion, `${SGC_BASE_PATH}/documentos?version=sin`],
          ['Requisitos', requisitos, `${SGC_BASE_PATH}/normativa`],
          ['Relaciones', relaciones, `${SGC_BASE_PATH}/mapa`],
        ].map(([label, value, href]) => (
          <Link key={label} href={String(href)} className="sgc-kpi hover:bg-[var(--surface-muted)] hover:no-underline">
            <div className="sgc-kpi-label">{label}</div>
            <div className="sgc-kpi-value numeric">{value}</div>
          </Link>
        ))}
      </section>

      <nav className="sgc-quicknav" aria-label="Accesos SGC">
        {[
          ['Centro documental', `${SGC_BASE_PATH}/documentos`, 'Documentos maestros, fuente editable y versión oficial.'],
          ['Matriz normativa', `${SGC_BASE_PATH}/normativa`, 'Requisitos 17043/13528 y cobertura documental.'],
          ['Mapa SGC', `${SGC_BASE_PATH}/mapa`, 'Relaciones navegables desde el inventario maestro.'],
        ].map(([label, href, description]) => (
          <Link key={href} href={href} className="group transition hover:bg-[var(--surface-muted)] hover:no-underline">
            <div className="flex items-center justify-between gap-2">
              <span className="group-hover:underline group-hover:underline-offset-4">{label}</span>
              <span aria-hidden="true" className="text-[var(--foreground-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--foreground)]">→</span>
            </div>
            <div className="mt-2 text-xs font-normal text-[var(--foreground-muted)]">{description}</div>
          </Link>
        ))}
      </nav>
    </div>
  )
}
