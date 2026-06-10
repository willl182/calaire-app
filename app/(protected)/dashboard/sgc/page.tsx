import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@workos-inc/authkit-nextjs'

import { LogoUnal } from '@/app/components/LogoUnal'
import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { isAdmin, requireAuth } from '@/lib/auth'
import SgcResumenClient from './SgcResumenClient'

export default async function SgcResumenPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  return (
    <div className="grid min-w-0 gap-6">
      <header className="header-bar w-full min-w-0 max-w-full px-8 py-6">
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
                {auth.user.email} · Coordinador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/rondas/nueva" className="btn-primary">
              ＋ Nueva ronda
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

      <SgcResumenClient />
    </div>
  )
}
