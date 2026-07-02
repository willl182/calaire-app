import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

function getForwardedOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = (forwardedHost ?? request.headers.get('host'))?.split(',')[0]?.trim()

  if (!host) return request.nextUrl.origin

  const forwardedProto = request.headers.get('x-forwarded-proto')
  const proto = forwardedProto?.split(',')[0]?.trim() ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
  const signInUrl = await getSignInUrl({
    redirectUri: new URL('/auth/callback', getForwardedOrigin(request)).toString(),
  })
  redirect(signInUrl)
}
