import { etiquetaEstadoRonda, tonoEstadoRonda } from '@/lib/rondas/estado-visible'
import { TONO_INSIGNIA } from '@/lib/ui/tonos'

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] ${TONO_INSIGNIA[tonoEstadoRonda(estado)]}`}
    >
      {etiquetaEstadoRonda(estado)}
    </span>
  )
}
