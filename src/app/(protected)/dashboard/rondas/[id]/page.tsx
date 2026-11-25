import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { Alert } from '@/components/ui/Alert'
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton'
import { BackendOfflineBanner } from '@/components/ui/BackendOfflineBanner'
import { requireAuth, isAdmin } from '@/server/auth'
import {
  getRondaWithStatus,
  getRondaMetricasCompletasWithStatus,
  type RondaMetricas,
  type EstadoRonda,
  type Ronda,
} from '@/server/rondas'
import { getEstadoRondaVisible, type EstadoRondaVisible } from '@/lib/rondas/estado-visible'
import { TONO_INSIGNIA } from '@/lib/ui/tonos'
import { RondaContextNav } from './RondaContextNav'
import { RondaPageHeader } from './RondaPageHeader'
import { activarRondaAction, cerrarRondaAction, reabrirRondaAction } from './actions'
import { updateRondaBasicInfoAction, updateRondaReplicasAction } from '../../actions'
import { SubmitButton } from '@/components/ui/SubmitButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Estado de la ronda' }

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function EstadoOperativoBadge({ estado }: { estado: EstadoRondaVisible }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${TONO_INSIGNIA[estado.tono]}`}
    >
      {estado.etiqueta}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Progress metric card
// ---------------------------------------------------------------------------

function MetricaCard({
  label,
  value,
  total,
  variant = 'default',
  href,
}: {
  label: string
  value: number | string
  total?: number | string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  href?: string
}) {
  const variantClass = {
    default: '',
    success: 'bg-success-soft/40',
    warning: 'bg-warning-soft/50',
    danger: 'bg-danger-soft/50',
  }[variant]

  const inner = (
    <>
      <div className="sgc-kpi-label">
        {label}
      </div>
            <div className="sgc-kpi-value numeric">
        {value}
        {total !== undefined && (
          <span className="text-xl font-normal text-[var(--foreground-muted)]"> / {total}</span>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={`sgc-kpi hover:no-underline ${variantClass}`}>
        {inner}
      </Link>
    )
  }

  return <div className={`sgc-kpi ${variantClass}`}>{inner}</div>
}

// ---------------------------------------------------------------------------
// Alertas operativas
// ---------------------------------------------------------------------------

function AlertasOperativas({ metricas, rondaId }: { metricas: RondaMetricas; rondaId: string }) {
  const alertas: { message: string; href: string; tone: 'amber' | 'sky' | 'violet' | 'emerald' }[] = []

  // Participant-level alerts only make sense once PT is configured
  // (the CONFIG PT card already communicates the pending state visually)
  if (metricas.pt_configurado) {
    if (metricas.fichas_pendientes > 0) {
      alertas.push({
        message: `${metricas.fichas_pendientes} ficha${metricas.fichas_pendientes !== 1 ? 's' : ''} pendiente${metricas.fichas_pendientes !== 1 ? 's' : ''} de envío.`,
        href: `/dashboard/rondas/${rondaId}/participantes`,
        tone: 'violet',
      })
    }
  }

  // 3. Results available
  if (metricas.envios_finales > 0) {
    alertas.push({
      message: `${metricas.envios_finales} envío${metricas.envios_finales !== 1 ? 's' : ''} final${metricas.envios_finales !== 1 ? 'es' : ''} disponible${metricas.envios_finales !== 1 ? 's' : ''}.`,
      href: `/dashboard/rondas/${rondaId}/resultados`,
      tone: 'emerald',
    })
  }

  if (alertas.length === 0) return null

  const toneClasses = {
    amber: 'border-warning-border bg-warning-soft text-warning-strong hover:bg-warning-border/50',
    sky: 'border-info-border bg-info-soft text-info-strong hover:bg-info-border/50',
    violet: 'border-special-border bg-special-soft text-special-strong hover:bg-special-border/50',
    emerald: 'border-success-border bg-success-soft text-success-strong hover:bg-success-border/50',
  }

  return (
    <div className="grid gap-2">
      {alertas.map((alerta) => (
        <Link
          key={alerta.message}
          href={alerta.href}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition ${toneClasses[alerta.tone]}`}
        >
          <span>{alerta.message}</span>
          <span className="text-xs opacity-70">→</span>
        </Link>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Acciones de estado
// ---------------------------------------------------------------------------

