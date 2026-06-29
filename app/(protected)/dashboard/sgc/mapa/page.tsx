import { redirect } from 'next/navigation'

import { canViewSgcMaestro, requireAuth } from '@/lib/auth'

export default async function MapaSgcPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

  return (
    <div className="relative left-1/2 min-w-0 w-[calc(100vw-4rem)] -translate-x-1/2">
      <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
        <iframe
          className="h-[calc(100vh-9rem)] min-h-[780px] w-full bg-white"
          src="/sgc/mapa_navegacion_sgc_pea.html"
          title="Mapa interactivo de navegación del SGC"
        />
      </section>
    </div>
  )
}
