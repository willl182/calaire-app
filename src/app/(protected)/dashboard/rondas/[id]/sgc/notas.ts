/**
 * Notas del catálogo que son internas para el equipo de desarrollo (rutas del repositorio,
 * "pendiente de integrar", etc.) y no deben mostrarse al coordinador.
 */
const NOTA_INTERNA_RE = /(docs\/|pendiente de integrar|pendiente de exponerse|pendiente de enlazar|formato maestro xlsx)/i

export function notaVisible(nota?: string | null) {
  const texto = nota?.trim()
  if (!texto || NOTA_INTERNA_RE.test(texto)) return null
  return texto
}

const ID_WORKOS_RE = /user_[A-Za-z0-9]{10,}/g

/** Reemplaza ids de WorkOS dentro de un texto por el nombre del usuario (o "un usuario"). */
export function nombrarUsuarios(texto: string | null | undefined, nombres: Record<string, string>) {
  if (!texto) return texto ?? ''
  return texto.replace(ID_WORKOS_RE, (id) => nombres[id] ?? 'un usuario')
}
