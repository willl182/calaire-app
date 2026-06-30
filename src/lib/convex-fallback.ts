type ConvexOfflineError = Error & { cause?: { code?: string; message?: string } }

export function isConvexOffline(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as ConvexOfflineError
  const cause = err.cause as { code?: string; message?: string } | undefined
  const code = cause?.code ?? (error as { code?: string }).code
  const message = err.message ?? ''
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'EAI_AGAIN') return true
  if (message.includes('fetch failed')) return true
  if (message.includes('ECONNREFUSED')) return true
  return false
}

export async function safeConvexCall<T>(
  operation: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (isConvexOffline(error)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[convex] backend offline, usando fallback para ${operation}`)
      }
      return fallback
    }
    throw error
  }
}
