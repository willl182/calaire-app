import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { requireSgcManage, SgcQueryConfig } from './shared'

const listSnapshotsArgs = { rondaId: v.id('rondas'), tipoRegistro: v.string(), paginationOpts: paginationOptsValidator }

export const listSnapshotsConfig = {
  args: listSnapshotsArgs,
  handler: async (ctx, { rondaId, tipoRegistro, paginationOpts }) => {
    await requireSgcManage(ctx)
    return ctx.db
      .query('sgcRegistroSnapshots')
      .withIndex('by_rondaId_and_tipoRegistro', (q) => q.eq('rondaId', rondaId).eq('tipoRegistro', tipoRegistro))
      .order('desc')
      .paginate(paginationOpts)
  },
} satisfies SgcQueryConfig<typeof listSnapshotsArgs>

