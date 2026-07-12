import { v } from 'convex/values'
import { calcularChecklistSgc, derivarBloqueantes } from '../_lib/sgc/checklist'
import { FORMATOS_ARCHIVO, REVISION_CHECKS, HOMOGENEIDAD_CHECKS, requireSgcManage, writeAudit, getPlan, getRevision, getRevisionHomogeneidadDoc, collectCoverage, buildRevisionMetricas, buildHomogeneidadMetricas, collectChecklistFaltantes, collectChecklistFaltantesDocumentacionPendiente, collectDriveCierreCalidad, summarizeSnapshotPayload, SgcQueryConfig, SgcMutationConfig } from './shared'

const getPanelSgcArgs = { rondaId: v.id('rondas') }

export const getPanelSgcConfig = {
  args: getPanelSgcArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcManage(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) return null
    const [plan, revision, revisionHomogeneidad, hitos, series, justificaciones, snapshots, audit, comentarios, notificaciones, resultadosPtApp, casos, participantes] = await Promise.all([
      getPlan(ctx, rondaId),
      getRevision(ctx, rondaId),
      getRevisionHomogeneidadDoc(ctx, rondaId),
      ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcJustificaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcRegistroSnapshots').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(10),
      ctx.db.query('sgcAuditLog').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(20),
      ctx.db.query('sgcComentariosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(20),
      ctx.db.query('sgcNotificaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(20),
      ctx.db.query('sgcResultadosPtApp').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcCasos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(30),
      ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ])
    const coverage = await collectCoverage(ctx, rondaId)
    const driveCierre = await collectDriveCierreCalidad(ctx, rondaId)
    const checklistBloqueantesCierre = collectChecklistFaltantes(coverage)
    const checklistBloqueantesDocumentacionPendiente = collectChecklistFaltantesDocumentacionPendiente(coverage)
    const metricasActuales = buildRevisionMetricas(coverage)
    const metricasHomogeneidadActuales = buildHomogeneidadMetricas(coverage)
    const versiones = await Promise.all(
      series.map(async (serie) => {
        const vigente = await ctx.db
          .query('sgcEvidenciaVersiones')
          .withIndex('by_serieId_and_estado', (q) => q.eq('serieId', serie._id).eq('estado', 'vigente'))
          .first()
        return { serieId: serie._id, vigente }
      })
    )
    const snapshotSummaries = snapshots.map((snapshot) => ({
      _id: snapshot._id,
      tipoRegistro: snapshot.tipoRegistro,
      registroId: snapshot.registroId,
      version: snapshot.version,
      createdAt: snapshot.createdAt,
      createdBy: snapshot.createdBy,
      resumen: summarizeSnapshotPayload(snapshot.tipoRegistro, snapshot.payload),
    }))
    const destinatariosNotificacion = participantes
      .map((participante) => ({
        _id: participante._id,
        email: participante.email,
        participantCode: participante.participantCode ?? null,
        participantProfile: participante.participantProfile,
        claimedAt: participante.claimedAt ?? null,
      }))
      .sort((a, b) => (a.participantCode ?? a.email).localeCompare(b.participantCode ?? b.email))
    return { ronda, plan, revision, revisionHomogeneidad, hitos, series, justificaciones, versiones, snapshots: snapshotSummaries, audit, comentarios, notificaciones, resultadosPtApp, casos, destinatariosNotificacion, coverage, driveCierre, checklistBloqueantesCierre, checklistBloqueantesDocumentacionPendiente, metricasActuales, metricasHomogeneidadActuales }
  },
} satisfies SgcQueryConfig<typeof getPanelSgcArgs>

const generateUploadUrlArgs = {}

export const generateUploadUrlConfig = {
  args: generateUploadUrlArgs,
  handler: async (ctx) => {
    await requireSgcManage(ctx)
    return ctx.storage.generateUploadUrl()
  },
} satisfies SgcMutationConfig<typeof generateUploadUrlArgs>

const transitionRondaToDocumentacionPendienteArgs = { rondaId: v.id('rondas') }

export const transitionRondaToDocumentacionPendienteConfig = {
  args: transitionRondaToDocumentacionPendienteArgs,
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcManage(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'activa') throw new Error('Solo una ronda activa puede pasar a documentacion pendiente.')
    const coverage = await collectCoverage(ctx, rondaId)
    if (coverage.participantesEsperados === 0) throw new Error('Debe identificar participantes esperados.')
    const faltantes = collectChecklistFaltantesDocumentacionPendiente(coverage)
    const driveCierre = await collectDriveCierreCalidad(ctx, rondaId)
    const faltantesCierre = [...faltantes, ...driveCierre.bloqueantes]
    if (faltantesCierre.length > 0) throw new Error(`No se puede pasar a documentacion pendiente. Faltan: ${faltantesCierre.join(', ')}.`)
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, {
      rondaId,
      actor,
      evento: 'sgc.ronda.documentacion_pendiente',
      detalle: `driveAdvertencias=${driveCierre.advertencias.length}`,
    })
  },
} satisfies SgcMutationConfig<typeof transitionRondaToDocumentacionPendienteArgs>

