import { redirect } from 'next/navigation'
import { signOut } from '@workos-inc/authkit-nextjs'

import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { canViewSgcMaestro, requireAuth } from '@/server/auth'
import { listMapaSgcWithStatus } from '@/server/sgc'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { SgcHeader } from '@/components/ui/SgcHeader'

export default async function MapaSgcPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')
  const mapa = await listMapaSgcWithStatus()

  return (
    <div className="grid min-w-0 gap-6">
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

      {mapa.data.relaciones.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
          <iframe
            className="h-[calc(100vh-19rem)] min-h-[680px] w-full bg-white"
            src="/dashboard/sgc/mapa/embed"
            title="Mapa interactivo de navegación del SGC"
          />
        </section>
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
