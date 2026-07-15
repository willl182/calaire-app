import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let data = null
  try { data = await fetchQuery(api.pt.certificates.verify, { certificateId: id as Id<'ptCertificados'> }) } catch { data = null }
  return <main className="min-h-screen bg-slate-50 px-6 py-16"><section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow"><h1 className="text-2xl font-bold">Verificación de certificado</h1>{data ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><p className="font-semibold">Certificado válido</p><p className="mt-2 text-sm">Ronda: {data.ronda}</p><p className="text-sm">Código de participante: {data.participantCode ?? '—'}</p><p className="text-sm">Emitido: {new Intl.DateTimeFormat('es-CO').format(new Date(data.emitidoAt))}</p></div> : <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">Certificado inexistente, pendiente o inválido.</div>}</section></main>
}
