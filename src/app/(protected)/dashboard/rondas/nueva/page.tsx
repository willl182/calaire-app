import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireAuth, isAdmin } from '@/server/auth'
import { CONTAMINANTES } from '@/server/rondas'
import { NuevaRondaForm } from './NuevaRondaForm'

export const metadata: Metadata = { title: 'Nueva ronda' }

export default async function NuevaRondaPage() {
  const auth = await requireAuth()
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/rondas"
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Rondas
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Nueva ronda</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Defina el nombre, código y estructura analítica. Se generarán los enlaces de acceso por participante.
          </p>
        </div>

        <NuevaRondaForm contaminantes={[...CONTAMINANTES]} />

      </div>
    </div>
  )
}
