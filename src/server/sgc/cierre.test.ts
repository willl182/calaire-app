import assert from 'node:assert/strict'
import test from 'node:test'
import {
  evaluateDriveCierreCalidad,
  normalizeCodigoDocumento,
  type DriveCierreEtapaInput,
  type DriveCierreRecursoInput,
} from './cierre.ts'

const ETAPAS: DriveCierreEtapaInput[] = [
  {
    documentos: [
      { codigo: 'F-PSEA-01', nombre: 'Calendario' },
      { codigo: 'F-PSEA-12', nombre: 'Datos oficiales' },
    ],
  },
  {
    documentos: [{ codigo: 'F-PSEA-13', nombre: 'Informe final' }],
  },
]

const TOTAL = 3

function recurso(overrides: Partial<DriveCierreRecursoInput> & { codigo: string }): DriveCierreRecursoInput {
  return {
    estado: 'creado',
    webUrl: 'https://docs/editable',
    notas: null,
    definitivo: null,
    critico: false,
    ...overrides,
  }
}

function recursosCompletos(): DriveCierreRecursoInput[] {
  return [
    recurso({ codigo: 'F-PSEA-01', definitivo: { webUrl: 'https://docs/def' } }),
    recurso({ codigo: 'F-PSEA-12', estado: 'diligenciado', critico: true, definitivo: { webUrl: 'https://docs/def' } }),
    recurso({ codigo: 'F-PSEA-13', estado: 'diligenciado', critico: true, definitivo: { webUrl: 'https://docs/def' } }),
  ]
}

test('normalizeCodigoDocumento recorta y pasa a mayusculas', () => {
  assert.equal(normalizeCodigoDocumento('  f-psea-01 '), 'F-PSEA-01')
})

test('expediente sin recursos emite un unico bloqueante accionable (F1)', () => {
  const result = evaluateDriveCierreCalidad([], ETAPAS)
  assert.equal(result.recursosDocumentales, 0)
  assert.equal(result.totalDocumentos, TOTAL)
  assert.deepEqual(result.bloqueantes, [
    'Expediente Drive no inicializado: inicialice o repare el expediente documental antes de cerrar.',
  ])
  assert.deepEqual(result.advertencias, [])
})

test('expediente completo con editables y definitivos no tiene bloqueantes ni advertencias', () => {
  const result = evaluateDriveCierreCalidad(recursosCompletos(), ETAPAS)
  assert.deepEqual(result.bloqueantes, [])
  assert.deepEqual(result.advertencias, [])
  assert.equal(result.recursosDocumentales, TOTAL)
})

test('documento del catalogo sin recurso Drive es un bloqueante concreto', () => {
  const recursos = recursosCompletos().filter((r) => r.codigo !== 'F-PSEA-13')
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, ['F-PSEA-13 Informe final: recurso Drive faltante'])
})

test('recurso sin enlace editable bloquea', () => {
  const recursos = recursosCompletos().map((r) => (r.codigo === 'F-PSEA-01' ? { ...r, webUrl: '   ' } : r))
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, ['F-PSEA-01 Calendario: falta enlace editable'])
})

test('formato critico con editable pero no diligenciado bloquea', () => {
  const recursos = recursosCompletos().map((r) =>
    r.codigo === 'F-PSEA-12' ? { ...r, estado: 'creado', definitivo: null } : r
  )
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, ['F-PSEA-12 Datos oficiales: formato critico no diligenciado'])
})

test('recurso retirado no cuenta como cobertura vigente', () => {
  const recursos = recursosCompletos().map((r) => (r.codigo === 'F-PSEA-01' ? { ...r, estado: 'retirado' } : r))
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, ['F-PSEA-01 Calendario: recurso retirado'])
})

test('no_aplica exige justificacion en notas', () => {
  const sinNota = recursosCompletos().map((r) => (r.codigo === 'F-PSEA-01' ? { ...r, estado: 'no_aplica', notas: null } : r))
  assert.deepEqual(evaluateDriveCierreCalidad(sinNota, ETAPAS).bloqueantes, [
    'F-PSEA-01 Calendario: no aplica sin justificacion',
  ])

  const conNota = recursosCompletos().map((r) =>
    r.codigo === 'F-PSEA-01' ? { ...r, estado: 'no_aplica', notas: 'no aplica a esta ronda' } : r
  )
  assert.deepEqual(evaluateDriveCierreCalidad(conNota, ETAPAS).bloqueantes, [])
})

test('reemplazado exige enlace vigente y motivo', () => {
  const incompleto = recursosCompletos().map((r) =>
    r.codigo === 'F-PSEA-01' ? { ...r, estado: 'reemplazado', notas: null } : r
  )
  assert.deepEqual(evaluateDriveCierreCalidad(incompleto, ETAPAS).bloqueantes, [
    'F-PSEA-01 Calendario: reemplazado sin enlace vigente o motivo',
  ])

  const completo = recursosCompletos().map((r) =>
    r.codigo === 'F-PSEA-01' ? { ...r, estado: 'reemplazado', notas: 'reemplazado por F-PSEA-99' } : r
  )
  assert.deepEqual(evaluateDriveCierreCalidad(completo, ETAPAS).bloqueantes, [])
})

test('editable diligenciado sin definitivo es advertencia, no bloqueante', () => {
  const recursos = recursosCompletos().map((r) =>
    r.codigo === 'F-PSEA-13' ? { ...r, definitivo: null } : r
  )
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, [])
  assert.deepEqual(result.advertencias, ['F-PSEA-13 Informe final: definitivo recomendado ausente'])
})

test('el match de codigos es insensible a mayusculas y espacios', () => {
  const recursos = recursosCompletos().map((r) => ({ ...r, codigo: `  ${r.codigo.toLowerCase()} ` }))
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, [])
})

test('editable en estado creado sin definitivo es advertencia, no bloqueante', () => {
  const recursos = recursosCompletos().map((r) =>
    r.codigo === 'F-PSEA-01' ? { ...r, estado: 'creado', definitivo: null } : r
  )
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, [])
  assert.deepEqual(result.advertencias, ['F-PSEA-01 Calendario: definitivo recomendado ausente'])
})

test('las advertencias no bloquean el cierre (solo los bloqueantes)', () => {
  const recursos = recursosCompletos().map((r) => ({ ...r, definitivo: null }))
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, [])
  assert.equal(result.advertencias.length, TOTAL)
})

test('acumula multiples bloqueantes en orden de catalogo', () => {
  const recursos = [
    recurso({ codigo: 'F-PSEA-01', webUrl: '  ' }),
    recurso({ codigo: 'F-PSEA-12', estado: 'retirado' }),
    // F-PSEA-13 ausente del expediente
  ]
  const result = evaluateDriveCierreCalidad(recursos, ETAPAS)
  assert.deepEqual(result.bloqueantes, [
    'F-PSEA-01 Calendario: falta enlace editable',
    'F-PSEA-12 Datos oficiales: recurso retirado',
    'F-PSEA-13 Informe final: recurso Drive faltante',
  ])
})
