import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { requireSgcAdmin, SgcQueryConfig } from './shared'

const listAuditLogArgs = { rondaId: v.id('rondas'), paginationOpts: paginationOptsValidator }

export const listAuditLogConfig = {
  args: listAuditLogArgs,
  handler: async (ctx, { rondaId, paginationOpts }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcAuditLog').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').paginate(paginationOpts)
  },
} satisfies SgcQueryConfig<typeof listAuditLogArgs>

