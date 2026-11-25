import type { Metadata } from 'next'

import { PaginaEstado } from '@/components/ui/PaginaEstado'

export const metadata: Metadata = { title: 'Página no encontrada' }

export default function NotFound() {
  return (
    <PaginaEstado
      icono="alerta"
      etiqueta="Error 404"
      titulo="La página solicitada no existe"
      acciones={[{ href: '/', texto: 'Ir al inicio' }]}
    >
      <p>Verifique el enlace (por ejemplo, el de la ronda) o vuelva al inicio para continuar.</p>
    </PaginaEstado>
  )
}
