/**
 * Tonos semánticos de la interfaz. Toda insignia, aviso o tarjeta de estado
 * elige un tono y obtiene sus clases de aquí, para no repetir colores sueltos.
 */
export type Tono = 'neutral' | 'info' | 'exito' | 'aviso' | 'peligro' | 'especial'

/** Insignia o recuadro: fondo suave, texto fuerte y borde. */
export const TONO_INSIGNIA: Record<Tono, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  info: 'border-sky-200 bg-sky-100 text-sky-800',
  exito: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  aviso: 'border-amber-200 bg-amber-100 text-amber-800',
  peligro: 'border-rose-200 bg-rose-100 text-rose-800',
  especial: 'border-violet-200 bg-violet-100 text-violet-800',
}

/** Aviso enlazado (fila clicable): como la insignia, con estado hover. */
export const TONO_AVISO: Record<Tono, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100',
  info: 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100',
  exito: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  aviso: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  peligro: 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
  especial: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100',
}
