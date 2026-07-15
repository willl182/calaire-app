import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { requireAuth } from '@/server/auth'
import { getMyPtCases, getMyPtCertificate, getMyPtResults, getRondaByCodigo } from '@/server/rondas'

import { ResultsExplorer } from './ResultsExplorer'

const CASE_STATUS_LABELS = {
  abierto: 'Pendiente de análisis',
  en_revision: 'En revisión por Calaire',
  esperando_participante: 'Ajustes requeridos',
  resuelto: 'En espera de verificación',
  cerrado: 'Cerrado',
} as const

export default async function ParticipantResultsPage({ params }: { params: Promise<{ codigo: string }> }) {
  await requireAuth()
  const { codigo } = await params
  const ronda = await getRondaByCodigo(codigo)
  if (!ronda) notFound()

  const data = await getMyPtResults(ronda.id)
  if (data.estado !== 'publicada') redirect(`/ronda/${codigo}`)

  const [certificate, cases] = await Promise.all([
    getMyPtCertificate(ronda.id),
    getMyPtCases(ronda.id),
  ])
  const satisfactory = data.resultados.filter((row) => row.clasificacion === 'satisfactorio').length
  const nonSatisfactory = data.resultados.length - satisfactory
  const improvementCase = cases.find((item) => item.tipo === 'nc_capa')

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="header-bar px-8 py-6">
          <Link href={`/ronda/${codigo}`} className="text-sm font-medium text-sky-700">← Volver a la ronda</Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--pt-primary-dark)]">Evaluación publicada</p>
          <h1 className="mt-1 text-2xl font-bold">Resultados · {ronda.codigo}</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {data.publicadaAt ? `Publicados el ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(data.publicadaAt))}. ` : ''}
            La clasificación y los estadísticos son la decisión oficial importada.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen de resultados">
          <div className="card p-5"><div className="text-sm text-slate-500">Resultados</div><div className="mt-1 text-3xl font-bold">{data.resultados.length}</div></div>
          <div className="card p-5"><div className="text-sm text-slate-500">Satisfactorios</div><div className="mt-1 text-3xl font-bold text-emerald-700">{satisfactory}</div></div>
          <div className="card p-5"><div className="text-sm text-slate-500">No satisfactorios</div><div className="mt-1 text-3xl font-bold text-red-700">{nonSatisfactory}</div></div>
        </section>

        {nonSatisfactory > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950" aria-labelledby="improvement-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="improvement-title" className="font-semibold">Expediente de mejora</h2>
                <p className="mt-1 text-sm">
                  {improvementCase
                    ? `Estado: ${CASE_STATUS_LABELS[improvementCase.estado]}.`
                    : 'La creación del expediente está en proceso. Los resultados ya son definitivos.'}
                </p>
              </div>
              <Link className="btn-secondary w-fit" href={improvementCase ? `/ronda/${codigo}/casos/${improvementCase._id}` : `/ronda/${codigo}/casos`}>
                {improvementCase ? 'Abrir expediente' : 'Ver casos'}
              </Link>
            </div>
          </section>
        )}

        <section className="card p-5" aria-labelledby="downloads-title">
          <h2 id="downloads-title" className="font-semibold">Descargas</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a className="btn-primary" href={`/ronda/${codigo}/resultados/informe`}>Informe general PDF</a>
            <a className="btn-outline" href={`/ronda/${codigo}/resultados/propios.csv`}>Mi evaluación CSV</a>
            {certificate?.estado === 'generado' && <a className="btn-outline" href={`/ronda/${codigo}/resultados/certificado`}>Certificado de participación</a>}
            {certificate && certificate.estado !== 'generado' && (
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">Certificado: {certificate.estado}</span>
            )}
          </div>
        </section>

        <section className="card p-6" aria-labelledby="detail-title">
          <div className="mb-5">
            <h2 id="detail-title" className="text-lg font-bold">Detalle de la evaluación</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">Filtre por contaminante, nivel o método y seleccione el estadístico que desea consultar.</p>
          </div>
          <ResultsExplorer results={data.resultados} />
        </section>
      </div>
    </main>
  )
}
