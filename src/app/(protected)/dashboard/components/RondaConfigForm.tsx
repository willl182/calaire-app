import Link from 'next/link'

import { updateRondaAction } from '../actions'
import { CONTAMINANTES, type Ronda } from '@/server/rondas'

export function RondaConfigForm({ round }: { round: Ronda }) {
  const contaminantesByName = new Map(round.contaminantes.map((item) => [item.contaminante, item]))

  return (
    <form action={updateRondaAction} className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <input type="hidden" name="ronda_id" value={round.id} />

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Editar configuración de ronda</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Actualice nombre, código, contaminantes, niveles y réplicas antes de recibir envíos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Nombre</span>
          <input
            type="text"
            name="nombre"
            required
            defaultValue={round.nombre}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none ring-0"
          />
        </label>
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Código</span>
          <input
            type="text"
            name="codigo"
            required
            defaultValue={round.codigo}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none ring-0"
          />
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {CONTAMINANTES.map((contaminante) => {
          const config = contaminantesByName.get(contaminante)
          return (
            <div
              key={contaminante}
              className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-[1.4fr_1fr_1fr]"
            >
              <label className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                <input
                  type="checkbox"
                  name={`enabled_${contaminante}`}
                  defaultChecked={Boolean(config)}
                  className="h-4 w-4 rounded border-[var(--border)] accent-[var(--pt-primary)]"
                />
                <span>{contaminante}</span>
              </label>

              <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
                <span>Niveles</span>
                <input
                  type="number"
                  min="1"
                  name={`niveles_${contaminante}`}
                  defaultValue={config?.niveles ?? 1}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--pt-primary)] transition-colors"
                />
              </label>

              <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
                <span>Réplicas</span>
                <select
                  name={`replicas_${contaminante}`}
                  defaultValue={String(config?.replicas ?? 2)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--pt-primary)] transition-colors"
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </label>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-soft)] pt-4">
        <Link href="/dashboard?tab=rondas" className="btn-outline">
          Cancelar
        </Link>
        <button type="submit" className="btn-primary">
          Guardar configuración
        </button>
      </div>
    </form>
  )
}
