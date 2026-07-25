import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'

import { getAuthenticatedLandingPath } from '@/server/auth'

export default async function Home() {
  const auth = await withAuth()
  if (auth.user) redirect(getAuthenticatedLandingPath(auth))
  redirect('/login')
}
