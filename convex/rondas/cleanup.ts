import { v } from 'convex/values'
import { defineRondaMutation } from './definitions'
import { requireManagerIdentity } from '../access'

export const deleteRondaDefinition = defineRondaMutation({
  args: { id: v.id('rondas') },
  handler: async (ctx, { id }) => {
    await requireManagerIdentity(ctx)
    const ronda = await ctx.db.get(id)
    if (!ronda) throw new Error('La ronda no existe.')

    const participantes = await ctx.db
      .query('rondaParticipantes')
      .withIndex('by_ronda', (q) => q.eq('rondaId', id))
      .collect()

    for (const participante of participantes) {
      const fichas = await ctx.db
        .query('fichasRegistro')
        .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', participante._id))
        .collect()
      for (const ficha of fichas) {
        const [acompanantes, analizadores, instrumentos] = await Promise.all([
          ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
          ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
          ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
        ])
        await Promise.all([
          ...acompanantes.map((row) => ctx.db.delete(row._id)),
          ...analizadores.map((row) => ctx.db.delete(row._id)),
          ...instrumentos.map((row) => ctx.db.delete(row._id)),
        ])
        await ctx.db.delete(ficha._id)
      }
    }

    const [contaminantes, ptItems, sampleGroups, envios, enviosPt] = await Promise.all([
      ctx.db.query('rondaContaminantes').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('rondaPtSampleGroups').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('envios').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
      ctx.db.query('enviosPt').withIndex('by_ronda', (q) => q.eq('rondaId', id)).collect(),
    ])

    await Promise.all([
      ...enviosPt.map((row) => ctx.db.delete(row._id)),
      ...envios.map((row) => ctx.db.delete(row._id)),
      ...sampleGroups.map((row) => ctx.db.delete(row._id)),
      ...ptItems.map((row) => ctx.db.delete(row._id)),
      ...contaminantes.map((row) => ctx.db.delete(row._id)),
      ...participantes.map((row) => ctx.db.delete(row._id)),
    ])

    await ctx.db.delete(id)
    return ronda.nombre
  },
})

export const removeParticipanteDefinition = defineRondaMutation({
  args: { rondaId: v.id('rondas'), participanteId: v.id('rondaParticipantes') },
  handler: async (ctx, { rondaId, participanteId }) => {
    await requireManagerIdentity(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado === 'cerrada') throw new Error('No se puede modificar la lista de una ronda cerrada.')

    const participante = await ctx.db.get(participanteId)
    if (!participante || participante.rondaId !== rondaId) throw new Error('No se encontro el participante.')

    const enviosPt = await ctx.db
      .query('enviosPt')
      .withIndex('by_participante', (q) => q.eq('rondaParticipanteId', participanteId))
      .collect()
    const envios = await ctx.db
      .query('envios')
      .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', participante.workosUserId))
      .collect()
    const fichas = await ctx.db
      .query('fichasRegistro')
      .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', participanteId))
      .collect()

    for (const ficha of fichas) {
      const [acompanantes, analizadores, instrumentos] = await Promise.all([
        ctx.db.query('fichasAcompanantes').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
        ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
        ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
      ])
      await Promise.all([
        ...acompanantes.map((row) => ctx.db.delete(row._id)),
        ...analizadores.map((row) => ctx.db.delete(row._id)),
        ...instrumentos.map((row) => ctx.db.delete(row._id)),
      ])
      await ctx.db.delete(ficha._id)
    }

    await Promise.all([
      ...enviosPt.map((row) => ctx.db.delete(row._id)),
      ...envios.map((row) => ctx.db.delete(row._id)),
    ])
    await ctx.db.delete(participanteId)
  },
})
