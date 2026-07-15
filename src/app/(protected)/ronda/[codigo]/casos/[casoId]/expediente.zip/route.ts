import JSZip from 'jszip'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { getPtCaseArchive } from '@/server/rondas'

function safeName(value: string) { return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) }

async function summaryPdf(data: Awaited<ReturnType<typeof getPtCaseArchive>>) {
  const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica)
  let page = pdf.addPage([612, 792]), y = 750
  const line = (text: string, size = 10) => { if (y < 45) { page = pdf.addPage([612, 792]); y = 750 } page.drawText(text.slice(0, 105), { x: 40, y, size, font }); y -= size + 6 }
  line(`Expediente ${data.caso.codigo}`, 18); line(data.caso.titulo, 12); line(`Estado: ${data.caso.estado}`); line(`Creado: ${new Date(data.caso.createdAt).toISOString()}`); line(`Cerrado: ${data.caso.cerradoAt ? new Date(data.caso.cerradoAt).toISOString() : '-'}`)
  line(''); line('Bitacora de mensajes', 13)
  for (const message of data.messages) line(`${new Date(message.createdAt).toISOString()} | ${message.autorTipo} | ${message.texto}`)
  line(''); line('Verificaciones posteriores', 13)
  for (const check of data.verifications) line(`${check.ptScoreOrigenId} -> ${check.ptScorePosteriorId ?? 'pendiente'} | ${check.resultado} | ${check.vinculacion ?? '-'}`)
  return pdf.save()
}

export async function GET(_request: Request, { params }: { params: Promise<{ casoId: string }> }) {
  const { casoId } = await params
  try {
    const data = await getPtCaseArchive(casoId)
    const zip = new JSZip()
    zip.file('resumen-y-bitacora.pdf', await summaryPdf(data))
    for (const document of data.documents) for (const version of document.versions) {
      if (!version.url) continue
      const response = await fetch(version.url)
      if (!response.ok) throw new Error(`No se pudo recuperar ${version.nombreArchivo}`)
      zip.file(`${document.categoria}/v${version.version}-${safeName(version.nombreArchivo)}`, await response.arrayBuffer())
    }
    zip.file('referencias-verificacion.json', JSON.stringify(data.verifications, null, 2))
    const body = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
    return new Response(body, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${safeName(data.caso.codigo)}-expediente.zip"`, 'Cache-Control': 'private, no-store' } })
  } catch {
    return Response.json({ error: 'not_found_or_forbidden' }, { status: 404 })
  }
}
