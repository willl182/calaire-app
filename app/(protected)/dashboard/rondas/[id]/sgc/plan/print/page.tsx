import { notFound, redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/lib/auth'
import { getRonda } from '@/lib/rondas'
import { getPanelSgc } from '@/lib/sgc'
import { SGC_LEYENDA_CODIGO_PROVISIONAL } from '@/lib/sgc/catalog'

type PageProps = { params: Promise<{ id: string }> }

function fmt(ms?: number | null) {
  return ms ? new Date(ms).toLocaleString('es-CO') : 'Sin fecha'
}

export default async function PlanRondaPrintPage({ params }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')
  const { id } = await params
  const ronda = await getRonda(id)
  const panel = await getPanelSgc(id)
  if (!ronda || !panel) notFound()
  const plan = panel.plan

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-10 text-slate-950 print:px-0">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">F-PPSEA-03 / F-PSEA-06</p>
      <h1 className="mt-2 text-3xl font-semibold">Plan de ronda {ronda.codigo}</h1>
      <p className="mt-1 text-slate-600">{ronda.nombre}</p>
      <div className="mt-6 grid gap-3 border-y border-slate-200 py-4 text-sm sm:grid-cols-2">
        <div><strong>Estado documental:</strong> {plan?.estado ?? 'borrador'}</div>
        <div><strong>Responsable:</strong> {plan?.camposEstructurados?.responsable ?? 'Sin responsable'}</div>
        <div><strong>Fecha plan:</strong> {plan?.camposEstructurados?.fecha_plan ?? 'Sin fecha'}</div>
        <div><strong>Finalizado:</strong> {fmt(plan?.finalizadoAt)}</div>
        <div><strong>Finalizado por:</strong> {plan?.finalizadoBy ?? 'No finalizado'}</div>
        <div><strong>Snapshot/version:</strong> ver bitacora SGC</div>
      </div>
      <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900">
        {SGC_LEYENDA_CODIGO_PROVISIONAL}
      </p>
      <section className="mt-8 space-y-5">
        {Object.entries(plan?.bloques ?? {}).map(([key, value]) => (
          <article key={key}>
            <h2 className="text-lg font-semibold uppercase">Bloque {key}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || 'Sin contenido registrado.'}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
