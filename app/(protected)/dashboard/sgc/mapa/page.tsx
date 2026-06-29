import { redirect } from 'next/navigation'
import { signOut } from '@workos-inc/authkit-nextjs'

import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { SgcHeader } from '../SgcHeader'

export default async function MapaSgcPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

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
      <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
        <iframe
          className="h-[calc(100vh-19rem)] min-h-[680px] w-full bg-white"
          src="/sgc/mapa_navegacion_sgc_pea.html"
          title="Mapa interactivo de navegación del SGC"
        />
      </section>
    </div>
  )
}
