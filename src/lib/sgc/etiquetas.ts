/**
 * Tildes solo para mostrar. Los nombres del catálogo SGC (`documento.nombre`,
 * `etapa.carpeta`, motivos del expediente…) se guardan sin tildes porque forman
 * parte de nombres de archivo y carpetas en Drive: no se cambian en los datos,
 * solo en la etiqueta visible.
 */
const PALABRAS: Record<string, string> = {
  analisis: 'análisis',
  area: 'área',
  areas: 'áreas',
  basica: 'básica',
  basico: 'básico',
  calculo: 'cálculo',
  codigo: 'código',
  codigos: 'códigos',
  critica: 'crítica',
  critico: 'crítico',
  criticos: 'críticos',
  diagnostico: 'diagnóstico',
  dias: 'días',
  especifica: 'específica',
  estadistica: 'estadística',
  estadistico: 'estadístico',
  estadisticos: 'estadísticos',
  guia: 'guía',
  item: 'ítem',
  items: 'ítems',
  logistica: 'logística',
  maximo: 'máximo',
  metodo: 'método',
  metodos: 'métodos',
  metricas: 'métricas',
  minimo: 'mínimo',
  modulo: 'módulo',
  numero: 'número',
  pagina: 'página',
  periodo: 'período',
  publica: 'pública',
  publico: 'público',
  sintesis: 'síntesis',
  tecnica: 'técnica',
  tecnico: 'técnico',
  ultima: 'última',
  ultimo: 'último',
  unica: 'única',
  unico: 'único',
  aun: 'aún',
  todavia: 'todavía',
  despues: 'después',
  tambien: 'también',
}

function conMayuscula(original: string, reemplazo: string) {
  if (original === original.toUpperCase() && original.length > 1) return reemplazo.toUpperCase()
  if (original[0] === original[0].toUpperCase()) return reemplazo[0].toUpperCase() + reemplazo.slice(1)
  return reemplazo
}

/** Agrega tildes a una etiqueta visible ("Planificacion de ronda" → "Planificación de ronda"). */
export function etiquetaVisible(texto: string): string {
  return texto.replace(/[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+/g, (palabra) => {
    const minuscula = palabra.toLowerCase()
    // -cion / -sion singulares siempre llevan tilde (relación, revisión…).
    const singular = minuscula.match(/^(.+[cs])ion$/)
    if (singular && minuscula.length > 5) return conMayuscula(palabra, `${singular[1]}ión`)
    const reemplazo = PALABRAS[minuscula]
    return reemplazo ? conMayuscula(palabra, reemplazo) : palabra
  })
}
