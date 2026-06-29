import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canEditSgcMaestro, canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { listNormativaSgc, listSgcMaestro, type DocumentoRequisito } from '@/lib/sgc'
import { SgcHeader } from '../SgcHeader'
import { relacionarDocumentoRequisitoAction } from './actions'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function coverageTone(state: string) {
  if (state === 'cubierto') return 'bg-emerald-100 text-emerald-800'
  if (state === 'parcial') return 'bg-amber-100 text-amber-800'
  if (state === 'no_aplica') return 'bg-slate-200 text-slate-700'
  return 'bg-rose-100 text-rose-800'
}

function aggregateCoverage(relaciones: Array<{ estadoCobertura: string }>) {
  if (relaciones.some((relacion) => relacion.estadoCobertura === 'cubierto')) return 'cubierto'
  if (relaciones.some((relacion) => relacion.estadoCobertura === 'parcial')) return 'parcial'
  if (relaciones.length > 0 && relaciones.every((relacion) => relacion.estadoCobertura === 'no_aplica')) return 'no_aplica'
  return 'pendiente'
}

function buildRelacionarHref(params: Record<string, string | string[] | undefined>, requisitoId: string) {
  const query = new URLSearchParams()
  const norma = firstParam(params.norma)
  const estado = firstParam(params.estado)
  if (norma) query.set('norma', norma)
  if (estado) query.set('estado', estado)
  query.set('relacionar', requisitoId)
  return `/dashboard/sgc/normativa?${query.toString()}`
}

function buildNormaHref(params: Record<string, string | string[] | undefined>, norma: string | null) {
  const query = new URLSearchParams()
  const estado = firstParam(params.estado)
  if (norma) query.set('norma', norma)
  if (estado) query.set('estado', estado)
  const suffix = query.toString()
  return suffix ? `/dashboard/sgc/normativa?${suffix}` : '/dashboard/sgc/normativa'
}

function buildPageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const query = new URLSearchParams()
  const norma = firstParam(params.norma)
  const estado = firstParam(params.estado)
  if (norma) query.set('norma', norma)
  if (estado) query.set('estado', estado)
  if (page > 1) query.set('page', String(page))
  const suffix = query.toString()
  return suffix ? `/dashboard/sgc/normativa?${suffix}` : '/dashboard/sgc/normativa'
}

