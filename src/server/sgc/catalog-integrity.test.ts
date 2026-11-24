import { describe, expect, it } from 'vitest'
import { SGC_DOCUMENTOS_ORDEN_LOGICO, SGC_FORMATOS_FASE_1, SGC_RONDA_ETAPAS, getSgcFormato, getSgcRondaDocumento } from './catalog'

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

  it('orden por etapa consecutivo y ordenLogico global unico', () => {
    for (const etapa of SGC_RONDA_ETAPAS) {
      expect(etapa.documentos.map((d) => d.orden), etapa.key).toEqual(etapa.documentos.map((_, i) => i + 1))
    }
    const logicos = SGC_DOCUMENTOS_ORDEN_LOGICO.map((d) => d.ordenLogico)
    expect(new Set(logicos).size).toBe(logicos.length)
  })

  it('Planificacion sigue F-06, F-01, F-02, F-05, F-03, F-04, F-16, F-17', () => {
    const plan = SGC_RONDA_ETAPAS.find((e) => e.key === 'planificacion')
    expect(plan?.documentos.map((d) => d.codigo)).toEqual([
      'F-PSEA-06', 'F-PSEA-01', 'F-PSEA-02', 'F-PSEA-05', 'F-PSEA-03', 'F-PSEA-04', 'F-PSEA-16', 'F-PSEA-17',
    ])
  })

  it('orden logico respeta dependencias de las decisiones 2026-11-24', () => {
    const pos = (codigo: string) => SGC_DOCUMENTOS_ORDEN_LOGICO.findIndex((d) => d.codigo === codigo)
    expect(pos('F-PSEA-21')).toBeLessThan(pos('F-PSEA-19'))
    expect(pos('F-PSEA-07')).toBeLessThan(pos('F-PSEA-19'))
    expect(pos('F-PSEA-11')).toBeLessThan(pos('F-PSEA-12'))
    expect(pos('F-PSEA-10')).toBeLessThan(pos('F-PSEA-11A'))
    expect(pos('F-PSEA-13')).toBeLessThan(pos('EVID-ENVIO'))
    expect(SGC_DOCUMENTOS_ORDEN_LOGICO.at(-1)?.codigo).toBe('EVID-CIERRE')
  })

  it('responsable y obligatoriedad segun decisiones del usuario', () => {
    const doc = (codigo: string) => getSgcRondaDocumento(codigo)
    expect(doc('F-PSEA-01')?.responsable).toBe('coordinador')
    expect(doc('F-PSEA-05')?.responsable).toBe('automatico')
    expect(doc('F-PSEA-04')).toMatchObject({ responsable: 'automatico', obligatoriedad: 'obligatorio' })
    expect(doc('F-PSEA-16')?.obligatoriedad).toBe('obligatorio')
    expect(doc('F-PSEA-17')?.obligatoriedad).toBe('si_aplica')
    expect(doc('F-PSEA-18')?.obligatoriedad).toBe('obligatorio')
    expect(doc('EVID-COM')?.responsable).toBe('automatico')
    for (const codigo of ['EVID-CERT', 'EVID-MONT', 'F-PSEA-11', 'F-PSEA-11A', 'F-PSEA-11B', 'F-PSEA-11C', 'F-PSEA-11D', 'F-PSEA-14', 'F-PSEA-15']) {
      expect(doc(codigo)?.obligatoriedad, codigo).toBe('si_aplica')
      expect(doc(codigo)?.bloqueaCierre, codigo).toBe(false)
    }
    expect(doc('F-PSEA-12')?.responsable).toBe('coordinador')
    expect(doc('EVID-SALIDAS')?.responsable).toBe('coordinador')
    expect(doc('EVID-ENVIO')?.responsable).toBe('automatico')
    expect(doc('f-psea-19')?.codigo).toBe('F-PSEA-19')
  })
})
