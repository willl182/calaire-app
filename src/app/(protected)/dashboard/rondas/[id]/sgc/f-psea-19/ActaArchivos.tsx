'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { generarDocxF19Action, registrarPdfFirmadoF19Action, solicitarUploadF19Action } from './actions'

export default function ActaArchivos({ rondaId, actaId, docxUrl, pdfUrl }: { rondaId: string; actaId: string; docxUrl?: string | null; pdfUrl?: string | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const generate = () => startTransition(async () => {
    setError('')
    try { await generarDocxF19Action(rondaId); router.refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible generar DOCX.') }
  })
  const upload = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      if (file.type !== 'application/pdf') throw new Error('Seleccione PDF firmado.')
      const uploadUrl = await solicitarUploadF19Action()
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
      if (!response.ok) throw new Error('No fue posible subir PDF firmado.')
      const { storageId } = await response.json() as { storageId: string }
      await registrarPdfFirmadoF19Action(rondaId, { actaId, storageId, fileName: file.name, contentType: file.type, size: file.size })
      router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible subir PDF firmado.') }
    finally { setUploading(false) }
  }
  return <section className="card grid gap-4 p-6"><h2 className="font-semibold">Archivos del acta</h2>{error && <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">{error}</p>}<div className="flex flex-wrap gap-3"><button className="btn-primary" type="button" disabled={pending} onClick={generate}>{pending ? 'Generando…' : 'Generar DOCX para firma'}</button>{docxUrl && <a className="btn-outline" href={docxUrl}>Descargar DOCX</a>}</div><label className="grid gap-2 text-sm font-medium">PDF firmado y escaneado<input type="file" accept="application/pdf,.pdf" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} /></label>{pdfUrl && <a className="btn-outline justify-self-start" href={pdfUrl}>Descargar PDF firmado</a>}<p className="text-xs text-[var(--foreground-muted)]">Carga directa a Convex Storage. Reemplazar PDF despublica acta hasta nueva revisión.</p></section>
}
