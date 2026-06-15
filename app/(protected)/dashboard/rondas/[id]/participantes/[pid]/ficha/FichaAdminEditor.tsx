'use client'

import { useState, useCallback } from 'react'
import { useConvex } from 'convex/react'
import type { FichaCompleta, AcompananteInput, AnalizadorInput, InstrumentoInput } from '@/lib/fichas'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { adminCargarPdfAcompananteAction, adminGuardarCampoFichaAction, adminGuardarListasAction } from './actions'

const ANALITOS = ['CO', 'SO2', 'O3', 'NO', 'NO2'] as const

type Props = {
  fichaId: string
  ficha: FichaCompleta
  participanteEmail: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function FieldSaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') return <span className="text-xs text-[var(--foreground-muted)]">Guardando…</span>
  if (state === 'saved') return <span className="text-xs text-emerald-600">✓ Guardado</span>
  if (state === 'error') return <span className="text-xs text-rose-600">Error al guardar</span>
  return null
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-[var(--border)] pb-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[var(--foreground-muted)]">{description}</p>}
    </div>
  )
}

function isAffirmative(value: string) {
  return ['si', 'sí', 'true', '1', 'yes'].includes(value.trim().toLowerCase())
}

export default function FichaAdminEditor({ fichaId, ficha: fichaInicial, participanteEmail }: Props) {
  const convex = useConvex()
  const [fieldStates, setFieldStates] = useState<Record<string, SaveState>>({})
  const [lookup, setLookup] = useState(participanteEmail)
  const [scalarValues, setScalarValues] = useState<Record<string, string>>({
    nit_laboratorio: fichaInicial.nit_laboratorio ?? '',
    correo_laboratorio: fichaInicial.correo_laboratorio ?? '',
    nombre_laboratorio: fichaInicial.nombre_laboratorio ?? '',
    nombre_responsable: fichaInicial.nombre_responsable ?? '',
    cargo: fichaInicial.cargo ?? '',
    ciudad: fichaInicial.ciudad ?? '',
    departamento: fichaInicial.departamento ?? '',
    telefono: fichaInicial.telefono ?? '',
    transporte: fichaInicial.transporte ?? '',
    dia_llegada: fichaInicial.dia_llegada ?? '',
    hora_llegada: fichaInicial.hora_llegada ?? '',
    observaciones: fichaInicial.observaciones ?? '',
    justificacion_cambio_equipo: fichaInicial.justificacion_cambio_equipo ?? '',
    nombre_firma: fichaInicial.nombre_firma ?? '',
  })

  const [acompanantes, setAcompanantes] = useState<AcompananteInput[]>(
    fichaInicial.acompanantes.map((acompanante) => ({
      sort_order: acompanante.sort_order,
      nombre_completo: acompanante.nombre_completo,
      documento_identidad: acompanante.documento_identidad,
      correo: acompanante.correo,
      telefono: acompanante.telefono,
      rol: acompanante.rol,
      seguridad_social_arl_storage_id: acompanante.seguridad_social_arl_storage_id,
      seguridad_social_arl_file_name: acompanante.seguridad_social_arl_file_name,
      seguridad_social_arl_content_type: acompanante.seguridad_social_arl_content_type,
      seguridad_social_arl_size: acompanante.seguridad_social_arl_size,
      seguridad_social_arl_url: acompanante.seguridad_social_arl_url,
    }))
  )
  const [analizadores, setAnalizadores] = useState<AnalizadorInput[]>(
    fichaInicial.analizadores.map(({ sort_order, analito, fabricante, modelo, numero_serie, metodo_epa, fecha_ultima_calibracion, tipo_verificacion, incertidumbre_declarada, unidad_salida }) => ({
      sort_order, analito, fabricante, modelo, numero_serie, metodo_epa, fecha_ultima_calibracion, tipo_verificacion, incertidumbre_declarada, unidad_salida,
    }))
  )
  const [instrumentos, setInstrumentos] = useState<InstrumentoInput[]>(
    fichaInicial.instrumentos.map(({ sort_order, equipo, marca_modelo, numero_serie, cantidad }) => ({
      sort_order, equipo, marca_modelo, numero_serie, cantidad,
    }))
  )

  const [listSaving, setListSaving] = useState(false)
  const [listSaved, setListSaved] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const handleBlur = useCallback(
    async (field: string, value: string) => {
      setFieldStates((prev) => ({ ...prev, [field]: 'saving' }))
      const result = await adminGuardarCampoFichaAction(fichaId, field, value || null)
      setFieldStates((prev) => ({ ...prev, [field]: result.ok ? 'saved' : 'error' }))
    },
    [fichaId]
  )

  const handleCheckboxChange = useCallback(
    async (field: string, checked: boolean) => {
      setFieldStates((prev) => ({ ...prev, [field]: 'saving' }))
      const result = await adminGuardarCampoFichaAction(fichaId, field, checked)
      setFieldStates((prev) => ({ ...prev, [field]: result.ok ? 'saved' : 'error' }))
    },
    [fichaId]
  )

  const handleGuardarListas = async () => {
    setListSaving(true)
    setListSaved(false)
    setListError(null)
    const result = await adminGuardarListasAction(fichaId, acompanantes, analizadores, instrumentos)
    setListSaving(false)
    if (result.ok) setListSaved(true)
    else setListError(result.error ?? 'Error al guardar listas')
  }

  const handleAcompanantePdfChange = async (idx: number, file: File | null) => {
    if (!file) return
    setListSaving(true)
    setListError(null)
    const formData = new FormData()
    formData.append('archivo', file)
    const result = await adminCargarPdfAcompananteAction(formData)
    setListSaving(false)
    if (!result.ok || !result.archivo) {
      setListError(result.error ?? 'No fue posible subir el PDF')
      return
    }
    setAcompanantes((prev) => prev.map((a, i) => i === idx ? {
      ...a,
      seguridad_social_arl_storage_id: result.archivo!.storageId,
      seguridad_social_arl_file_name: result.archivo!.fileName,
      seguridad_social_arl_content_type: result.archivo!.contentType,
      seguridad_social_arl_size: result.archivo!.size,
      seguridad_social_arl_url: null,
    } : a))
    setListSaved(false)
  }

  const handleReutilizarDatos = async () => {
    const lookupValue = lookup.trim() || participanteEmail.trim() || fichaInicial.correo_laboratorio?.trim() || fichaInicial.nit_laboratorio?.trim() || ''
    if (!lookupValue) return

    const templateLookup = await convex.query(api.fichas.findFichaTemplateByLookup, {
      lookup: lookupValue,
      excludeFichaId: fichaId as Id<'fichasRegistro'>,
    }) as FichaCompleta | null
    if (!templateLookup) return

    setScalarValues((prev) => ({
      ...prev,
      nit_laboratorio: templateLookup.nit_laboratorio ?? prev.nit_laboratorio,
      correo_laboratorio: templateLookup.correo_laboratorio ?? prev.correo_laboratorio,
      nombre_laboratorio: templateLookup.nombre_laboratorio ?? prev.nombre_laboratorio,
      nombre_responsable: templateLookup.nombre_responsable ?? prev.nombre_responsable,
      cargo: templateLookup.cargo ?? prev.cargo,
      ciudad: templateLookup.ciudad ?? prev.ciudad,
      departamento: templateLookup.departamento ?? prev.departamento,
      telefono: templateLookup.telefono ?? prev.telefono,
    }))
  }

  const inputClass =
    'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-0 w-full'
  const labelClass = 'grid gap-1 text-sm text-[var(--foreground-muted)]'

  return (
    <div className="flex flex-col gap-6">
      <section className="card grid gap-4 p-6">
        <SectionHeader
          title="Reutilizar datos"
          description="Busca una ficha previa por NIT o correo del participante y copia la sección de datos del participante."
        />
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className={labelClass}>
            <span>NIT o correo</span>
            <input
              type="text"
              className={inputClass}
              value={lookup}
              onChange={(e) => {
                setLookup(e.target.value)
              }}
              placeholder={participanteEmail || '123456789 o correo@laboratorio.com'}
            />
          </label>
          <button
            type="button"
            className="btn-outline w-fit"
            onClick={handleReutilizarDatos}
          >
            Reutilizar datos
          </button>
        </div>
      </section>

      {/* Datos del participante */}
      <section className="card grid gap-5 p-6">
        <SectionHeader
          title="Datos del participante"
          description="Información del laboratorio responsable de los ensayos."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {([
            ['nit_laboratorio', 'NIT del laboratorio'],
            ['correo_laboratorio', 'Correo del laboratorio'],
            ['nombre_laboratorio', 'Nombre del laboratorio'],
            ['nombre_responsable', 'Nombre del responsable'],
            ['cargo', 'Cargo'],
            ['ciudad', 'Ciudad'],
            ['departamento', 'Departamento'],
            ['telefono', 'Teléfono'],
          ] as const).map(([field, label]) => (
            <label key={field} className={labelClass}>
              <span className="flex items-center justify-between">
                {label}
                <FieldSaveIndicator state={fieldStates[field] ?? 'idle'} />
              </span>
              <input
                type="text"
                className={inputClass}
                value={scalarValues[field]}
                onChange={(e) => setScalarValues((prev) => ({ ...prev, [field]: e.target.value }))}
                onBlur={(e) => handleBlur(field, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      {/* Personal acompañante */}
      <section className="card grid gap-5 p-6">
        <SectionHeader title="Personal acompañante" />
        {acompanantes.length === 0 && (
          <p className="text-sm text-[var(--foreground-muted)]">Sin acompañantes registrados.</p>
        )}
        <div className="grid gap-3">
          {acompanantes.map((item, idx) => (
            <div key={idx} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-3">
              <label className={labelClass}>
                <span>Nombre completo</span>
                <input
                  type="text"
                  className={inputClass}
                  value={item.nombre_completo}
                  onChange={(e) => {
                    setAcompanantes((prev) => prev.map((a, i) => i === idx ? { ...a, nombre_completo: e.target.value } : a))
                    setListSaved(false)
                  }}
                />
              </label>
              <label className={labelClass}>
                <span>Documento de identidad</span>
                <input
                  type="text"
                  className={inputClass}
                  value={item.documento_identidad}
                  onChange={(e) => {
                    setAcompanantes((prev) => prev.map((a, i) => i === idx ? { ...a, documento_identidad: e.target.value } : a))
                    setListSaved(false)
                  }}
                />
              </label>
              <label className={labelClass}>
                <span>Correo</span>
                <input
                  type="email"
                  className={inputClass}
                  value={item.correo ?? ''}
                  onChange={(e) => {
                    setAcompanantes((prev) => prev.map((a, i) => i === idx ? { ...a, correo: e.target.value } : a))
                    setListSaved(false)
                  }}
                />
              </label>
              <label className={labelClass}>
                <span>Teléfono</span>
                <input
                  type="tel"
                  className={inputClass}
                  value={item.telefono ?? ''}
                  onChange={(e) => {
                    setAcompanantes((prev) => prev.map((a, i) => i === idx ? { ...a, telefono: e.target.value } : a))
                    setListSaved(false)
                  }}
                />
              </label>
              <label className={labelClass}>
                <span className="flex items-center justify-between">
                  Rol
                  <button
                    type="button"
                    className="text-xs text-rose-500 hover:text-rose-700"
                    onClick={() => {
                      setAcompanantes((prev) => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, sort_order: i + 1 })))
                      setListSaved(false)
                    }}
                  >
                    Quitar
                  </button>
                </span>
                <input
                  type="text"
                  className={inputClass}
                  value={item.rol}
                  onChange={(e) => {
                    setAcompanantes((prev) => prev.map((a, i) => i === idx ? { ...a, rol: e.target.value } : a))
                    setListSaved(false)
                  }}
                />
              </label>
              <label className={`${labelClass} md:col-span-2`}>
                <span>PDF seguridad social y ARL</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className={inputClass}
                  onChange={(e) => handleAcompanantePdfChange(idx, e.target.files?.[0] ?? null)}
                />
                {item.seguridad_social_arl_file_name && (
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {item.seguridad_social_arl_url ? (
                      <a className="underline" href={item.seguridad_social_arl_url} target="_blank" rel="noreferrer">
                        {item.seguridad_social_arl_file_name}
                      </a>
                    ) : item.seguridad_social_arl_file_name}
                  </span>
                )}
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-outline self-start"
          onClick={() => {
            setAcompanantes((prev) => [...prev, {
              sort_order: prev.length + 1,
              nombre_completo: '',
              documento_identidad: '',
              correo: '',
              telefono: '',
              rol: '',
              seguridad_social_arl_storage_id: null,
              seguridad_social_arl_file_name: null,
              seguridad_social_arl_content_type: null,
              seguridad_social_arl_size: null,
              seguridad_social_arl_url: null,
            }])
            setListSaved(false)
          }}
        >
          + Agregar acompañante
        </button>
      </section>

      {/* Analizadores */}
      <section className="card grid gap-5 p-6">
        <SectionHeader title="Analizadores declarados" />
        {analizadores.length === 0 && (
          <p className="text-sm text-[var(--foreground-muted)]">Sin analizadores registrados.</p>
        )}
        <div className="grid gap-4">
          {analizadores.map((item, idx) => (
            <div key={idx} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                  Analizador {idx + 1}
                </span>
                <button
                  type="button"
                  className="text-xs text-rose-500 hover:text-rose-700"
                  onClick={() => {
                    setAnalizadores((prev) => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, sort_order: i + 1 })))
                    setListSaved(false)
                  }}
                >
                  Quitar
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className={labelClass}>
                  <span>Analito</span>
                  <select
                    className={inputClass}
                    value={item.analito}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, analito: e.target.value } : a)); setListSaved(false) }}
                  >
                    <option value="">Seleccionar…</option>
                    {ANALITOS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <label className={labelClass}>
                  <span>Fabricante</span>
                  <input type="text" className={inputClass} value={item.fabricante}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, fabricante: e.target.value } : a)); setListSaved(false) }} />
                </label>
                <label className={labelClass}>
                  <span>Modelo</span>
                  <input type="text" className={inputClass} value={item.modelo}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, modelo: e.target.value } : a)); setListSaved(false) }} />
                </label>
                <label className={labelClass}>
                  <span>Número de serie</span>
                  <input type="text" className={inputClass} value={item.numero_serie}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, numero_serie: e.target.value } : a)); setListSaved(false) }} />
                </label>
                <label className={labelClass}>
                  <span>Método EPA</span>
                  <input type="text" className={inputClass} value={item.metodo_epa}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, metodo_epa: e.target.value } : a)); setListSaved(false) }} />
                </label>
                <label className={labelClass}>
                  <span>Fecha última calibración</span>
                  <input type="date" className={inputClass} value={item.fecha_ultima_calibracion ?? ''}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, fecha_ultima_calibracion: e.target.value || null } : a)); setListSaved(false) }} />
                </label>
                <label className={labelClass}>
                  <span>Tipo de verificación</span>
                  <input type="text" className={inputClass} value={item.tipo_verificacion}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, tipo_verificacion: e.target.value } : a)); setListSaved(false) }} />
                </label>
                <label className={labelClass}>
                  <span>Incertidumbre estimada</span>
                  <span className={`${inputClass} flex cursor-pointer items-center justify-between hover:border-[var(--pt-primary)]`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isAffirmative(item.incertidumbre_declarada)}
                      onChange={(e) => {
                        setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, incertidumbre_declarada: e.target.checked ? 'si' : 'no' } : a))
                        setListSaved(false)
                      }}
                    />
                    <span className="text-[var(--foreground-muted)]">Seleccionar</span>
                    <span className={`min-w-10 rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ${isAffirmative(item.incertidumbre_declarada) ? 'bg-emerald-100 text-emerald-800' : 'bg-[var(--surface-muted)] text-[var(--foreground-muted)]'}`}>
                      {isAffirmative(item.incertidumbre_declarada) ? 'Sí' : 'No'}
                    </span>
                  </span>
                </label>
                <label className={labelClass}>
                  <span>Unidad de salida</span>
                  <input type="text" className={inputClass} value={item.unidad_salida}
                    onChange={(e) => { setAnalizadores((prev) => prev.map((a, i) => i === idx ? { ...a, unidad_salida: e.target.value } : a)); setListSaved(false) }} />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-outline self-start"
          onClick={() => {
            setAnalizadores((prev) => [
              ...prev,
              { sort_order: prev.length + 1, analito: '', fabricante: '', modelo: '', numero_serie: '', metodo_epa: '', fecha_ultima_calibracion: null, tipo_verificacion: '', incertidumbre_declarada: 'no', unidad_salida: '' },
            ])
            setListSaved(false)
          }}
        >
          + Agregar analizador
        </button>
      </section>

      {/* Instrumentos auxiliares */}
      <section className="card grid gap-5 p-6">
        <SectionHeader title="Instrumentos auxiliares" />
        {instrumentos.length === 0 && (
          <p className="text-sm text-[var(--foreground-muted)]">Sin instrumentos registrados.</p>
        )}
        <div className="grid gap-3">
          {instrumentos.map((item, idx) => (
            <div key={idx} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-4">
              <label className={labelClass}>
                <span>Equipo</span>
                <input type="text" className={inputClass} value={item.equipo}
                  onChange={(e) => { setInstrumentos((prev) => prev.map((a, i) => i === idx ? { ...a, equipo: e.target.value } : a)); setListSaved(false) }} />
              </label>
              <label className={labelClass}>
                <span>Marca / Modelo</span>
                <input type="text" className={inputClass} value={item.marca_modelo}
                  onChange={(e) => { setInstrumentos((prev) => prev.map((a, i) => i === idx ? { ...a, marca_modelo: e.target.value } : a)); setListSaved(false) }} />
              </label>
              <label className={labelClass}>
                <span>Número de serie</span>
                <input type="text" className={inputClass} value={item.numero_serie}
                  onChange={(e) => { setInstrumentos((prev) => prev.map((a, i) => i === idx ? { ...a, numero_serie: e.target.value } : a)); setListSaved(false) }} />
              </label>
              <label className={labelClass}>
                <span className="flex items-center justify-between">
                  Cantidad
                  <button type="button" className="text-xs text-rose-500 hover:text-rose-700"
                    onClick={() => { setInstrumentos((prev) => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, sort_order: i + 1 }))); setListSaved(false) }}>
                    Quitar
                  </button>
                </span>
                <input type="number" min="1" className={inputClass} value={item.cantidad}
                  onChange={(e) => { setInstrumentos((prev) => prev.map((a, i) => i === idx ? { ...a, cantidad: Number(e.target.value) || 1 } : a)); setListSaved(false) }} />
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-outline self-start"
          onClick={() => {
            setInstrumentos((prev) => [...prev, { sort_order: prev.length + 1, equipo: '', marca_modelo: '', numero_serie: '', cantidad: 1 }])
            setListSaved(false)
          }}
        >
          + Agregar instrumento
        </button>
      </section>

      {/* Logística */}
      <section className="card grid gap-5 p-6">
        <SectionHeader title="Logística" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            <span className="flex items-center justify-between">
              Tipo de transporte
              <FieldSaveIndicator state={fieldStates['transporte'] ?? 'idle'} />
            </span>
            <select className={inputClass} defaultValue={fichaInicial.transporte ?? ''}
              onChange={(e) => handleBlur('transporte', e.target.value)}>
              <option value="">Seleccionar…</option>
              {fichaInicial.transporte && fichaInicial.transporte !== 'propio' && fichaInicial.transporte !== 'empresarial' && (
                <option value={fichaInicial.transporte}>{fichaInicial.transporte} (valor anterior)</option>
              )}
              <option value="propio">Propio</option>
              <option value="empresarial">Empresarial</option>
            </select>
          </label>
          <label className={labelClass}>
            <span className="flex items-center justify-between">
              Día de llegada de equipos
              <FieldSaveIndicator state={fieldStates['dia_llegada'] ?? 'idle'} />
            </span>
            <input type="date" className={inputClass} defaultValue={fichaInicial.dia_llegada ?? ''}
              onBlur={(e) => handleBlur('dia_llegada', e.target.value)} />
          </label>
          <label className={labelClass}>
            <span className="flex items-center justify-between">
              Hora estimada de llegada
              <FieldSaveIndicator state={fieldStates['hora_llegada'] ?? 'idle'} />
            </span>
            <input type="time" className={inputClass} defaultValue={fichaInicial.hora_llegada ?? ''}
              onBlur={(e) => handleBlur('hora_llegada', e.target.value)} />
          </label>
        </div>
        <label className={labelClass}>
          <span className="flex items-center justify-between">
            Observaciones de logística
            <FieldSaveIndicator state={fieldStates['observaciones'] ?? 'idle'} />
          </span>
          <textarea
            rows={3}
            className={`${inputClass} resize-none`}
            defaultValue={fichaInicial.observaciones ?? ''}
            onBlur={(e) => handleBlur('observaciones', e.target.value)}
          />
        </label>
        <label className={labelClass}>
          <span className="flex items-center justify-between">
            Justificación de cambio de equipo
            <FieldSaveIndicator state={fieldStates['justificacion_cambio_equipo'] ?? 'idle'} />
          </span>
          <textarea
            rows={3}
            className={`${inputClass} resize-none`}
            defaultValue={fichaInicial.justificacion_cambio_equipo ?? ''}
            onBlur={(e) => handleBlur('justificacion_cambio_equipo', e.target.value)}
          />
        </label>
      </section>

      {/* Declaraciones */}
      <section className="card grid gap-5 p-6">
        <SectionHeader title="Declaraciones" />
        <div className="grid gap-4">
          {([
            ['dec_datos_correctos', 'Los datos consignados en esta ficha son correctos y verificables.'],
            ['dec_acepta_condiciones', 'Acepta las condiciones de participación en la ronda de ensayo de aptitud.'],
            ['dec_compromisos', 'Se compromete a seguir los procedimientos establecidos durante el ensayo.'],
            ['dec_procedimientos_calaire', 'Seguirá los procedimientos internos de Calaire para el desarrollo de la prueba de aptitud.'],
            ['dec_firma_autorizada', 'El responsable registrado está autorizado por la dirección del laboratorio.'],
          ] as const).map(([field, texto]) => (
            <label key={field} className="flex items-start gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)]"
                defaultChecked={fichaInicial[field]}
                onChange={(e) => handleCheckboxChange(field, e.target.checked)}
              />
              <span className="flex-1">{texto}</span>
              <FieldSaveIndicator state={fieldStates[field] ?? 'idle'} />
            </label>
          ))}
        </div>
        <label className={labelClass}>
          <span className="flex items-center justify-between">
            Nombre del responsable autorizado
            <FieldSaveIndicator state={fieldStates['nombre_firma'] ?? 'idle'} />
          </span>
          <input
            type="text"
            className={inputClass}
            defaultValue={fichaInicial.nombre_firma ?? ''}
            onBlur={(e) => handleBlur('nombre_firma', e.target.value)}
          />
        </label>
      </section>

      {/* Guardar listas */}
      <section className="card grid gap-4 p-6">
        <SectionHeader title="Guardar listas" description="Guarda los cambios en acompañantes, analizadores e instrumentos." />
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn-outline"
            disabled={listSaving}
            onClick={handleGuardarListas}
          >
            {listSaving ? 'Guardando…' : 'Guardar datos temporalmente'}
          </button>
          {listSaved && <span className="text-sm text-emerald-600">✓ Listas guardadas</span>}
          {listError && <span className="text-sm text-rose-600">{listError}</span>}
        </div>
      </section>
    </div>
  )
}
