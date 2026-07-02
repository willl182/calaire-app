import type { RondaPTItem } from './types'

export function isInitialConcentrationLevel(item: RondaPTItem, ptItems: RondaPTItem[]): boolean {
  const sameContaminante = ptItems.filter((candidate) => candidate.contaminante === item.contaminante)
  if (sameContaminante.length === 0) return false
  const lowestSortOrder = Math.min(...sameContaminante.map((candidate) => candidate.sort_order))
  const normalizedLevel = item.level_label.trim().toLowerCase().replace(/,/g, '.')
  const numericMatch = normalizedLevel.match(/^[+-]?(\d+\.?\d*|\.\d+)/)
  const numericLevel = numericMatch ? parseFloat(numericMatch[0]) : NaN

  return item.sort_order === lowestSortOrder || normalizedLevel === 'cero' || numericLevel === 0
}

export function getRequiredPTReplicateCount(item: RondaPTItem, ptItems: RondaPTItem[]): 1 | 3 {
  return isInitialConcentrationLevel(item, ptItems) ? 1 : 3
}
