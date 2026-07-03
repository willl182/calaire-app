import assert from 'node:assert/strict'
import test from 'node:test'
import { getRondaParticipanteLandingPath, type ParticipanteLandingRonda } from './landing.ts'

function ronda(overrides: Partial<ParticipanteLandingRonda> = {}): ParticipanteLandingRonda {
  return { codigo: 'EA-2026-R1', ficha_estado: 'no_iniciada', ...overrides }
}

test('ficha no iniciada aterriza en el registro de la ronda', () => {
  assert.equal(getRondaParticipanteLandingPath(ronda({ ficha_estado: 'no_iniciada' })), '/ronda/EA-2026-R1/registro')
})

test('ficha en borrador aterriza en el registro de la ronda', () => {
  assert.equal(getRondaParticipanteLandingPath(ronda({ ficha_estado: 'borrador' })), '/ronda/EA-2026-R1/registro')
})

test('ficha enviada aterriza en la ronda', () => {
  assert.equal(getRondaParticipanteLandingPath(ronda({ ficha_estado: 'enviado' })), '/ronda/EA-2026-R1')
})

test('ronda en cierre documental aterriza en el panel de cierre', () => {
  assert.equal(
    getRondaParticipanteLandingPath(ronda({ estado: 'documentacion_pendiente', ficha_estado: 'enviado' })),
    '/mi-dashboard#cierre-documental-EA-2026-R1'
  )
})

test('ronda cerrada aterriza en el panel de cierre', () => {
  assert.equal(
    getRondaParticipanteLandingPath(ronda({ estado: 'cerrada', ficha_estado: 'no_iniciada' })),
    '/mi-dashboard#cierre-documental-EA-2026-R1'
  )
})

test('el destino nunca es un dashboard global', () => {
  for (const estado of ['no_iniciada', 'borrador', 'enviado'] as const) {
    const path = getRondaParticipanteLandingPath(ronda({ ficha_estado: estado }))
    assert.ok(path.startsWith('/ronda/'), `esperaba ruta de ronda, obtuvo ${path}`)
  }
})
