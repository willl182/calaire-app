import Link from 'next/link'
import { redirect } from 'next/navigation'

import { canViewSgcMaestro, requireAuth } from '@/server/auth'
import { listMapaSgc, listNormativaSgc, listSgcMaestro } from '@/server/sgc'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import { isConvexOffline } from '@/lib/convex-fallback'

export default async function SgcPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

  let backendOffline = false
  let documentos: Awaited<ReturnType<typeof listSgcMaestro>> | null = null
  let normativa: Awaited<ReturnType<typeof listNormativaSgc>> | null = null
  let mapa: Awaited<ReturnType<typeof listMapaSgc>> | null = null

  try {
    const [d, n, m] = await Promise.all([listSgcMaestro(), listNormativaSgc(), listMapaSgc()])
    documentos = d
    normativa = n
    mapa = m
  } catch (error) {
    if (!isConvexOffline(error)) throw error
    backendOffline = true
  }

  return (
    <SgcView
      email={auth.user.email}
      documentos={documentos}
      normativa={normativa}
      mapa={mapa}
      backendOffline={backendOffline}
    />
  )
}

type SgcViewProps = {
  email: string
  documentos: Awaited<ReturnType<typeof listSgcMaestro>> | null
  normativa: Awaited<ReturnType<typeof listNormativaSgc>> | null
  mapa: Awaited<ReturnType<typeof listMapaSgc>> | null
  backendOffline: boolean
}

function SgcView({ email, documentos, normativa, mapa, backendOffline }: SgcViewProps) {
  const totalDocumentos = documentos?.resumen.total ?? 0
  const vigentes = documentos?.resumen.vigentes ?? 0
  const sinVersion = documentos?.resumen.sinVersion ?? 0
  const requisitos = normativa?.resumen.requisitos ?? 0
  const relaciones = mapa?.relaciones.length ?? 0
  const pendientes = mapa?.pendientes ?? 0

  return (
    <div className="grid min-w-0 gap-6">
      <SgcHeader
        title={<>SGC Maestro <span className="font-medium text-[var(--foreground-muted)]">CALAIRE</span></>}
        accent="Repositorio global de documentos, versiones, requisitos y mapa documental"
        description="Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín"
        email={email}
      />

      {backendOffline && (
        <BackendOfflineBanner detail="Los contadores se muestran en cero hasta que el backend responda." />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Documentos maestros</div><div className="mt-2 text-3xl font-semibold">{totalDocumentos}</div><div className="mt-1 text-xs text-[var(--foreground-muted)]">{vigentes} vigentes</div></div>
        <div className="card-accent border-l-amber-500 bg-amber-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Sin version oficial</div><div className="mt-2 text-3xl font-semibold">{sinVersion}</div><div className="mt-1 text-xs text-[var(--foreground-muted)]">Pendientes de archivo congelado</div></div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Requisitos</div><div className="mt-2 text-3xl font-semibold">{requisitos}</div><div className="mt-1 text-xs text-[var(--foreground-muted)]">Normativa cargada</div></div>
        <div className="card-accent border-l-sky-500 bg-sky-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Relaciones mapa</div><div className="mt-2 text-3xl font-semibold">{relaciones}</div><div className="mt-1 text-xs text-[var(--foreground-muted)]">{pendientes} pendientes</div></div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Centro documental', '/sgc/documentos', 'Documentos maestros, fuente editable y version oficial.'],
          ['Matriz normativa', '/sgc/normativa', 'Requisitos 17043/13528 y cobertura documental.'],
          ['Mapa SGC', '/sgc/mapa', 'Relaciones navegables desde el inventario maestro.'],
        ].map(([label, href, description]) => (
          <Link key={href} href={href} className="card-accent px-5 py-4 hover:no-underline">
            <div className="text-sm font-semibold text-[var(--foreground)]">{label}</div>
            <div className="mt-2 text-xs text-[var(--foreground-muted)]">{description}</div>
          </Link>
        ))}
      </section>
    </div>
  )
}
