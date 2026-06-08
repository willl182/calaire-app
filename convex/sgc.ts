import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const FORMATOS_ARCHIVO = ['F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-14'] as const
type FormatoJustificable = 'F-PSEA-05' | 'F-PSEA-05A' | 'F-PSEA-12'
const REVISION_CHECKS = [
  'participantes_revisados',
  'fichas_revisadas',
  'envios_finales_revisados',
  'metricas_revisadas',
  'evidencias_revisadas',
  'inconsistencias_resueltas',
] as const

const formatoValidator = v.union(
  v.literal('F-PPSEA-03'),
  v.literal('F-PSEA-05'),
  v.literal('F-PSEA-05A'),
  v.literal('F-PSEA-06'),
  v.literal('F-PSEA-07'),
  v.literal('F-PSEA-08'),
  v.literal('F-PSEA-09'),
  v.literal('F-PSEA-10'),
  v.literal('F-PSEA-11'),
  v.literal('F-PSEA-12'),
  v.literal('F-PSEA-13'),
  v.literal('F-PSEA-14')
)

type SgcAuthCtx = QueryCtx | MutationCtx

function claimStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return []
}

function objectValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== 'object') return undefined
  return (source as Record<string, unknown>)[key]
}

function identityRoles(identity: unknown): string[] {
  const directClaims = [
    objectValue(identity, 'role'),
    objectValue(identity, 'roles'),
    objectValue(identity, 'org_role'),
    objectValue(identity, 'organizationRole'),
  ].flatMap(claimStrings)
  const customClaims = objectValue(identity, 'customClaims')
  const nestedClaims = [
    objectValue(customClaims, 'role'),
    objectValue(customClaims, 'roles'),
    objectValue(customClaims, 'org_role'),
    objectValue(customClaims, 'organizationRole'),
  ].flatMap(claimStrings)
  return [...directClaims, ...nestedClaims].map((role) => role.toLowerCase())
}

async function requireSgcAdmin(ctx: SgcAuthCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Autenticacion requerida para operar SGC.')
  if (!identityRoles(identity).includes('admin')) {
    throw new Error('Permisos insuficientes para operar SGC.')
  }
  return identity.email ?? identity.name ?? identity.tokenIdentifier
}

async function writeAudit(
  ctx: MutationCtx,
  args: {
    rondaId: Id<'rondas'>
    actor: string
    evento: string
    detalle?: string | null
    targetTipo?: string | null
    targetId?: string | null
  }
) {
  await ctx.db.insert('sgcAuditLog', {
    rondaId: args.rondaId,
    actor: args.actor,
    evento: args.evento,
    detalle: args.detalle ?? null,
    targetTipo: args.targetTipo ?? null,
    targetId: args.targetId ?? null,
    createdAt: Date.now(),
  })
}

async function getPlan(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
}

async function getRevision(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
}

