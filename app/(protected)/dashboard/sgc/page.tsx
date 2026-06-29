import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@workos-inc/authkit-nextjs'

import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { listMapaSgc, listNormativaSgc, listSgcMaestro } from '@/lib/sgc'
import { SgcHeader } from './SgcHeader'

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
      <SgcHeader
        title={<>SGC Maestro <span className="font-medium text-[var(--foreground-muted)]">CALAIRE</span></>}
        accent="Repositorio global de documentos, versiones, requisitos y mapa documental"
        description="Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín"
        email={auth.user.email}
        actions={
          <>
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
          </>
        }
      />

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
    </div>
  )
}
