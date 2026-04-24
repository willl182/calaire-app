import { getSupabaseAdmin } from '@/lib/supabase'

export type EstadoFicha = 'borrador' | 'enviado'

export type FichaRegistro = {
  id: string
  ronda_participante_id: string
  nombre_laboratorio: string | null
  nombre_responsable: string | null
  cargo: string | null
  ciudad: string | null
  departamento: string | null
  telefono: string | null
  transporte: string | null
  hora_llegada: string | null
  estacionamiento: boolean
  observaciones: string | null
  dec_datos_correctos: boolean
  dec_acepta_condiciones: boolean
  dec_compromisos: boolean
  dec_firma_autorizada: boolean
  nombre_firma: string | null
  estado: EstadoFicha
  created_at: string
  updated_at: string
}

export type Acompanante = {
  id: string
  ficha_id: string
  sort_order: number
  nombre_completo: string
  documento_identidad: string
  rol: string
}

export type Analizador = {
  id: string
  ficha_id: string
  sort_order: number
  analito: string
  fabricante: string
  modelo: string
  numero_serie: string
  metodo_epa: string
  fecha_ultima_calibracion: string | null
  tipo_verificacion: string
  incertidumbre_declarada: string
  unidad_salida: string
}

export type Instrumento = {
  id: string
  ficha_id: string
  sort_order: number
  equipo: string
  marca_modelo: string
  numero_serie: string
  cantidad: number
}

export type FichaCompleta = FichaRegistro & {
  acompanantes: Acompanante[]
  analizadores: Analizador[]
  instrumentos: Instrumento[]
}

export type FichaResumen = {
  id: string
  ronda_participante_id: string
  estado: EstadoFicha
}

export type AcompananteInput = Omit<Acompanante, 'id' | 'ficha_id'>
export type AnalizadorInput = Omit<Analizador, 'id' | 'ficha_id'>
export type InstrumentoInput = Omit<Instrumento, 'id' | 'ficha_id'>

export const FICHA_SCALAR_ALLOWLIST = [
  'nombre_laboratorio',
  'nombre_responsable',
  'cargo',
  'ciudad',
  'departamento',
  'telefono',
  'transporte',
  'hora_llegada',
  'estacionamiento',
  'observaciones',
  'dec_datos_correctos',
  'dec_acepta_condiciones',
  'dec_compromisos',
  'dec_firma_autorizada',
  'nombre_firma',
] as const

export type FichaScalarField = (typeof FICHA_SCALAR_ALLOWLIST)[number]

export async function getOrCreateFicha(rondaParticipanteId: string): Promise<FichaRegistro> {
  const admin = getSupabaseAdmin()

  const { data: existing } = await admin
    .from('fichas_registro')
    .select('*')
    .eq('ronda_participante_id', rondaParticipanteId)
    .maybeSingle()

  if (existing) return existing as FichaRegistro

  const { data, error } = await admin
    .from('fichas_registro')
    .insert({ ronda_participante_id: rondaParticipanteId })
    .select()
    .single()

  if (error) throw new Error(`No fue posible crear la ficha de registro: ${error.message}`)
  return data as FichaRegistro
}

export async function getFichaByRondaParticipante(
  rondaParticipanteId: string
): Promise<FichaCompleta | null> {
  const admin = getSupabaseAdmin()

  const { data: ficha, error } = await admin
    .from('fichas_registro')
    .select('*')
    .eq('ronda_participante_id', rondaParticipanteId)
    .maybeSingle()

  if (error) throw new Error(`No fue posible cargar la ficha: ${error.message}`)
  if (!ficha) return null

  const [{ data: acompanantes }, { data: analizadores }, { data: instrumentos }] =
    await Promise.all([
      admin
        .from('fichas_registro_acompanantes')
        .select('*')
        .eq('ficha_id', ficha.id)
        .order('sort_order'),
      admin
        .from('fichas_registro_analizadores')
        .select('*')
        .eq('ficha_id', ficha.id)
        .order('sort_order'),
      admin
        .from('fichas_registro_instrumentos')
        .select('*')
        .eq('ficha_id', ficha.id)
        .order('sort_order'),
    ])

  return {
    ...(ficha as FichaRegistro),
    acompanantes: (acompanantes ?? []) as Acompanante[],
    analizadores: (analizadores ?? []) as Analizador[],
    instrumentos: (instrumentos ?? []) as Instrumento[],
  }
}

