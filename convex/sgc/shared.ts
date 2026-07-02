import { v, type ObjectType, type PropertyValidators } from 'convex/values'
import { type MutationCtx, type QueryCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'
export const FORMATOS_ARCHIVO = ['F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-14'] as const
export type FormatoJustificable = 'F-PSEA-05' | 'F-PSEA-05A' | 'F-PSEA-12'
export const REVISION_CHECKS = [
  'participantes_revisados',
  'fichas_revisadas',
  'envios_finales_revisados',
  'metricas_revisadas',
  'evidencias_revisadas',
  'inconsistencias_resueltas',
] as const
export const HOMOGENEIDAD_CHECKS = [
  'plan_muestreo_revisado',
  'criterios_aceptacion_definidos',
  'resultados_homogeneidad_revisados',
  'resultados_estabilidad_revisados',
  'desviaciones_documentadas',
  'conclusion_lote_aprobada',
] as const

export const DOCUMENTO_SGC_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/markdown',
  'text/plain',
  'image/png',
  'image/jpeg',
] as const

export const formatoValidator = v.union(
  v.literal('F-PSEA-03'),
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

export type SgcAuthCtx = QueryCtx | MutationCtx

export const PENDING_PARTICIPANTE_PREFIX = 'pendiente:'

export function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function safeLabel(value: unknown, fallback: string) {
  const label = safeString(value).trim()
  return label || fallback
}

export function isParticipanteReclamado(workosUserId: unknown) {
  const userId = safeString(workosUserId)
  return userId !== '' && !userId.startsWith(PENDING_PARTICIPANTE_PREFIX)
}

export function claimStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return []
}

export function objectValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== 'object') return undefined
  return (source as Record<string, unknown>)[key]
}

export function identityRoles(identity: unknown): string[] {
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

// F21: fuente unica de la definicion de "admin", compartida entre SGC
// (`convex/sgc/shared.ts`) y el resto de dominios (`convex/access.ts`). Antes
// `requireParticipanteOAdmin` solo reconocia 'admin' mientras `access.ts` incluia
// tambien 'admin_sgc'/'coordinador_proceso', creando autorizacion inconsistente.
export const ADMIN_ROLES = ['admin', 'admin_sgc', 'coordinador_proceso'] as const

export function isAdminRole(roles: readonly string[]): boolean {
  return roles.some((role) => (ADMIN_ROLES as readonly string[]).includes(role))
}

export async function requireSgcAdmin(ctx: SgcAuthCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Autenticacion requerida para operar SGC.')
  const roles = identityRoles(identity)
  if (!isAdminRole(roles)) {
    throw new Error('Permisos insuficientes para operar SGC.')
  }
  return identity.email ?? identity.name ?? identity.tokenIdentifier
}

export async function requireSgcViewer(ctx: SgcAuthCtx) {
  const access = await requireSgcViewerAccess(ctx)
  return access.actor
}

export async function requireSgcViewerAccess(ctx: SgcAuthCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Autenticacion requerida para consultar SGC.')
  const roles = identityRoles(identity)
  if (!roles.some((role) => [...ADMIN_ROLES, 'consulta'].includes(role))) {
    throw new Error('Permisos insuficientes para consultar SGC.')
  }
  return {
    actor: identity.email ?? identity.name ?? identity.tokenIdentifier,
    roles,
    canReadInternal: isAdminRole(roles),
  }
}

export function canReadDocumentoSgc(
  documento: { visibilidad?: 'interna' | 'participantes' | 'publica' | null },
  access: { canReadInternal: boolean }
) {
  if (access.canReadInternal) return true
  return documento.visibilidad === 'publica'
}

export async function requireParticipanteOAdmin(ctx: SgcAuthCtx, rondaId: Id<'rondas'>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Autenticacion requerida.')
  const roles = identityRoles(identity)
  if (isAdminRole(roles)) {
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

export async function requireParticipante(ctx: SgcAuthCtx, rondaId: Id<'rondas'>) {
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

export async function writeAudit(
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

export async function getPlan(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcPlanRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
}

export async function getRevision(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcRevisionDatos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
}

export async function getRevisionHomogeneidadDoc(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  return ctx.db.query('sgcRevisionHomogeneidad').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first()
}

export async function collectCoverage(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
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

export function buildRevisionMetricas(coverage: Awaited<ReturnType<typeof collectCoverage>>) {
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

export function buildHomogeneidadMetricas(coverage: Awaited<ReturnType<typeof collectCoverage>>) {
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

export function hasJustificacion(
  coverage: Awaited<ReturnType<typeof collectCoverage>>,
  formato: FormatoJustificable
) {
  return Boolean(coverage.justificacionesVigentes[formato]?.razon.trim())
}

export function collectChecklistFaltantes(coverage: Awaited<ReturnType<typeof collectCoverage>>) {
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

  if (!planOk) faltantes.push('F-PSEA-03/F-PSEA-06 plan finalizado con snapshot')
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

export async function createSnapshot(
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

export function summarizeSnapshotPayload(tipoRegistro: string, payload: unknown) {
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

export function buildCodigoCaso(existingCount: number) {
  return `SGC-${String(existingCount + 1).padStart(4, '0')}`
}

export async function writeGlobalAudit(
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

export function normalizeCodigoDocumento(codigo: string) {
  return codigo.trim().toUpperCase()
}


export type SgcQueryConfig<Args extends PropertyValidators> = {
  args: Args
  handler: (ctx: QueryCtx, args: ObjectType<Args>) => unknown | Promise<unknown>
}

export type SgcMutationConfig<Args extends PropertyValidators> = {
  args: Args
  handler: (ctx: MutationCtx, args: ObjectType<Args>) => unknown | Promise<unknown>
}
