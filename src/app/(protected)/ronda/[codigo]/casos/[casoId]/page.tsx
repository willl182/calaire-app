import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPtCase } from '@/server/rondas'
import { messageCaseAction, submitCaseAction, uploadCaseDocumentAction } from '../actions'
import { FileInput } from '@/components/ui/FileInput'
import { SubmitButton } from '@/components/ui/SubmitButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Caso' }

const labels = { analisis_causa: 'Análisis de causa', plan_accion: 'Plan de acción', implementacion: 'Implementación', verificacion_eficacia: 'Verificación de eficacia' }

export default async function CaseDetailPage({ params }: { params: Promise<{ codigo: string; casoId: string }> }) {
  const { codigo, casoId } = await params
  const data = await getPtCase(casoId).catch(() => null)
  if (!data || data.admin) notFound()
  const canUpload = data.caso.estado === 'abierto' || data.caso.estado === 'esperando_participante'
  const verificationsByOrigin = new Map(data.verifications.map(check => [String(check.ptScoreOrigenId), check]))
  const upload = uploadCaseDocumentAction.bind(null, codigo, casoId), submit = submitCaseAction.bind(null, codigo, casoId), message = messageCaseAction.bind(null, codigo, casoId)
  return <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
    <div><Link className="text-sm text-info-strong" href={`/ronda/${codigo}/casos`}>← Casos</Link><h1 className="mt-2 text-3xl font-bold">{data.caso.codigo}</h1><p>{data.caso.titulo}</p><span className="mt-2 inline-block rounded-full bg-surface-muted px-3 py-1 text-sm">{data.caso.estado.replaceAll('_', ' ')}</span></div>
    {data.origins.length > 0 && <section className="card p-5"><h2 className="font-semibold">Resultados origen</h2><p className="mt-1 text-sm text-muted">El expediente se cierra cuando la documentación esté aceptada y todos los resultados tengan eficacia satisfactoria.</p><div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Contaminante</th><th>Nivel</th><th>Método</th><th>Clasificación</th><th>Eficacia posterior</th></tr></thead><tbody>{data.origins.map(origin => { const verification = verificationsByOrigin.get(String(origin!._id)); return <tr className="border-t" key={origin!._id}><td className="py-2">{origin!.item?.contaminante}</td><td>{origin!.item?.nivel}</td><td>{origin!.metodo}</td><td>no satisfactorio</td><td><span>{verification?.resultado.replaceAll('_', ' ') ?? 'pendiente'}</span>{verification?.posterior && <span className="block text-xs text-muted">{verification.posterior.rondaCodigo} · {verification.posterior.contaminante} · {verification.posterior.nivel} · {verification.posterior.metodo}</span>}</td></tr> })}</tbody></table></div></section>}
    <section className="card p-5"><h2 className="font-semibold">Documentos versionados</h2><p className="mt-1 text-xs text-[var(--foreground-muted)]">PDF, imágenes, CSV o Excel; máximo 15 MB por archivo.</p><div className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries(labels).map(([key, label]) => { const doc = data.documents.find(item => item.categoria === key); return <div className="rounded-lg border p-4" key={key}><strong>{label}</strong><ul className="my-2 text-sm">{doc?.versiones.map(version => <li key={version._id}>v{version.version} · <a className="text-info-strong underline" href={`/ronda/${codigo}/casos/${casoId}/documentos/${version._id}`}>{version.nombreArchivo}</a> · {version.estado}</li>) ?? <li>Sin versiones</li>}</ul>{canUpload && <form action={upload}><input type="hidden" name="categoria" value={key}/><FileInput name="archivo" aria-label={`Archivo para ${label}`} accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xls,.xlsx" required/><SubmitButton className="btn-outline mt-2" pendingLabel="Subiendo…">Agregar versión</SubmitButton></form>}</div>})}</div>{canUpload && <form action={submit} className="mt-5"><SubmitButton pendingLabel="Enviando…">Enviar a revisión</SubmitButton><p className="mt-2 text-xs text-[var(--foreground-muted)]">El primer envío exige análisis, plan e implementación. Después de ajustes basta agregar las versiones corregidas. Toda versión enviada queda inmutable.</p></form>}</section>
    <section className="card p-5"><h2 className="font-semibold">Bitácora de mensajes</h2><div className="my-4 space-y-2">{data.messages.map(item => <div className="rounded-lg bg-surface p-3 text-sm" key={item._id}><strong>{item.autorTipo}</strong><span className="ml-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString('es-CO')}</span><p>{item.texto}</p></div>)}</div>{data.caso.estado !== 'cerrado' && <form action={message} className="flex gap-2"><input className="input flex-1" name="texto" placeholder="Escriba un mensaje" required/><SubmitButton className="btn-outline">Enviar</SubmitButton></form>}</section>
    {data.caso.estado === 'cerrado' && <a className="btn-primary inline-block" href={`/ronda/${codigo}/casos/${casoId}/expediente.zip`}>Descargar expediente ZIP</a>}
  </main>
}
