import type { MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

const PARTICIPANT_CODE_LENGTH = 6
const PARTICIPANT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PARTICIPANT_CODE_MAX_ATTEMPTS = 20

function generateParticipantCode(): string {
  let code = ''
  for (let i = 0; i < PARTICIPANT_CODE_LENGTH; i += 1) {
    const idx = Math.floor(Math.random() * PARTICIPANT_CODE_ALPHABET.length)
    code += PARTICIPANT_CODE_ALPHABET[idx]
  }
  return code
}

export async function generateUniqueParticipantCode(
  ctx: MutationCtx,
  rondaId: Id<'rondas'>
): Promise<string> {
  const existingCodes = new Set<string>()
  const participantes = ctx.db
    .query('rondaParticipantes')
    .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))

  for await (const participante of participantes) {
    if (participante.participantCode) {
      existingCodes.add(participante.participantCode)
    }
  }

  for (let attempt = 0; attempt < PARTICIPANT_CODE_MAX_ATTEMPTS; attempt += 1) {
    const code = generateParticipantCode()
    if (!existingCodes.has(code)) {
      return code
    }
  }

  throw new Error('No se pudo generar un codigo de participante unico para esta ronda.')
}

// ---------------------------------------------------------------------------
// Codigo de replica (convencion pt_app): referencia = 1, participantes 2, 3, ...
// Nunca se pisan valores asignados a mano: se toma el siguiente numero libre.
// ---------------------------------------------------------------------------

export type ParticipantProfile = 'member' | 'member_special'

export const REFERENCE_REPLICATE_CODE = 1
export const FIRST_PARTICIPANT_REPLICATE_CODE = 2

/** Siguiente codigo de replica libre para el perfil dado, segun los codigos ya usados. */
export function nextReplicateCode(used: Iterable<number | null | undefined>, profile: ParticipantProfile): number {
  const taken = new Set<number>()
  for (const code of used) {
    if (typeof code === 'number') taken.add(code)
  }
  let candidate = profile === 'member_special' ? REFERENCE_REPLICATE_CODE : FIRST_PARTICIPANT_REPLICATE_CODE
  while (taken.has(candidate)) candidate += 1
  return candidate
}

export async function generateNextReplicateCode(
  ctx: MutationCtx,
  rondaId: Id<'rondas'>,
  profile: ParticipantProfile
): Promise<number> {
  const participantes = await ctx.db
    .query('rondaParticipantes')
    .withIndex('by_ronda', (q) => q.eq('rondaId', rondaId))
    .collect()
  return nextReplicateCode(participantes.map((p) => p.replicateCode), profile)
}

export type ReplicateCodeCambio<Id extends string = string> = {
  participanteId: Id
  anterior: number | null
  replicateCode: number
}

function esCodigoParticipanteValido(code: unknown): code is number {
  return typeof code === 'number' && Number.isInteger(code) && code >= FIRST_PARTICIPANT_REPLICATE_CODE
}

/**
 * Planifica los cambios de replicateCode de una ronda segun la convencion pt_app:
 * - la referencia (member_special) siempre lleva 1, aunque un participante ya lo tenga a mano;
 * - los participantes llevan codigos >= 2, unicos en la ronda;
 * - un participante con 1, sin codigo, con un codigo no valido o repetido recibe el siguiente libre (>= 2).
 * Ante repetidos conserva el codigo quien se dio de alta primero. Si hay varias referencias, la
 * principal es la que ya tiene 1 (o la primera en darse de alta); las demas se tratan como participantes.
 * Idempotente: sobre una ronda ya conforme devuelve una lista vacia.
 */
export function planReplicateCodes<T extends {
  _id: string
  participantProfile: ParticipantProfile
  replicateCode?: number | null
  invitadoAt: number
  _creationTime: number
}>(rows: T[]): Array<ReplicateCodeCambio<T['_id']>> {
  const ordenAlta = [...rows].sort((a, b) => a.invitadoAt - b.invitadoAt || a._creationTime - b._creationTime)
  const referencias = ordenAlta.filter((r) => r.participantProfile === 'member_special')
  const referencia = referencias.find((r) => r.replicateCode === REFERENCE_REPLICATE_CODE) ?? referencias[0] ?? null

  // El 1 queda reservado a la referencia aunque la ronda todavia no tenga una.
  const usados = new Set<number>([REFERENCE_REPLICATE_CODE])
  const conservan = new Set<string>()
  for (const row of ordenAlta) {
    if (row === referencia) continue
    if (esCodigoParticipanteValido(row.replicateCode) && !usados.has(row.replicateCode)) {
      usados.add(row.replicateCode)
      conservan.add(row._id)
    }
  }

  const cambios: Array<ReplicateCodeCambio<T['_id']>> = []
  if (referencia && referencia.replicateCode !== REFERENCE_REPLICATE_CODE) {
    cambios.push({ participanteId: referencia._id, anterior: referencia.replicateCode ?? null, replicateCode: REFERENCE_REPLICATE_CODE })
  }
  for (const row of ordenAlta) {
    if (row === referencia || conservan.has(row._id)) continue
    let candidato = FIRST_PARTICIPANT_REPLICATE_CODE
    while (usados.has(candidato)) candidato += 1
    usados.add(candidato)
    cambios.push({ participanteId: row._id, anterior: row.replicateCode ?? null, replicateCode: candidato })
  }
  return cambios
}
