import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let data = null
  try { data = await fetchQuery(api.pt.certificates.verify, { certificateId: id as Id<'ptCertificados'> }) } catch { data = null }
  return <main className="min-h-screen bg-surface px-6 py-16"><section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow"><h1 className="text-2xl font-bold">Verificación de certificado</h1>{data ? <div className="mt-6 rounded-xl border border-success-border bg-success-soft p-5 text-success-strong"><p className="font-semibold">Certificado válido</p><p className="mt-2 text-sm">Ronda: {data.ronda}</p><p className="text-sm">Código de participante: {data.participantCode ?? '—'}</p><p className="text-sm">Emitido: {new Intl.DateTimeFormat('es-CO').format(new Date(data.emitidoAt))}</p></div> : <div className="mt-6 rounded-xl border border-danger-border bg-danger-soft p-5 text-danger-strong">Certificado inexistente, pendiente o inválido.</div>}</section></main>
}
