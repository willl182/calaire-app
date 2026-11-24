import { notFound, redirect } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { isAdmin, requireAuth } from '@/server/auth'
import { getRonda } from '@/server/rondas'
import {
  getAvanceExpedienteSgc,
  getDriveTreeSgc,
  getPanelSgc,
  getSincronizacionExpedienteSgc,
  inicializarPanelSgc,
  type SgcPanel,
} from '@/server/sgc'
import { getDriveGoogleAutomationStatus } from '@/server/sgc/drive-google'
import { RondaContextNav } from '../RondaContextNav'
import { RondaPageHeader } from '../RondaPageHeader'
import { AvisoSincronizacion } from './AvisoSincronizacion'
import { DriveDocumentalSgc } from './DriveDocumentalSgc'
import { ExpedienteGuiado } from './ExpedienteGuiado'
import { transicionSgcAction } from './actions'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function CierreDocumentalBar({ panel, rondaId }: { panel: SgcPanel; rondaId: string }) {
  const drive = panel.driveCierre
  const puedePasarADocumentacion = panel.ronda.estado === 'activa'
  const puedeCerrar = panel.ronda.estado === 'documentacion_pendiente'
  const puedeReabrir = panel.ronda.estado === 'cerrada'
  const bloqueantesDocumentacion = [...panel.checklistBloqueantesDocumentacionPendiente, ...drive.bloqueantes]
  const bloqueantesCierre = [...panel.checklistBloqueantesCierre, ...drive.bloqueantes]
  const bloqueantesActuales = puedePasarADocumentacion ? bloqueantesDocumentacion : bloqueantesCierre
  const pendientesCriticos = drive.pendientesCriticos ?? []
  const sinBloqueantesActuales = bloqueantesActuales.length === 0

  return (
    <section className="card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between" aria-labelledby="cierre-documental-title">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="cierre-documental-title" className="text-sm font-semibold text-[var(--foreground)]">Cierre documental SGC</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sinBloqueantesActuales ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {sinBloqueantesActuales ? 'Sin bloqueantes' : `${bloqueantesActuales.length} bloqueante(s)`}
        </span>
        {pendientesCriticos.length > 0 && (
          <details className="text-xs text-amber-900">
            <summary className="cursor-pointer font-semibold">{pendientesCriticos.length} crítico(s), no bloquean cierre</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {pendientesCriticos.map((pendiente) => <li key={pendiente}>{pendiente}</li>)}
            </ul>
          </details>
        )}
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
  const [panel, drive, sync, avance] = await Promise.all([
    getPanelSgc(id),
    getDriveTreeSgc(id),
    getSincronizacionExpedienteSgc(id),
    getAvanceExpedienteSgc(id),
  ])
  if (!panel) notFound()
  const driveGoogleStatus = getDriveGoogleAutomationStatus()

  const success = getParam(query.success)
  const error = getParam(query.error)
  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <RondaContextNav rondaId={id} rondaCodigo={ronda.codigo} />

        <RondaPageHeader
          ronda={ronda}
          section="SGC"
          description="Expediente documental de la ronda: mapa documental, checklist real y registros diligenciables."
        />

        {success && <Alert tone="success" message={success} />}
        {error && <Alert tone="error" message={error} />}

        <AvisoSincronizacion sync={sync} rondaId={id} />

        <section className="card p-4" aria-labelledby="avance-expediente-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="avance-expediente-title" className="text-sm font-semibold text-[var(--foreground)]">Avance del expediente</h2>
            <span className="text-sm text-[var(--foreground-muted)]">
              <span className="numeric font-semibold text-[var(--foreground)]">{avance.completos}</span> de {avance.total} documentos que aplican
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={avance.porcentaje}
            aria-label={`Avance del expediente: ${avance.porcentaje} %`}
          >
            <div className="h-full rounded-full bg-[var(--pt-primary)]" style={{ width: `${avance.porcentaje}%` }} />
          </div>
          <p className="mt-2 text-xs text-[var(--foreground-muted)]">
            Los documentos &quot;si aplica&quot; solo cuentan cuando se marcan como aplicables.
          </p>
        </section>

        <ExpedienteGuiado
          avance={avance}
          recursos={drive.recursos}
          rondaId={id}
          rondaCodigo={ronda.codigo}
          rondaNombre={ronda.nombre}
          driveGoogleReady={driveGoogleStatus.ready}
          carpetaRondaCreada={Boolean(drive.root?.driveFolderId)}
        />

        <DriveDocumentalSgc
          drive={drive}
          panel={panel}
          avanceItems={avance.items}
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
