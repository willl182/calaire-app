import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import {
  claimParticipanteToken,
  getEstadoEnvioPTParticipanteWithStatus,
  getRondaByCodigoWithStatus,
  getRondaParticipantePTWithStatus,
  getMyPtResults,
  isInvitadoWithStatus,
  listEnviosPTWithStatus,
  listPTItemsWithStatus,
  listPTSampleGroupsWithStatus,
} from '@/server/rondas'
import { isAdmin } from '@/server/auth'
import { getFichaByRondaParticipante } from '@/server/rondas/fichas'
import FormularioRonda from './FormularioRonda'
import FormularioReferencia from './FormularioReferencia'

export default async function RondaPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { codigo } = await params
  const sp = searchParams ? await searchParams : {}
  const rawToken = Array.isArray(sp.token) ? sp.token[0] : sp.token
  const token = typeof rawToken === 'string' ? rawToken.trim() : ''
  const auth = await withAuth({ ensureSignedIn: true })
  if (!auth.user) redirect('/login')

  const rondaResult = await getRondaByCodigoWithStatus(codigo)
  if (!rondaResult.data && !rondaResult.offline) notFound()
  if (!rondaResult.data) {
    return <RondaOfflineState codigo={codigo} />
  }
  const ronda = rondaResult.data

  // Admins pueden acceder siempre; participantes solo si están invitados
  if (!isAdmin(auth)) {
    const invitadoResult = await isInvitadoWithStatus(ronda.id)
    let invitado = invitadoResult.data
    if (invitadoResult.offline) return <RondaOfflineState codigo={codigo} />

    if (!invitado && token) {
      const claim = await claimParticipanteToken(
        ronda.id,
        token,
        auth.user.email
      )
      if (claim === 'claimed' || claim === 'already-assigned') {
        redirect(
          `/mi-dashboard?success=${encodeURIComponent(
            'Invitación aceptada. Complete la ficha antes de ingresar datos.'
          )}`
        )
      }

    }

    const invitadoRecheck = invitado ? { data: true, offline: false } : await isInvitadoWithStatus(ronda.id)
    if (invitadoRecheck.offline) return <RondaOfflineState codigo={codigo} />
    invitado = invitado || invitadoRecheck.data
    if (!invitado) {
      redirect('/denied?reason=invite')
    }

    if (ronda.estado === 'borrador') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow p-10 text-center max-w-md">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Ronda no disponible</h2>
            <p className="text-gray-500 text-sm">
              La ronda <strong>{codigo}</strong> aún no ha sido activada. Vuelve más tarde.
            </p>
          </div>
        </div>
      )
    }

    if (ronda.estado === 'documentacion_pendiente' || ronda.estado === 'cerrada') {
      const [evaluacion, envio] = await Promise.all([
        getMyPtResults(ronda.id),
        getEstadoEnvioPTParticipanteWithStatus(ronda.id),
      ])
      if (envio.offline) return <RondaOfflineState codigo={codigo} />
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-10 text-center shadow">
            <div className="text-4xl mb-4">{evaluacion.estado === 'publicada' ? '📊' : '⏳'}</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {evaluacion.estado === 'publicada' ? 'Resultados disponibles' : 'En evaluación'}
            </h2>
            <p className="text-gray-500 text-sm">
              {evaluacion.estado === 'publicada' ? 'La evaluación oficial ya fue publicada.' : 'El envío fue cerrado y la evaluación aún no ha sido publicada.'}
            </p>
            {evaluacion.estado !== 'publicada' && envio.data.enviado && (
              <p className="mt-3 text-xs text-gray-500">
                Envío final confirmado{envio.data.enviados_at ? ` el ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(envio.data.enviados_at))}` : ''}.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {evaluacion.estado === 'publicada' && <Link className="btn-primary" href={`/ronda/${codigo}/resultados`}>Consultar resultados</Link>}
              <Link className="btn-outline" href="/calendario">Ver calendario</Link>
              <Link className="btn-outline" href={`/ronda/${codigo}/casos`}>Casos y expedientes</Link>
            </div>
          </div>
        </div>
      )
    }

    const participantePTResult = await getRondaParticipantePTWithStatus(ronda.id)
    if (participantePTResult.offline) return <RondaOfflineState codigo={codigo} />
    if (!participantePTResult.data) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-xl shadow p-10 text-center max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Sin asignación</h2>
            <p className="text-gray-500 text-sm">
              No tiene una asignación en esta ronda para ingresar resultados.
            </p>
          </div>
        </div>
      )
    }

    const ficha = await getFichaByRondaParticipante(participantePTResult.data.id)
    if (ficha?.estado !== 'enviado') {
      redirect(`/ronda/${codigo}/registro`)
    }
  }

  const [ptItems, sampleGroups, enviosIniciales, estadoEnvio, participantePT] = await Promise.all([
    listPTItemsWithStatus(ronda.id),
    listPTSampleGroupsWithStatus(ronda.id),
    listEnviosPTWithStatus(ronda.id),
    getEstadoEnvioPTParticipanteWithStatus(ronda.id),
    getRondaParticipantePTWithStatus(ronda.id),
  ])
  const backendOffline = ptItems.offline || sampleGroups.offline || enviosIniciales.offline || estadoEnvio.offline || participantePT.offline
  if (backendOffline) return <RondaOfflineState codigo={codigo} />

  const isReferencia = participantePT.data?.participant_profile === 'member_special'

  if (isReferencia) {
    return (
      <FormularioReferencia
        ronda={ronda}
        ptItems={ptItems.data}
        sampleGroups={sampleGroups.data}
        enviosIniciales={enviosIniciales.data}
        envioFinalizado={estadoEnvio.data.enviado}
        enviadoAt={estadoEnvio.data.enviados_at}
        participantCode={participantePT.data?.participant_code ?? null}
        replicateCode={participantePT.data?.replicate_code ?? null}
        participanteEmail={auth.user.email}
      />
    )
  }

  return (
    <FormularioRonda
      ronda={ronda}
      ptItems={ptItems.data}
      sampleGroups={sampleGroups.data}
      enviosIniciales={enviosIniciales.data}
      envioFinalizado={estadoEnvio.data.enviado}
      enviadoAt={estadoEnvio.data.enviados_at}
      participantCode={participantePT.data?.participant_code ?? null}
      replicateCode={participantePT.data?.replicate_code ?? null}
      participanteEmail={auth.user.email}
    />
  )
}

function RondaOfflineState({ codigo }: { codigo: string }) {
  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <BackendOfflineBanner detail="No se pudo cargar la ronda del participante. Las acciones de carga quedan deshabilitadas hasta recuperar conexion." />
        <section className="card p-8 text-center">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Ronda no disponible</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            No se pudo consultar la ronda {codigo} porque Convex esta offline.
          </p>
        </section>
      </div>
    </div>
  )
}
