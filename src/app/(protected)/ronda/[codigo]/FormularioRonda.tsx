'use client'

import { LogoUnal } from '@/components/LogoUnal'
import { DecimalInput } from '@/components/DecimalInput'
import type { EnvioPT, Ronda, RondaPTItem, RondaPTSampleGroup } from '@/server/rondas'
import { adminGuardarResultadosCsvAction } from '@/app/(protected)/dashboard/rondas/[id]/participantes/[pid]/datos/actions'
import type { AdminPTTarget } from './formulario-pt'
import { TablasCapturaPT } from './TablasCapturaPT'
import { useFormularioPT } from './useFormularioPT'
import { FileInput } from '@/components/ui/FileInput'

export type { AdminPTTarget } from './formulario-pt'

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
  const form = useFormularioPT({
    ronda,
    ptItems,
    sampleGroups,
    enviosIniciales,
    envioFinalizado,
    enviadoAt,
    participantCode,
    replicateCode,
    adminTarget,
  })
  const {
    submitDone,
    submittedAt,
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
    handleKModeChange,
    handleGlobalKChange,
    handlePreviewImport,
    handleReopen,
    confirmDialog,
  } = form

  function handleImportSave() {
    return form.handleImportSave(
      adminTarget
        ? (cells) => adminGuardarResultadosCsvAction(ronda.id, adminTarget.rondaParticipanteId, cells)
        : null,
      (guardadas) => `Se cargaron ${guardadas} celdas para ${participanteEmail}.`,
    )
  }

  return (
    <div className={adminTarget ? '' : 'min-h-screen bg-[var(--background)] px-6 py-8'}>
      {confirmDialog}
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

          {enBorrador && !adminTarget && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              La ronda está en borrador: la captura quedará habilitada cuando el coordinador la active.
            </div>
          )}

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
                <FileInput
                ref={importFileInputRef}
                accept=".csv,text/csv"
                aria-label="Archivo CSV de resultados"
                buttonLabel="Elegir CSV"
                fileName={importFile?.name ?? null}
                disabled={soloLectura}
                onChange={(event) => {
                    setImportFile(event.target.files?.[0] ?? null)
                    setImportPreview(null)
                    setImportStatus('idle')
                    setImportMessage(null)
                  }}
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

        <TablasCapturaPT form={form} sampleGroups={sampleGroups} />
      </div>
    </div>
  )
}
