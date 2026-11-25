import Link from 'next/link'
import type { ReactNode } from 'react'

import { LogoUnal } from '@/components/LogoUnal'
import { Icon, type IconName } from './Icon'

/**
 * Página completa de estado (acceso denegado, no encontrado…) con el mismo
 * estilo del ingreso: logo, tarjeta con borde dorado y acciones.
 */
export function PaginaEstado({
  icono,
  etiqueta,
  titulo,
  children,
  acciones,
}: {
  icono: IconName
  etiqueta: string
  titulo: string
  children: ReactNode
  acciones: { href: string; texto: string }[]
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
      <div className="flex w-full max-w-lg flex-col items-center gap-8">
        <LogoUnal height={56} />
        <section className="card-accent flex w-full flex-col gap-5 p-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-[var(--pt-primary-subtle)] text-[var(--pt-primary-dark)]">
              <Icon name={icono} className="h-6 w-6" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{etiqueta}</p>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{titulo}</h1>
            <div className="text-sm leading-6 text-[var(--foreground-muted)]">{children}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            {acciones.map((accion, index) => (
              <Link key={accion.href} href={accion.href} className={index === 0 ? 'btn-primary' : 'btn-outline'}>
                {accion.texto}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
