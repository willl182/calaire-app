import type { SincronizacionExpediente } from '@/server/sgc'
import { actualizarExpedienteAction, inicializarDriveRondaAction } from './actions'
import { SubmitButton } from '@/components/ui/SubmitButton'

/** Aviso cuando el expediente guardado no coincide con el catálogo vigente (DIAG 2.3). */
export function AvisoSincronizacion({ sync, rondaId }: { sync: SincronizacionExpediente; rondaId: string }) {
  if (!sync.inicializado) {
    return (
      <section
        role="status"
        aria-labelledby="aviso-sync-title"
        className="flex flex-col gap-3 rounded-lg border border-warning-border bg-warning-soft p-4 text-sm text-warning-strong md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 id="aviso-sync-title" className="font-semibold">El expediente de esta ronda aún no está inicializado</h2>
          <p className="mt-1">
            Inicializarlo crea en la app las carpetas y documentos del catálogo para esta ronda. No crea nada en Google
            Drive; eso se hace después con «Crear en Google Drive».
          </p>
        </div>
        <form action={inicializarDriveRondaAction}>
          <input type="hidden" name="ronda_id" value={rondaId} />
          <SubmitButton className="btn-primary whitespace-nowrap">
            Inicializar expediente
          </SubmitButton>
        </form>
      </section>
    )
  }
  if (sync.sincronizado) return null
  const nuevos = sync.documentosFaltantes.length
  const carpetas = sync.carpetasFaltantes.length
  const movidos = sync.documentosEnOtraCarpeta.length
  const total = nuevos + carpetas + movidos
  const etiqueta = nuevos > 0
    ? `${nuevos} documento${nuevos === 1 ? '' : 's'} nuevo${nuevos === 1 ? '' : 's'}`
    : `${total} cambio${total === 1 ? '' : 's'}`

  return (
    <section
      role="status"
      aria-labelledby="aviso-sync-title"
      className="flex flex-col gap-3 rounded-lg border border-warning-border bg-warning-soft p-4 text-sm text-warning-strong md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h2 id="aviso-sync-title" className="font-semibold">El expediente no está al día con el catálogo</h2>
        <p className="mt-1">
          El catálogo documental cambió desde que se creó este expediente.
          {nuevos > 0 && ` Faltan ${nuevos} documento${nuevos === 1 ? '' : 's'}`}
          {nuevos > 0 && sync.documentosFaltantes.length <= 6 && ` (${sync.documentosFaltantes.map((d) => d.codigo).join(', ')})`}
          {nuevos > 0 && '.'}
          {carpetas > 0 && ` Faltan ${carpetas} carpeta${carpetas === 1 ? '' : 's'}.`}
          {movidos > 0 && ` ${movidos} documento${movidos === 1 ? '' : 's'} en otra carpeta.`}
          {' '}Actualizarlo no borra ni modifica lo ya diligenciado.
        </p>
      </div>
      <form action={actualizarExpedienteAction}>
        <input type="hidden" name="ronda_id" value={rondaId} />
        <SubmitButton className="btn-primary whitespace-nowrap">
          Actualizar expediente ({etiqueta})
        </SubmitButton>
      </form>
    </section>
  )
}
