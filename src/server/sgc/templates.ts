import { readFileSync } from 'fs'
import { join } from 'path'

export const P20_TEMPLATE_NAMES = [
  'convocatoria',
  'recordatorio-ficha',
  'recordatorio-envio-resultados',
  'publicacion-resultados',
  'cierre-ronda',
] as const

export type P20TemplateName = (typeof P20_TEMPLATE_NAMES)[number]

export function isP20TemplateName(name: string): name is P20TemplateName {
  return P20_TEMPLATE_NAMES.includes(name as P20TemplateName)
}

export function readTemplate(name: P20TemplateName): string {
  const filePath = join(process.cwd(), 'src', 'server', 'sgc', 'templates', 'p20', `${name}.md`)
  return readFileSync(filePath, 'utf-8')
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export function buildTemplateVars(
  ronda: { codigo: string; nombre: string },
  baseUrl: string
): Record<string, string> {
  return {
    ronda_codigo: ronda.codigo,
    ronda_nombre: ronda.nombre,
    fecha_limite: '[FECHA LIMITE — COMPLETAR]',
    participante_nombre: '[NOMBRE PARTICIPANTE — COMPLETAR]',
    laboratorio_nombre: '[NOMBRE LABORATORIO — COMPLETAR]',
    link_ronda: `${baseUrl}/ronda/${ronda.codigo}`,
    contacto_soporte: '[CONTACTO SOPORTE — COMPLETAR]',
  }
}
