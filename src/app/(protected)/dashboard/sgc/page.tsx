import { redirect } from 'next/navigation'

import { canViewSgcMaestro, requireAuth } from '@/server/auth'
import { listMapaSgcWithStatus, listNormativaSgcWithStatus, listSgcMaestroWithStatus } from '@/server/sgc'
import { SgcResumenView } from './SgcResumenView'

export default async function SgcResumenPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

  const [documentos, normativa, mapa] = await Promise.all([
    listSgcMaestroWithStatus(),
    listNormativaSgcWithStatus(),
    listMapaSgcWithStatus(),
  ])

  return (
    <SgcResumenView
      email={auth.user.email}
      documentos={documentos.data}
      normativa={normativa.data}
      mapa={mapa.data}
      backendOffline={documentos.offline || normativa.offline || mapa.offline}
    />
  )
}
