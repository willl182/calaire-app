import type { Ronda, RondaMetricasBase, RondaMetricasDerivadas } from './types'

export function derivarEstadoOperativo(
  ronda: Pick<Ronda, 'estado'>,
  datos: RondaMetricasBase
): RondaMetricasDerivadas {
  if (ronda.estado === 'cerrada') {
    return { estado_operativo: 'cerrada', accion_recomendada: 'La ronda está cerrada.' }
  }
  if (!datos.pt_configurado) {
    return { estado_operativo: 'preparar_ronda', accion_recomendada: 'Configure los niveles PT.' }
  }
  if (datos.cupos_totales === 0) {
    return { estado_operativo: 'preparar_ronda', accion_recomendada: 'Agregue participantes antes de activar la ronda.' }
  }
  if (datos.cupos_reclamados === 0) {
    return { estado_operativo: 'invitar_participantes', accion_recomendada: 'Comparta los enlaces de invitación. Ningún cupo ha sido reclamado.' }
  }
  if (datos.fichas_pendientes > 0) {
    return { estado_operativo: 'esperando_fichas', accion_recomendada: 'Hay fichas pendientes antes de recibir resultados.' }
  }
  if (datos.envios_finales === 0) {
    return { estado_operativo: 'recibiendo_resultados', accion_recomendada: 'Esperando envíos finales de los participantes.' }
  }
  if (datos.envios_finales > 0 && datos.envios_finales < datos.envios_esperados) {
    return { estado_operativo: 'revisar_incompletos', accion_recomendada: 'Hay participantes que no han enviado resultados.' }
  }
  return { estado_operativo: 'lista_para_exportar', accion_recomendada: 'Todos los envíos están completos. Puede exportar el CSV PT.' }
}
