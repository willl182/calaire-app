import Link from 'next/link'
import type { PasoPrevio, SiguientePaso } from '@/server/sgc'
import { RESPONSABLE_LABELS } from './ExpedienteGuiado'
import { Icon } from '@/components/ui/Icon'
import { etiquetaVisible } from '@/lib/sgc/etiquetas'

type Props = {
  pasosPrevios: PasoPrevio[]
  siguiente: SiguientePaso
}

/** Barra "Siguiente paso": sigue el orden lógico por dependencias (decisión 9). */
export function SiguientePasoBar({ pasosPrevios, siguiente }: Props) {
  const previosHechos = pasosPrevios.filter((paso) => paso.completo).length

  let titulo = 'Expediente al día'
  let motivo = 'No quedan documentos obligatorios pendientes.'
  let destino: string | null = null
  let responsable: PasoPrevio['responsable'] | null = null
  if (siguiente.tipo === 'previo') {
    titulo = siguiente.paso.nombre
    motivo = siguiente.paso.motivo
    destino = siguiente.paso.destino
    responsable = siguiente.paso.responsable
  } else if (siguiente.tipo === 'documento') {
    titulo = `${siguiente.documento.codigo} · ${etiquetaVisible(siguiente.documento.nombre)}`
    motivo = siguiente.documento.motivo
    destino = siguiente.documento.destino
    responsable = siguiente.documento.responsable
  }

  return (
    <section
      aria-labelledby="siguiente-paso-title"
      className="flex flex-col gap-3 rounded-xl border border-[var(--pt-primary)] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
    >
      <div className="min-w-0">
        <p id="siguiente-paso-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--pt-primary)]">Siguiente paso</p>
        <p className="mt-1 text-base font-semibold text-[var(--foreground)]">{titulo}</p>
        <p className="text-sm text-[var(--foreground-muted)]">
          {motivo}
          {responsable && <> · Responsable: <strong>{RESPONSABLE_LABELS[responsable]}</strong></>}
        </p>
        {siguiente.tipo === 'previo' && (
          <details className="mt-2 text-xs text-[var(--foreground-muted)]">
            <summary className="cursor-pointer font-semibold">Pasos previos ({previosHechos}/{pasosPrevios.length})</summary>
            <ol className="mt-2 grid gap-1 pl-1">
              {pasosPrevios.map((paso) => (
                <li key={paso.key} className="flex items-center gap-2">
                  <span aria-hidden="true" className={paso.completo ? 'text-success-strong' : 'text-muted'}>{paso.completo ? <Icon name="check" className="h-3.5 w-3.5" /> : '○'}</span>
                  <span className="sr-only">{paso.completo ? 'Hecho:' : 'Pendiente:'}</span>
                  <Link className="underline-offset-2 hover:underline" href={paso.destino}>{etiquetaVisible(paso.nombre)}</Link>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
      {destino && (
        <Link className="btn-primary whitespace-nowrap" href={destino}>
          Ir al paso
        </Link>
      )}
    </section>
  )
}
