'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { SgcDriveRecurso } from '@/server/sgc'
import { marcarUsoF20Action, registrarDefinitivoF20Action, solicitarUploadDriveAction } from './actions'

export default function F20Control({ rondaId, recurso }: { rondaId: string; recurso: SgcDriveRecurso }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const run = (task: () => Promise<unknown>) => startTransition(async () => {
    setError('')
    try { await task(); router.refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Operación fallida.') }
  })
  const upload = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      if (!file.size) throw new Error('Archivo vacío.')
      const uploadUrl = await solicitarUploadDriveAction()
      const contentType = file.type || 'application/octet-stream'
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': contentType }, body: file })
      if (!response.ok) throw new Error('No fue posible subir archivo.')
      const { storageId } = await response.json() as { storageId: string }
      await registrarDefinitivoF20Action({ rondaId, recursoId: recurso._id, parentId: recurso.parentId, codigo: recurso.codigo, nombre: recurso.nombre, fase: recurso.fase, tipo: recurso.tipo, formatoRelacionado: recurso.formatoRelacionado, webUrl: recurso.webUrl, templateUrl: recurso.templateUrl, notas: recurso.notas, storageId, fileName: file.name, contentType, size: file.size })
      router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible subir archivo.') }
    finally { setUploading(false) }
  }
  const hasFile = Boolean(recurso.definitivo && 'storageId' in recurso.definitivo)
  return <section className="rounded-lg border border-amber-200 bg-amber-50 p-3"><div className="text-xs font-semibold uppercase tracking-wide text-amber-900">Control F-PSEA-20 · siempre interno</div>{error && <p className="mt-2 text-xs text-red-800" role="alert">{error}</p>}<label className="mt-3 grid gap-2 text-xs font-semibold">Archivo de rotulado anónimo<input type="file" disabled={uploading || pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} /></label><div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" className="btn-outline px-3 py-1 text-xs" disabled={!hasFile || pending} onClick={() => run(() => marcarUsoF20Action(rondaId, recurso._id, !recurso.usadoEnRonda))}>{recurso.usadoEnRonda ? 'Retirar confirmación de uso' : 'Confirmar usado en ronda'}</button><span className="text-xs text-amber-900">{recurso.usadoEnRonda ? 'Uso confirmado' : 'Uso no confirmado'}</span></div><p className="mt-2 text-xs text-amber-800">Reemplazar archivo reinicia confirmación. Documento nunca puede publicarse.</p></section>
}
