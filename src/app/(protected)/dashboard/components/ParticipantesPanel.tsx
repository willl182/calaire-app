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

  const conEnlace = participantes.filter((p) => p.rondas.some((r) => r.estado_enlace === 'reclamado'))
  const sinEnlace = participantes.filter((p) => p.rondas.every((r) => r.estado_enlace === 'pendiente'))

  return (
    <div className="grid gap-6">
      <ParticipantGroupTable
        title="Con enlace"
        description="Cupos ya reclamados por una cuenta de WorkOS."
        participantes={conEnlace}
        emptyMessage="No hay participantes con enlace reclamado."
        tone="success"
      />
      <ParticipantGroupTable
        title="Sin enlace"
        description="Cupos pendientes de reclamar, incluidos los que ya tienen ficha iniciada."
        participantes={sinEnlace}
        emptyMessage="No hay participantes pendientes de reclamar."
        tone="warning"
      />
    </div>
  )
}

function ParticipantGroupTable({
  title,
  description,
  participantes,
  emptyMessage,
  tone,
}: {
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
      <div className={`rounded-xl border border-dashed px-6 py-10 text-center text-sm ${tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-[var(--border-soft)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
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
              group.map((p, index) => {
                const rondasActivas = p.rondas.filter((r) => r.estado === 'activa')
                const reclamados = p.rondas.filter((r) => r.estado_enlace === 'reclamado').length
                const pendientes = p.rondas.filter((r) => r.estado_enlace === 'pendiente').length
                const participanteHref = `/dashboard/participantes/${encodeURIComponent(p.workos_user_id)}`
                const fichaLabel =
                  p.ficha_estado === 'enviado' ? 'Enviada' : p.ficha_estado === 'borrador' ? 'Borrador' : 'No iniciada'

                return (
                  <tr key={p.workos_user_id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      {index === 0 ? <div className="numeric text-sm font-medium text-[var(--foreground)]">{nit}</div> : <span className="text-[var(--foreground-muted)]">〃</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {p.correo_laboratorio?.trim() || p.email}
                      </div>
                      {p.correo_laboratorio && p.correo_laboratorio !== p.email && (
                        <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                          Correo WorkOS: {p.email}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                        <span>{reclamados} con enlace</span>
                        <span> · </span>
                        <span>{pendientes} pendientes de reclamar</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pendientes > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {pendientes > 0 ? 'Sin enlace' : 'Con enlace'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.ficha_estado === 'enviado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {fichaLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {p.correo_laboratorio && (
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
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
                          Ingresar
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
