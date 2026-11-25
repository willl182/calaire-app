// Casos PT: consultas, quejas y apelaciones del participante y su revisión.
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { authedMutation as fetchMutation, authedQuery as fetchQuery } from '@/server/convex'

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
