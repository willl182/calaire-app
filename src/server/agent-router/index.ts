import { ConvexHttpClient } from 'convex/browser'
import { anyApi, type FunctionReference } from 'convex/server'
import { env, requireEnv } from '@/env'

let _convex: ConvexHttpClient | null = null

function getConvex(): ConvexHttpClient {
  if (!_convex) {
    _convex = new ConvexHttpClient(requireEnv('NEXT_PUBLIC_CONVEX_URL', env.NEXT_PUBLIC_CONVEX_URL), {
      skipConvexDeploymentUrlCheck: true,
    })
  }
  return _convex
}

type AgentFunctionReference = FunctionReference<'query'> | FunctionReference<'mutation'>

const agentApi = anyApi.agent as unknown as Record<string, AgentFunctionReference>

export type RouteDef = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  pattern: string
  convexFn: string
  kind: 'query' | 'mutation'
  extractArgs: (segments: string[]) => Record<string, unknown>
  bodyFields?: string[]
}

const patternSegments = (pattern: string) => pattern.split('/').filter(Boolean)

function matchPattern(segments: string[], pattern: string): boolean {
  const parts = patternSegments(pattern)
  if (parts.length !== segments.length) return false
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(':')) continue
    if (parts[i] !== segments[i]) return false
  }
  return true
}

