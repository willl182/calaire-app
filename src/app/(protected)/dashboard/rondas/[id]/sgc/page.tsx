import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { isAdmin, requireAuth } from '@/server/auth'
import { getRonda } from '@/server/rondas'
import {
  getAvanceExpedienteSgc,
  getDriveTreeSgc,
  getPanelSgc,
  getSincronizacionExpedienteSgc,
  getSiguientePasoExpedienteSgc,
  inicializarPanelSgc,
  type SgcAvanceExpediente,
  type SgcAvanceItem,
  type SgcPanel,
} from '@/server/sgc'
import { getDriveGoogleAutomationStatus, getEstadoDriveRondaSgc } from '@/server/sgc/drive-google'
import { RondaContextNav } from '../RondaContextNav'
import { RondaPageHeader } from '../RondaPageHeader'
import { AvisoSincronizacion } from './AvisoSincronizacion'
import { DriveDocumentalSgc } from './DriveDocumentalSgc'
import { ExpedienteGuiado } from './ExpedienteGuiado'
import { HitosRonda } from './HitosRonda'
import { nombrarUsuarios } from './notas'
import { getNombresUsuarios } from './textos'
import { SiguientePasoBar } from './SiguientePasoBar'
import { transicionSgcAction } from './actions'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

const CODIGO_RE = /(F-PSEA-\d+[A-Z]?|EVID-[A-Z]+|I-PSEA-\d+)/

function enlacePendiente(rondaId: string, texto: string, items: SgcAvanceItem[]) {
  const codigo = CODIGO_RE.exec(texto)?.[1]
  const item = codigo ? items.find((i) => i.codigo === codigo) : undefined
  if (item) return item.destino
  return codigo ? `/dashboard/rondas/${rondaId}/sgc#doc-${codigo}` : `/dashboard/rondas/${rondaId}/sgc#expediente`
}

