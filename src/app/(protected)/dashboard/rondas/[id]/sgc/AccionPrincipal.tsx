import type { SgcAvanceItem, SgcDriveRecurso } from '@/server/sgc'

type Props = {
  item: SgcAvanceItem
  recurso: SgcDriveRecurso | undefined
  rondaId: string
  driveGoogleReady: boolean
  carpetaRondaCreada: boolean
}

/** Acción principal del documento según su estado (se completa en C1.3). */
export function AccionPrincipal(_props: Props) {
  return null
}