function AccionesDeEstado({ rondaId, estado }: { rondaId: string; estado: EstadoRonda }) {
  if (estado === 'borrador') {
    return (
      <section className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">Activar la ronda</h2>
        <p className="mb-4 text-sm text-[var(--foreground-muted)]">
          Al activarla, los participantes pueden reclamar sus cupos y empezar a capturar resultados.
        </p>
        <form action={activarRondaAction}>
          <input type="hidden" name="ronda_id" value={rondaId} />
          <ConfirmSubmitButton
            tone="primary"
            title="Activar ronda"
            message="Los participantes podrán reclamar sus cupos y capturar resultados. Revise antes la configuración PT y los participantes."
            confirmLabel="Activar ronda"
            pendingLabel="Activando…"
            className="btn-primary"
          >
            Activar ronda
          </ConfirmSubmitButton>
        </form>
      </section>
    )
  }

  if (estado === 'cerrada') {
    return (
      <section className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">Reabrir la ronda</h2>
        <p className="mb-4 text-sm text-[var(--foreground-muted)]">
          Vuelve a permitir cambios en participantes, fichas y resultados.
        </p>
        <form action={reabrirRondaAction}>
          <input type="hidden" name="ronda_id" value={rondaId} />
          <input type="hidden" name="confirm" value="1" />
          <ConfirmSubmitButton
            tone="primary"
            title="Reabrir ronda"
            message="¿Reabrir la ronda? Vuelve a permitir cambios en participantes, fichas y resultados."
            confirmLabel="Reabrir ronda"
            pendingLabel="Reabriendo…"
            className="btn-outline"
          >
            Reabrir ronda
          </ConfirmSubmitButton>
        </form>
      </section>
    )
  }

  if (estado !== 'activa') return null

  return (
    <section aria-labelledby="zona-peligro" className="rounded-xl border-2 border-danger-border bg-[var(--surface-panel)] p-6">
      <h2 id="zona-peligro" className="mb-1 text-lg font-semibold text-danger-strong">
        Zona de peligro
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Cerrar ronda</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            Detiene la captura de resultados y pasa la ronda a documentación pendiente. Los participantes ya
            no podrán enviar datos.
          </p>
        </div>
        <form action={cerrarRondaAction} className="shrink-0">
          <input type="hidden" name="ronda_id" value={rondaId} />
          <input type="hidden" name="confirm" value="1" />
          <ConfirmSubmitButton
            title="Cerrar ronda"
            message="Los participantes ya no podrán enviar datos y la ronda pasará a documentación pendiente. ¿Desea continuar?"
            confirmLabel="Cerrar ronda"
            pendingLabel="Cerrando…"
            className="btn-danger-outline"
          >
            Cerrar ronda
          </ConfirmSubmitButton>
        </form>
      </div>
    </section>
  )
}

function DatosBasicosForm({ ronda }: { ronda: Ronda }) {
  if (ronda.estado === 'cerrada') return null

  return (
    <section className="card p-6" aria-labelledby="datos-basicos-titulo">
      <h2 id="datos-basicos-titulo" className="mb-1 text-lg font-semibold text-[var(--foreground)]">
        Nombre y código
      </h2>
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">
        Cambiar el código deja sin validez los enlaces de invitación ya enviados, porque incluyen el código de la
        ronda. Los códigos PT de los participantes no cambian.
      </p>
      <form action={updateRondaBasicInfoAction} className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <input type="hidden" name="ronda_id" value={ronda.id} />
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[var(--foreground)]">Nombre de la ronda</span>
          <input className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] outline-none focus:border-[var(--pt-primary)] focus:ring-2 focus:ring-[var(--pt-primary-subtle)] transition-colors" name="nombre" defaultValue={ronda.nombre} required maxLength={160} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[var(--foreground)]">Código</span>
          <input
            className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] outline-none focus:border-[var(--pt-primary)] focus:ring-2 focus:ring-[var(--pt-primary-subtle)] transition-colors uppercase"
            name="codigo"
            defaultValue={ronda.codigo}
            required
            maxLength={40}
            aria-describedby="datos-basicos-codigo-ayuda"
          />
          <span id="datos-basicos-codigo-ayuda" className="text-xs text-[var(--foreground-muted)]">
            Se guarda en mayúsculas; los espacios se cambian por guiones.
          </span>
        </label>
        <SubmitButton className="btn-primary min-h-[44px]" pendingLabel="Guardando…">
          Guardar
        </SubmitButton>
      </form>
    </section>
  )
}