function CierreDocumentalBar({ panel, avance, rondaId }: { panel: SgcPanel; avance: SgcAvanceExpediente; rondaId: string }) {
  const drive = panel.driveCierre
  const puedePasarADocumentacion = panel.ronda.estado === 'activa'
  const puedeCerrar = panel.ronda.estado === 'documentacion_pendiente'
  const puedeReabrir = panel.ronda.estado === 'cerrada'
  const bloqueantesDocumentacion = [...panel.checklistBloqueantesDocumentacionPendiente, ...drive.bloqueantes]
  const bloqueantesCierre = [...panel.checklistBloqueantesCierre, ...drive.bloqueantes]
  const bloqueantesActuales = Array.from(new Set(puedePasarADocumentacion ? bloqueantesDocumentacion : bloqueantesCierre))
  const criticos = avance.criticos
  const sinBloqueantesActuales = bloqueantesActuales.length === 0
  const motivoId = 'cierre-motivo'
  const motivo = sinBloqueantesActuales
    ? null
    : `No se puede avanzar: hay ${bloqueantesActuales.length} bloqueante${bloqueantesActuales.length === 1 ? '' : 's'} sin resolver.`

  return (
    <section id="cierre" className="card scroll-mt-24 grid gap-4 p-5" aria-labelledby="cierre-documental-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="cierre-documental-title" className="text-base font-semibold text-[var(--foreground)]">Cierre documental SGC</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sinBloqueantesActuales ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {sinBloqueantesActuales ? 'Sin bloqueantes' : `${bloqueantesActuales.length} bloqueante${bloqueantesActuales.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {puedePasarADocumentacion && (
            <form action={transicionSgcAction}>
              <input type="hidden" name="ronda_id" value={rondaId} />
              <input type="hidden" name="accion" value="documentacion_pendiente" />
              <button className="btn-primary" type="submit" disabled={!sinBloqueantesActuales} aria-describedby={motivo ? motivoId : undefined}>
                Pasar a documentación pendiente
              </button>
            </form>
          )}
          {puedeCerrar && (
            <form action={transicionSgcAction}>
              <input type="hidden" name="ronda_id" value={rondaId} />
              <input type="hidden" name="accion" value="cerrar" />
              <button className="btn-primary" type="submit" disabled={!sinBloqueantesActuales} aria-describedby={motivo ? motivoId : undefined}>
                Cerrar documentalmente
              </button>
            </form>
          )}
          {puedeReabrir && (
            <form action={transicionSgcAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="ronda_id" value={rondaId} />
              <input type="hidden" name="accion" value="reabrir" />
              <input className="input" name="motivo" placeholder="Motivo de reapertura" aria-label="Motivo de reapertura" required />
              <button className="btn-outline" type="submit">Reabrir</button>
            </form>
          )}
        </div>
      </div>
      {motivo && <p id={motivoId} className="text-sm font-medium text-rose-900">{motivo}</p>}

      {!sinBloqueantesActuales && (
        <div className="rounded-lg border-2 border-rose-300 bg-rose-50 p-3">
          <h3 className="text-sm font-semibold text-rose-900">Bloqueantes: impiden el cierre</h3>
          <ul className="mt-2 grid gap-1 text-sm text-rose-950">
            {bloqueantesActuales.map((bloqueante) => (
              <li key={bloqueante} className="flex items-start gap-2">
                <span aria-hidden="true">●</span>
                <Link className="underline-offset-2 hover:underline" href={enlacePendiente(rondaId, bloqueante, avance.items)}>{bloqueante}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {criticos.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <h3 className="text-xs font-semibold text-amber-900">Críticos: conviene resolverlos, pero no bloquean el cierre</h3>
          <ul className="mt-1 grid gap-0.5 text-xs text-amber-950">
            {criticos.map((item) => (
              <li key={item.codigo}>
                <Link className="underline-offset-2 hover:underline" href={item.destino}>{item.codigo} · {item.nombre}</Link>
                <span className="text-amber-800"> — {item.motivo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
  const [panel, drive, sync, avanceCrudo, siguientePaso, estadoDrive, nombresUsuarios] = await Promise.all([
    getPanelSgc(id),
    getDriveTreeSgc(id),
    getSincronizacionExpedienteSgc(id),
    getAvanceExpedienteSgc(id),
    getSiguientePasoExpedienteSgc(id),
    getEstadoDriveRondaSgc(id),
    getNombresUsuarios(),
  ])
  if (!panel) notFound()
  // Los motivos pueden traer el id de WorkOS (p. ej. "Revisado por user_…"): se muestra el nombre.
  const conNombre = (item: SgcAvanceItem) => ({ ...item, motivo: nombrarUsuarios(item.motivo, nombresUsuarios) })
  const avance: SgcAvanceExpediente = {
    ...avanceCrudo,
    items: avanceCrudo.items.map(conNombre),
    bloqueantes: avanceCrudo.bloqueantes.map(conNombre),
    criticos: avanceCrudo.criticos.map(conNombre),
    advertencias: avanceCrudo.advertencias.map(conNombre),
  }
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
          description="Expediente documental de la ronda: qué sigue, documentos por etapa y cierre."
        />

        {success && <Alert tone="success" message={success} />}
        {error && <Alert tone="error" message={error} />}

        {siguientePaso && <SiguientePasoBar pasosPrevios={siguientePaso.pasosPrevios} siguiente={siguientePaso.siguiente} />}

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
          carpetaRondaCreada={estadoDrive.carpetaRondaCreada}
        />

        <HitosRonda hitos={panel.hitos} rondaId={id} />

        <DriveDocumentalSgc
          drive={drive}
          panel={panel}
          avanceItems={avance.items}
          estadoDrive={estadoDrive}
          nombresUsuarios={nombresUsuarios}
          rondaId={id}
          rondaCodigo={ronda.codigo}
          rondaNombre={ronda.nombre}
          driveGoogleReady={driveGoogleStatus.ready}
          driveGoogleConfig={driveGoogleStatus}
          selectedCarpeta={getParam(query.carpeta) ?? null}
          selectedDocId={getParam(query.doc) ?? null}
        />

        <CierreDocumentalBar panel={panel} avance={avance} rondaId={id} />
      </div>
    </div>
  )
}
