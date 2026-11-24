import { fetchMutation, fetchQuery } from 'convex/nextjs'
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server'
import { safeConvexCallWithStatus, type ConvexCallResult } from '@/lib/convex-fallback'
import { requireAuth } from '@/server/auth'

// Las funciones Convex exigen identidad (requireIdentity/requireAdminIdentity...).
// El cliente de servidor reenvía el accessToken de la sesión en cada llamada;
// sin él, el backend rechaza al usuario autenticado ("Autenticacion requerida").
export async function getConvexToken(contexto = 'operar la aplicación'): Promise<string> {
  const auth = await requireAuth()
  const token = auth.accessToken
  if (!token) {
    throw new Error(`No hay sesion activa para ${contexto}.`)
  }
  return token
}

export async function authedQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> {
  return fetchQuery(query, args, { token: await getConvexToken() })
}

export async function authedMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  args: FunctionArgs<Mutation>,
): Promise<FunctionReturnType<Mutation>> {
  return fetchMutation(mutation, args, { token: await getConvexToken() })
}

/**
 * Envuelve `fn` para que, si Convex está offline, devuelva `fallback` con
 * `offline: true` en lugar de lanzar. Uso: `export const XWithStatus = withStatus('X', X, vacio)`.
 */
export function withStatus<A extends unknown[], T>(
  operation: string,
  fn: (...args: A) => Promise<T>,
  fallback: T,
): (...args: A) => Promise<ConvexCallResult<T>> {
  return (...args) => safeConvexCallWithStatus(operation, () => fn(...args), fallback)
}

/** Versión sin estado de una función `XWithStatus`: `export const X = dataOf(XWithStatus)`. */
export function dataOf<A extends unknown[], T>(
  fn: (...args: A) => Promise<ConvexCallResult<T>>,
): (...args: A) => Promise<T> {
  return async (...args) => (await fn(...args)).data
}
