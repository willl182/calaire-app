import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LogoUnal } from '@/components/LogoUnal'
import { requireAdminAuth } from '@/server/auth'
import { getParticipanteRondaResumen, getRonda } from '@/server/rondas'
import { getOrCreateFicha, getFichaByRondaParticipante } from '@/server/rondas/fichas'
import FichaAdminEditor from './FichaAdminEditor'

type Props = {
  params: Promise<{ id: string; pid: string }>
}

export default async function FichaAdminPage({ params }: Props) {
  await requireAdminAuth()

  const { id: rondaId, pid: rondaParticipanteId } = await params
  if (!rondaParticipanteId || rondaParticipanteId === 'undefined') notFound()

  const [ronda, participante] = await Promise.all([
    getRonda(rondaId),
    getParticipanteRondaResumen(rondaParticipanteId),
  ])
  if (!ronda || !participante || participante.ronda_id !== rondaId) notFound()

  let fichaCompleta = await getFichaByRondaParticipante(rondaParticipanteId)
  if (ronda.estado === 'activa' && !fichaCompleta) {
    await getOrCreateFicha(rondaParticipanteId)
    fichaCompleta = await getFichaByRondaParticipante(rondaParticipanteId)
  }
  if (!fichaCompleta) notFound()

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="header-bar px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <LogoUnal height={64} />
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Ensayos de Aptitud</span>
                </h1>
                <p className="text-base font-medium text-[var(--pt-primary-dark)]">
                  Gases Contaminantes Criterio
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {participante.email} · {participante.participant_profile === 'member_special' ? 'Referencia' : 'Participante'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
              F-PSEA-05A v0.1
            </p>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Hoja de Registro del Participante
            </h2>
            <p className="text-sm font-medium text-[var(--pt-primary-dark)]">
              Ronda: {ronda.codigo}{participante.participant_code ? ` · Participante: ${participante.participant_code}` : ''}
            </p>
            {fichaCompleta.estado === 'enviado' && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Ficha enviada ✓
              </div>
            )}
          </div>
        </section>

        <FichaAdminEditor
          fichaId={fichaCompleta.id}
          ficha={fichaCompleta}
          participanteEmail={participante.email}
        />

        <div>
          <Link
            href={`/dashboard/rondas/${rondaId}/participantes`}
            className="btn-outline"
          >
            ← Volver a participantes
          </Link>
        </div>
      </div>
    </div>
  )
}
