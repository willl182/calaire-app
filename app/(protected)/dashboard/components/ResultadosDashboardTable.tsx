import type { ResultadoParticipantePT } from '@/lib/rondas'
import { formatDate, getResultadoCellMap, type ResultadoColumna } from '../view-model'

function formatFinalSubmitted(value: string | null) {
  if (!value) return 'Sin envío final'
  return formatDate(value)
}

export function ResultadosDashboardTable({
  resultados,
  columnas,
}: {
  resultados: ResultadoParticipantePT[]
  columnas: ResultadoColumna[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[64rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Participante
            </th>
            <th className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Estado
            </th>
            <th className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Envío final
            </th>
            {columnas.map((columna) => (
              <th
                key={columna.key}
                className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]"
              >
                <div className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                  {columna.contaminante}
                </div>
                <div>{columna.run}</div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {columna.level} · {columna.sampleGroup}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultados.map((resultado) => {
            const celdas = getResultadoCellMap(resultado)
            const completo = resultado.completados >= resultado.total_esperado && resultado.total_esperado > 0
            return (
              <tr key={resultado.participante_id} className="align-top">
                <td className="sticky left-0 z-10 border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 py-4">
                  <div className="font-medium text-[var(--foreground)]">{resultado.email}</div>
                  <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                    participant_id:{' '}
                    <span className="numeric text-[var(--foreground)]">{resultado.participant_code ?? '—'}</span>
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    replicate:{' '}
                    <span className="numeric text-[var(--foreground)]">{resultado.replicate_code ?? '—'}</span>
                  </div>
                </td>
                <td className="border-b border-[var(--border-soft)] px-4 py-4">
                  <span className={`numeric rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    completo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {resultado.completados}/{resultado.total_esperado}
                  </span>
                </td>
                <td className="border-b border-[var(--border-soft)] px-4 py-4 text-[var(--foreground-muted)]">
                  {formatFinalSubmitted(resultado.enviados_at)}
                </td>
                {columnas.map((columna) => {
                  const celda = celdas[columna.key]
                  return (
                    <td key={`${resultado.participante_id}-${columna.key}`} className="border-b border-[var(--border-soft)] px-4 py-4">
                      {celda ? (
                        <div className="space-y-1">
                          <div className="numeric font-medium text-[var(--foreground)]">mean {celda.mean_value}</div>
                          <div className="numeric text-xs text-[var(--foreground-muted)]">sd {celda.sd_value}</div>
                        </div>
                      ) : (
                        <span className="text-[var(--border)]">Sin dato</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
