import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPTCsv, buildResultadosCsv } from './csv.ts'
import { derivarEstadoOperativo } from './estados.ts'
import { filtrarParticipantes } from './filtros.ts'
import { getRequiredPTReplicateCount, isInitialConcentrationLevel } from './pt.ts'
import type {
  EnvioPTConMetadatos,
  ParticipanteRondaResumen,
  ResultadoParticipante,
  RondaMetricasBase,
  RondaPTItem,
} from './types.ts'

function makeParticipante(
  overrides: Partial<ParticipanteRondaResumen> = {}
): ParticipanteRondaResumen {
  return {
    ronda_participante_id: 'rp-1',
    ronda_id: 'ronda-1',
    email: 'lab@example.com',
    workos_user_id: 'user-1',
    participant_profile: 'member',
    participant_code: null,
    replicate_code: null,
    estado: 'reclamado',
    slot_token: null,
    claimed_at: '2026-06-01T00:00:00.000Z',
    invitado_at: '2026-05-01T00:00:00.000Z',
    ficha_estado: 'no_iniciada',
    envios_pt_count: 0,
    tiene_envio_final: false,
    ...overrides,
  }
}

function makePTItem(
  id: string,
  contaminante: RondaPTItem['contaminante'],
  levelLabel: string,
  sortOrder: number
): RondaPTItem {
  return {
    id,
    ronda_id: 'ronda-1',
    contaminante,
    run_code: id,
    level_label: levelLabel,
    sort_order: sortOrder,
    created_at: '2026-06-01T00:00:00.000Z',
  }
}

const metricasBase: RondaMetricasBase = {
  cupos_totales: 2,
  cupos_reclamados: 2,
  fichas_enviadas: 2,
  fichas_pendientes: 0,
  envios_finales: 2,
  envios_esperados: 2,
  pt_configurado: true,
}

test('filtrarParticipantes aplica los filtros operativos actuales', () => {
  const pendiente = makeParticipante({
    ronda_participante_id: 'pendiente',
    estado: 'pendiente',
    workos_user_id: null,
    ficha_estado: 'no_iniciada',
  })
  const fichaPendiente = makeParticipante({
    ronda_participante_id: 'ficha-pendiente',
    ficha_estado: 'borrador',
  })
  const enviadaSinEnvios = makeParticipante({
    ronda_participante_id: 'enviada-sin-envios',
    ficha_estado: 'enviado',
  })
  const enviadaConEnvios = makeParticipante({
    ronda_participante_id: 'enviada-con-envios',
    ficha_estado: 'enviado',
    envios_pt_count: 3,
    tiene_envio_final: true,
  })
  const participantes = [pendiente, fichaPendiente, enviadaSinEnvios, enviadaConEnvios]

  assert.deepEqual(filtrarParticipantes(participantes, 'todos'), participantes)
  assert.deepEqual(filtrarParticipantes(participantes, 'enlace_pendiente'), [pendiente])
  assert.deepEqual(filtrarParticipantes(participantes, 'ficha_pendiente'), [fichaPendiente])
  assert.deepEqual(filtrarParticipantes(participantes, 'ficha_enviada'), [
    enviadaSinEnvios,
    enviadaConEnvios,
  ])
  assert.deepEqual(filtrarParticipantes(participantes, 'con_envios'), [enviadaConEnvios])
  assert.deepEqual(filtrarParticipantes(participantes, 'sin_envios'), [
    fichaPendiente,
    enviadaSinEnvios,
  ])
})

test('derivarEstadoOperativo respeta la prioridad de estados actual', () => {
  assert.deepEqual(
    derivarEstadoOperativo({ estado: 'cerrada' }, { ...metricasBase, pt_configurado: false }),
    { estado_operativo: 'cerrada', accion_recomendada: 'La ronda está cerrada.' }
  )
  assert.equal(
    derivarEstadoOperativo({ estado: 'activa' }, { ...metricasBase, pt_configurado: false })
      .estado_operativo,
    'preparar_ronda'
  )
  assert.equal(
    derivarEstadoOperativo({ estado: 'activa' }, { ...metricasBase, cupos_totales: 0 })
      .estado_operativo,
    'preparar_ronda'
  )
  assert.equal(
    derivarEstadoOperativo({ estado: 'activa' }, { ...metricasBase, cupos_reclamados: 0 })
      .estado_operativo,
    'invitar_participantes'
  )
  assert.equal(
    derivarEstadoOperativo({ estado: 'activa' }, { ...metricasBase, fichas_pendientes: 1 })
      .estado_operativo,
    'esperando_fichas'
  )
  assert.equal(
    derivarEstadoOperativo({ estado: 'activa' }, { ...metricasBase, envios_finales: 0 })
      .estado_operativo,
    'recibiendo_resultados'
  )
  assert.equal(
    derivarEstadoOperativo({ estado: 'activa' }, { ...metricasBase, envios_finales: 1 })
      .estado_operativo,
    'revisar_incompletos'
  )
  assert.equal(
    derivarEstadoOperativo({ estado: 'activa' }, metricasBase).estado_operativo,
    'lista_para_exportar'
  )
})