async function collectCoverage(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  const [participantes, enviosPt, ptItems, sampleGroups, plan, revision, series, hitos, justificaciones, snapshots] = await Promise.all([
    ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('enviosPt').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('rondaPtSampleGroups').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    getPlan(ctx, rondaId),
    getRevision(ctx, rondaId),
    ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('sgcJustificaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('sgcRegistroSnapshots').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
  ])

  const fichas = await Promise.all(
    participantes.map((p) =>
      ctx.db
        .query('fichasRegistro')
        .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', p._id))
        .collect()
    )
  )
  const latestFichas = fichas.map((rows) => rows.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null)

  const vigenteByFormato: Record<string, boolean> = {}
  for (const serie of series) {
    const vigente = await ctx.db
      .query('sgcEvidenciaVersiones')
      .withIndex('by_serieId_and_estado', (q) => q.eq('serieId', serie._id).eq('estado', 'vigente'))
      .first()
    if (vigente) vigenteByFormato[serie.formato] = true
  }

  const justificacionesVigentes: Record<string, { razon: string; updatedAt: number; updatedBy: string }> = {}
  for (const justificacion of justificaciones) {
    if (justificacion.estado === 'vigente') {
      justificacionesVigentes[justificacion.formato] = {
        razon: justificacion.razon,
        updatedAt: justificacion.updatedAt,
        updatedBy: justificacion.updatedBy,
      }
    }
  }

  const codigos = participantes.map((p) => p.participantCode).filter((c): c is string => Boolean(c))
  const duplicateSet = new Set<string>()
  const seen = new Set<string>()
  for (const codigo of codigos) {
    if (seen.has(codigo)) duplicateSet.add(codigo)
    seen.add(codigo)
  }

  const enviosFinales = new Set(
    enviosPt.filter((envio) => envio.finalSubmittedAt != null).map((envio) => String(envio.rondaParticipanteId))
  ).size
  const enviosPtFinales = enviosPt.filter((envio) => envio.finalSubmittedAt != null)
  const enviosPtBorrador = enviosPt.filter((envio) => envio.finalSubmittedAt == null)
  const participantesReclamados = participantes.filter((p) => !p.workosUserId.startsWith('pendiente:')).length
  const celdasEsperadas = participantesReclamados * ptItems.length * sampleGroups.length
  const celdasFinales = enviosPtFinales.length
  const celdasFaltantes = Math.max(celdasEsperadas - celdasFinales, 0)
  const itemMap = new Map(ptItems.map((item) => [String(item._id), item]))
  const groupMap = new Map(sampleGroups.map((group) => [String(group._id), group]))
  const byContaminante = new Map<string, { esperadas: number; finales: number }>()
  const byGrupo = new Map<string, { esperadas: number; finales: number }>()

  for (const item of ptItems) {
    const current = byContaminante.get(item.contaminante) ?? { esperadas: 0, finales: 0 }
    current.esperadas += participantesReclamados * sampleGroups.length
    byContaminante.set(item.contaminante, current)
  }
  for (const group of sampleGroups) {
    const current = byGrupo.get(group.sampleGroup) ?? { esperadas: 0, finales: 0 }
    current.esperadas += participantesReclamados * ptItems.length
    byGrupo.set(group.sampleGroup, current)
  }
  for (const envio of enviosPtFinales) {
    const item = itemMap.get(String(envio.ptItemId))
    const group = groupMap.get(String(envio.sampleGroupId))
    if (item) {
      const current = byContaminante.get(item.contaminante) ?? { esperadas: 0, finales: 0 }
      current.finales += 1
      byContaminante.set(item.contaminante, current)
    }
    if (group) {
      const current = byGrupo.get(group.sampleGroup) ?? { esperadas: 0, finales: 0 }
      current.finales += 1
      byGrupo.set(group.sampleGroup, current)
    }
  }
  const formatCompleteness = (entries: Array<[string, { esperadas: number; finales: number }]>) =>
    entries.length === 0
      ? 'Sin configuracion PT'
      : entries
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, value]) => `${label}: ${value.finales}/${value.esperadas}`)
          .join('; ')

  return {
    planFinalizado: plan?.estado === 'finalizado',
    revisionFinalizada: revision?.estado === 'finalizado',
    snapshotsPlan: snapshots.filter((snapshot) => snapshot.tipoRegistro === 'plan_ronda').length,
    snapshotsRevision: snapshots.filter((snapshot) => snapshot.tipoRegistro === 'revision_datos').length,
    participantesEsperados: participantes.length,
    participantesReclamados,
    fichasEnviadas: latestFichas.filter((ficha) => ficha?.estado === 'enviado').length,
    codigosDuplicados: Array.from(duplicateSet),
    codigosProvisionales: participantes
      .map((p) => p.participantCode ?? '')
      .filter((codigo) => /^(pendiente|tmp|temp|provisional|sin-?codigo)/i.test(codigo)),
    enviosFinales,
    enviosEsperados: participantesReclamados,
    enviosPtBorrador: enviosPtBorrador.length,
    ptItemsConfigurados: ptItems.length,
    sampleGroupsConfigurados: sampleGroups.length,
    celdasEsperadas,
    celdasFinales,
    celdasFaltantes,
    completitudPorContaminante: formatCompleteness(Array.from(byContaminante.entries())),
    completitudPorGrupo: formatCompleteness(Array.from(byGrupo.entries())),
    evidenciasVigentes: vigenteByFormato,
    justificacionesVigentes,
    fPsea11NoAplica: revision?.checks?.f_psea_11_no_aplica?.cumple ?? false,
    fPsea11Razon: revision?.checks?.f_psea_11_no_aplica?.observacion ?? null,
    hitosBloqueantesPendientes: hitos.filter((h) => h.bloqueaCierre && !['completado', 'cancelado', 'no_aplica'].includes(h.estado)).length,
  }
}

