import Link from 'next/link'

import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton'
import {
  changeRondaStatusAction,
  deleteRondaAction,
  reabrirRondaAction,
} from '../actions'
import type { Ronda } from '@/server/rondas'
import { formatDate, statusClasses } from '../view-model'

type EditandoParam = string

import { RondaConfigForm } from './RondaConfigForm'

function StatusAction({ round }: { round: Ronda }) {
  const secondaryButtonClass =
    'min-w-20 rounded-lg border border-[var(--border)] px-2.5 py-1 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)] disabled:cursor-not-allowed disabled:border-[var(--border-soft)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--foreground-muted)]'

  if (round.estado === 'borrador') {
    return (
      <form action={changeRondaStatusAction}>
        <input type="hidden" name="ronda_id" value={round.id} />
        <input type="hidden" name="next_state" value="activa" />
        <button
          type="submit"
          className={secondaryButtonClass}
        >
          Abrir
        </button>
      </form>
    )
  }

  if (round.estado === 'cerrada') {
    return (
      <form action={reabrirRondaAction}>
        <input type="hidden" name="ronda_id" value={round.id} />
        <button type="submit" className={secondaryButtonClass}>
          Abrir
        </button>
      </form>
    )
  }

  return (
    <button type="button" disabled className={secondaryButtonClass}>
      Abrir
    </button>
  )
}

function CloseRondaAction({ round }: { round: Ronda }) {
  const secondaryButtonClass =
    'min-w-20 rounded-lg border border-[var(--border)] px-2.5 py-1 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)] disabled:cursor-not-allowed disabled:border-[var(--border-soft)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--foreground-muted)]'

  if (round.estado !== 'activa') {
    return (
      <button type="button" disabled className={secondaryButtonClass}>
        Cerrar
      </button>
    )
  }

  return (
    <form action={changeRondaStatusAction}>
      <input type="hidden" name="ronda_id" value={round.id} />
      <input type="hidden" name="next_state" value="cerrada" />
      <button type="submit" className={secondaryButtonClass}>
        Cerrar
      </button>
    </form>
  )
}

/* ─── Rondas Table ───────────────────────────────────────────────────── */
export function RondasTable({ rondas, editando }: { rondas: Ronda[]; editando: EditandoParam }) {
  if (rondas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay rondas creadas todavía. Use el botón «＋ Nueva ronda» para registrar la primera.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[72rem]">
          <thead>
            <tr className="border-b-2 border-[var(--pt-primary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Código / Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Contaminantes</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Partic.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Creada</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rondas.map((round) => (
              <RondaRow key={round.id} round={round} editando={editando} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RondaRow({ round, editando }: { round: Ronda; editando: EditandoParam }) {
  const isEditing = editando === round.id
  const canEdit = round.estado !== 'cerrada'

  return (
    <>
      <tr className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
        <td className="px-4 py-4">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusClasses(round.estado)}`}
          >
            {round.estado}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="font-medium text-sm text-[var(--foreground)]">{round.nombre}</div>
          <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{round.codigo}</div>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1">
            {round.contaminantes.length === 0 ? (
              <span className="text-xs text-[var(--foreground-muted)]">—</span>
            ) : (
              round.contaminantes.map((c) => (
                <span
                  key={c.id}
                  className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--foreground-muted)]"
                >
                  {c.contaminante}
                </span>
              ))
            )}
          </div>
        </td>
        <td className="px-4 py-4 text-center">
          <span className="numeric text-sm text-[var(--foreground)]">
            {round.participantes_asignados ?? 0}/{round.participantes_planeados ?? 0}
          </span>
        </td>
        <td className="px-4 py-4 text-xs text-[var(--foreground-muted)] whitespace-nowrap">
          {formatDate(round.created_at)}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/dashboard/rondas/${round.id}`}
              className="btn-primary min-w-20 px-3 py-1 text-center text-xs"
            >
              Ingresar
            </Link>
            <StatusAction round={round} />
            <CloseRondaAction round={round} />
            <form action={deleteRondaAction}>
              <input type="hidden" name="ronda_id" value={round.id} />
              <ConfirmSubmitButton
                type="submit"
                message={`¿Borrar la ronda ${round.codigo}? Esta acción no se puede deshacer.`}
                className="min-w-20 rounded-lg border border-rose-200 px-2.5 py-1 text-center text-xs font-medium text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800"
              >
                Eliminar
              </ConfirmSubmitButton>
            </form>
          </div>
        </td>
      </tr>
      {isEditing && canEdit && (
        <tr className="border-b border-[var(--border-soft)]">
          <td colSpan={6} className="px-4 py-4 bg-[var(--surface-muted)]">
            <RondaConfigForm round={round} />
          </td>
        </tr>
      )}
    </>
  )
}
