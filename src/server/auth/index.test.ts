import { describe, expect, it, vi } from 'vitest'

vi.mock('@workos-inc/authkit-nextjs', () => ({ withAuth: vi.fn() }))

import type { AuthSession } from './index'
import { getAuthenticatedLandingPath, isStaff } from './index'

function authWithRole(role: string | undefined): AuthSession {
  return { role } as AuthSession
}

describe('authenticated landing path', () => {
  it.each(['admin', 'admin_sgc', 'coordinador_proceso', 'consulta'])('sends staff role %s to inicio', (role) => {
    const auth = authWithRole(role)

    expect(isStaff(auth)).toBe(true)
    expect(getAuthenticatedLandingPath(auth)).toBe('/inicio')
  })

  it.each(['member', 'participante', undefined])('sends non-staff role %s to mi-dashboard', (role) => {
    const auth = authWithRole(role)

    expect(isStaff(auth)).toBe(false)
    expect(getAuthenticatedLandingPath(auth)).toBe('/mi-dashboard')
  })
})
