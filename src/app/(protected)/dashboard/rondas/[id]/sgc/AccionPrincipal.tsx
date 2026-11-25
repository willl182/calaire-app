import Link from 'next/link'
import type { SgcAvanceItem, SgcDriveRecurso } from '@/server/sgc'
import {
  aprobarDocumentoExpedienteAction,
  cambiarVisibilidadDriveAction,
  crearDriveGoogleAction,
} from './actions'
import { SubmitButton } from '@/components/ui/SubmitButton'

type Props = {
  item: SgcAvanceItem
  recurso: SgcDriveRecurso | undefined
  rondaId: string
  rondaCodigo: string
  rondaNombre: string
  detalleHref: string | null
  driveGoogleReady: boolean
  carpetaRondaCreada: boolean
}

/** Documentos con exportación CSV autollenada desde la app (B2). */
export const EXPORTABLES_CSV = new Set(['F-PSEA-01', 'F-PSEA-02', 'F-PSEA-04'])
/** Documentos con aprobación explícita del coordinador (decisiones 5 y 17). */
const APROBABLES: Record<string, { aprobar: string; retirar: string }> = {
  'F-PSEA-05': { aprobar: 'Marcar revisado', retirar: 'Quitar revisado' },
  'EVID-CIERRE': { aprobar: 'Aprobar cierre', retirar: 'Retirar aprobación' },
}
/** Registros nativos que se diligencian en la app (panel de detalle). */
const REGISTROS_NATIVOS = new Set(['F-PSEA-06', 'F-PSEA-11', 'F-PSEA-13'])
const PAGINAS_PROPIAS: Record<string, string> = {
  'F-PSEA-19': 'Gestionar acta',
  'F-PSEA-21': 'Gestionar instrumentos',
  'F-PSEA-03': 'Ver participantes',
}
const NO_PUBLICABLES = new Set(['F-PSEA-20', 'F-PSEA-21'])

const cls = 'btn-primary px-3 py-1 text-xs'
const clsSec = 'btn-outline px-3 py-1 text-xs'

function DescargaCsv({ codigo, rondaId }: { codigo: string; rondaId: string }) {
  return (
    <a
      className={clsSec}
      href={`/dashboard/rondas/${rondaId}/sgc/exportar/${encodeURIComponent(codigo)}`}
      download
      aria-label={`Descargar ${codigo} en CSV generado desde la app`}
    >
      Descargar CSV
    </a>
  )
}

/**
 * Una sola acción principal por documento, según su estado:
 * Crear en Drive → Diligenciar → Cargar definitivo → Publicar.
 * Las demás operaciones quedan en "Más opciones" (panel de detalle).
 */
export function AccionPrincipal({ item, recurso, rondaId, rondaCodigo, rondaNombre, detalleHref, driveGoogleReady, carpetaRondaCreada }: Props) {
  const csv = EXPORTABLES_CSV.has(item.codigo) ? <DescargaCsv codigo={item.codigo} rondaId={rondaId} /> : null

  const aprobable = APROBABLES[item.codigo]
  if (aprobable) {
    const aprobado = item.estado === 'completo'
    // EVID-CIERRE solo se aprueba con el checklist sin bloqueantes.
    const bloqueado = !aprobado && item.codigo === 'EVID-CIERRE' && item.motivo.includes('bloqueante')
    return (
      <form action={aprobarDocumentoExpedienteAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <input type="hidden" name="codigo" value={item.codigo} />
        <input type="hidden" name="aprobado" value={aprobado ? 'false' : 'true'} />
        <SubmitButton className={aprobado ? clsSec : cls}  disabled={bloqueado} title={bloqueado ? item.motivo : undefined}>
          {aprobado ? aprobable.retirar : aprobable.aprobar}
        </SubmitButton>
        {bloqueado && <span className="text-xs text-danger-strong">Resuelva primero los bloqueantes.</span>}
      </form>
    )
  }

  const propia = PAGINAS_PROPIAS[item.codigo]
  if (propia) {
    return <Link className={item.estado === 'completo' ? clsSec : cls} href={item.destino}>{propia}</Link>
  }

  if (item.codigo === 'F-PSEA-06') {
    return (
      <Link className={item.estado === 'completo' ? clsSec : cls} href={`/dashboard/rondas/${rondaId}/sgc/f-psea-06`}>
        {item.estado === 'completo' ? 'Ver registro' : 'Diligenciar en la app'}
      </Link>
    )
  }

  if (REGISTROS_NATIVOS.has(item.codigo)) {
    if (!detalleHref) return null
    return <Link className={item.estado === 'completo' ? clsSec : cls} href={detalleHref}>{item.estado === 'completo' ? 'Ver registro' : 'Diligenciar en la app'}</Link>
  }

  if (item.responsable === 'automatico' && item.estado !== 'completo') {
    return csv ?? <span className="text-xs text-[var(--foreground-muted)]">Se completa automáticamente</span>
  }

  if (!recurso) return csv

  const publicable = !NO_PUBLICABLES.has(item.codigo)
  if (recurso.definitivo) {
    if (publicable && !recurso.publicaParticipante) {
      return (
        <div className="flex flex-wrap gap-2">
          {csv}
          <form action={cambiarVisibilidadDriveAction}>
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="recurso_id" value={recurso._id} />
            <input type="hidden" name="publica_participante" value="true" />
            <SubmitButton className={clsSec}  aria-label={`Publicar ${item.codigo} a participantes`}>Publicar</SubmitButton>
          </form>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap gap-2">
        {csv}
        <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success-strong">
          {recurso.publicaParticipante ? 'Publicado' : 'Definitivo cargado'}
        </span>
      </div>
    )
  }

  if (!recurso.webUrl) {
    if (driveGoogleReady) {
      return (
        <div className="flex flex-wrap gap-2">
          {csv}
          <form action={crearDriveGoogleAction}>
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="ronda_codigo" value={rondaCodigo} />
            <input type="hidden" name="ronda_nombre" value={rondaNombre} />
            <SubmitButton
              className={cls}
              
              title={carpetaRondaCreada ? 'Copia en Drive las plantillas que falten' : 'Crea la carpeta de la ronda y copia las plantillas'}>
              Crear en Drive
            </SubmitButton>
          </form>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap gap-2">
        {csv}
        {detalleHref && <Link className={cls} href={detalleHref}>Registrar enlace</Link>}
      </div>
    )
  }

  if (recurso.estado !== 'diligenciado') {
    return (
      <div className="flex flex-wrap gap-2">
        {csv}
        <a className={cls} href={recurso.webUrl} target="_blank" rel="noreferrer" aria-label={`Diligenciar ${item.codigo} en Google Drive (abre en otra pestaña)`}>
          Diligenciar
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {csv}
      {detalleHref && <Link className={cls} href={detalleHref}>Cargar definitivo</Link>}
    </div>
  )
}
