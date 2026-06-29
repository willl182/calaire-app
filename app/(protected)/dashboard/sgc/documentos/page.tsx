import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canEditSgcMaestro, canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { listSgcMaestro, type DocumentoSgc } from '@/lib/sgc'
import { guardarDocumentoMaestroAction } from './actions'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function estadoTone(estado: string) {
  if (estado === 'vigente') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'en_revision') return 'bg-amber-100 text-amber-800'
  if (estado === 'obsoleto') return 'bg-slate-200 text-slate-700'
  return 'bg-rose-100 text-rose-800'
}

function versionFor(doc: DocumentoSgc, versiones: Awaited<ReturnType<typeof listSgcMaestro>>['versiones']) {
  return versiones.find((item) => item.documentoId === doc._id)
}

export default async function CentroDocumentalPage({ searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

  const params = (await searchParams) ?? {}
  const data = await listSgcMaestro({
    ambito: firstParam(params.ambito) ?? null,
    familia: (firstParam(params.familia) as DocumentoSgc['familia']) ?? null,
    estado: (firstParam(params.estado) as DocumentoSgc['estado']) ?? null,
    modoDiligenciamiento: (firstParam(params.modo) as DocumentoSgc['modoDiligenciamiento']) ?? null,
    texto: firstParam(params.q) ?? null,
  })
  const canEdit = canEditSgcMaestro(auth)

  return (
    <div className="grid min-w-0 gap-6">
      <header className="header-bar px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">SGC CALAIRE</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Centro documental</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Inventario maestro persistido. Las versiones oficiales, registros, normativa y mapa leen estos mismos documentos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-outline" href="/dashboard/sgc/normativa">Matriz normativa</Link>
            <Link className="btn-outline" href="/dashboard/sgc/mapa">Mapa SGC</Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Documentos</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.total}</div>
        </div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Vigentes</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.vigentes}</div>
        </div>
        <div className="card-accent border-l-amber-500 bg-amber-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">En revision</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.enRevision}</div>
        </div>
        <div className="card-accent border-l-rose-500 bg-rose-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Sin version</div>
          <div className="numeric mt-2 text-3xl font-semibold">{data.resumen.sinVersion}</div>
        </div>
      </section>

      <section className="card p-5">
        <form className="grid gap-3 md:grid-cols-5" action="/dashboard/sgc/documentos">
          <input className="input md:col-span-2" name="q" placeholder="Codigo o nombre" defaultValue={firstParam(params.q) ?? ''} />
          <select className="input" name="familia" defaultValue={firstParam(params.familia) ?? ''}>
            <option value="">Todas las familias</option>
            {data.familias.map((familia) => <option key={familia} value={familia}>{familia}</option>)}
          </select>
          <select className="input" name="estado" defaultValue={firstParam(params.estado) ?? ''}>
            <option value="">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="en_revision">En revision</option>
            <option value="borrador">Borrador</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
          <button className="btn-primary" type="submit">Filtrar</button>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-soft)] text-sm">
            <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
              <tr>
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Ambito</th>
                <th className="px-4 py-3">Familia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Modo</th>
                <th className="px-4 py-3">Fuente editable</th>
                <th className="px-4 py-3">Version oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {data.documentos.map((doc) => {
                const version = versionFor(doc, data.versiones)
                return (
                  <tr key={doc._id} className="align-top hover:bg-white/60">
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                      <Link href={`/dashboard/sgc/documentos/${doc._id}`} className="underline-offset-4 hover:underline">{doc.codigo}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{doc.nombre}</div>
                      <div className="text-xs text-[var(--foreground-muted)]">{doc.proceso}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{doc.ambito ?? 'Sin ambito'}</td>
                    <td className="px-4 py-3">{doc.familia ?? 'OTRO'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoTone(doc.estado)}`}>{doc.estado}</span></td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{doc.modoDiligenciamiento ?? 'no_diligenciable'}</td>
                    <td className="px-4 py-3">
                      {doc.fuenteEditableUrl ? <a className="text-[var(--pt-primary-dark)] underline" href={doc.fuenteEditableUrl} target="_blank" rel="noreferrer">Editar externo</a> : <span className="text-[var(--foreground-muted)]">No registrada</span>}
                    </td>
                    <td className="px-4 py-3">
                      {version?.vigente ? `v${version.vigente.version} · ${version.vigente.fileName ?? 'archivo oficial'}` : <span className="text-rose-700">Sin version</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data.documentos.length === 0 && <div className="p-8 text-center text-sm text-[var(--foreground-muted)]">No hay documentos para los filtros seleccionados.</div>}
      </section>

      {canEdit && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold">Crear documento maestro</h2>
          <form action={guardarDocumentoMaestroAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <input className="input" name="codigo" placeholder="Codigo" required />
            <input className="input md:col-span-2" name="nombre" placeholder="Nombre" required />
            <select className="input" name="familia" defaultValue="F">
              <option value="DG">DG</option>
              <option value="P">P</option>
              <option value="I">I</option>
              <option value="F">F</option>
              <option value="OTRO">OTRO</option>
            </select>
            <input className="input" name="ambito" defaultValue="PEA / ISO 17043" />
            <input className="input" name="proceso" defaultValue="SGC" />
            <select className="input" name="estado" defaultValue="borrador">
              <option value="borrador">Borrador</option>
              <option value="en_revision">En revision</option>
              <option value="vigente">Vigente</option>
              <option value="obsoleto">Obsoleto</option>
            </select>
            <select className="input" name="modo_diligenciamiento" defaultValue="solo_archivo">
              <option value="no_diligenciable">No diligenciable</option>
              <option value="solo_archivo">Solo archivo</option>
              <option value="ui_nativo">UI nativo</option>
              <option value="ui_nativo_exportable">UI nativo exportable</option>
            </select>
            <select className="input" name="visibilidad" defaultValue="interna">
              <option value="interna">Interna</option>
              <option value="participantes">Participantes</option>
              <option value="publica">Publica</option>
            </select>
            <select className="input" name="modo_control" defaultValue="app_oficial">
              <option value="app_oficial">App oficial</option>
              <option value="mixto">Mixto</option>
              <option value="externo_referenciado">Externo referenciado</option>
            </select>
            <input className="input" name="responsable" placeholder="Responsable" />
            <input className="input md:col-span-2" name="fuente_editable_url" placeholder="URL editable opcional" />
            <textarea className="input md:col-span-3" name="notas" placeholder="Notas" rows={3} />
            <button className="btn-primary justify-self-start" type="submit">Guardar documento</button>
          </form>
        </section>
      )}
    </div>
  )
}
