import { describe, expect, it } from 'vitest'
import { nombrarUsuarios, notaVisible } from './notas'

describe('nombrarUsuarios', () => {
  it('reemplaza ids de WorkOS por nombres', () => {
    const nombres = { user_01ABCDEFGHIJ: 'Ana Pérez' }
    expect(nombrarUsuarios('Revisado por user_01ABCDEFGHIJ.', nombres)).toBe('Revisado por Ana Pérez.')
    expect(nombrarUsuarios('user_01ZZZZZZZZZZ', nombres)).toBe('un usuario')
    expect(nombrarUsuarios('coordinador', nombres)).toBe('coordinador')
  })
})

describe('notaVisible', () => {
  it('oculta notas internas del catálogo', () => {
    expect(notaVisible('Existe en docs/EA-PP-2026-R1 y se cubre con datos nativos de ronda.')).toBeNull()
    expect(notaVisible('Formato maestro XLSX pendiente de integrar como evidencia de ronda.')).toBeNull()
    expect(notaVisible('Exportacion operativa pendiente de exponerse en el expediente.')).toBeNull()
    expect(notaVisible('  ')).toBeNull()
  })

  it('mantiene notas útiles', () => {
    expect(notaVisible('Aplica si la ronda usa proveedores criticos.')).toBe('Aplica si la ronda usa proveedores criticos.')
  })
})
