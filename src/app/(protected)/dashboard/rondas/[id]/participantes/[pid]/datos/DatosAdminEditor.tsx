'use client'

import { useActionState } from 'react'
import type { EnvioPT, RondaPTItem, RondaPTSampleGroup } from '@/server/rondas'
import { getRequiredPTReplicateCount } from '@/server/rondas'
import { adminGuardarDatoPTAction } from './actions'

type Props = {
  rondaId: string
  participanteId: string
  ptItems: RondaPTItem[]
  sampleGroups: RondaPTSampleGroup[]
  envios: EnvioPT[]
}

function key(ptItemId: string, sampleGroupId: string) {
  return `${ptItemId}:${sampleGroupId}`
}

function DatoRow({
  rondaId,
  participanteId,
  item,
  group,
  envio,
  requiredReplicates,
}: {
  rondaId: string
  participanteId: string
  item: RondaPTItem
  group: RondaPTSampleGroup
  envio?: EnvioPT
  requiredReplicates: 1 | 3
}) {
  const [state, action, pending] = useActionState(adminGuardarDatoPTAction, null)
  const inputClass =
    'w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--foreground)] outline-none'

  return (
    <form action={action} className="grid gap-3 border-b border-[var(--border-soft)] px-4 py-3 last:border-0 lg:grid-cols-[1.2fr_0.8fr_repeat(8,minmax(5rem,auto))] lg:items-end">
      <input type="hidden" name="ronda_id" value={rondaId} />
      <input type="hidden" name="participante_id" value={participanteId} />
      <input type="hidden" name="pt_item_id" value={item.id} />
      <input type="hidden" name="sample_group_id" value={group.id} />

      <div>
        <div className="text-sm font-semibold text-[var(--foreground)]">{item.contaminante} · {item.run_code}</div>
        <div className="text-xs text-[var(--foreground-muted)]">{item.level_label}</div>
      </div>
      <div className="text-sm text-[var(--foreground-muted)]">Grupo {group.sample_group}</div>

      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        d1
        <input name="d1" type="number" step="any" className={inputClass} defaultValue={envio?.d1 ?? ''} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        d2
        <input name="d2" type="number" step="any" disabled={requiredReplicates === 1} className={inputClass} defaultValue={envio?.d2 ?? ''} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        d3
        <input name="d3" type="number" step="any" disabled={requiredReplicates === 1} className={inputClass} defaultValue={envio?.d3 ?? ''} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        Prom.
        <input name="mean_value" type="number" step="any" className={inputClass} defaultValue={envio?.mean_value ?? ''} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        SD
        <input name="sd_value" type="number" step="any" className={inputClass} defaultValue={envio?.sd_value ?? ''} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        u(x)
        <input name="ux" type="number" step="any" className={inputClass} defaultValue={envio?.ux ?? ''} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        k
        <input name="k" type="number" step="any" className={inputClass} defaultValue={envio?.k ?? 2} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--foreground-muted)]">
        u exp
        <input name="ux_exp" type="number" step="any" className={inputClass} defaultValue={envio?.ux_exp ?? ''} />
      </label>

      <div className="flex items-center gap-2 lg:col-span-10 lg:justify-end">
        {state?.ok && <span className="text-xs text-emerald-600">Guardado</span>}
        {state?.error && <span className="text-xs text-rose-600">{state.error}</span>}
        <button type="submit" className="btn-outline" disabled={pending}>
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export default function DatosAdminEditor({ rondaId, participanteId, ptItems, sampleGroups, envios }: Props) {
  const envioByCell = new Map(envios.map((envio) => [key(envio.pt_item_id, envio.sample_group_id), envio]))

  if (ptItems.length === 0 || sampleGroups.length === 0) {
    return (
      <section className="card p-6 text-sm text-[var(--foreground-muted)]">
        No hay configuración PT para cargar datos todavía.
      </section>
    )
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-[var(--border-soft)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Datos cargados PT</h2>
        <p className="text-xs text-[var(--foreground-muted)]">
          Edición administrativa por combinación de corrida y grupo de muestra.
        </p>
      </div>
      {ptItems.flatMap((item) =>
        sampleGroups.map((group) => (
          <DatoRow
            key={key(item.id, group.id)}
            rondaId={rondaId}
            participanteId={participanteId}
            item={item}
            group={group}
            envio={envioByCell.get(key(item.id, group.id))}
            requiredReplicates={getRequiredPTReplicateCount(item, ptItems)}
          />
        ))
      )}
    </section>
  )
}
