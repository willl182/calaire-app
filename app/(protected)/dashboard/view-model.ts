import type {
  Contaminante,
  ResultadoParticipantePT,
  Ronda,
  RondaPTItem,
  RondaPTSampleGroup,
} from '@/lib/rondas'

export type ResultadoDashboardRonda = {
  ronda: Ronda
  ptItems: RondaPTItem[]
  sampleGroups: RondaPTSampleGroup[]
  resultados: ResultadoParticipantePT[]
}

export type ResultadoColumna = {
  key: string
  contaminante: Contaminante
  run: string
  level: string
  sampleGroup: string
}

export function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function statusClasses(status: Ronda['estado']) {
  switch (status) {
    case 'activa':
      return 'bg-emerald-100 text-emerald-800'
    case 'cerrada':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

export function getResultadoColumns(
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  contaminante?: Contaminante
): ResultadoColumna[] {
  const filteredItems = contaminante
    ? ptItems.filter((item) => item.contaminante === contaminante)
    : ptItems

  return filteredItems.flatMap((item) =>
    sampleGroups.map((group) => ({
      key: `${item.id}::${group.id}`,
      contaminante: item.contaminante,
      run: item.run_code,
      level: item.level_label,
      sampleGroup: group.sample_group,
    }))
  )
}

export function getResultadoCellMap(resultado: ResultadoParticipantePT) {
  return resultado.celdas.reduce<Record<string, { mean_value: number; sd_value: number }>>((acc, celda) => {
    acc[`${celda.pt_item_id}::${celda.sample_group_id}`] = {
      mean_value: celda.mean_value,
      sd_value: celda.sd_value,
    }
    return acc
  }, {})
}

export function getResultadosSummary(
  rondasResultados: ResultadoDashboardRonda[],
  activeContaminante: Contaminante | null
) {
  const rondasConConfig = rondasResultados.filter((item) => item.ptItems.length > 0 && item.sampleGroups.length > 0)
  const totalParticipantes = rondasResultados.reduce((sum, item) => sum + item.resultados.length, 0)
  const totalEnviosFinales = rondasResultados.reduce(
    (sum, item) => sum + item.resultados.filter((resultado) => resultado.enviados_at !== null).length,
    0
  )
  const contaminantes = Array.from(
    new Set(rondasResultados.flatMap((item) => item.ptItems.map((ptItem) => ptItem.contaminante)))
  )
  const activeContaminanteDisponible = activeContaminante && contaminantes.includes(activeContaminante)
  const activeTab = activeContaminanteDisponible ? activeContaminante : 'rondas'

  return { rondasConConfig, totalParticipantes, totalEnviosFinales, contaminantes, activeTab }
}
