'use server'

import { revalidatePath } from 'next/cache'
import { canEditSgcMaestro, requireAuth } from '@/server/auth'
import { generateSgcUploadUrl, getActaInicio, getPanelSgc, registrarArchivoActaInicio } from '@/server/sgc'
import { crearActaInicioDocx } from '@/server/sgc/exports'

const path = (rondaId: string) => `/dashboard/rondas/${rondaId}/sgc/f-psea-19`

async function requireEditor() {
  const auth = await requireAuth()
  if (!canEditSgcMaestro(auth)) throw new Error('Rol sin permiso para editar F-PSEA-19.')
}

export async function solicitarUploadF19Action() {
  await requireEditor()
  return generateSgcUploadUrl()
}

export async function registrarPdfFirmadoF19Action(rondaId: string, args: { actaId: string; storageId: string; fileName: string; contentType: string; size: number }) {
  await requireEditor()
  await registrarArchivoActaInicio({ ...args, tipo: 'pdf' })
  revalidatePath(path(rondaId))
}

export async function generarDocxF19Action(rondaId: string) {
  await requireEditor()
  const [acta, panel] = await Promise.all([getActaInicio(rondaId), getPanelSgc(rondaId)])
  if (!acta || !panel) throw new Error('Acta o ronda no disponible.')
  const bytes = await crearActaInicioDocx({
    rondaCodigo: panel.ronda.codigo,
    rondaNombre: panel.ronda.nombre,
    fecha: acta.fecha,
    lugar: acta.lugar,
    textoInicio: acta.textoInicio,
    firmantes: acta.firmantes,
  })
  const contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const fileName = `F-PSEA-19_${panel.ronda.codigo}.docx`
  const uploadUrl = await generateSgcUploadUrl()
  const body = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(body).set(bytes)
  const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': contentType }, body })
  if (!response.ok) throw new Error('No fue posible almacenar DOCX.')
  const { storageId } = await response.json() as { storageId: string }
  await registrarArchivoActaInicio({ actaId: acta._id, storageId, fileName, contentType, size: bytes.byteLength, tipo: 'docx' })
  revalidatePath(path(rondaId))
}
