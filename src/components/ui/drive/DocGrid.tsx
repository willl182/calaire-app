import type { ReactNode } from 'react'

// Grilla compartida "lista + aside de detalle" dentro de una carpeta.
export const driveSplitGrid = 'grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]'

// Dos modos: sin seleccion los DocRow se acomodan en cuadricula multi-columna;
// con seleccion colapsa a una columna angosta junto al aside de detalle.
export function DocGrid({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return <div className={collapsed ? 'grid gap-2' : 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3'}>{children}</div>
}
