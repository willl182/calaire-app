import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { safeConvexCall, safeConvexCallWithStatus } from '@/lib/convex-fallback'
import { authedMutation as fetchMutation, authedQuery as fetchQuery, dataOf } from '@/server/convex'
import { MEMBER_SPECIAL_ROLES, PENDING_PARTICIPANTE_PREFIX } from './constants'
import { derivarEstadoOperativo } from './estados'
import type {
  Contaminante,
  Envio,
  EnvioPT,
  EnvioPTConMetadatos,
  EnvioPTWithRelations,
  EstadoRonda,
  ParticipantePerfil,
  ParticipanteRondaResumen,
  PtScoreImportRow,
  ResultadoParticipante,
  Ronda,
  RondaContaminante,
  RondaParticipante,
  RondaParticipantePT,
  RondaPTItem,
  RondaPTItemInput,
  RondaPTSampleGroup,
} from './types'


export function isMemberSpecialRole(role: string | null | undefined): boolean {
  if (!role) return false
  return MEMBER_SPECIAL_ROLES.includes(role.toLowerCase() as (typeof MEMBER_SPECIAL_ROLES)[number])
}

function msToISO(ms: number): string {
  return new Date(ms).toISOString()
}

function optMsToISO(ms: number | undefined | null): string | null {
  return ms != null ? new Date(ms).toISOString() : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContaminanteDoc(c: any): RondaContaminante {
  return {
    id: c._id as string,
    ronda_id: c.rondaId as string,
    contaminante: c.contaminante as Contaminante,
    niveles: c.niveles as number,
    replicas: c.replicas as 2 | 3,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRondaWithContaminantes(r: any): Ronda {
  return {
    id: r._id as string,
    codigo: r.codigo as string,
    nombre: r.nombre as string,
    estado: r.estado as EstadoRonda,
    created_at: msToISO(r.createdAt as number),
    contaminantes: (r.contaminantes as unknown[]).map(mapContaminanteDoc),
    participantes_planeados: r.participantes_planeados as number | undefined,
    participantes_asignados: r.participantes_asignados as number | undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParticipanteDoc(p: any): RondaParticipante {
  return {
    id: p._id as string,
    ronda_id: p.rondaId as string,
    workos_user_id: p.workosUserId as string,
    email: p.email as string,
    invitado_at: msToISO(p.invitadoAt as number),
    participant_profile: (p.participantProfile ?? 'member') as ParticipantePerfil,
    envios_count: (p.envios_count ?? 0) as number,
    estado: (p.estado ?? (String(p.workosUserId).startsWith(PENDING_PARTICIPANTE_PREFIX) ? 'pendiente' : 'asignado')) as 'pendiente' | 'asignado',
    slot_token: (p.slot_token ?? null) as string | null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParticipanteRondaResumenDoc(p: any): ParticipanteRondaResumen {
  const enviosPtCount = (p.envios_pt_count ?? 0) as number
  return {
    ronda_participante_id: p.ronda_participante_id as string,
    ronda_id: p.ronda_id as string,
    email: p.email as string,
    workos_user_id: (p.workos_user_id ?? null) as string | null,
    participant_profile: (p.participant_profile ?? 'member') as ParticipantePerfil,
    participant_code: (p.participant_code ?? null) as string | null,
    replicate_code: (p.replicate_code ?? null) as number | null,
    estado: p.estado as 'pendiente' | 'reclamado',
    slot_token: (p.slot_token ?? null) as string | null,
    claimed_at: (p.claimed_at ?? null) as string | null,
    invitado_at: p.invitado_at as string,
    ficha_estado: p.ficha_estado as 'no_iniciada' | 'borrador' | 'enviado',
    envios_pt_count: enviosPtCount,
    tiene_envio_final: enviosPtCount > 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEnvioDoc(e: any): Envio {
  return {
    id: e._id as string,
    ronda_id: e.rondaId as string,
    workos_user_id: e.workosUserId as string,
    contaminante: e.contaminante as Contaminante,
    nivel: e.nivel as number,
    valores: e.valores as number[],
    promedio: (e.promedio ?? null) as number | null,
    incertidumbre: (e.incertidumbre ?? null) as number | null,
    submitted_at: msToISO(e.submittedAt as number),
    updated_at: msToISO(e.updatedAt as number),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPTItemDoc(item: any): RondaPTItem {
  return {
    id: item._id as string,
    ronda_id: item.rondaId as string,
    contaminante: item.contaminante as Contaminante,
    run_code: item.runCode as string,
    level_label: item.levelLabel as string,
    sort_order: item.sortOrder as number,
    created_at: msToISO(item.createdAt as number),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPTSampleGroupDoc(g: any): RondaPTSampleGroup {
  return {
    id: g._id as string,
    ronda_id: g.rondaId as string,
    sample_group: g.sampleGroup as string,
    sort_order: g.sortOrder as number,
    created_at: msToISO(g.createdAt as number),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParticipantePTDoc(p: any): RondaParticipantePT {
  return {
    id: p._id as string,
    ronda_id: p.rondaId as string,
    workos_user_id: p.workosUserId as string,
    email: p.email as string,
    invitado_at: msToISO(p.invitadoAt as number),
    participant_profile: (p.participantProfile ?? 'member') as ParticipantePerfil,
    participant_code: (p.participantCode ?? null) as string | null,
    replicate_code: (p.replicateCode ?? null) as number | null,
    claimed_at: optMsToISO(p.claimedAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEnvioPTDoc(e: any): EnvioPT {
  return {
    id: e._id as string,
    ronda_id: e.rondaId as string,
    ronda_participante_id: e.rondaParticipanteId as string,
    pt_item_id: e.ptItemId as string,
    sample_group_id: e.sampleGroupId as string,
    d1: (e.d1 ?? null) as number | null,
    d2: (e.d2 ?? null) as number | null,
    d3: (e.d3 ?? null) as number | null,
    mean_value: e.meanValue as number,
    sd_value: e.sdValue as number,
    ux: (e.ux ?? null) as number | null,
    k: (e.k ?? null) as number | null,
    ux_exp: (e.uxExp ?? null) as number | null,
    draft_saved_at: msToISO(e.draftSavedAt as number),
    final_submitted_at: optMsToISO(e.finalSubmittedAt),
    updated_at: msToISO(e.updatedAt as number),
  }
}

// ---------------------------------------------------------------------------
// Rondas — read
// ---------------------------------------------------------------------------

export const getRonda = dataOf(getRondaWithStatus)

export async function previewPtScoreImport(rondaId: string, rows: PtScoreImportRow[]) {
  return fetchQuery(api.pt.scores.previewImport, { rondaId: rondaId as Id<'rondas'>, rows })
}

export async function importPtScoreDraft(rondaId: string, rows: PtScoreImportRow[]) {
  const importToken = crypto.randomUUID()
  await fetchMutation(api.pt.scores.startDraftImport, { rondaId: rondaId as Id<'rondas'>, importToken, filasEsperadas: rows.length })
  for (let offset = 0; offset < rows.length; offset += 100) {
    await fetchMutation(api.pt.scores.importDraftBatch, { rondaId: rondaId as Id<'rondas'>, importToken, offset, rows: rows.slice(offset, offset + 100) })
  }
  return fetchMutation(api.pt.scores.finishDraftImport, { rondaId: rondaId as Id<'rondas'>, importToken })
}

export async function getPtEvaluationAdmin(rondaId: string) {
  return fetchQuery(api.pt.scores.getEstadoEvaluacionAdmin, { rondaId: rondaId as Id<'rondas'> })
}

export async function uploadPtGeneralReport(rondaId: string, file: File) {
  const uploadUrl = await fetchMutation(api.pt.scores.generateUploadUrl, {})
  const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
  if (!response.ok) throw new Error('No se pudo subir el informe a storage.')
  const uploaded = await response.json() as { storageId: string }
  await fetchMutation(api.pt.scores.registrarInformeGeneral, {
    rondaId: rondaId as Id<'rondas'>, storageId: uploaded.storageId as Id<'_storage'>,
    nombreArchivo: file.name, contentType: file.type, size: file.size,
  })
}

export async function publishPtResults(rondaId: string) {
  return fetchMutation(api.pt.scores.publicarResultados, { rondaId: rondaId as Id<'rondas'> })
}

export async function getMyPtResults(rondaId: string) {
  return fetchQuery(api.pt.scores.getMisResultados, { rondaId: rondaId as Id<'rondas'> })
}

export async function getMyPtPerformance() {
  return fetchQuery(api.pt.scores.getMiDesempeno, {})
}

export async function getMyCalendar() {
  return fetchQuery(api.pt.calendar.getMiCalendario, {})
}

export async function getMyPtReport(rondaId: string) {
  return fetchQuery(api.pt.scores.getMiInformeUrl, { rondaId: rondaId as Id<'rondas'> })
}

export async function getMyPtCertificate(rondaId: string) {
  return fetchQuery(api.pt.certificates.getMine, { rondaId: rondaId as Id<'rondas'> })
}

export async function getMyPtCases(rondaId: string) {
  return fetchQuery(api.pt.cases.misCasos, { rondaId: rondaId as Id<'rondas'> })
}

export async function getPtCase(casoId: string) {
  return fetchQuery(api.pt.cases.getCaso, { casoId: casoId as Id<'sgcCasos'> })
}

export async function getPtCaseDocument(casoId: string, versionId: string) {
  return fetchQuery(api.pt.cases.getDocumentDownload, { casoId: casoId as Id<'sgcCasos'>, versionId: versionId as Id<'casoDocumentoVersiones'> })
}

export async function createPtCase(input: { rondaId: string; tipo: 'consulta' | 'queja' | 'apelacion'; titulo: string; descripcion: string }) {
  return fetchMutation(api.pt.cases.createVoluntaryCase, { ...input, rondaId: input.rondaId as Id<'rondas'> })
}

export async function generatePtCaseUploadUrl(casoId: string) {
  return fetchMutation(api.pt.cases.generateUploadUrl, { casoId: casoId as Id<'sgcCasos'> })
}

export async function addPtCaseDocument(input: { casoId: string; categoria: 'analisis_causa' | 'plan_accion' | 'implementacion' | 'verificacion_eficacia'; storageId: string; nombreArchivo: string; contentType: string }) {
  return fetchMutation(api.pt.cases.addDocumentVersion, { ...input, casoId: input.casoId as Id<'sgcCasos'>, storageId: input.storageId as Id<'_storage'> })
}

export async function submitPtCase(casoId: string) {
  return fetchMutation(api.pt.cases.submitForReview, { casoId: casoId as Id<'sgcCasos'> })
}

export async function addPtCaseMessage(casoId: string, texto: string) {
  return fetchMutation(api.pt.cases.addMessage, { casoId: casoId as Id<'sgcCasos'>, texto })
}

export async function getPtCaseArchive(casoId: string) {
  return fetchQuery(api.pt.cases.getArchiveData, { casoId: casoId as Id<'sgcCasos'> })
}

export async function listPtCasesAdmin(rondaId: string) {
  return fetchQuery(api.pt.cases.listCasesAdmin, { rondaId: rondaId as Id<'rondas'> })
}

export async function reviewPtCase(casoId: string, decision: 'aceptar' | 'ajustes', observacion: string) {
  return fetchMutation(api.pt.cases.reviewDocumentation, { casoId: casoId as Id<'sgcCasos'>, decision, observacion })
}

export async function getPtVerificationCandidates(casoId: string, originId: string) {
  return fetchQuery(api.pt.cases.verificationCandidates, { casoId: casoId as Id<'sgcCasos'>, ptScoreOrigenId: originId as Id<'ptScores'> })
}

export async function linkPtVerification(input: { casoId: string; originId: string; posteriorId: string; motivo: string }) {
  return fetchMutation(api.pt.cases.linkVerificationManually, { casoId: input.casoId as Id<'sgcCasos'>, ptScoreOrigenId: input.originId as Id<'ptScores'>, ptScorePosteriorId: input.posteriorId as Id<'ptScores'>, motivo: input.motivo })
}

export async function getMyPtCertificateDownload(rondaId: string) {
  return fetchMutation(api.pt.certificates.getMineDownload, { rondaId: rondaId as Id<'rondas'> })
}

export async function getRondaWithStatus(id: string) {
  const result = await safeConvexCallWithStatus(
    'getRonda',
    () => fetchQuery(api.rondas.index.getRonda, { id: id as Id<'rondas'> }),
    null,
  )
  return {
    data: result.data ? mapRondaWithContaminantes(result.data) : null,
    offline: result.offline,
  }
}

export const getRondaByCodigo = dataOf(getRondaByCodigoWithStatus)

export async function getRondaByCodigoWithStatus(codigo: string) {
  const result = await safeConvexCallWithStatus(
    'getRondaByCodigo',
    () => fetchQuery(api.rondas.index.getRondaByCodigo, { codigo }),
    null,
  )
  return {
    data: result.data ? mapRondaWithContaminantes(result.data) : null,
    offline: result.offline,
  }
}

export const listRondas = dataOf(listRondasWithStatus)

export async function listRondasWithStatus() {
  const result = await safeConvexCallWithStatus(
    'listRondas',
    () => fetchQuery(api.rondas.index.listRondas, {}),
    [],
  )
  return { data: result.data.map(mapRondaWithContaminantes), offline: result.offline }
}

// ---------------------------------------------------------------------------
// Participantes — read
// ---------------------------------------------------------------------------

export async function listParticipantes(rondaId: string): Promise<RondaParticipante[]> {
  const rows = await safeConvexCall(
    'listParticipantes',
    () => fetchQuery(api.rondas.index.listParticipantes, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return rows.map(mapParticipanteDoc)
}

export const listParticipantesRondaResumen = dataOf(listParticipantesRondaResumenWithStatus)

export async function listParticipantesRondaResumenWithStatus(
  rondaId: string
) {
  const result = await safeConvexCallWithStatus(
    'listParticipantesRondaResumen',
    () => fetchQuery(api.rondas.index.listParticipantesRondaResumen, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    [],
  )
  return { data: result.data.map(mapParticipanteRondaResumenDoc), offline: result.offline }
}

export const listRondasParticipante = dataOf(listRondasParticipanteWithStatus)

export async function listRondasParticipanteWithStatus(userId: string) {
  const result = await safeConvexCallWithStatus(
    'listRondasParticipante',
    () => fetchQuery(api.rondas.index.listRondasParticipante, { userId }),
    [],
  )
  return {
    data: result.data.map((r) => ({
      ...mapRondaWithContaminantes(r),
      email: r.email as string,
      invitado_at: r.invitado_at as string,
      ronda_participante_id: r.ronda_participante_id as string,
      participant_profile: (r.participant_profile ?? 'member') as ParticipantePerfil,
      ficha_estado: r.ficha_estado as 'no_iniciada' | 'borrador' | 'enviado',
      envios_pt_count: (r.envios_pt_count ?? 0) as number,
      envio_pt_enviado: Boolean(r.envio_pt_enviado),
    })),
    offline: result.offline,
  }
}

export const listAllParticipantes = dataOf(listAllParticipantesWithStatus)

export async function listAllParticipantesWithStatus() {
  const result = await safeConvexCallWithStatus(
    'listAllParticipantes',
    () => fetchQuery(api.rondas.index.listAllParticipantes, {}),
    [],
  )
  return {
    data: result.data.map((r) => ({
      workos_user_id: r.workos_user_id,
      email: r.email,
      nit: (r.nit ?? null) as string | null,
      nit_laboratorio: (r.nit_laboratorio ?? null) as string | null,
      correo_laboratorio: (r.correo_laboratorio ?? null) as string | null,
      ficha_estado: (r.ficha_estado ?? 'no_iniciada') as 'no_iniciada' | 'borrador' | 'enviado',
      total_envios: r.total_envios,
      rondas: r.rondas.map((ronda) => ({
        ...ronda,
        estado: ronda.estado as EstadoRonda,
        participant_profile: (ronda.participant_profile ?? 'member') as ParticipantePerfil,
        ronda_participante_id: normalizeOptionalId(
          ronda.ronda_participante_id ?? ronda.rondaParticipanteId
        ),
        ficha_estado: (ronda.ficha_estado ?? 'no_iniciada') as 'no_iniciada' | 'borrador' | 'enviado',
        nit_laboratorio: (ronda.nit_laboratorio ?? null) as string | null,
        correo_laboratorio: (ronda.correo_laboratorio ?? null) as string | null,
        estado_enlace: (ronda.estado_enlace ?? 'reclamado') as 'pendiente' | 'reclamado',
      })),
    })),
    offline: result.offline,
  }
}

export type DirectorioParticipante = {
  id: string
  nit: string
  correo: string
  nombre_laboratorio: string | null
  nombre_responsable: string | null
  cargo: string | null
  ciudad: string | null
  departamento: string | null
  telefono: string | null
  workos_user_id: string | null
  created_at: string
  updated_at: string
}

export async function listDirectorioParticipantes(): Promise<DirectorioParticipante[]> {
  const rows = await safeConvexCall(
    'listDirectorioParticipantes',
    () => fetchQuery(api.rondas.index.listDirectorioParticipantes, {}),
    [],
  )
  return rows.map((row) => ({
    id: row.id,
    nit: row.nit,
    correo: row.correo,
    nombre_laboratorio: row.nombre_laboratorio ?? null,
    nombre_responsable: row.nombre_responsable ?? null,
    cargo: row.cargo ?? null,
    ciudad: row.ciudad ?? null,
    departamento: row.departamento ?? null,
    telefono: row.telefono ?? null,
    workos_user_id: row.workos_user_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export async function getDirectorioParticipanteByLookup(
  lookup: { nit?: string; correo?: string }
): Promise<DirectorioParticipante | null> {
  const row = await safeConvexCall(
    'getDirectorioParticipanteByLookup',
    () => fetchQuery(api.rondas.index.getDirectorioParticipanteByLookup, {
      lookup: lookup.nit?.trim() || lookup.correo?.trim() || '',
    }),
    null,
  )
  if (!row) return null
  return {
    id: row.id,
    nit: row.nit,
    correo: row.correo,
    nombre_laboratorio: row.nombre_laboratorio ?? null,
    nombre_responsable: row.nombre_responsable ?? null,
    cargo: row.cargo ?? null,
    ciudad: row.ciudad ?? null,
    departamento: row.departamento ?? null,
    telefono: row.telefono ?? null,
    workos_user_id: row.workos_user_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function upsertDirectorioParticipante(args: {
  nit: string
  correo: string
  nombreLaboratorio?: string | null
  nombreResponsable?: string | null
  cargo?: string | null
  ciudad?: string | null
  departamento?: string | null
  telefono?: string | null
  workosUserId?: string | null
}): Promise<void> {
  await fetchMutation(api.rondas.index.upsertDirectorioParticipante, args)
}

function normalizeOptionalId(value: unknown): string | null {
  return typeof value === 'string' && value !== '' && value !== 'undefined' ? value : null
}

export const isInvitado = dataOf(isInvitadoWithStatus)

export async function isInvitadoWithStatus(rondaId: string) {
  return safeConvexCallWithStatus(
    'isInvitado',
    () => fetchQuery(api.rondas.index.isInvitado, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    false,
  )
}

// ---------------------------------------------------------------------------
// Envios regulares — read
// ---------------------------------------------------------------------------

export async function listEnvios(rondaId: string): Promise<Envio[]> {
  const rows = await safeConvexCall(
    'listEnvios',
    () => fetchQuery(api.rondas.index.listEnvios, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    [],
  )
  return rows.map(mapEnvioDoc)
}

export type EstadoEnvioParticipante = {
  completo: boolean
  enviado: boolean
  enviados_at: string | null
  total_esperado: number
  total_guardado: number
}

export async function getEstadoEnvioParticipante(
  rondaId: string
): Promise<EstadoEnvioParticipante> {
  return safeConvexCall(
    'getEstadoEnvioParticipante',
    () => fetchQuery(api.rondas.index.getEstadoEnvioParticipante, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    {
      completo: false,
      enviado: false,
      enviados_at: null,
      total_esperado: 0,
      total_guardado: 0,
    },
  )
}

export type CeldaParticipante = {
  email: string
  userId: string
  promedio: number | null
  incertidumbre: number | null
  valores: number[]
}

export type ResultadoNivel = {
  nivel: number
  participantes: CeldaParticipante[]
  media: number | null
  desviacion: number | null
  cv: number | null
}

export type ResultadoContaminante = {
  contaminante: Contaminante
  replicas: number
  niveles: ResultadoNivel[]
}

export async function listResultados(rondaId: string): Promise<ResultadoContaminante[]> {
  return safeConvexCall(
    'listResultados',
    () => fetchQuery(api.rondas.index.listResultados, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
}

export async function listResultadosRonda(rondaId: string): Promise<ResultadoParticipante[]> {
  const rows = await safeConvexCall(
    'listResultadosRonda',
    () => fetchQuery(api.rondas.index.listResultadosRonda, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return rows.map((row) => ({
    workos_user_id: row.workos_user_id,
    email: row.email,
    completados: row.completados,
    total_esperado: row.total_esperado,
    porcentaje_completitud: row.porcentaje_completitud,
    enviados_at: row.enviados_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    envios: (row.envios as any[]).map(mapEnvioDoc),
  }))
}

// ---------------------------------------------------------------------------
// Mutations — participantes
// ---------------------------------------------------------------------------

export async function claimParticipanteToken(
  rondaId: string,
  token: string,
  email: string,
): Promise<'claimed' | 'already-assigned' | 'invalid'> {
  return fetchMutation(api.rondas.index.claimParticipanteToken, {
    rondaId: rondaId as Id<'rondas'>,
    token,
    email,
  })
}

export async function createConfiguredRonda(
  nombre: string,
  codigo: string,
  contaminantes: { contaminante: Contaminante; niveles: number; replicas: 2 | 3 }[],
  slots: { workosUserId: string; email: string; participantProfile: ParticipantePerfil }[]
): Promise<string> {
  const id = await fetchMutation(api.rondas.index.createConfiguredRonda, {
    nombre,
    codigo,
    contaminantes,
    slots,
  })
  return id as string
}

export async function updateRondaConfig(
  rondaId: string,
  nombre: string,
  codigo: string,
  contaminantes: { contaminante: Contaminante; niveles: number; replicas: 2 | 3 }[]
): Promise<void> {
  await fetchMutation(api.rondas.index.updateRondaConfig, {
    id: rondaId as Id<'rondas'>,
    nombre,
    codigo,
    contaminantes,
  })
}

export async function updateRondaReplicas(
  rondaId: string,
  items: { contaminante: Contaminante; replicas: 2 | 3 }[]
): Promise<void> {
  await fetchMutation(api.rondas.index.updateRondaReplicas, {
    rondaId: rondaId as Id<'rondas'>,
    items,
  })
}

export async function updateRondaBasicInfo(
  rondaId: string,
  nombre: string,
  codigo: string
): Promise<void> {
  await fetchMutation(api.rondas.index.updateRondaBasicInfo, {
    id: rondaId as Id<'rondas'>,
    nombre,
    codigo,
  })
}

export async function transitionRondaEstado(
  rondaId: string,
  nextState: 'activa' | 'documentacion_pendiente' | 'cerrada'
): Promise<void> {
  await fetchMutation(api.rondas.index.transitionRondaEstado, {
    id: rondaId as Id<'rondas'>,
    nextState,
  })
}

export async function reabrirRonda(rondaId: string): Promise<void> {
  await fetchMutation(api.rondas.index.reabrirRonda, {
    id: rondaId as Id<'rondas'>,
  })
}

export async function deleteRonda(rondaId: string): Promise<string> {
  return fetchMutation(api.rondas.index.deleteRonda, {
    id: rondaId as Id<'rondas'>,
  })
}

export async function assignParticipante(
  rondaId: string,
  workosUserId: string,
  email: string,
  participantProfile: ParticipantePerfil
): Promise<void> {
  await fetchMutation(api.rondas.index.assignParticipante, {
    rondaId: rondaId as Id<'rondas'>,
    workosUserId,
    email,
    participantProfile,
  })
}

export async function regenerateParticipanteSlot(
  rondaId: string,
  participanteId: string,
  workosUserId: string,
  email: string
): Promise<void> {
  await fetchMutation(api.rondas.index.regenerateParticipanteSlot, {
    rondaId: rondaId as Id<'rondas'>,
    participanteId: participanteId as Id<'rondaParticipantes'>,
    workosUserId,
    email,
  })
}

export async function removeParticipante(
  rondaId: string,
  participanteId: string
): Promise<void> {
  await fetchMutation(api.rondas.index.removeParticipante, {
    rondaId: rondaId as Id<'rondas'>,
    participanteId: participanteId as Id<'rondaParticipantes'>,
  })
}

export async function addReferenceSlot(
  rondaId: string,
  workosUserId: string,
  email: string
): Promise<void> {
  await fetchMutation(api.rondas.index.addReferenceSlot, {
    rondaId: rondaId as Id<'rondas'>,
    workosUserId,
    email,
  })
}

// ---------------------------------------------------------------------------
// RondaParticipanteAsignada / ParticipanteGlobal types
// ---------------------------------------------------------------------------

export type RondaParticipanteAsignada = Ronda & {
  email: string
  invitado_at: string
  ronda_participante_id: string
  participant_profile: ParticipantePerfil
  ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
  envios_pt_count: number
  envio_pt_enviado: boolean
}

export type ParticipanteGlobal = {
  workos_user_id: string
  email: string
  nit: string | null
  nit_laboratorio: string | null
  correo_laboratorio: string | null
  ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
  rondas: {
    id: string
    codigo: string
    nombre: string
    estado: EstadoRonda
    envios_count: number
    participant_profile: ParticipantePerfil
    ronda_participante_id: string | null
    ficha_estado: 'no_iniciada' | 'borrador' | 'enviado'
    nit_laboratorio: string | null
    correo_laboratorio: string | null
    estado_enlace: 'pendiente' | 'reclamado'
  }[]
  total_envios: number
}

// ---------------------------------------------------------------------------
// PT Items & Sample Groups — read
// ---------------------------------------------------------------------------

export const listPTItems = dataOf(listPTItemsWithStatus)

export async function listPTItemsWithStatus(rondaId: string) {
  const result = await safeConvexCallWithStatus(
    'listPTItems',
    () => fetchQuery(api.pt.index.listPTItems, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return { data: result.data.map(mapPTItemDoc), offline: result.offline }
}

export const listPTSampleGroups = dataOf(listPTSampleGroupsWithStatus)

export async function listPTSampleGroupsWithStatus(rondaId: string) {
  const result = await safeConvexCallWithStatus(
    'listPTSampleGroups',
    () => fetchQuery(api.pt.index.listPTSampleGroups, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return { data: result.data.map(mapPTSampleGroupDoc), offline: result.offline }
}

// ---------------------------------------------------------------------------
// Participantes PT — read
// ---------------------------------------------------------------------------

export const getRondaParticipantePT = dataOf(getRondaParticipantePTWithStatus)

export async function getRondaParticipantePTWithStatus(
  rondaId: string
) {
  const result = await safeConvexCallWithStatus(
    'getRondaParticipantePT',
    () => fetchQuery(api.pt.index.getRondaParticipantePT, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    null,
  )
  return {
    data: result.data ? mapParticipantePTDoc(result.data) : null,
    offline: result.offline,
  }
}

export async function listParticipantesPT(rondaId: string): Promise<RondaParticipantePT[]> {
  const rows = await safeConvexCall(
    'listParticipantesPT',
    () => fetchQuery(api.pt.index.listParticipantesPT, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
  return rows.map(mapParticipantePTDoc)
}

// ---------------------------------------------------------------------------
// Envios PT — read
// ---------------------------------------------------------------------------

export const listEnviosPT = dataOf(listEnviosPTWithStatus)

export async function listEnviosPTWithStatus(rondaId: string) {
  const result = await safeConvexCallWithStatus(
    'listEnviosPT',
    () => fetchQuery(api.pt.index.listEnviosPT, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    [],
  )
  return { data: result.data.map(mapEnvioPTDoc), offline: result.offline }
}

export async function listEnviosPTByParticipante(rondaParticipanteId: string): Promise<EnvioPT[]> {
  const rows = await safeConvexCall(
    'listEnviosPTByParticipante',
    () => fetchQuery(api.pt.index.listEnviosPTByParticipante, {
      rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    }),
    [],
  )
  return rows.map(mapEnvioPTDoc)
}

export async function getEnvioPT(
  rondaParticipanteId: string,
  ptItemId: string,
  sampleGroupId: string
): Promise<EnvioPT | null> {
  const row = await safeConvexCall(
    'getEnvioPT',
    () => fetchQuery(api.pt.index.getEnvioPT, {
      rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
      ptItemId: ptItemId as Id<'rondaPtItems'>,
      sampleGroupId: sampleGroupId as Id<'rondaPtSampleGroups'>,
    }),
    null,
  )
  if (!row) return null
  return mapEnvioPTDoc(row)
}

export const getEstadoEnvioPTParticipante = dataOf(getEstadoEnvioPTParticipanteWithStatus)

export async function getEstadoEnvioPTParticipanteWithStatus(
  rondaId: string
) {
  return safeConvexCallWithStatus(
    'getEstadoEnvioPTParticipante',
    () => fetchQuery(api.pt.index.getEstadoEnvioPTParticipante, {
      rondaId: rondaId as Id<'rondas'>,
    }),
    {
      completo: false,
      enviado: false,
      enviados_at: null,
      total_esperado: 0,
      total_guardado: 0,
    },
  )
}

export async function getEstadoEnvioPTByParticipante(
  rondaParticipanteId: string
): Promise<EstadoEnvioParticipante> {
  return safeConvexCall(
    'getEstadoEnvioPTByParticipante',
    () => fetchQuery(api.pt.index.getEstadoEnvioPTByParticipante, {
      rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    }),
    {
      completo: false,
      enviado: false,
      enviados_at: null,
      total_esperado: 0,
      total_guardado: 0,
    },
  )
}

export async function getParticipanteRondaResumen(
  participanteId: string
): Promise<ParticipanteRondaResumen | null> {
  const row = await safeConvexCall(
    'getParticipanteRondaResumen',
    () => fetchQuery(api.rondas.index.getParticipanteRondaResumen, {
      participanteId: participanteId as Id<'rondaParticipantes'>,
    }),
    null,
  )
  if (!row) return null
  return mapParticipanteRondaResumenDoc(row)
}

export const listResultadosPTRonda = dataOf(listResultadosPTRondaWithStatus)

export async function listResultadosPTRondaWithStatus(rondaId: string) {
  return safeConvexCallWithStatus(
    'listResultadosPTRonda',
    () => fetchQuery(api.pt.index.listResultadosPTRonda, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
}

export async function listEnviosPTRound(rondaId: string): Promise<EnvioPTConMetadatos[]> {
  return safeConvexCall(
    'listEnviosPTRound',
    () => fetchQuery(api.pt.index.listEnviosPTRound, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )
}

// ---------------------------------------------------------------------------
// Envios PT — mutations
// ---------------------------------------------------------------------------

export async function upsertEnvioPT(
  rondaId: string,
  rondaParticipanteId: string,
  ptItemId: string,
  sampleGroupId: string,
  d1: number,
  d2: number | null,
  d3: number | null,
  meanValue: number,
  sdValue: number,
  ux: number,
  uxExp: number,
  k = 2,
): Promise<EnvioPT> {
  await fetchMutation(api.pt.index.upsertEnvioPT, {
    rondaId: rondaId as Id<'rondas'>,
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    ptItemId: ptItemId as Id<'rondaPtItems'>,
    sampleGroupId: sampleGroupId as Id<'rondaPtSampleGroups'>,
    d1,
    d2: d2 ?? undefined,
    d3: d3 ?? undefined,
    meanValue,
    sdValue,
    ux,
    uxExp,
    k,
  })
  const row = await fetchQuery(api.pt.index.getEnvioPT, {
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
    ptItemId: ptItemId as Id<'rondaPtItems'>,
    sampleGroupId: sampleGroupId as Id<'rondaPtSampleGroups'>,
  })
  if (!row) throw new Error('No fue posible recuperar el envio PT tras guardarlo')
  return mapEnvioPTDoc(row)
}

export async function deleteParticipanteEnviosPT(rondaId: string, rondaParticipanteId: string): Promise<number> {
  return fetchMutation(api.pt.index.deleteParticipanteEnviosPT, {
    rondaId: rondaId as Id<'rondas'>,
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
  })
}

export async function submitFinalPT(rondaId: string): Promise<string> {
  return fetchMutation(api.pt.index.submitFinalPT, {
    rondaId: rondaId as Id<'rondas'>,
  })
}

export async function submitFinalPTByParticipante(rondaParticipanteId: string): Promise<string> {
  return fetchMutation(api.pt.index.submitFinalPTByParticipante, {
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
  })
}

export async function reabrirEnvioFinalPT(rondaParticipanteId: string): Promise<{
  previousSubmittedAt: string | null
  updatedCells: number
}> {
  return fetchMutation(api.pt.index.reabrirEnvioFinalPT, {
    rondaParticipanteId: rondaParticipanteId as Id<'rondaParticipantes'>,
  })
}

// ---------------------------------------------------------------------------
// Admin PT — mutations
// ---------------------------------------------------------------------------

export async function createPTItem(
  rondaId: string,
  contaminante: Contaminante,
  runCode: string,
  levelLabel: string,
  sortOrder: number
): Promise<RondaPTItem> {
  const doc = await fetchMutation(api.pt.index.createPTItem, {
    rondaId: rondaId as Id<'rondas'>,
    contaminante,
    runCode,
    levelLabel,
    sortOrder,
  })
  if (!doc) throw new Error('No fue posible recuperar el item PT tras crearlo')
  return {
    id: doc._id as string,
    ronda_id: doc.rondaId as string,
    contaminante: doc.contaminante,
    run_code: doc.runCode,
    level_label: doc.levelLabel,
    sort_order: doc.sortOrder,
    created_at: new Date(doc._creationTime).toISOString(),
  }
}

export async function createPTItemsBulk(
  rondaId: string,
  contaminante: Contaminante,
  items: RondaPTItemInput[]
): Promise<RondaPTItem[]> {
  const docs = await fetchMutation(api.pt.index.createPTItemsBulk, {
    rondaId: rondaId as Id<'rondas'>,
    contaminante,
    items,
  })
  return docs.map((doc) => {
    if (!doc) throw new Error('No fue posible recuperar un item PT tras crearlo')
    return {
      id: doc._id as string,
      ronda_id: doc.rondaId as string,
      contaminante: doc.contaminante,
      run_code: doc.runCode,
      level_label: doc.levelLabel,
      sort_order: doc.sortOrder,
      created_at: new Date(doc._creationTime).toISOString(),
    }
  })
}

export async function createPTSampleGroup(
  rondaId: string,
  sampleGroup: string,
  sortOrder: number
): Promise<RondaPTSampleGroup> {
  const doc = await fetchMutation(api.pt.index.createPTSampleGroup, {
    rondaId: rondaId as Id<'rondas'>,
    sampleGroup,
    sortOrder,
  })
  if (!doc) throw new Error('No fue posible recuperar el grupo de muestra PT tras crearlo')
  return {
    id: doc._id as string,
    ronda_id: doc.rondaId as string,
    sample_group: doc.sampleGroup,
    sort_order: doc.sortOrder,
    created_at: new Date(doc._creationTime).toISOString(),
  }
}

export async function updateParticipantePT(
  participanteId: string,
  participantCode: string | null,
  replicateCode: number | null
): Promise<void> {
  await fetchMutation(api.pt.index.updateParticipantePT, {
    participanteId: participanteId as Id<'rondaParticipantes'>,
    participantCode,
    replicateCode,
  })
}

export async function updateParticipanteEmail(
  rondaId: string,
  participanteId: string,
  email: string
): Promise<void> {
  await fetchMutation(api.rondas.index.updateParticipanteEmail, {
    rondaId: rondaId as Id<'rondas'>,
    participanteId: participanteId as Id<'rondaParticipantes'>,
    email,
  })
}

export async function updatePTItem(
  rondaId: string,
  itemId: string,
  runCode: string,
  levelLabel: string
): Promise<RondaPTItem> {
  const doc = await fetchMutation(api.pt.index.updatePTItem, {
    rondaId: rondaId as Id<'rondas'>,
    itemId: itemId as Id<'rondaPtItems'>,
    runCode,
    levelLabel,
  })
  if (!doc) throw new Error('No fue posible recuperar el item PT tras actualizarlo')
  return {
    id: doc._id as string,
    ronda_id: doc.rondaId as string,
    contaminante: doc.contaminante,
    run_code: doc.runCode,
    level_label: doc.levelLabel,
    sort_order: doc.sortOrder,
    created_at: new Date(doc._creationTime).toISOString(),
  }
}

export async function deletePTItem(rondaId: string, itemId: string): Promise<void> {
  await fetchMutation(api.pt.index.deletePTItem, {
    rondaId: rondaId as Id<'rondas'>,
    itemId: itemId as Id<'rondaPtItems'>,
  })
}

export async function deletePTSampleGroup(rondaId: string, groupId: string): Promise<void> {
  await fetchMutation(api.pt.index.deletePTSampleGroup, {
    rondaId: rondaId as Id<'rondas'>,
    groupId: groupId as Id<'rondaPtSampleGroups'>,
  })
}

// ---------------------------------------------------------------------------
// listAllEnviosPT
// ---------------------------------------------------------------------------

export async function listAllEnviosPT(rondaId: string): Promise<EnvioPTWithRelations[]> {
  const rows = await safeConvexCall(
    'listAllEnviosPT',
    () => fetchQuery(api.pt.index.listAllEnviosPT, { rondaId: rondaId as Id<'rondas'> }),
    [],
  )

  return rows.map(({ envio, ptItem, sampleGroup, participante }) => ({
    ...mapEnvioPTDoc(envio),
    pt_item: mapPTItemDoc(ptItem),
    sample_group: mapPTSampleGroupDoc(sampleGroup),
    participante: mapParticipantePTDoc(participante),
  }))
}

// ---------------------------------------------------------------------------
// Estado operativo — async loader (derivación pura en ./estados)
// ---------------------------------------------------------------------------

export const getRondaMetricasCompletas = dataOf(getRondaMetricasCompletasWithStatus)

export async function getRondaMetricasCompletasWithStatus(
  rondaId: string,
  ronda: Pick<Ronda, 'estado'>
) {
  const [participantesResult, resultadosPTResult, ptItemsResult] = await Promise.all([
    listParticipantesRondaResumenWithStatus(rondaId),
    listResultadosPTRondaWithStatus(rondaId),
    listPTItemsWithStatus(rondaId),
  ])
  const participantes = participantesResult.data
  const resultadosPT = resultadosPTResult.data
  const ptItems = ptItemsResult.data
  const offline = participantesResult.offline || resultadosPTResult.offline || ptItemsResult.offline

  const cupos_totales = participantes.length
  const cupos_reclamados = participantes.filter((p) => p.estado === 'reclamado').length
  const fichas_enviadas = participantes.filter((p) => p.ficha_estado === 'enviado').length
  const fichas_pendientes = cupos_reclamados - fichas_enviadas
  const envios_esperados = cupos_reclamados
  const envios_finales = resultadosPT.filter((r) => r.enviados_at !== null).length
  const pt_configurado = ptItems.length > 0

  const datos = {
    cupos_totales,
    cupos_reclamados,
    fichas_enviadas,
    fichas_pendientes,
    envios_finales,
    envios_esperados,
    pt_configurado,
  }

  const { estado_operativo, accion_recomendada } = derivarEstadoOperativo(ronda, datos)

  return { data: { ...datos, estado_operativo, accion_recomendada }, offline }
}
