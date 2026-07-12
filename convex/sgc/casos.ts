import { v } from 'convex/values'
import { requireSgcManage, writeAudit, buildCodigoCaso, SgcMutationConfig } from './shared'

const upsertResultadoPtAppArgs = {
    rondaId: v.id('rondas'),
    tipoResultado: v.union(v.literal('homogeneidad'), v.literal('estabilidad'), v.literal('estadistico')),
    evidenciaSerieId: v.id('sgcEvidenciaSeries'),
    evidenciaVersionId: v.union(v.id('sgcEvidenciaVersiones'), v.null()),
    estado: v.union(v.literal('pendiente'), v.literal('cargado'), v.literal('en_revision'), v.literal('aprobado'), v.literal('rechazado')),
    observaciones: v.union(v.string(), v.null()),
    fechaCalculo: v.union(v.string(), v.null()),
  }

export const upsertResultadoPtAppConfig = {
  args: upsertResultadoPtAppArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const serie = await ctx.db.get(args.evidenciaSerieId)
    if (!serie || serie.rondaId !== args.rondaId) throw new Error('La serie de evidencia no pertenece a esta ronda.')
    if (args.evidenciaVersionId) {
      const version = await ctx.db.get(args.evidenciaVersionId)
      if (!version || version.serieId !== args.evidenciaSerieId) throw new Error('La version no pertenece a la serie seleccionada.')
    }
    const now = Date.now()
    const existing = await ctx.db
      .query('sgcResultadosPtApp')
      .withIndex('by_rondaId_and_tipoResultado', (q) => q.eq('rondaId', args.rondaId).eq('tipoResultado', args.tipoResultado))
      .first()
    const approved = args.estado === 'aprobado'
    if (existing) {
      await ctx.db.patch(existing._id, {
        evidenciaSerieId: args.evidenciaSerieId,
        evidenciaVersionId: args.evidenciaVersionId,
        estado: args.estado,
        observaciones: args.observaciones,
        version: existing.version + 1,
        fechaCalculo: args.fechaCalculo,
        aprobadoAt: approved ? now : existing.aprobadoAt,
        aprobadoBy: approved ? actor : existing.aprobadoBy,
        updatedAt: now,
        updatedBy: actor,
      })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.pt_app.actualizado', targetTipo: 'sgcResultadosPtApp', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcResultadosPtApp', {
      rondaId: args.rondaId,
      tipoResultado: args.tipoResultado,
      evidenciaSerieId: args.evidenciaSerieId,
      evidenciaVersionId: args.evidenciaVersionId,
      estado: args.estado,
      observaciones: args.observaciones,
      version: 1,
      origen: 'pt_app',
      fechaCalculo: args.fechaCalculo,
      aprobadoAt: approved ? now : null,
      aprobadoBy: approved ? actor : null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.pt_app.creado', targetTipo: 'sgcResultadosPtApp', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof upsertResultadoPtAppArgs>

const crearCasoSgcArgs = {
    rondaId: v.id('rondas'),
    rondaParticipanteId: v.union(v.id('rondaParticipantes'), v.null()),
    tipo: v.union(v.literal('consulta'), v.literal('desviacion'), v.literal('queja'), v.literal('apelacion'), v.literal('nc_capa'), v.literal('otro')),
    severidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta'), v.literal('critica')),
    titulo: v.string(),
    descripcion: v.string(),
    responsable: v.string(),
    formatoRelacionado: v.union(v.string(), v.null()),
    evidenciaSerieId: v.union(v.id('sgcEvidenciaSeries'), v.null()),
    fechaObjetivo: v.union(v.string(), v.null()),
  }

export const crearCasoSgcConfig = {
  args: crearCasoSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const titulo = args.titulo.trim()
    const descripcion = args.descripcion.trim()
    if (!titulo) throw new Error('El caso SGC exige titulo.')
    if (!descripcion) throw new Error('El caso SGC exige descripcion.')
    if (args.rondaParticipanteId) {
      const participante = await ctx.db.get(args.rondaParticipanteId)
      if (!participante || participante.rondaId !== args.rondaId) {
        throw new Error('El participante seleccionado no pertenece a esta ronda.')
      }
    }
    if (args.evidenciaSerieId) {
      const serie = await ctx.db.get(args.evidenciaSerieId)
      if (!serie || serie.rondaId !== args.rondaId) {
        throw new Error('La evidencia vinculada no pertenece a esta ronda.')
      }
    }
    const existing = await ctx.db.query('sgcCasos').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).collect()
    const now = Date.now()
    const id = await ctx.db.insert('sgcCasos', {
      rondaId: args.rondaId,
      rondaParticipanteId: args.rondaParticipanteId,
      codigo: buildCodigoCaso(existing.length),
      tipo: args.tipo,
      severidad: args.severidad,
      estado: 'abierto',
      titulo,
      descripcion,
      responsable: args.responsable.trim() || actor,
      formatoRelacionado: args.formatoRelacionado?.trim() || null,
      evidenciaSerieId: args.evidenciaSerieId,
      fechaObjetivo: args.fechaObjetivo,
      resolucion: null,
      cerradoAt: null,
      cerradoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.caso.creado', detalle: titulo, targetTipo: 'sgcCasos', targetId: id })
    return id
  },
} satisfies SgcMutationConfig<typeof crearCasoSgcArgs>

const actualizarCasoSgcArgs = {
    casoId: v.id('sgcCasos'),
    estado: v.union(v.literal('abierto'), v.literal('en_revision'), v.literal('esperando_participante'), v.literal('resuelto'), v.literal('cerrado')),
    severidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta'), v.literal('critica')),
    responsable: v.string(),
    fechaObjetivo: v.union(v.string(), v.null()),
    resolucion: v.union(v.string(), v.null()),
  }

export const actualizarCasoSgcConfig = {
  args: actualizarCasoSgcArgs,
  handler: async (ctx, args) => {
    const actor = await requireSgcManage(ctx)
    const caso = await ctx.db.get(args.casoId)
    if (!caso) throw new Error('Caso SGC no encontrado.')
    const resolucion = args.resolucion?.trim() || null
    if ((args.estado === 'resuelto' || args.estado === 'cerrado') && !resolucion) {
      throw new Error('Resolver o cerrar un caso SGC exige resolucion documentada.')
    }
    const now = Date.now()
    await ctx.db.patch(args.casoId, {
      estado: args.estado,
      severidad: args.severidad,
      responsable: args.responsable.trim() || actor,
      fechaObjetivo: args.fechaObjetivo,
      resolucion,
      cerradoAt: args.estado === 'cerrado' ? now : null,
      cerradoBy: args.estado === 'cerrado' ? actor : null,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: caso.rondaId, actor, evento: 'sgc.caso.actualizado', detalle: `${caso.codigo}: ${args.estado}`, targetTipo: 'sgcCasos', targetId: args.casoId })
  },
} satisfies SgcMutationConfig<typeof actualizarCasoSgcArgs>

