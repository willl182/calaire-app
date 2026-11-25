/**
 * Estado de ronda visible: una sola fuente para el panel, la lista de rondas
 * y el detalle de ronda. La prioridad de estados es la de `derivarEstadoOperativo`
 * (src/server/rondas/estados.ts); aquí se agregan la etiqueta, el tono y el
 * enlace a la acción recomendada.
 */
import { derivarEstadoOperativo } from '../../server/rondas/estados'
import type { EstadoOperativo, EstadoRonda, RondaMetricasBase } from '../../server/rondas/types'
import type { Tono } from '../ui/tonos'

export type EstadoRondaVisibleClave = EstadoOperativo | 'borrador' | 'documentacion_pendiente'

export type EstadoRondaVisible = {
  clave: EstadoRondaVisibleClave
  etiqueta: string
  tono: Tono
  /** Frase con la acción recomendada. */
  descripcion: string
  /** Texto corto del enlace a la acción recomendada. */
  accion: string
  href: string
}

const CONFIG: Record<EstadoRondaVisibleClave, { etiqueta: string; tono: Tono; accion: string; ruta: string }> = {
  borrador: { etiqueta: 'Borrador', tono: 'aviso', accion: 'Preparar y activar', ruta: '' },
  preparar_ronda: { etiqueta: 'Preparar ronda', tono: 'aviso', accion: 'Configurar', ruta: '/configuracion-pt' },
  invitar_participantes: { etiqueta: 'Invitar participantes', tono: 'info', accion: 'Ver participantes', ruta: '/participantes' },
  esperando_fichas: { etiqueta: 'Esperando fichas', tono: 'especial', accion: 'Ver participantes', ruta: '/participantes' },
  recibiendo_resultados: { etiqueta: 'Recibiendo resultados', tono: 'info', accion: 'Ver resultados', ruta: '/resultados' },
  revisar_incompletos: { etiqueta: 'Revisar incompletos', tono: 'aviso', accion: 'Ver resultados', ruta: '/resultados' },
  lista_para_exportar: { etiqueta: 'Lista para exportar', tono: 'exito', accion: 'Ver resultados', ruta: '/resultados' },
  documentacion_pendiente: { etiqueta: 'Documentación pendiente', tono: 'info', accion: 'Ir al SGC', ruta: '/sgc' },
  cerrada: { etiqueta: 'Cerrada', tono: 'neutral', accion: 'Ver', ruta: '' },
}

export function getEstadoRondaVisible(
  ronda: { id: string; estado: EstadoRonda },
  metricas: RondaMetricasBase
): EstadoRondaVisible {
  const base = `/dashboard/rondas/${ronda.id}`

  let clave: EstadoRondaVisibleClave
  let descripcion: string
  if (ronda.estado === 'borrador') {
    clave = 'borrador'
    descripcion = metricas.pt_configurado
      ? 'La ronda está en borrador. Revise la configuración y actívela.'
      : 'La ronda está en borrador. Configure los niveles PT y actívela.'
  } else if (ronda.estado === 'documentacion_pendiente') {
    clave = 'documentacion_pendiente'
    descripcion = 'La captura terminó. Complete el expediente documental para cerrar la ronda.'
  } else {
    const derivado = derivarEstadoOperativo(ronda, metricas)
    clave = derivado.estado_operativo
    descripcion = derivado.accion_recomendada
  }

  const config = CONFIG[clave]
  const ruta = clave === 'preparar_ronda' && metricas.pt_configurado ? '/participantes' : config.ruta
  return {
    clave,
    etiqueta: config.etiqueta,
    tono: config.tono,
    descripcion,
    accion: clave === 'preparar_ronda' && metricas.pt_configurado ? 'Agregar participantes' : config.accion,
    href: `${base}${ruta}`,
  }
}

/** Etiqueta del ciclo de vida (borrador / activa / …), con mayúscula y tildes. */
export const ETIQUETA_ESTADO_RONDA: Record<EstadoRonda, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  documentacion_pendiente: 'Documentación pendiente',
  cerrada: 'Cerrada',
}