function buildRevisionMetricas(coverage: Awaited<ReturnType<typeof collectCoverage>>) {
  return {
    participantes_esperados: coverage.participantesEsperados,
    participantes_reclamados: coverage.participantesReclamados,
    fichas_enviadas: coverage.fichasEnviadas,
    envios_finales: coverage.enviosFinales,
    envios_esperados: coverage.enviosEsperados,
    envios_pt_en_borrador: coverage.enviosPtBorrador,
    pt_items_configurados: coverage.ptItemsConfigurados,
    grupos_muestra_configurados: coverage.sampleGroupsConfigurados,
    celdas_esperadas: coverage.celdasEsperadas,
    celdas_finales: coverage.celdasFinales,
    celdas_faltantes: coverage.celdasFaltantes,
    completitud_por_contaminante: coverage.completitudPorContaminante,
    completitud_por_grupo: coverage.completitudPorGrupo,
    export_csv_pt_listo: coverage.celdasEsperadas > 0 && coverage.celdasFaltantes === 0,
    evidencia_f_psea_09_vigente: Boolean(coverage.evidenciasVigentes['F-PSEA-09']),
    evidencia_f_psea_10_vigente: Boolean(coverage.evidenciasVigentes['F-PSEA-10']),
    evidencia_f_psea_14_vigente: Boolean(coverage.evidenciasVigentes['F-PSEA-14']),
    codigos_duplicados: coverage.codigosDuplicados.length,
    codigos_provisionales: coverage.codigosProvisionales.length,
    hitos_bloqueantes_pendientes: coverage.hitosBloqueantesPendientes,
  }
}

function hasJustificacion(
  coverage: Awaited<ReturnType<typeof collectCoverage>>,
  formato: FormatoJustificable
) {
  return Boolean(coverage.justificacionesVigentes[formato]?.razon.trim())
}

function collectChecklistFaltantes(coverage: Awaited<ReturnType<typeof collectCoverage>>) {
  const faltantes: string[] = []
  const planOk = coverage.planFinalizado && coverage.snapshotsPlan > 0
  const revisionOk = coverage.revisionFinalizada && coverage.snapshotsRevision > 0
  const f05Ok =
    (coverage.participantesEsperados > 0 &&
      coverage.participantesReclamados >= coverage.participantesEsperados) ||
    hasJustificacion(coverage, 'F-PSEA-05')
  const f05aOk =
    (coverage.participantesEsperados > 0 &&
      coverage.fichasEnviadas >= coverage.participantesEsperados) ||
    hasJustificacion(coverage, 'F-PSEA-05A')
  const f07Ok =
    coverage.participantesEsperados > 0 &&
    coverage.codigosDuplicados.length === 0 &&
    coverage.codigosProvisionales.length === 0
  const f12Ok =
    coverage.enviosEsperados === 0 ||
    coverage.enviosFinales >= coverage.enviosEsperados ||
    hasJustificacion(coverage, 'F-PSEA-12')
  const f11Ok = coverage.fPsea11NoAplica && Boolean(coverage.fPsea11Razon?.trim())

  if (!planOk) faltantes.push('F-PPSEA-03/F-PSEA-06 plan finalizado con snapshot')
  if (!f05Ok) faltantes.push('F-PSEA-05 participantes reclamados o justificados')
  if (!f05aOk) faltantes.push('F-PSEA-05A fichas enviadas o justificadas')
  if (!f07Ok) faltantes.push('F-PSEA-07 codigos unicos y no provisionales')
  for (const formato of FORMATOS_ARCHIVO) {
    if (!coverage.evidenciasVigentes[formato]) faltantes.push(`${formato} evidencia vigente`)
  }
  if (!f11Ok) faltantes.push('F-PSEA-11 no aplica con razon')
  if (!f12Ok) faltantes.push('F-PSEA-12 envios finales completos o justificados')
  if (!revisionOk) faltantes.push('F-PSEA-13 finalizado con snapshot')
  if (coverage.hitosBloqueantesPendientes > 0) faltantes.push('hitos bloqueantes pendientes')
  return faltantes
}

