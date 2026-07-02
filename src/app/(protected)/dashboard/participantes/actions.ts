'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { isAdmin, requireAuth } from '@/server/auth'
import { upsertDirectorioParticipante } from '@/server/rondas'

function parseText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function upsertDirectorioParticipanteAction(formData: FormData) {
  const auth = await requireAuth()
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const nit = parseText(formData, 'nit')
  const correo = normalizeEmail(parseText(formData, 'correo'))
  const nombreLaboratorio = parseText(formData, 'nombre_laboratorio') || null
  const nombreResponsable = parseText(formData, 'nombre_responsable') || null
  const cargo = parseText(formData, 'cargo') || null
  const ciudad = parseText(formData, 'ciudad') || null
  const departamento = parseText(formData, 'departamento') || null
  const telefono = parseText(formData, 'telefono') || null
  const workosUserId = parseText(formData, 'workos_user_id') || null

  if (!nit || !correo) {
    redirect('/dashboard?tab=participantes&error=' + encodeURIComponent('NIT y correo son obligatorios.'))
  }

  await upsertDirectorioParticipante({
    nit,
    correo,
    nombreLaboratorio,
    nombreResponsable,
    cargo,
    ciudad,
    departamento,
    telefono,
    workosUserId,
  })

  revalidatePath('/dashboard')
  redirect('/dashboard?tab=participantes&success=' + encodeURIComponent('Directorio actualizado correctamente.'))
}
