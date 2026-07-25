import assert from 'node:assert/strict'
import test from 'node:test'
import { SGC_FORMATOS_FASE_1 as serverFormatos, SGC_RONDA_ETAPAS as serverEtapas } from './catalog.ts'
import {
  SGC_FORMATOS_FASE_1 as convexFormatos,
  SGC_RONDA_ETAPAS as convexEtapas,
} from '../../../convex/_lib/sgc/catalog.ts'

test('catalogos SGC de servidor y Convex permanecen equivalentes', () => {
  assert.deepEqual(serverFormatos, convexFormatos)
  assert.deepEqual(serverEtapas, convexEtapas)
})

test('F19 F20 F21 son criticos y no bloquean cierre', () => {
  for (const codigo of ['F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21'] as const) {
    const formato = serverFormatos.find((item) => item.codigo === codigo)
    assert.ok(formato, `${codigo} debe existir en el catalogo`)
    assert.equal(formato.critico, true)
    assert.equal(formato.bloqueaCierre, false)
  }
})

test('etapa Inicio agrega F19 sin renombrar carpetas existentes', () => {
  const inicio = serverEtapas.find((etapa) => etapa.key === 'inicio_ronda')
  assert.equal(inicio?.carpeta, '02A_inicio_ronda')
  assert.deepEqual(inicio?.documentos.map((documento) => documento.codigo), ['F-PSEA-19'])
  assert.equal(serverEtapas.find((etapa) => etapa.key === 'preparacion_item')?.carpeta, '03_preparacion_item')
})
