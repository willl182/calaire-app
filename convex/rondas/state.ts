export const PENDING_PREFIX = 'pendiente:'
export const CONTAMINANTES_ORDER = ['CO', 'SO2', 'O3', 'NO', 'NO2'] as const

export type RondaEstado = 'borrador' | 'activa' | 'documentacion_pendiente' | 'cerrada'

export function contaminanteIdx(c: string): number {
  return CONTAMINANTES_ORDER.indexOf(c as (typeof CONTAMINANTES_ORDER)[number])
}

export function assertAllowedEstadoTransition(current: RondaEstado, next: RondaEstado) {
  if (current === next) return
  if (current === 'cerrada' && next !== 'documentacion_pendiente') {
    throw new Error('Una ronda cerrada solo puede reabrirse a documentacion pendiente.')
  }
  if (current === 'borrador' && next !== 'activa') throw new Error('Una ronda en borrador solo puede pasar a activa.')
  if (current === 'activa' && next !== 'documentacion_pendiente') {
    throw new Error('Una ronda activa solo puede pasar a documentacion pendiente.')
  }
  if (current === 'documentacion_pendiente' && next !== 'cerrada') {
    throw new Error('Una ronda en documentacion pendiente solo puede pasar a cerrada.')
  }
}
