import { redirect } from 'next/navigation'

import { canViewSgcMaestro, requireAuth } from '@/lib/auth'

export default async function MapaSgcPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

  return (
    <div className="min-w-0">
      <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
        <iframe
          className="h-[calc(100vh-10.5rem)] min-h-[760px] w-full bg-white"
          src="/sgc/mapa_navegacion_sgc_pea.html"
          title="Mapa interactivo de navegación del SGC"
        />
      </section>
    </div>
  )
}
