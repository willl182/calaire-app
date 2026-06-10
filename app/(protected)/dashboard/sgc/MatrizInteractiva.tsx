'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { DocumentoSgc, MatrizDocumentalSgc } from '@/lib/sgc'
import { guardarDocumentoSgcAction, registrarDocumentoVersionAction, getDocumentoDownloadUrlAction } from './actions'

interface Props {
  matriz: MatrizDocumentalSgc
}

function fmtDate(ms?: number | null) {
  if (!ms) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms))
}

function getEstadoBadgeClass(estado: DocumentoSgc['estado']) {
  switch (estado) {
    case 'vigente':
      return 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
    case 'en_revision':
      return 'bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
    case 'borrador':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-350 border-slate-200 dark:border-slate-800'
    case 'obsoleto':
      return 'bg-rose-100 text-rose-850 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

function getCriticidadClass(criticidad: DocumentoSgc['criticidad']) {
  switch (criticidad) {
    case 'alta':
      return 'text-rose-600 dark:text-rose-400 font-semibold'
    case 'media':
      return 'text-amber-600 dark:text-amber-400'
    default:
      return 'text-slate-500'
  }
}

export default function MatrizInteractiva({ matriz }: Props) {
  const searchParams = useSearchParams()
  
  // States
  const [selectedProcess, setSelectedProcess] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedState, setSelectedState] = useState<string>('all')
  
  const [selectedDocId, setSelectedDocId] = useState<string | null>(searchParams?.get('docId') || null)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  
  // Track searchParams changes to keep active doc selected
  const docIdFromUrl = searchParams?.get('docId')
  const currentSelectedId = docIdFromUrl || selectedDocId || (matriz.documentos[0]?._id ?? null)


  // Filter documents
  const filteredDocs = matriz.documentos.filter((doc) => {
    const matchesProcess = selectedProcess === 'all' || doc.proceso === selectedProcess
    const matchesType = selectedType === 'all' || doc.tipo === selectedType
    const matchesState = selectedState === 'all' || doc.estado === selectedState
    
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = 
      query === '' ||
      doc.codigo.toLowerCase().includes(query) ||
      doc.nombre.toLowerCase().includes(query) ||
      doc.propietario.toLowerCase().includes(query) ||
      (doc.notas && doc.notas.toLowerCase().includes(query))
      
    return matchesProcess && matchesType && matchesState && matchesSearch
  })

  // Selected document data
  const selectedDoc = matriz.documentos.find((doc) => doc._id === currentSelectedId)
  const selectedDocVersions = matriz.versiones.find((v) => v.documentoId === currentSelectedId)
  
  // Process stats for filters
  const processStats = matriz.procesos.map((proc) => {
    const count = matriz.documentos.filter((d) => d.proceso === proc).length
    return { name: proc, count }
  })
  
  const totalCount = matriz.documentos.length

  const handleDocSelect = (id: string) => {
    setSelectedDocId(id)
    setIsCreating(false)
    setIsEditing(false)
    // Update URL query params without reloading the page entirely
    const url = new URL(window.location.href)
    url.searchParams.set('docId', id)
    window.history.pushState({}, '', url.toString())
  }

  const handleDownload = async (versionId: string) => {
    setDownloadingId(versionId)
    try {
      const res = await getDocumentoDownloadUrlAction(versionId)
      if (res.error) {
        alert(res.error)
      } else if (res.url) {
        window.open(res.url, '_blank')
      } else {
        alert('Este archivo no tiene una URL de descarga válida.')
      }
    } catch {
      alert('Error de red al intentar descargar el documento.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleStartCreate = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedDocId(null)
  }

  const handleCancelForm = () => {
    setIsCreating(false)
    setIsEditing(false)
    if (matriz.documentos.length > 0 && !selectedDocId) {
      setSelectedDocId(matriz.documentos[0]._id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-accent px-4 py-3 bg-[var(--surface)] border-[var(--border)]">
          <div className="text-sm font-medium text-[var(--foreground-muted)]">Documentos Totales</div>
          <div className="text-2xl font-bold mt-1 numeric">{matriz.resumen.total}</div>
        </div>
        <div className="card-accent px-4 py-3 bg-[var(--surface)] border-[var(--border)] border-l-emerald-500">
          <div className="text-sm font-medium text-[var(--foreground-muted)]">Vigentes</div>
          <div className="text-2xl font-bold mt-1 numeric text-emerald-600">{matriz.resumen.vigentes}</div>
        </div>
        <div className="card-accent px-4 py-3 bg-[var(--surface)] border-[var(--border)] border-l-amber-500">
          <div className="text-sm font-medium text-[var(--foreground-muted)]">En Revisión</div>
          <div className="text-2xl font-bold mt-1 numeric text-amber-600">{matriz.resumen.enRevision}</div>
        </div>
        <div className="card-accent px-4 py-3 bg-[var(--surface)] border-[var(--border)] border-l-slate-400">
          <div className="text-sm font-medium text-[var(--foreground-muted)]">Obsoletos</div>
          <div className="text-2xl font-bold mt-1 numeric text-slate-500">{matriz.resumen.obsoletos}</div>
        </div>
      </div>

      {/* Main Filter Section */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por código, nombre, propietario o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10 pr-4 py-2 text-sm rounded-lg"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-[var(--foreground-muted)]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input text-xs py-1.5 px-3"
            >
              <option value="all">Todos los tipos</option>
              <option value="formato">Formato</option>
              <option value="procedimiento">Procedimiento</option>
              <option value="instructivo">Instructivo</option>
              <option value="plantilla">Plantilla</option>
              <option value="registro">Registro</option>
              <option value="otro">Otro</option>
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="input text-xs py-1.5 px-3"
            >
              <option value="all">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="en_revision">En revisión</option>
              <option value="vigente">Vigente</option>
              <option value="obsoleto">Obsoleto</option>
            </select>

            <button
              onClick={handleStartCreate}
              className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Documento
            </button>
          </div>
        </div>

        {/* Process Filter Badges */}
        <div className="border-t border-[var(--border-soft)] pt-3">
          <div className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
            Filtrar por Proceso
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2">
            <button
              onClick={() => setSelectedProcess('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                selectedProcess === 'all'
                  ? 'bg-amber-500 border-amber-500 text-gray-900 shadow-sm'
                  : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-amber-400 hover:text-[var(--foreground)]'
              }`}
            >
              Todos ({totalCount})
            </button>
            {processStats.map((proc) => (
              <button
                key={proc.name}
                onClick={() => setSelectedProcess(proc.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  selectedProcess === proc.name
                    ? 'bg-amber-500 border-amber-500 text-gray-900 shadow-sm'
                    : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-amber-400 hover:text-[var(--foreground)]'
                }`}
              >
                {proc.name} ({proc.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Document List (5 cols) */}
        <div className="lg:col-span-5 card p-0 overflow-hidden flex flex-col h-[600px]">
          <div className="px-4 py-3 bg-[var(--surface-muted)] border-b border-[var(--border)] flex justify-between items-center">
            <div className="text-sm font-semibold text-[var(--foreground)]">
              Documentos ({filteredDocs.length})
            </div>
            <div className="text-xs text-[var(--foreground-muted)]">
              Mostrando {filteredDocs.length} de {totalCount}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-soft)]">
            {filteredDocs.map((doc) => {
              const isSelected = doc._id === selectedDocId
              return (
                <div
                  key={doc._id}
                  onClick={() => handleDocSelect(doc._id)}
                  className={`p-4 cursor-pointer transition flex flex-col gap-2 hover:bg-[var(--surface-muted)] ${
                    isSelected ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-xs text-[var(--foreground-muted)] numeric tracking-wider uppercase">
                      {doc.codigo}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getEstadoBadgeClass(doc.estado)}`}>
                      {doc.estado}
                    </span>
                  </div>
                  
                  <div className="font-medium text-sm text-[var(--foreground)] line-clamp-2">
                    {doc.nombre}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-[var(--foreground-muted)] mt-1">
                    <span className="truncate max-w-[200px]" title={doc.proceso}>
                      📁 {doc.proceso}
                    </span>
                    <span className="capitalize">
                      {doc.tipo}
                    </span>
                  </div>
                </div>
              )
            })}
            
            {filteredDocs.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--foreground-muted)]">
                No se encontraron documentos con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail Panel / Forms (7 cols) */}
        <div className="lg:col-span-7 h-[600px] flex flex-col">
          {/* CREATE FORM */}
          {isCreating && (
            <div className="card p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Nuevo documento SGC</h3>
                <button
                  onClick={handleCancelForm}
                  className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  Cancelar
                </button>
              </div>
              <form action={guardarDocumentoSgcAction} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Código *</label>
                  <input name="codigo" required className="input w-full text-sm" placeholder="Ej. F-PSEA-15" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Proceso *</label>
                  <input name="proceso" required className="input w-full text-sm" placeholder="Ej. Apoyo" list="procesos-list" />
                  <datalist id="procesos-list">
                    {matriz.procesos.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Nombre Documental *</label>
                  <input name="nombre" required className="input w-full text-sm" placeholder="Nombre completo del formato o documento" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Tipo *</label>
                  <select name="tipo" required className="input w-full text-sm" defaultValue="formato">
                    <option value="formato">Formato</option>
                    <option value="procedimiento">Procedimiento</option>
                    <option value="instructivo">Instructivo</option>
                    <option value="plantilla">Plantilla</option>
                    <option value="registro">Registro</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Estado inicial *</label>
                  <select name="estado" required className="input w-full text-sm" defaultValue="borrador">
                    <option value="borrador">Borrador</option>
                    <option value="en_revision">En revisión</option>
                    <option value="vigente">Vigente</option>
                    <option value="obsoleto">Obsoleto</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Propietario / Responsable</label>
                  <input name="propietario" className="input w-full text-sm" placeholder="Ej. Coordinador de Calidad" defaultValue="Coordinacion SGC" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Criticidad *</label>
                  <select name="criticidad" required className="input w-full text-sm" defaultValue="media">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Tiempo Retención</label>
                  <input name="retencion" className="input w-full text-sm" placeholder="Ej. 5 años" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Ubicación del Archivo Fuente</label>
                  <input name="ubicacion_fuente" className="input w-full text-sm" placeholder="URL o repositorio del archivo fuente" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Notas / Descripción</label>
                  <textarea name="notas" className="input w-full text-sm min-h-[60px]" placeholder="Observaciones adicionales sobre el control de este documento" />
                </div>
                
                <button className="btn-primary md:col-span-2 w-full mt-2" type="submit">
                  Crear Documento
                </button>
              </form>
            </div>
          )}

          {/* EDIT FORM */}
          {isEditing && selectedDoc && (
            <div className="card p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-3">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Editar metadatos: {selectedDoc.codigo}</h3>
                <button
                  onClick={handleCancelForm}
                  className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  Cancelar
                </button>
              </div>
              <form action={guardarDocumentoSgcAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="documento_id" value={selectedDoc._id} />
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Código *</label>
                  <input name="codigo" required className="input w-full text-sm" defaultValue={selectedDoc.codigo} placeholder="Ej. F-PSEA-15" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Proceso *</label>
                  <input name="proceso" required className="input w-full text-sm" defaultValue={selectedDoc.proceso} placeholder="Ej. Apoyo" list="procesos-list" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Nombre Documental *</label>
                  <input name="nombre" required className="input w-full text-sm" defaultValue={selectedDoc.nombre} placeholder="Nombre completo" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Tipo *</label>
                  <select name="tipo" required className="input w-full text-sm" defaultValue={selectedDoc.tipo}>
                    <option value="formato">Formato</option>
                    <option value="procedimiento">Procedimiento</option>
                    <option value="instructivo">Instructivo</option>
                    <option value="plantilla">Plantilla</option>
                    <option value="registro">Registro</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Estado *</label>
                  <select name="estado" required className="input w-full text-sm" defaultValue={selectedDoc.estado}>
                    <option value="borrador">Borrador</option>
                    <option value="en_revision">En revisión</option>
                    <option value="vigente">Vigente</option>
                    <option value="obsoleto">Obsoleto</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Propietario / Responsable</label>
                  <input name="propietario" className="input w-full text-sm" defaultValue={selectedDoc.propietario} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Criticidad *</label>
                  <select name="criticidad" required className="input w-full text-sm" defaultValue={selectedDoc.criticidad}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Tiempo Retención</label>
                  <input name="retencion" className="input w-full text-sm" defaultValue={selectedDoc.retencion || ''} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Ubicación del Archivo Fuente</label>
                  <input name="ubicacion_fuente" className="input w-full text-sm" defaultValue={selectedDoc.ubicacionFuente || ''} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Notas / Descripción</label>
                  <textarea name="notas" className="input w-full text-sm min-h-[60px]" defaultValue={selectedDoc.notas || ''} />
                </div>
                
                <button className="btn-primary md:col-span-2 w-full mt-2" type="submit">
                  Guardar Cambios
                </button>
              </form>
            </div>
          )}

          {/* DOCUMENT DETAILS (READ STATE) */}
          {!isCreating && !isEditing && selectedDoc && (
            <div className="card p-6 flex-1 overflow-y-auto space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header detail */}
                <div className="flex justify-between items-start gap-4 border-b border-[var(--border-soft)] pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-600 tracking-wider numeric uppercase">
                      {selectedDoc.codigo} · {selectedDoc.tipo}
                    </span>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">
                      {selectedDoc.nombre}
                    </h2>
                    <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-1">
                      <span>📁 Proceso:</span>
                      <span className="font-semibold">{selectedDoc.proceso}</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-outline text-xs px-2.5 py-1.5 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-[var(--surface-muted)] p-4 rounded-lg text-xs border border-[var(--border-soft)]">
                  <div>
                    <span className="text-[var(--foreground-muted)] font-medium block">Estado documental</span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getEstadoBadgeClass(selectedDoc.estado)}`}>
                      {selectedDoc.estado}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--foreground-muted)] font-medium block">Propietario / Área</span>
                    <span className="font-semibold text-[var(--foreground)] mt-0.5 block truncate">
                      {selectedDoc.propietario}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--foreground-muted)] font-medium block">Criticidad SGC</span>
                    <span className={`capitalize mt-0.5 block ${getCriticidadClass(selectedDoc.criticidad)}`}>
                      ● {selectedDoc.criticidad}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--foreground-muted)] font-medium block">Tiempo retención</span>
                    <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                      {selectedDoc.retencion || 'No especificado'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[var(--foreground-muted)] font-medium block">Ubicación del Archivo Fuente</span>
                    {selectedDoc.ubicacionFuente ? (
                      <a
                        href={selectedDoc.ubicacionFuente}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-amber-600 hover:text-amber-500 break-all hover:underline mt-0.5 block"
                      >
                        {selectedDoc.ubicacionFuente}
                      </a>
                    ) : (
                      <span className="text-[var(--foreground-muted)] italic mt-0.5 block">No especificada</span>
                    )}
                  </div>
                  {selectedDoc.notas && (
                    <div className="col-span-2 border-t border-[var(--border-soft)] pt-2 mt-1">
                      <span className="text-[var(--foreground-muted)] font-medium block">Notas</span>
                      <p className="text-[var(--foreground)] mt-0.5 leading-relaxed whitespace-pre-wrap">
                        {selectedDoc.notas}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2 border-t border-[var(--border-soft)] pt-2 text-[10px] text-[var(--foreground-muted)] flex justify-between">
                    <span>Creado por {selectedDoc.updatedBy || 'Sistema'}</span>
                    <span>Actualizado: {fmtDate(selectedDoc.updatedAt)}</span>
                  </div>
                </div>

                {/* Versions timeline */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                    Historial de Versiones (Últimas 5)
                  </h4>
                  
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                    {selectedDocVersions && selectedDocVersions.historial.length > 0 ? (
                      selectedDocVersions.historial.map((version) => {
                        const isVigente = version.estado === 'vigente'
                        const isDownloading = downloadingId === version._id
                        
                        return (
                          <div
                            key={version._id}
                            className={`p-3 rounded-lg border text-xs flex justify-between items-start gap-4 ${
                              isVigente
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-[var(--surface-muted)] border-[var(--border-soft)]'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                  isVigente ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'
                                }`}>
                                  v{version.version}
                                </span>
                                <span className="text-[var(--foreground-muted)] font-medium">
                                  {version.fechaVigencia ? `Vigencia: ${version.fechaVigencia}` : 'Sin fecha'}
                                </span>
                                {!isVigente && (
                                  <span className="text-[9px] uppercase tracking-wider px-1 bg-slate-200 text-slate-700 rounded-sm">
                                    {version.estado}
                                  </span>
                                )}
                              </div>
                              <p className="text-[var(--foreground)] italic mt-1 leading-relaxed">
                                &ldquo;{version.cambioResumen}&rdquo;
                              </p>
                              <div className="text-[10px] text-[var(--foreground-muted)]">
                                Subido por {version.createdBy || 'Sistema'} el {new Date(version.createdAt).toLocaleDateString('es-CO')}
                              </div>
                            </div>
                            
                            {version.fileName && (
                              <button
                                onClick={() => handleDownload(version._id)}
                                disabled={isDownloading}
                                className="btn-outline text-[10px] py-1 px-2.5 flex items-center gap-1.5 shrink-0 self-center disabled:opacity-50"
                              >
                                {isDownloading ? (
                                  <svg className="animate-spin h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                )}
                                Descargar
                              </button>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-[var(--foreground-muted)] border border-dashed border-[var(--border)] rounded-lg bg-[var(--surface-muted)]">
                        No hay ninguna versión documentada registrada en el historial.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Version Registration Inline Form */}
              <div className="border-t border-[var(--border-soft)] pt-4 mt-4 bg-[var(--surface)]">
                <details className="group border border-[var(--border-soft)] rounded-lg bg-[var(--surface-muted)] overflow-hidden">
                  <summary className="flex justify-between items-center p-3 text-xs font-semibold text-[var(--foreground)] cursor-pointer hover:bg-[var(--surface-muted)] transition list-none">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Registrar Nueva Versión Vigente
                    </span>
                    <svg
                      className="w-4 h-4 text-[var(--foreground-muted)] transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  
                  <form action={registrarDocumentoVersionAction} className="p-4 border-t border-[var(--border-soft)] grid gap-3 text-xs">
                    <input type="hidden" name="documento_id" value={selectedDoc._id} />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--foreground)] block">Fecha de Vigencia</label>
                        <input name="fecha_vigencia" type="date" className="input w-full text-xs" />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--foreground)] block">Archivo de Evidencia</label>
                        <input name="archivo" type="file" className="input w-full text-xs" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--foreground)] block">Resumen de Cambios *</label>
                      <textarea
                        name="cambio_resumen"
                        required
                        className="input w-full text-xs min-h-[60px]"
                        placeholder="Describa brevemente qué cambios se introdujeron en esta nueva versión del documento..."
                      />
                    </div>
                    
                    <button className="btn-primary w-full py-2 text-xs mt-1" type="submit">
                      Subir y Registrar Versión v{(selectedDocVersions?.vigente?.version || 0) + 1}
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!isCreating && !isEditing && !selectedDoc && (
            <div className="card p-8 flex-1 flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                <svg className="w-8 h-8 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Sin documento seleccionado</h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Selecciona uno de los documentos de la izquierda para examinar sus detalles, historial de versiones y subir nuevas evidencias vigentes.
                </p>
              </div>
              <button
                onClick={handleStartCreate}
                className="btn-outline text-xs px-3 py-2"
              >
                o crea un nuevo documento ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
