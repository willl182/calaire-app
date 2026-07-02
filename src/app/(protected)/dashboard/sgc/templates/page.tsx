import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin, requireAuth } from '@/server/auth'
import { P20_TEMPLATE_NAMES } from '@/server/sgc/templates'

const TITLES: Record<string, string> = {
  convocatoria: 'Convocatoria',
  'recordatorio-ficha': 'Recordatorio ficha de inscripcion',
  'recordatorio-envio-resultados': 'Recordatorio envio de resultados',
  'publicacion-resultados': 'Publicacion de resultados',
  'cierre-ronda': 'Cierre de ronda',
}

export default async function TemplatesGlobalPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Plantillas P-20</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Plantillas globales de comunicacion. Seleccione una ronda para personalizar variables.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {P20_TEMPLATE_NAMES.map((name) => (
          <div key={name} className="card p-5 space-y-3">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{TITLES[name] ?? name}</h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              Plantilla {name}. Disponible para personalizar por ronda.
            </p>
            <Link
              href={`/dashboard/sgc/templates/${name}`}
              className="btn-outline text-sm inline-block"
            >
              Ver plantilla global
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
