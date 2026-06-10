import type { EnvioPTConMetadatos, ResultadoParticipante } from './types'

function escapeCsvValue(value: unknown): string {
  const normalized = String(value ?? '')
  return /[",\n]/.test(normalized)
    ? `"${normalized.replace(/"/g, '""')}"`
    : normalized
}

function stringifyCsvRows(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

export function buildResultadosCsv(resultados: ResultadoParticipante[]): string {
  const header = [
    'participant_id',
    'participant_email',
    'pollutant',
    'level',
    'mean_value',
    'uncertainty',
    'submitted_at',
  ]

  const rows = resultados.flatMap((resultado) =>
    resultado.envios.map((envio) => [
      resultado.workos_user_id,
      resultado.email,
      envio.contaminante.toLowerCase(),
      String(envio.nivel),
      ...envio.valores.map((value) => String(value)),
      envio.promedio != null ? String(envio.promedio) : '',
      envio.incertidumbre != null ? String(envio.incertidumbre) : '',
      envio.submitted_at,
    ])
  )

  const maxReplicas = Math.max(0, ...resultados.flatMap((r) => r.envios.map((e) => e.valores.length)))
  const replicaHeaders = Array.from({ length: maxReplicas }, (_, index) => `replicate_${index + 1}`)
  const csvRows = [[...header.slice(0, 4), ...replicaHeaders, ...header.slice(4)]]

  for (const row of rows) {
    const base = row.slice(0, 4)
    const replicas = row.slice(4, row.length - 3)
    const tail = row.slice(row.length - 3)
    const paddedReplicas = [...replicas, ...Array(Math.max(0, maxReplicas - replicas.length)).fill('')]
    csvRows.push([...base, ...paddedReplicas, ...tail])
  }

  return stringifyCsvRows(csvRows)
}

export function buildPTCsv(envios: EnvioPTConMetadatos[]): string {
  const header = [
    'pollutant',
    'run',
    'level',
    'participant_id',
    'replicate',
    'sample_group',
    'd1',
    'd2',
    'd3',
    'mean_value',
    'sd_value',
    'ux',
    'k',
    'ux_exp',
  ]

  const rows = envios.map((envio) => [
    envio.pollutant,
    envio.run,
    envio.level,
    envio.participant_id,
    String(envio.replicate),
    envio.sample_group,
    envio.d1 != null ? String(envio.d1) : '',
    envio.d2 != null ? String(envio.d2) : '',
    envio.d3 != null ? String(envio.d3) : '',
    String(envio.mean_value),
    String(envio.sd_value),
    envio.ux != null ? String(envio.ux) : '',
    envio.k != null ? String(envio.k) : '',
    envio.ux_exp != null ? String(envio.ux_exp) : '',
  ])

  return stringifyCsvRows([header, ...rows])
}
