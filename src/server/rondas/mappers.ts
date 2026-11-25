// Conversión de documentos Convex a los tipos de la app (snake_case, fechas ISO).
import { PENDING_PARTICIPANTE_PREFIX } from './constants'
import type {
  Contaminante,
  Envio,
  EnvioPT,
  EstadoRonda,
  ParticipantePerfil,
  ParticipanteRondaResumen,
  Ronda,
  RondaContaminante,
  RondaParticipante,
  RondaParticipantePT,
  RondaPTItem,
  RondaPTSampleGroup,
} from './types'

function msToISO(ms: number): string {
  return new Date(ms).toISOString()
}

function optMsToISO(ms: number | undefined | null): string | null {
  return ms != null ? new Date(ms).toISOString() : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContaminanteDoc(c: any): RondaContaminante {
  return {
    id: c._id as string,
    ronda_id: c.rondaId as string,
    contaminante: c.contaminante as Contaminante,
    niveles: c.niveles as number,
    replicas: c.replicas as 2 | 3,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRondaWithContaminantes(r: any): Ronda {
  return {
    id: r._id as string,
    codigo: r.codigo as string,
    nombre: r.nombre as string,
    estado: r.estado as EstadoRonda,
    created_at: msToISO(r.createdAt as number),
    contaminantes: (r.contaminantes as unknown[]).map(mapContaminanteDoc),
    participantes_planeados: r.participantes_planeados as number | undefined,
    participantes_asignados: r.participantes_asignados as number | undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapParticipanteDoc(p: any): RondaParticipante {
  return {
    id: p._id as string,
    ronda_id: p.rondaId as string,
    workos_user_id: p.workosUserId as string,
    email: p.email as string,
    invitado_at: msToISO(p.invitadoAt as number),
    participant_profile: (p.participantProfile ?? 'member') as ParticipantePerfil,
    envios_count: (p.envios_count ?? 0) as number,
    estado: (p.estado ?? (String(p.workosUserId).startsWith(PENDING_PARTICIPANTE_PREFIX) ? 'pendiente' : 'asignado')) as 'pendiente' | 'asignado',
    slot_token: (p.slot_token ?? null) as string | null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapParticipanteRondaResumenDoc(p: any): ParticipanteRondaResumen {
  const enviosPtCount = (p.envios_pt_count ?? 0) as number
  return {
    ronda_participante_id: p.ronda_participante_id as string,
    ronda_id: p.ronda_id as string,
    email: p.email as string,
    workos_user_id: (p.workos_user_id ?? null) as string | null,
    participant_profile: (p.participant_profile ?? 'member') as ParticipantePerfil,
    participant_code: (p.participant_code ?? null) as string | null,
    replicate_code: (p.replicate_code ?? null) as number | null,
    estado: p.estado as 'pendiente' | 'reclamado',
    slot_token: (p.slot_token ?? null) as string | null,
    claimed_at: (p.claimed_at ?? null) as string | null,
    invitado_at: p.invitado_at as string,
    ficha_estado: p.ficha_estado as 'no_iniciada' | 'borrador' | 'enviado',
    envios_pt_count: enviosPtCount,
    tiene_envio_final: enviosPtCount > 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEnvioDoc(e: any): Envio {
  return {
    id: e._id as string,
    ronda_id: e.rondaId as string,
    workos_user_id: e.workosUserId as string,
    contaminante: e.contaminante as Contaminante,
    nivel: e.nivel as number,
    valores: e.valores as number[],
    promedio: (e.promedio ?? null) as number | null,
    incertidumbre: (e.incertidumbre ?? null) as number | null,
    submitted_at: msToISO(e.submittedAt as number),
    updated_at: msToISO(e.updatedAt as number),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPTItemDoc(item: any): RondaPTItem {
  return {
    id: item._id as string,
    ronda_id: item.rondaId as string,
    contaminante: item.contaminante as Contaminante,
    run_code: item.runCode as string,
    level_label: item.levelLabel as string,
    sort_order: item.sortOrder as number,
    created_at: msToISO(item.createdAt as number),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPTSampleGroupDoc(g: any): RondaPTSampleGroup {
  return {
    id: g._id as string,
    ronda_id: g.rondaId as string,
    sample_group: g.sampleGroup as string,
    sort_order: g.sortOrder as number,
    created_at: msToISO(g.createdAt as number),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapParticipantePTDoc(p: any): RondaParticipantePT {
  return {
    id: p._id as string,
    ronda_id: p.rondaId as string,
    workos_user_id: p.workosUserId as string,
    email: p.email as string,
    invitado_at: msToISO(p.invitadoAt as number),
    participant_profile: (p.participantProfile ?? 'member') as ParticipantePerfil,
    participant_code: (p.participantCode ?? null) as string | null,
    replicate_code: (p.replicateCode ?? null) as number | null,
    claimed_at: optMsToISO(p.claimedAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEnvioPTDoc(e: any): EnvioPT {
  return {
    id: e._id as string,
    ronda_id: e.rondaId as string,
    ronda_participante_id: e.rondaParticipanteId as string,
    pt_item_id: e.ptItemId as string,
    sample_group_id: e.sampleGroupId as string,
    d1: (e.d1 ?? null) as number | null,
    d2: (e.d2 ?? null) as number | null,
    d3: (e.d3 ?? null) as number | null,
    mean_value: e.meanValue as number,
    sd_value: e.sdValue as number,
    ux: (e.ux ?? null) as number | null,
    k: (e.k ?? null) as number | null,
    ux_exp: (e.uxExp ?? null) as number | null,
    draft_saved_at: msToISO(e.draftSavedAt as number),
    final_submitted_at: optMsToISO(e.finalSubmittedAt),
    updated_at: msToISO(e.updatedAt as number),
  }
}
