import Link from 'next/link'

import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton'
import {
  changeRondaStatusAction,
  deleteRondaAction,
  reabrirRondaAction,
} from '../actions'
import type { Ronda } from '@/server/rondas'
import { formatDate } from '../view-model'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

type EditandoParam = string

const secondaryButtonClass =
  'inline-flex h-[44px] min-w-16 items-center justify-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)] disabled:opacity-50'

import { RondaConfigForm } from './RondaConfigForm'

function StatusAction({ round }: { round: Ronda }) {
  if (round.estado === 'borrador') {
    return (
      <form action={changeRondaStatusAction}>
        <input type="hidden" name="ronda_id" value={round.id} />
        <input type="hidden" name="next_state" value="activa" />
        <ConfirmSubmitButton
          tone="primary"
          title="Activar ronda"
          message={`Al activar ${round.codigo}, los participantes pueden reclamar sus cupos y capturar resultados.`}
          confirmLabel="Activar ronda"
          className={secondaryButtonClass}
        >
          Activar
        </ConfirmSubmitButton>
      </form>
    )
  }

  if (round.estado === 'cerrada') {
    return (
      <form action={reabrirRondaAction}>
        <input type="hidden" name="ronda_id" value={round.id} />
        <input type="hidden" name="confirm" value="1" />
        <ConfirmSubmitButton
          tone="primary"
          title="Reabrir ronda"
          message={`¿Reabrir ${round.codigo}? Vuelve a permitir cambios en participantes y resultados.`}
          confirmLabel="Reabrir"
          className={secondaryButtonClass}
        >
          Reabrir
        </ConfirmSubmitButton>
      </form>
    )
  }

  return null
}

function CloseRondaAction({ round }: { round: Ronda }) {
  if (round.estado !== 'activa') {
    return null
  }

  return (
    <form action={changeRondaStatusAction}>
      <input type="hidden" name="ronda_id" value={round.id} />
      <input type="hidden" name="next_state" value="cerrada" />
      <ConfirmSubmitButton
        title="Cerrar ronda"
        message={`¿Cerrar ${round.codigo}? Los participantes ya no podrán enviar resultados.`}
        confirmLabel="Cerrar ronda"
        className={secondaryButtonClass}
      >
        Cerrar
      </ConfirmSubmitButton>
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
        <table className="w-full min-w-[64rem]">
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
          <EstadoBadge estado={round.estado} />
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
          <div className="flex items-center justify-end gap-1.5">
            <Link
              href={`/dashboard/rondas/${round.id}`}
              className="inline-flex h-[44px] min-w-20 items-center justify-center rounded-md bg-[var(--pt-primary)] px-3 text-xs font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--pt-primary-deep)] hover:no-underline"
            >
              Gestionar
            </Link>
            {canEdit && (
              <Link
                href={isEditing ? '/dashboard/rondas' : `/dashboard/rondas?editando=${round.id}`}
                className="inline-flex h-[44px] min-w-16 items-center justify-center rounded-md border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)] hover:no-underline"
              >
                {isEditing ? 'Cerrar' : 'Editar'}
              </Link>
            )}
            <StatusAction round={round} />
            <CloseRondaAction round={round} />
            <form action={deleteRondaAction}>
              <input type="hidden" name="ronda_id" value={round.id} />
              <ConfirmSubmitButton
                title="Eliminar ronda"
                message={`¿Borrar la ronda ${round.codigo}? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar ronda"
                className="inline-flex h-[44px] min-w-16 items-center justify-center rounded-md border border-danger-border px-2.5 text-xs font-medium text-danger-strong transition hover:border-danger hover:bg-danger-soft hover:text-danger-strong"
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
