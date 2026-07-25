import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canEditSgcMaestro, isAdmin, requireAuth } from '@/server/auth'
import { getExportacionInstrumentosUrl, getRelacionInstrumentosRonda, inicializarRelacionInstrumentos } from '@/server/sgc'
import InstrumentosEditor from './InstrumentosEditor'

export default async function InstrumentosRondaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canEditSgcMaestro(auth)) redirect('/denied?reason=role')
  const relacion = await getRelacionInstrumentosRonda(id)
  const [pdfUrl, xlsxUrl] = relacion
    ? await Promise.all([getExportacionInstrumentosUrl(id, 'pdf'), getExportacionInstrumentosUrl(id, 'xlsx')])
    : [null, null]

  async function inicializar() {
    'use server'
    await inicializarRelacionInstrumentos(id)
    revalidatePath(`/dashboard/rondas/${id}/sgc/f-psea-21`)
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">F-PSEA-21</p><h1 className="text-2xl font-bold">Instrumentos Calaire usados</h1></div>
        <Link className="btn-outline" href={`/dashboard/rondas/${id}/sgc`}>Volver al expediente</Link>
      </div>
      {!relacion ? (
        <section className="card p-6"><p className="mb-4 text-sm text-[var(--foreground-muted)]">Crea cuatro analizadores, aire cero, calibrador dinámico y cilindro como placeholders. No copia equipos de participantes.</p><form action={inicializar}><button className="btn-primary">Inicializar relación</button></form></section>
      ) : (
        <>
          <section className="card grid gap-4 p-6">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{relacion.estado}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold">Crítico, no bloquea cierre</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">Revisión {relacion.revision}</span></div>
            <div className="grid gap-3 sm:grid-cols-4"><div>Total: {relacion.resumen.total}</div><div>Analizadores: {relacion.resumen.analizadores}/4</div><div>Fotos generales pendientes: {relacion.resumen.itemsSinFotoGeneral}</div><div>Fotos de placa pendientes: {relacion.resumen.itemsSinFotoPlaca}</div></div>
            {relacion.resumen.errores.length > 0 && <ul className="list-disc pl-5 text-sm text-amber-900">{relacion.resumen.errores.map((error: string) => <li key={error}>{error}</li>)}</ul>}
          </section>
          <InstrumentosEditor
            rondaId={id}
            relacionId={relacion._id}
            estado={relacion.estado}
            items={relacion.items}
            completo={relacion.resumen.completo}
            tecnicoNombre={relacion.tecnicoNombre}
            coordinadorNombre={relacion.coordinadorNombre}
            observacionDevolucion={relacion.observacionDevolucion}
            canValidate={isAdmin(auth)}
            hasPdf={Boolean(relacion.pdfStorageId && relacion.pdfRevision === relacion.revision)}
            hasXlsx={Boolean(relacion.xlsxStorageId && relacion.xlsxRevision === relacion.revision)}
            pdfUrl={pdfUrl}
            xlsxUrl={xlsxUrl}
          />
        </>
      )}
    </main>
  )
}
