import { notFound, redirect } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { isAdmin, requireAuth } from '@/server/auth'
import { getRonda } from '@/server/rondas'
import {
  SGC_RONDA_ETAPAS,
  type SgcRondaDocumento,
} from '@/server/sgc/catalog'
import { getDriveTreeSgc, getPanelSgc, inicializarPanelSgc, type SgcPanel } from '@/server/sgc'
import { getDriveGoogleAutomationStatus } from '@/server/sgc/drive-google'
import { RondaContextNav } from '../RondaContextNav'
import { DriveDocumentalSgc } from './DriveDocumentalSgc'
import { transicionSgcAction } from './actions'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const DOCUMENTO_ESTADOS_CUBIERTOS = new Set(['completo', 'no_aplica', 'disponible'])

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getDocumentoEstado(doc: SgcRondaDocumento, checklistByCodigo: Map<string, { estado: string }>) {
  if (!doc.formatoOperativo) return doc.estado
  return checklistByCodigo.get(doc.formatoOperativo)?.estado ?? doc.estado
}

function CierreDocumentalBar({ panel, rondaId }: { panel: SgcPanel; rondaId: string }) {
  const drive = panel.driveCierre
  const puedePasarADocumentacion = panel.ronda.estado === 'activa'
  const puedeCerrar = panel.ronda.estado === 'documentacion_pendiente'
  const puedeReabrir = panel.ronda.estado === 'cerrada'
  const bloqueantesDocumentacion = [...panel.checklistBloqueantesDocumentacionPendiente, ...drive.bloqueantes]
  const bloqueantesCierre = [...panel.checklistBloqueantesCierre, ...drive.bloqueantes]
  const bloqueantesActuales = puedePasarADocumentacion ? bloqueantesDocumentacion : bloqueantesCierre
  const sinBloqueantesActuales = bloqueantesActuales.length === 0

  return (
    <section className="card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between" aria-labelledby="cierre-documental-title">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="cierre-documental-title" className="text-sm font-semibold text-[var(--foreground)]">Cierre documental SGC</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sinBloqueantesActuales ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {sinBloqueantesActuales ? 'Sin bloqueantes' : `${bloqueantesActuales.length} bloqueante(s)`}
        </span>
        {!sinBloqueantesActuales && (
          <details className="text-xs text-rose-900">
            <summary className="cursor-pointer font-semibold">Ver faltantes</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {bloqueantesActuales.map((bloqueante) => <li key={bloqueante}>{bloqueante}</li>)}
            </ul>
          </details>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {puedePasarADocumentacion && (
          <form action={transicionSgcAction}>
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="accion" value="documentacion_pendiente" />
            <button className="btn-primary" type="submit" disabled={!sinBloqueantesActuales}>
              Pasar a documentacion pendiente
            </button>
          </form>
        )}
        {puedeCerrar && (
          <form action={transicionSgcAction}>
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="accion" value="cerrar" />
            <button className="btn-primary" type="submit" disabled={!sinBloqueantesActuales}>
              Cerrar documentalmente
            </button>
          </form>
        )}
        {puedeReabrir && (
          <form action={transicionSgcAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="ronda_id" value={rondaId} />
            <input type="hidden" name="accion" value="reabrir" />
            <input className="input" name="motivo" placeholder="Motivo de reapertura" required />
            <button className="btn-outline" type="submit">Reabrir</button>
          </form>
        )}
      </div>
    </section>
  )
}

export default async function SgcRondaPage({ params, searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const { id } = await params
  const query = searchParams ? await searchParams : {}
  const ronda = await getRonda(id)
  if (!ronda) notFound()

  await inicializarPanelSgc(id)
  const [panel, drive] = await Promise.all([
    getPanelSgc(id),
    getDriveTreeSgc(id),
  ])
  if (!panel) notFound()
  const driveGoogleStatus = getDriveGoogleAutomationStatus()

  const success = getParam(query.success)
  const error = getParam(query.error)
  const checklistByCodigo = new Map(panel.checklist.map((item) => [item.codigo, item]))
  const documentos = SGC_RONDA_ETAPAS.flatMap((seccion) => seccion.documentos.map((doc) => ({ seccion, doc })))
  const cubiertos = documentos.filter(({ doc }) => {
    const estado = getDocumentoEstado(doc, checklistByCodigo)
    return DOCUMENTO_ESTADOS_CUBIERTOS.has(estado)
  }).length
  const progreso = documentos.length === 0 ? 0 : Math.round((cubiertos / documentos.length) * 100)

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <RondaContextNav rondaId={id} rondaCodigo={ronda.codigo} />

        <header className="header-bar px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">SGC de la ronda</h1>
                <EstadoBadge estado={ronda.estado} />
              </div>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Expediente documental para {ronda.codigo}. Solo se muestran el mapa documental, el checklist real y los registros que se diligencian desde esta vista.
              </p>
            </div>
            <div className="min-w-48 rounded-lg border border-[var(--border)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Checklist documental</div>
              <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{progreso}%</div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progreso}%` }} />
              </div>
            </div>
          </div>
        </header>

        {success && <Alert tone="success" message={success} />}
        {error && <Alert tone="error" message={error} />}

        <DriveDocumentalSgc
          drive={drive}
          panel={panel}
          rondaId={id}
          rondaCodigo={ronda.codigo}
          rondaNombre={ronda.nombre}
          driveGoogleReady={driveGoogleStatus.ready}
          driveGoogleConfig={driveGoogleStatus}
          selectedCarpeta={getParam(query.carpeta) ?? null}
          selectedDocId={getParam(query.doc) ?? null}
        />

        <CierreDocumentalBar panel={panel} rondaId={id} />
      </div>
    </div>
  )
}
