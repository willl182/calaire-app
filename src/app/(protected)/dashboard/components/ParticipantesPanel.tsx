import Link from 'next/link'

import type { ParticipanteGlobal } from '@/server/rondas'

export function ParticipantesGlobalView({
  participantes,
}: {
  participantes: ParticipanteGlobal[]
}) {
  if (participantes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay participantes registrados en ninguna ronda todavía.
      </div>
    )
  }

  // Solo entradas con cupos; las del directorio sin rondas se ven en el directorio maestro.
  const conCupos = participantes.filter((p) => p.rondas.length > 0)
  const conEnlace = conCupos.filter((p) => p.rondas.some((r) => r.estado_enlace === 'reclamado'))
  const sinEnlace = conCupos.filter((p) => p.rondas.every((r) => r.estado_enlace === 'pendiente'))

  return (
    <div className="grid gap-6">
      <ParticipantGroupTable
        id="con-enlace"
        title="Con enlace"
        description="Participantes que ya reclamaron al menos un cupo con su cuenta."
        participantes={conEnlace}
        emptyMessage="No hay participantes con enlace reclamado."
        tone="success"
      />
      <ParticipantGroupTable
        id="sin-enlace"
        title="Sin enlace"
        description="Cupos que nadie ha reclamado todavía. Comparta el enlace de invitación desde la ronda."
        participantes={sinEnlace}
        emptyMessage="No hay participantes pendientes de reclamar."
        tone="warning"
      />
    </div>
  )
}

function ParticipantGroupTable({
  id,
  title,
  description,
  participantes,
  emptyMessage,
  tone,
}: {
  id: string
  title: string
  description: string
  participantes: ParticipanteGlobal[]
  emptyMessage: string
  tone: 'success' | 'warning'
}) {
  const grouped = Array.from(
    participantes.reduce((acc, participante) => {
      const nit = participante.nit_laboratorio ?? '—'
      const current = acc.get(nit) ?? []
      current.push(participante)
      acc.set(nit, current)
      return acc
    }, new Map<string, ParticipanteGlobal[]>())
  ).sort(([nitA], [nitB]) => nitA.localeCompare(nitB))

  if (participantes.length === 0) {
    return (
      <div id={id} className={`scroll-mt-24 rounded-xl border border-dashed px-6 py-10 text-center text-sm ${tone === 'success' ? 'border-success-border bg-success-soft text-success-strong' : 'border-warning-border bg-warning-soft text-warning-strong'}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <section id={id} className="card scroll-mt-24 overflow-hidden">
      <div className="border-b border-[var(--border-soft)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {title} <span className="font-normal text-[var(--foreground-muted)]">({participantes.length})</span>
        </h2>
        <p className="text-xs text-[var(--foreground-muted)]">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem]">
          <thead>
            <tr className="border-b-2 border-[var(--pt-primary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">NIT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Enlace</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ficha</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Rondas / envíos</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([nit, group]) =>
              group.map((p) => {
                const rondasActivas = p.rondas.filter((r) => r.estado === 'activa')
                const reclamados = p.rondas.filter((r) => r.estado_enlace === 'reclamado').length
                const pendientes = p.rondas.filter((r) => r.estado_enlace === 'pendiente').length
                const tieneCuenta = Boolean(p.workos_user_id) && !p.workos_user_id.startsWith('pendiente:')
                const participanteHref = tieneCuenta
                  ? `/dashboard/participantes/${encodeURIComponent(p.workos_user_id)}`
                  : `/dashboard/rondas/${p.rondas[0]?.id}/participantes?filtro=enlace_pendiente`
                const fichaLabel =
                  p.ficha_estado === 'enviado' ? 'Enviada' : p.ficha_estado === 'borrador' ? 'Borrador' : 'No iniciada'

                return (
                  <tr key={`${p.workos_user_id}-${p.email}`} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      <div className="numeric text-sm font-medium text-[var(--foreground)]">{nit}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {p.correo_laboratorio?.trim() || p.email}
                      </div>
                      {p.correo_laboratorio && p.correo_laboratorio !== p.email && (
                        <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                          Correo de la cuenta: {p.email}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                        <span>{reclamados} con enlace</span>
                        <span> · </span>
                        <span>{pendientes} pendientes de reclamar</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${reclamados === 0 ? 'bg-warning-soft text-warning-strong' : 'bg-success-soft text-success-strong'}`}>
                        {reclamados === 0 ? 'Sin enlace' : pendientes > 0 ? `Con enlace · ${pendientes} pendiente${pendientes === 1 ? '' : 's'}` : 'Con enlace'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.ficha_estado === 'enviado' ? 'bg-success-soft text-success-strong' : 'bg-warning-soft text-warning-strong'}`}>
                        {fichaLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {p.correo_laboratorio && (
                          <span className="rounded-full bg-info-soft px-3 py-1 text-xs font-semibold text-info-strong">
                            Laboratorio manual
                          </span>
                        )}
                        <span className="rounded-full bg-[var(--pt-primary-subtle)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                          {rondasActivas.length} activas
                        </span>
                        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                          {p.total_envios} envíos
                        </span>
                        <Link href={participanteHref} className="btn-primary inline-flex px-3 py-1 text-xs">
                          {tieneCuenta ? 'Ver detalle' : 'Ver en la ronda'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
