import type { CONTAMINANTES } from './constants'


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


export type RondaPTItemInput = {
  runCode: string
  levelLabel: string
  sortOrder: number
}

export type RondaPTSampleGroup = {
  id: string
  ronda_id: string
  sample_group: string
  sort_order: number
  created_at: string
}

export type RondaParticipantePT = {
  id: string
  ronda_id: string
  workos_user_id: string
  email: string
  invitado_at: string
  participant_profile: ParticipantePerfil
  participant_code: string | null
  replicate_code: number | null
  claimed_at: string | null
}

export type EnvioPT = {
  id: string
  ronda_id: string
  ronda_participante_id: string
  pt_item_id: string
  sample_group_id: string
  d1: number | null
  d2: number | null
  d3: number | null
  mean_value: number
  sd_value: number
  ux: number | null
  k: number | null
  ux_exp: number | null
  draft_saved_at: string
  final_submitted_at: string | null
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

export type RondaParticipante = {
  id: string
  ronda_id: string
  workos_user_id: string
  email: string
  invitado_at: string
  participant_profile: ParticipantePerfil
  envios_count: number
  estado: 'pendiente' | 'asignado'
  slot_token: string | null
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
  | 'enlace_pendiente'   // estado === 'pendiente'
  | 'ficha_pendiente'    // estado === 'reclamado' && ficha_estado !== 'enviado'
  | 'ficha_enviada'      // ficha_estado === 'enviado'
  | 'con_envios'         // envios_pt_count > 0
  | 'sin_envios'         // estado === 'reclamado' && envios_pt_count === 0

export type ResultadoParticipante = {
  workos_user_id: string
  email: string
  completados: number
  total_esperado: number
  porcentaje_completitud: number
  enviados_at: string | null
  envios: Envio[]
}

export type ResultadoPTCelda = {
  pt_item_id: string
  sample_group_id: string
  mean_value: number
  sd_value: number
  draft_saved_at: string
  final_submitted_at: string | null
  updated_at: string
}

export type ResultadoParticipantePT = {
  participante_id: string
  workos_user_id: string
  email: string
  participant_code: string | null
  replicate_code: number | null
  completados: number
  total_esperado: number
  porcentaje_completitud: number
  enviados_at: string | null
  celdas: ResultadoPTCelda[]
}

export type Contaminante = (typeof CONTAMINANTES)[number]
export type EstadoRonda = 'borrador' | 'activa' | 'documentacion_pendiente' | 'cerrada'

export type PtScoreImportRow = {
  participantCode: string; contaminante: string; runCode: string; levelLabel: string; unidad: string; metodo: string
  valorAsignado: number; incertidumbreAsignada: number | null; sigmaPt: number | null; valorParticipante: number
  uParticipante: number | null; UParticipante: number | null; z: number | null; zPrima: number | null; zeta: number | null; en: number | null
  clasificacion: 'satisfactorio' | 'no_satisfactorio'
}

export type RondaContaminante = {
  id: string
  ronda_id: string
  contaminante: Contaminante
  niveles: number
  replicas: 2 | 3
}

export type Ronda = {
  id: string
  codigo: string
  nombre: string
  estado: EstadoRonda
  created_at: string
  contaminantes: RondaContaminante[]
  participantes_planeados?: number
  participantes_asignados?: number
}

export type EnvioPTWithRelations = EnvioPT & {
  pt_item: RondaPTItem
  sample_group: RondaPTSampleGroup
  participante: RondaParticipantePT
}

export type EstadoOperativo =
  | 'preparar_ronda'
  | 'invitar_participantes'
  | 'esperando_fichas'
  | 'recibiendo_resultados'
  | 'revisar_incompletos'
  | 'lista_para_exportar'
  | 'cerrada'

export type RondaMetricas = {
  cupos_totales: number
  cupos_reclamados: number
  fichas_enviadas: number
  fichas_pendientes: number       // reclamados sin ficha enviada
  envios_finales: number          // participantes con enviados_at !== null
  envios_esperados: number        // = cupos_reclamados
  pt_configurado: boolean         // ptItems.length > 0; sample group defaults to A
  estado_operativo: EstadoOperativo
  accion_recomendada: string
}

export type RondaMetricasBase = Omit<RondaMetricas, 'estado_operativo' | 'accion_recomendada'>

export type RondaMetricasDerivadas = Pick<RondaMetricas, 'estado_operativo' | 'accion_recomendada'>
