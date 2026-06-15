import { v } from 'convex/values'
import { defineAgentMutation } from './definitions'
import { FORMATOS_ARCHIVO, REVISION_CHECKS, requireAgentAdmin, writeAudit } from './shared'

export const createOrUpdatePlanRondaDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    bloques: v.record(v.string(), v.string()),
    camposEstructurados: v.record(v.string(), v.string()),
    motivoRevision: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const existing = await ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).first()
    if (existing?.estado === 'finalizado' && !args.motivoRevision?.trim()) {
      throw new Error('Editar un plan finalizado exige motivo.')
    }
    if (existing) {
      await ctx.db.patch(existing._id, {
        bloques: args.bloques,
        camposEstructurados: args.camposEstructurados,
        motivoRevision: args.motivoRevision ?? existing.motivoRevision ?? null,
        estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado,
        updatedAt: now,
        updatedBy: actor,
      })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.plan.actualizado', targetTipo: 'sgcPlanRonda', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcPlanRonda', {
      rondaId: args.rondaId,
      estado: 'borrador',
      bloques: args.bloques,
      camposEstructurados: args.camposEstructurados,
      motivoRevision: args.motivoRevision ?? null,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.plan.creado', targetTipo: 'sgcPlanRonda', targetId: id })
    return id
  },
})

export const finalizarPlanRondaDefinition = defineAgentMutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const plan = await ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
    if (!plan) throw new Error('No existe plan de ronda.')
    const now = Date.now()
    await ctx.db.patch(plan._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.plan.finalizado', targetTipo: 'sgcPlanRonda', targetId: plan._id })
  },
})

export const createOrUpdateRevisionDatosDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    checks: v.record(v.string(), v.object({ cumple: v.boolean(), observacion: v.union(v.string(), v.null()) })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const existing = await ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId)).first()
    const checks = Object.fromEntries(
      Object.entries(args.checks).map(([key, value]) => [key, { ...value, updatedAt: now, updatedBy: actor }])
    )
    if (existing) {
      await ctx.db.patch(existing._id, { checks, metricas: args.metricas, estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado, updatedAt: now, updatedBy: actor })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.revision.actualizada', targetTipo: 'sgcRevisionDatos', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcRevisionDatos', {
      rondaId: args.rondaId,
      estado: 'borrador',
      checks,
      metricas: args.metricas,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.revision.creada', targetTipo: 'sgcRevisionDatos', targetId: id })
    return id
  },
})

export const finalizarRevisionDatosDefinition = defineAgentMutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const revision = await ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
    if (!revision) throw new Error('No existe revision de datos.')
    for (const [key, check] of Object.entries(revision.checks)) {
      if (!check.cumple && !check.observacion?.trim()) {
        throw new Error(`El check ${key} no cumple y requiere observacion.`)
      }
    }
    const now = Date.now()
    await ctx.db.patch(revision._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.revision.finalizada', targetTipo: 'sgcRevisionDatos', targetId: revision._id })
  },
})

export const createHitoRondaDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    codigo: v.string(),
    nombre: v.string(),
    fase: v.string(),
    fechaObjetivo: v.union(v.string(), v.null()),
    fechaReal: v.union(v.string(), v.null()),
    estado: v.union(v.literal('pendiente'), v.literal('en_progreso'), v.literal('completado'), v.literal('vencido'), v.literal('cancelado'), v.literal('no_aplica')),
    responsable: v.string(),
    visibleParticipante: v.boolean(),
    bloqueaCierre: v.boolean(),
    formatoRelacionado: v.union(v.string(), v.null()),
    notas: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const id = await ctx.db.insert('sgcHitosRonda', {
      rondaId: args.rondaId,
      codigo: args.codigo,
      nombre: args.nombre,
      fase: args.fase,
      fechaObjetivo: args.fechaObjetivo,
      fechaReal: args.fechaReal,
      estado: args.estado,
      responsable: args.responsable,
      visibleParticipante: args.visibleParticipante,
      bloqueaCierre: args.bloqueaCierre,
      formatoRelacionado: args.formatoRelacionado,
      notas: args.notas,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.hito.creado', targetTipo: 'sgcHitosRonda', targetId: id })
    return id
  },
})

