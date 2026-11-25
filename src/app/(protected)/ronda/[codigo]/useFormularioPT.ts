'use client'

// Estado y comportamiento comunes de la captura PT (FormularioRonda / FormularioReferencia):
// celdas, autoguardado con espera de 1,2 s, factor k grupal, previsualización y carga CSV,
// envío final, reapertura (admin) y la lista de celdas pendientes ("Faltan N").
import { useEffect, useRef, useState } from 'react'
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
  adminReabrirInformeFinalAction,
} from '@/app/(protected)/dashboard/rondas/[id]/participantes/[pid]/datos/actions'
import { enviarInformeFinalAction, guardarEnvioAction } from './actions'
import {
  firstPendingField,
  fromCellKey,
  getCellIssue,
  initCells,
  initStatus,
  isCellComplete,
  isValidNumberInput,
  num,
  toCellKey,
  type AdminPTTarget,
  type CellData,
  type CellKey,
  type ImportStatus,
  type KMode,
  type SaveStatus,
} from './formulario-pt'
import { formatDecimal } from '@/lib/decimal'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export type GuardarCsvResult = { ok?: boolean; saved?: number; errors?: string[]; error?: string }

export function useFormularioPT({
  ronda,
  ptItems,
  sampleGroups,
  enviosIniciales,
  envioFinalizado,
  enviadoAt,
  participantCode,
  replicateCode,
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
  const { confirm, dialog: confirmDialog } = useConfirm()
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  const cerrada = ronda.estado === 'documentacion_pendiente' || ronda.estado === 'cerrada'
  // Solo una ronda activa admite cambios: en borrador la captura también queda en solo lectura.
  const enBorrador = ronda.estado === 'borrador'
  const soloLectura = ronda.estado !== 'activa' || submitDone
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
      setImportMessage(null)
    } catch (error) {
      setImportPreview(null)
      setImportStatus('error')
      setImportMessage(error instanceof Error ? error.message : 'No fue posible leer el CSV.')
    }
  }

  /**
   * Guarda las celdas de la previsualización CSV con `guardar` (null = sin carga CSV disponible)
   * y refleja en la tabla las filas guardadas.
   */
  async function handleImportSave(
    guardar: ((cells: ReferenciaImportPreview['cells']) => Promise<GuardarCsvResult>) | null,
    mensajeExito: (guardadas: number) => string,
  ) {
    if (!guardar || !importPreview || importPreview.errors.length > 0 || importPreview.cells.length === 0) return
    cancelAllPendingSaves()
    setImportStatus('saving')
    setImportMessage(null)

    const result = await guardar(importPreview.cells)
    const savedRows = importPreview.cells.slice(0, result.saved ?? (result.ok ? importPreview.cells.length : 0))

    if (savedRows.length > 0) {
      setCells((prev) => {
        const next = { ...prev }
        for (const row of savedRows) {
          next[toCellKey(row.ptItemId, row.sampleGroupId)] = {
            d1: formatDecimal(row.d1),
            d2: formatDecimal(row.d2),
            d3: formatDecimal(row.d3),
            meanValue: formatDecimal(row.meanValue),
            sdValue: formatDecimal(row.sdValue),
            ux: formatDecimal(row.ux),
            k: formatDecimal(row.k),
            uxExp: formatDecimal(row.uxExp),
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
    setImportMessage(mensajeExito(savedRows.length))
  }

  /** Vacía la tabla y la carga CSV (tras borrar los envíos en el servidor). */
  function resetCaptura() {
    setCells(() => initCells(ptItems, sampleGroups, []))
    setSaveStatus(() => initStatus(ptItems, sampleGroups, []))
    setSaveErrors({})
    setImportFile(null)
    if (importFileInputRef.current) importFileInputRef.current.value = ''
    setImportPreview(null)
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
    const confirmed = await confirm({
      title: 'Reabrir informe',
      message: 'Se conservarán los valores, pero el informe volverá a borrador y podrá editarse hasta enviarlo nuevamente. ¿Continuar?',
      confirmLabel: 'Reabrir informe',
      tone: 'primary',
    })
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

  return {
    submitDone,
    submittedAt,
    cells,
    saveStatus,
    saveErrors,
    formMessage,
    importFile,
    setImportFile,
    importPreview,
    setImportPreview,
    importStatus,
    setImportStatus,
    importMessage,
    setImportMessage,
    kMode,
    globalK,
    importFileInputRef,
    cerrada,
    enBorrador,
    soloLectura,
    hasPTConfig,
    hasParticipantCodes,
    totalCells,
    completedCells,
    invalidCells,
    progressPct,
    allComplete,
    canSubmit,
    cancelAllPendingSaves,
    updateCell,
    handleKModeChange,
    handleGlobalKChange,
    handlePreviewImport,
    handleImportSave,
    resetCaptura,
    handleSubmit,
    handleReopen,
    confirmDialog,
    itemsByContaminante,
    pendingCells,
    focusPendingCell,
  }
}

export type FormularioPT = ReturnType<typeof useFormularioPT>
