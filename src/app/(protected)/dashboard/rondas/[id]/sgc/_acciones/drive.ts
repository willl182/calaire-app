'use server'

// Acciones de recursos Drive del expediente (incluye F-PSEA-20).
import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { automatizarDriveRondaSgc } from '@/server/sgc/drive-google'
import {
  actualizarEstadoDriveRecurso,
  actualizarVisibilidadDriveRecurso,
  generateSgcUploadUrl,
  inicializarDriveRonda,
  marcarDriveRecursoUsado,
  reemplazarDriveRecurso,
  retirarDriveRecurso,
  upsertDriveRecurso,
  type SgcDriveTipo,
} from '@/server/sgc'
import { pageUrl, parseDriveEstado, parseDriveTipo, parseText, redirectWith, requireAdmin } from './comunes'

export async function inicializarDriveRondaAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    const result = await inicializarDriveRonda(rondaId)
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', `Expediente inicializado: ${result.creados} documentos y carpetas creados, ${result.reutilizados} reutilizados, ${result.reparados} reparados.`)
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible inicializar el expediente.')
  }
}

export async function crearDriveGoogleAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const rondaCodigo = parseText(formData, 'ronda_codigo')
  const rondaNombre = parseText(formData, 'ronda_nombre')
  try {
    const result = await automatizarDriveRondaSgc(rondaId, rondaCodigo, rondaNombre || null)
    revalidatePath(pageUrl(rondaId))
    const fallos = result.fallidos.length > 0 ? `, ${result.fallidos.length} fallidos` : ''
    redirectWith(
      rondaId,
      result.fallidos.length > 0 ? 'error' : 'success',
      `Google Drive: ${result.rootCreado ? 'raiz creada' : 'raiz reutilizada'}, ${result.carpetasCreadas} carpetas nuevas, ${result.carpetasReutilizadas} reutilizadas, ${result.documentosCopiados} copias, ${result.documentosReutilizados} documentos omitidos por enlace existente/estado, ${result.pendientesSinPlantilla} sin plantilla${fallos}.`
    )
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible crear el expediente en Google Drive.')
  }
}

export async function guardarDriveEditableAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const recursoId = parseText(formData, 'recurso_id')
  try {
    await upsertDriveRecurso({
      recursoId: recursoId || null,
      rondaId,
      parentId: parseText(formData, 'parent_id') || null,
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      fase: parseText(formData, 'fase') || null,
      tipo: parseDriveTipo(parseText(formData, 'tipo')),
      formatoRelacionado: parseText(formData, 'formato_relacionado') || null,
      webUrl: parseText(formData, 'web_url') || null,
      templateUrl: parseText(formData, 'template_url') || null,
      notas: parseText(formData, 'notas') || null,
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Enlace editable Drive actualizado.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible actualizar el enlace Drive.')
  }
}

export async function reemplazarDriveRecursoAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await reemplazarDriveRecurso({
      recursoId: parseText(formData, 'recurso_id'),
      webUrl: parseText(formData, 'web_url'),
      motivo: parseText(formData, 'motivo'),
      tipo: parseDriveTipo(parseText(formData, 'tipo')),
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Enlace Drive reemplazado con trazabilidad.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible reemplazar el enlace Drive.')
  }
}

export async function guardarDriveDefinitivoAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const recursoId = parseText(formData, 'recurso_id')
  try {
    const definitivoUrl = parseText(formData, 'definitivo_url')
    if (!definitivoUrl) throw new Error('La URL definitiva es obligatoria.')
    await upsertDriveRecurso({
      recursoId: recursoId || null,
      rondaId,
      parentId: parseText(formData, 'parent_id') || null,
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      fase: parseText(formData, 'fase') || null,
      tipo: parseDriveTipo(parseText(formData, 'tipo')),
      formatoRelacionado: parseText(formData, 'formato_relacionado') || null,
      webUrl: parseText(formData, 'web_url') || null,
      templateUrl: parseText(formData, 'template_url') || null,
      notas: parseText(formData, 'notas') || null,
      definitivo: {
        webUrl: definitivoUrl,
        tipo: parseText(formData, 'definitivo_tipo') || 'pdf',
      },
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Version definitiva Drive registrada.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible registrar la version definitiva.')
  }
}

export async function subirDriveDefinitivoAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  const recursoId = parseText(formData, 'recurso_id')
  try {
    const file = formData.get('archivo')
    if (!(file instanceof File) || file.size === 0) throw new Error('Seleccione un archivo para cargar.')
    const uploadUrl = await generateSgcUploadUrl()
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!response.ok) throw new Error('No fue posible subir el archivo.')
    const { storageId } = await response.json()
    await upsertDriveRecurso({
      recursoId: recursoId || null,
      rondaId,
      parentId: parseText(formData, 'parent_id') || null,
      codigo: parseText(formData, 'codigo'),
      nombre: parseText(formData, 'nombre'),
      fase: parseText(formData, 'fase') || null,
      tipo: parseDriveTipo(parseText(formData, 'tipo')),
      formatoRelacionado: parseText(formData, 'formato_relacionado') || null,
      webUrl: parseText(formData, 'web_url') || null,
      templateUrl: parseText(formData, 'template_url') || null,
      notas: parseText(formData, 'notas') || null,
      definitivo: {
        storageId,
        fileName: file.name,
        contentType: file.type || null,
        size: file.size,
        tipo: parseText(formData, 'definitivo_tipo') || 'archivo',
      },
    })
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Documento definitivo cargado para el participante.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible cargar el documento definitivo.')
  }
}

