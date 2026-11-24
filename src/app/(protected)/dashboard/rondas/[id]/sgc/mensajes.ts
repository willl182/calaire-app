/**
 * Quita el envoltorio de errores de Convex ("[Request ID: …] Server Error / Uncaught Error: …"
 * y la traza) para mostrar solo el mensaje pensado para el usuario.
 */
export function limpiarMensajeError(message: string) {
  const uncaught = message.match(/Uncaught (?:\w*Error): ([^\n]+)/)
  const base = uncaught ? uncaught[1] : message.replace(/^\[Request ID: [^\]]+\]\s*(Server Error)?\s*/, '')
  return base.split('\n')[0].trim() || 'Ocurrió un error inesperado.'
}
