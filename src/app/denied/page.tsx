import type { Metadata } from 'next'

import { PaginaEstado } from '@/components/ui/PaginaEstado'

export const metadata: Metadata = { title: 'Acceso denegado' }

function resolveMessage(reason?: string) {
  switch (reason) {
    case 'role':
      return 'Su cuenta no tiene permisos para acceder a esta sección administrativa.'
    case 'invite':
      return 'Su cuenta no está asociada a la ronda solicitada. Use el enlace de invitación que recibió o pida uno nuevo al coordinador.'
    case 'reference-role':
      return 'Este enlace es exclusivo para el laboratorio de referencia de la ronda.'
    default:
      return 'No fue posible autorizar el acceso con la sesión actual. Cierre sesión e ingrese de nuevo.'
  }
}

export default async function DeniedPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const reasonRaw = params.reason
  const reason = Array.isArray(reasonRaw) ? reasonRaw[0] : reasonRaw

  return (
    <PaginaEstado
      icono="candado"
      etiqueta="Acceso denegado"
      titulo="No es posible abrir esta vista"
      acciones={[
        { href: '/', texto: 'Ir al inicio' },
        { href: '/login', texto: 'Ingresar con otra cuenta' },
      ]}
    >
      <p>{resolveMessage(reason)}</p>
    </PaginaEstado>
  )
}
