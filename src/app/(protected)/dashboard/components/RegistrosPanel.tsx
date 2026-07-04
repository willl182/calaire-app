import Link from 'next/link'

import type { ParticipanteGlobal } from '@/server/rondas'
import type { WorkOSUserListItem } from '@/server/auth/workos'

export function RegistrosTabView({
  participantesGlobal,
  workosUsers,
}: {
  participantesGlobal: ParticipanteGlobal[]
  workosUsers: WorkOSUserListItem[]
}) {
  const conEnlace = participantesGlobal.filter((p) => p.rondas.some((r) => r.estado_enlace === 'reclamado'))
  const sinEnlace = participantesGlobal.filter((p) => p.rondas.every((r) => r.estado_enlace === 'pendiente'))
  const pendientesIngreso = participantesGlobal.filter((p) =>
    p.rondas.some(
      (r) =>
        r.estado_enlace === 'pendiente' &&
        (r.ficha_estado !== 'no_iniciada' || Boolean(p.correo_laboratorio) || Boolean(p.nit_laboratorio))
    )
  )

  return (
    <section className="grid gap-6">
      <section className="sgc-kpis sgc-kpis-three">
        <div className="sgc-kpi">
          <div className="sgc-kpi-label">Total</div>
          <div className="sgc-kpi-value numeric">{participantesGlobal.length}</div>
        </div>
        <div className="sgc-kpi bg-emerald-50/40">
          <div className="sgc-kpi-label">Con enlace</div>
          <div className="sgc-kpi-value numeric">{conEnlace.length}</div>
        </div>
        <div className="sgc-kpi bg-amber-50/50">
          <div className="sgc-kpi-label">Sin reclamar</div>
          <div className="sgc-kpi-value numeric">{sinEnlace.length}</div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Pendientes de ingreso</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Participantes creados por admin que todavía no han reclamado su enlace, pero ya tienen ficha o correo de laboratorio.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem]">
            <thead>
              <tr className="border-b-2 border-[var(--pt-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">NIT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo laboratorio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo WorkOS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ficha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Rondas</th>
              </tr>
            </thead>
            <tbody>
              {pendientesIngreso.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]" colSpan={5}>
                    No hay participantes pendientes de ingreso con ficha o correo cargado.
                  </td>
                </tr>
              ) : (
                pendientesIngreso.map((p) => {
                  const rondasPendientes = p.rondas.filter((r) => r.estado_enlace === 'pendiente').length
                  return (
                    <tr key={`${p.workos_user_id}-pendiente`} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                      <td className="px-4 py-4 text-sm font-medium text-[var(--foreground)]">
                        {p.nit_laboratorio?.trim() ? p.nit_laboratorio : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--foreground)]">
                        <div className="font-medium">{p.correo_laboratorio?.trim() || p.email}</div>
                        {p.correo_laboratorio && p.correo_laboratorio !== p.email && (
                          <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                            WorkOS: {p.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--foreground)]">
                        <div>{p.email}</div>
                        <div className="mt-1 text-xs text-[var(--foreground-muted)]">Enlace pendiente</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.ficha_estado === 'enviado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.ficha_estado === 'borrador'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.ficha_estado === 'enviado' ? 'Enviada' : p.ficha_estado === 'borrador' ? 'Borrador' : 'No iniciada'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {p.correo_laboratorio && (
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                              Admin creado
                            </span>
                          )}
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {rondasPendientes} pendientes
                          </span>
                          <Link href={`/dashboard/participantes/${encodeURIComponent(p.workos_user_id)}`} className="btn-primary inline-flex px-3 py-1 text-xs">
                            Abrir
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

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Directorio WorkOS</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Muestra todas las personas creadas en WorkOS, incluso si todavía no están en una ronda.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem]">
            <thead>
              <tr className="border-b-2 border-[var(--pt-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">WorkOS ID</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {workosUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]" colSpan={4}>
                    No hay usuarios en WorkOS.
                  </td>
                </tr>
              ) : (
                workosUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4 text-sm font-medium text-[var(--foreground)]">
                      {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : user.displayName}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--foreground)]">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--foreground-muted)]">
                      {user.id}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/dashboard/participantes/${encodeURIComponent(user.id)}`} className="btn-primary inline-flex px-3 py-1 text-xs">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
