import { notFound } from 'next/navigation'
import Link from 'next/link'

import { LogoUnal } from '@/components/LogoUnal'
import { requireAdminAuth } from '@/server/auth'
import {
  getParticipanteRondaResumen,
  getRonda,
  listEnviosPTByParticipante,
  listPTItems,
  listPTSampleGroups,
} from '@/server/rondas'
import DatosAdminEditor from './DatosAdminEditor'

type Props = {
  params: Promise<{ id: string; pid: string }>
}

export default async function DatosParticipanteAdminPage({ params }: Props) {
  await requireAdminAuth()

  const { id: rondaId, pid: participanteId } = await params
  if (!participanteId || participanteId === 'undefined') notFound()

  const [ronda, participante] = await Promise.all([
    getRonda(rondaId),
    getParticipanteRondaResumen(participanteId),
  ])

  if (!ronda || !participante || participante.ronda_id !== rondaId) notFound()

  const [ptItems, sampleGroups, envios] = await Promise.all([
    listPTItems(rondaId),
    listPTSampleGroups(rondaId),
    listEnviosPTByParticipante(participanteId),
  ])
  const totalCells = ptItems.length * sampleGroups.length
  const completedCells = envios.length
  const progressPct = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0
  const isReferencia = participante.participant_profile === 'member_special'

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="header-bar px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <LogoUnal height={64} />
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Ensayos de Aptitud</span>
                </h1>
                <p className="text-base font-medium text-[var(--pt-primary-dark)]">Gases Contaminantes Criterio</p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {participante.email} · {isReferencia ? 'Referencia' : 'Participante'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="card p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              {isReferencia && (
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-violet-800">
                  Laboratorio de Referencia
                </div>
              )}
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{ronda.nombre}</h2>
              <p className="text-sm font-medium text-[var(--pt-primary-dark)]">Código de Ronda: {ronda.codigo}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span
                className={`self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                  ronda.estado === 'activa'
                    ? 'bg-emerald-100 text-emerald-800'
                    : ronda.estado === 'cerrada'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                Ronda {ronda.estado}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Código PT</div>
            <div className="numeric mt-2 text-2xl font-semibold text-[var(--foreground)]">{participante.participant_code ?? '—'}</div>
          </div>
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Réplica</div>
            <div className="numeric mt-2 text-2xl font-semibold text-[var(--foreground)]">{participante.replicate_code ?? '—'}</div>
          </div>
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Completitud</div>
            <div className="numeric mt-2 text-2xl font-semibold text-[var(--foreground)]">{completedCells}/{totalCells}</div>
          </div>
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Envío final</div>
            <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">
              {envios.some((envio) => envio.final_submitted_at) ? 'Enviado' : 'Sin envío'}
            </div>
          </div>
        </div>

        <section className="card grid gap-4 p-6">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[var(--foreground-muted)]">
              <span>Progreso PT</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border)]">
              <div className="h-2 rounded-full transition-all" style={{ width: `${progressPct}%`, background: progressPct === 100 ? 'var(--success)' : 'var(--pt-primary)' }} />
            </div>
          </div>
        </section>

        <DatosAdminEditor
          rondaId={rondaId}
          participanteId={participanteId}
          ptItems={ptItems}
          sampleGroups={sampleGroups}
          envios={envios}
        />

        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/rondas/${rondaId}/participantes/${participanteId}/ficha`} className="btn-outline">
            Editar ficha
          </Link>
          <Link href={`/dashboard/rondas/${rondaId}/participantes`} className="btn-outline">
            Volver a participantes
          </Link>
        </div>
      </div>
    </div>
  )
}