export const ROUTES: RouteDef[] = [
  // Rondas
  { method: 'GET', pattern: 'rondas', convexFn: 'listRondas', kind: 'query', extractArgs: () => ({}) },
  { method: 'GET', pattern: 'rondas/:id', convexFn: 'getRonda', kind: 'query', extractArgs: (s) => ({ id: s[1] }) },
  { method: 'GET', pattern: 'rondas/by-codigo/:codigo', convexFn: 'getRondaByCodigo', kind: 'query', extractArgs: (s) => ({ codigo: s[2] }) },
  { method: 'POST', pattern: 'rondas', convexFn: 'createRonda', kind: 'mutation', extractArgs: () => ({}), bodyFields: ['codigo', 'nombre', 'estado'] },
  { method: 'POST', pattern: 'rondas/configured', convexFn: 'createConfiguredRonda', kind: 'mutation', extractArgs: () => ({}), bodyFields: ['codigo', 'nombre', 'contaminantes', 'slots'] },
  { method: 'PATCH', pattern: 'rondas/:id/estado', convexFn: 'updateRondaEstado', kind: 'mutation', extractArgs: (s) => ({ id: s[1] }), bodyFields: ['estado'] },
  { method: 'PATCH', pattern: 'rondas/:id/config', convexFn: 'updateRondaConfig', kind: 'mutation', extractArgs: (s) => ({ id: s[1] }), bodyFields: ['codigo', 'nombre', 'contaminantes'] },
  { method: 'PATCH', pattern: 'rondas/:id/basic', convexFn: 'updateRondaBasicInfo', kind: 'mutation', extractArgs: (s) => ({ id: s[1] }), bodyFields: ['codigo', 'nombre'] },
  { method: 'DELETE', pattern: 'rondas/:id', convexFn: 'deleteRonda', kind: 'mutation', extractArgs: (s) => ({ id: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/contaminantes', convexFn: 'addContaminante', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['contaminante', 'niveles', 'replicas'] },

  // Participantes
  { method: 'GET', pattern: 'rondas/:id/participantes', convexFn: 'listParticipantes', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/participantes-resumen', convexFn: 'listParticipantesRondaResumen', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/participantes', convexFn: 'addParticipante', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['workosUserId', 'email', 'participantProfile', 'participantCode', 'replicateCode'] },
  { method: 'PATCH', pattern: 'participantes/:id', convexFn: 'updateParticipanteAdmin', kind: 'mutation', extractArgs: (s) => ({ participanteId: s[1] }), bodyFields: ['email', 'participantProfile', 'participantCode', 'replicateCode'] },
  { method: 'DELETE', pattern: 'participantes/:id', convexFn: 'removeParticipante', kind: 'mutation', extractArgs: (s) => ({ participanteId: s[1] }), bodyFields: ['rondaId'] },

  // Resultados
  { method: 'GET', pattern: 'rondas/:id/resultados', convexFn: 'listResultados', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/resultados-resumen', convexFn: 'listResultadosRonda', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },

  // PT
  { method: 'GET', pattern: 'rondas/:id/pt/items', convexFn: 'listPTItems', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/pt/sample-groups', convexFn: 'listPTSampleGroups', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/pt/envios', convexFn: 'listEnviosPTRound', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/pt/envios-detalle', convexFn: 'listAllEnviosPT', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/pt/items', convexFn: 'createPTItem', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['contaminante', 'runCode', 'levelLabel', 'sortOrder'] },
  { method: 'POST', pattern: 'rondas/:id/pt/items-bulk', convexFn: 'createPTItemsBulk', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['contaminante', 'items'] },
  { method: 'POST', pattern: 'rondas/:id/pt/sample-groups', convexFn: 'createPTSampleGroup', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['sampleGroup', 'sortOrder'] },

  // Directorio
  { method: 'GET', pattern: 'directorio-participantes', convexFn: 'listDirectorioParticipantes', kind: 'query', extractArgs: () => ({}) },

  // Fichas
  { method: 'GET', pattern: 'fichas/:id', convexFn: 'getFichaById', kind: 'query', extractArgs: (s) => ({ fichaId: s[1] }) },
  { method: 'GET', pattern: 'fichas-rp/:id', convexFn: 'getFichaByRondaParticipante', kind: 'query', extractArgs: (s) => ({ rondaParticipanteId: s[1] }) },
  { method: 'GET', pattern: 'fichas-rp/:id/resumen', convexFn: 'getFichaResumenByRondaParticipante', kind: 'query', extractArgs: (s) => ({ rondaParticipanteId: s[1] }) },

  // SGC
  { method: 'GET', pattern: 'rondas/:id/sgc', convexFn: 'getPanelSgc', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/plan', convexFn: 'getPlanRonda', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/revision', convexFn: 'getRevisionDatos', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/hitos', convexFn: 'listHitosRonda', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/evidencias', convexFn: 'listEvidenciaSeries', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/comunicaciones', convexFn: 'listComunicaciones', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/publicaciones', convexFn: 'listPublicaciones', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/audit-log', convexFn: 'listAuditLog', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'GET', pattern: 'rondas/:id/sgc/snapshots', convexFn: 'listSnapshots', kind: 'query', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['tipoRegistro'] },
  { method: 'GET', pattern: 'sgc/evidencias/:serieId/versiones', convexFn: 'listEvidenciaVersiones', kind: 'query', extractArgs: (s) => ({ serieId: s[2] }) },
  { method: 'GET', pattern: 'sgc/evidencias/:id/download-url', convexFn: 'getDownloadUrl', kind: 'query', extractArgs: (s) => ({ evidenciaVersionId: s[2] }) },

  // SGC mutations
  { method: 'POST', pattern: 'rondas/:id/sgc/plan', convexFn: 'createOrUpdatePlanRonda', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['bloques', 'camposEstructurados', 'motivoRevision'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/plan/finalizar', convexFn: 'finalizarPlanRonda', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/sgc/revision', convexFn: 'createOrUpdateRevisionDatos', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['checks', 'metricas'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/revision/finalizar', convexFn: 'finalizarRevisionDatos', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/sgc/hitos', convexFn: 'createHitoRonda', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['codigo', 'nombre', 'fase', 'fechaObjetivo', 'fechaReal', 'estado', 'responsable', 'visibleParticipante', 'bloqueaCierre', 'formatoRelacionado', 'notas'] },
  { method: 'PATCH', pattern: 'rondas/:id/sgc/hitos/:hitoId', convexFn: 'updateHitoRonda', kind: 'mutation', extractArgs: (s) => ({ hitoId: s[3] }), bodyFields: ['codigo', 'nombre', 'fase', 'fechaObjetivo', 'fechaReal', 'estado', 'responsable', 'visibleParticipante', 'bloqueaCierre', 'formatoRelacionado', 'notas'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/evidencias', convexFn: 'createEvidenciaSeries', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['formato', 'seccion', 'nombre', 'requerida', 'publicaParticipante'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/evidencias/version', convexFn: 'registrarEvidenciaVersion', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['serieId', 'storageId', 'fileName', 'contentType', 'size', 'hash'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/evidencias/retirar', convexFn: 'retirarEvidenciaVersion', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['evidenciaVersionId', 'motivo'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/justificaciones', convexFn: 'upsertJustificacion', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['formato', 'alcance', 'razon'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/justificaciones/retirar', convexFn: 'retirarJustificacion', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['justificacionId', 'motivo'] },
  { method: 'POST', pattern: 'rondas/:id/sgc/comunicaciones', convexFn: 'createComunicacion', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['tipo', 'destinatario', 'asunto', 'notas', 'fecha', 'responsable'] },
  { method: 'PATCH', pattern: 'sgc/comunicaciones/:id', convexFn: 'updateComunicacion', kind: 'mutation', extractArgs: (s) => ({ comunicacionId: s[2] }), bodyFields: ['tipo', 'destinatario', 'asunto', 'notas', 'fecha', 'responsable'] },
  { method: 'DELETE', pattern: 'sgc/comunicaciones/:id', convexFn: 'deleteComunicacion', kind: 'mutation', extractArgs: (s) => ({ comunicacionId: s[2] }) },
  { method: 'POST', pattern: 'rondas/:id/sgc/publicaciones', convexFn: 'createPublicacion', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['titulo', 'contenido', 'tipo', 'visibleDesde', 'visibleHasta'] },
  { method: 'DELETE', pattern: 'sgc/publicaciones/:id', convexFn: 'deletePublicacion', kind: 'mutation', extractArgs: (s) => ({ publicacionId: s[2] }) },
  { method: 'POST', pattern: 'rondas/:id/sgc/inicializar', convexFn: 'inicializarPanelSgc', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/transicion-documentacion', convexFn: 'transitionRondaToDocumentacionPendiente', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/transicion-cerrada', convexFn: 'transitionRondaToCerrada', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }) },
  { method: 'POST', pattern: 'rondas/:id/reabrir', convexFn: 'reabrirRondaSgc', kind: 'mutation', extractArgs: (s) => ({ rondaId: s[1] }), bodyFields: ['motivo'] },
]

export function matchRoute(method: string, segments: string[]): RouteDef | null {
  for (const def of ROUTES) {
    if (def.method !== method) continue
    if (matchPattern(segments, def.pattern)) return def
  }
  return null
}

export async function executeAgentRoute(
  method: string,
  pathSegments: string[],
  apiKey: string,
  body: unknown
): Promise<{ status: number; data: unknown }> {
  const def = matchRoute(method, pathSegments)
  if (!def) {
    return { status: 404, data: { error: 'route_not_found', path: pathSegments.join('/') } }
  }

  const fnRef = agentApi[def.convexFn]
  if (!fnRef) {
    return { status: 500, data: { error: 'function_not_found', fn: def.convexFn } }
  }

  const args: Record<string, unknown> = { apiKey, ...def.extractArgs(pathSegments) }
  if (def.bodyFields && body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    for (const field of def.bodyFields) {
      if (record[field] !== undefined) {
        args[field] = record[field]
      }
    }
  }

  try {
    if (def.kind === 'query') {
      const result = await getConvex().query(fnRef as FunctionReference<'query'>, args)
      return { status: 200, data: result }
    } else {
      const result = await getConvex().mutation(fnRef as FunctionReference<'mutation'>, args)
      return { status: 200, data: result }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    return { status: 400, data: { error: err.message } }
  }
}