const transitionRondaToCerradaArgs = { rondaId: v.id('rondas') }

export const transitionRondaToCerradaConfig = {
  args: transitionRondaToCerradaArgs,
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcManage(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'documentacion_pendiente') throw new Error('Solo una ronda en documentacion pendiente puede cerrarse.')
    const coverage = await collectCoverage(ctx, rondaId)
    const faltantes = collectChecklistFaltantes(coverage)
    const driveCierre = await collectDriveCierreCalidad(ctx, rondaId)
    const faltantesCierre = [...faltantes, ...driveCierre.bloqueantes]
    if (faltantesCierre.length > 0) throw new Error(`No se puede cerrar. Faltan: ${faltantesCierre.join(', ')}.`)
    await ctx.db.patch(rondaId, { estado: 'cerrada' })
    await writeAudit(ctx, {
      rondaId,
      actor,
      evento: 'sgc.ronda.cerrada',
      detalle: `driveAdvertencias=${driveCierre.advertencias.length}`,
    })
  },
} satisfies SgcMutationConfig<typeof transitionRondaToCerradaArgs>

const reabrirRondaSgcArgs = { rondaId: v.id('rondas'), motivo: v.string() }

export const reabrirRondaSgcConfig = {
  args: reabrirRondaSgcArgs,
  handler: async (ctx, { rondaId, motivo }) => {
    const actor = await requireSgcManage(ctx)
    if (!motivo.trim()) throw new Error('Reabrir una ronda cerrada exige motivo.')
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'cerrada') throw new Error('Solo una ronda cerrada puede reabrirse.')
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.reabierta', detalle: motivo })
  },
} satisfies SgcMutationConfig<typeof reabrirRondaSgcArgs>

const inicializarPanelSgcArgs = { rondaId: v.id('rondas') }

export const inicializarPanelSgcConfig = {
  args: inicializarPanelSgcArgs,
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcManage(ctx)
    const now = Date.now()
    const existingRevision = await getRevision(ctx, rondaId)
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
    const existingHomogeneidad = await getRevisionHomogeneidadDoc(ctx, rondaId)
    if (!existingHomogeneidad) {
      const checks: Record<string, { cumple: boolean; observacion: string | null; updatedAt: number; updatedBy: string }> = {}
      for (const key of HOMOGENEIDAD_CHECKS) checks[key] = { cumple: false, observacion: null, updatedAt: now, updatedBy: actor }
      await ctx.db.insert('sgcRevisionHomogeneidad', {
        rondaId,
        estado: 'borrador',
        checks,
        metricas: {},
        conclusiones: null,
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
        .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', rondaId).eq('formato', formato))
        .first()
      if (!existing) {
        await ctx.db.insert('sgcEvidenciaSeries', {
          rondaId,
          formato,
          seccion: null,
          nombre: formato,
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
} satisfies SgcMutationConfig<typeof inicializarPanelSgcArgs>

const listRondasSgcResumenArgs = {}

export const listRondasSgcResumenConfig = {
  args: listRondasSgcResumenArgs,
  handler: async (ctx) => {
    try {
      const rondas = await ctx.db.query('rondas').order('desc').collect()
      return await Promise.all(
        rondas.map(async (ronda) => {
          try {
            const coverage = await collectCoverage(ctx, ronda._id)
            const checklist = calcularChecklistSgc(coverage)
            const bloqueantes = derivarBloqueantes(checklist)
            const progreso =
              checklist.length === 0
                ? 0
                : Math.round(
                    (checklist.filter((item) => item.estado === 'completo' || item.estado === 'no_aplica').length /
                      checklist.length) *
                      100
                  )
            return {
              _id: ronda._id,
              codigo: ronda.codigo,
              nombre: ronda.nombre,
              estado: ronda.estado,
              progreso,
              bloqueantes,
              checklist,
            }
          } catch (error) {
            return {
              _id: ronda._id,
              codigo: ronda.codigo,
              nombre: ronda.nombre,
              estado: ronda.estado,
              progreso: 0,
              bloqueantes: [
                error instanceof Error ? `Error al calcular cobertura: ${error.message}` : 'Error al calcular cobertura.',
              ],
              checklist: [],
            }
          }
        })
      )
    } catch {
      return []
    }
  },
} satisfies SgcQueryConfig<typeof listRondasSgcResumenArgs>
