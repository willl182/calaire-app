import { describe, expect, it } from 'vitest'
import { SGC_FORMATOS_FASE_1, SGC_RONDA_ETAPAS, getSgcFormato } from './catalog'

describe('integridad del catalogo SGC', () => {
  it('codigos de formatos unicos', () => {
    const codigos = SGC_FORMATOS_FASE_1.map((f) => f.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })

  it('keys, numeros y carpetas de etapas unicos', () => {
    for (const campo of ['key', 'numero', 'carpeta'] as const) {
      const valores = SGC_RONDA_ETAPAS.map((e) => e[campo])
      expect(new Set(valores).size, campo).toBe(valores.length)
    }
  })

  it('cada documento aparece en una sola etapa', () => {
    const vistos = new Map<string, string>()
    for (const etapa of SGC_RONDA_ETAPAS) {
      for (const doc of etapa.documentos) {
        expect(vistos.get(doc.codigo), `${doc.codigo} repetido`).toBeUndefined()
        vistos.set(doc.codigo, etapa.key)
      }
    }
  })

  it('formatoOperativo existe en SGC_FORMATOS_FASE_1', () => {
    for (const etapa of SGC_RONDA_ETAPAS) {
      for (const doc of etapa.documentos) {
        if (doc.formatoOperativo) expect(getSgcFormato(doc.formatoOperativo), doc.codigo).not.toBeNull()
      }
    }
  })

  it('F19 F20 F21 son criticos y no bloquean cierre', () => {
    for (const codigo of ['F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21'] as const) {
      const formato = getSgcFormato(codigo)
      expect(formato?.critico).toBe(true)
      expect(formato?.bloqueaCierre).toBe(false)
    }
  })

  it('carpetas de Inicio y Preparacion se mantienen (identificadores en Drive)', () => {
    const inicio = SGC_RONDA_ETAPAS.find((e) => e.key === 'inicio_ronda')
    expect(inicio?.carpeta).toBe('02A_inicio_ronda')
    expect(inicio?.documentos.map((d) => d.codigo)).toEqual(['F-PSEA-19'])
    const prep = SGC_RONDA_ETAPAS.find((e) => e.key === 'preparacion_item')
    expect(prep?.carpeta).toBe('03_preparacion_item')
    for (const codigo of ['F-PSEA-20', 'F-PSEA-21']) {
      expect(prep?.documentos.some((d) => d.codigo === codigo)).toBe(true)
    }
  })
})