export const TONO_ESTADO_RONDA: Record<EstadoRonda, Tono> = {
  borrador: 'aviso',
  activa: 'exito',
  documentacion_pendiente: 'info',
  cerrada: 'neutral',
}

export function etiquetaEstadoRonda(estado: string): string {
  return ETIQUETA_ESTADO_RONDA[estado as EstadoRonda] ?? estado
}

export function tonoEstadoRonda(estado: string): Tono {
  return TONO_ESTADO_RONDA[estado as EstadoRonda] ?? 'aviso'
}

// ---------------------------------------------------------------------------
// Resumen del panel: indicadores y avisos con las mismas métricas del detalle
// ---------------------------------------------------------------------------

export type AvisoPanel = {
  id: string
  mensaje: string
  href: string
  cantidad: number
  tono: Tono
}

type RondaConMetricas = {
  ronda: { id: string; estado: EstadoRonda }
  metricas: RondaMetricasBase
}

function plural(n: number, singular: string, pluralTexto: string) {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}

/** Si un aviso afecta a una sola ronda, enlaza a ella; si no, a la vista global. */
function enlaceAviso(afectadas: RondaConMetricas[], rutaRonda: string, global: string) {
  return afectadas.length === 1 ? `/dashboard/rondas/${afectadas[0].ronda.id}${rutaRonda}` : global
}

export function resumirPanel(rondas: { id: string; estado: EstadoRonda }[], activas: RondaConMetricas[]) {
  const estados = activas.map(({ ronda, metricas }) => getEstadoRondaVisible(ronda, metricas))
  const cuposSinReclamar = activas.reduce((s, { metricas }) => s + (metricas.cupos_totales - metricas.cupos_reclamados), 0)
  const fichasPendientes = activas.reduce((s, { metricas }) => s + metricas.fichas_pendientes, 0)
  const listasParaExportar = estados.filter((e) => e.clave === 'lista_para_exportar').length
  const borradores = rondas.filter((r) => r.estado === 'borrador')

  const avisos: AvisoPanel[] = []

  const sinConfig = activas.filter(({ metricas }) => !metricas.pt_configurado)
  if (sinConfig.length > 0) {
    avisos.push({
      id: 'rondas-sin-config-pt',
      mensaje: `${plural(sinConfig.length, 'ronda activa', 'rondas activas')} sin configuración PT`,
      href: enlaceAviso(sinConfig, '/configuracion-pt', '/dashboard/rondas'),
      cantidad: sinConfig.length,
      tono: 'aviso',
    })
  }

  const conCupos = activas.filter(({ metricas }) => metricas.cupos_totales > metricas.cupos_reclamados)
  if (cuposSinReclamar > 0) {
    avisos.push({
      id: 'cupos-sin-reclamar',
      mensaje: `${plural(cuposSinReclamar, 'cupo sin reclamar', 'cupos sin reclamar')} en rondas activas`,
      href: enlaceAviso(conCupos, '/participantes?filtro=enlace_pendiente', '/dashboard/participantes#sin-enlace'),
      cantidad: cuposSinReclamar,
      tono: 'info',
    })
  }

  const conFichas = activas.filter(({ metricas }) => metricas.fichas_pendientes > 0)
  if (fichasPendientes > 0) {
    avisos.push({
      id: 'fichas-pendientes',
      mensaje: `${plural(fichasPendientes, 'ficha pendiente', 'fichas pendientes')} de envío`,
      href: enlaceAviso(conFichas, '/participantes?filtro=ficha_pendiente', '/dashboard/participantes'),
      cantidad: fichasPendientes,
      tono: 'aviso',
    })
  }

  if (borradores.length > 0) {
    avisos.push({
      id: 'rondas-en-borrador',
      mensaje: `${plural(borradores.length, 'ronda en borrador', 'rondas en borrador')}: actívela cuando esté lista`,
      href: borradores.length === 1 ? `/dashboard/rondas/${borradores[0].id}` : '/dashboard/rondas',
      cantidad: borradores.length,
      tono: 'info',
    })
  }

  return {
    estados,
    cuposSinReclamar,
    fichasPendientes,
    listasParaExportar,
    borradores: borradores.length,
    avisos,
  }
}
