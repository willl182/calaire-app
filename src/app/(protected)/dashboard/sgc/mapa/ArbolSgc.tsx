'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { bloqueGeneralCarpetas, bloqueGeneralRaiz } from '@/lib/sgc/arbolBloqueGeneral'

type ArbolSgcProps = {
  /** Códigos con ficha en el inventario maestro, para enlazar el nodo del árbol. */
  fichasPorCodigo?: Record<string, string>
}

const descripciones: Record<string, string> = {
  '00_plantillas_base': 'Plantillas oficiales por familia documental (DG, P, I, F).',
  '01_documentos_marco': 'Protocolo general y documentos marco de los aplicativos.',
  '02_procedimientos': 'Procedimientos P-PSEA del programa de ensayos de aptitud.',
  '03_instructivos': 'Instructivos operativos de calaire-app y pt_app.',
  '04_formatos_maestros': 'Formatos maestros F-PSEA para registro y evidencia.',
  '05_matrices_inventarios': 'Árbol maestro, inventario, diccionario y trazabilidad normativa.',
}

const familiaClass: Record<string, string> = {
  DG: 'border-amber-300 bg-amber-50 text-amber-800',
  P: 'border-slate-300 bg-slate-100 text-slate-700',
  I: 'border-violet-300 bg-violet-50 text-violet-700',
  F: 'border-emerald-300 bg-emerald-50 text-emerald-700',
}

/** `P-PSEA-04 Planificacion de ronda EA` -> `P-PSEA-04`. */
function extraerCodigo(nombre: string) {
  return /^((?:DG|P|I|F)-PSEA-[0-9]{0,2}[A-Z]?)/.exec(nombre)?.[1] ?? null
}

function familiaDe(codigo: string | null) {
  return codigo ? (codigo.split('-')[0] as keyof typeof familiaClass) : null
}

export function ArbolSgc({ fichasPorCodigo = {} }: ArbolSgcProps) {
  const [texto, setTexto] = useState('')
  const [cerrados, setCerrados] = useState<Set<string>>(new Set())

  const carpetas = useMemo(() => {
    const filtro = texto.trim().toLowerCase()
    if (!filtro) return bloqueGeneralCarpetas
    return bloqueGeneralCarpetas
      .map((carpeta) => ({
        ...carpeta,
        items: carpeta.items.filter((item) => item.nombre.toLowerCase().includes(filtro)),
      }))
      .filter((carpeta) => carpeta.items.length > 0 || carpeta.nombre.toLowerCase().includes(filtro))
  }, [texto])

  const buscando = texto.trim().length > 0
  const abierto = (clave: string) => buscando || !cerrados.has(clave)
  const alternar = (clave: string) =>
    setCerrados((previo) => {
      const siguiente = new Set(previo)
      if (siguiente.has(clave)) siguiente.delete(clave)
      else siguiente.add(clave)
      return siguiente
    })

  const totalItems = bloqueGeneralCarpetas.reduce((suma, carpeta) => suma + carpeta.items.length, 0)

  return (
    <section className="card flex min-h-0 flex-col overflow-hidden lg:h-full" aria-labelledby="arbol-sgc-title">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="arbol-sgc-title" className="font-mono text-sm font-semibold text-[var(--foreground)]">
            01_bloque_general/
          </h2>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pt-primary-dark)]">
            Estructura
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {bloqueGeneralCarpetas.length} carpetas · {totalItems} documentos del bloque general.
        </p>
        <input
          className="mt-3 h-8 w-full rounded-md border border-[var(--border)] bg-white px-2 text-xs outline-none focus:border-[var(--pt-primary)]"
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Filtrar carpeta o documento"
          type="search"
          value={texto}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs">
        {carpetas.length === 0 ? (
          <p className="text-[var(--foreground-muted)]">Sin coincidencias para el filtro aplicado.</p>
        ) : (
          <ul className="space-y-1">
            {carpetas.map((carpeta) => (
              <li key={carpeta.nombre}>
                <button
                  aria-expanded={abierto(carpeta.nombre)}
                  className="flex w-full items-center gap-2 rounded px-1 py-1 text-left font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  onClick={() => alternar(carpeta.nombre)}
                  title={descripciones[carpeta.nombre]}
                  type="button"
                >
                  <span aria-hidden="true" className="text-[var(--foreground-muted)]">
                    {abierto(carpeta.nombre) ? '▾' : '▸'}
                  </span>
                  <span aria-hidden="true">📁</span>
                  <span className="truncate">{carpeta.nombre}/</span>
                  <span className="ml-auto rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--foreground-muted)]">
                    {carpeta.items.length}
                  </span>
                </button>

                {abierto(carpeta.nombre) && (
                  <ul className="ml-3 space-y-0.5 border-l border-[var(--border)] pl-3">
                    {carpeta.items.map((item) => {
                      const codigo = extraerCodigo(item.nombre)
                      const familia = familiaDe(codigo)
                      const fichaId = codigo ? fichasPorCodigo[codigo] : undefined
                      const etiqueta = (
                        <>
                          <span aria-hidden="true">{item.carpeta ? '📂' : '📄'}</span>
                          <span className="truncate text-[var(--foreground)]" title={item.nombre}>
                            {codigo ?? item.nombre}
                            {item.carpeta ? '/' : ''}
                          </span>
                          {!item.carpeta && (
                            <span className="ml-auto shrink-0 text-[9px] uppercase text-[var(--foreground-muted)]">
                              {item.formatos.join(' ')}
                            </span>
                          )}
                          {familia && (
                            <span
                              className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-semibold ${familiaClass[familia]}`}
                            >
                              {familia}
                            </span>
                          )}
                        </>
                      )
                      return (
                        <li key={`${carpeta.nombre}/${item.nombre}`}>
                          {fichaId ? (
                            <Link
                              className="flex items-center gap-2 rounded px-1 py-1 hover:bg-[var(--surface-muted)]"
                              href={`/dashboard/sgc/documentos/${fichaId}`}
                            >
                              {etiqueta}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 rounded px-1 py-1">{etiqueta}</div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            ))}

            {!buscando &&
              bloqueGeneralRaiz.map((item) => (
                <li key={item.nombre} className="flex items-center gap-2 px-1 py-1">
                  <span aria-hidden="true" className="opacity-0">
                    ▸
                  </span>
                  <span aria-hidden="true">📄</span>
                  <span className="truncate text-[var(--foreground-muted)]" title={item.nombre}>
                    {item.nombre}
                  </span>
                  <span className="ml-auto shrink-0 text-[9px] uppercase text-[var(--foreground-muted)]">
                    {item.formatos.join(' ')}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--foreground-muted)]">
        Los documentos con ficha en el inventario maestro son enlazables.
      </div>
    </section>
  )
}
