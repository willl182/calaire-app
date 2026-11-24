import { describe, expect, it } from 'vitest'
import { enriquecerRecursoConCatalogo } from '../../../convex/_lib/sgc/expediente'

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
