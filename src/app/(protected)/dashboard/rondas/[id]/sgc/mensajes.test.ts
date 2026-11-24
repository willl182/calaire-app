import { describe, expect, it } from 'vitest'
import { limpiarMensajeError } from './mensajes'

describe('limpiarMensajeError', () => {
  it('extrae el mensaje de un error de Convex', () => {
    const raw = '[Request ID: c868a1ae26aa9982] Server Error\nUncaught Error: Documento no encontrado en el expediente: actualice el expediente primero.\n    at handler (../convex/sgc/expediente.ts:10:5)'
    expect(limpiarMensajeError(raw)).toBe('Documento no encontrado en el expediente: actualice el expediente primero.')
  })

  it('deja intactos los mensajes propios', () => {
    expect(limpiarMensajeError('No fue posible registrar la aprobación.')).toBe('No fue posible registrar la aprobación.')
  })

  it('quita el prefijo de Request ID sin Uncaught', () => {
    expect(limpiarMensajeError('[Request ID: abc] Server Error')).toBe('Ocurrió un error inesperado.')
  })
})
