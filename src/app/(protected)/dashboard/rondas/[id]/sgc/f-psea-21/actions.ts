'use server'

import { revalidatePath } from 'next/cache'
import { canEditSgcMaestro, isAdmin, requireAuth } from '@/server/auth'
import {
  actualizarInstrumentoRonda,
  crearInstrumentoRonda,
  devolverRelacionInstrumentos,
  eliminarInstrumentoRonda,
  enviarRelacionInstrumentosAValidacion,
  generateSgcUploadUrl,
  getPanelSgc,
  getRelacionInstrumentosRonda,
  registrarExportacionInstrumentos,
  registrarFotoInstrumentoRonda,
  retirarFotoInstrumentoRonda,
  validarRelacionInstrumentos,
} from '@/server/sgc'
import { crearInstrumentosPdf, crearInstrumentosXlsx } from '@/server/sgc/exports'

const path = (rondaId: string) => `/dashboard/rondas/${rondaId}/sgc/f-psea-21`

async function requireEditor() {
  const auth = await requireAuth()
  if (!canEditSgcMaestro(auth)) throw new Error('Rol sin permiso para editar F-PSEA-21.')
}

async function requireCoordinator() {
  const auth = await requireAuth()
  if (!isAdmin(auth)) throw new Error('Solo coordinacion puede validar F-PSEA-21.')
}

function campos(formData: FormData) {
  const tipo = String(formData.get('tipo') ?? '') as 'analizador' | 'aire_cero' | 'calibrador_dinamico' | 'cilindro' | 'otro'
  if (!['analizador', 'aire_cero', 'calibrador_dinamico', 'cilindro', 'otro'].includes(tipo)) throw new Error('Tipo de instrumento invalido.')
  return {
    tipo,
    codigoInterno: String(formData.get('codigo_interno') ?? ''),
    marca: String(formData.get('marca') ?? ''),
    modelo: String(formData.get('modelo') ?? ''),
    serialIdentificacion: String(formData.get('serial_identificacion') ?? ''),
    observaciones: String(formData.get('observaciones') ?? ''),
  }
}

export async function guardarInstrumentoAction(rondaId: string, formData: FormData) {
  await requireEditor()
  const itemId = String(formData.get('item_id') ?? '')
  const relacionId = String(formData.get('relacion_id') ?? '')
  if (itemId) await actualizarInstrumentoRonda(itemId, campos(formData))
  else await crearInstrumentoRonda(relacionId, campos(formData))
  revalidatePath(path(rondaId))
}

export async function eliminarInstrumentoAction(rondaId: string, itemId: string) {
  await requireEditor()
  await eliminarInstrumentoRonda(itemId)
  revalidatePath(path(rondaId))
}

export async function solicitarUploadF21Action() {
  await requireEditor()
  return generateSgcUploadUrl()
}

export async function registrarFotoF21Action(rondaId: string, args: { itemId: string; tipoFoto: 'general' | 'placa_serial'; storageId: string; fileName: string; contentType: string; size: number }) {
  await requireEditor()
  await registrarFotoInstrumentoRonda(args)
  revalidatePath(path(rondaId))
}

export async function retirarFotoF21Action(rondaId: string, itemId: string, tipoFoto: 'general' | 'placa_serial') {
  await requireEditor()
  await retirarFotoInstrumentoRonda(itemId, tipoFoto)
  revalidatePath(path(rondaId))
}

export async function enviarValidacionF21Action(rondaId: string, relacionId: string, tecnicoNombre: string) {
  await requireEditor()
  await enviarRelacionInstrumentosAValidacion(relacionId, tecnicoNombre)
  revalidatePath(path(rondaId))
}

export async function validarF21Action(rondaId: string, relacionId: string, coordinadorNombre: string) {
  await requireCoordinator()
  await validarRelacionInstrumentos(relacionId, coordinadorNombre)
  revalidatePath(path(rondaId))
}

export async function devolverF21Action(rondaId: string, relacionId: string, observacion: string) {
  await requireCoordinator()
  await devolverRelacionInstrumentos(relacionId, observacion)
  revalidatePath(path(rondaId))
}

export async function generarExportacionesF21Action(rondaId: string) {
  await requireEditor()
  const [relacion, panel] = await Promise.all([getRelacionInstrumentosRonda(rondaId), getPanelSgc(rondaId)])
  if (!relacion || !panel) throw new Error('Relacion o ronda no disponible.')
  if (relacion.estado !== 'validado') throw new Error('Valide la relacion antes de exportar.')
  const data = {
    rondaCodigo: panel.ronda.codigo,
    rondaNombre: panel.ronda.nombre,
    revision: relacion.revision,
    tecnicoNombre: relacion.tecnicoNombre,
    coordinadorNombre: relacion.coordinadorNombre,
    items: relacion.items,
  }
  const outputs = [
    { tipo: 'pdf' as const, bytes: await crearInstrumentosPdf(data), contentType: 'application/pdf', fileName: `F-PSEA-21_${panel.ronda.codigo}_rev${relacion.revision}.pdf` },
    { tipo: 'xlsx' as const, bytes: await crearInstrumentosXlsx(data.items), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName: `F-PSEA-21_${panel.ronda.codigo}_rev${relacion.revision}.xlsx` },
  ]
  for (const output of outputs) {
    const uploadUrl = await generateSgcUploadUrl()
    const body = new ArrayBuffer(output.bytes.byteLength)
    new Uint8Array(body).set(output.bytes)
    const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': output.contentType }, body })
    if (!response.ok) throw new Error(`No fue posible almacenar ${output.tipo.toUpperCase()}.`)
    const { storageId } = await response.json() as { storageId: string }
    await registrarExportacionInstrumentos({ relacionId: relacion._id, tipo: output.tipo, storageId, fileName: output.fileName, contentType: output.contentType, size: output.bytes.byteLength, revision: relacion.revision })
  }
  revalidatePath(path(rondaId))
}
