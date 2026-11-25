import type { DirectorioParticipante, ParticipanteGlobal } from '@/server/rondas'
import { upsertDirectorioParticipanteAction } from '../participantes/actions'
import { SubmitButton } from '@/components/ui/SubmitButton'

function DirectorioForm() {
  return (
    <form action={upsertDirectorioParticipanteAction} className="grid gap-4 border-t border-[var(--border-soft)] p-4">
      <p className="text-sm text-[var(--foreground-muted)]">
        El NIT identifica al laboratorio: si ya existe, se actualizan sus datos. La cuenta de acceso se vincula
        sola cuando el participante reclama su enlace de invitación.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>NIT</span>
          <input
            type="text"
            name="nit"
            required
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Correo</span>
          <input
            type="email"
            name="correo"
            required
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Nombre del laboratorio</span>
          <input
            type="text"
            name="nombre_laboratorio"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Responsable</span>
          <input
            type="text"
            name="nombre_responsable"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Cargo</span>
          <input
            type="text"
            name="cargo"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Ciudad</span>
          <input
            type="text"
            name="ciudad"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Departamento</span>
          <input
            type="text"
            name="departamento"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Teléfono</span>
          <input
            type="tel"
            name="telefono"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <SubmitButton className="btn-primary">
          Guardar en el directorio
        </SubmitButton>
      </div>
    </form>
  )
}

export function DirectorioPanel({
  directorio,
  allParticipantes,
}: {
  directorio: DirectorioParticipante[]
  allParticipantes: ParticipanteGlobal[]
}) {
  const rondasPorNit = new Map(
    allParticipantes.filter((p) => p.nit).map((p) => [p.nit!.toLowerCase(), p.rondas.length])
  )
  const rondasDe = (entry: DirectorioParticipante) => rondasPorNit.get(entry.nit.toLowerCase()) ?? 0

  return (
    <section className="grid gap-6">
      <section className="sgc-kpis sgc-kpis-three">
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Laboratorios en el directorio</div>
          <div className="sgc-kpi-value numeric">{directorio.length}</div>
        </div>
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Con cuenta vinculada</div>
          <div className="sgc-kpi-value numeric">
            {directorio.filter((entry) => entry.workos_user_id).length}
          </div>
        </div>
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Con rondas</div>
          <div className="sgc-kpi-value numeric">
            {directorio.filter((entry) => rondasDe(entry) > 0).length}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Directorio maestro</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Laboratorios registrados por NIT. Sus datos básicos se usan al invitarlos a rondas nuevas.
          </p>
        </div>
        {directorio.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
            Todavía no hay laboratorios en el directorio. Los cupos de las rondas (abajo) se listan aunque
            no estén en el directorio; agregue aquí los laboratorios para reutilizar sus datos.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem]">
              <thead>
                <tr className="border-b-2 border-[var(--pt-primary)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">NIT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Laboratorio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Rondas</th>
                </tr>
              </thead>
              <tbody>
                {directorio.map((entry) => (
                  <tr key={entry.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      <div className="numeric text-sm font-medium text-[var(--foreground)]">{entry.nit}</div>
                      <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                        {entry.workos_user_id ? 'Cuenta vinculada' : 'Sin cuenta vinculada'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--foreground)]">
                      {entry.nombre_laboratorio ?? '—'}
                      {entry.ciudad && (
                        <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">{entry.ciudad}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--foreground)]">{entry.correo}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="rounded-full bg-[var(--pt-primary-subtle)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                        {rondasDe(entry)} {rondasDe(entry) === 1 ? 'ronda' : 'rondas'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <details className="group border-t border-[var(--border-soft)]">
          <summary className="flex min-h-[44px] cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
            <span aria-hidden="true" className="transition group-open:rotate-90">›</span>
            Agregar o actualizar un laboratorio
          </summary>
          <DirectorioForm />
        </details>
      </section>
    </section>
  )
}
