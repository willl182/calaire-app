'use client'

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { AuthKitProvider, useAccessToken } from '@workos-inc/authkit-nextjs/components'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

function createConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) {
    throw new Error(
      'No address provided to ConvexReactClient. ' +
        'If trying to deploy to production, make sure to follow all the instructions found at https://docs.convex.dev/production/hosting/ ' +
        'If running locally, make sure to run `convex dev` and ensure the .env.local file is populated.'
    )
  }
  return new ConvexReactClient(url)
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // Only instantiate the Convex client on the client side. Creating it during
  // SSR/static prerendering fails when NEXT_PUBLIC_CONVEX_URL is unavailable
  // in the build environment and Convex expects a browser runtime.
  const convex = useMemo(() => (mounted ? createConvexClient() : null), [mounted])

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  if (!mounted || !convex) {
    return null
  }

  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  )
}

function useConvexAuth() {
  const { accessToken, loading } = useAccessToken()

  return {
    isLoading: loading,
    isAuthenticated: Boolean(accessToken),
    fetchAccessToken: async () => accessToken ?? null,
  }
}
