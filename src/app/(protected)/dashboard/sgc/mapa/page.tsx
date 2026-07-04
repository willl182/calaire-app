import { redirect } from 'next/navigation'
import { signOut } from '@workos-inc/authkit-nextjs'

import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { canViewSgcMaestro, requireAuth } from '@/server/auth'
import { listMapaSgcWithStatus } from '@/server/sgc'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'
import { MapaSgcFrame } from './MapaSgcFrame'

export default async function MapaSgcPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')
  const mapa = await listMapaSgcWithStatus()
  const documentosConRelacion = new Set(
    mapa.data.relaciones.flatMap((relacion) => [
      relacion.documentoOrigenId,
      relacion.documentoDestinoId,
    ]).filter(Boolean)
  ).size

  return (
    <div className="app-workspace min-w-0">
      <SgcHeader
        title="Mapa SGC vivo"
        accent="Navegación documental del inventario maestro"
        description="Relaciones entre documentos, registros, requisitos y sistemas externos."
        email={auth.user.email}
        actions={
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
        }
      />
      {mapa.offline && (
        <BackendOfflineBanner detail="El mapa SGC se muestra sin relaciones mientras Convex no responde." />
      )}

      <section className="sgc-kpis">
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Relaciones</div>
          <div className="sgc-kpi-value numeric">{mapa.data.relaciones.length}</div>
        </div>
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Documentos</div>
          <div className="sgc-kpi-value numeric">{documentosConRelacion || mapa.data.documentos.length}</div>
        </div>
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Bloques</div>
          <div className="sgc-kpi-value numeric">{mapa.data.bloques.length}</div>
        </div>
        <div className="sgc-kpi bg-amber-50/50">
          <div className="sgc-kpi-label">Pendientes</div>
          <div className="sgc-kpi-value numeric">{mapa.data.pendientes}</div>
        </div>
      </section>

      {mapa.data.relaciones.length > 0 ? (
        <MapaSgcFrame src="/dashboard/sgc/mapa/embed" title="Mapa interactivo de navegación del SGC" />
      ) : (
        <section className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Mapa SGC sin relaciones</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
            {mapa.offline
              ? 'No se pudieron cargar relaciones documentales porque Convex no esta disponible.'
              : 'Todavia no hay relaciones documentales registradas para construir el mapa.'}
          </p>
        </section>
      )}
    </div>
  )
}
