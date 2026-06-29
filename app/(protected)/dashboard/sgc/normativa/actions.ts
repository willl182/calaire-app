'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canEditSgcMaestro, requireAuth } from '@/lib/auth'
import { upsertDocumentoRequisito, type DocumentoRequisito } from '@/lib/sgc'

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

async function requireSgcEditor() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!canEditSgcMaestro(auth)) redirect('/denied?reason=role')
}

function parseTipoCobertura(value: string): DocumentoRequisito['tipoCobertura'] {
  if (value === 'cubre' || value === 'apoya' || value === 'evidencia' || value === 'no_aplica_justificado') return value
  return 'cubre'
}

function parseEstadoCobertura(value: string): DocumentoRequisito['estadoCobertura'] {
  if (value === 'cubierto' || value === 'parcial' || value === 'pendiente' || value === 'no_aplica') return value
  return 'pendiente'
}

export async function relacionarDocumentoRequisitoAction(formData: FormData) {
  await requireSgcEditor()
  try {
    const documentoId = parseText(formData, 'documento_id')
    const requisitoId = parseText(formData, 'requisito_id')
    if (!documentoId || !requisitoId) throw new Error('Selecciona documento y requisito.')
    await upsertDocumentoRequisito({
      documentoId,
      requisitoId,
      tipoCobertura: parseTipoCobertura(parseText(formData, 'tipo_cobertura')),
      estadoCobertura: parseEstadoCobertura(parseText(formData, 'estado_cobertura')),
      responsable: parseText(formData, 'responsable') || null,
      observacion: parseText(formData, 'observacion') || null,
      fechaRevision: parseText(formData, 'fecha_revision') || null,
    })
    revalidatePath('/dashboard/sgc/normativa')
    redirect('/dashboard/sgc/normativa?success=Relacion%20documento-requisito%20guardada')
  } catch (error) {
    redirect(`/dashboard/sgc/normativa?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible guardar la relacion.')}`)
  }
}
