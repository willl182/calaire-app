'use client'

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { AuthKitProvider, useAccessToken } from '@workos-inc/authkit-nextjs/components'
import type { ReactNode } from 'react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
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
