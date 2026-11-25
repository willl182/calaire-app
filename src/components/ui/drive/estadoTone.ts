// Mapa unico de tonos por estado para ambos dominios del drive documental:
// documentos maestros (vigente/en_revision/...) y recursos de ronda
// (pendiente/creado/diligenciado/...).

const DOT_TONES: Record<string, string> = {
  vigente: 'bg-success ring-success-border',
  diligenciado: 'bg-success ring-success-border',
  en_revision: 'bg-warning ring-warning-border',
  pendiente: 'bg-warning ring-warning-border',
  creado: 'bg-info ring-info-border',
  obsoleto: 'bg-line-strong ring-line-soft',
  no_aplica: 'bg-line-strong ring-line-soft',
  reemplazado: 'bg-special ring-special-border',
}

export function estadoDotTone(estado: string) {
  return DOT_TONES[estado] ?? 'bg-danger ring-danger-border'
}

const BADGE_TONES: Record<string, string> = {
  vigente: 'bg-success-soft text-success-strong',
  diligenciado: 'bg-success-soft text-success-strong',
  en_revision: 'bg-warning-soft text-warning-strong',
  pendiente: 'bg-warning-soft text-warning-strong',
  creado: 'bg-info-soft text-info-strong',
  obsoleto: 'bg-line-soft text-foreground',
  no_aplica: 'bg-surface-muted text-foreground',
  reemplazado: 'bg-special-soft text-special-strong',
}

export function estadoBadgeTone(estado: string) {
  return BADGE_TONES[estado] ?? 'bg-danger-soft text-danger-strong'
}