async function createSnapshot(
  ctx: MutationCtx,
  args: { rondaId: Id<'rondas'>; tipoRegistro: string; registroId: string; payload: unknown; actor: string }
) {
  const existing = await ctx.db
    .query('sgcRegistroSnapshots')
    .withIndex('by_rondaId_and_tipoRegistro', (q) => q.eq('rondaId', args.rondaId).eq('tipoRegistro', args.tipoRegistro))
    .collect()
  const version = existing.filter((row) => row.registroId === args.registroId).length + 1
  await ctx.db.insert('sgcRegistroSnapshots', {
    rondaId: args.rondaId,
    tipoRegistro: args.tipoRegistro,
    registroId: args.registroId,
    version,
    payload: args.payload,
    createdAt: Date.now(),
    createdBy: args.actor,
  })
}

function summarizeSnapshotPayload(tipoRegistro: string, payload: unknown) {
  if (!payload || typeof payload !== 'object') return 'Snapshot sin payload estructurado.'
  const record = payload as Record<string, unknown>
  const estado = typeof record.estado === 'string' ? record.estado : 'sin estado'
  const finalizadoBy = typeof record.finalizadoBy === 'string' ? record.finalizadoBy : null
  const finalizadoAt = typeof record.finalizadoAt === 'number' ? record.finalizadoAt : null

  if (tipoRegistro === 'plan_ronda') {
    const bloques = record.bloques && typeof record.bloques === 'object' ? Object.values(record.bloques).filter(Boolean).length : 0
    const responsable =
      record.camposEstructurados &&
      typeof record.camposEstructurados === 'object' &&
      typeof (record.camposEstructurados as Record<string, unknown>).responsable === 'string'
        ? String((record.camposEstructurados as Record<string, unknown>).responsable)
        : 'sin responsable'
    return `Plan ${estado}; ${bloques} bloques con contenido; responsable ${responsable}; finalizado por ${finalizadoBy ?? 'sin dato'}${finalizadoAt ? ` en ${new Date(finalizadoAt).toISOString()}` : ''}.`
  }

  if (tipoRegistro === 'revision_datos') {
    const checks = record.checks && typeof record.checks === 'object' ? Object.values(record.checks as Record<string, { cumple?: unknown }> ) : []
    const cumplidos = checks.filter((check) => check?.cumple === true).length
    const metricas = record.metricas && typeof record.metricas === 'object' ? Object.keys(record.metricas).length : 0
    return `Revision ${estado}; ${cumplidos}/${checks.length} checks cumplen; ${metricas} metricas; finalizada por ${finalizadoBy ?? 'sin dato'}${finalizadoAt ? ` en ${new Date(finalizadoAt).toISOString()}` : ''}.`
  }

  return `Registro ${tipoRegistro} en estado ${estado}.`
}

export const getPanelSgc = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) return null
    const [plan, revision, hitos, series, justificaciones, snapshots, audit] = await Promise.all([
      getPlan(ctx, rondaId),
      getRevision(ctx, rondaId),
      ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcJustificaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcRegistroSnapshots').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(10),
      ctx.db.query('sgcAuditLog').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').take(20),
    ])
    const coverage = await collectCoverage(ctx, rondaId)
    const metricasActuales = buildRevisionMetricas(coverage)
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
    return { ronda, plan, revision, hitos, series, justificaciones, versiones, snapshots: snapshotSummaries, audit, coverage, metricasActuales }
  },
})

export const getPlanRonda = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return getPlan(ctx, rondaId)
  },
})

export const getRevisionDatos = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return getRevision(ctx, rondaId)
  },
})

export const listHitosRonda = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
})

export const listEvidenciaSeries = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcEvidenciaSeries').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  },
})

export const listEvidenciaVersiones = query({
  args: { serieId: v.id('sgcEvidenciaSeries'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { serieId, paginationOpts }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcEvidenciaVersiones').withIndex('by_serieId', (q) => q.eq('serieId', serieId)).order('desc').paginate(paginationOpts)
  },
})

export const listAuditLog = query({
  args: { rondaId: v.id('rondas'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { rondaId, paginationOpts }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcAuditLog').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').paginate(paginationOpts)
  },
})

export const listSnapshots = query({
  args: { rondaId: v.id('rondas'), tipoRegistro: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { rondaId, tipoRegistro, paginationOpts }) => {
    await requireSgcAdmin(ctx)
    return ctx.db
      .query('sgcRegistroSnapshots')
      .withIndex('by_rondaId_and_tipoRegistro', (q) => q.eq('rondaId', rondaId).eq('tipoRegistro', tipoRegistro))
      .order('desc')
      .paginate(paginationOpts)
  },
})

export const getDownloadUrl = query({
  args: { evidenciaVersionId: v.id('sgcEvidenciaVersiones') },
  handler: async (ctx, { evidenciaVersionId }) => {
    await requireSgcAdmin(ctx)
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) return null
    return ctx.storage.getUrl(version.storageId)
  },
})

