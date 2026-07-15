import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRonda, listPtCasesAdmin } from '@/server/rondas'
import { RondaContextNav } from '../RondaContextNav'

export default async function AdminCasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, ronda = await getRonda(id)
  if (!ronda) notFound()
  const cases = await listPtCasesAdmin(id)
  return <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
    <RondaContextNav rondaId={id} rondaCodigo={ronda.codigo}/>
    <div><h1 className="text-3xl font-bold">Casos de la ronda</h1><p className="text-[var(--foreground-muted)]">Revisión documental y seguimiento de eficacia.</p></div>
    <div className="grid gap-4">{cases.map(item => <section className="card p-5" key={item._id}><div className="flex flex-wrap items-start justify-between gap-3"><div><strong>{item.codigo} · {item.titulo}</strong><p className="text-sm text-slate-500">{item.tipo} · {item.responsable}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{item.estado.replaceAll('_', ' ')}</span></div><Link className="mt-3 inline-block text-sm text-blue-700" href={`/dashboard/rondas/${id}/casos/${item._id}`}>Revisar expediente</Link></section>)}</div>
  </main>
}