export const updateHitoRondaDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    hitoId: v.id('sgcHitosRonda'),
    codigo: v.string(),
    nombre: v.string(),
    fase: v.string(),
    fechaObjetivo: v.union(v.string(), v.null()),
    fechaReal: v.union(v.string(), v.null()),
    estado: v.union(v.literal('pendiente'), v.literal('en_progreso'), v.literal('completado'), v.literal('vencido'), v.literal('cancelado'), v.literal('no_aplica')),
    responsable: v.string(),
    visibleParticipante: v.boolean(),
    bloqueaCierre: v.boolean(),
    formatoRelacionado: v.union(v.string(), v.null()),
    notas: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const hito = await ctx.db.get(args.hitoId)
    if (!hito) throw new Error('Hito no encontrado.')
    await ctx.db.patch(args.hitoId, {
      codigo: args.codigo,
      nombre: args.nombre,
      fase: args.fase,
      fechaObjetivo: args.fechaObjetivo,
      fechaReal: args.fechaReal,
      estado: args.estado,
      responsable: args.responsable,
      visibleParticipante: args.visibleParticipante,
      bloqueaCierre: args.bloqueaCierre,
      formatoRelacionado: args.formatoRelacionado,
      notas: args.notas,
      updatedAt: Date.now(),
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: hito.rondaId, actor, evento: 'sgc.hito.actualizado', targetTipo: 'sgcHitosRonda', targetId: args.hitoId })
  },
})

export const createEvidenciaSeriesDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    formato: v.union(
      v.literal('F-PSEA-03'), v.literal('F-PSEA-05'), v.literal('F-PSEA-05A'), v.literal('F-PSEA-06'),
      v.literal('F-PSEA-07'), v.literal('F-PSEA-08'), v.literal('F-PSEA-09'), v.literal('F-PSEA-10'),
      v.literal('F-PSEA-11'), v.literal('F-PSEA-12'), v.literal('F-PSEA-13'), v.literal('F-PSEA-14')
    ),
    seccion: v.union(v.string(), v.null()),
    nombre: v.string(),
    requerida: v.boolean(),
    publicaParticipante: v.boolean(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const existing = await ctx.db
      .query('sgcEvidenciaSeries')
      .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', args.rondaId).eq('formato', args.formato))
      .first()
    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { nombre: args.nombre, requerida: args.requerida, publicaParticipante: args.publicaParticipante, seccion: args.seccion, updatedAt: now, updatedBy: actor })
      return existing._id
    }
    const id = await ctx.db.insert('sgcEvidenciaSeries', {
      rondaId: args.rondaId,
      formato: args.formato,
      seccion: args.seccion,
      nombre: args.nombre,
      requerida: args.requerida,
      publicaParticipante: args.publicaParticipante,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.evidencia.serie_creada', targetTipo: 'sgcEvidenciaSeries', targetId: id })
    return id
  },
})

export const registrarEvidenciaVersionDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    serieId: v.id('sgcEvidenciaSeries'),
    storageId: v.id('_storage'),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    hash: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const serie = await ctx.db.get(args.serieId)
    if (!serie) throw new Error('Serie de evidencia no encontrada.')
    if (!FORMATOS_ARCHIVO.includes(serie.formato as (typeof FORMATOS_ARCHIVO)[number])) {
      throw new Error('Este formato no admite evidencia de archivo en Fase 1.')
    }
    if (args.size > 10 * 1024 * 1024) throw new Error('El archivo excede el limite de 10 MB.')
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'image/png', 'image/jpeg']
    if (!allowed.includes(args.contentType)) throw new Error('Tipo de archivo no permitido.')

    const anteriores = await ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId', (q) => q.eq('serieId', args.serieId)).collect()
    for (const anterior of anteriores.filter((v0) => v0.estado === 'vigente')) {
      await ctx.db.patch(anterior._id, { estado: 'reemplazada', updatedAt: Date.now(), updatedBy: actor })
    }
    const now = Date.now()
    const id = await ctx.db.insert('sgcEvidenciaVersiones', {
      serieId: args.serieId,
      rondaId: serie.rondaId,
      storageId: args.storageId,
      version: anteriores.length + 1,
      estado: 'vigente',
      fileName: args.fileName,
      contentType: args.contentType,
      size: args.size,
      hash: args.hash,
      motivoRetiro: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: serie.rondaId, actor, evento: 'sgc.evidencia.version_registrada', targetTipo: 'sgcEvidenciaVersiones', targetId: id })
    return id
  },
})

