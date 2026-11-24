import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { isAdmin, requireAuth } from '@/server/auth'
import { getPanelSgc } from '@/server/sgc'
import { PlanRondaForm } from '../SgcRegistroDiligenciable'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/** F-PSEA-06 a pantalla completa (DIAG 2.6): el formulario no cabe en el panel lateral. */
export default async function PlanRondaPage({ params, searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')
  const { id } = await params
  const query = searchParams ? await searchParams : {}
  const panel = await getPanelSgc(id)
  if (!panel) notFound()
  const success = first(query.success)
  const error = first(query.error)

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">F-PSEA-06 · {panel.ronda.codigo}</p>
          <h1 className="text-2xl font-bold">Planificación de ronda EA</h1>
        </div>
        <Link className="btn-outline" href={`/dashboard/rondas/${id}/sgc#doc-F-PSEA-06`}>Volver al expediente</Link>
      </div>
      {success && <Alert tone="success" message={success} />}
      {error && <Alert tone="error" message={error} />}
      <PlanRondaForm panel={panel} rondaId={id} completa />
    </main>
  )
}
