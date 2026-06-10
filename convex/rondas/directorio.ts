import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export type DirectorioInput = {
  nit: string
  correo: string
  nombreLaboratorio?: string | null
  nombreResponsable?: string | null
  cargo?: string | null
  ciudad?: string | null
  departamento?: string | null
  telefono?: string | null
  workosUserId?: string | null
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function getDirectorioByLookup(
  ctx: QueryCtx | MutationCtx,
  lookup: string
): Promise<Doc<'directorioParticipantes'> | null> {
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

export async function upsertDirectorioFromParticipant(
  ctx: MutationCtx,
  args: DirectorioInput
): Promise<Doc<'directorioParticipantes'>> {
  const nit = args.nit.trim()
  const correo = normalizeEmail(args.correo)
  if (!nit) throw new Error('El NIT es obligatorio.')
  if (!correo) throw new Error('El correo es obligatorio.')

  const existingByNit = await ctx.db
    .query('directorioParticipantes')
    .withIndex('by_nit', (q) => q.eq('nit', nit))
    .first()
  const existingByCorreo = await ctx.db
    .query('directorioParticipantes')
    .withIndex('by_correo', (q) => q.eq('correo', correo))
    .first()

  const existing = existingByNit ?? existingByCorreo
  const now = Date.now()
  const data = {
    nit,
    correo,
    nombreLaboratorio: args.nombreLaboratorio ?? null,
    nombreResponsable: args.nombreResponsable ?? null,
    cargo: args.cargo ?? null,
    ciudad: args.ciudad ?? null,
    departamento: args.departamento ?? null,
    telefono: args.telefono ?? null,
    workosUserId: args.workosUserId ?? null,
    updatedAt: now,
  }

  if (existing) {
    await ctx.db.patch(existing._id, data)
    return (await ctx.db.get(existing._id)) as Doc<'directorioParticipantes'>
  }

  const id = await ctx.db.insert('directorioParticipantes', { ...data, createdAt: now })
  return (await ctx.db.get(id)) as Doc<'directorioParticipantes'>
}