export const retirarEvidenciaVersionDefinition = defineAgentMutation({
  args: { apiKey: v.string(), evidenciaVersionId: v.id('sgcEvidenciaVersiones'), motivo: v.string() },
  handler: async (ctx, { apiKey, evidenciaVersionId, motivo }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    if (!motivo.trim()) throw new Error('Retirar evidencia exige motivo.')
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) throw new Error('Version no encontrada.')
    await ctx.db.patch(evidenciaVersionId, { estado: 'retirada', motivoRetiro: motivo, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: version.rondaId, actor, evento: 'sgc.evidencia.version_retirada', detalle: motivo, targetTipo: 'sgcEvidenciaVersiones', targetId: evidenciaVersionId })
  },
})

export const upsertJustificacionDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    formato: v.union(v.literal('F-PSEA-05'), v.literal('F-PSEA-05A'), v.literal('F-PSEA-12')),
    alcance: v.string(),
    razon: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    if (!args.razon.trim()) throw new Error('La justificacion exige una razon documentada.')
    const now = Date.now()
    const anteriores = await ctx.db
      .query('sgcJustificaciones')
      .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', args.rondaId).eq('formato', args.formato))
      .collect()
    for (const anterior of anteriores.filter((row) => row.estado === 'vigente')) {
      await ctx.db.patch(anterior._id, { estado: 'reemplazada', updatedAt: now, updatedBy: actor })
    }
    const id = await ctx.db.insert('sgcJustificaciones', {
      rondaId: args.rondaId,
      formato: args.formato,
      alcance: args.alcance.trim() || 'ronda',
      razon: args.razon.trim(),
      estado: 'vigente',
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.justificacion.registrada', detalle: args.formato, targetTipo: 'sgcJustificaciones', targetId: id })
    return id
  },
})

export const retirarJustificacionDefinition = defineAgentMutation({
  args: { apiKey: v.string(), justificacionId: v.id('sgcJustificaciones'), motivo: v.string() },
  handler: async (ctx, { apiKey, justificacionId, motivo }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    if (!motivo.trim()) throw new Error('Retirar una justificacion exige motivo.')
    const justificacion = await ctx.db.get(justificacionId)
    if (!justificacion) throw new Error('Justificacion no encontrada.')
    await ctx.db.patch(justificacionId, { estado: 'retirada', updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: justificacion.rondaId, actor, evento: 'sgc.justificacion.retirada', detalle: motivo, targetTipo: 'sgcJustificaciones', targetId: justificacionId })
  },
})

export const createComunicacionDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const id = await ctx.db.insert('sgcComunicaciones', {
      rondaId: args.rondaId,
      tipo: args.tipo,
      destinatario: args.destinatario,
      asunto: args.asunto,
      notas: args.notas,
      fecha: args.fecha,
      responsable: args.responsable,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.comunicacion.creada', targetTipo: 'sgcComunicaciones', targetId: id })
    return id
  },
})

export const updateComunicacionDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    comunicacionId: v.id('sgcComunicaciones'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const comunicacion = await ctx.db.get(args.comunicacionId)
    if (!comunicacion) throw new Error('Comunicacion no encontrada.')
    await ctx.db.patch(args.comunicacionId, {
      tipo: args.tipo,
      destinatario: args.destinatario,
      asunto: args.asunto,
      notas: args.notas,
      fecha: args.fecha,
      responsable: args.responsable,
      updatedAt: Date.now(),
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: comunicacion.rondaId, actor, evento: 'sgc.comunicacion.actualizada', targetTipo: 'sgcComunicaciones', targetId: args.comunicacionId })
  },
})

