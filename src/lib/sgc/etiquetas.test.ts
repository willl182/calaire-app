import { describe, expect, it } from 'vitest'

import { etiquetaVisible } from './etiquetas'

describe('etiquetaVisible', () => {
  it('pone tildes en nombres del catálogo', () => {
    expect(etiquetaVisible('F-PSEA-06 Planificacion de ronda EA')).toBe('F-PSEA-06 Planificación de ronda EA')
    expect(etiquetaVisible('Relacion de instrumentos')).toBe('Relación de instrumentos')
    expect(etiquetaVisible('Ficha basica de ronda')).toBe('Ficha básica de ronda')
    expect(etiquetaVisible('Preparacion y control del item')).toBe('Preparación y control del ítem')
    expect(etiquetaVisible('Revision tecnica')).toBe('Revisión técnica')
  })

  it('no toca códigos, plurales ni palabras ya acentuadas', () => {
    expect(etiquetaVisible('F-PSEA-19 Comunicaciones')).toBe('F-PSEA-19 Comunicaciones')
    expect(etiquetaVisible('Análisis e informe')).toBe('Análisis e informe')
    expect(etiquetaVisible('SIN VERSION')).toBe('SIN VERSIÓN')
    expect(etiquetaVisible('Ion')).toBe('Ion')
  })
})