export async function cambiarEstadoDriveAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await actualizarEstadoDriveRecurso(
      parseText(formData, 'recurso_id'),
      parseDriveEstado(parseText(formData, 'estado')),
      parseText(formData, 'notas') || null
    )
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Estado del recurso Drive actualizado.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible cambiar el estado Drive.')
  }
}

export async function cambiarVisibilidadDriveAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await actualizarVisibilidadDriveRecurso(
      parseText(formData, 'recurso_id'),
      parseText(formData, 'publica_participante') === 'true'
    )
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Visibilidad participante del recurso Drive actualizada.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible actualizar la visibilidad Drive.')
  }
}

export async function retirarDriveRecursoAction(formData: FormData) {
  await requireAdmin()
  const rondaId = parseText(formData, 'ronda_id')
  try {
    await retirarDriveRecurso(parseText(formData, 'recurso_id'), parseText(formData, 'motivo'))
    revalidatePath(pageUrl(rondaId))
    redirectWith(rondaId, 'success', 'Recurso Drive retirado.')
  } catch (error) {
    unstable_rethrow(error)
    redirectWith(rondaId, 'error', error instanceof Error ? error.message : 'No fue posible retirar el recurso Drive.')
  }
}

export async function solicitarUploadDriveAction() {
  await requireAdmin()
  return generateSgcUploadUrl()
}

export async function registrarDefinitivoF20Action(args: {
  rondaId: string
  recursoId: string
  parentId?: string | null
  codigo: string
  nombre: string
  fase?: string | null
  tipo: SgcDriveTipo
  formatoRelacionado?: string | null
  webUrl?: string | null
  templateUrl?: string | null
  notas?: string | null
  storageId: string
  fileName: string
  contentType: string
  size: number
}) {
  await requireAdmin()
  if (args.codigo !== 'F-PSEA-20') throw new Error('Carga especializada disponible solo para F-PSEA-20.')
  await upsertDriveRecurso({
    recursoId: args.recursoId,
    rondaId: args.rondaId,
    parentId: args.parentId,
    codigo: args.codigo,
    nombre: args.nombre,
    fase: args.fase,
    tipo: args.tipo,
    formatoRelacionado: args.formatoRelacionado,
    webUrl: args.webUrl,
    templateUrl: args.templateUrl,
    notas: args.notas,
    definitivo: { storageId: args.storageId, fileName: args.fileName, contentType: args.contentType, size: args.size, tipo: 'archivo' },
  })
  revalidatePath(pageUrl(args.rondaId))
}

export async function marcarUsoF20Action(rondaId: string, recursoId: string, usado: boolean) {
  await requireAdmin()
  await marcarDriveRecursoUsado(recursoId, usado)
  revalidatePath(pageUrl(rondaId))
}
