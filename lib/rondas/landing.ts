// Resolucion pura del destino de aterrizaje de un participante para su ronda.
// Sin dependencias de Convex para poder testearla directamente. `client.ts` la
// re-exporta y `getParticipanteLandingPath` la usa tras leer las rondas asignadas.

export type ParticipanteLandingRonda = {
  codigo: string
  ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
}

/**
 * Un participante sin ficha enviada aterriza en el registro de su ronda; con
 * ficha enviada, en la ronda. Nunca en un dashboard global.
 */
export function getRondaParticipanteLandingPath(ronda: ParticipanteLandingRonda) {
  if (ronda.ficha_estado !== 'enviado') return `/ronda/${ronda.codigo}/registro`
  return `/ronda/${ronda.codigo}`
}
