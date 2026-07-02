import assert from 'node:assert/strict'
import test from 'node:test'

import { isConvexOffline, safeConvexCall } from './convex-fallback.ts'

test('isConvexOffline detecta ECONNREFUSED en cause.code', () => {
  const err = new TypeError('fetch failed') as Error & { cause?: { code?: string } }
  err.cause = { code: 'ECONNREFUSED' }
  assert.equal(isConvexOffline(err), true)
})

test('isConvexOffline detecta fetch failed en message', () => {
  assert.equal(isConvexOffline(new TypeError('fetch failed')), true)
})

test('isConvexOffline detecta ECONNREFUSED en message', () => {
  assert.equal(isConvexOffline(new Error('connect ECONNREFUSED 127.0.0.1:3212')), true)
})

test('isConvexOffline ignora errores no relacionados', () => {
  assert.equal(isConvexOffline(new Error('Validation error')), false)
  assert.equal(isConvexOffline(null), false)
  assert.equal(isConvexOffline(undefined), false)
  assert.equal(isConvexOffline('string error'), false)
})

test('safeConvexCall devuelve el resultado cuando la operacion tiene exito', async () => {
  const result = await safeConvexCall('ok', async () => 42, 0)
  assert.equal(result, 42)
})

test('safeConvexCall devuelve fallback cuando Convex esta offline', async () => {
  const err = new TypeError('fetch failed') as Error & { cause?: { code?: string } }
  err.cause = { code: 'ECONNREFUSED' }
  const result = await safeConvexCall('offline', async () => { throw err }, ['fallback'])
  assert.deepEqual(result, ['fallback'])
})

test('safeConvexCall relanza errores no relacionados con offline', async () => {
  await assert.rejects(
    safeConvexCall('boom', async () => { throw new Error('Validation error') }, null),
    /Validation error/,
  )
})

test('safeConvexCall detecta ENOTFOUND en cause.code como offline', async () => {
  const err = new TypeError('fetch failed') as Error & { cause?: { code?: string } }
  err.cause = { code: 'ENOTFOUND' }
  const result = await safeConvexCall('offline-notfound', async () => { throw err }, ['fallback'])
  assert.deepEqual(result, ['fallback'])
})

test('safeConvexCall detecta EAI_AGAIN en cause.code como offline', async () => {
  const err = new TypeError('fetch failed') as Error & { cause?: { code?: string } }
  err.cause = { code: 'EAI_AGAIN' }
  const result = await safeConvexCall('offline-again', async () => { throw err }, null)
  assert.equal(result, null)
})

test('safeConvexCall detecta codigo en el error directo como offline', async () => {
  const err = new Error('connect ECONNREFUSED') as Error & { code?: string }
  err.code = 'ECONNREFUSED'
  const result = await safeConvexCall('offline-direct-code', async () => { throw err }, [])
  assert.deepEqual(result, [])
})

test('safeConvexCall ejecuta la funcion exactamente una vez en el camino feliz', async () => {
  let calls = 0
  const result = await safeConvexCall(
    'count',
    async () => {
      calls += 1
      return 'value'
    },
    'fallback',
  )
  assert.equal(result, 'value')
  assert.equal(calls, 1)
})

test('safeConvexCall ejecuta la funcion exactamente una vez en el camino offline', async () => {
  let calls = 0
  const err = new TypeError('fetch failed') as Error & { cause?: { code?: string } }
  err.cause = { code: 'ECONNREFUSED' }
  const result = await safeConvexCall(
    'count-offline',
    async () => {
      calls += 1
      throw err
    },
    'fallback',
  )
  assert.equal(result, 'fallback')
  assert.equal(calls, 1)
})
