import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMyPtCases, getRondaByCodigo } from '@/server/rondas'
import { createCaseAction } from './actions'

export default async function CasesPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const ronda = await getRondaByCodigo(codigo)
  if (!ronda) notFound()
  const cases = await getMyPtCases(ronda.id)
  const create = createCaseAction.bind(null, codigo, ronda.id)
  return <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
    <div><Link className="text-sm text-blue-700" href={`/ronda/${codigo}`}>← Volver a la ronda</Link><h1 className="mt-2 text-3xl font-bold">Casos y expedientes</h1><p className="text-[var(--foreground-muted)]">Seguimiento privado entre el participante y Calaire.</p></div>
    <section className="card p-5"><h2 className="text-lg font-semibold">Mis casos</h2><div className="mt-3 grid gap-3">{cases.length ? cases.map(item => <Link className="rounded-lg border p-4 hover:border-blue-400" key={item._id} href={`/ronda/${codigo}/casos/${item._id}`}><div className="flex justify-between gap-3"><strong>{item.codigo} · {item.titulo}</strong><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{item.estado.replaceAll('_', ' ')}</span></div><p className="mt-1 text-sm text-[var(--foreground-muted)]">{item.tipo}</p></Link>) : <p className="text-sm text-[var(--foreground-muted)]">No hay casos en esta ronda.</p>}</div></section>
    <section className="card p-5"><h2 className="text-lg font-semibold">Nuevo caso voluntario</h2><form action={create} className="mt-4 grid gap-3"><select className="input" name="tipo" required><option value="consulta">Consulta</option><option value="queja">Queja</option><option value="apelacion">Apelación</option></select><input className="input" name="titulo" placeholder="Título" required maxLength={160}/><textarea className="input min-h-28" name="descripcion" placeholder="Descripción" required maxLength={4000}/><button className="btn-primary w-fit" type="submit">Crear caso</button></form></section>
  </main>
}
