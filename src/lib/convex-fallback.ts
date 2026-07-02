type ConvexOfflineError = Error & { cause?: unknown }

export type ConvexCallResult<T> = {
  data: T
  offline: boolean
}

function collectErrorDetails(error: unknown): Array<{ code?: string; message?: string }> {
  const details: Array<{ code?: string; message?: string }> = []
  let current = error

  while (current && typeof current === 'object') {
    const value = current as { code?: string; message?: string; cause?: unknown }
    details.push({ code: value.code, message: value.message })
    current = value.cause
  }

  return details
}

export function isConvexOffline(error: unknown): boolean {
  const details = collectErrorDetails(error as ConvexOfflineError)
  const offlineCodes = new Set([
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENETUNREACH',
  ])

  if (details.some(({ code }) => code && (offlineCodes.has(code) || code.startsWith('UND_ERR_')))) {
    return true
  }

  const message = details.map((detail) => detail.message ?? '').join(' ')
  if (message.includes('fetch failed')) return true
  if (message.includes('ECONNREFUSED')) return true
  if (message.includes('ENOTFOUND')) return true
  if (message.includes('EAI_AGAIN')) return true
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

export async function safeConvexCallWithStatus<T>(
  operation: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<ConvexCallResult<T>> {
  try {
    return { data: await fn(), offline: false }
  } catch (error) {
    if (isConvexOffline(error)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[convex] backend offline, usando fallback para ${operation}`)
      }
      return { data: fallback, offline: true }
    }
    throw error
  }
}
