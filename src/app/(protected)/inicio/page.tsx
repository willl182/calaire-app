import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signOut } from '@workos-inc/authkit-nextjs'

import { LogoUnal } from '@/components/LogoUnal'
import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { requireAuth } from '@/server/auth'

const PT_APP_URL = 'https://w421.shinyapps.io/pt_app/'

export default async function InicioPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="header-bar px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-6">
              <LogoUnal height={64} />
              <div className="min-w-0 space-y-0.5">
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Inicio</span>
                </h1>
                <p className="text-base font-medium text-[var(--pt-primary-dark)]">Ensayos de Aptitud y Sistema de Gestión de Calidad</p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {auth.user.email} · Selecciona el área de trabajo
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

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard" className="card-accent min-h-40 px-6 py-5 hover:no-underline">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Operación</div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">Gestión de rondas</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">Crear rondas, administrar participantes, revisar registros y resultados.</p>
          </Link>

          <Link href="/sgc" className="card-accent min-h-40 px-6 py-5 hover:no-underline">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Calidad</div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">Sistema de Gestión de Calidad</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">Documentos maestros, matriz normativa y mapa documental del SGC.</p>
          </Link>

          <a href={PT_APP_URL} target="_blank" rel="noopener noreferrer" className="card-accent min-h-40 px-6 py-5 hover:no-underline">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Externo</div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">pt_app ↗</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">Procesamiento estadístico, análisis PT y generación de resultados.</p>
          </a>
        </section>
      </div>
    </main>
  )
}
