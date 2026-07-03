import { withAuth } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

export type AppRole = 'admin' | 'participante' | 'admin_sgc' | 'coordinador_proceso' | 'consulta'
export type AuthSession = Awaited<ReturnType<typeof withAuth>>

export async function getAuthUser() {
  const auth = await withAuth()
  return auth.user ?? null
}

export async function requireAuth(): Promise<AuthSession> {
  return withAuth({ ensureSignedIn: true })
}

export async function requireAdminAuth(): Promise<AuthSession> {
  const auth = await requireAuth()

  if (!isAdmin(auth)) {
    redirect('/denied?reason=role')
  }

  return auth
}

// WorkOS almacena el rol en la membresía de la organización.
// Por convención usamos: role === 'admin' para coordinadores.
export function isAdmin(auth: AuthSession): boolean {
  return auth.role === 'admin'
}

function authRole(auth: AuthSession) {
  return String(auth.role ?? '').toLowerCase()
}

export function canViewSgcMaestro(auth: AuthSession): boolean {
  return ['admin', 'admin_sgc', 'coordinador_proceso', 'consulta'].includes(authRole(auth))
}

export function canEditSgcMaestro(auth: AuthSession): boolean {
  return ['admin', 'admin_sgc', 'coordinador_proceso'].includes(authRole(auth))
}

export function isParticipante(auth: AuthSession): boolean {
  return auth.role === 'member' || auth.role === 'participante'
}
