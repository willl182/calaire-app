'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { DocumentoSgc } from '@/server/sgc'

type ArbolSgcProps = {
  documentos: DocumentoSgc[]
}

type NodoProceso = {
  nombre: string
  documentos: DocumentoSgc[]
}

type NodoAmbito = {
  nombre: string
  procesos: NodoProceso[]
  total: number
}

const familiaClass: Record<string, string> = {
  DG: 'border-amber-300 bg-amber-50 text-amber-800',
  P: 'border-slate-300 bg-slate-100 text-slate-700',
  I: 'border-violet-300 bg-violet-50 text-violet-700',
  F: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  OTRO: 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground-muted)]',
}

const estadoDot: Record<DocumentoSgc['estado'], string> = {
  vigente: 'bg-emerald-500',
  en_revision: 'bg-amber-500',
  borrador: 'bg-slate-400',
  obsoleto: 'bg-red-500',
}

function slug(valor: string) {
  return valor.trim().toLowerCase().replace(/\s+/g, '_')
}

function construirArbol(documentos: DocumentoSgc[]): NodoAmbito[] {
  const porAmbito = new Map<string, Map<string, DocumentoSgc[]>>()
  for (const documento of documentos) {
    const ambito = documento.ambito?.trim() || 'sin_ambito'
    const proceso = documento.proceso?.trim() || 'sin_proceso'
    if (!porAmbito.has(ambito)) porAmbito.set(ambito, new Map())
    const procesos = porAmbito.get(ambito)!
    if (!procesos.has(proceso)) procesos.set(proceso, [])
    procesos.get(proceso)!.push(documento)
  }

  return Array.from(porAmbito.entries())
    .map(([nombre, procesos]) => {
      const nodos = Array.from(procesos.entries())
        .map(([nombreProceso, docs]) => ({
          nombre: nombreProceso,
          documentos: [...docs].sort((a, b) => a.codigo.localeCompare(b.codigo)),
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      return {
        nombre,
        procesos: nodos,
        total: nodos.reduce((suma, proceso) => suma + proceso.documentos.length, 0),
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export function ArbolSgc({ documentos }: ArbolSgcProps) {
  const [texto, setTexto] = useState('')
  const [cerrados, setCerrados] = useState<Set<string>>(new Set())

  const arbol = useMemo(() => {
    const filtro = texto.trim().toLowerCase()
    const visibles = filtro
      ? documentos.filter((documento) =>
          `${documento.codigo} ${documento.nombre} ${documento.proceso} ${documento.ambito ?? ''}`
            .toLowerCase()
            .includes(filtro),
        )
      : documentos
    return construirArbol(visibles)
  }, [documentos, texto])

  const buscando = texto.trim().length > 0
  const abierto = (clave: string) => buscando || !cerrados.has(clave)
  const alternar = (clave: string) =>
    setCerrados((previo) => {
      const siguiente = new Set(previo)
      if (siguiente.has(clave)) siguiente.delete(clave)
      else siguiente.add(clave)
      return siguiente
    })

  return (
    <section className="card flex min-h-0 flex-col overflow-hidden lg:h-full" aria-labelledby="arbol-sgc-title">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="arbol-sgc-title" className="font-mono text-sm font-semibold text-[var(--foreground)]">
            sistema_de_gestion/
          </h2>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pt-primary-dark)]">
            Estructura
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          Ámbito · proceso · documento maestro del inventario.
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
        {arbol.length === 0 ? (
          <p className="text-[var(--foreground-muted)]">Sin documentos para el filtro aplicado.</p>
        ) : (
          <ul className="space-y-1">
            {arbol.map((ambito) => {
              const claveAmbito = `ambito:${ambito.nombre}`
              return (
                <li key={claveAmbito}>
                  <button
                    aria-expanded={abierto(claveAmbito)}
                    className="flex w-full items-center gap-2 rounded px-1 py-1 text-left font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                    onClick={() => alternar(claveAmbito)}
                    type="button"
                  >
                    <span aria-hidden="true" className="text-[var(--foreground-muted)]">
                      {abierto(claveAmbito) ? '▾' : '▸'}
                    </span>
                    <span aria-hidden="true">📁</span>
                    <span className="truncate">{slug(ambito.nombre)}/</span>
                    <span className="ml-auto rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--foreground-muted)]">
                      {ambito.total}
                    </span>
                  </button>

                  {abierto(claveAmbito) && (
                    <ul className="ml-3 space-y-1 border-l border-[var(--border)] pl-3">
                      {ambito.procesos.map((proceso) => {
                        const claveProceso = `${claveAmbito}/${proceso.nombre}`
                        return (
                          <li key={claveProceso}>
                            <button
                              aria-expanded={abierto(claveProceso)}
                              className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                              onClick={() => alternar(claveProceso)}
                              type="button"
                            >
                              <span aria-hidden="true" className="text-[var(--foreground-muted)]">
                                {abierto(claveProceso) ? '▾' : '▸'}
                              </span>
                              <span aria-hidden="true">📂</span>
                              <span className="truncate">{slug(proceso.nombre)}/</span>
                              <span className="ml-auto text-[10px] font-semibold text-[var(--foreground-muted)]">
                                {proceso.documentos.length}
                              </span>
                            </button>

                            {abierto(claveProceso) && (
                              <ul className="ml-3 space-y-0.5 border-l border-[var(--border)] pl-3">
                                {proceso.documentos.map((documento) => (
                                  <li key={documento._id}>
                                    <Link
                                      className="flex items-center gap-2 rounded px-1 py-1 hover:bg-[var(--surface-muted)]"
                                      href={`/dashboard/sgc/documentos/${documento._id}`}
                                      title={`${documento.codigo} · ${documento.nombre}`}
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${estadoDot[documento.estado]}`}
                                      />
                                      <span aria-hidden="true">📄</span>
                                      <span className="truncate text-[var(--foreground)]">{documento.codigo}</span>
                                      <span
                                        className={`ml-auto shrink-0 rounded border px-1 py-0.5 text-[9px] font-semibold ${
                                          familiaClass[documento.familia ?? 'OTRO'] ?? familiaClass.OTRO
                                        }`}
                                      >
                                        {documento.familia ?? 'OTRO'}
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--foreground-muted)]">
        <span className="mr-3">
          <i aria-hidden="true" className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          vigente
        </span>
        <span className="mr-3">
          <i aria-hidden="true" className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          en revisión
        </span>
        <span>
          <i aria-hidden="true" className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
          borrador
        </span>
      </div>
    </section>
  )
}
