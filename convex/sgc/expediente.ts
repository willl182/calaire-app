import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { getSgcRondaDocumento } from '../_lib/sgc/catalog'
import {
  calcularAvanceExpediente,
  calcularEstadoDriveRonda,
  calcularPasosPrevios,
  calcularSiguientePaso,
  compararExpedienteConCatalogo,
  DRIVE_ROOT_CODIGO,
  type EstadosNativosExpediente,
} from '../_lib/sgc/expediente'
import { detectarCodigosProvisionales } from '../_lib/sgc/checklist'
import { getNivelesPTDescuadres } from '../rondas/ptLevels'
import { inicializarDriveRondaConfig } from './drive'
import {
  collectChecklistFaltantes,
  collectCoverage,
  collectDriveCierreCalidad,
  normalizeCodigoDocumento,
  requireSgcManage,
  requireSgcViewer,
  writeAudit,
  type SgcMutationConfig,
  type SgcQueryConfig,
} from './shared'

const rondaArgs = { rondaId: v.id('rondas') }

/** Codigos que admiten la marca explicita del coordinador (decisiones 5 y 17). */
export const CODIGOS_CON_APROBACION = ['F-PSEA-05', 'EVID-CIERRE'] as const

export async function collectEstadosNativosExpediente(
  ctx: QueryCtx | MutationCtx,
  rondaId: Id<'rondas'>
): Promise<EstadosNativosExpediente> {
  const [coverage, driveCierre, acta, relaciones, evaluacion] = await Promise.all([
    collectCoverage(ctx, rondaId),
    collectDriveCierreCalidad(ctx, rondaId),
    ctx.db.query('sgcActasInicio').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first(),
    ctx.db.query('sgcInstrumentosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('ptEvaluaciones').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).first(),
  ])
  const relacion = relaciones.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
  const bloqueantesDrive = driveCierre.bloqueantes.filter((mensaje) => !mensaje.startsWith('EVID-CIERRE'))
  return {
    planFinalizado: coverage.planFinalizado,
    revisionFinalizada: coverage.revisionFinalizada,
    participantesEsperados: coverage.participantesEsperados,
    participantesReclamados: coverage.participantesReclamados,
    fichasEnviadas: coverage.fichasEnviadas,
    actaInicioEstado: acta?.estado ?? null,
    relacionInstrumentosEstado: relacion?.estado ?? null,
    informePublicado: evaluacion?.estado === 'publicada' && Boolean(evaluacion.informeStorageId),
    bloqueantesCierre: collectChecklistFaltantes(coverage).length + bloqueantesDrive.length,
  }
}

async function getAvance(ctx: QueryCtx | MutationCtx, rondaId: Id<'rondas'>) {
  const [recursos, nativos] = await Promise.all([
    ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
    collectEstadosNativosExpediente(ctx, rondaId),
  ])
  return calcularAvanceExpediente(String(rondaId), recursos, nativos)
}

/**
 * B1.5: estado real de Drive de la ronda (carpeta creada = `driveFolderId` en la raiz). Si la
 * integracion esta conectada depende de las credenciales del servidor Next: lo combina
 * `getEstadoDriveRondaSgc` en `src/server/sgc/drive-google.ts`.
 */
export const getEstadoDriveRondaConfig = {
  args: rondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    const recursos = await ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
    return calcularEstadoDriveRonda(recursos)
  },
} satisfies SgcQueryConfig<typeof rondaArgs>

/** B1.4: avance del expediente y pendientes clasificados (bloqueante / critico / advertencia). */
export const getAvanceExpedienteConfig = {
  args: rondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    return getAvance(ctx, rondaId)
  },
} satisfies SgcQueryConfig<typeof rondaArgs>

/**
 * B1.6: barra "Siguiente paso". Pasos previos no SGC con estado calculado y, despues, el primer
 * documento obligatorio pendiente en orden logico (dependencias, no numero de carpeta).
 */
export const getSiguientePasoConfig = {
  args: rondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) return null
    const [contaminantes, descuadresPT, participantes, hitos, recursos, nativos] = await Promise.all([
      ctx.db.query('rondaContaminantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
      getNivelesPTDescuadres(ctx, rondaId),
      ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
      collectEstadosNativosExpediente(ctx, rondaId),
    ])
    const pasosPrevios = calcularPasosPrevios(String(rondaId), {
      contaminantes: contaminantes.length,
      descuadresPT,
      participantes: participantes.length,
      participantesSinCodigoReplica: participantes.filter((p) => p.replicateCode == null).length,
      participantesSinCodigo: participantes.filter(
        (p) => !p.participantCode?.trim() || detectarCodigosProvisionales([p.participantCode]).length > 0
      ).length,
      hitoInicioConFecha: hitos.some(
        (hito) => hito.codigo === 'INICIO_RONDA' && hito.estado !== 'cancelado' && Boolean(hito.fechaObjetivo?.trim())
      ),
      expedienteInicializado: recursos.some((recurso) => recurso.codigo === DRIVE_ROOT_CODIGO),
      // Cada cupo registrado en rondaParticipantes nace con `invitadoAt` (invitacion emitida).
      invitacionesEnviadas: participantes.filter((p) => p.invitadoAt > 0).length,
    })
    const avance = calcularAvanceExpediente(String(rondaId), recursos, nativos)
    return {
      pasosPrevios,
      siguiente: calcularSiguientePaso(pasosPrevios, avance),
      avance: { completos: avance.completos, total: avance.total, porcentaje: avance.porcentaje },
    }
  },
} satisfies SgcQueryConfig<typeof rondaArgs>

