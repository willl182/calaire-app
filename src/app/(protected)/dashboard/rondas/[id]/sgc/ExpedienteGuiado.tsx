import Link from 'next/link'
import type { SgcAvanceExpediente, SgcAvanceItem, SgcDriveRecurso } from '@/server/sgc'
import { SGC_RONDA_ETAPAS } from '@/server/sgc/catalog'
import { AccionPrincipal } from './AccionPrincipal'
import { marcarAplicaDocumentoAction } from './actions'
import { SubmitButton } from '@/components/ui/SubmitButton'

export const RESPONSABLE_LABELS: Record<SgcAvanceItem['responsable'], string> = {
  coordinador: 'Tú',
  participante: 'Participante',
  automatico: 'Automático',
}

const RESPONSABLE_TONE: Record<SgcAvanceItem['responsable'], string> = {
  coordinador: 'bg-info-soft text-info-strong',
  participante: 'bg-special-soft text-special-strong',
  automatico: 'bg-line-soft text-foreground',
}

const ESTADO_LABELS: Record<SgcAvanceItem['estado'], string> = {
  completo: 'Completo',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  no_aplica: 'No aplica',
}

const ESTADO_TONE: Record<SgcAvanceItem['estado'], string> = {
  completo: 'bg-success-soft text-success-strong',
  en_proceso: 'bg-warning-soft text-warning-strong',
  pendiente: 'bg-surface-muted text-foreground',
  no_aplica: 'bg-surface-muted text-muted',
}

const SUBESTADO_LABELS: Record<string, string> = {
  diligenciada_por_subir: 'Diligenciada / por subir',
  subida: 'Subida',
  borrador: 'Borrador',
  pendiente_validacion: 'Pendiente de validación',
  requiere_ajustes: 'Requiere ajustes',
}

type Props = {
  avance: SgcAvanceExpediente
  recursos: SgcDriveRecurso[]
  rondaId: string
  rondaCodigo: string
  rondaNombre: string
  driveGoogleReady: boolean
  carpetaRondaCreada: boolean
}

function ResponsableBadge({ responsable }: { responsable: SgcAvanceItem['responsable'] }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${RESPONSABLE_TONE[responsable]}`}>
      <span className="sr-only">Responsable: </span>{RESPONSABLE_LABELS[responsable]}
    </span>
  )
}

function AplicaToggle({ item, rondaId }: { item: SgcAvanceItem; rondaId: string }) {
  return (
    <form action={marcarAplicaDocumentoAction}>
      <input type="hidden" name="ronda_id" value={rondaId} />
      <input type="hidden" name="codigo" value={item.codigo} />
      <input type="hidden" name="aplica" value={item.aplica ? 'false' : 'true'} />
      <SubmitButton
        
        role="switch"
        aria-checked={item.aplica}
        aria-label={`${item.codigo} ${item.aplica ? 'aplica' : 'no aplica'}: cambiar`}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pt-primary)]">
        <span aria-hidden="true" className={`relative inline-block h-4 w-7 rounded-full transition ${item.aplica ? 'bg-[var(--pt-primary)]' : 'bg-line'}`}>
          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${item.aplica ? 'left-3.5' : 'left-0.5'}`} />
        </span>
        {item.aplica ? 'Aplica' : 'No aplica'}
      </SubmitButton>
    </form>
  )
}

