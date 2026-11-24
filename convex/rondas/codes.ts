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

/**
 * Planifica codigos para los participantes sin replicateCode de una ronda.
 * La referencia va primero (para que reciba el 1) y luego por orden de alta.
 */
export function planReplicateCodes<T extends {
  _id: string
  participantProfile: ParticipantProfile
  replicateCode?: number | null
  invitadoAt: number
  _creationTime: number
}>(rows: T[]): Array<{ participanteId: T['_id']; replicateCode: number }> {
  const used: number[] = rows.flatMap((r) => (typeof r.replicateCode === 'number' ? [r.replicateCode] : []))
  const pending = rows
    .filter((r) => r.replicateCode == null)
    .sort((a, b) => {
      const pa = a.participantProfile === 'member_special' ? 0 : 1
      const pb = b.participantProfile === 'member_special' ? 0 : 1
      return pa - pb || a.invitadoAt - b.invitadoAt || a._creationTime - b._creationTime
    })
  return pending.map((row) => {
    const replicateCode = nextReplicateCode(used, row.participantProfile)
    used.push(replicateCode)
    return { participanteId: row._id, replicateCode }
  })
}
