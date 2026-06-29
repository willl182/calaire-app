import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@workos-inc/authkit-nextjs'

import { LogoUnal } from '@/app/components/LogoUnal'
import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { listMapaSgc, listNormativaSgc, listSgcMaestro } from '@/lib/sgc'

export default async function SgcResumenPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')
  const [documentos, normativa, mapa] = await Promise.all([
    listSgcMaestro(),
    listNormativaSgc(),
    listMapaSgc(),
  ])

  return (
    <div className="grid min-w-0 gap-6">
      <header className="header-bar w-full min-w-0 max-w-full px-8 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <LogoUnal height={64} />
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                SGC Maestro <span className="font-medium text-[var(--foreground-muted)]">CALAIRE</span>
              </h1>
              <p className="text-base font-medium text-[var(--pt-primary-dark)]">
                Repositorio global de documentos, versiones, requisitos y mapa documental
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                {auth.user.email} · Coordinador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/sgc/documentos" className="btn-primary">
              Centro documental
            </Link>
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
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Documentos maestros</div>
          <div className="mt-2 text-3xl font-semibold">{documentos.resumen.total}</div>
          <div className="mt-1 text-xs text-[var(--foreground-muted)]">{documentos.resumen.vigentes} vigentes</div>
        </div>
        <div className="card-accent border-l-amber-500 bg-amber-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Sin version oficial</div>
          <div className="mt-2 text-3xl font-semibold">{documentos.resumen.sinVersion}</div>
          <div className="mt-1 text-xs text-[var(--foreground-muted)]">Pendientes de archivo congelado</div>
        </div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Requisitos</div>
          <div className="mt-2 text-3xl font-semibold">{normativa.resumen.requisitos}</div>
          <div className="mt-1 text-xs text-[var(--foreground-muted)]">Normativa cargada</div>
        </div>
        <div className="card-accent border-l-sky-500 bg-sky-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Relaciones mapa</div>
          <div className="mt-2 text-3xl font-semibold">{mapa.relaciones.length}</div>
          <div className="mt-1 text-xs text-[var(--foreground-muted)]">{mapa.pendientes} pendientes</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Centro documental', '/dashboard/sgc/documentos', 'Documentos maestros, fuente editable y version oficial.'],
          ['Matriz normativa', '/dashboard/sgc/normativa', 'Requisitos 17043/13528 y cobertura documental.'],
          ['Mapa SGC', '/dashboard/sgc/mapa', 'Relaciones navegables desde el inventario maestro.'],
        ].map(([label, href, description]) => (
          <Link key={href} href={href} className="card-accent px-5 py-4 hover:no-underline">
            <div className="text-sm font-semibold text-[var(--foreground)]">{label}</div>
            <div className="mt-2 text-xs text-[var(--foreground-muted)]">{description}</div>
          </Link>
        ))}
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dashboard documental por ronda</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Es otro dashboard: consulta el expediente operativo de rondas de Gestion y no forma parte del SGC maestro global.
            </p>
          </div>
          <Link className="btn-outline" href="/dashboard/rondas/expedientes">Abrir expedientes de ronda</Link>
        </div>
      </section>
    </div>
  )
}
