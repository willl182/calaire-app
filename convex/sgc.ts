import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { calcularChecklistSgc, derivarBloqueantes } from '../lib/sgc/checklist'

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
const HOMOGENEIDAD_CHECKS = [
  'plan_muestreo_revisado',
  'criterios_aceptacion_definidos',
  'resultados_homogeneidad_revisados',
  'resultados_estabilidad_revisados',
  'desviaciones_documentadas',
  'conclusion_lote_aprobada',
] as const

const DOCUMENTO_SGC_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/markdown',
  'text/plain',
  'image/png',
  'image/jpeg',
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

const PENDING_PARTICIPANTE_PREFIX = 'pendiente:'

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function safeLabel(value: unknown, fallback: string) {
  const label = safeString(value).trim()
  return label || fallback
}

function isParticipanteReclamado(workosUserId: unknown) {
  const userId = safeString(workosUserId)
  return userId !== '' && !userId.startsWith(PENDING_PARTICIPANTE_PREFIX)
}

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

async function requireParticipanteOAdmin(ctx: SgcAuthCtx, rondaId: Id<'rondas'>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Autenticacion requerida.')
  const roles = identityRoles(identity)
  if (roles.includes('admin')) {
    return identity.email ?? identity.name ?? identity.tokenIdentifier
  }
  const participante = await ctx.db
    .query('rondaParticipantes')
    .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', identity.subject))
    .first()
  if (!participante) {
    throw new Error('No tiene acceso a esta ronda.')
  }
  return identity.email ?? identity.name ?? identity.tokenIdentifier
}

