import { redirect } from 'next/navigation'
import { canViewSgcMaestro, requireAuth } from '@/lib/auth'
import { getDocumentoSgcDownloadUrl } from '@/lib/sgc'

type RouteContext = {
  params: Promise<{
    id: string
    versionId: string
  }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canViewSgcMaestro(auth)) redirect('/denied?reason=role')

  const { id, versionId } = await params
  const url = await getDocumentoSgcDownloadUrl(versionId)
  if (!url) redirect(`/dashboard/sgc/documentos/${id}?error=${encodeURIComponent('La version no tiene archivo oficial disponible.')}`)
  redirect(url)
}
