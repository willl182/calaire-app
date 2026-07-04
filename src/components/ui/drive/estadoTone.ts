// Mapa unico de tonos por estado para ambos dominios del drive documental:
// documentos maestros (vigente/en_revision/...) y recursos de ronda
// (pendiente/creado/diligenciado/...).

const DOT_TONES: Record<string, string> = {
  vigente: 'bg-emerald-500 ring-emerald-100',
  diligenciado: 'bg-emerald-500 ring-emerald-100',
  en_revision: 'bg-amber-400 ring-amber-100',
  pendiente: 'bg-amber-400 ring-amber-100',
  creado: 'bg-sky-500 ring-sky-100',
  obsoleto: 'bg-slate-400 ring-slate-100',
  no_aplica: 'bg-slate-400 ring-slate-100',
  reemplazado: 'bg-violet-500 ring-violet-100',
}

export function estadoDotTone(estado: string) {
  return DOT_TONES[estado] ?? 'bg-rose-500 ring-rose-100'
}

const BADGE_TONES: Record<string, string> = {
  vigente: 'bg-emerald-100 text-emerald-800',
  diligenciado: 'bg-emerald-100 text-emerald-800',
  en_revision: 'bg-amber-100 text-amber-800',
  pendiente: 'bg-amber-100 text-amber-800',
  creado: 'bg-sky-100 text-sky-800',
  obsoleto: 'bg-slate-200 text-slate-700',
  no_aplica: 'bg-slate-100 text-slate-700',
  reemplazado: 'bg-violet-100 text-violet-800',
}

export function estadoBadgeTone(estado: string) {
  return BADGE_TONES[estado] ?? 'bg-rose-100 text-rose-800'
}
