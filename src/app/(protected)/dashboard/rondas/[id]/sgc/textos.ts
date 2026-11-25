import { listWorkOSUsersCached } from '@/server/auth/workos'

/** Mapa id de WorkOS → nombre visible (se resuelve en el servidor). Si WorkOS falla, mapa vacío. */
export async function getNombresUsuarios(): Promise<Record<string, string>> {
  try {
    const usuarios = await listWorkOSUsersCached(100)
    return Object.fromEntries(usuarios.map((u) => [u.id, u.displayName]))
  } catch {
    return {}
  }
}
