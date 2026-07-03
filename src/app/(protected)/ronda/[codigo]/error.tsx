'use client'

import { ConvexErrorView } from '@/components/ui/ConvexErrorView'

export default function RondaError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return <ConvexErrorView error={error} retry={unstable_retry} section="Ronda" />
}
