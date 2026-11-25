'use client'

// Tablas de captura PT por contaminante y barra de envío final ("Faltan N"),
// compartidas por FormularioRonda y FormularioReferencia.
import { Fragment } from 'react'
import { DecimalInput } from '@/components/DecimalInput'
import { statsWarnings } from '@/lib/decimal'
import type { RondaPTSampleGroup } from '@/server/rondas'
import { getCellIssue, isCellComplete, toCellKey, type SaveStatus } from './formulario-pt'
import type { FormularioPT } from './useFormularioPT'

function StatusIcon({ status }: { status: SaveStatus }) {
  if (status === 'saving') return <span className="text-xs text-slate-500">guardando…</span>
  if (status === 'saved') return <span className="text-xs text-emerald-600">✓</span>
  if (status === 'error') return <span className="text-xs text-rose-600">✗</span>
  if (status === 'dirty') return <span className="text-xs text-amber-600">•</span>
  return null
}

export function TablasCapturaPT({ form, sampleGroups }: { form: FormularioPT; sampleGroups: RondaPTSampleGroup[] }) {
  const {
    itemsByContaminante,
    cells,
    saveErrors,
    saveStatus,
    soloLectura,
    kMode,
    canSubmit,
    pendingCells,
    updateCell,
    focusPendingCell,
    handleSubmit,
  } = form

  return (
    <>
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
    </>
  )
}