async function requireParticipante(ctx: SgcAuthCtx, rondaId: Id<'rondas'>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Autenticacion requerida.')
  const participante = await ctx.db
    .query('rondaParticipantes')
    .withIndex('by_ronda_user', (q) => q.eq('rondaId', rondaId).eq('workosUserId', identity.subject))
    .first()
  if (!participante) throw new Error('No tiene acceso a esta ronda.')
  return {
    participante,
    actor: identity.email ?? identity.name ?? identity.tokenIdentifier,
    email: identity.email ?? participante.email,
    name: identity.name ?? participante.email,
  }
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

async function getRevisionHomogeneidadDoc(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcRevisionHomogeneidad').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
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

  const codigos = participantes
    .map((p) => safeString(p.participantCode).trim())
    .filter((codigo) => codigo.length > 0)
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
  const participantesReclamados = participantes.filter((p) => isParticipanteReclamado(p.workosUserId)).length
  const celdasEsperadas = participantesReclamados * ptItems.length * sampleGroups.length
  const celdasFinales = enviosPtFinales.length
  const celdasFaltantes = Math.max(celdasEsperadas - celdasFinales, 0)
  const itemMap = new Map(ptItems.map((item) => [String(item._id), item]))
  const groupMap = new Map(sampleGroups.map((group) => [String(group._id), group]))
  const byContaminante = new Map<string, { esperadas: number; finales: number }>()
  const byGrupo = new Map<string, { esperadas: number; finales: number }>()

  for (const item of ptItems) {
    const contaminante = safeLabel(item.contaminante, 'Sin contaminante')
    const current = byContaminante.get(contaminante) ?? { esperadas: 0, finales: 0 }
    current.esperadas += participantesReclamados * sampleGroups.length
    byContaminante.set(contaminante, current)
  }
  for (const group of sampleGroups) {
    const sampleGroup = safeLabel(group.sampleGroup, 'Sin grupo')
    const current = byGrupo.get(sampleGroup) ?? { esperadas: 0, finales: 0 }
    current.esperadas += participantesReclamados * ptItems.length
    byGrupo.set(sampleGroup, current)
  }
  for (const envio of enviosPtFinales) {
    const item = itemMap.get(String(envio.ptItemId))
    const group = groupMap.get(String(envio.sampleGroupId))
    if (item) {
      const contaminante = safeLabel(item.contaminante, 'Sin contaminante')
      const current = byContaminante.get(contaminante) ?? { esperadas: 0, finales: 0 }
      current.finales += 1
      byContaminante.set(contaminante, current)
    }
    if (group) {
      const sampleGroup = safeLabel(group.sampleGroup, 'Sin grupo')
      const current = byGrupo.get(sampleGroup) ?? { esperadas: 0, finales: 0 }
      current.finales += 1
      byGrupo.set(sampleGroup, current)
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
      .map((p) => safeString(p.participantCode))
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

function buildHomogeneidadMetricas(coverage: Awaited<ReturnType<typeof collectCoverage>>) {
  return {
    items_pt_configurados: coverage.ptItemsConfigurados,
    grupos_muestra_configurados: coverage.sampleGroupsConfigurados,
    evidencia_f_psea_08_vigente: Boolean(coverage.evidenciasVigentes['F-PSEA-08']),
    resultado_homogeneidad_aprobado: false,
    resultado_estabilidad_aprobado: false,
    celdas_finales_disponibles: coverage.celdasFinales,
    celdas_faltantes: coverage.celdasFaltantes,
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

  if (tipoRegistro === 'revision_homogeneidad') {
    const checks = record.checks && typeof record.checks === 'object' ? Object.values(record.checks as Record<string, { cumple?: unknown }> ) : []
    const cumplidos = checks.filter((check) => check?.cumple === true).length
    const conclusiones = typeof record.conclusiones === 'string' && record.conclusiones.trim() ? record.conclusiones.trim() : 'sin conclusion'
    return `F-PSEA-08 ${estado}; ${cumplidos}/${checks.length} checks cumplen; conclusion: ${conclusiones}; finalizado por ${finalizadoBy ?? 'sin dato'}${finalizadoAt ? ` en ${new Date(finalizadoAt).toISOString()}` : ''}.`
  }

  return `Registro ${tipoRegistro} en estado ${estado}.`
}

function buildCodigoCaso(existingCount: number) {
  return `SGC-${String(existingCount + 1).padStart(4, '0')}`
}

async function writeGlobalAudit(
  ctx: MutationCtx,
  args: {
    actor: string
    evento: string
    detalle?: string | null
    targetTipo?: string | null
    targetId?: string | null
  }
) {
  const ronda = await ctx.db.query('rondas').order('asc').first()
  if (!ronda) return
  await writeAudit(ctx, {
    rondaId: ronda._id,
    actor: args.actor,
    evento: args.evento,
    detalle: args.detalle ?? null,
    targetTipo: args.targetTipo ?? null,
    targetId: args.targetId ?? null,
  })
}

function normalizeCodigoDocumento(codigo: string) {
  return codigo.trim().toUpperCase()
}

export const getPanelSgc = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
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
    return { ronda, plan, revision, revisionHomogeneidad, hitos, series, justificaciones, versiones, snapshots: snapshotSummaries, audit, comentarios, notificaciones, resultadosPtApp, casos, destinatariosNotificacion, coverage, metricasActuales, metricasHomogeneidadActuales }
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

export const getRevisionHomogeneidad = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return getRevisionHomogeneidadDoc(ctx, rondaId)
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

export const listDocumentosSgc = query({
  args: {
    proceso: v.optional(v.union(v.string(), v.null())),
    estado: v.optional(v.union(v.literal('borrador'), v.literal('vigente'), v.literal('obsoleto'), v.literal('en_revision'), v.null())),
  },
  handler: async (ctx, args) => {
    await requireSgcAdmin(ctx)
    if (args.proceso?.trim() && args.estado) {
      return ctx.db
        .query('documentosSgc')
        .withIndex('by_proceso_and_estado', (q) => q.eq('proceso', args.proceso!.trim()).eq('estado', args.estado!))
        .collect()
    }
    if (args.proceso?.trim()) {
      return ctx.db.query('documentosSgc').withIndex('by_proceso', (q) => q.eq('proceso', args.proceso!.trim())).collect()
    }
    if (args.estado) {
      return ctx.db.query('documentosSgc').withIndex('by_estado', (q) => q.eq('estado', args.estado!)).collect()
    }
    return ctx.db.query('documentosSgc').collect()
  },
})

export const listMatrizDocumentalSgc = query({
  args: {},
  handler: async (ctx) => {
    try {
      const documentos = await ctx.db.query('documentosSgc').collect()
      const versiones = await Promise.all(
        documentos.map(async (documento) => {
          const vigente = await ctx.db
            .query('documentoSgcVersiones')
            .withIndex('by_documentoId_and_estado', (q) => q.eq('documentoId', documento._id).eq('estado', 'vigente'))
            .first()
          const historial = await ctx.db
            .query('documentoSgcVersiones')
            .withIndex('by_documentoId', (q) => q.eq('documentoId', documento._id))
            .order('desc')
            .take(5)
          return { documentoId: documento._id, vigente, historial }
        })
      )
      const procesos = Array.from(new Set(documentos.map((doc) => doc.proceso))).sort((a, b) => a.localeCompare(b))
      return {
        documentos: documentos.sort((a, b) => a.proceso.localeCompare(b.proceso) || a.codigo.localeCompare(b.codigo)),
        versiones,
        procesos,
        resumen: {
          total: documentos.length,
          vigentes: documentos.filter((doc) => doc.estado === 'vigente').length,
          enRevision: documentos.filter((doc) => doc.estado === 'en_revision').length,
          obsoletos: documentos.filter((doc) => doc.estado === 'obsoleto').length,
        },
      }
    } catch {
      return {
        documentos: [],
        versiones: [],
        procesos: [],
        resumen: { total: 0, vigentes: 0, enRevision: 0, obsoletos: 0 },
      }
    }
  },
})

export const listDocumentoSgcVersiones = query({
  args: { documentoId: v.id('documentosSgc'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { documentoId, paginationOpts }) => {
    await requireSgcAdmin(ctx)
    return ctx.db
      .query('documentoSgcVersiones')
      .withIndex('by_documentoId', (q) => q.eq('documentoId', documentoId))
      .order('desc')
      .paginate(paginationOpts)
  },
})

export const getDocumentoSgcDownloadUrl = query({
  args: { versionId: v.id('documentoSgcVersiones') },
  handler: async (ctx, { versionId }) => {
    await requireSgcAdmin(ctx)
    const version = await ctx.db.get(versionId)
    if (!version?.storageId) return null
    return ctx.storage.getUrl(version.storageId)
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

export const upsertDocumentoSgc = mutation({
  args: {
    documentoId: v.union(v.id('documentosSgc'), v.null()),
    codigo: v.string(),
    nombre: v.string(),
    proceso: v.string(),
    tipo: v.union(v.literal('formato'), v.literal('procedimiento'), v.literal('instructivo'), v.literal('plantilla'), v.literal('registro'), v.literal('otro')),
    estado: v.union(v.literal('borrador'), v.literal('vigente'), v.literal('obsoleto'), v.literal('en_revision')),
    propietario: v.string(),
    criticidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta')),
    retencion: v.union(v.string(), v.null()),
    ubicacionFuente: v.union(v.string(), v.null()),
    notas: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const codigo = normalizeCodigoDocumento(args.codigo)
    const nombre = args.nombre.trim()
    const proceso = args.proceso.trim()
    if (!codigo || !nombre || !proceso) throw new Error('Codigo, nombre y proceso son obligatorios.')
    const existingByCodigo = await ctx.db.query('documentosSgc').withIndex('by_codigo', (q) => q.eq('codigo', codigo)).first()
    if (existingByCodigo && existingByCodigo._id !== args.documentoId) {
      throw new Error('Ya existe un documento SGC con ese codigo.')
    }
    const now = Date.now()
    const patch = {
      codigo,
      nombre,
      proceso,
      tipo: args.tipo,
      estado: args.estado,
      propietario: args.propietario.trim() || actor,
      criticidad: args.criticidad,
      retencion: args.retencion?.trim() || null,
      ubicacionFuente: args.ubicacionFuente?.trim() || null,
      notas: args.notas?.trim() || null,
      updatedAt: now,
      updatedBy: actor,
    }
    if (args.documentoId) {
      const documento = await ctx.db.get(args.documentoId)
      if (!documento) throw new Error('Documento SGC no encontrado.')
      await ctx.db.patch(args.documentoId, patch)
      await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.actualizado', detalle: codigo, targetTipo: 'documentosSgc', targetId: args.documentoId })
      return args.documentoId
    }
    const id = await ctx.db.insert('documentosSgc', {
      ...patch,
      createdAt: now,
      createdBy: actor,
    })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.creado', detalle: codigo, targetTipo: 'documentosSgc', targetId: id })
    return id
  },
})

export const registrarDocumentoSgcVersion = mutation({
  args: {
    documentoId: v.id('documentosSgc'),
    fechaVigencia: v.union(v.string(), v.null()),
    cambioResumen: v.string(),
    storageId: v.union(v.id('_storage'), v.null()),
    fileName: v.union(v.string(), v.null()),
    contentType: v.union(v.string(), v.null()),
    size: v.union(v.number(), v.null()),
    hash: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const documento = await ctx.db.get(args.documentoId)
    if (!documento) throw new Error('Documento SGC no encontrado.')
    const resumen = args.cambioResumen.trim()
    if (!resumen) throw new Error('Registrar una version exige resumen de cambios.')
    if (args.storageId) {
      if (!args.fileName || !args.contentType || !args.size) throw new Error('El archivo de version exige nombre, tipo y tamano.')
      if (args.size > 10 * 1024 * 1024) throw new Error('El archivo excede el limite de 10 MB.')
      if (!DOCUMENTO_SGC_CONTENT_TYPES.includes(args.contentType as (typeof DOCUMENTO_SGC_CONTENT_TYPES)[number])) {
        throw new Error('Tipo de archivo no permitido para documento SGC.')
      }
    }
    const anteriores = await ctx.db
      .query('documentoSgcVersiones')
      .withIndex('by_documentoId', (q) => q.eq('documentoId', args.documentoId))
      .collect()
    const now = Date.now()
    for (const vigente of anteriores.filter((version) => version.estado === 'vigente')) {
      await ctx.db.patch(vigente._id, { estado: 'reemplazada', updatedAt: now, updatedBy: actor })
    }
    const id = await ctx.db.insert('documentoSgcVersiones', {
      documentoId: args.documentoId,
      version: anteriores.length + 1,
      estado: 'vigente',
      fechaVigencia: args.fechaVigencia,
      cambioResumen: resumen,
      storageId: args.storageId,
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
    await ctx.db.patch(args.documentoId, { estado: 'vigente', updatedAt: now, updatedBy: actor })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.version_registrada', detalle: documento.codigo, targetTipo: 'documentoSgcVersiones', targetId: id })
    return id
  },
})

export const retirarDocumentoSgcVersion = mutation({
  args: { versionId: v.id('documentoSgcVersiones'), motivo: v.string() },
  handler: async (ctx, { versionId, motivo }) => {
    const actor = await requireSgcAdmin(ctx)
    const version = await ctx.db.get(versionId)
    if (!version) throw new Error('Version de documento no encontrada.')
    if (!motivo.trim()) throw new Error('Retirar una version exige motivo.')
    await ctx.db.patch(versionId, { estado: 'retirada', motivoRetiro: motivo.trim(), updatedAt: Date.now(), updatedBy: actor })
    await writeGlobalAudit(ctx, { actor, evento: 'sgc.documento.version_retirada', detalle: motivo, targetTipo: 'documentoSgcVersiones', targetId: versionId })
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

export const createOrUpdateRevisionHomogeneidad = mutation({
  args: {
    rondaId: v.id('rondas'),
    checks: v.record(v.string(), v.object({ cumple: v.boolean(), observacion: v.union(v.string(), v.null()) })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
    conclusiones: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
    const now = Date.now()
    const coverage = await collectCoverage(ctx, args.rondaId)
    const resultados = await ctx.db
      .query('sgcResultadosPtApp')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', args.rondaId))
      .collect()
    const metricas = {
      ...buildHomogeneidadMetricas(coverage),
      resultado_homogeneidad_aprobado: resultados.some((row) => row.tipoResultado === 'homogeneidad' && row.estado === 'aprobado'),
      resultado_estabilidad_aprobado: resultados.some((row) => row.tipoResultado === 'estabilidad' && row.estado === 'aprobado'),
      ...args.metricas,
    }
    const checks = Object.fromEntries(
      Object.entries(args.checks).map(([key, value]) => [key, { ...value, updatedAt: now, updatedBy: actor }])
    )
    const existing = await getRevisionHomogeneidadDoc(ctx, args.rondaId)
    if (existing) {
      await ctx.db.patch(existing._id, {
        checks,
        metricas,
        conclusiones: args.conclusiones,
        estado: existing.estado === 'finalizado' ? 'requiere_revision' : existing.estado,
        updatedAt: now,
        updatedBy: actor,
      })
      await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.f_psea_08.actualizado', targetTipo: 'sgcRevisionHomogeneidad', targetId: existing._id })
      return existing._id
    }
    const id = await ctx.db.insert('sgcRevisionHomogeneidad', {
      rondaId: args.rondaId,
      estado: 'borrador',
      checks,
      metricas,
      conclusiones: args.conclusiones,
      finalizadoAt: null,
      finalizadoBy: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, { rondaId: args.rondaId, actor, evento: 'sgc.f_psea_08.creado', targetTipo: 'sgcRevisionHomogeneidad', targetId: id })
    return id
  },
})

export const finalizarRevisionHomogeneidad = mutation({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const actor = await requireSgcAdmin(ctx)
    const revision = await getRevisionHomogeneidadDoc(ctx, rondaId)
    if (!revision) throw new Error('No existe revision F-PSEA-08.')
    if (!revision.conclusiones?.trim()) throw new Error('Finalizar F-PSEA-08 exige una conclusion documentada.')
    for (const [key, check] of Object.entries(revision.checks)) {
      if (!check.cumple && !check.observacion?.trim()) {
        throw new Error(`El check ${key} no cumple y requiere observacion.`)
      }
    }
    const now = Date.now()
    await ctx.db.patch(revision._id, { estado: 'finalizado', finalizadoAt: now, finalizadoBy: actor, updatedAt: now, updatedBy: actor })
    const updated = await ctx.db.get(revision._id)
    await createSnapshot(ctx, { rondaId, tipoRegistro: 'revision_homogeneidad', registroId: String(revision._id), payload: updated, actor })
    await writeAudit(ctx, { rondaId, actor, evento: 'sgc.f_psea_08.finalizado', targetTipo: 'sgcRevisionHomogeneidad', targetId: revision._id })
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
})

export const listComunicaciones = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcComunicaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
})

export const createComunicacion = mutation({
  args: {
    rondaId: v.id('rondas'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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

export const updateComunicacion = mutation({
  args: {
    comunicacionId: v.id('sgcComunicaciones'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.union(v.string(), v.null()),
    fecha: v.string(),
    responsable: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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

export const deleteComunicacion = mutation({
  args: { comunicacionId: v.id('sgcComunicaciones') },
  handler: async (ctx, { comunicacionId }) => {
    const actor = await requireSgcAdmin(ctx)
    const comunicacion = await ctx.db.get(comunicacionId)
    if (!comunicacion) throw new Error('Comunicacion no encontrada.')
    await ctx.db.delete(comunicacionId)
    await writeAudit(ctx, { rondaId: comunicacion.rondaId, actor, evento: 'sgc.comunicacion.eliminada', targetTipo: 'sgcComunicaciones', targetId: comunicacionId })
  },
})

export const listRondasSgcResumen = query({
  args: {},
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
})

export const getHitosVisibleParticipante = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireParticipanteOAdmin(ctx, rondaId)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')
    return ctx.db
      .query('sgcHitosRonda')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId))
      .filter((q) => q.eq(q.field('visibleParticipante'), true))
      .collect()
  },
})

export const getEvidenciasPublicas = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireParticipanteOAdmin(ctx, rondaId)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) throw new Error('Ronda no encontrada.')
    const series = await ctx.db
      .query('sgcEvidenciaSeries')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId))
      .filter((q) => q.eq(q.field('publicaParticipante'), true))
      .collect()
    const results = await Promise.all(
      series.map(async (serie) => {
        const vigente = await ctx.db
          .query('sgcEvidenciaVersiones')
          .withIndex('by_serieId_and_estado', (q) => q.eq('serieId', serie._id).eq('estado', 'vigente'))
          .first()
        return { serie, vigente }
      })
    )
    return results
  },
})

export const listPublicaciones = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireParticipanteOAdmin(ctx, rondaId)
    const now = Date.now()
    return ctx.db
      .query('sgcPublicaciones')
      .withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId))
      .filter((q) => q.lte(q.field('visibleDesde'), now))
      .order('desc')
      .collect()
  },
})

export const createPublicacion = mutation({
  args: {
    rondaId: v.id('rondas'),
    titulo: v.string(),
    contenido: v.string(),
    tipo: v.union(v.literal('resultado'), v.literal('comunicado'), v.literal('cronograma'), v.literal('evidencia')),
    visibleDesde: v.number(),
    visibleHasta: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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

export const deletePublicacion = mutation({
  args: { publicacionId: v.id('sgcPublicaciones') },
  handler: async (ctx, { publicacionId }) => {
    const actor = await requireSgcAdmin(ctx)
    const pub = await ctx.db.get(publicacionId)
    if (!pub) throw new Error('Publicacion no encontrada.')
    await ctx.db.delete(publicacionId)
    await writeAudit(ctx, { rondaId: pub.rondaId, actor, evento: 'sgc.publicacion.eliminada', targetTipo: 'sgcPublicaciones', targetId: publicacionId })
  },
})

export const listComentariosRonda = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    await requireSgcAdmin(ctx)
    return ctx.db.query('sgcComentariosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).order('desc').collect()
  },
})

export const listMisComentariosRonda = query({
  args: { rondaId: v.id('rondas') },
  handler: async (ctx, { rondaId }) => {
    const { participante } = await requireParticipante(ctx, rondaId)
    return ctx.db
      .query('sgcComentariosRonda')
      .withIndex('by_rondaParticipanteId', (q) => q.eq('rondaParticipanteId', participante._id))
      .order('desc')
      .collect()
  },
})

export const createComentarioRonda = mutation({
  args: { rondaId: v.id('rondas'), mensaje: v.string() },
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
})

export const responderComentarioRonda = mutation({
  args: {
    comentarioId: v.id('sgcComentariosRonda'),
    respuesta: v.string(),
    cerrar: v.boolean(),
  },
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
})

export const crearNotificacion = mutation({
  args: {
    rondaId: v.id('rondas'),
    rondaParticipanteId: v.union(v.id('rondaParticipantes'), v.null()),
    destinatarioEmail: v.string(),
    titulo: v.string(),
    mensaje: v.string(),
    tipo: v.union(v.literal('recordatorio'), v.literal('cronograma'), v.literal('resultado'), v.literal('sgc'), v.literal('otro')),
  },
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
})

export const listMisNotificaciones = query({
  args: { rondaId: v.id('rondas') },
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
})

export const marcarNotificacionLeida = mutation({
  args: { notificacionId: v.id('sgcNotificaciones') },
  handler: async (ctx, { notificacionId }) => {
    const notificacion = await ctx.db.get(notificacionId)
    if (!notificacion) throw new Error('Notificacion no encontrada.')
    const { participante } = await requireParticipante(ctx, notificacion.rondaId)
    if (notificacion.rondaParticipanteId !== participante._id) throw new Error('No tiene acceso a esta notificacion.')
    await ctx.db.patch(notificacionId, { leidaAt: Date.now(), updatedAt: Date.now(), updatedBy: participante.email })
  },
})

export const upsertResultadoPtApp = mutation({
  args: {
    rondaId: v.id('rondas'),
    tipoResultado: v.union(v.literal('homogeneidad'), v.literal('estabilidad'), v.literal('estadistico')),
    evidenciaSerieId: v.id('sgcEvidenciaSeries'),
    evidenciaVersionId: v.union(v.id('sgcEvidenciaVersiones'), v.null()),
    estado: v.union(v.literal('pendiente'), v.literal('cargado'), v.literal('en_revision'), v.literal('aprobado'), v.literal('rechazado')),
    observaciones: v.union(v.string(), v.null()),
    fechaCalculo: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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
})

export const crearCasoSgc = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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
})

export const actualizarCasoSgc = mutation({
  args: {
    casoId: v.id('sgcCasos'),
    estado: v.union(v.literal('abierto'), v.literal('en_revision'), v.literal('esperando_participante'), v.literal('resuelto'), v.literal('cerrado')),
    severidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta'), v.literal('critica')),
    responsable: v.string(),
    fechaObjetivo: v.union(v.string(), v.null()),
    resolucion: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requireSgcAdmin(ctx)
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
})
