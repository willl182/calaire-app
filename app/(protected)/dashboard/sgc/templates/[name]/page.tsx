import { notFound, redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/lib/auth'
import {
  isP20TemplateName,
  readTemplate,
  renderTemplate,
} from '@/lib/sgc/templates'

const TITLES: Record<string, string> = {
  convocatoria: 'Convocatoria',
  'recordatorio-ficha': 'Recordatorio ficha de inscripcion',
  'recordatorio-envio-resultados': 'Recordatorio envio de resultados',
  'publicacion-resultados': 'Publicacion de resultados',
  'cierre-ronda': 'Cierre de ronda',
}

export default async function TemplateGlobalViewPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const { name } = await params
  if (!isP20TemplateName(name)) {
    notFound()
  }

  const templateRaw = readTemplate(name)
  const vars = {
    ronda_codigo: '[CODIGO RONDA]',
    ronda_nombre: '[NOMBRE RONDA]',
    fecha_limite: '[FECHA LIMITE]',
    participante_nombre: '[NOMBRE PARTICIPANTE]',
    laboratorio_nombre: '[NOMBRE LABORATORIO]',
    link_ronda: '[LINK RONDA]',
    contacto_soporte: '[CONTACTO SOPORTE]',
  }
  const rendered = renderTemplate(templateRaw, vars)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Plantilla P-20 global
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {TITLES[name] ?? name}
        </h1>
      </header>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Vista previa
        </p>
        <pre className="whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">
          {rendered}
        </pre>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Nota:</strong> los campos marcados con corchetes deben reemplazarse
        manualmente. Para generar una version con variables de una ronda especifica,
        use el panel SGC de la ronda.
      </div>
    </div>
  )
}
