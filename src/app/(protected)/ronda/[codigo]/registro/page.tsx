import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { isConvexOffline } from '@/lib/convex-fallback'
import { isAdmin } from '@/server/auth'
import { getRondaByCodigoWithStatus, getRondaParticipantePTWithStatus, isInvitadoWithStatus } from '@/server/rondas'
import { getOrCreateFicha, getFichaByRondaParticipante } from '@/server/rondas/fichas'
import FormularioRegistro from './FormularioRegistro'

type Props = {
  params: Promise<{ codigo: string }>
}

export default async function RegistroPage({ params }: Props) {
  const { codigo } = await params
  const auth = await withAuth({ ensureSignedIn: true })
  if (!auth.user) redirect('/login')

  const rondaResult = await getRondaByCodigoWithStatus(codigo)
  if (!rondaResult.data && !rondaResult.offline) notFound()
  if (!rondaResult.data) return <RegistroOfflineState codigo={codigo} />
  const ronda = rondaResult.data

  const admin = isAdmin(auth)

  if (!admin) {
    const invitado = await isInvitadoWithStatus(ronda.id)
    if (invitado.offline) return <RegistroOfflineState codigo={codigo} />
    if (!invitado.data) redirect('/denied?reason=invite')
  }

  const rpResult = await getRondaParticipantePTWithStatus(ronda.id)
  if (rpResult.offline) return <RegistroOfflineState codigo={codigo} />
  const rp = rpResult.data
  if (!rp) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
        <div className="card max-w-md p-10 text-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Sin asignación</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            No tiene una asignación en esta ronda para registrar la ficha.
          </p>
          <Link href={admin ? '/dashboard' : '/mi-dashboard'} className="btn-outline mt-4 inline-block">
            Volver al dashboard
          </Link>
        </div>
      </div>
    )
  }

  try {
    await getOrCreateFicha(rp.id)
  } catch (error) {
    if (!isConvexOffline(error)) throw error
    return <RegistroOfflineState codigo={codigo} />
  }
  const ficha = await getFichaByRondaParticipante(rp.id)
  if (!ficha) notFound()

  const soloLectura = ronda.estado === 'cerrada'

  return (
    <FormularioRegistro
      codigoRonda={codigo}
      rondaCodigo={ronda.codigo}
      rondaEstado={ronda.estado}
      participanteCodigo={rp.participant_code}
      participanteEmail={auth.user.email}
      ficha={ficha}
      soloLectura={soloLectura}
    />
  )
}

function RegistroOfflineState({ codigo }: { codigo: string }) {
  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <BackendOfflineBanner detail="No se pudo cargar o preparar la ficha de registro mientras Convex esta offline." />
        <section className="card p-8 text-center">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Ficha no disponible</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            La ficha de la ronda {codigo} se habilitara cuando el backend vuelva a responder.
          </p>
        </section>
      </div>
    </div>
  )
}
