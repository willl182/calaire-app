'use client'

import { useMemo, useState } from 'react'

type Statistic = 'z' | 'zPrima' | 'zeta' | 'en'

type Result = {
  _id: string
  metodo: string
  unidad: string
  valorAsignado: number
  valorParticipante: number
  z: number | null
  zPrima: number | null
  zeta: number | null
  en: number | null
  clasificacion: 'satisfactorio' | 'no_satisfactorio'
  item: { contaminante: string; runCode: string; levelLabel: string } | null
  stats: { n: number; bins: { desde: number; hasta: number; n: number }[] } | null
}

const STATISTIC_LABELS: Record<Statistic, string> = {
  z: 'z',
  zPrima: "z'",
  zeta: 'ζ',
  en: 'En',
}

function formatNumber(value: number | null, maximumFractionDigits = 3) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits }).format(value)
}

function Distribution({ result }: { result: Result }) {
  const bins = result.stats?.bins ?? []
  if (!result.stats || bins.length === 0) {
    return (
      <span className="text-xs text-slate-500">
        Oculta: menos de 3 participantes
      </span>
    )
  }

  const first = bins[0].desde
  const last = bins[bins.length - 1].hasta
  const range = last - first
  const ownPosition = range > 0
    ? Math.min(100, Math.max(0, ((result.valorParticipante - first) / range) * 100))
    : 50
  const maxCount = Math.max(1, ...bins.map((bin) => bin.n))

  return (
    <div className="min-w-40" aria-label={`Distribución anonimizada de ${result.stats.n} participantes`}>
      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
        <span>n = {result.stats.n}</span>
        <span className="font-medium text-sky-800">◆ valor propio</span>
      </div>
      <div className="relative flex h-12 items-end gap-0.5 border-b border-slate-300" role="img">
        {bins.map((bin, index) => (
          <div
            key={`${bin.desde}-${bin.hasta}-${index}`}
            title={`${formatNumber(bin.desde)}–${formatNumber(bin.hasta)}: ${bin.n}`}
            className="min-w-2 flex-1 rounded-t-sm bg-sky-300"
            style={{ height: `${Math.max(8, (bin.n / maxCount) * 100)}%` }}
          />
        ))}
        <span
          aria-hidden="true"
          className="absolute bottom-0 -translate-x-1/2 text-xs leading-none text-sky-900 drop-shadow-[0_1px_0_white]"
          style={{ left: `${ownPosition}%` }}
        >
          ◆
        </span>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{formatNumber(first)}</span>
        <span>{formatNumber(last)}</span>
      </div>
    </div>
  )
}

export function ResultsExplorer({ results }: { results: Result[] }) {
  const [statistic, setStatistic] = useState<Statistic>('z')
  const [pollutant, setPollutant] = useState('')
  const [level, setLevel] = useState('')
  const [method, setMethod] = useState('')

  const contaminants = useMemo(
    () => [...new Set(results.flatMap((row) => row.item ? [row.item.contaminante] : []))].sort(),
    [results],
  )
  const levels = useMemo(
    () => [...new Set(results.flatMap((row) => row.item ? [row.item.levelLabel] : []))].sort(),
    [results],
  )
  const methods = useMemo(() => [...new Set(results.map((row) => row.metodo))].sort(), [results])
  const filtered = useMemo(() => results.filter((row) =>
    (!pollutant || row.item?.contaminante === pollutant) &&
    (!level || row.item?.levelLabel === level) &&
    (!method || row.metodo === method)
  ), [level, method, pollutant, results])

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filtros de resultados">
        <label className="text-sm font-medium">Estadístico
          <select value={statistic} onChange={(event) => setStatistic(event.target.value as Statistic)} className="input mt-1 w-full">
            {Object.entries(STATISTIC_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Contaminante
          <select value={pollutant} onChange={(event) => setPollutant(event.target.value)} className="input mt-1 w-full">
            <option value="">Todos</option>{contaminants.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Nivel
          <select value={level} onChange={(event) => setLevel(event.target.value)} className="input mt-1 w-full">
            <option value="">Todos</option>{levels.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Método
          <select value={method} onChange={(event) => setMethod(event.target.value)} className="input mt-1 w-full">
            <option value="">Todos</option>{methods.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--foreground-muted)]" aria-live="polite">
        {filtered.length} de {results.length} resultados · mostrando {STATISTIC_LABELS[statistic]}
      </p>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-soft)]">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              {['Contaminante', 'Run / nivel', 'Método', 'Valor propio', 'Valor asignado', STATISTIC_LABELS[statistic], 'Clasificación', 'Distribución'].map((label) => <th className="px-4 py-3" key={label}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr className="border-t border-[var(--border-soft)] align-top" key={row._id}>
                <td className="px-4 py-3 font-semibold">{row.item?.contaminante ?? '—'}</td>
                <td className="px-4 py-3"><span className="block text-xs text-slate-500">{row.item?.runCode ?? '—'}</span>{row.item?.levelLabel ?? '—'}</td>
                <td className="px-4 py-3">{row.metodo}</td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(row.valorParticipante)} {row.unidad}</td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(row.valorAsignado)} {row.unidad}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatNumber(row[statistic])}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.clasificacion === 'satisfactorio' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {row.clasificacion === 'satisfactorio' ? 'Satisfactorio' : 'No satisfactorio'}
                  </span>
                </td>
                <td className="px-4 py-3"><Distribution result={row} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--foreground-muted)]">No hay resultados para estos filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--foreground-muted)]">
        La distribución usa exclusivamente los bins anonimizados preparados al importar. Calaire no recalcula los estadísticos ni la clasificación.
      </p>
    </div>
  )
}