test('buildResultadosCsv conserva cabeceras dinamicas, padding y escape CSV', () => {
  const resultados: ResultadoParticipante[] = [
    {
      workos_user_id: 'user-1',
      email: 'lab, uno@example.com',
      completados: 1,
      total_esperado: 1,
      porcentaje_completitud: 100,
      enviados_at: '2026-06-01T00:00:00.000Z',
      envios: [
        {
          id: 'envio-1',
          ronda_id: 'ronda-1',
          workos_user_id: 'user-1',
          contaminante: 'CO',
          nivel: 1,
          valores: [1.1, 1.2],
          promedio: 1.15,
          incertidumbre: null,
          submitted_at: '2026-06-01T00:00:00.000Z',
          updated_at: '2026-06-01T00:00:00.000Z',
        },
      ],
    },
    {
      workos_user_id: 'user-2',
      email: 'lab "dos"@example.com',
      completados: 1,
      total_esperado: 1,
      porcentaje_completitud: 100,
      enviados_at: '2026-06-01T00:00:00.000Z',
      envios: [
        {
          id: 'envio-2',
          ronda_id: 'ronda-1',
          workos_user_id: 'user-2',
          contaminante: 'SO2',
          nivel: 2,
          valores: [2.1],
          promedio: null,
          incertidumbre: 0.3,
          submitted_at: '2026-06-02T00:00:00.000Z',
          updated_at: '2026-06-02T00:00:00.000Z',
        },
      ],
    },
  ]

  assert.equal(
    buildResultadosCsv(resultados),
    [
      'participant_id,participant_email,pollutant,level,replicate_1,replicate_2,mean_value,uncertainty,submitted_at',
      'user-1,"lab, uno@example.com",co,1,1.1,1.2,1.15,,2026-06-01T00:00:00.000Z',
      'user-2,"lab ""dos""@example.com",so2,2,2.1,,,0.3,2026-06-02T00:00:00.000Z',
    ].join('\n')
  )
})

test('buildPTCsv serializa columnas PT y nulos como celdas vacias', () => {
  const envios: EnvioPTConMetadatos[] = [
    {
      pollutant: 'co',
      run: 'CO-0',
      level: '0 ppm',
      participant_id: 'P-01',
      replicate: 1,
      sample_group: 'A',
      d1: 0,
      d2: null,
      d3: null,
      mean_value: 0,
      sd_value: 0,
      ux: null,
      k: 2,
      ux_exp: null,
    },
  ]

  assert.equal(
    buildPTCsv(envios),
    [
      'pollutant,run,level,participant_id,replicate,sample_group,d1,d2,d3,mean_value,sd_value,ux,k,ux_exp',
      'co,CO-0,0 ppm,P-01,1,A,0,,,0,0,,2,',
    ].join('\n')
  )
})

test('isInitialConcentrationLevel detecta nivel inicial por orden, cero textual o numerico', () => {
  const coZero = makePTItem('co-zero', 'CO', '0 ppm', 10)
  const coCommaZero = makePTItem('co-comma-zero', 'CO', '0,0 ppm', 20)
  const coTextZero = makePTItem('co-text-zero', 'CO', 'cero', 30)
  const coHigh = makePTItem('co-high', 'CO', '6.3 ppm', 40)
  const so2Lowest = makePTItem('so2-lowest', 'SO2', '10 ppb', 1)
  const ptItems = [coZero, coCommaZero, coTextZero, coHigh, so2Lowest]

  assert.equal(isInitialConcentrationLevel(coZero, ptItems), true)
  assert.equal(isInitialConcentrationLevel(coCommaZero, ptItems), true)
  assert.equal(isInitialConcentrationLevel(coTextZero, ptItems), true)
  assert.equal(isInitialConcentrationLevel(coHigh, ptItems), false)
  assert.equal(isInitialConcentrationLevel(so2Lowest, ptItems), true)
})

test('getRequiredPTReplicateCount exige una replica para nivel inicial y tres para los demas', () => {
  const initial = makePTItem('initial', 'O3', '0 ppb', 1)
  const nonInitial = makePTItem('non-initial', 'O3', '80 ppb', 2)
  const items = [initial, nonInitial]

  assert.equal(getRequiredPTReplicateCount(initial, items), 1)
  assert.equal(getRequiredPTReplicateCount(nonInitial, items), 3)
})
