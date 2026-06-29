import { redirect } from 'next/navigation'

import { canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { SgcHeader } from '../../dashboard/sgc/SgcHeader'

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
      />

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold">Mapa interactivo original embebido</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Vista completa del mapa de navegación documental SGC PEA dentro de calaire-app.
          </p>
        </div>
        <iframe
          className="h-[820px] w-full bg-white"
          src="/sgc/mapa_navegacion_sgc_pea.html"
          title="Mapa interactivo de navegación del SGC"
        />
      </section>
    </div>
  )
}