function DocumentoFila({
  item,
  numero,
  recurso,
  carpetaCodigo,
  rondaId,
  rondaCodigo,
  rondaNombre,
  driveGoogleReady,
  carpetaRondaCreada,
}: {
  item: SgcAvanceItem
  numero: number | null
  recurso: SgcDriveRecurso | undefined
  carpetaCodigo: string | null
  rondaId: string
  rondaCodigo: string
  rondaNombre: string
  driveGoogleReady: boolean
  carpetaRondaCreada: boolean
}) {
  const siAplica = item.obligatoriedad === 'si_aplica'
  const apagado = siAplica && !item.aplica
  const detalleHref = recurso && carpetaCodigo
    ? `/dashboard/rondas/${rondaId}/sgc?carpeta=${encodeURIComponent(carpetaCodigo)}&doc=${recurso._id}#explorador`
    : null
  return (
    <li
      id={`doc-${item.codigo}`}
      className={`scroll-mt-24 flex flex-col gap-2 rounded-lg border px-3 py-2.5 md:flex-row md:items-center md:justify-between ${apagado ? 'border-dashed border-line-soft bg-surface text-muted' : 'border-[var(--border)] bg-white'}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="numeric mt-0.5 w-6 shrink-0 text-right text-xs font-semibold text-[var(--foreground-muted)]" aria-hidden={numero === null}>
          {numero !== null ? `${numero}.` : ''}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold ${apagado ? 'text-muted' : 'text-[var(--foreground-muted)]'}`}>{item.codigo}</span>
            <span className={`text-sm font-medium ${apagado ? 'text-muted' : 'text-[var(--foreground)]'}`}>{item.nombre}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <ResponsableBadge responsable={item.responsable} />
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTADO_TONE[item.estado]}`}>
              {item.subestado && SUBESTADO_LABELS[item.subestado] ? SUBESTADO_LABELS[item.subestado] : ESTADO_LABELS[item.estado]}
            </span>
            {item.nivel === 'bloqueante' && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger-strong">Bloquea el cierre</span>}
            {item.estado !== 'completo' && item.estado !== 'no_aplica' && (
              <span className="text-xs text-[var(--foreground-muted)]">{item.motivo}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {siAplica && <AplicaToggle item={item} rondaId={rondaId} />}
        {!apagado && (
          <AccionPrincipal
            item={item}
            recurso={recurso}
            rondaId={rondaId}
            rondaCodigo={rondaCodigo}
            rondaNombre={rondaNombre}
            detalleHref={detalleHref}
            driveGoogleReady={driveGoogleReady}
            carpetaRondaCreada={carpetaRondaCreada}
          />
        )}
        {detalleHref && (
          <Link className="text-xs font-semibold text-[var(--pt-primary)] underline-offset-2 hover:underline" href={detalleHref} aria-label={`Ver detalle y opciones de ${item.codigo}`}>
            Más opciones
          </Link>
        )}
      </div>
    </li>
  )
}

/** Vista principal del expediente: etapas en orden de proceso, documentos numerados por flujo. */
export function ExpedienteGuiado({ avance, recursos, rondaId, rondaCodigo, rondaNombre, driveGoogleReady, carpetaRondaCreada }: Props) {
  const recursoPorId = new Map(recursos.map((r) => [r._id, r]))
  const recursoPorCodigo = new Map(recursos.filter((r) => r.tipo !== 'carpeta').map((r) => [r.codigo.toUpperCase(), r]))
  const etapas = SGC_RONDA_ETAPAS.map((etapa) => {
    const items = avance.items
      .filter((item) => item.etapaKey === etapa.key)
      .sort((a, b) => a.orden - b.orden)
    return {
      etapa,
      obligatorios: items.filter((item) => item.obligatoriedad === 'obligatorio'),
      siAplica: items.filter((item) => item.obligatoriedad === 'si_aplica'),
      completos: items.filter((item) => item.cuentaEnAvance && item.estado === 'completo').length,
      total: items.filter((item) => item.cuentaEnAvance).length,
    }
  }).filter((grupo) => grupo.obligatorios.length + grupo.siAplica.length > 0)

  const fila = (item: SgcAvanceItem, numero: number | null) => {
    const recurso = recursoPorCodigo.get(item.codigo)
    const carpeta = recurso?.parentId ? recursoPorId.get(recurso.parentId) : undefined
    return (
    <DocumentoFila
      key={item.codigo}
      item={item}
      numero={numero}
      recurso={recurso}
      carpetaCodigo={carpeta?.codigo ?? null}
      rondaId={rondaId}
      rondaCodigo={rondaCodigo}
      rondaNombre={rondaNombre}
      driveGoogleReady={driveGoogleReady}
      carpetaRondaCreada={carpetaRondaCreada}
    />
    )
  }

  return (
    <section id="expediente" className="card scroll-mt-24 overflow-hidden" aria-labelledby="expediente-guiado-title">
      <div className="sgc-panel-head">
        <div>
          <h2 id="expediente-guiado-title">Expediente por etapas</h2>
          <p className="text-sm text-[var(--foreground-muted)]">Documentos en el orden en que se diligencian. Cada uno muestra quién lo hace y la acción que sigue.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-outline" href={`/dashboard/rondas/${rondaId}/sgc/f-psea-21`}>Gestionar F-PSEA-21</Link>
          <Link className="btn-outline" href={`/dashboard/rondas/${rondaId}/sgc/f-psea-19`}>Gestionar F-PSEA-19</Link>
        </div>
      </div>
      <ol className="grid gap-4 p-5">
        {etapas.map(({ etapa, obligatorios, siAplica, completos, total }) => {
          const pct = total === 0 ? 100 : Math.round((completos / total) * 100)
          return (
            <li key={etapa.key} id={`etapa-${etapa.key}`} className="scroll-mt-24 rounded-xl border border-[var(--border)] bg-[var(--surface-panel,white)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  <span className="numeric text-[var(--foreground-muted)]">{etapa.numero}</span> · {etapa.nombre}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                  <span className="numeric font-semibold text-[var(--foreground)]">{completos}/{total}</span>
                  <div
                    className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    aria-label={`Avance de la etapa ${etapa.nombre}: ${completos} de ${total}`}
                  >
                    <div className="h-full bg-[var(--pt-primary)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              {obligatorios.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {obligatorios.map((item, index) => fila(item, index + 1))}
                </ul>
              )}
              {siAplica.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Si aplica</h4>
                  <p className="mb-2 text-xs text-muted">Solo cuentan en el avance si se marcan como aplicables. Se pueden dejar en &quot;no aplica&quot; sin justificación.</p>
                  <ul className="grid gap-2">
                    {siAplica.map((item) => fila(item, null))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
