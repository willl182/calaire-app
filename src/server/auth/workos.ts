import { WorkOS } from '@workos-inc/node'
import { revalidateTag, unstable_cache } from 'next/cache'
import { env, requireEnv } from '@/env'

let _workos: WorkOS | null = null

function getWorkOS(): WorkOS {
  if (!_workos) {
    _workos = new WorkOS(requireEnv('WORKOS_API_KEY', env.WORKOS_API_KEY))
  }
  return _workos
}

export type WorkOSUserResult = {
  id: string
  email: string
  displayName: string
}

export type WorkOSUserListItem = WorkOSUserResult & {
  firstName: string | null
  lastName: string | null
}

export async function findUserByEmail(email: string): Promise<WorkOSUserResult | null> {
  const { data } = await getWorkOS().userManagement.listUsers({
    email,
    limit: 1,
  })

  const user = data[0]
  if (!user) return null

  const parts = [user.firstName, user.lastName].filter(Boolean)
  return {
    id: user.id,
    email: user.email,
    displayName: parts.length > 0 ? parts.join(' ') : user.email,
  }
}

export async function createWorkOSUser(
  email: string,
  firstName?: string,
  lastName?: string,
): Promise<WorkOSUserResult> {
  const user = await getWorkOS().userManagement.createUser({
    email,
    emailVerified: false,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  })
  revalidateTag(WORKOS_USERS_CACHE_TAG, 'max')

  const parts = [user.firstName, user.lastName].filter(Boolean)
  return {
    id: user.id,
    email: user.email,
    displayName: parts.length > 0 ? parts.join(' ') : user.email,
  }
}

export async function listWorkOSUsers(limit = 100): Promise<WorkOSUserListItem[]> {
  const paginator = await getWorkOS().userManagement.listUsers({ limit })
  const users = await paginator.autoPagination()

  return users.map((user) => {
    const parts = [user.firstName, user.lastName].filter(Boolean)
    return {
      id: user.id,
      email: user.email,
      displayName: parts.length > 0 ? parts.join(' ') : user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    }
  })
}

export const WORKOS_USERS_CACHE_TAG = 'workos-users'

/**
 * `listWorkOSUsers` con caché del servidor (5 min). Recorrer todas las páginas de
 * usuarios tarda varios segundos; los nombres casi no cambian. Al crear un
 * usuario se invalida con `revalidateTag(WORKOS_USERS_CACHE_TAG, 'max')`.
 */
export const listWorkOSUsersCached = unstable_cache(
  (limit: number = 100) => listWorkOSUsers(limit),
  ['workos-users-list'],
  { revalidate: 300, tags: [WORKOS_USERS_CACHE_TAG] },
)
