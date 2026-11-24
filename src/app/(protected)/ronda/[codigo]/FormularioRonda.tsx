'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { LogoUnal } from '@/components/LogoUnal'
import { DecimalInput } from '@/components/DecimalInput'
import { isValidDecimal, statsWarnings, toDecimal } from '@/lib/decimal'
import {
  CONTAMINANTES,
  type EnvioPT,
  type Ronda,
  type RondaPTItem,
  type RondaPTSampleGroup,
} from '@/server/rondas'
import {
  buildReferenciaImportPreview,
  parseReferenciaCsv,
  type ReferenciaImportPreview,
} from '@/server/rondas/referencia-csv'
import {
  adminEnviarInformeFinalAction,
  adminGuardarEnvioAction,
  adminGuardarResultadosCsvAction,
  adminReabrirInformeFinalAction,
} from '@/app/(protected)/dashboard/rondas/[id]/participantes/[pid]/datos/actions'
import { enviarInformeFinalAction, guardarEnvioAction } from './actions'

export type AdminPTTarget = {
  rondaParticipanteId: string
  backHref: string
}

type CellKey = `${string}::${string}` // `${ptItemId}::${sampleGroupId}`
type CellData = {
  d1: string
  d2: string
  d3: string
  meanValue: string
  sdValue: string
  ux: string
  k: string
  uxExp: string
}
type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
type ImportStatus = 'idle' | 'previewing' | 'ready' | 'saving' | 'saved' | 'error'
type KMode = 'individual' | 'grupal'

function toCellKey(ptItemId: string, sampleGroupId: string): CellKey {
  return `${ptItemId}::${sampleGroupId}`
}

function fromCellKey(key: CellKey) {
  const [ptItemId, sampleGroupId] = key.split('::')
  return { ptItemId, sampleGroupId }
}

function isValidNumberInput(value: string): boolean {
  return isValidDecimal(value)
}

/** Valor normalizado (coma o punto); NaN si vacío o inválido. */
function num(value: string): number {
  return toDecimal(value) ?? NaN
}

function getCellIssue(data: CellData): string | null {
  const fields = [['Dato 1', data.d1], ['Dato 2', data.d2], ['Dato 3', data.d3]] as const

  for (const [label, field] of fields) {
    if (field.trim() !== '' && !isValidNumberInput(field)) {
      return `${label} debe ser un número válido.`
    }
  }
  if (data.meanValue.trim() !== '' && !isValidNumberInput(data.meanValue)) {
    return 'El promedio debe ser un número válido.'
  }
  if (data.sdValue.trim() !== '' && (!isValidNumberInput(data.sdValue) || num(data.sdValue) < 0)) {
    return 'La desviación estándar debe ser ≥ 0.'
  }
  if (data.ux.trim() !== '' && (!isValidNumberInput(data.ux) || num(data.ux) < 0)) {
    return 'La incertidumbre estándar u(x) debe ser ≥ 0.'
  }
  if (data.k.trim() !== '' && (!isValidNumberInput(data.k) || num(data.k) < 0)) {
    return 'El factor de cobertura k debe ser ≥ 0.'
  }
  if (data.uxExp.trim() !== '' && (!isValidNumberInput(data.uxExp) || num(data.uxExp) < 0)) {
    return 'La incertidumbre expandida U(X) debe ser ≥ 0.'
  }
  return null
}

const FIELD_ORDER = ['d1', 'd2', 'd3', 'meanValue', 'sdValue', 'ux', 'k', 'uxExp'] as const
const REQUIRED_FIELDS = new Set<string>(['d1', 'meanValue', 'sdValue', 'ux', 'k', 'uxExp'])

/** Primer campo vacío obligatorio o inválido, para llevar el foco desde "Faltan N celdas". */
function firstPendingField(data: CellData): (typeof FIELD_ORDER)[number] {
  for (const field of FIELD_ORDER) {
    const value = data[field]
    if (value.trim() === '') {
      if (REQUIRED_FIELDS.has(field)) return field
      continue
    }
    if (!isValidNumberInput(value)) return field
  }
  return 'd1'
}

