import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

export async function getLatestFichaByRondaParticipante(
  ctx: QueryCtx,
  rondaParticipanteId: Id<'rondaParticipantes'>
): Promise<Doc<'fichasRegistro'> | null> {
  const fichas = await ctx.db
    .query('fichasRegistro')
    .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', rondaParticipanteId))
    .collect()
  fichas.sort((a, b) => b.updatedAt - a.updatedAt)
  return fichas[0] ?? null
}
