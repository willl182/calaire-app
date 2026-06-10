import { v } from 'convex/values'
import { requireSgcAdmin, requireParticipante, writeAudit, SgcQueryConfig, SgcMutationConfig } from './shared'

const listComentariosRondaArgs = { rondaId: v.id('rondas') }

export const listComentariosRondaConfig = {
  args: listComentariosRondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcComentariosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
} satisfies SgcQueryConfig<typeof listComentariosRondaArgs>

const listMisComentariosRondaArgs = { rondaId: v.id('rondas') }

export const listMisComentariosRondaConfig = {
  args: listMisComentariosRondaArgs,
  handler: async (ctx, { rondaId }) => {
    const { participante } = await requireParticipante(ctx, rondaId)
    return ctx.db
      .query('sgcComentariosRonda')
      .withIndex('by_rondaParticipanteId', (q) => q.eq('rondaParticipanteId', participante._id))
      .order('desc')
      .collect()
  },
} satisfies SgcQueryConfig<typeof listMisComentariosRondaArgs>

const createComentarioRondaArgs = { rondaId: v.id('rondas'), mensaje: v.string() }

export const createComentarioRondaConfig = {
  args: createComentarioRondaArgs,
  handler: async (ctx, { rondaId, mensaje }) => {
    const trimmed = mensaje.trim()
    if (!trimmed) throw new Error('El comentario no puede estar vacio.')
    const { participante, actor, email, name } = await requireParticipante(ctx, rondaId)
    const now = Date.now()
    const id = await ctx.db.insert('sgcComentariosRonda', {
      rondaId,
      rondaParticipanteId: participante._id,
      autorNombre: name,
      autorEmail: email,
      mensaje: trimmed,
      estado: 'abierto',
      respuestaAdmin: null,
      respondidoAt: null,
      respondidoBy: null,
      cerradoAt: null,
      cerradoBy: null,
      createdAt: now,
      updatedAt: now,
    })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.comentario.creado', targetTipo: 'sgcComentariosRonda', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof createComentarioRondaArgs>

const responderComentarioRondaArgs = {
    comentarioId: v.id('sgcComentariosRonda'),
    respuesta: v.string(),
    cerrar: v.boolean(),
  }

export const responderComentarioRondaConfig = {
  args: responderComentarioRondaArgs,
  handler: async (ctx, { comentarioId, respuesta, cerrar }) => {
    const actor = await requireSgcAdmin(ctx)
    const comentario = await ctx.db.get(comentarioId)
    if (!comentario) throw new Error('Comentario no encontrado.')
    const trimmed = respuesta.trim()
    if (!trimmed) throw new Error('La respuesta no puede estar vacia.')
    const now = Date.now()
    await ctx.db.patch(comentarioId, {
      respuestaAdmin: trimmed,
      estado: cerrar ? 'cerrado' : 'respondido',
      respondidoAt: now,
      respondidoBy: actor,
      cerradoAt: cerrar ? now : comentario.cerradoAt,
      cerradoBy: cerrar ? actor : comentario.cerradoBy,
      updatedAt: now,
    })
    await writeAudit(ctx, { rondaId: comentario.rondaId, actor, evento: 'sgc.comentario.respondido', targetTipo: 'sgcComentariosRonda', targetId: comentarioId })
  },
} satisfies SgcMutationConfig<typeof responderComentarioRondaArgs>

