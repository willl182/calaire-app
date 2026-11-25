/**
 * Tonos semánticos de la interfaz. Toda insignia, aviso o tarjeta de estado
 * elige un tono y obtiene sus clases de aquí, para no repetir colores sueltos.
 */
export type Tono = 'neutral' | 'info' | 'exito' | 'aviso' | 'peligro' | 'especial'

/** Insignia o recuadro: fondo suave, texto fuerte y borde. */
export const TONO_INSIGNIA: Record<Tono, string> = {
  neutral: 'border-line-soft bg-surface-muted text-foreground',
  info: 'border-info-border bg-info-soft text-info-strong',
  exito: 'border-success-border bg-success-soft text-success-strong',
  aviso: 'border-warning-border bg-warning-soft text-warning-strong',
  peligro: 'border-danger-border bg-danger-soft text-danger-strong',
  especial: 'border-special-border bg-special-soft text-special-strong',
}

/** Aviso enlazado (fila clicable): como la insignia, con estado hover. */
export const TONO_AVISO: Record<Tono, string> = {
  neutral: 'border-line-soft bg-surface text-foreground hover:bg-line-soft',
  info: 'border-info-border bg-info-soft text-info-strong hover:bg-info-border/50',
  exito: 'border-success-border bg-success-soft text-success-strong hover:bg-success-border/50',
  aviso: 'border-warning-border bg-warning-soft text-warning-strong hover:bg-warning-border/50',
  peligro: 'border-danger-border bg-danger-soft text-danger-strong hover:bg-danger-border/50',
  especial: 'border-special-border bg-special-soft text-special-strong hover:bg-special-border/50',
}
