import type { Id } from '../_generated/dataModel'
import type { QueryCtx, MutationCtx } from '../_generated/server'

export async function requireAgentAuth(ctx: QueryCtx | MutationCtx, apiKey: string): Promise<{ email: string; scopes: string[] }> {
  if (!apiKey || apiKey.length < 32) {
    throw new Error('Agent API key requerida.')
  }

  const hash = await cryptoHash(apiKey)
  const record = await ctx.db
    .query('agentApiKeys')
    .withIndex('by_api_key_hash', (q) => q.eq('apiKeyHash', hash))
    .unique()

  if (!record) {
    throw new Error('API key invalida.')
  }
  if (record.revokedAt != null) {
    throw new Error('API key revocada.')
  }
  if (record.expiresAt < Date.now()) {
    throw new Error('API key expirada.')
  }

  return { email: record.email, scopes: record.scopes }
}

export async function requireAgentAdmin(ctx: QueryCtx | MutationCtx, apiKey: string): Promise<{ email: string; scopes: string[] }> {
  const agent = await requireAgentAuth(ctx, apiKey)
  if (!agent.scopes.includes('calaire.agent.admin')) {
    throw new Error('Scope calaire.agent.admin requerido para esta operacion.')
  }
  return agent
}

async function cryptoHash(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const CONTAMINANTES_ORDER = ['CO', 'SO2', 'O3', 'NO', 'NO2'] as const
export const PENDING_PREFIX = 'pendiente:'

export function contaminanteIdx(c: string): number {
  return CONTAMINANTES_ORDER.indexOf(c as (typeof CONTAMINANTES_ORDER)[number])
}

export function assertAllowedEstadoTransition(current: string, next: string) {
  if (current === next) return
  const transitions: Record<string, string[]> = {
    borrador: ['activa'],
    activa: ['documentacion_pendiente'],
    documentacion_pendiente: ['cerrada'],
    cerrada: ['documentacion_pendiente'],
  }
  if (!transitions[current]?.includes(next)) {
    throw new Error(`Transicion no permitida: ${current} -> ${next}`)
  }
}

export const FORMATOS_ARCHIVO = ['F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-14'] as const
export const REVISION_CHECKS = [
  'participantes_revisados',
  'fichas_revisadas',
  'envios_finales_revisados',
  'metricas_revisadas',
  'evidencias_revisadas',
  'inconsistencias_resueltas',
] as const

export async function writeAudit(
  ctx: MutationCtx,
  args: {
    rondaId: Id<'rondas'>
    actor: string
    evento: string
    detalle?: string | null
    targetTipo?: string | null
    targetId?: string | null
  }
) {
  await ctx.db.insert('sgcAuditLog', {
    rondaId: args.rondaId,
    actor: args.actor,
    evento: args.evento,
    detalle: args.detalle ?? null,
    targetTipo: args.targetTipo ?? null,
    targetId: args.targetId ?? null,
    createdAt: Date.now(),
  })
}

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

export async function generateUniqueParticipantCode(ctx: MutationCtx, rondaId: Id<'rondas'>): Promise<string> {
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

export async function getDirectorioByLookup(ctx: QueryCtx | MutationCtx, lookup: string) {
  const normalized = lookup.trim().toLowerCase()
  if (!normalized) return null

  const nitMatch = await ctx.db
    .query('directorioParticipantes')
    .withIndex('by_nit', (q) => q.eq('nit', lookup.trim()))
    .first()
  if (nitMatch) return nitMatch

  return ctx.db
    .query('directorioParticipantes')
    .withIndex('by_correo', (q) => q.eq('correo', normalized))
    .first()
}
