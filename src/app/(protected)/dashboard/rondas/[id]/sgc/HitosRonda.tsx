import type { SgcPanel } from '@/server/sgc'
import { actualizarHitoRondaAction, crearHitoRondaAction } from './actions'
import { SubmitButton } from '@/components/ui/SubmitButton'

type Hito = SgcPanel['hitos'][number]

export function fmtFechaIso(value?: string | null) {
  if (!value) return 'Sin fecha'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function HitoFechaForm({ hito, rondaId }: { hito: Hito; rondaId: string }) {
  return (
    <form action={actualizarHitoRondaAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="ronda_id" value={rondaId} />
      <input type="hidden" name="hito_id" value={hito._id} />
      <input type="hidden" name="codigo" value={hito.codigo} />
      <input type="hidden" name="nombre" value={hito.nombre} />
      <input type="hidden" name="fase" value={hito.fase} />
      <input type="hidden" name="fecha_real" value={hito.fechaReal ?? ''} />
      <input type="hidden" name="estado" value={hito.estado} />
      <input type="hidden" name="responsable" value={hito.responsable} />
      <input type="hidden" name="formato_relacionado" value={hito.formatoRelacionado ?? ''} />
      <input type="hidden" name="notas" value={hito.notas ?? ''} />
      {hito.visibleParticipante && <input type="hidden" name="visible_participante" value="on" />}
      {hito.bloqueaCierre && <input type="hidden" name="bloquea_cierre" value="on" />}
      <input
        className="input w-auto"
        type="date"
        name="fecha_objetivo"
        defaultValue={hito.fechaObjetivo ?? ''}
        aria-label={`Fecha objetivo de ${hito.nombre}`}
      />
      <SubmitButton className="btn-outline px-3 py-1 text-xs">Guardar fecha</SubmitButton>
    </form>
  )
}

/** Hitos del calendario (ancla #hitos de la barra "Siguiente paso"). No bloquean el expediente. */
export function HitosRonda({ hitos, rondaId }: { hitos: SgcPanel['hitos']; rondaId: string }) {
  const inicio = hitos.find((hito) => hito.codigo === 'INICIO_RONDA')
  const ordenados = [...hitos].sort((a, b) => (a.fechaObjetivo ?? '9999').localeCompare(b.fechaObjetivo ?? '9999'))
  return (
    <section id="hitos" className="card scroll-mt-24 p-5" aria-labelledby="hitos-title">
      <h2 id="hitos-title" className="text-base font-semibold text-[var(--foreground)]">Hitos del calendario</h2>
      <p className="text-sm text-[var(--foreground-muted)]">
        Se registran antes o en paralelo al expediente. El acta F-PSEA-19 toma la fecha del hito INICIO_RONDA.
        Fechas en formato dd/mm/aaaa.
      </p>
      {!inicio && (
        <form action={crearHitoRondaAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-warning-border bg-warning-soft p-3">
          <input type="hidden" name="ronda_id" value={rondaId} />
          <input type="hidden" name="codigo" value="INICIO_RONDA" />
          <input type="hidden" name="nombre" value="Inicio de ronda" />
          <input type="hidden" name="fase" value="inicio" />
          <label className="grid gap-1 text-xs font-semibold text-warning-strong">
            Fecha de INICIO_RONDA
            <input className="input" type="date" name="fecha_objetivo" required />
          </label>
          <SubmitButton className="btn-primary">Crear hito de inicio</SubmitButton>
        </form>
      )}
      {ordenados.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {ordenados.map((hito) => (
            <li key={hito._id} className="flex flex-col gap-2 rounded-lg border border-[var(--border)] px-3 py-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">{hito.nombre}</div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {hito.codigo} · {fmtFechaIso(hito.fechaObjetivo)} · {hito.estado.replace('_', ' ')}
                </div>
              </div>
              <HitoFechaForm hito={hito} rondaId={rondaId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
