import { describe, expect, test } from 'vitest'

import { etiquetaEstadoRonda, getEstadoRondaVisible, resumirPanel } from './estado-visible'

const metricas = {
  cupos_totales: 10,
  cupos_reclamados: 3,
  fichas_enviadas: 3,
  fichas_pendientes: 0,
  envios_finales: 3,
  envios_esperados: 3,
  pt_configurado: true,
}

describe('getEstadoRondaVisible', () => {
  test('una ronda activa con cupos sin reclamar pero con envíos completos está lista para exportar', () => {
    const estado = getEstadoRondaVisible({ id: 'r1', estado: 'activa' }, metricas)
    expect(estado.clave).toBe('lista_para_exportar')
    expect(estado.etiqueta).toBe('Lista para exportar')
    expect(estado.href).toBe('/dashboard/rondas/r1/resultados')
  })

  test('sin cupos reclamados pide invitar participantes', () => {
    const estado = getEstadoRondaVisible(
      { id: 'r1', estado: 'activa' },
      { ...metricas, cupos_reclamados: 0, fichas_enviadas: 0, envios_finales: 0, envios_esperados: 0 }
    )
    expect(estado.clave).toBe('invitar_participantes')
    expect(estado.href).toBe('/dashboard/rondas/r1/participantes')
  })

  test('borrador y documentación pendiente tienen estado propio', () => {
    expect(getEstadoRondaVisible({ id: 'r1', estado: 'borrador' }, metricas).clave).toBe('borrador')
    expect(getEstadoRondaVisible({ id: 'r1', estado: 'documentacion_pendiente' }, metricas).href).toBe(
      '/dashboard/rondas/r1/sgc'
    )
    expect(getEstadoRondaVisible({ id: 'r1', estado: 'cerrada' }, metricas).etiqueta).toBe('Cerrada')
  })

  test('sin participantes con PT configurado lleva a participantes', () => {
    const estado = getEstadoRondaVisible({ id: 'r1', estado: 'activa' }, { ...metricas, cupos_totales: 0 })
    expect(estado.clave).toBe('preparar_ronda')
    expect(estado.href).toBe('/dashboard/rondas/r1/participantes')
  })

  test('etiquetas del ciclo de vida con tildes', () => {
    expect(etiquetaEstadoRonda('documentacion_pendiente')).toBe('Documentación pendiente')
    expect(etiquetaEstadoRonda('activa')).toBe('Activa')
  })
})

describe('resumirPanel', () => {
  test('los avisos de una sola ronda enlazan a esa ronda', () => {
    const resumen = resumirPanel(
      [{ id: 'r1', estado: 'activa' }, { id: 'r2', estado: 'borrador' }],
      [{ ronda: { id: 'r1', estado: 'activa' }, metricas }]
    )
    expect(resumen.cuposSinReclamar).toBe(7)
    expect(resumen.listasParaExportar).toBe(1)
    expect(resumen.avisos.find((a) => a.id === 'cupos-sin-reclamar')?.href).toBe(
      '/dashboard/rondas/r1/participantes?filtro=enlace_pendiente'
    )
    expect(resumen.avisos.find((a) => a.id === 'rondas-en-borrador')?.href).toBe('/dashboard/rondas/r2')
  })
})
