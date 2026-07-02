import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { identityRoles, isAdminRole } from './sgc/shared'

export type ConvexAuthCtx = QueryCtx | MutationCtx

export async function requireIdentity(ctx: ConvexAuthCtx, message = 'Autenticacion requerida.') {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error(message)
  return identity
}

// F21: unica definicion de admin, compartida con `convex/sgc/shared.ts`.
export function isAdminIdentity(identity: unknown) {
  return isAdminRole(identityRoles(identity))
}

export async function requireAdminIdentity(ctx: ConvexAuthCtx, message = 'Permisos insuficientes.') {
  const identity = await requireIdentity(ctx)
  if (!isAdminIdentity(identity)) throw new Error(message)
  return identity
}

export async function requireParticipantForRonda(
  ctx: ConvexAuthCtx,
  rondaId: Id<'rondas'>,
  message = 'No tiene acceso a esta ronda.'
) {
  const identity = await requireIdentity(ctx)
  const participante = await ctx.db
    .query('rondaParticipantes')
    .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', identity.subject))
    .first()
  if (!participante) throw new Error(message)
  return { identity, participante }
}

export async function requireParticipantOrAdminForRonda(
  ctx: ConvexAuthCtx,
  rondaId: Id<'rondas'>,
  message = 'No tiene acceso a esta ronda.'
) {
  const identity = await requireIdentity(ctx)
  if (isAdminIdentity(identity)) {
    return { identity, participante: null as Doc<'rondaParticipantes'> | null }
  }
  const participante = await ctx.db
    .query('rondaParticipantes')
    .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', identity.subject))
    .first()
  if (!participante) throw new Error(message)
  return { identity, participante }
}

export async function requireParticipantOrAdminForRondaParticipante(
  ctx: ConvexAuthCtx,
  rondaParticipanteId: Id<'rondaParticipantes'>,
  message = 'No tiene acceso a este participante.'
) {
  const identity = await requireIdentity(ctx)
  if (isAdminIdentity(identity)) {
    const participante = await ctx.db.get(rondaParticipanteId)
    return { identity, participante }
  }
  const participante = await ctx.db.get(rondaParticipanteId)
  if (!participante || participante.workosUserId !== identity.subject) throw new Error(message)
  return { identity, participante }
}

export async function requireParticipantOrAdminForFicha(
  ctx: ConvexAuthCtx,
  fichaId: Id<'fichasRegistro'>,
  message = 'No tiene acceso a esta ficha.'
) {
  const ficha = await ctx.db.get(fichaId)
  if (!ficha) throw new Error('Ficha no encontrada')
  return requireParticipantOrAdminForRondaParticipante(ctx, ficha.rondaParticipanteId, message)
}
