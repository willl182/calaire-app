import type { ParticipanteGlobal } from '@/lib/rondas'
import { upsertDirectorioParticipanteAction } from '../participantes/actions'

function DirectorioForm() {
  return (
    <form action={upsertDirectorioParticipanteAction} className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Nuevo participante del directorio</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          El NIT es la clave principal. Los cambios se reflejan de inmediato en el directorio maestro.
        </p>
      </div>

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
            type="text"
            name="telefono"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>WorkOS user id</span>
          <input
            type="text"
            name="workos_user_id"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          Crear participante
        </button>
      </div>
    </form>
  )
}

export function DirectorioPanel({ allParticipantes }: { allParticipantes: ParticipanteGlobal[] }) {
  const participantes = allParticipantes.filter((p) => Boolean(p.nit))

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Directorio</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{participantes.length}</div>
        </div>
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Con cuenta</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">
            {participantes.length}
          </div>
        </div>
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Con rondas</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">
            {participantes.filter((p) => p.rondas.length > 0).length}
          </div>
        </div>
      </div>

      <DirectorioForm />

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Directorio maestro</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Alta directa de participantes del directorio. Los datos básicos quedan sincronizados para las rondas nuevas.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem]">
            <thead>
              <tr className="border-b-2 border-[var(--pt-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">NIT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Rondas</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((entry) => {
                return (
                  <tr key={`${entry.workos_user_id}-${entry.email}`} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      <div className="numeric text-sm font-medium text-[var(--foreground)]">{entry.nit}</div>
                      <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                        {entry.workos_user_id ? 'Cuenta vinculada' : 'Sin cuenta vinculada'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--foreground)]">{entry.email}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full bg-[var(--pt-primary-subtle)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                          {entry.rondas.length} rondas
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

