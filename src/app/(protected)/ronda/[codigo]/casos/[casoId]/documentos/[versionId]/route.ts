import { getPtCaseDocument } from '@/server/rondas'

export async function GET(_request: Request, { params }: { params: Promise<{ casoId: string; versionId: string }> }) {
  const { casoId, versionId } = await params
  try {
    const file = await getPtCaseDocument(casoId, versionId)
    const response = file.url ? await fetch(file.url) : null
    if (!response?.ok) throw new Error('missing')
    return new Response(response.body, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.nombreArchivo.replace(/["\r\n]/g, '_')}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return Response.json({ error: 'not_found_or_forbidden' }, { status: 404 })
  }
}