export const deleteComunicacionDefinition = defineAgentMutation({
  args: { apiKey: v.string(), comunicacionId: v.id('sgcComunicaciones') },
  handler: async (ctx, { apiKey, comunicacionId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const comunicacion = await ctx.db.get(comunicacionId)
    if (!comunicacion) throw new Error('Comunicacion no encontrada.')
    await ctx.db.delete(comunicacionId)
    await writeAudit(ctx, { rondaId: comunicacion.rondaId, actor, evento: 'sgc.comunicacion.eliminada', targetTipo: 'sgcComunicaciones', targetId: comunicacionId })
  },
})

export const createPublicacionDefinition = defineAgentMutation({
  args: {
    apiKey: v.string(),
    rondaId: v.id('rondas'),
    titulo: v.string(),
    contenido: v.string(),
    tipo: v.union(v.literal('resultado'), v.literal('comunicado'), v.literal('cronograma'), v.literal('evidencia')),
    visibleDesde: v.number(),
    visibleHasta: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentAdmin(ctx, args.apiKey)
    const actor = agent.email
    const now = Date.now()
    const id = await ctx.db.insert('sgcPublicaciones', {
      rondaId: args.rondaId,
      titulo: args.titulo,
      contenido: args.contenido,
      tipo: args.tipo,
      visibleDesde: args.visibleDesde,
      visibleHasta: args.visibleHasta,
      createdAt: now,
      createdBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.publicacion.creada', targetTipo: 'sgcPublicaciones', targetId: id })
    return id
  },
})

export const deletePublicacionDefinition = defineAgentMutation({
  args: { apiKey: v.string(), publicacionId: v.id('sgcPublicaciones') },
  handler: async (ctx, { apiKey, publicacionId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const pub = await ctx.db.get(publicacionId)
    if (!pub) throw new Error('Publicacion no encontrada.')
    await ctx.db.delete(publicacionId)
    await writeAudit(ctx, { rondaId: pub.rondaId, actor, evento: 'sgc.publicacion.eliminada', targetTipo: 'sgcPublicaciones', targetId: publicacionId })
  },
})

export const inicializarPanelSgcDefinition = defineAgentMutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const now = Date.now()
    const existingRevision = await ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
    if (!existingRevision) {
      const checks: Record<string, { cumple: boolean; observacion: string | null; updatedAt: number; updatedBy: string }> = {}
      for (const key of REVISION_CHECKS) checks[key] = { cumple: false, observacion: null, updatedAt: now, updatedBy: actor }
      checks.f_psea_11_no_aplica = { cumple: true, observacion: 'No aplica en Fase 1 inicial.', updatedAt: now, updatedBy: actor }
      await ctx.db.insert('sgcRevisionDatos', {
        rondaId,
        estado: 'borrador',
        checks,
        metricas: {},
        finalizadoAt: null,
        finalizadoBy: null,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      })
    }
    for (const formato of FORMATOS_ARCHIVO) {
      const existing = await ctx.db
        .query('sgcEvidenciaSeries')
        .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', rondaId).eq('formato', formato as string))
        .first()
      if (!existing) {
        await ctx.db.insert('sgcEvidenciaSeries', {
          rondaId,
          formato: formato as string,
          seccion: null,
          nombre: formato as string,
          requerida: true,
          publicaParticipante: false,
          createdAt: now,
          createdBy: actor,
          updatedAt: now,
          updatedBy: actor,
        })
      }
    }
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.panel.inicializado' })
  },
})

export const transitionRondaToDocumentacionPendienteDefinition = defineAgentMutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'activa') throw new Error('Solo una ronda activa puede pasar a documentacion pendiente.')
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.documentacion_pendiente' })
  },
})

export const transitionRondaToCerradaDefinition = defineAgentMutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas') },
  handler: async (ctx, { apiKey, rondaId }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'documentacion_pendiente') throw new Error('Solo una ronda en documentacion pendiente puede cerrarse.')
    await ctx.db.patch(rondaId, { estado: 'cerrada' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.cerrada' })
  },
})

export const reabrirRondaSgcDefinition = defineAgentMutation({
  args: { apiKey: v.string(), rondaId: v.id('rondas'), motivo: v.string() },
  handler: async (ctx, { apiKey, rondaId, motivo }) => {
    const agent = await requireAgentAdmin(ctx, apiKey)
    const actor = agent.email
    if (!motivo.trim()) throw new Error('Reabrir una ronda cerrada exige motivo.')
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'cerrada') throw new Error('Solo una ronda cerrada puede reabrirse.')
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.reabierta', detalle: motivo })
  },
})
