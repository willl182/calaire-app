'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SGC_FORMATOS_FASE_1, type SgcFase } from '@/lib/sgc/catalog'
import type { SgcChecklistItem } from '@/lib/sgc/checklist'

type RondaResumen = {
  _id: string
  codigo: string
  nombre: string
  estado: string
  progreso: number
  bloqueantes: string[]
  checklist: SgcChecklistItem[]
}

const FASES: Array<{ key: SgcFase; label: string }> = [
  { key: 'planeacion', label: 'Planeación' },
  { key: 'convocatoria', label: 'Convocatoria' },
  { key: 'ejecucion', label: 'Ejecución' },
  { key: 'evaluacion', label: 'Evaluación' },
  { key: 'cierre', label: 'Cierre' },
]

const estadoStyles: Record<
  SgcChecklistItem['estado'],
  { label: string; dot: string; cell: string; text: string }
> = {
  completo: {
    label: 'OK',
    dot: 'bg-emerald-500',
    cell: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400',
    text: 'text-emerald-700',
  },
  pendiente: {
    label: 'Pend',
    dot: 'bg-rose-500',
    cell: 'border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-400',
    text: 'text-rose-700',
  },
  no_aplica: {
    label: 'N/A',
    dot: 'bg-slate-400',
    cell: 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-400',
    text: 'text-slate-600',
  },
  advertencia: {
    label: 'Rev',
    dot: 'bg-amber-500',
    cell: 'border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-400',
    text: 'text-amber-700',
  },
}

const estadoRondaStyles: Record<string, string> = {
  borrador: 'bg-slate-100 text-slate-700 ring-slate-200',
  activa: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  documentacion_pendiente: 'bg-amber-50 text-amber-800 ring-amber-200',
  cerrada: 'bg-slate-900 text-white ring-slate-900',
}

