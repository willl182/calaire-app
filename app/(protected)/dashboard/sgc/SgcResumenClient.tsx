'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import SgcTabs from './SgcTabs'
import TableroCoberturaRondas from './TableroCoberturaRondas'
import MatrizInteractiva from './MatrizInteractiva'

const EMPTY_MATRIZ = {
  documentos: [],
  versiones: [],
  procesos: [],
  resumen: { total: 0, vigentes: 0, enRevision: 0, obsoletos: 0 },
}

type RondaSgcResumen = {
  _id: string
  codigo: string
  nombre: string
  estado: string
  progreso: number
  bloqueantes: string[]
}

function statusClasses(status: string) {
  switch (status) {
    case 'activa':
      return 'bg-emerald-100 text-emerald-800'
    case 'cerrada':
      return 'bg-slate-200 text-slate-700'
    case 'documentacion_pendiente':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

export default function SgcResumenClient() {
  const rondas = useQuery(api.sgc.listRondasSgcResumen) as RondaSgcResumen[] | undefined
  const matriz = useQuery(api.sgc.listMatrizDocumentalSgc)
  const rondasResumen = rondas ?? []
  const rondasActivas = rondasResumen.filter((ronda) => ronda.estado === 'activa').length
  const rondasBorrador = rondasResumen.filter((ronda) => ronda.estado === 'borrador').length
  const bloqueantesTotal = rondasResumen.reduce((sum, ronda) => sum + ronda.bloqueantes.length, 0)
  const promedioCierre =
    rondasResumen.length === 0
      ? 0
      : Math.round(rondasResumen.reduce((sum, ronda) => sum + ronda.progreso, 0) / rondasResumen.length)
  const rondasSinBloqueantes = rondasResumen.filter((ronda) => ronda.bloqueantes.length === 0).length

  return (
    <div className="grid min-w-0 gap-6">
      <section className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Rondas</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{rondasResumen.length}</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">Registradas en SGC</div>
        </div>
        <div className="card-accent px-5 py-4 border-l-emerald-500 bg-emerald-50/40">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Activas</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{rondasActivas}</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">Disponibles para gestión</div>
        </div>
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Avance SGC</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{promedioCierre}%</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">Promedio documental</div>
        </div>
        <div className="card-accent px-5 py-4 border-l-rose-500 bg-rose-50/40">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Bloqueantes</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{bloqueantesTotal}</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">Pendientes de cierre</div>
        </div>
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">En borrador</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{rondasBorrador}</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">{rondasSinBloqueantes} sin bloqueantes</div>
        </div>
      </section>

      <header className="header-bar w-full min-w-0 max-w-full px-6 py-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Resumen SGC</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Vista global del cierre documental de todas las rondas.
          </p>
        </div>
      </header>

      <div className="grid min-w-0 gap-4">
        {rondasResumen.map((ronda) => {
          const progreso = ronda.progreso
          const bloqueantes = ronda.bloqueantes
          return (
            <div key={ronda._id} className="card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {ronda.codigo}
                    </h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] ${statusClasses(ronda.estado)}`}>
                      {ronda.estado}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">{ronda.nombre}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 w-32 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-600"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">{progreso}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/rondas/${ronda._id}/sgc`} className="btn-primary text-sm">
                    Abrir panel SGC
                  </Link>
                </div>
              </div>

              {bloqueantes.length > 0 && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm font-semibold text-rose-900">Bloqueantes</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-800">
                    {bloqueantes.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bloqueantes.length === 0 && ronda.estado !== 'cerrada' && (
                <p className="mt-4 text-sm text-emerald-700">
                  Sin bloqueantes. Lista para avanzar en el flujo de cierre.
                </p>
              )}
            </div>
          )
        })}

        {rondas && rondas.length === 0 && (
          <div className="card p-10 text-center text-sm text-[var(--foreground-muted)]">
            No hay rondas registradas.
          </div>
        )}
      </div>

      <section className="min-w-0 space-y-4">
        <SgcTabs
          cobertura={<TableroCoberturaRondas />}
          documentos={
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Matriz Documental Maestra</h2>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Control global interactivo de documentos SGC por proceso, tipo, estado y versión vigente.
                </p>
              </div>
              <MatrizInteractiva matriz={matriz ?? EMPTY_MATRIZ} />
            </div>
          }
        />
      </section>
    </div>
  )
}
