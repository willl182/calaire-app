import type { FiltroParticipante, ParticipanteRondaResumen } from './types'

export function filtrarParticipantes(
  participantes: ParticipanteRondaResumen[],
  filtro: FiltroParticipante
): ParticipanteRondaResumen[] {
  switch (filtro) {
    case 'enlace_pendiente':
      return participantes.filter((p) => p.estado === 'pendiente')
    case 'ficha_pendiente':
      return participantes.filter(
        (p) => p.estado === 'reclamado' && p.ficha_estado !== 'enviado'
      )
    case 'ficha_enviada':
      return participantes.filter((p) => p.ficha_estado === 'enviado')
    case 'con_envios':
      return participantes.filter((p) => p.envios_pt_count > 0)
    case 'sin_envios':
      return participantes.filter(
        (p) => p.estado === 'reclamado' && p.envios_pt_count === 0
      )
    default:
      return participantes
  }
}
