import { describe, expect, it } from 'vitest'
import { compararExpedienteConCatalogo, enriquecerRecursoConCatalogo } from '../../../convex/_lib/sgc/expediente'
import { SGC_RONDA_ETAPAS } from './catalog'

describe('enriquecerRecursoConCatalogo', () => {
  it('toma orden, responsable y obligatoriedad del catalogo aunque la copia guardada sea antigua', () => {
    const guardado = { codigo: 'f-psea-14', tipo: 'documento', critico: true, bloqueaCierre: true }
    const recurso = enriquecerRecursoConCatalogo(guardado)
    expect(recurso.bloqueaCierre).toBe(false)
    expect(recurso.politica).toMatchObject({
      enCatalogo: true,
      obligatoriedad: 'si_aplica',
      responsable: 'coordinador',
      etapaKey: 'cierre',
    })
  })

  it('carpetas y recursos fuera del catalogo conservan lo guardado', () => {
    const carpeta = enriquecerRecursoConCatalogo({ codigo: 'PLANIFICACION', tipo: 'carpeta', critico: false })
    expect(carpeta.politica.enCatalogo).toBe(false)
    const extra = enriquecerRecursoConCatalogo({ codigo: 'OTRO-1', tipo: 'documento', bloqueaCierre: true })
    expect(extra.bloqueaCierre).toBe(true)
    expect(extra.politica.enCatalogo).toBe(false)
  })
})

function expedienteCompleto() {
  return [
    { _id: 'root', codigo: 'DRIVE_ROOT', tipo: 'carpeta', parentId: null },
    ...SGC_RONDA_ETAPAS.map((e) => ({ _id: e.key, codigo: e.key.toUpperCase(), tipo: 'carpeta', parentId: 'root' })),
    ...SGC_RONDA_ETAPAS.flatMap((e) =>
      e.documentos.map((d) => ({ _id: d.codigo, codigo: d.codigo, tipo: 'documento', parentId: e.key }))
    ),
  ]
}

describe('compararExpedienteConCatalogo', () => {
  it('sin raiz no esta inicializado', () => {
    const r = compararExpedienteConCatalogo([])
    expect(r.inicializado).toBe(false)
    expect(r.carpetasFaltantes).toHaveLength(SGC_RONDA_ETAPAS.length)
  })

  it('detecta documento en otra carpeta y recursos fuera del catalogo', () => {
    const recursos = [...expedienteCompleto(), { _id: 'x', codigo: 'VIEJO-1', tipo: 'documento', parentId: 'root' }]
    expect(compararExpedienteConCatalogo(recursos).sincronizado).toBe(true)
    const movido = recursos.map((r) => (r.codigo === 'F-PSEA-21' ? { ...r, parentId: 'inicio_ronda' } : r))
    const res = compararExpedienteConCatalogo(movido)
    expect(res.sincronizado).toBe(false)
    expect(res.documentosEnOtraCarpeta).toEqual([
      { codigo: 'F-PSEA-21', etapaKey: 'preparacion_item', carpeta: '03_preparacion_item' },
    ])
    expect(res.recursosFueraDeCatalogo).toEqual([{ codigo: 'VIEJO-1', tipo: 'documento' }])
  })
})
