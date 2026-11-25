import Link from 'next/link'
import { notFound } from 'next/navigation'

import FormularioReferencia from '@/app/(protected)/ronda/[codigo]/FormularioReferencia'
import FormularioRonda from '@/app/(protected)/ronda/[codigo]/FormularioRonda'
import { requireAdminAuth } from '@/server/auth'
import {
  getEstadoEnvioPTByParticipante,
  getParticipanteRondaResumen,
  getRonda,
  isMemberSpecialRole,
  listEnviosPTByParticipante,
  listPTItems,
  listPTSampleGroups,
} from '@/server/rondas'
import { RondaPageHeader } from '../../../RondaPageHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resultados PT del participante' }

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

  const [ptItems, sampleGroups, envios, estadoEnvio] = await Promise.all([
    listPTItems(rondaId),
    listPTSampleGroups(rondaId),
    listEnviosPTByParticipante(participanteId),
    getEstadoEnvioPTByParticipante(participanteId),
  ])
  const isReferencia = isMemberSpecialRole(participante.participant_profile)
  const backHref = `/dashboard/rondas/${rondaId}/participantes`
  const formProps = {
    ronda,
    ptItems,
    sampleGroups,
    enviosIniciales: envios,
    envioFinalizado: estadoEnvio.enviado,
    enviadoAt: estadoEnvio.enviados_at,
    participantCode: participante.participant_code,
    replicateCode: participante.replicate_code,
    participanteEmail: participante.email,
    adminTarget: {
      rondaParticipanteId: participanteId,
      backHref,
    },
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <RondaPageHeader
          ronda={ronda}
          section="Carga PT del participante"
          description={`${participante.email} · ${isReferencia ? 'Referencia' : 'Participante'}`}
          actions={(
            <Link href={backHref} className="btn-outline">
              ← Volver a participantes
            </Link>
          )}
        />

        {ronda.estado !== 'activa' && (
          <div role="alert" className="rounded-xl border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning-strong">
            {ronda.estado === 'borrador' ? (
              <>
                La ronda está en borrador: la captura queda en solo lectura hasta activarla.{' '}
                <Link href={`/dashboard/rondas/${rondaId}`} className="font-semibold underline underline-offset-2">
                  Ir a activar la ronda
                </Link>
              </>
            ) : (
              'La ronda ya no admite cambios en los resultados: la captura está en solo lectura.'
            )}
          </div>
        )}

        {isReferencia ? <FormularioReferencia {...formProps} /> : <FormularioRonda {...formProps} />}

        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/rondas/${rondaId}/participantes/${participanteId}/ficha`} className="btn-outline">
            Editar ficha
          </Link>
        </div>
      </div>
    </div>
  )
}