export const getEvidenciaVersionContext = query({
  args: { evidenciaVersionId: v.id('sgcEvidenciaVersiones') },
  handler: async (ctx, { evidenciaVersionId }) => {
    await requireSgcAdmin(ctx)
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) return null
    return {
      _id: version._id,
      rondaId: version.rondaId,
      serieId: version.serieId,
      estado: version.estado,
      fileName: version.fileName,
    }
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSgcAdmin(ctx)
    return ctx.storage.generateUploadUrl()
  },
})

export const createOrUpdatePlanRonda = mutation({
  args: {
    rondaId: v.id('rondas'),
    bloques: v.record(v.string(), v.string()),
    camposEstructurados: v.record(v.string(), v.string()),
    motivoRevision: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    const existing = await getPlan(ctx, args.rondaId)
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

export const finalizarPlanRonda = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const plan = await getPlan(ctx, rondaId)
    if (!plan) throw new Error('No existe plan de ronda.')
    const now = Date.now()
    await ctx.db.patch(plan._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    const updated = await ctx.db.get(plan._id)
    await createSnapshot(ctx, { rondaId, tipoRegistro: 'plan_ronda', registroId: String(plan._id), payload: updated, actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.plan.finalizado', targetTipo: 'sgcPlanRonda', targetId: plan._id })
  },
})

export const createOrUpdateRevisionDatos = mutation({
  args: {
    rondaId: v.id('rondas'),
    checks: v.record(v.string(), v.object({ cumple: v.boolean(), observacion: v.union(v.string(), v.null()) })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    const coverage = await collectCoverage(ctx, args.rondaId)
    const metricas = { ...buildRevisionMetricas(coverage), ...args.metricas }
    const checks = Object.fromEntries(
      Object.entries(args.checks).map(([key, value]) => [key, { ...value, updatedAt: now, updatedBy: actor }])
    )
    const existing = await getRevision(ctx, args.rondaId)
    if (existing) {
      await ctx.db.patch(existing._id, { checks, metricas, estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado, updatedAt: now, updatedBy: actor })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.revision.actualizada', targetTipo: 'sgcRevisionDatos', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcRevisionDatos', {
      rondaId: args.rondaId,
      estado: 'borrador',
      checks,
      metricas,
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

export const finalizarRevisionDatos = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const revision = await getRevision(ctx, rondaId)
    if (!revision) throw new Error('No existe revision de datos.')
    for (const [key, check] of Object.entries(revision.checks)) {
      if (!check.cumple && !check.observacion?.trim()) {
        throw new Error(`El check ${key} no cumple y requiere observacion.`)
      }
    }
    const now = Date.now()
    await ctx.db.patch(revision._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    const updated = await ctx.db.get(revision._id)
    await createSnapshot(ctx, { rondaId, tipoRegistro: 'revision_datos', registroId: String(revision._id), payload: updated, actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.revision.finalizada', targetTipo: 'sgcRevisionDatos', targetId: revision._id })
  },
})

export const createHitoRonda = mutation({
  args: {
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
    const actor = await requireSgcAdmin(ctx)
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

export const updateHitoRonda = mutation({
  args: {
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
    const actor = await requireSgcAdmin(ctx)
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

export const createEvidenciaSeries = mutation({
  args: {
    rondaId: v.id('rondas'),
    formato: formatoValidator,
    seccion: v.union(v.string(), v.null()),
    nombre: v.string(),
    requerida: v.boolean(),
    publicaParticipante: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const existing = await ctx.db
      .query('sgcEvidenciaSeries')
      .withIndex('by_rondaId_and_formato', (q) => q.eq('rondaId', args.rondaId).eq('formato', args.formato))
      .first()
    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { nombre: args.nombre, requerida: args.requerida, publicaParticipante: args.publicaParticipante, seccion: args.seccion, updatedAt: now, updatedBy: actor })
      return existing._id
    }
    const id = await ctx.db.insert('sgcEvidenciaSeries', { rondaId: args.rondaId, formato: args.formato, seccion: args.seccion, nombre: args.nombre, requerida: args.requerida, publicaParticipante: args.publicaParticipante, createdAt: now, createdBy: actor, updatedAt: now, updatedBy: actor })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.evidencia.serie_creada', targetTipo: 'sgcEvidenciaSeries', targetId: id })
    return id
  },
})

export const registrarEvidenciaVersion = mutation({
  args: {
    serieId: v.id('sgcEvidenciaSeries'),
    storageId: v.id('_storage'),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    hash: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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

export const retirarEvidenciaVersion = mutation({
  args: { evidenciaVersionId: v.id('sgcEvidenciaVersiones'), motivo: v.string() },
  handler: async (ctx, { evidenciaVersionId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    if (!motivo.trim()) throw new Error('Retirar evidencia exige motivo.')
    const version = await ctx.db.get(evidenciaVersionId)
    if (!version) throw new Error('Version no encontrada.')
    await ctx.db.patch(evidenciaVersionId, { estado: 'retirada', motivoRetiro: motivo, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: version.rondaId, actor, evento: 'sgc.evidencia.version_retirada', detalle: motivo, targetTipo: 'sgcEvidenciaVersiones', targetId: evidenciaVersionId })
  },
})

export const upsertJustificacion = mutation({
  args: {
    rondaId: v.id('rondas'),
    formato: v.union(v.literal('F-PSEA-05'), v.literal('F-PSEA-05A'), v.literal('F-PSEA-12')),
    alcance: v.string(),
    razon: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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

export const retirarJustificacion = mutation({
  args: {
    justificacionId: v.id('sgcJustificaciones'),
    motivo: v.string(),
  },
  handler: async (ctx, { justificacionId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    if (!motivo.trim()) throw new Error('Retirar una justificacion exige motivo.')
    const justificacion = await ctx.db.get(justificacionId)
    if (!justificacion) throw new Error('Justificacion no encontrada.')
    await ctx.db.patch(justificacionId, { estado: 'retirada', updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, { rondaId: justificacion.rondaId, actor, evento: 'sgc.justificacion.retirada', detalle: motivo, targetTipo: 'sgcJustificaciones', targetId: justificacionId })
  },
})

export const transitionRondaToDocumentacionPendiente = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'activa') throw new Error('Solo una ronda activa puede pasar a documentacion pendiente.')
    const coverage = await collectCoverage(ctx, rondaId)
    if (coverage.participantesEsperados === 0) throw new Error('Debe identificar participantes esperados.')
    const faltantes = collectChecklistFaltantes(coverage).filter((faltante) =>
      [
        'F-PPSEA-03/F-PSEA-06 plan finalizado con snapshot',
        'F-PSEA-05 participantes reclamados o justificados',
        'F-PSEA-05A fichas enviadas o justificadas',
        'F-PSEA-07 codigos unicos y no provisionales',
        'F-PSEA-12 envios finales completos o justificados',
      ].includes(faltante)
    )
    if (faltantes.length > 0) throw new Error(`No se puede pasar a documentacion pendiente. Faltan: ${faltantes.join(', ')}.`)
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.documentacion_pendiente' })
  },
})

export const transitionRondaToCerrada = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'documentacion_pendiente') throw new Error('Solo una ronda en documentacion pendiente puede cerrarse.')
    const coverage = await collectCoverage(ctx, rondaId)
    const faltantes = collectChecklistFaltantes(coverage)
    if (faltantes.length > 0) throw new Error(`No se puede cerrar. Faltan: ${faltantes.join(', ')}.`)
    await ctx.db.patch(rondaId, { estado: 'cerrada' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.cerrada' })
  },
})

export const reabrirRondaSgc = mutation({
  args: { rondaId: v.id('rondas'), motivo: v.string() },
  handler: async (ctx, { rondaId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    if (!motivo.trim()) throw new Error('Reabrir una ronda cerrada exige motivo.')
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('La ronda no existe.')
    if (ronda.estado !== 'cerrada') throw new Error('Solo una ronda cerrada puede reabrirse.')
    await ctx.db.patch(rondaId, { estado: 'documentacion_pendiente' })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.ronda.reabierta', detalle: motivo })
  },
})

export const inicializarPanelSgc = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
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
})