async function findDocumentoExpediente(ctx: MutationCtx, rondaId: Id<'rondas'>, codigo: string) {
  const recurso = await ctx.db
    .query('sgcDriveRecursos')
    .withIndex('by_rondaId_and_codigo', (q) => q.eq('rondaId', rondaId).eq('codigo', normalizeCodigoDocumento(codigo)))
    .first()
  if (!recurso || recurso.tipo === 'carpeta') {
    throw new Error('Documento no encontrado en el expediente: actualice el expediente primero.')
  }
  return recurso
}

const marcarAplicaArgs = { rondaId: v.id('rondas'), codigo: v.string(), aplica: v.boolean() }

/**
 * B1.4: marca si un documento "si aplica" aplica en la ronda. Desmarcar no exige justificacion
 * (decision 13). Los obligatorios no se pueden marcar.
 */
export const marcarAplicaDocumentoConfig = {
  args: marcarAplicaArgs,
  handler: async (ctx, { rondaId, codigo, aplica }) => {
    const actor = await requireSgcManage(ctx)
    const politica = getSgcRondaDocumento(codigo)
    if (!politica) throw new Error('El documento no esta en el catalogo del expediente.')
    if (politica.obligatoriedad !== 'si_aplica') throw new Error('Solo los documentos "si aplica" se pueden activar o desactivar.')
    const recurso = await findDocumentoExpediente(ctx, rondaId, codigo)
    if ((recurso.aplica ?? false) === aplica) return { cambiado: false }
    await ctx.db.patch(recurso._id, { aplica, updatedAt: Date.now(), updatedBy: actor })
    await writeAudit(ctx, {
      rondaId,
      actor,
      evento: aplica ? 'sgc.expediente.aplica' : 'sgc.expediente.no_aplica',
      detalle: politica.codigo,
      targetTipo: 'sgcDriveRecursos',
      targetId: recurso._id,
    })
    return { cambiado: true }
  },
} satisfies SgcMutationConfig<typeof marcarAplicaArgs>

const aprobarArgs = { rondaId: v.id('rondas'), codigo: v.string(), aprobado: v.boolean() }

/**
 * B1.4: marca explicita del coordinador: "revisado" de F-PSEA-05 y aprobacion de EVID-CIERRE.
 * EVID-CIERRE solo se aprueba con el checklist de cierre sin bloqueantes.
 */
export const aprobarDocumentoExpedienteConfig = {
  args: aprobarArgs,
  handler: async (ctx, { rondaId, codigo, aprobado }) => {
    const actor = await requireSgcManage(ctx)
    const normalizado = normalizeCodigoDocumento(codigo)
    if (!(CODIGOS_CON_APROBACION as readonly string[]).includes(normalizado)) {
      throw new Error('Este documento no requiere aprobacion explicita.')
    }
    const recurso = await findDocumentoExpediente(ctx, rondaId, normalizado)
    if (aprobado && normalizado === 'EVID-CIERRE') {
      const nativos = await collectEstadosNativosExpediente(ctx, rondaId)
      if (nativos.bloqueantesCierre > 0) {
        throw new Error(`No se puede aprobar el cierre: el checklist tiene ${nativos.bloqueantesCierre} bloqueante(s).`)
      }
    }
    const now = Date.now()
    await ctx.db.patch(recurso._id, {
      aprobadoAt: aprobado ? now : null,
      aprobadoPor: aprobado ? actor : null,
      updatedAt: now,
      updatedBy: actor,
    })
    await writeAudit(ctx, {
      rondaId,
      actor,
      evento: aprobado ? 'sgc.expediente.aprobado' : 'sgc.expediente.aprobacion_retirada',
      detalle: normalizado,
      targetTipo: 'sgcDriveRecursos',
      targetId: recurso._id,
    })
    return { aprobado }
  },
} satisfies SgcMutationConfig<typeof aprobarArgs>

/** B1.3: compara el expediente guardado de la ronda con el catalogo vigente. */
export const getSincronizacionExpedienteConfig = {
  args: rondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    const recursos = await ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
    return compararExpedienteConCatalogo(
      recursos.map((recurso) => ({
        _id: String(recurso._id),
        codigo: recurso.codigo,
        tipo: recurso.tipo,
        parentId: recurso.parentId ? String(recurso.parentId) : null,
      }))
    )
  },
} satisfies SgcQueryConfig<typeof rondaArgs>

/**
 * B1.3: "Actualizar expediente". Reutiliza la reparacion idempotente de `inicializarDriveRonda`:
 * crea carpetas/documentos faltantes, recoloca los que cuelgan de otra carpeta y nunca borra
 * ni pisa enlaces, definitivos, estado ni visibilidad ya cargados.
 */
export const actualizarExpedienteConfig = {
  args: inicializarDriveRondaConfig.args,
  handler: async (ctx, args) => inicializarDriveRondaConfig.handler(ctx, args),
} satisfies SgcMutationConfig<typeof inicializarDriveRondaConfig.args>
