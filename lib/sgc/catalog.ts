export type SgcFormatoCodigo =
  | 'F-PPSEA-03'
  | 'F-PSEA-05'
  | 'F-PSEA-05A'
  | 'F-PSEA-06'
  | 'F-PSEA-07'
  | 'F-PSEA-08'
  | 'F-PSEA-09'
  | 'F-PSEA-10'
  | 'F-PSEA-11'
  | 'F-PSEA-12'
  | 'F-PSEA-13'
  | 'F-PSEA-14'

export type SgcFase = 'planeacion' | 'convocatoria' | 'ejecucion' | 'evaluacion' | 'cierre'
export type SgcModo = 'nativo' | 'nativo_calculado' | 'archivo' | 'no_aplica_inicial'

export type SgcFormato = {
  codigo: SgcFormatoCodigo
  nombre: string
  fase: SgcFase
  modo: SgcModo
  critico: boolean
  descripcion: string
}

export const SGC_PLAN_BLOQUES = [
  { key: 'a', label: 'a) Personal involucrado en el diseño y la operación del programa de EA.' },
  { key: 'b', label: 'b) Actividades de los proveedores externos de productos y servicios y sus datos de contacto.' },
  { key: 'c', label: 'c) Criterios que deben cumplirse para participar en el programa de EA.' },
  { key: 'd', label: 'd) Número y tipo de participantes esperados.' },
  { key: 'e', label: 'e) Descripción de las actividades a realizar y los resultados que deben informar los participantes.' },
  { key: 'f', label: 'f) Descripción del rango de valores o características esperadas de los ítems de EA.' },
  { key: 'g', label: 'g) Principales fuentes potenciales de errores relacionadas con el área técnica del EA.' },
  { key: 'h', label: 'h) Requisitos para la producción, control de calidad, almacenamiento y distribución de los ítems de EA.' },
  { key: 'i', label: 'i) Disposiciones para evitar colusión o falsificación de resultados entre participantes.' },
  { key: 'j', label: 'j) Descripción de la información a suministrar a los participantes y cronograma de actividades.' },
  { key: 'k', label: 'k) Para EA continuos: frecuencia de distribución de ítems, fechas límite para reporte de resultados y fechas para la ejecución de las mediciones.' },
  { key: 'l', label: 'l) Información sobre métodos o procedimientos que los participantes deben utilizar para almacenar, manipular, preparar, enviar o desechar los ítems, así como para realizar mediciones.' },
  { key: 'm', label: 'm) Procedimientos de medición o métodos de ensayo para las pruebas de homogeneidad y estabilidad de los ítems.' },
  { key: 'n', label: 'n) Preparación de formatos normalizados de informe que deben utilizar los participantes.' },
  { key: 'o', label: 'o) Descripción detallada del análisis estadístico a utilizar.' },
  { key: 'p', label: 'p) Origen, trazabilidad metrológica e incertidumbre de los valores asignados.' },
  { key: 'q', label: 'q) Tratamiento de resultados obtenidos por diferentes métodos de medición que permitan evaluación comparable.' },
  { key: 'r', label: 'r) Criterios para la evaluación del desempeño de los participantes.' },
  { key: 's', label: 's) Descripción de los datos, informes provisionales o información a devolver a los participantes.' },
  { key: 't', label: 't) Descripción del grado en que los resultados serán públicos y las conclusiones basadas en ellos.' },
  { key: 'u', label: 'u) Procedimientos en caso de pérdida, deterioro o daño de los ítems de EA.' },
] as const

export type SgcPlanBloqueKey = typeof SGC_PLAN_BLOQUES[number]['key']
export type SgcPlanBloques = Partial<Record<SgcPlanBloqueKey, string>>

export const SGC_LEYENDA_CODIGO_PROVISIONAL =
  'Codigo documental pendiente de confirmacion contra lista maestra SGC.'

export const SGC_FORMATOS_FASE_1: SgcFormato[] = [
  {
    codigo: 'F-PPSEA-03',
    nombre: 'Plan de ronda',
    fase: 'planeacion',
    modo: 'nativo',
    critico: true,
    descripcion: 'Plan finalizado, responsable, fecha y snapshot.',
  },
  {
    codigo: 'F-PSEA-06',
    nombre: 'Plan operativo de ronda',
    fase: 'planeacion',
    modo: 'nativo',
    critico: true,
    descripcion: 'Registro nativo asociado al plan final de ronda.',
  },
  {
    codigo: 'F-PSEA-05',
    nombre: 'Listado de participantes',
    fase: 'convocatoria',
    modo: 'nativo_calculado',
    critico: true,
    descripcion: 'Participantes member reclamados o justificados.',
  },
  {
    codigo: 'F-PSEA-05A',
    nombre: 'Fichas de inscripcion',
    fase: 'convocatoria',
    modo: 'nativo_calculado',
    critico: true,
    descripcion: 'Fichas enviadas o justificacion documental.',
  },
  {
    codigo: 'F-PSEA-07',
    nombre: 'Codigos de participante',
    fase: 'convocatoria',
    modo: 'nativo_calculado',
    critico: true,
    descripcion: 'Codigos de participante unicos y sin provisionales.',
  },
  {
    codigo: 'F-PSEA-08',
    nombre: 'Preparacion o distribucion de muestras',
    fase: 'ejecucion',
    modo: 'archivo',
    critico: true,
    descripcion: 'Evidencia vigente cargada en Storage.',
  },
  {
    codigo: 'F-PSEA-09',
    nombre: 'Recepcion y control de resultados',
    fase: 'ejecucion',
    modo: 'archivo',
    critico: true,
    descripcion: 'Evidencia vigente cargada en Storage.',
  },
  {
    codigo: 'F-PSEA-10',
    nombre: 'Procesamiento estadistico',
    fase: 'evaluacion',
    modo: 'archivo',
    critico: true,
    descripcion: 'Evidencia vigente cargada en Storage.',
  },
  {
    codigo: 'F-PSEA-11',
    nombre: 'Registro no aplicable inicial',
    fase: 'evaluacion',
    modo: 'no_aplica_inicial',
    critico: true,
    descripcion: 'Debe quedar marcado no aplica con razon documentada.',
  },
  {
    codigo: 'F-PSEA-12',
    nombre: 'Envios finales de participantes',
    fase: 'evaluacion',
    modo: 'nativo_calculado',
    critico: true,
    descripcion: 'Envios finales completos cuando aplique.',
  },
  {
    codigo: 'F-PSEA-13',
    nombre: 'Revision de datos',
    fase: 'cierre',
    modo: 'nativo',
    critico: true,
    descripcion: 'Revision finalizada, metricas revisadas y snapshot.',
  },
  {
    codigo: 'F-PSEA-14',
    nombre: 'Informe o comunicacion final',
    fase: 'cierre',
    modo: 'archivo',
    critico: true,
    descripcion: 'Evidencia vigente cargada en Storage.',
  },
]

export function getSgcFormato(codigo: SgcFormatoCodigo) {
  return SGC_FORMATOS_FASE_1.find((formato) => formato.codigo === codigo) ?? null
}