function isCellComplete(data: CellData): boolean {
  // Solo d1 es obligatorio. d2 y d3 pueden quedar vacios (NA) y se guardan como
  // null; no participan en ningun calculo.
  return (
    isValidNumberInput(data.d1) &&
    isValidNumberInput(data.meanValue) &&
    isValidNumberInput(data.sdValue) &&
    num(data.sdValue) >= 0 &&
    isValidNumberInput(data.ux) &&
    num(data.ux) >= 0 &&
    isValidNumberInput(data.k) &&
    num(data.k) >= 0 &&
    isValidNumberInput(data.uxExp) &&
    num(data.uxExp) >= 0
  )
}

function initCells(
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  envios: EnvioPT[]
): Record<CellKey, CellData> {
  const enviosMap = new Map(
    envios.map((envio) => [toCellKey(envio.pt_item_id, envio.sample_group_id), envio])
  )
  const cells = {} as Record<CellKey, CellData>

  for (const item of ptItems) {
    for (const group of sampleGroups) {
      const key = toCellKey(item.id, group.id)
      const envio = enviosMap.get(key)
      cells[key] = {
        d1: envio?.d1 != null ? String(envio.d1) : '',
        d2: envio?.d2 != null ? String(envio.d2) : '',
        d3: envio?.d3 != null ? String(envio.d3) : '',
        meanValue: envio != null ? String(envio.mean_value) : '',
        sdValue: envio != null ? String(envio.sd_value) : '',
        ux: envio?.ux != null ? String(envio.ux) : '',
        k: envio?.k != null ? String(envio.k) : '2',
        uxExp: envio?.ux_exp != null ? String(envio.ux_exp) : '',
      }
    }
  }

  return cells
}

function initStatus(
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  envios: EnvioPT[]
): Record<CellKey, SaveStatus> {
  const existing = new Set(envios.map((envio) => toCellKey(envio.pt_item_id, envio.sample_group_id)))
  const status = {} as Record<CellKey, SaveStatus>

  for (const item of ptItems) {
    for (const group of sampleGroups) {
      const key = toCellKey(item.id, group.id)
      status[key] = existing.has(key) ? 'saved' : 'idle'
    }
  }

  return status
}

function StatusIcon({ status }: { status: SaveStatus }) {
  if (status === 'saving') return <span className="text-xs text-slate-500">guardando…</span>
  if (status === 'saved') return <span className="text-xs text-emerald-600">✓</span>
  if (status === 'error') return <span className="text-xs text-rose-600">✗</span>
  if (status === 'dirty') return <span className="text-xs text-amber-600">•</span>
  return null
}

