import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'

import { Footer } from '@/app/components/Footer'
import { isAdmin } from '@/lib/auth'

import { ParticipantTopNav } from './ParticipantTopNav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await withAuth({ ensureSignedIn: true }).catch(() => null)
  if (!auth?.user) redirect('/login')

  const admin = isAdmin(auth)

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      {!admin && <ParticipantTopNav />}
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}
