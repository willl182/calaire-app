import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Alert } from '@/app/(protected)/dashboard/components/Alert'
import { LogoUnal } from '@/app/components/LogoUnal'
import { isAdmin, requireAuth } from '@/lib/auth'
import { listRondasParticipante, type Ronda, type RondaParticipanteAsignada } from '@/lib/rondas'

function estadoParticipanteBadge(estado: Ronda['estado']) {
  if (estado === 'activa') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'cerrada') return 'bg-slate-200 text-slate-700'
  return 'bg-amber-100 text-amber-800'
}

function FichaBadge({ estado }: { estado: RondaParticipanteAsignada['ficha_estado'] }) {
  if (estado === 'enviado') {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        Ficha enviada ✓
      </span>
    )
  }
  if (estado === 'borrador') {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Ficha en borrador
      </span>
    )
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      Ficha no iniciada
    </span>
  )
}

function RondaParticipanteCard({ ronda }: { ronda: RondaParticipanteAsignada }) {
  const esActiva = ronda.estado === 'activa'
  const fichaEnviada = ronda.ficha_estado === 'enviado'
  const fichaLabel =
    ronda.ficha_estado === 'enviado'
      ? 'Ver ficha'
      : ronda.ficha_estado === 'borrador'
        ? 'Continuar ficha'
        : 'Diligenciar ficha'
  const puedeCargarDatos = esActiva && fichaEnviada

  return (
    <article className="card grid gap-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{ronda.nombre}</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${estadoParticipanteBadge(ronda.estado)}`}
            >
              {ronda.estado}
            </span>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Código <span className="font-medium text-[var(--foreground)]">{ronda.codigo}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <FichaBadge estado={ronda.ficha_estado} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            <Link href={`/ronda/${ronda.codigo}/registro`} className="btn-primary self-start">
              {fichaLabel} →
            </Link>

            {puedeCargarDatos ? (
              <Link href={`/ronda/${ronda.codigo}`} className="btn-outline self-start">
                Cargar datos
              </Link>
            ) : (
              <span className="self-start rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)]">
                Cargar datos
              </span>
            )}
          </div>

          {!puedeCargarDatos && (
            <p className="max-w-64 text-left text-xs leading-5 text-[var(--foreground-muted)] sm:text-right">
              {ronda.estado === 'borrador'
                ? 'Diligencie la ficha ahora. La carga de datos se habilita cuando el coordinador active la ronda.'
                : fichaEnviada
                  ? 'La carga de datos no está disponible para esta ronda.'
                  : 'Complete la ficha para habilitar el ingreso de resultados.'}
            </p>
          )}
        </div>
      </div>

      {ronda.contaminantes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ronda.contaminantes.map((c) => (
            <span
              key={c.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--foreground-muted)]"
            >
              {c.contaminante} · {c.niveles}N · {c.replicas}R
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function ParticipantKpiCard({
  label,
  value,
  detail,
  variant = 'default',
}: {
  label: string
  value: number
  detail: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const variantClass = {
    default: 'border-l-[var(--pt-primary)]',
    success: 'border-l-emerald-500 bg-emerald-50/40',
    warning: 'border-l-amber-500 bg-amber-50/50',
    danger: 'border-l-rose-500 bg-rose-50/50',
  }[variant]

  return (
    <div className={`card-accent px-5 py-4 ${variantClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
        {label}
      </p>
      <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">
        {value}
      </div>
      <p className="mt-1 text-xs text-[var(--foreground-muted)]">{detail}</p>
    </div>
  )
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function MiDashboardPage({ searchParams }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (isAdmin(auth)) redirect('/dashboard')

  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const rondas = await listRondasParticipante(auth.user.id)
  const rondasActivas = rondas.filter((r) => r.estado === 'activa').length
  const fichasPendientes = rondas.filter((r) => r.ficha_estado !== 'enviado').length
  const resultadosPendientes = rondas.filter(
    (r) => r.estado === 'activa' && r.ficha_estado === 'enviado' && !r.envio_pt_enviado
  ).length
  const rondasBorrador = rondas.filter((r) => r.estado === 'borrador').length

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="header-bar px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <LogoUnal height={64} />
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Ensayos de Aptitud</span>
                </h1>
                <p className="text-base font-medium text-[var(--pt-primary-dark)]">
                  Gases Contaminantes Criterio
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {auth.user.email} · Participante
                </p>
              </div>
            </div>
          </div>
        </header>

        <Alert tone="success" message={success} />
        <Alert tone="error" message={error} />

        <section className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ParticipantKpiCard
              label="Rondas activas"
              value={rondasActivas}
              detail="Disponibles para gestión"
              variant={rondasActivas > 0 ? 'success' : 'default'}
            />
            <ParticipantKpiCard
              label="Fichas pendientes"
              value={fichasPendientes}
              detail="Por diligenciar o enviar"
              variant={fichasPendientes > 0 ? 'warning' : 'default'}
            />
            <ParticipantKpiCard
              label="Resultados pendientes"
              value={resultadosPendientes}
              detail="Con ficha lista y PT sin envío final"
              variant={resultadosPendientes > 0 ? 'danger' : 'default'}
            />
            <ParticipantKpiCard
              label="En borrador"
              value={rondasBorrador}
              detail="Rondas aún no activas"
              variant={rondasBorrador > 0 ? 'warning' : 'default'}
            />
          </div>

          <div className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Mis rondas asignadas</h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Rondas en las que está habilitado para diligenciar ficha y cargar resultados.
              </p>
            </div>
            {rondas.length > 0 && (
              <a
                href="/guia.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center gap-2 self-start"
                title="Abrir guía del participante en nueva pestaña"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Guía del participante
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            )}
          </div>

          {rondas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
              No tiene rondas asignadas todavía. Contacte al coordinador para que lo agregue.
            </div>
          ) : (
            rondas.map((r) => <RondaParticipanteCard key={r.id} ronda={r} />)
          )}
        </section>
      </div>
    </div>
  )
}
