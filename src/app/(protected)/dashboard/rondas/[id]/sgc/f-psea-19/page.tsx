import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { canEditSgcMaestro, isAdmin, requireAuth } from '@/server/auth'
import { actualizarActaInicio, cambiarPublicacionActaInicio, getActaInicio, getActaInicioDownloadUrl, getPanelSgc, inicializarActaInicio } from '@/server/sgc'
import ActaArchivos from './ActaArchivos'

const PASOS = [
  { key: 'borrador', label: 'Borrador' },
  { key: 'docx_generado', label: 'DOCX para firma' },
  { key: 'pdf_firmado_cargado', label: 'PDF firmado subido' },
  { key: 'publicado', label: 'Publicado' },
] as const

function fmtFecha(value?: string | null) {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value ?? ''
}

function PasosActa({ estado }: { estado: string }) {
  const actual = PASOS.findIndex((paso) => paso.key === estado)
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Pasos del acta">
      {PASOS.map((paso, index) => {
        const hecho = index <= actual
        return (
          <li
            key={paso.key}
            aria-current={index === actual ? 'step' : undefined}
            className={`rounded-lg border px-3 py-2 text-sm ${hecho ? 'border-[var(--pt-primary)] bg-sky-50 font-semibold text-[var(--foreground)]' : 'border-[var(--border)] text-[var(--foreground-muted)]'}`}
          >
            <span className="numeric mr-1">{index + 1}.</span>{paso.label}
            {index === actual && <span className="sr-only"> (paso actual)</span>}
          </li>
        )
      })}
    </ol>
  )
}

export default async function ActaInicioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canEditSgcMaestro(auth)) redirect('/denied?reason=role')
  const [acta, panel] = await Promise.all([getActaInicio(id), getPanelSgc(id)])
  const hitoInicio = panel?.hitos.find((hito) => hito.codigo === 'INICIO_RONDA' && hito.estado !== 'cancelado')
  const inicioConFecha = Boolean(hitoInicio?.fechaObjetivo?.trim())
  const [docxUrl, pdfUrl] = acta
    ? await Promise.all([
        getActaInicioDownloadUrl(id, 'docx'),
        getActaInicioDownloadUrl(id, 'pdf_firmado_interno'),
      ])
    : [null, null]

  async function inicializar() {
    'use server'
    await inicializarActaInicio(id)
    revalidatePath(`/dashboard/rondas/${id}/sgc/f-psea-19`)
  }

  async function guardar(formData: FormData) {
    'use server'
    const actaId = String(formData.get('acta_id') ?? '')
    if (!actaId) notFound()
    await actualizarActaInicio({
      actaId,
      fecha: String(formData.get('fecha') ?? ''),
      lugar: String(formData.get('lugar') ?? ''),
      textoInicio: String(formData.get('texto_inicio') ?? ''),
      organizadores: [0, 1].map((index) => ({
        nombre: String(formData.get(`organizador_${index}_nombre`) ?? ''),
        entidad: String(formData.get(`organizador_${index}_entidad`) ?? ''),
      })),
    })
    revalidatePath(`/dashboard/rondas/${id}/sgc/f-psea-19`)
  }

  async function publicar(formData: FormData) {
    'use server'
    await cambiarPublicacionActaInicio(String(formData.get('acta_id') ?? ''), formData.get('publicar') === 'true')
    revalidatePath(`/dashboard/rondas/${id}/sgc/f-psea-19`)
  }

  const organizadores = acta?.firmantes.filter((item: { tipo: string }) => item.tipo === 'organizador') ?? []
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">F-PSEA-19</p><h1 className="text-2xl font-bold">Acta de inicio de ronda</h1></div>
        <Link className="btn-outline" href={`/dashboard/rondas/${id}/sgc`}>Volver al expediente</Link>
      </div>
      {!acta ? (
        <section className="card p-6">
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            El acta toma la fecha del hito INICIO_RONDA y los asistentes de F-PSEA-03.
            {inicioConFecha && hitoInicio && <> Fecha de inicio: <strong>{fmtFecha(hitoInicio.fechaObjetivo)}</strong>.</>}
          </p>
          <form action={inicializar}>
            <button className="btn-primary" disabled={!inicioConFecha} aria-describedby={inicioConFecha ? undefined : 'acta-sin-inicio'}>Inicializar acta</button>
          </form>
          {!inicioConFecha && (
            <p id="acta-sin-inicio" className="mt-3 text-sm text-amber-900">
              Falta el hito INICIO_RONDA con fecha.{' '}
              <Link className="font-semibold underline" href={`/dashboard/rondas/${id}/sgc#hitos`}>Registrar el hito de inicio</Link>
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="card grid gap-3 p-6">
            <PasosActa estado={acta.estado} />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">Estado para el avance:</span>
              {acta.pdfStorageId
                ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">Subida</span>
                : <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Diligenciada / por subir</span>}
              <span className="text-xs text-[var(--foreground-muted)]">Solo cuenta como completa con el PDF firmado subido. Publicar es aparte y no cambia el avance.</span>
            </div>
          </section>
          <form action={guardar} className="card grid gap-4 p-6">
            <input type="hidden" name="acta_id" value={acta._id} />
            <label className="grid gap-1 text-sm font-medium">Fecha<input className="input" name="fecha" defaultValue={acta.fecha} required /></label>
            <label className="grid gap-1 text-sm font-medium">Lugar<input className="input" name="lugar" defaultValue={acta.lugar} required /></label>
            <label className="grid gap-1 text-sm font-medium">Texto de inicio<textarea className="input min-h-28" name="texto_inicio" defaultValue={acta.textoInicio} required /></label>
            <h2 className="font-semibold">Organizadores</h2>
            {[0, 1].map((index) => <div className="grid gap-3 md:grid-cols-2" key={index}><input className="input" name={`organizador_${index}_nombre`} defaultValue={organizadores[index]?.nombre ?? ''} placeholder="Nombre" required /><input className="input" name={`organizador_${index}_entidad`} defaultValue={organizadores[index]?.entidad ?? 'Laboratorio Calaire'} placeholder="Entidad" required /></div>)}
            <button className="btn-primary justify-self-start">Guardar borrador</button>
          </form>
          <section className="card p-6"><h2 className="font-semibold">Firmantes precargados</h2><ul className="mt-3 grid gap-2 text-sm">{acta.firmantes.map((item: { _id: string; nombre: string; entidad: string; tipo: string }) => <li key={item._id} className="rounded border border-[var(--border)] p-2">{item.nombre || 'Pendiente'} · {item.entidad} · {item.tipo}</li>)}</ul></section>
          <ActaArchivos rondaId={id} actaId={acta._id} docxUrl={docxUrl} pdfUrl={pdfUrl} />
          {isAdmin(auth) ? <form action={publicar} className="card flex flex-wrap items-center gap-3 p-6"><h2 className="w-full font-semibold">Publicación a participantes <span className="text-xs font-normal text-[var(--foreground-muted)]">(acción aparte, no afecta el avance)</span></h2><input type="hidden" name="acta_id" value={acta._id} /><button className="btn-primary" name="publicar" value={acta.publicaParticipante ? 'false' : 'true'} disabled={!acta.pdfStorageId}>{acta.publicaParticipante ? 'Despublicar acta' : 'Publicar PDF firmado'}</button>{!acta.pdfStorageId && <span className="text-sm text-[var(--foreground-muted)]">Carga de PDF firmado pendiente.</span>}</form> : <section className="card p-6 text-sm text-[var(--foreground-muted)]">Publicación reservada para coordinación.</section>}
        </>
      )}
    </main>
  )
}