export async function getFichaResumenByRondaParticipante(
  rondaParticipanteId: string
): Promise<FichaResumen | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('fichas_registro')
    .select('id, ronda_participante_id, estado')
    .eq('ronda_participante_id', rondaParticipanteId)
    .maybeSingle()

  if (error) throw new Error(`No fue posible cargar el resumen de ficha: ${error.message}`)
  return data as FichaResumen | null
}

export async function getFichasResumenByRpIds(
  rpIds: string[]
): Promise<Record<string, FichaResumen>> {
  if (rpIds.length === 0) return {}

  const { data, error } = await getSupabaseAdmin()
    .from('fichas_registro')
    .select('id, ronda_participante_id, estado')
    .in('ronda_participante_id', rpIds)

  if (error) throw new Error(`No fue posible cargar las fichas: ${error.message}`)

  return (data ?? []).reduce<Record<string, FichaResumen>>((acc, row) => {
    acc[row.ronda_participante_id] = row as FichaResumen
    return acc
  }, {})
}

export async function listFichaResumenesByRonda(
  rondaId: string
): Promise<Record<string, FichaResumen>> {
  const admin = getSupabaseAdmin()

  const { data: rpRows, error: rpError } = await admin
    .from('ronda_participantes')
    .select('id')
    .eq('ronda_id', rondaId)

  if (rpError) throw new Error(`No fue posible cargar los participantes: ${rpError.message}`)

  const rpIds = (rpRows ?? []).map((row) => row.id)
  return getFichasResumenByRpIds(rpIds)
}

export async function upsertFichaScalars(
  fichaId: string,
  field: FichaScalarField,
  value: string | boolean | null
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('fichas_registro')
    .update({ [field]: value })
    .eq('id', fichaId)
    .eq('estado', 'borrador')

  if (error) throw new Error(`No fue posible guardar el campo: ${error.message}`)
}

export async function replaceAcompanantes(
  fichaId: string,
  items: AcompananteInput[]
): Promise<void> {
  const admin = getSupabaseAdmin()
  await admin.from('fichas_registro_acompanantes').delete().eq('ficha_id', fichaId)
  if (items.length === 0) return
  const { error } = await admin
    .from('fichas_registro_acompanantes')
    .insert(items.map((item) => ({ ...item, ficha_id: fichaId })))
  if (error) throw new Error(`No fue posible guardar acompañantes: ${error.message}`)
}

export async function replaceAnalizadores(
  fichaId: string,
  items: AnalizadorInput[]
): Promise<void> {
  const admin = getSupabaseAdmin()
  await admin.from('fichas_registro_analizadores').delete().eq('ficha_id', fichaId)
  if (items.length === 0) return
  const { error } = await admin
    .from('fichas_registro_analizadores')
    .insert(items.map((item) => ({ ...item, ficha_id: fichaId })))
  if (error) throw new Error(`No fue posible guardar analizadores: ${error.message}`)
}

export async function replaceInstrumentos(
  fichaId: string,
  items: InstrumentoInput[]
): Promise<void> {
  const admin = getSupabaseAdmin()
  await admin.from('fichas_registro_instrumentos').delete().eq('ficha_id', fichaId)
  if (items.length === 0) return
  const { error } = await admin
    .from('fichas_registro_instrumentos')
    .insert(items.map((item) => ({ ...item, ficha_id: fichaId })))
  if (error) throw new Error(`No fue posible guardar instrumentos: ${error.message}`)
}

export async function submitFicha(fichaId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('fichas_registro')
    .update({ estado: 'enviado' })
    .eq('id', fichaId)
    .eq('estado', 'borrador')

  if (error) throw new Error(`No fue posible enviar la ficha: ${error.message}`)
}