export default function TableroCoberturaRondas() {
  const rondas = useQuery(api.sgc.listRondasSgcResumen) as RondaResumen[] | undefined
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [hideCerradas, setHideCerradas] = useState(false)

  const filteredRondas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const roundedRondas = rondas ?? []
    return roundedRondas.filter((ronda) => {
      const matchesSearch =
        query === '' ||
        ronda.codigo.toLowerCase().includes(query) ||
        ronda.nombre.toLowerCase().includes(query)
      const matchesEstado = !hideCerradas || ronda.estado !== 'cerrada'
      return matchesSearch && matchesEstado
    })
  }, [hideCerradas, rondas, searchQuery])

  const completas = filteredRondas.filter((ronda) => ronda.progreso === 100).length
  const promedio =
    filteredRondas.length === 0
      ? 0
      : Math.round(filteredRondas.reduce((sum, ronda) => sum + ronda.progreso, 0) / filteredRondas.length)
  const bloqueantesTotal = filteredRondas.reduce((sum, ronda) => sum + ronda.bloqueantes.length, 0)

  const checklistByCodigo = (ronda: RondaResumen) =>
    new Map(ronda.checklist.map((item) => [item.codigo, item]))

  const groupedFormats = FASES.map((fase) => ({
    ...fase,
    formatos: SGC_FORMATOS_FASE_1.filter((format) => format.fase === fase.key),
  }))

  return (
    <section className="w-full min-w-0 space-y-5">
      <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,#fffdf5_0%,#f6f7f9_42%,#eef2f4_100%)] shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              Control documental
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Cobertura por ronda
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
              Matriz SGC de formatos críticos, bloqueantes y avance de cierre. Cada celda abre el panel de la ronda
              filtrado por formato.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                Promedio
              </div>
              <div className="numeric mt-1 text-2xl font-bold text-[var(--foreground)]">{promedio}%</div>
            </div>
            <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                Completas
              </div>
              <div className="numeric mt-1 text-2xl font-bold text-emerald-700">{completas}</div>
            </div>
            <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                Bloqueantes
              </div>
              <div className="numeric mt-1 text-2xl font-bold text-rose-700">{bloqueantesTotal}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código o nombre de ronda"
              className="input w-full rounded-2xl border-white bg-white py-2.5 pl-10 pr-16 text-sm shadow-sm"
            />
            <svg
              aria-hidden="true"
              className="absolute left-3 top-2.5 h-4 w-4 text-[var(--foreground-muted)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.4a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              {Object.entries(estadoStyles).map(([estado, style]) => (
                <span key={estado} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[var(--foreground-muted)] ring-1 ring-slate-200">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-[var(--foreground-muted)] ring-1 ring-slate-200">
              <input
                type="checkbox"
                checked={hideCerradas}
                onChange={(e) => setHideCerradas(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] accent-amber-500"
              />
              Ocultar rondas cerradas
            </label>
          </div>
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-30 w-64 border-b border-r border-[var(--border-soft)] bg-white px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]"
                  rowSpan={2}
                >
                  Ronda
                </th>
                {groupedFormats.map((fase) => (
                  <th
                    key={fase.key}
                    colSpan={fase.formatos.length}
                    className="border-b border-[var(--border-soft)] bg-slate-50 px-2 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                  >
                    {fase.label}
                  </th>
                ))}
                <th
                  className="sticky right-0 z-30 w-44 border-b border-l border-[var(--border-soft)] bg-white px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]"
                  rowSpan={2}
                >
                  Cobertura
                </th>
              </tr>
              <tr>
                {groupedFormats.flatMap((fase) =>
                  fase.formatos.map((formato) => (
                    <th
                      key={formato.codigo}
                      className="border-b border-[var(--border-soft)] bg-white px-1.5 py-3 text-center align-top"
                    >
                      <div className="text-[11px] font-bold tracking-tight text-slate-700">{formato.codigo}</div>
                      <div className="mx-auto mt-1 line-clamp-2 max-w-[82px] text-[10px] font-normal leading-4 text-slate-500">
                        {formato.nombre}
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRondas.map((ronda) => {
                const checklistMap = checklistByCodigo(ronda)
                const estadoClass = estadoRondaStyles[ronda.estado] ?? 'bg-slate-100 text-slate-700 ring-slate-200'
                return (
                  <tr key={ronda._id} className="group bg-white hover:bg-[#fff8e1]">
                    <td className="sticky left-0 z-20 border-b border-r border-[var(--border-soft)] bg-white px-5 py-4 group-hover:bg-[#fff8e1]">
                      <div className="max-w-56">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/rondas/${ronda._id}/sgc`)}
                            className="text-left text-sm font-bold tracking-tight text-slate-950 hover:text-amber-700"
                          >
                            {ronda.codigo}
                          </button>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ${estadoClass}`}>
                            {ronda.estado.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{ronda.nombre}</p>
                      </div>
                    </td>

                    {SGC_FORMATOS_FASE_1.map((formato) => {
                      const item = checklistMap.get(formato.codigo)
                      const style = item ? estadoStyles[item.estado] : null
                      const tooltip = item
                        ? `${item.nombre}\n${item.observaciones}`
                        : 'Formato no encontrado en checklist'
                      return (
                        <td
                          key={formato.codigo}
                          className="border-b border-[var(--border-soft)] px-1.5 py-3 text-center align-middle"
                        >
                          <button
                            type="button"
                            title={tooltip}
                            onClick={() => router.push(`/dashboard/rondas/${ronda._id}/sgc?formato=${formato.codigo}`)}
                            className={[
                              'mx-auto inline-flex h-8 min-w-12 items-center justify-center rounded-full border px-2 text-[10px] font-bold uppercase tracking-wide shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500',
                              style?.cell ?? 'border-slate-200 bg-slate-50 text-slate-400',
                            ].join(' ')}
                          >
                            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${style?.dot ?? 'bg-slate-300'}`} />
                            {style?.label ?? 'Sin'}
                            <span className="sr-only">
                              {item ? `${formato.codigo} ${item.estado}` : `${formato.codigo} sin datos`}
                            </span>
                          </button>
                        </td>
                      )
                    })}

                    <td className="sticky right-0 z-20 border-b border-l border-[var(--border-soft)] bg-white px-5 py-4 text-right group-hover:bg-[#fff8e1]">
                      <div className="ml-auto max-w-36 space-y-2">
                        <div className="flex items-center justify-end gap-2">
                          <span className="numeric text-base font-bold text-slate-950">{ronda.progreso}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#059669,#fdb913)]"
                            style={{ width: `${ronda.progreso}%` }}
                          />
                        </div>
                        {ronda.bloqueantes.length > 0 && (
                          <div className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100">
                            {ronda.bloqueantes.length} bloqueante(s)
                          </div>
                        )}
                        {ronda.bloqueantes.length === 0 && (
                          <div className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            Sin bloqueantes
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredRondas.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center text-sm text-[var(--foreground-muted)]">
                    No hay rondas que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
