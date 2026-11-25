// Participantes: cupos de la ronda, directorio y asignación.
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { safeConvexCall, safeConvexCallWithStatus } from '@/lib/convex-fallback'
import { authedMutation as fetchMutation, authedQuery as fetchQuery, dataOf } from '@/server/convex'
import { MEMBER_SPECIAL_ROLES } from './constants'
import type {
  EstadoRonda,
  ParticipantePerfil,
  ParticipanteRondaResumen,
  Ronda,
  RondaParticipante,
} from './types'
import { mapParticipanteDoc, mapParticipanteRondaResumenDoc, mapRondaWithContaminantes } from './mappers'

export function isMemberSpecialRole(role: string | null | undefined): boolean {
  if (!role) return false
  return MEMBER_SPECIAL_ROLES.includes(role.toLowerCase() as (typeof MEMBER_SPECIAL_ROLES)[number])
}

export async function listParticipantes(rondaId: string): Promise<RondaParticipante[]> {
  const rows = await safeConvexCall(
    'listParticipantes',
    () => fetchQuery(api.rondas.index.listParticipantes, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return rows.map(mapParticipanteDoc)
}

export const listParticipantesRondaResumen = dataOf(listParticipantesRondaResumenWithStatus)

export async function listParticipantesRondaResumenWithStatus(
  rondaId: string
) {
  const result = await safeConvexCallWithStatus(
    'listParticipantesRondaResumen',
    () => fetchQuery(api.rondas.index.listParticipantesRondaResumen, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    [],
  )
  return { data: result.data.map(mapParticipanteRondaResumenDoc), offline: result.offline }
}

export const listRondasParticipante = dataOf(listRondasParticipanteWithStatus)

export async function listRondasParticipanteWithStatus(userId: string) {
  const result = await safeConvexCallWithStatus(
    'listRondasParticipante',
    () => fetchQuery(api.rondas.index.listRondasParticipante, { userId }),
    [],
  )
  return {
    data: result.data.map((r) => ({
      ...mapRondaWithContaminantes(r),
      email: r.email as string,
      invitado_at: r.invitado_at as string,
      ronda_participante_id: r.ronda_participante_id as string,
      participant_profile: (r.participant_profile ?? 'member') as ParticipantePerfil,
      ficha_estado: r.ficha_estado as 'no_iniciada' | 'borrador' | 'enviado',
      envios_pt_count: (r.envios_pt_count ?? 0) as number,
      envio_pt_enviado: Boolean(r.envio_pt_enviado),
    })),
    offline: result.offline,
  }
}

export const listAllParticipantes = dataOf(listAllParticipantesWithStatus)

export async function listAllParticipantesWithStatus() {
  const result = await safeConvexCallWithStatus(
    'listAllParticipantes',
    () => fetchQuery(api.rondas.index.listAllParticipantes, {}),
    [],
  )
  return {
    data: result.data.map((r) => ({
      workos_user_id: r.workos_user_id,
      email: r.email,
      nit: (r.nit ?? null) as string | null,
      nit_laboratorio: (r.nit_laboratorio ?? null) as string | null,
      correo_laboratorio: (r.correo_laboratorio ?? null) as string | null,
      ficha_estado: (r.ficha_estado ?? 'no_iniciada') as 'no_iniciada' | 'borrador' | 'enviado',
      total_envios: r.total_envios,
      rondas: r.rondas.map((ronda) => ({
        ...ronda,
        estado: ronda.estado as EstadoRonda,
        participant_profile: (ronda.participant_profile ?? 'member') as ParticipantePerfil,
        ronda_participante_id: normalizeOptionalId(
          ronda.ronda_participante_id ?? ronda.rondaParticipanteId
        ),
        ficha_estado: (ronda.ficha_estado ?? 'no_iniciada') as 'no_iniciada' | 'borrador' | 'enviado',
        nit_laboratorio: (ronda.nit_laboratorio ?? null) as string | null,
        correo_laboratorio: (ronda.correo_laboratorio ?? null) as string | null,
        estado_enlace: (ronda.estado_enlace ?? 'reclamado') as 'pendiente' | 'reclamado',
      })),
    })),
    offline: result.offline,
  }
}

export type DirectorioParticipante = {
  id: string
  nit: string
  correo: string
  nombre_laboratorio: string | null
  nombre_responsable: string | null
  cargo: string | null
  ciudad: string | null
  departamento: string | null
  telefono: string | null
  workos_user_id: string | null
  created_at: string
  updated_at: string
}

export async function listDirectorioParticipantes(): Promise<DirectorioParticipante[]> {
  const rows = await safeConvexCall(
    'listDirectorioParticipantes',
    () => fetchQuery(api.rondas.index.listDirectorioParticipantes, {}),
    [],
  )
  return rows.map((row) => ({
    id: row.id,
    nit: row.nit,
    correo: row.correo,
    nombre_laboratorio: row.nombre_laboratorio ?? null,
    nombre_responsable: row.nombre_responsable ?? null,
    cargo: row.cargo ?? null,
    ciudad: row.ciudad ?? null,
    departamento: row.departamento ?? null,
    telefono: row.telefono ?? null,
    workos_user_id: row.workos_user_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export async function getDirectorioParticipanteByLookup(
  lookup: { nit?: string; correo?: string }
): Promise<DirectorioParticipante | null> {
  const row = await safeConvexCall(
    'getDirectorioParticipanteByLookup',
    () => fetchQuery(api.rondas.index.getDirectorioParticipanteByLookup, {
      lookup: lookup.nit?.trim() || lookup.correo?.trim() || '',
    }),
    null,
  )
  if (!row) return null
  return {
    id: row.id,
    nit: row.nit,
    correo: row.correo,
    nombre_laboratorio: row.nombre_laboratorio ?? null,
    nombre_responsable: row.nombre_responsable ?? null,
    cargo: row.cargo ?? null,
    ciudad: row.ciudad ?? null,
    departamento: row.departamento ?? null,
    telefono: row.telefono ?? null,
    workos_user_id: row.workos_user_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function upsertDirectorioParticipante(args: {
  nit: string
  correo: string
  nombreLaboratorio?: string | null
  nombreResponsable?: string | null
  cargo?: string | null
  ciudad?: string | null
  departamento?: string | null
  telefono?: string | null
  workosUserId?: string | null
}): Promise<void> {
  await fetchMutation(api.rondas.index.upsertDirectorioParticipante, args)
}

function normalizeOptionalId(value: unknown): string | null {
  return typeof value === 'string' && value !== '' && value !== 'undefined' ? value : null
}

export const isInvitado = dataOf(isInvitadoWithStatus)

export async function isInvitadoWithStatus(rondaId: string) {
  return safeConvexCallWithStatus(
    'isInvitado',
    () => fetchQuery(api.rondas.index.isInvitado, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    false,
  )
}

export async function claimParticipanteToken(
  rondaId: string,
  token: string,
  email: string,
): Promise<'claimed' | 'already-assigned' | 'invalid'> {
  return fetchMutation(api.rondas.index.claimParticipanteToken, {
    rondaId: rondaId as Id<'rondas'>,
    token,
    email,
  })
}

export async function assignParticipante(
  rondaId: string,
  workosUserId: string,
  email: string,
  participantProfile: ParticipantePerfil
): Promise<void> {
  await fetchMutation(api.rondas.index.assignParticipante, {
    rondaId: rondaId as Id<'rondas'>,
    workosUserId,
    email,
    participantProfile,
  })
}

export async function regenerateParticipanteSlot(
  rondaId: string,
  participanteId: string,
  workosUserId: string,
  email: string
): Promise<void> {
  await fetchMutation(api.rondas.index.regenerateParticipanteSlot, {
    rondaId: rondaId as Id<'rondas'>,
    participanteId: participanteId as Id<'rondaParticipantes'>,
    workosUserId,
    email,
  })
}

export async function removeParticipante(
  rondaId: string,
  participanteId: string
): Promise<void> {
  await fetchMutation(api.rondas.index.removeParticipante, {
    rondaId: rondaId as Id<'rondas'>,
    participanteId: participanteId as Id<'rondaParticipantes'>,
  })
}

export async function addReferenceSlot(
  rondaId: string,
  workosUserId: string,
  email: string
): Promise<void> {
  await fetchMutation(api.rondas.index.addReferenceSlot, {
    rondaId: rondaId as Id<'rondas'>,
    workosUserId,
    email,
  })
}

export type RondaParticipanteAsignada = Ronda & {
  email: string
  invitado_at: string
  ronda_participante_id: string
  participant_profile: ParticipantePerfil
  ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
  envios_pt_count: number
  envio_pt_enviado: boolean
}

export type ParticipanteGlobal = {
  workos_user_id: string
  email: string
  nit: string | null
  nit_laboratorio: string | null
  correo_laboratorio: string | null
  ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
  rondas: {
    id: string
    codigo: string
    nombre: string
    estado: EstadoRonda
    envios_count: number
    participant_profile: ParticipantePerfil
    ronda_participante_id: string | null
    ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
    nit_laboratorio: string | null
    correo_laboratorio: string | null
    estado_enlace: 'pendiente' | 'reclamado'
  }[]
  total_envios: number
}

export async function getParticipanteRondaResumen(
  participanteId: string
): Promise<ParticipanteRondaResumen | null> {
  const row = await safeConvexCall(
    'getParticipanteRondaResumen',
    () => fetchQuery(api.rondas.index.getParticipanteRondaResumen, {
      participanteId: participanteId as Id<'rondaParticipantes'>,
    }),
    null,
  )
  if (!row) return null
  return mapParticipanteRondaResumenDoc(row)
}

export async function updateParticipanteEmail(
  rondaId: string,
  participanteId: string,
  email: string
): Promise<void> {
  await fetchMutation(api.rondas.index.updateParticipanteEmail, {
    rondaId: rondaId as Id<'rondas'>,
    participanteId: participanteId as Id<'rondaParticipantes'>,
    email,
  })
}
