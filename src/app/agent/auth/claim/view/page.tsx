import { withAuth } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'
import { generateOtp, getClaimViewState, saveOtp } from '@/server/auth/agent-auth'

export const dynamic = 'force-dynamic'

export default async function ClaimViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { user } = await withAuth()
  if (!user?.email) redirect('/login')

  const params = await searchParams
  const token = params.token ?? ''
  if (!token) redirect('/denied?reason=missing_token')

  const { claim, expired, otpExpired } = await getClaimViewState(token)
  if (!claim || claim.status !== 'pending' || expired) {
    redirect('/denied?reason=invalid_claim')
  }
  if (claim.email.toLowerCase() !== user.email.toLowerCase()) {
    redirect('/denied?reason=email_mismatch')
  }

  let otp = '******'
  if (!claim.otpHash || otpExpired) {
    otp = generateOtp()
    await saveOtp(claim._id, otp)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-black/50">Agent claim</p>
        <h1 className="mt-2 text-2xl font-semibold text-black">Verificación pendiente</h1>
        <p className="mt-4 text-sm text-black/70">
          Confirma al agente este código de 6 dígitos.
        </p>
        <div className="mt-6 rounded-xl bg-black px-6 py-4 text-center text-3xl font-mono tracking-[0.35em] text-white">
          {otp}
        </div>
        <p className="mt-4 text-sm text-black/60">
          Solo se muestra cuando el correo autenticado coincide con el registro de claim.
        </p>
      </div>
    </main>
  )
}