function parsePage(value: string | string[] | undefined) {
  const parsed = Number(firstParam(value) ?? '1')
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

export default async function NormativaSgcPage({ searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')
  const params = (await searchParams) ?? {}
  const estadoCobertura = firstParam(params.estado) as DocumentoRequisito['estadoCobertura'] | undefined
  const selectedNorma = firstParam(params.norma) ?? null
  const selectedRelacionarId = firstParam(params.relacionar) ?? null
  const page = parsePage(params.page)
  const [data, documentosMaestros] = await Promise.all([
    listNormativaSgc({
      norma: selectedNorma,
      estadoCobertura: estadoCobertura ?? null,
      page,
      pageSize: 75,
    }),
    listSgcMaestro(),
  ])
  const canEdit = canEditSgcMaestro(auth)
  const normaCards = data.normas.map((norma) => {
    const rows = data.rows.filter(({ requisito }) => requisito.norma === norma)
    return {
      norma,
      requisitos: rows.length,
      cubiertos: rows.filter(({ relaciones }) => aggregateCoverage(relaciones) === 'cubierto').length,
      parciales: rows.filter(({ relaciones }) => aggregateCoverage(relaciones) === 'parcial').length,
      pendientes: rows.filter(({ relaciones }) => aggregateCoverage(relaciones) === 'pendiente').length,
    }
  })

  return (
    <div className="grid min-w-0 gap-6">
      <SgcHeader
        title="Matriz normativa"
        accent="Requisitos operativos y cobertura documental"
        description="Las relaciones documento-requisito son explicitas y auditables."
        email={auth.user.email}
      />

      {firstParam(params.success) && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{firstParam(params.success)}</div>}
      {firstParam(params.error) && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{firstParam(params.error)}</div>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Requisitos</div><div className="mt-2 text-3xl font-semibold">{data.resumen.requisitos}</div></div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Cubiertos</div><div className="mt-2 text-3xl font-semibold">{data.resumen.cubiertos}</div></div>
        <div className="card-accent border-l-amber-500 bg-amber-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Parciales</div><div className="mt-2 text-3xl font-semibold">{data.resumen.parciales}</div></div>
        <div className="card-accent border-l-rose-500 bg-rose-50/40 px-5 py-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Pendientes</div><div className="mt-2 text-3xl font-semibold">{data.resumen.pendientes}</div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {normaCards.map((card) => {
          const isSelected = selectedNorma === card.norma
          return (
            <Link
              key={card.norma}
              className={`card-accent px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? 'border-l-[var(--pt-primary)] bg-amber-50/50' : 'bg-white/80'}`}
              href={buildNormaHref(params, card.norma)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Norma</div>
                  <div className="mt-2 text-xl font-semibold">{card.norma}</div>
                </div>
                <div className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">{card.requisitos}</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div><div className="font-semibold text-emerald-700">{card.cubiertos}</div><div className="text-[var(--foreground-muted)]">cubiertos</div></div>
                <div><div className="font-semibold text-amber-700">{card.parciales}</div><div className="text-[var(--foreground-muted)]">parciales</div></div>
                <div><div className="font-semibold text-rose-700">{card.pendientes}</div><div className="text-[var(--foreground-muted)]">pendientes</div></div>
              </div>
            </Link>
          )
        })}
      </section>

      <section className="card p-5">
        <form className="grid gap-3 md:grid-cols-3" action="/dashboard/sgc/normativa">
          <select className="input" name="norma" defaultValue={selectedNorma ?? ''}>
            <option value="">Todas las normas</option>
            {data.normas.map((norma) => <option key={norma} value={norma}>{norma}</option>)}
          </select>
          <select className="input" name="estado" defaultValue={estadoCobertura ?? ''}>
            <option value="">Todos los estados</option>
            <option value="cubierto">Cubierto</option>
            <option value="parcial">Parcial</option>
            <option value="pendiente">Pendiente</option>
            <option value="no_aplica">No aplica</option>
          </select>
          <button className="btn-primary" type="submit">Filtrar</button>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] px-4 py-3 text-sm text-[var(--foreground-muted)] md:flex-row md:items-center md:justify-between">
          <div>
            Mostrando pagina <span className="font-semibold text-[var(--foreground)]">{data.pagination.page}</span> de{' '}
            <span className="font-semibold text-[var(--foreground)]">{data.pagination.totalPages}</span>
            {' '}({data.pagination.totalRows} requisitos filtrados)
          </div>
          <div className="flex gap-2">
            {data.pagination.hasPreviousPage ? (
              <Link className="btn-outline text-xs" href={buildPageHref(params, data.pagination.page - 1)}>Anterior</Link>
            ) : (
              <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)]">Anterior</span>
            )}
            {data.pagination.hasNextPage ? (
              <Link className="btn-outline text-xs" href={buildPageHref(params, data.pagination.page + 1)}>Siguiente</Link>
            ) : (
              <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)]">Siguiente</span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-soft)] text-sm">
            <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
              <tr>
                <th className="px-4 py-3">Norma</th>
                <th className="px-4 py-3">Clausula</th>
                <th className="px-4 py-3">Requisito</th>
                <th className="px-4 py-3">Criticidad</th>
                <th className="px-4 py-3">Cobertura</th>
                <th className="px-4 py-3">Documentos</th>
                <th className="px-4 py-3">Relacionar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {data.rows.map(({ requisito, relaciones, documentos }) => {
                const coverage = aggregateCoverage(relaciones)
                const isSelectedForRelation = selectedRelacionarId === requisito._id
                return (
                  <tr key={requisito._id} className="align-top hover:bg-white/60">
                    <td className="px-4 py-3 font-semibold">{requisito.norma} {requisito.versionNorma}</td>
                    <td className="px-4 py-3">{requisito.clausula}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{requisito.titulo}</div>
                      <p className="mt-1 max-w-3xl text-xs text-[var(--foreground-muted)]">{requisito.descripcion}</p>
                    </td>
                    <td className="px-4 py-3">{requisito.criticidad}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coverageTone(coverage)}`}>{coverage}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {documentos.map((doc) => <Link key={doc._id} className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[var(--pt-primary-dark)]" href={`/dashboard/sgc/documentos/${doc._id}`}>{doc.codigo}</Link>)}
                        {documentos.length === 0 && <span className="text-rose-700">Sin relacion verificada</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {!canEdit && <span className="text-xs text-[var(--foreground-muted)]">Solo consulta</span>}
                      {canEdit && !isSelectedForRelation && (
                        <Link className="btn-outline text-xs" href={buildRelacionarHref(params, requisito._id)}>
                          Relacionar
                        </Link>
                      )}
                      {canEdit && isSelectedForRelation && (
                        <form action={relacionarDocumentoRequisitoAction} className="grid min-w-72 gap-2">
                          <input type="hidden" name="requisito_id" value={requisito._id} />
                          <select className="input text-xs" name="documento_id" defaultValue={documentosMaestros.documentos[0]?._id ?? ''} required>
                            {documentosMaestros.documentos.map((doc) => (
                              <option key={doc._id} value={doc._id}>{doc.codigo} · {doc.nombre}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <select className="input text-xs" name="tipo_cobertura" defaultValue="cubre">
                              <option value="cubre">Cubre</option>
                              <option value="apoya">Apoya</option>
                              <option value="evidencia">Evidencia</option>
                              <option value="no_aplica_justificado">No aplica justificado</option>
                            </select>
                            <select className="input text-xs" name="estado_cobertura" defaultValue="cubierto">
                              <option value="cubierto">Cubierto</option>
                              <option value="parcial">Parcial</option>
                              <option value="pendiente">Pendiente</option>
                              <option value="no_aplica">No aplica</option>
                            </select>
                          </div>
                          <input className="input text-xs" name="responsable" placeholder="Responsable" />
                          <input className="input text-xs" name="fecha_revision" type="date" />
                          <input className="input text-xs" name="observacion" placeholder="Observacion" />
                          <button className="btn-outline justify-self-start text-xs" type="submit">Guardar cobertura</button>
                        </form>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data.rows.length === 0 && <div className="p-8 text-center text-sm text-[var(--foreground-muted)]">Sin requisitos para los filtros seleccionados.</div>}
      </section>
    </div>
  )
}
