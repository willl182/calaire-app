import assert from 'node:assert/strict'
import test from 'node:test'
import {
  definitivoEsArchivoSubido,
  esRecursoVisibleParaParticipante,
  type DriveVisibilityRecurso,
} from './drive-visibility.ts'

function recurso(overrides: Partial<DriveVisibilityRecurso> = {}): DriveVisibilityRecurso {
  return {
    tipo: 'documento',
    estado: 'diligenciado',
    publicaParticipante: true,
    definitivo: { storageId: 'kg2abc' },
    ...overrides,
  }
}

test('definitivoEsArchivoSubido solo es true con storageId presente', () => {
  assert.equal(definitivoEsArchivoSubido({ storageId: 'kg1' }), true)
  assert.equal(definitivoEsArchivoSubido({ webUrl: 'https://drive.google.com/x' }), false)
  assert.equal(definitivoEsArchivoSubido(null), false)
  assert.equal(definitivoEsArchivoSubido(undefined), false)
  // storageId vacio no cuenta como archivo cargado
  assert.equal(definitivoEsArchivoSubido({ storageId: '' }), false)
})

test('recurso publicado con archivo subido es visible', () => {
  assert.equal(esRecursoVisibleParaParticipante(recurso()), true)
})

test('carpeta nunca es visible aunque este publicada con archivo', () => {
  assert.equal(esRecursoVisibleParaParticipante(recurso({ tipo: 'carpeta' })), false)
})

test('sin publicaParticipante no es visible', () => {
  assert.equal(esRecursoVisibleParaParticipante(recurso({ publicaParticipante: false })), false)
  assert.equal(esRecursoVisibleParaParticipante(recurso({ publicaParticipante: null })), false)
})

test('estados retirado/reemplazado/no_aplica no son visibles', () => {
  for (const estado of ['retirado', 'reemplazado', 'no_aplica']) {
    assert.equal(esRecursoVisibleParaParticipante(recurso({ estado })), false, estado)
  }
})

test('enlace externo de Drive como definitivo NO es visible (solo archivo subido)', () => {
  const externo = recurso({ definitivo: { webUrl: 'https://drive.google.com/file/d/abc/view' } })
  assert.equal(esRecursoVisibleParaParticipante(externo), false)
})

test('sin definitivo no es visible aunque tenga enlace editable de trabajo', () => {
  assert.equal(esRecursoVisibleParaParticipante(recurso({ definitivo: null })), false)
  assert.equal(esRecursoVisibleParaParticipante(recurso({ definitivo: undefined })), false)
})
