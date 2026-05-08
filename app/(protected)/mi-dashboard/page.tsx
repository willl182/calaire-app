import { signOut } from '@workos-inc/authkit-nextjs'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Alert } from '@/app/(protected)/dashboard/components/Alert'
import { LogoUnal } from '@/app/components/LogoUnal'
import { buildAbsoluteAppUrl } from '@/lib/app-url'
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

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="header-bar px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <LogoUnal height={32} />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                  CALAIRE APP
                </p>
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                  Ensayos de Aptitud de Calidad del Aire
                </h1>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {auth.user.email} · Participante
                </p>
              </div>
            </div>

            <form
              action={async () => {
                'use server'
                await signOut({ returnTo: buildAbsoluteAppUrl('/login') })
              }}
            >
              <button type="submit" className="btn-outline">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>

        <Alert tone="success" message={success} />
        <Alert tone="error" message={error} />

        <section className="grid gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Mis rondas asignadas</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Rondas en las que está habilitado para diligenciar ficha y cargar resultados.
            </p>
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
