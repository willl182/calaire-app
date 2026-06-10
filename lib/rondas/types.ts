import type { CONTAMINANTES } from './constants'

export type Contaminante = (typeof CONTAMINANTES)[number]
export type ParticipantePerfil = 'member' | 'member_special'

export type RondaPTItem = {
  id: string
  ronda_id: string
  contaminante: Contaminante
  run_code: string
  level_label: string
  sort_order: number
  created_at: string
}

export type Envio = {
  id: string
  ronda_id: string
  workos_user_id: string
  contaminante: Contaminante
  nivel: number
  valores: number[]
  promedio: number | null
  incertidumbre: number | null
  submitted_at: string
  updated_at: string
}

export type EnvioPTConMetadatos = {
  pollutant: string
  run: string
  level: string
  participant_id: string
  replicate: number
  sample_group: string
  d1: number | null
  d2: number | null
  d3: number | null
  mean_value: number
  sd_value: number
  ux: number | null
  k: number | null
  ux_exp: number | null
}

export type ParticipanteRondaResumen = {
  ronda_participante_id: string
  ronda_id: string
  email: string
  workos_user_id: string | null
  participant_profile: ParticipantePerfil
  participant_code: string | null
  replicate_code: number | null
  estado: 'pendiente' | 'reclamado'
  slot_token: string | null
  claimed_at: string | null
  invitado_at: string
  ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
  envios_pt_count: number
  tiene_envio_final: boolean
}

export type FiltroParticipante =
  | 'todos'
  | 'enlace_pendiente'
  | 'ficha_pendiente'
  | 'ficha_enviada'
  | 'con_envios'
  | 'sin_envios'

export type ResultadoParticipante = {
  workos_user_id: string
  email: string
  completados: number
  total_esperado: number
  porcentaje_completitud: number
  enviados_at: string | null
  envios: Envio[]
}

export type EstadoRonda = 'borrador' | 'activa' | 'documentacion_pendiente' | 'cerrada'

export type Ronda = {
  id: string
  codigo: string
  nombre: string
  estado: EstadoRonda
  created_at: string
}

export type EstadoOperativo =
  | 'preparar_ronda'
  | 'invitar_participantes'
  | 'esperando_fichas'
  | 'recibiendo_resultados'
  | 'revisar_incompletos'
  | 'lista_para_exportar'
  | 'cerrada'

export type RondaMetricasBase = {
  cupos_totales: number
  cupos_reclamados: number
  fichas_enviadas: number
  fichas_pendientes: number
  envios_finales: number
  envios_esperados: number
  pt_configurado: boolean
}

export type RondaMetricasDerivadas = {
  estado_operativo: EstadoOperativo
  accion_recomendada: string
}