export default function FormularioRonda({
  ronda,
  ptItems,
  sampleGroups,
  enviosIniciales,
  envioFinalizado,
  enviadoAt,
  participantCode,
  replicateCode,
  participanteEmail,
  adminTarget,
}: {
  ronda: Ronda
  ptItems: RondaPTItem[]
  sampleGroups: RondaPTSampleGroup[]
  enviosIniciales: EnvioPT[]
  envioFinalizado: boolean
  enviadoAt: string | null
  participantCode: string | null
  replicateCode: number | null
  participanteEmail: string
  adminTarget?: AdminPTTarget
}) {
  const [submitDone, setSubmitDone] = useState(envioFinalizado)
  const [submittedAt, setSubmittedAt] = useState<string | null>(enviadoAt)
  const [cells, setCells] = useState(() => initCells(ptItems, sampleGroups, enviosIniciales))
  const [saveStatus, setSaveStatus] = useState<Record<CellKey, SaveStatus>>(() =>
    initStatus(ptItems, sampleGroups, enviosIniciales)
  )
  const [saveErrors, setSaveErrors] = useState<Record<CellKey, string>>({})
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ReferenciaImportPreview | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [kMode, setKMode] = useState<KMode>('individual')
  const [globalK, setGlobalK] = useState('2')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  const cerrada = ronda.estado === 'documentacion_pendiente' || ronda.estado === 'cerrada'
  const soloLectura = cerrada || submitDone
  const hasPTConfig = ptItems.length > 0 && sampleGroups.length > 0
  const hasParticipantCodes = Boolean(participantCode) && replicateCode != null

  const totalCells = ptItems.length * sampleGroups.length
  const cellEntries = ptItems.flatMap((item) =>
    sampleGroups.map((group) => ({ key: toCellKey(item.id, group.id) }))
  )
  const completedCells = cellEntries.filter(({ key }) => isCellComplete(cells[key])).length
  const invalidCells = cellEntries.filter(({ key }) => getCellIssue(cells[key]) !== null).length
  const progressPct = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0
  const allComplete = totalCells > 0 && completedCells === totalCells
  const allSaved = Object.values(saveStatus).every((status) => status === 'saved' || status === 'idle')
  const canSubmit =
    hasPTConfig && hasParticipantCodes && allComplete && allSaved && invalidCells === 0 && !soloLectura

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      for (const timer of Object.values(activeTimers)) {
        clearTimeout(timer)
      }
    }
  }, [])

  function cancelAllPendingSaves() {
    for (const [key, timer] of Object.entries(timers.current)) {
      clearTimeout(timer)
      delete timers.current[key]
    }
  }

  async function triggerSave(key: CellKey, data: CellData) {
    const { ptItemId, sampleGroupId } = fromCellKey(key)
    const issue = getCellIssue(data)
    if (issue) {
      setSaveStatus((prev) => ({ ...prev, [key]: 'error' }))
      setSaveErrors((prev) => ({ ...prev, [key]: issue }))
      return
    }
    if (!isCellComplete(data)) return
    if (soloLectura) return

    const d1 = num(data.d1)
    const d2 = data.d2.trim() === '' ? null : num(data.d2)
    const d3 = data.d3.trim() === '' ? null : num(data.d3)
    const meanValue = num(data.meanValue)
    const sdValue = num(data.sdValue)
    const ux = num(data.ux)
    const k = num(data.k)
    const uxExp = num(data.uxExp)
    setSaveStatus((prev) => ({ ...prev, [key]: 'saving' }))

    const result = adminTarget
      ? await adminGuardarEnvioAction(ronda.id, adminTarget.rondaParticipanteId, ptItemId, sampleGroupId, d1, d2, d3, meanValue, sdValue, ux, uxExp, k)
      : await guardarEnvioAction(ronda.id, ptItemId, sampleGroupId, d1, d2, d3, meanValue, sdValue, ux, uxExp, k)

    if (result.error) {
      setSaveStatus((prev) => ({ ...prev, [key]: 'error' }))
      setSaveErrors((prev) => ({ ...prev, [key]: result.error ?? 'No fue posible guardar.' }))
      setFormMessage(result.error)
      return
    }

    setSaveStatus((prev) => ({ ...prev, [key]: 'saved' }))
    setSaveErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function updateCell(key: CellKey, nextData: CellData) {
    setFormMessage(null)
    setCells((prev) => ({ ...prev, [key]: nextData }))
    setSaveStatus((prev) => ({ ...prev, [key]: 'dirty' }))
    setSaveErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })

    clearTimeout(timers.current[key])
    timers.current[key] = setTimeout(() => {
      void triggerSave(key, nextData)
    }, 1200)
  }

  function handleKModeChange(nextMode: KMode) {
    setKMode(nextMode)
    if (nextMode !== 'grupal' || !isValidNumberInput(globalK) || num(globalK) < 0) return
    for (const [key, data] of Object.entries(cells) as [CellKey, CellData][]) {
      updateCell(key, { ...data, k: globalK })
    }
  }

  function handleGlobalKChange(value: string) {
    setGlobalK(value)
    if (kMode !== 'grupal' || !isValidNumberInput(value) || num(value) < 0) return
    for (const [key, data] of Object.entries(cells) as [CellKey, CellData][]) {
      updateCell(key, { ...data, k: value })
    }
  }

  async function handlePreviewImport() {
    if (!importFile) {
      setImportMessage('Selecciona un archivo CSV antes de previsualizar.')
      setImportStatus('error')
      return
    }

    setImportStatus('previewing')
    setImportMessage(null)
    try {
      const text = await importFile.text()
      const parsedRows = parseReferenciaCsv(text)
      const existingCells = new Set(
        Object.entries(cells)
          .filter(([, data]) => data.meanValue.trim() !== '' || data.d1.trim() !== '')
          .map(([key]) => key)
      )
      if (!isValidNumberInput(globalK) || num(globalK) < 0) {
        setImportPreview(null)
        setImportStatus('error')
        setImportMessage('El factor de cobertura grupal debe ser un número mayor o igual a cero.')
        return
      }
      const preview = buildReferenciaImportPreview(parsedRows, ptItems, sampleGroups, existingCells, num(globalK))
      setImportPreview(preview)
      setImportStatus(preview.errors.length > 0 ? 'error' : 'ready')
    } catch (error) {
      setImportPreview(null)
      setImportStatus('error')
      setImportMessage(error instanceof Error ? error.message : 'No fue posible leer el CSV.')
    }
  }

  async function handleImportSave() {
    if (!adminTarget || !importPreview || importPreview.errors.length > 0 || importPreview.cells.length === 0) return
    cancelAllPendingSaves()
    setImportStatus('saving')
    setImportMessage(null)

    const result = await adminGuardarResultadosCsvAction(
      ronda.id,
      adminTarget.rondaParticipanteId,
      importPreview.cells
    )
    const savedRows = importPreview.cells.slice(0, result.saved ?? (result.ok ? importPreview.cells.length : 0))

    if (savedRows.length > 0) {
      setCells((prev) => {
        const next = { ...prev }
        for (const row of savedRows) {
          next[toCellKey(row.ptItemId, row.sampleGroupId)] = {
            d1: String(row.d1),
            d2: row.d2 != null ? String(row.d2) : '',
            d3: row.d3 != null ? String(row.d3) : '',
            meanValue: String(row.meanValue),
            sdValue: String(row.sdValue),
            ux: String(row.ux),
            k: String(row.k),
            uxExp: String(row.uxExp),
          }
        }
        return next
      })
      setSaveStatus((prev) => {
        const next = { ...prev }
        for (const row of savedRows) {
          next[toCellKey(row.ptItemId, row.sampleGroupId)] = 'saved'
        }
        return next
      })
      setSaveErrors((prev) => {
        const next = { ...prev }
        for (const row of savedRows) {
          delete next[toCellKey(row.ptItemId, row.sampleGroupId)]
        }
        return next
      })
    }

    if (result.error || (result.errors && result.errors.length > 0)) {
      setImportStatus('error')
      setImportMessage(result.error ?? result.errors?.join(' ') ?? 'No fue posible guardar la importación.')
      return
    }

    setImportStatus('saved')
    setImportMessage(`Se cargaron ${savedRows.length} celdas para ${participanteEmail}.`)
  }

  async function handleSubmit() {
    if (!canSubmit) {
      if (!hasPTConfig) {
        setFormMessage('La ronda aún no tiene configuración PT completa (corridas y grupos de muestra).')
      } else if (!hasParticipantCodes) {
        setFormMessage('Falta código PT o código de réplica. Contacta al coordinador de la ronda.')
      } else {
        setFormMessage('Revisa celdas pendientes o con error antes del envío final.')
      }
      return
    }

    setFormMessage(null)
    const result = adminTarget
      ? await adminEnviarInformeFinalAction(ronda.id, adminTarget.rondaParticipanteId)
      : await enviarInformeFinalAction(ronda.id)
    if (result.error) {
      setFormMessage(result.error)
      return
    }

    setSubmitDone(true)
    setSubmittedAt(result.submittedAt ?? new Date().toISOString())
  }

  async function handleReopen() {
    if (!adminTarget || ronda.estado !== 'activa') return
    const confirmed = window.confirm(
      'Se conservarán los valores, pero el informe volverá a borrador y podrá editarse hasta enviarlo nuevamente. ¿Continuar?'
    )
    if (!confirmed) return
    setFormMessage(null)
    const result = await adminReabrirInformeFinalAction(ronda.id, adminTarget.rondaParticipanteId)
    if (result.error) {
      setFormMessage(result.error)
      return
    }
    setSubmitDone(false)
    setSubmittedAt(null)
    setFormMessage(null)
  }

  const itemsByContaminante = CONTAMINANTES.map((contaminante) => ({
    contaminante,
    items: ptItems.filter((item) => item.contaminante === contaminante),
  })).filter((entry) => entry.items.length > 0)

  const pendingCells = ptItems.flatMap((item) =>
    sampleGroups.map((group) => ({ item, group, key: toCellKey(item.id, group.id) }))
  ).filter(({ key }) => {
    const status = saveStatus[key] ?? 'idle'
    return !isCellComplete(cells[key]) || getCellIssue(cells[key]) !== null || saveErrors[key] != null || status === 'dirty' || status === 'saving'
  })

  function focusPendingCell(itemId: string, groupId: string, data: CellData) {
    const el = document.getElementById(`msg-${itemId}-${groupId}-${firstPendingField(data)}`)
    el?.scrollIntoView({ block: 'center' })
    el?.focus()
  }

  return (
    <div className={adminTarget ? '' : 'min-h-screen bg-[var(--background)] px-6 py-8'}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {!adminTarget && <header className="header-bar px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <LogoUnal height={64} />
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Ensayos de Aptitud</span>
                </h1>
                <p className="text-base font-medium text-[var(--pt-primary-dark)]">
                  Gases Contaminantes Criterio
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {participanteEmail} · Participante
                </p>
              </div>
            </div>
          </div>
        </header>}

        {adminTarget && (
          <section className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <span className="font-semibold">Modo administrativo.</span> Guardando resultados en nombre de {participanteEmail}.
          </section>
        )}

        {/* En modo admin, RondaPageHeader ya muestra nombre y estado de la ronda. */}
        {!adminTarget && (
        <section className="card p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {ronda.nombre}
              </h2>
              <p className="text-sm font-medium text-[var(--pt-primary-dark)]">
                Código de Ronda: {ronda.codigo}
              </p>
            </div>
            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                ronda.estado === 'activa'
                  ? 'bg-emerald-100 text-emerald-800'
                  : cerrada
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              Ronda {ronda.estado}
            </span>
          </div>
        </section>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
              Código PT
            </div>
            <div className="numeric mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {participantCode ?? '—'}
            </div>
          </div>
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
              Réplica
            </div>
            <div className="numeric mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {replicateCode ?? '—'}
            </div>
          </div>
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
              Completitud
            </div>
            <div className="numeric mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {completedCells}/{totalCells}
            </div>
          </div>
          <div className="card-accent px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
              Observaciones
            </div>
            <div className="numeric mt-2 text-2xl font-semibold text-[var(--foreground)]">{invalidCells}</div>
          </div>
        </div>

        <section className="card grid gap-4 p-6">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[var(--foreground-muted)]">
              <span>Progreso PT</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border)]">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: allComplete ? 'var(--success)' : 'var(--pt-primary)' }}
              />
            </div>
          </div>

          {cerrada && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Esta ronda está cerrada. Los datos son de solo lectura.
            </div>
          )}

          {!hasPTConfig && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              La configuración PT no está completa. Debe existir al menos una corrida PT y un grupo de muestra.
            </div>
          )}

          {!hasParticipantCodes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No tienes asignado `participant_id` o `replicate`. Solicita al coordinador completar esa configuración.
            </div>
          )}

          {submitDone && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span>
                {adminTarget ? 'El informe final PT fue enviado correctamente.' : 'Tu informe final PT fue enviado correctamente.'}
                {submittedAt ? ` Fecha de envío: ${new Date(submittedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}.` : ''}
              </span>
              {adminTarget && ronda.estado === 'activa' && (
                <button type="button" onClick={() => void handleReopen()} className="btn-outline">
                  Reabrir envío para corrección
                </button>
              )}
            </div>
          )}

          {formMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formMessage}
            </div>
          )}
        </section>

        {adminTarget && (
          <section className="card p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
                  Cargar archivo de resultados
                </h2>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Importa un CSV y guarda sus resultados en nombre de {participanteEmail}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  disabled={soloLectura}
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] ?? null)
                    setImportPreview(null)
                    setImportStatus('idle')
                    setImportMessage(null)
                  }}
                  className="max-w-72 rounded border border-[var(--border)] px-3 py-2 text-sm disabled:bg-[var(--surface-muted)]"
                />
                <button
                  type="button"
                  onClick={() => void handlePreviewImport()}
                  className="btn-outline"
                  disabled={soloLectura || importStatus === 'previewing' || !importFile}
                >
                  {importStatus === 'previewing' ? 'Leyendo…' : 'Previsualizar'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleImportSave()}
                  className="btn-primary"
                  disabled={
                    soloLectura ||
                    importStatus === 'saving' ||
                    !importPreview ||
                    importPreview.errors.length > 0 ||
                    importPreview.cells.length === 0
                  }
                >
                  {importStatus === 'saving' ? 'Cargando…' : 'Cargar resultados'}
                </button>
              </div>
            </div>

            {importPreview && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="card-accent px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                    Filas leídas
                  </div>
                  <div className="numeric mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {importPreview.rowsRead}
                  </div>
                </div>
                <div className="card-accent px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                    Resultados
                  </div>
                  <div className="numeric mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {importPreview.cells.length}
                  </div>
                </div>
                <div className="card-accent px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                    Alertas
                  </div>
                  <div className="numeric mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {importPreview.warnings.length + importPreview.errors.length}
                  </div>
                </div>
              </div>
            )}

            {importMessage && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  importStatus === 'saved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {importMessage}
              </div>
            )}

            {importPreview && importPreview.warnings.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {importPreview.warnings.slice(0, 4).map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
                {importPreview.warnings.length > 4 && <div>Y {importPreview.warnings.length - 4} advertencias más.</div>}
              </div>
            )}

            {importPreview && importPreview.errors.length > 0 && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {importPreview.errors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
              Configuración del factor de cobertura k
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded border border-[var(--border)] p-1 text-sm">
              <button
                type="button"
                onClick={() => handleKModeChange('individual')}
                className={`rounded px-3 py-1 ${kMode === 'individual' ? 'bg-[var(--pt-primary)] text-white' : 'text-[var(--foreground-muted)]'}`}
                disabled={soloLectura}
              >
                Factor individual
              </button>
              <button
                type="button"
                onClick={() => handleKModeChange('grupal')}
                className={`rounded px-3 py-1 ${kMode === 'grupal' ? 'bg-[var(--pt-primary)] text-white' : 'text-[var(--foreground-muted)]'}`}
                disabled={soloLectura}
              >
                Factor grupal
              </button>
            </div>
            <DecimalInput
              value={globalK}
              disabled={soloLectura}
              onValueChange={handleGlobalKChange}
              className="w-24 rounded border border-[var(--border)] px-3 py-2 text-sm numeric disabled:bg-[var(--surface-muted)]"
              aria-label="Valor grupal del factor de cobertura k"
            />
          </div>
        </section>

        {itemsByContaminante.map(({ contaminante, items }) => {
          const contaminanteComplete =
            items.length > 0 &&
            sampleGroups.length > 0 &&
            items.every((item) =>
              sampleGroups.every((group) =>
                isCellComplete(cells[toCellKey(item.id, group.id)])
              )
            )

          return (
            <section key={contaminante} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
                    {contaminante}
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    {items.length * sampleGroups.length} combinación{items.length * sampleGroups.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                {contaminanteComplete ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    ✓ Completo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Pendiente
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left text-xs text-[var(--foreground-muted)]">
                      <th className="px-4 py-2 font-semibold">Corrida</th>
                      {sampleGroups.length > 1 && <th className="px-4 py-2 font-semibold">Grupo</th>}
                      <th className="px-4 py-2 font-semibold">Dato 1</th>
                      <th className="px-4 py-2 font-semibold">Dato 2</th>
                      <th className="px-4 py-2 font-semibold">Dato 3</th>
                      <th className="px-4 py-2 font-semibold">Promedio</th>
                      <th className="px-4 py-2 font-semibold">Desv. Est.</th>
                      <th className="min-w-36 px-4 py-2 font-semibold">Incertidumbre estándar u(x)</th>
                      <th className="min-w-32 px-4 py-2 font-semibold">Factor de cobertura k</th>
                      <th className="min-w-28 px-4 py-2 font-semibold">Incertidumbre expandida U(X)</th>
                      <th className="px-4 py-2 font-semibold text-center">OK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-soft)]">
                    {items.flatMap((item) =>
                      sampleGroups.map((group) => {
                        const key = toCellKey(item.id, group.id)
                        const data = cells[key]
                        const issue = saveErrors[key] ?? getCellIssue(data)
                        const status = saveStatus[key] ?? 'idle'
                        const complete = isCellComplete(data)
                        // Solo advertencia: nunca se autocalcula el promedio ni la desviación.
                        const warnings = issue ? [] : statsWarnings(data)
                        const msgId = `msg-${item.id}-${group.id}`
                        const colCount = sampleGroups.length > 1 ? 11 : 10
                        const cellLabel = `${contaminante} nivel ${item.level_label || item.run_code}${sampleGroups.length > 1 ? ` grupo ${group.sample_group}` : ''}`

                        const inputCls = `w-20 rounded border px-2 py-1 text-sm outline-none numeric disabled:bg-[var(--surface-muted)] disabled:text-[var(--foreground-muted)] ${
                          issue ? 'border-rose-300 bg-rose-50/40' : 'border-[var(--border)]'
                        }`

                        const wideCls = inputCls.replace('w-20', 'w-28')

                        return (
                          <Fragment key={key}>
                          <tr
                            className={`transition-colors hover:bg-[var(--surface-muted)]/40 ${
                              complete ? 'bg-emerald-50/20' : ''
                            } ${issue ? 'bg-rose-50/20' : ''}`}
                          >
                            <td className="px-4 py-2 font-mono text-xs text-[var(--foreground)]">{item.run_code}</td>
                            {sampleGroups.length > 1 && (
                              <td className="px-4 py-2 text-[var(--foreground-muted)]">{group.sample_group}</td>
                            )}
                            {(['d1', 'd2', 'd3'] as const).map((field, index) => (
                              <td key={field} className="px-2 py-2">
                                <DecimalInput
                                  id={`${msgId}-${field}`}
                                  aria-label={`${cellLabel} dato ${index + 1}`}
                                  aria-describedby={issue || warnings.length > 0 ? msgId : undefined}
                                  aria-invalid={issue ? true : undefined}
                                  placeholder={index === 0 ? '' : 'NA'}
                                  value={data[field]}
                                  disabled={soloLectura}
                                  onValueChange={(v) => updateCell(key, { ...data, [field]: v })}
                                  className={wideCls}
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2">
                              <DecimalInput
                                id={`${msgId}-meanValue`}
                                aria-label={`${cellLabel} promedio`}
                                aria-describedby={issue || warnings.length > 0 ? msgId : undefined}
                                aria-invalid={issue ? true : undefined}
                                value={data.meanValue}
                                disabled={soloLectura}
                                onValueChange={(v) => updateCell(key, { ...data, meanValue: v })}
                                className={wideCls}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <DecimalInput
                                id={`${msgId}-sdValue`}
                                aria-label={`${cellLabel} desviación estándar`}
                                aria-describedby={issue || warnings.length > 0 ? msgId : undefined}
                                aria-invalid={issue ? true : undefined}
                                value={data.sdValue}
                                disabled={soloLectura}
                                onValueChange={(v) => updateCell(key, { ...data, sdValue: v })}
                                className={wideCls}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <DecimalInput
                                id={`${msgId}-ux`}
                                aria-label={`${cellLabel} incertidumbre estándar`}
                                aria-describedby={issue || warnings.length > 0 ? msgId : undefined}
                                aria-invalid={issue ? true : undefined}
                                value={data.ux}
                                disabled={soloLectura}
                                onValueChange={(v) => updateCell(key, { ...data, ux: v })}
                                className={inputCls}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <DecimalInput
                                id={`${msgId}-k`}
                                aria-label={`${cellLabel} factor de cobertura k`}
                                aria-describedby={issue || warnings.length > 0 ? msgId : undefined}
                                aria-invalid={issue ? true : undefined}
                                value={data.k}
                                disabled={soloLectura || kMode === 'grupal'}
                                onValueChange={(v) => updateCell(key, { ...data, k: v })}
                                className={inputCls}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <DecimalInput
                                id={`${msgId}-uxExp`}
                                aria-label={`${cellLabel} incertidumbre expandida`}
                                aria-describedby={issue || warnings.length > 0 ? msgId : undefined}
                                aria-invalid={issue ? true : undefined}
                                value={data.uxExp}
                                disabled={soloLectura}
                                onValueChange={(v) => updateCell(key, { ...data, uxExp: v })}
                                className={inputCls}
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              {complete ? (
                                <span className="text-base font-semibold text-emerald-600">✓</span>
                              ) : issue ? (
                                <span className="text-xs text-rose-500" aria-hidden="true">✗</span>
                              ) : (
                                <StatusIcon status={status} />
                              )}
                            </td>
                          </tr>
                          {(issue || warnings.length > 0) && (
                            <tr>
                              <td colSpan={colCount} className="px-4 pb-2 pt-0">
                                <div id={msgId} role="status" className="text-xs">
                                  {issue && <p className="text-rose-700">✗ {issue}</p>}
                                  {warnings.map((w) => (
                                    <p key={w} className="text-amber-700">⚠ {w} Revise el valor escrito; no se corrige automáticamente.</p>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}

        {!soloLectura && (
          <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0 flex-1 text-sm text-[var(--foreground-muted)]">
              {canSubmit ? (
                <p>Todas las combinaciones PT están completas y guardadas. Puedes enviar el informe final.</p>
              ) : (
                <>
                  <p>Faltan {pendingCells.length} celdas por completar o guardar{pendingCells.length > 0 ? ':' : '.'}</p>
                  {pendingCells.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2" aria-label="Celdas pendientes">
                      {pendingCells.map(({ item, group, key }) => (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => focusPendingCell(item.id, group.id, cells[key])}
                            className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-100"
                          >
                            {item.contaminante} nivel {item.level_label || item.run_code}
                            {sampleGroups.length > 1 ? ` · ${group.sample_group}` : ''}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
            <button type="button" onClick={() => void handleSubmit()} className="btn-primary" disabled={!canSubmit}>
              Enviar informe final PT
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
