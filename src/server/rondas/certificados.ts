// Certificados PT del participante.
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { authedMutation as fetchMutation, authedQuery as fetchQuery } from '@/server/convex'

export async function getMyPtCertificate(rondaId: string) {
  return fetchQuery(api.pt.certificates.getMine, { rondaId: rondaId as Id<'rondas'> })
}

export async function getMyPtCertificateDownload(rondaId: string) {
  return fetchMutation(api.pt.certificates.getMineDownload, { rondaId: rondaId as Id<'rondas'> })
}
