import { v } from 'convex/values'
import { requireSgcAdmin, requireParticipante, writeAudit, SgcMutationConfig, SgcQueryConfig } from './shared'

const crearNotificacionArgs = {
    rondaId: v.id('rondas'),
    rondaParticipanteId: v.union(v.id('rondaParticipantes'), v.null()),
    destinatarioEmail: v.string(),
    titulo: v.string(),
    mensaje: v.string(),
    tipo: v.union(v.literal('recordatorio'), v.literal('cronograma'), v.literal('resultado'), v.literal('sgc'), v.literal('otro')),
  }

export const crearNotificacionConfig = {
  args: crearNotificacionArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    let destinatarioEmail = args.destinatarioEmail.trim()
    if (args.rondaParticipanteId) {
      const participante = await ctx.db.get(args.rondaParticipanteId)
      if (!participante || participante.rondaId !== args.rondaId) {
        throw new Error('El participante seleccionado no pertenece a esta ronda.')
      }
      destinatarioEmail = participante.email
    }
    if (!args.titulo.trim() || !args.mensaje.trim() || !destinatarioEmail) {
      throw new Error('La notificacion exige destinatario, titulo y mensaje.')
    }
    const now = Date.now()
    const id = await ctx.db.insert('sgcNotificaciones', {
      rondaId: args.rondaId,
      rondaParticipanteId: args.rondaParticipanteId,
      destinatarioEmail,
      titulo: args.titulo.trim(),
      mensaje: args.mensaje.trim(),
      tipo: args.tipo,
      estado: 'publicada',
      leidaAt: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.notificacion.creada', targetTipo: 'sgcNotificaciones', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof crearNotificacionArgs>

const listMisNotificacionesArgs = { rondaId: v.id('rondas') }

export const listMisNotificacionesConfig = {
  args: listMisNotificacionesArgs,
  handler: async (ctx, { rondaId }) => {
    const { participante, email } = await requireParticipante(ctx, rondaId)
    return ctx.db
      .query('sgcNotificaciones')
      .withIndex('by_rondaParticipanteId', (q) => q.eq('rondaParticipanteId', participante._id))
      .filter((q) => q.eq(q.field('estado'), 'publicada'))
      .order('desc')
      .collect()
      .then((rows) => rows.filter((row) => row.destinatarioEmail === email || row.rondaParticipanteId === participante._id))
  },
} satisfies SgcQueryConfig<typeof listMisNotificacionesArgs>

const marcarNotificacionLeidaArgs = { notificacionId: v.id('sgcNotificaciones') }

export const marcarNotificacionLeidaConfig = {
  args: marcarNotificacionLeidaArgs,
  handler: async (ctx, { notificacionId }) => {
    const notificacion = await ctx.db.get(notificacionId)
    if (!notificacion) throw new Error('Notificacion no encontrada.')
    const { participante } = await requireParticipante(ctx, notificacion.rondaId)
    if (notificacion.rondaParticipanteId !== participante._id) throw new Error('No tiene acceso a esta notificacion.')
    await ctx.db.patch(notificacionId, { leidaAt: Date.now(), updatedAt: Date.now(), updatedBy: participante.email })
  },
} satisfies SgcMutationConfig<typeof marcarNotificacionLeidaArgs>

