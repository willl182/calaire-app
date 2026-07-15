'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/server/auth'
import { importPtScoreDraft, previewPtScoreImport, publishPtResults, uploadPtGeneralReport } from '@/server/rondas'
import { parsePtScoresCsv } from '@/server/rondas/pt-scores-csv'

async function admin() { const auth = await requireAuth(); if (!isAdmin(auth)) redirect('/denied?reason=role') }
function url(id: string, key: 'error' | 'success', message: string) { return `/dashboard/rondas/${id}/resultados?${key}=${encodeURIComponent(message)}` }

export async function importPtScoresAction(formData: FormData) {
  await admin()
  const rondaId = String(formData.get('ronda_id') ?? '')
  try {
    const file = formData.get('csv')
    if (!(file instanceof File) || file.size === 0) throw new Error('Seleccione un CSV.')
    if (file.size > 5 * 1024 * 1024) throw new Error('El CSV excede 5 MB.')
    const parsed = parsePtScoresCsv(await file.text())
    if (parsed.errors.length) throw new Error(parsed.errors.slice(0, 5).map((error) => `Fila ${error.fila}, ${error.campo}: ${error.mensaje}`).join(' | '))
    const preview = await previewPtScoreImport(rondaId, parsed.rows)
    if (preview.errores.length) throw new Error(preview.errores.slice(0, 5).map((error) => `Fila ${error.fila}, ${error.campo}: ${error.mensaje}`).join(' | '))
    await importPtScoreDraft(rondaId, parsed.rows)
    revalidatePath(`/dashboard/rondas/${rondaId}/resultados`)
    redirect(url(rondaId, 'success', `${parsed.rows.length} puntajes importados como borrador.`))
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    redirect(url(rondaId, 'error', error instanceof Error ? error.message : 'No se pudo importar el CSV.'))
  }
}

export async function uploadPtReportAction(formData: FormData) {
  await admin()
  const rondaId = String(formData.get('ronda_id') ?? '')
  try {
    const file = formData.get('informe')
    if (!(file instanceof File) || file.size === 0) throw new Error('Seleccione el informe PDF.')
    if (file.type !== 'application/pdf') throw new Error('El informe debe ser PDF.')
    await uploadPtGeneralReport(rondaId, file)
    revalidatePath(`/dashboard/rondas/${rondaId}/resultados`)
    redirect(url(rondaId, 'success', 'Informe general registrado.'))
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    redirect(url(rondaId, 'error', error instanceof Error ? error.message : 'No se pudo subir el informe.'))
  }
}

export async function publishPtResultsAction(formData: FormData) {
  await admin()
  const rondaId = String(formData.get('ronda_id') ?? '')
  try {
    if (formData.get('confirmacion') !== 'PUBLICAR') throw new Error('Escriba PUBLICAR para confirmar la operación irreversible.')
    await publishPtResults(rondaId)
    revalidatePath(`/dashboard/rondas/${rondaId}/resultados`)
    redirect(url(rondaId, 'success', 'Resultados publicados de forma irreversible.'))
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    redirect(url(rondaId, 'error', error instanceof Error ? error.message : 'No se pudo publicar.'))
  }
}
