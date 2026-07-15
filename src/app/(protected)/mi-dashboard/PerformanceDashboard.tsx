'use client'

import { useMemo, useState } from 'react'

type Statistic = 'z' | 'zPrima' | 'zeta' | 'en'
type Point = {
  rondaCodigo: string; fecha: number; contaminante: string; nivel: string; metodo: string
  z: number | null; zPrima: number | null; zeta: number | null; en: number | null
  clasificacion: 'satisfactorio' | 'no_satisfactorio'
}
type Performance = {
  fechaConsulta: number
  series: { contaminante: string; nivel: string; metodo: string; puntos: Point[] }[]
  rondas: { rondaCodigo: string; fecha: number; satisfactorios: number; noSatisfactorios: number; porcentajeSatisfactorio: number }[]
}

const labels: Record<Statistic, string> = { z: 'z', zPrima: "z'", zeta: 'ζ', en: 'En' }
const palette = ['#005a4e', '#d09b2c', '#2563eb', '#9333ea', '#be123c', '#0e7490']

function unique(values: string[]) { return [...new Set(values)].sort((a, b) => a.localeCompare(b)) }
function formatDate(value: number) { return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short' }).format(value) }

function Timeline({ points, statistic }: { points: Point[]; statistic: Statistic }) {
  const rows = points.filter((point) => point[statistic] !== null)
  const limit = statistic === 'en' ? 1 : 3
  const warning = statistic === 'en' ? 1 : 2
  const yMax = Math.max(limit + 0.5, ...rows.map((point) => Math.abs(point[statistic] ?? 0)))
  const x = (index: number) => rows.length === 1 ? 50 : 8 + index * 84 / (rows.length - 1)
  const y = (value: number) => 50 - value * 42 / yMax
  const polyline = rows.map((point, index) => `${x(index)},${y(point[statistic] ?? 0)}`).join(' ')
  return (
    <div className="overflow-x-auto" role="img" aria-label={`Evolución temporal de ${labels[statistic]}`}>
      <svg viewBox="0 0 100 70" className="min-w-[620px] w-full" aria-hidden="true">
        <rect x="5" y={y(warning)} width="90" height={y(-warning) - y(warning)} fill="#d1fae5" opacity="0.7" />
        {statistic !== 'en' && <><rect x="5" y={y(limit)} width="90" height={y(warning) - y(limit)} fill="#fef3c7" /><rect x="5" y={y(-warning)} width="90" height={y(-limit) - y(-warning)} fill="#fef3c7" /></>}
        {[-limit, -warning, 0, warning, limit].filter((value, index, all) => all.indexOf(value) === index).map((value) => <g key={value}><line x1="5" x2="95" y1={y(value)} y2={y(value)} stroke={value === 0 ? '#64748b' : '#cbd5e1'} strokeDasharray={value === 0 ? undefined : '2 2'} /><text x="1" y={y(value) + 1} fontSize="2.8" fill="#64748b">{value}</text></g>)}
        {rows.length > 1 && <polyline points={polyline} fill="none" stroke="#005a4e" strokeWidth="1.2" />}
        {rows.map((point, index) => <g key={`${point.rondaCodigo}-${point.metodo}-${index}`}><circle cx={x(index)} cy={y(point[statistic] ?? 0)} r="1.8" fill={point.clasificacion === 'satisfactorio' ? '#047857' : '#be123c'}><title>{point.rondaCodigo}: {point[statistic]}</title></circle><text x={x(index)} y="66" textAnchor="middle" fontSize="2.6" fill="#475569">{point.rondaCodigo}</text></g>)}
      </svg>
      {rows.length === 0 && <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">No hay valores para este estadístico con los filtros seleccionados.</p>}
    </div>
  )
}

export function PerformanceDashboard({ data }: { data: Performance }) {
  const allPoints = useMemo(() => data.series.flatMap((series) => series.puntos), [data.series])
  const [statistic, setStatistic] = useState<Statistic>('z')
  const [contaminante, setContaminante] = useState('todos')
  const [nivel, setNivel] = useState('todos')
  const [metodo, setMetodo] = useState('todos')
  const [ronda, setRonda] = useState('todas')
  const [periodo, setPeriodo] = useState('todo')
  const cutoff = periodo === 'todo' ? 0 : data.fechaConsulta - Number(periodo) * 24 * 60 * 60 * 1000
  const filtered = allPoints.filter((point) => (contaminante === 'todos' || point.contaminante === contaminante) && (nivel === 'todos' || point.nivel === nivel) && (metodo === 'todos' || point.metodo === metodo) && (ronda === 'todas' || point.rondaCodigo === ronda) && point.fecha >= cutoff)
  const filteredRounds = data.rondas.filter((item) => (ronda === 'todas' || item.rondaCodigo === ronda) && item.fecha >= cutoff)
  const heatmap = unique(filtered.map((point) => point.contaminante)).flatMap((pollutant) => unique(filtered.filter((point) => point.contaminante === pollutant).map((point) => point.metodo)).map((method) => {
    const cells = filtered.filter((point) => point.contaminante === pollutant && point.metodo === method)
    return { pollutant, method, percent: cells.filter((point) => point.clasificacion === 'satisfactorio').length / cells.length * 100, n: cells.length }
  }))

  if (allPoints.length === 0) return <section className="card p-6"><h2 className="text-lg font-semibold">Mi desempeño histórico</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">Aún no hay evaluaciones publicadas para construir el historial.</p></section>

  return <section className="card space-y-6 p-6" aria-labelledby="performance-title">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pt-primary-dark)]">Resultados publicados</p><h2 id="performance-title" className="mt-1 text-xl font-bold">Mi desempeño histórico</h2><p className="mt-1 text-sm text-[var(--foreground-muted)]">Compare sus estadísticos entre rondas. La clasificación mostrada es la importada oficialmente.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {([['Estadístico', statistic, setStatistic, Object.keys(labels)], ['Periodo', periodo, setPeriodo, ['todo', '365', '730']], ['Ronda', ronda, setRonda, ['todas', ...unique(allPoints.map((p) => p.rondaCodigo))]], ['Contaminante', contaminante, setContaminante, ['todos', ...unique(allPoints.map((p) => p.contaminante))]], ['Nivel', nivel, setNivel, ['todos', ...unique(allPoints.map((p) => p.nivel))]], ['Método', metodo, setMetodo, ['todos', ...unique(allPoints.map((p) => p.metodo))]]] as const).map(([label, value, setter, options]) => <label key={label} className="text-xs font-semibold text-[var(--foreground-muted)]">{label}<select className="input mt-1 w-full" value={value} onChange={(event) => setter(event.target.value as never)}>{options.map((option) => <option key={option} value={option}>{label === 'Estadístico' ? labels[option as Statistic] : label === 'Periodo' ? ({ todo: 'Todo', '365': 'Último año', '730': 'Últimos 2 años' }[option] ?? option) : option}</option>)}</select></label>)}
    </div>
    <div className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Evolución de {labels[statistic]}</h3><p className="text-xs text-[var(--foreground-muted)]">Verde: zona aceptable · Amarillo: advertencia · Rojo: resultado no satisfactorio</p></div><Timeline points={filtered} statistic={statistic} /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--border)] p-4"><h3 className="font-semibold">Clasificación por ronda</h3><div className="mt-4 space-y-4">{filteredRounds.map((item) => <div key={item.rondaCodigo}><div className="mb-1 flex justify-between text-xs"><span>{item.rondaCodigo} · {formatDate(item.fecha)}</span><span>{item.porcentajeSatisfactorio.toFixed(0)}% satisfactorio</span></div><div className="flex h-5 overflow-hidden rounded-full bg-slate-100"><div className="bg-emerald-600" style={{ width: `${item.porcentajeSatisfactorio}%` }} title={`${item.satisfactorios} satisfactorios`} /><div className="bg-rose-700" style={{ width: `${100 - item.porcentajeSatisfactorio}%` }} title={`${item.noSatisfactorios} no satisfactorios`} /></div></div>)}</div></div>
      <div className="rounded-xl border border-[var(--border)] p-4"><h3 className="font-semibold">Comparativo por método</h3><p className="mt-1 text-xs text-[var(--foreground-muted)]">Porcentaje satisfactorio por contaminante y método.</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{heatmap.map((cell, index) => <div key={`${cell.pollutant}-${cell.method}`} className="rounded-lg p-3 text-white" style={{ backgroundColor: palette[index % palette.length], opacity: 0.45 + cell.percent / 180 }} title={`${cell.n} resultados`}><p className="text-xs font-semibold">{cell.pollutant} · {cell.method}</p><p className="mt-1 text-xl font-bold">{cell.percent.toFixed(0)}%</p><p className="text-[10px]">n={cell.n}</p></div>)}</div></div>
    </div>
  </section>
}
