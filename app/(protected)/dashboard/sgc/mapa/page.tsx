import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { normalizeHttpUrl } from '@/lib/safe-url'
import { listMapaSgc } from '@/lib/sgc'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function relationTone(type: string) {
  if (type === 'externo') return 'border-amber-300 bg-amber-50 text-amber-900'
  if (type === 'usa') return 'border-emerald-300 bg-emerald-50 text-emerald-900'
  if (type === 'genera') return 'border-sky-300 bg-sky-50 text-sky-900'
  return 'border-[var(--border-soft)] bg-white text-[var(--foreground)]'
}

export default async function MapaSgcPage({ searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')
  const params = (await searchParams) ?? {}
  const selectedAmbito = firstParam(params.ambito) ?? null
  const data = await listMapaSgc({ ambito: selectedAmbito })
  const docsById = new Map(data.documentos.map((doc) => [doc._id, doc]))

  return (
    <div className="grid min-w-0 gap-6">
      <header className="header-bar px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">SGC CALAIRE</p>
            <h1 className="mt-1 text-2xl font-semibold">Mapa SGC vivo</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Navegacion documental alimentada por relaciones persistidas. El HTML original queda disponible como referencia visual.
            </p>
          </div>
          <a className="btn-outline" href="/sgc/mapa_navegacion_sgc_pea.html" target="_blank" rel="noreferrer">Abrir HTML original ↗</a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-accent px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Relaciones</div><div className="mt-2 text-3xl font-semibold">{data.relaciones.length}</div></div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Bloques</div><div className="mt-2 text-3xl font-semibold">{data.bloques.length}</div></div>
        <div className="card-accent border-l-rose-500 bg-rose-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Pendientes</div><div className="mt-2 text-3xl font-semibold">{data.pendientes}</div></div>
      </section>

      <section className="card p-5">
        <form className="grid gap-3 md:grid-cols-3" action="/dashboard/sgc/mapa">
          <select className="input md:col-span-2" name="ambito" defaultValue={selectedAmbito ?? ''}>
            <option value="">Todos los ambitos</option>
            {data.ambitos.map((ambito) => <option key={ambito} value={ambito}>{ambito}</option>)}
          </select>
          <button className="btn-primary" type="submit">Filtrar</button>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {data.bloques.map((bloque) => {
          const relaciones = data.relaciones.filter((relacion) => relacion.bloque === bloque)
          return (
            <article key={bloque} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{bloque}</h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{relaciones.length} nodos y relaciones</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {relaciones.map((relacion) => {
                  const origin = relacion.documentoOrigenId ? docsById.get(relacion.documentoOrigenId) : null
                  const target = relacion.documentoDestinoId ? docsById.get(relacion.documentoDestinoId) : null
                  const externalUrl = normalizeHttpUrl(relacion.externalUrl)
                  return (
                    <div key={relacion._id} className={`rounded-lg border p-4 ${relationTone(relacion.tipoRelacion)}`}>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {origin ? (
                          <Link className="font-semibold underline-offset-4 hover:underline" href={`/dashboard/sgc/documentos/${origin._id}`}>{origin.codigo}</Link>
                        ) : (
                          <span className="font-semibold">{relacion.origenCodigo}</span>
                        )}
                        <span className="text-xs uppercase tracking-[0.12em] opacity-70">{relacion.tipoRelacion}</span>
                        {target ? (
                          <Link className="font-semibold underline-offset-4 hover:underline" href={`/dashboard/sgc/documentos/${target._id}`}>{target.codigo}</Link>
                        ) : relacion.externalSystem === 'pt_app' && externalUrl ? (
                          <a className="font-semibold underline-offset-4 hover:underline" href={externalUrl} target="_blank" rel="noreferrer">pt_app externo ↗</a>
                        ) : relacion.externalSystem === 'pt_app' ? (
                          <span className="font-semibold">pt_app externo</span>
                        ) : relacion.destinoCodigo ? (
                          <span className="font-semibold">{relacion.destinoCodigo}</span>
                        ) : (
                          <span className="text-[var(--foreground-muted)]">nodo documental</span>
                        )}
                      </div>
                      {relacion.rutaCritica && <div className="mt-2 text-xs opacity-75">Ruta critica: {relacion.rutaCritica}</div>}
                      <div className="mt-2 text-xs opacity-75">Estado: {relacion.estadoResolucion} · Destino: {relacion.destinoTipo}</div>
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
