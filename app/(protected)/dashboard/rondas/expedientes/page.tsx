import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { listExpedientesSgc } from '@/lib/sgc'

function statusTone(status: string) {
  if (status === 'cerrada') return 'bg-slate-200 text-slate-700'
  if (status === 'activa') return 'bg-emerald-100 text-emerald-800'
  if (status === 'documentacion_pendiente') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

export default async function ExpedientesSgcPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')
  const expedientes = await listExpedientesSgc()

  return (
    <div className="grid min-w-0 gap-6">
      <header className="header-bar px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Gestion · expediente documental operativo</p>
        <h1 className="mt-1 text-2xl font-semibold">Expedientes de ronda</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--foreground-muted)]">
          Dashboard operativo de expedientes por ronda. No es el dashboard SGC maestro global; solo enlaza a los paneles documentales de cada ronda.
        </p>
      </header>

      <section className="grid gap-4">
        {expedientes.map((item) => (
          <article key={item.ronda._id} className="card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{item.ronda.codigo}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(item.ronda.estado)}`}>{item.ronda.estado}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{item.ronda.nombre}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 w-56 max-w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${item.progreso}%` }} />
                  </div>
                  <span className="text-sm font-semibold">{item.progreso}%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--foreground-muted)]">
                  <span className="rounded-full bg-white px-2 py-1">{item.evidenciasVigentes} evidencias vigentes</span>
                  <span className="rounded-full bg-white px-2 py-1">{item.registros} registros derivados</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="btn-primary" href={`/dashboard/rondas/${item.ronda._id}/sgc`}>Abrir expediente documental</Link>
                <Link className="btn-outline" href={`/dashboard/rondas/${item.ronda._id}`}>Abrir Gestion</Link>
              </div>
            </div>
            {item.faltantesCriticos.length > 0 && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
                <div className="text-sm font-semibold text-rose-900">Faltantes criticos</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-800">
                  {item.faltantesCriticos.map((faltante) => <li key={faltante}>{faltante}</li>)}
                </ul>
              </div>
            )}
            {item.externalRefs.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-900">Referencias externas</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.externalRefs.map((ref) => (
                    <a key={`${ref.label}-${ref.url}`} className="btn-outline text-xs" href={ref.url ?? '#'} target="_blank" rel="noreferrer">{ref.label} ↗</a>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
        {expedientes.length === 0 && <div className="card p-8 text-center text-sm text-[var(--foreground-muted)]">No hay rondas reales registradas.</div>}
      </section>
    </div>
  )
}
