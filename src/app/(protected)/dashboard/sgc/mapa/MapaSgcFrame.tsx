'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const families = [
  { value: 'Todos', label: 'Familia: todas' },
  { value: 'DG', label: 'DG' },
  { value: 'P', label: 'P' },
  { value: 'I', label: 'I' },
  { value: 'F', label: 'F' },
  { value: 'OUT', label: 'Fuera' },
]

const states = [
  'Todos',
  'Mantener',
  'Elaborado',
  'Actualizar',
  'Implementado',
  'Elaborar',
  'Parcial',
  'Preliminar',
]

const routes = [
  { value: '', label: 'Ruta: ninguna' },
  { value: 'data', label: 'Flujo de datos' },
  { value: 'he', label: 'H/E' },
  { value: 'planning', label: 'Planificacion' },
  { value: 'round', label: 'Estructura' },
  { value: 'sgc', label: 'Cierre SGC' },
  { value: 'update', label: 'Elaboracion' },
]

const legend = [
  { label: 'DG', className: 'border-amber-500 bg-amber-50' },
  { label: 'P', className: 'border-slate-600 bg-slate-100' },
  { label: 'I', className: 'border-violet-500 bg-violet-50' },
  { label: 'F', className: 'border-emerald-600 bg-emerald-50' },
  { label: 'Fuera', className: 'border-red-500 bg-red-50' },
]

type MapaSgcFrameProps = {
  src: string
  title: string
}

export function MapaSgcFrame({ src, title }: MapaSgcFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState('Todos')
  const [state, setState] = useState('Todos')
  const [route, setRoute] = useState('')

  const postControls = useCallback(
    (resetSelection = true) => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'sgc-map-controls',
          search,
          family,
          state,
          route: route || null,
          resetSelection,
        },
        window.location.origin,
      )
    },
    [family, route, search, state],
  )

  useEffect(() => {
    postControls()
  }, [postControls])

  return (
    <>
      <section className="sgc-filters">
        <div className="flex flex-wrap items-center gap-2 text-xs">
        <input
          className="h-8 min-w-48 flex-1 rounded-md border border-[var(--border)] bg-white px-2 text-xs outline-none focus:border-[var(--pt-primary)]"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar codigo o relacion"
          type="search"
        />
        <select className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs" value={family} onChange={(event) => setFamily(event.target.value)}>
          {families.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs" value={state} onChange={(event) => setState(event.target.value)}>
          {states.map((item) => (
            <option key={item} value={item}>{item === 'Todos' ? 'Estado: todos' : item}</option>
          ))}
        </select>
        <select className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs" value={route} onChange={(event) => setRoute(event.target.value)}>
          {routes.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button
          className="h-8 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-semibold hover:border-[var(--pt-primary)]"
          type="button"
          onClick={() => {
            setSearch('')
            setFamily('Todos')
            setState('Todos')
            setRoute('')
          }}
        >
          Limpiar
        </button>
        <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-[var(--foreground-muted)]">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1">
              <i className={`h-3 w-3 rounded border ${item.className}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
        </div>
      </section>
      <section className="card min-w-0 overflow-hidden p-0">
        <iframe
          ref={iframeRef}
          className="h-[calc(100vh-24rem)] min-h-[620px] w-full bg-white"
          src={src}
          title={title}
          onLoad={() => postControls(false)}
        />
      </section>
    </>
  )
}
