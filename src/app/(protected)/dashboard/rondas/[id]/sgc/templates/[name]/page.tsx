import { notFound, redirect } from 'next/navigation'
import { env } from '@/env'
import { isAdmin, requireAuth } from '@/server/auth'
import { getRonda } from '@/server/rondas'
import {
  buildTemplateVars,
  isP20TemplateName,
  readTemplate,
  renderTemplate,
} from '@/server/sgc/templates'
import { CopyButton } from './CopyButton'

 type PageProps = {
  params: Promise<{ id: string; name: string }>
}

const TITLES: Record<string, string> = {
  convocatoria: 'Convocatoria',
  'recordatorio-ficha': 'Recordatorio ficha de inscripcion',
  'recordatorio-envio-resultados': 'Recordatorio envio de resultados',
  'publicacion-resultados': 'Publicacion de resultados',
  'cierre-ronda': 'Cierre de ronda',
}

export default async function TemplateViewPage({ params }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const { id, name } = await params

  if (!isP20TemplateName(name)) {
    notFound()
  }

  const ronda = await getRonda(id)
  if (!ronda) {
    notFound()
  }

  const templateRaw = readTemplate(name)
  const vars = buildTemplateVars(
    { codigo: ronda.codigo, nombre: ronda.nombre },
    env.NEXT_PUBLIC_APP_URL ?? 'https://calaire.org'
  )
  const rendered = renderTemplate(templateRaw, vars)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Plantilla P-20
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {TITLES[name] ?? name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ronda {ronda.codigo} — {ronda.nombre}
          </p>
        </div>
        <CopyButton text={rendered} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Vista previa
        </p>
        <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {rendered}
        </pre>
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Nota:</strong> los campos marcados con corchetes (ej.{' '}
        <code>[FECHA LIMITE — COMPLETAR]</code>) deben reemplazarse manualmente
        antes de enviar. En Fase 1 no hay envio automatico de correos.
      </div>
    </main>
  )
}
