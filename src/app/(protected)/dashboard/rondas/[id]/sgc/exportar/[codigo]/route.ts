import { NextResponse } from 'next/server'
import { isAdmin, requireAuth } from '@/server/auth'
import { exportarDocumentoAutollenadoSgc } from '@/server/sgc/exports-autollenado'

const EXPORTABLES = new Set(['F-PSEA-01', 'F-PSEA-02', 'F-PSEA-04'])

/** Descarga CSV de los documentos autollenados (F-PSEA-01, F-PSEA-02, F-PSEA-04). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; codigo: string }> }) {
  const auth = await requireAuth()
  if (!auth.user || !isAdmin(auth)) {
    return NextResponse.json({ error: 'Sin permiso para exportar.' }, { status: 403 })
  }
  const { id, codigo } = await params
  const normalizado = decodeURIComponent(codigo).trim().toUpperCase()
  if (!EXPORTABLES.has(normalizado)) {
    return NextResponse.json({ error: 'Documento no exportable.' }, { status: 404 })
  }
  const archivo = await exportarDocumentoAutollenadoSgc(id, normalizado)
  if (!archivo) return NextResponse.json({ error: 'Ronda no disponible.' }, { status: 404 })
  return new NextResponse(archivo.body, {
    headers: {
      'Content-Type': archivo.contentType,
      'Content-Disposition': `attachment; filename="${archivo.fileName.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  })
}