function ReplicasForm({ ronda }: { ronda: Ronda }) {
  if (ronda.contaminantes.length === 0) return null

  const canEdit = ronda.estado !== 'cerrada'

  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">Réplicas por contaminante</h2>
      <p className="text-sm text-[var(--foreground-muted)] mb-4">
        Cambie el número de réplicas en cualquier momento mientras la ronda no esté cerrada. Aplica a
        todos los niveles del contaminante y no modifica los datos ya capturados.
      </p>

      {canEdit ? (
        <form action={updateRondaReplicasAction} className="grid gap-4">
          <input type="hidden" name="ronda_id" value={ronda.id} />
          <input type="hidden" name="return_to" value={`/dashboard/rondas/${ronda.id}`} />

          <div className="grid gap-3 md:grid-cols-2">
            {ronda.contaminantes.map((config) => (
              <label
                key={config.id}
                className="grid gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]"
              >
                <span className="font-medium text-[var(--foreground)]">{config.contaminante}</span>
                <span className="text-xs">Niveles: {config.niveles}</span>
                <select
                  name={`replicas_${config.contaminante}`}
                  defaultValue={String(config.replicas)}
                  className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none transition-colors focus:border-[var(--pt-primary)]"
                >
                  <option value="2">2 réplicas</option>
                  <option value="3">3 réplicas</option>
                </select>
              </label>
            ))}
          </div>

          <div className="flex justify-end">
            <SubmitButton className="btn-primary">
              Guardar réplicas
            </SubmitButton>
          </div>
        </form>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {ronda.contaminantes.map((config) => (
            <div
              key={config.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]"
            >
              <span className="font-medium text-[var(--foreground)]">{config.contaminante}</span>
              <span className="ml-2">{config.replicas} réplicas</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function RondaEstadoPage({ params, searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const { id: rondaId } = await params
  const rondaResult = await getRondaWithStatus(rondaId)
  if (!rondaResult.data && !rondaResult.offline) notFound()
  if (!rondaResult.data) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <BackendOfflineBanner detail="No se pudo verificar la ronda solicitada porque el servidor no responde." />
          <section className="card p-8 text-center">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Ronda no disponible</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
              La ruta queda en espera de backend; no se marca como 404 hasta poder consultar Convex.
            </p>
          </section>
        </div>
      </div>
    )
  }
  const ronda = rondaResult.data

  const metricasResult = await getRondaMetricasCompletasWithStatus(rondaId, ronda)
  const metricas = metricasResult.data
  const estadoVisible = getEstadoRondaVisible(ronda, metricas)

  const sp = searchParams ? await searchParams : {}
  const success = getParam(sp.success)
  const error = getParam(sp.error)

  // Derive metric card variants
  const cuposVariant =
    metricas.cupos_reclamados === metricas.cupos_totales && metricas.cupos_totales > 0
      ? 'success'
      : metricas.cupos_reclamados === 0 && metricas.cupos_totales > 0
        ? 'danger'
        : 'warning'

  const fichasVariant =
    metricas.fichas_enviadas === metricas.cupos_reclamados && metricas.cupos_reclamados > 0
      ? 'success'
      : metricas.fichas_pendientes > 0
        ? 'warning'
        : 'default'

  const enviosVariant =
    metricas.envios_finales >= metricas.envios_esperados && metricas.envios_esperados > 0
      ? 'success'
      : metricas.envios_finales > 0
        ? 'warning'
        : 'default'

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Context Navigation */}
        <RondaContextNav rondaId={rondaId} rondaCodigo={ronda.codigo} ptConfigurado={metricas.pt_configurado} />

        <RondaPageHeader
          ronda={ronda}
          section="Estado de la ronda"
          description={estadoVisible.descripcion}
          actions={<EstadoOperativoBadge estado={estadoVisible} />}
        />

        {/* Alerts */}
        <Alert tone="success" message={success} />
        <Alert tone="error" message={error} />
        {metricasResult.offline && (
          <BackendOfflineBanner detail="La ronda cargó, pero las métricas operativas se muestran vacías temporalmente porque el servidor no responde." />
        )}

        {/* Progress Metrics */}
        <section className="sgc-kpis">
          <MetricaCard
            label="Config PT"
            value={metricas.pt_configurado ? 1 : 0}
            total={1}
            href={!metricas.pt_configurado ? `/dashboard/rondas/${rondaId}/configuracion-pt` : undefined}
          />
          <MetricaCard
            label="Cupos"
            value={metricas.cupos_reclamados}
            total={metricas.cupos_totales}
            variant={cuposVariant}
          />
          <MetricaCard
            label="Fichas"
            value={metricas.fichas_enviadas}
            total={metricas.cupos_reclamados}
            variant={fichasVariant}
          />
          <MetricaCard
            label="Envíos PT"
            value={metricas.envios_finales}
            total={metricas.envios_esperados}
            variant={enviosVariant}
          />
        </section>

        {/* Operational Alerts */}
        <AlertasOperativas metricas={metricas} rondaId={rondaId} />

        <DatosBasicosForm ronda={ronda} />

        {/* Replicas */}
        <ReplicasForm ronda={ronda} />

        {/* State Actions */}
        <AccionesDeEstado rondaId={rondaId} estado={ronda.estado} />
      </div>
    </div>
  )
}
