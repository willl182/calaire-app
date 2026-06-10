import { notFound, redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/lib/auth'
import { getRonda } from '@/lib/rondas'
import { getPanelSgc } from '@/lib/sgc'
import { SGC_LEYENDA_CODIGO_PROVISIONAL } from '@/lib/sgc/catalog'

type PageProps = { params: Promise<{ id: string }> }

function fmt(ms?: number | null) {
  return ms ? new Date(ms).toLocaleString('es-CO') : 'Sin fecha'
}

const BLOQUE_LABELS: Record<string, string> = {
  a: 'a) Personal involucrado en el diseño y la operación del programa de EA.',
  b: 'b) Actividades de los proveedores externos de productos y servicios y sus datos de contacto.',
  c: 'c) Criterios que deben cumplirse para participar en el programa de EA.',
  d: 'd) Número y tipo de participantes esperados.',
  e: 'e) Descripción de las actividades a realizar y los resultados que deben informar los participantes.',
  f: 'f) Descripción del rango de valores o características esperadas de los ítems de EA.',
  g: 'g) Principales fuentes potenciales de errores relacionadas con el área técnica del EA.',
  h: 'h) Requisitos para la producción, control de calidad, almacenamiento y distribución de los ítems de EA.',
  i: 'i) Disposiciones para evitar colusión o falsificación de resultados entre participantes.',
  j: 'j) Descripción de la información a suministrar a los participantes y cronograma de actividades.',
  k: 'k) Para EA continuos: frecuencia de distribución de ítems, fechas límite para reporte de resultados y fechas para la ejecución de las mediciones.',
  l: 'l) Información sobre métodos o procedimientos que los participantes deben utilizar para almacenar, manipular, preparar, enviar o desechar los ítems, así como para realizar mediciones.',
  m: 'm) Procedimientos de medición o métodos de ensayo para las pruebas de homogeneidad y estabilidad de los ítems.',
  n: 'n) Preparación de formatos normalizados de informe que deben utilizar los participantes.',
  o: 'o) Descripción detallada del análisis estadístico a utilizar.',
  p: 'p) Origen, trazabilidad metrológica e incertidumbre de los valores asignados.',
  q: 'q) Tratamiento de resultados obtenidos por diferentes métodos de medición que permitan evaluación comparable.',
  r: 'r) Criterios para la evaluación del desempeño de los participantes.',
  s: 's) Descripción de los datos, informes provisionales o información a devolver a los participantes.',
  t: 't) Descripción del grado en que los resultados serán públicos y las conclusiones basadas en ellos.',
  u: 'u) Procedimientos en caso de pérdida, deterioro o daño de los ítems de EA.',
}

export default async function PlanRondaPrintPage({ params }: PageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')
  const { id } = await params
  const ronda = await getRonda(id)
  const panel = await getPanelSgc(id)
  if (!ronda || !panel) notFound()
  const plan = panel.plan

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-10 text-slate-950 print:px-0">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">F-PPSEA-03 / F-PSEA-06</p>
      <h1 className="mt-2 text-3xl font-semibold">Plan de ronda {ronda.codigo}</h1>
      <p className="mt-1 text-slate-600">{ronda.nombre}</p>
      <div className="mt-6 grid gap-3 border-y border-slate-200 py-4 text-sm sm:grid-cols-2">
        <div><strong>Estado documental:</strong> {plan?.estado ?? 'borrador'}</div>
        <div><strong>Responsable:</strong> {plan?.camposEstructurados?.responsable ?? 'Sin responsable'}</div>
        <div><strong>Fecha plan:</strong> {plan?.camposEstructurados?.fecha_plan ?? 'Sin fecha'}</div>
        <div><strong>Finalizado:</strong> {fmt(plan?.finalizadoAt)}</div>
        <div><strong>Finalizado por:</strong> {plan?.finalizadoBy ?? 'No finalizado'}</div>
        <div><strong>Snapshot/version:</strong> ver bitacora SGC</div>
      </div>
      <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900">
        {SGC_LEYENDA_CODIGO_PROVISIONAL}
      </p>
      <section className="mt-8 space-y-6">
        {'abcdefghijklmnopqrstu'.split('').map((key) => {
          const label = BLOQUE_LABELS[key] || `Bloque ${key.toUpperCase()}`
          const value = plan?.bloques?.[key]
          return (
            <article key={key} className="border-b border-slate-100 pb-4 last:border-b-0">
              <h2 className="text-base font-semibold text-slate-950">{label}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {value || 'Sin contenido registrado.'}
              </p>
            </article>
          )
        })}
      </section>
    </main>
  )
}
