'use server'

import { requireAdminAuth } from '@/lib/auth'
import {
  replaceAcompanantes,
  replaceAnalizadores,
  replaceInstrumentos,
  FICHA_SCALAR_ALLOWLIST,
  type FichaScalarField,
  type AcompananteInput,
  type AnalizadorInput,
  type InstrumentoInput,
} from '@/lib/fichas'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function adminGuardarCampoFichaAction(
  fichaId: string,
  field: string,
  value: string | boolean | null
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdminAuth()

  if (!(FICHA_SCALAR_ALLOWLIST as readonly string[]).includes(field)) {
    return { error: 'Campo no permitido' }
  }

  const { error } = await getSupabaseAdmin()
    .from('fichas_registro')
    .update({ [field as FichaScalarField]: value })
    .eq('id', fichaId)

  if (error) return { error: `No fue posible guardar el campo: ${error.message}` }
  return { ok: true }
}

export async function adminGuardarListasAction(
  fichaId: string,
  acompanantes: AcompananteInput[],
  analizadores: AnalizadorInput[],
  instrumentos: InstrumentoInput[]
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdminAuth()

  try {
    await Promise.all([
      replaceAcompanantes(fichaId, acompanantes),
      replaceAnalizadores(fichaId, analizadores),
      replaceInstrumentos(fichaId, instrumentos),
    ])
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar listas' }
  }
}
