'use server'

import { signOut } from '@workos-inc/authkit-nextjs'

import { buildAbsoluteAppUrl } from '@/lib/app-url'
import { requireAuth, isAdmin } from '@/server/auth'
import { getRondaByCodigo, getRondaParticipantePT, isInvitado } from '@/server/rondas'
import {
  getOrCreateFicha,
  getFichaByRondaParticipante,
  upsertFichaScalars,
  replaceAcompanantes,
  replaceAnalizadores,
  replaceInstrumentos,
  submitFicha,
  generateFichaUploadUrl,
  FICHA_SCALAR_ALLOWLIST,
  type FichaScalarField,
  type AcompananteInput,
  type AnalizadorInput,
  type InstrumentoInput,
} from '@/server/rondas/fichas'

const MAX_ACOMPANANTE_PDF_SIZE = 10 * 1024 * 1024
const RONDA_NO_ACTIVA_ERROR = 'La ronda no está activa y no admite edición'

function assertRondaActiva(estado: string) {
  if (estado !== 'activa') return { error: RONDA_NO_ACTIVA_ERROR }
  return null
}

async function uploadAcompanantePdf(file: File) {
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('El archivo de seguridad social y ARL debe ser PDF.')
  }
  if (file.size > MAX_ACOMPANANTE_PDF_SIZE) {
    throw new Error('El archivo de seguridad social y ARL no puede superar 10 MB.')
  }

  const uploadUrl = await generateFichaUploadUrl()
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/pdf' },
    body: file,
  })
  if (!response.ok) throw new Error('No fue posible subir el PDF de seguridad social y ARL.')
  const uploaded = await response.json()
  return {
    storageId: uploaded.storageId as string,
    fileName: file.name,
    contentType: file.type || 'application/pdf',
    size: file.size,
  }
}

async function resolveRondaParticipante(codigoRonda: string) {
  const auth = await requireAuth()
  if (!auth.user) return { error: 'No autenticado' as const }

  const ronda = await getRondaByCodigo(codigoRonda)
  if (!ronda) return { error: 'Ronda no encontrada' as const }

  const invitado = await isInvitado(ronda.id)
  if (!invitado && !isAdmin(auth)) return { error: 'No autorizado' as const }

  const rp = await getRondaParticipantePT(ronda.id)
  if (!rp) return { error: 'Participante no encontrado' as const }

  return { auth, ronda, rp }
}

export async function guardarCampoFichaAction(
  codigoRonda: string,
  field: string,
  value: string | boolean | null
): Promise<{ ok?: boolean; error?: string }> {
  const result = await resolveRondaParticipante(codigoRonda)
  if ('error' in result) return { error: result.error }

  if (!(FICHA_SCALAR_ALLOWLIST as readonly string[]).includes(field)) {
    return { error: 'Campo no permitido' }
  }

  const estadoError = assertRondaActiva(result.ronda.estado)
  if (estadoError) return estadoError

  const ficha = await getOrCreateFicha(result.rp.id)
  await upsertFichaScalars(ficha.id, field as FichaScalarField, value)
  return { ok: true }
}

export async function guardarListasAction(
  codigoRonda: string,
  acompanantes: AcompananteInput[],
  analizadores: AnalizadorInput[],
  instrumentos: InstrumentoInput[]
): Promise<{ ok?: boolean; error?: string }> {
  const result = await resolveRondaParticipante(codigoRonda)
  if ('error' in result) return { error: result.error }

  const estadoError = assertRondaActiva(result.ronda.estado)
  if (estadoError) return estadoError

  const ficha = await getOrCreateFicha(result.rp.id)

  await Promise.all([
    replaceAcompanantes(ficha.id, acompanantes),
    replaceAnalizadores(ficha.id, analizadores),
    replaceInstrumentos(ficha.id, instrumentos),
  ])

  return { ok: true }
}

export async function cargarPdfAcompananteAction(
  codigoRonda: string,
  formData: FormData
): Promise<{
  ok?: boolean
  error?: string
  archivo?: { storageId: string; fileName: string; contentType: string; size: number }
}> {
  const result = await resolveRondaParticipante(codigoRonda)
  if ('error' in result) return { error: result.error }

  const estadoError = assertRondaActiva(result.ronda.estado)
  if (estadoError) return estadoError

  const file = formData.get('archivo')
  if (!(file instanceof File) || file.size === 0) return { error: 'Seleccione un PDF.' }

  try {
    return { ok: true, archivo: await uploadAcompanantePdf(file) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible subir el PDF.' }
  }
}

export async function enviarFichaFinalAction(
  codigoRonda: string
): Promise<{ ok?: boolean; error?: string; errores?: string[] }> {
  const result = await resolveRondaParticipante(codigoRonda)
  if ('error' in result) return { error: result.error }

  const estadoError = assertRondaActiva(result.ronda.estado)
  if (estadoError) return { error: 'La ronda no está activa y no admite envíos' }

  const ficha = await getFichaByRondaParticipante(result.rp.id)
  if (!ficha) return { error: 'No existe la ficha de registro' }
  if (ficha.estado !== 'borrador') return { error: 'La ficha ya fue enviada' }

  const errores: string[] = []
  if (!ficha.nombre_laboratorio?.trim()) errores.push('Nombre del laboratorio es requerido')
  if (!ficha.nombre_responsable?.trim()) errores.push('Nombre del responsable es requerido')
  if (!ficha.cargo?.trim()) errores.push('Cargo es requerido')
  if (!ficha.ciudad?.trim()) errores.push('Ciudad es requerida')
  if (!ficha.dec_datos_correctos) errores.push('Debe confirmar que los datos son correctos')
  if (!ficha.dec_acepta_condiciones) errores.push('Debe aceptar las condiciones de participación')
  if (!ficha.dec_compromisos) errores.push('Debe aceptar los compromisos del participante')
  if (!ficha.dec_procedimientos_calaire) errores.push('Debe confirmar que seguirá los procedimientos internos de Calaire')
  if (!ficha.dec_firma_autorizada) errores.push('Debe confirmar que el responsable está autorizado por la dirección del laboratorio')
  if (!ficha.nombre_firma?.trim()) errores.push('Nombre del responsable autorizado es requerido')

  if (errores.length > 0) return { errores }

  await submitFicha(ficha.id)
  return { ok: true }
}

export async function cerrarSesionParticipanteAction() {
  await signOut({ returnTo: buildAbsoluteAppUrl('/login') })
}
