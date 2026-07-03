// Reglas puras de visibilidad del expediente Drive para el participante.
//
// Decision de producto (Fase 8): el participante es SOLO visualizador y nunca
// recibe un enlace de Google Drive. Ni el enlace de trabajo editable (`webUrl`)
// ni un definitivo que sea enlace externo de Drive se exponen. El participante
// unicamente ve los archivos que el administrador sube manualmente a la app
// (Convex storage), que luego se sirven como URL de descarga firmada.
//
// Estas funciones son puras (sin dependencias de Convex) para poder testearlas.
// `convex/sgc/drive.ts` las usa y ademas resuelve la URL firmada con `ctx.storage`.

const ESTADOS_NO_PUBLICABLES = new Set(['retirado', 'reemplazado', 'no_aplica'])

export type DriveVisibilityDefinitivo =
  | { storageId: unknown; webUrl?: undefined }
  | { webUrl: string; storageId?: undefined }
  | null
  | undefined

export type DriveVisibilityRecurso = {
  tipo: string
  estado: string
  publicaParticipante?: boolean | null
  definitivo?: DriveVisibilityDefinitivo
}

/**
 * Un definitivo solo es "archivo subido por el admin" cuando referencia un
 * `storageId` de Convex. Un definitivo con `webUrl` es un enlace externo de
 * Drive y NO se comparte con el participante.
 */
export function definitivoEsArchivoSubido(definitivo: DriveVisibilityDefinitivo): boolean {
  return Boolean(
    definitivo &&
      typeof definitivo === 'object' &&
      'storageId' in definitivo &&
      definitivo.storageId
  )
}

/**
 * El participante solo ve un recurso Drive cuando:
 *  - no es una carpeta,
 *  - el admin lo marco como publicable (`publicaParticipante`),
 *  - su estado no es retirado/reemplazado/no_aplica, y
 *  - tiene un definitivo cargado como archivo en la app (Convex storage).
 */
export function esRecursoVisibleParaParticipante(recurso: DriveVisibilityRecurso): boolean {
  if (recurso.tipo === 'carpeta') return false
  if (!recurso.publicaParticipante) return false
  if (ESTADOS_NO_PUBLICABLES.has(recurso.estado)) return false
  return definitivoEsArchivoSubido(recurso.definitivo)
}
