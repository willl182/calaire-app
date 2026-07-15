'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addPtCaseDocument, addPtCaseMessage, createPtCase, generatePtCaseUploadUrl, submitPtCase } from '@/server/rondas'

function text(data: FormData, key: string) { return String(data.get(key) ?? '').trim() }

export async function createCaseAction(codigo: string, rondaId: string, data: FormData) {
  const tipo = text(data, 'tipo')
  if (!['consulta', 'queja', 'apelacion'].includes(tipo)) throw new Error('Tipo de caso inválido.')
  const id = await createPtCase({ rondaId, tipo: tipo as 'consulta' | 'queja' | 'apelacion', titulo: text(data, 'titulo'), descripcion: text(data, 'descripcion') })
  redirect(`/ronda/${codigo}/casos/${id}`)
}

export async function uploadCaseDocumentAction(codigo: string, casoId: string, data: FormData) {
  const file = data.get('archivo')
  const categoria = text(data, 'categoria')
  if (!(file instanceof File) || !file.size) throw new Error('Seleccione un archivo.')
  if (file.size > 15 * 1024 * 1024) throw new Error('El archivo supera el límite de 15 MB.')
  const allowedTypes = new Set([
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ])
  if (!allowedTypes.has(file.type)) throw new Error('Solo se admiten PDF, imágenes, CSV y hojas de cálculo.')
  if (!['analisis_causa', 'plan_accion', 'implementacion', 'verificacion_eficacia'].includes(categoria)) throw new Error('Categoría inválida.')
  const uploadUrl = await generatePtCaseUploadUrl(casoId)
  const uploaded = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
  if (!uploaded.ok) throw new Error('No fue posible cargar el archivo.')
  const { storageId } = await uploaded.json() as { storageId: string }
  await addPtCaseDocument({ casoId, categoria: categoria as 'analisis_causa' | 'plan_accion' | 'implementacion' | 'verificacion_eficacia', storageId, nombreArchivo: file.name, contentType: file.type })
  revalidatePath(`/ronda/${codigo}/casos/${casoId}`)
}

export async function submitCaseAction(codigo: string, casoId: string) {
  await submitPtCase(casoId)
  revalidatePath(`/ronda/${codigo}/casos/${casoId}`)
}

export async function messageCaseAction(codigo: string, casoId: string, data: FormData) {
  await addPtCaseMessage(casoId, text(data, 'texto'))
  revalidatePath(`/ronda/${codigo}/casos/${casoId}`)
}
