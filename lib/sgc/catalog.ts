export type SgcFormatoCodigo =
  | 'F-PSEA-03'
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

export type SgcRondaDocumentoEstado = 'disponible' | 'pendiente' | 'no_aplica'

export type SgcRondaDocumento = {
  codigo: string
  nombre: string
  estado: SgcRondaDocumentoEstado
  archivoBase?: string
  formatoOperativo?: SgcFormatoCodigo
  nota: string
}

export type SgcRondaEtapa = {
  key: string
  numero: string
  nombre: string
  carpeta: string
  foco: 'planificacion' | 'comunicaciones' | 'item' | 'datos' | 'homogeneidad' | 'informe' | 'cierre'
  descripcion: string
  documentos: SgcRondaDocumento[]
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
    codigo: 'F-PSEA-03',
    nombre: 'Registro de participacion y carga de datos del participante',
    fase: 'planeacion',
    modo: 'nativo',
    critico: true,
    descripcion: 'Registro nativo de participacion, datos del laboratorio, equipos y condiciones aceptadas.',
  },
  {
    codigo: 'F-PSEA-06',
    nombre: 'Planificacion de ronda EA',
    fase: 'planeacion',
    modo: 'nativo',
    critico: true,
    descripcion: 'Plan finalizado, responsable, fecha, bloques ISO/IEC 17043 y snapshot.',
  },
  {
    codigo: 'F-PSEA-05',
    nombre: 'Ficha basica de ronda EA',
    fase: 'convocatoria',
    modo: 'nativo_calculado',
    critico: true,
    descripcion: 'Caratula de ronda, alcance, fechas, participantes previstos y registros asociados.',
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
    nombre: 'Preparacion y control del item',
    fase: 'convocatoria',
    modo: 'nativo_calculado',
    critico: true,
    descripcion: 'Control de preparacion del item y codigos de participante unicos y sin provisionales.',
  },
  {
    codigo: 'F-PSEA-08',
    nombre: 'Datos reportados por participante',
    fase: 'ejecucion',
    modo: 'archivo',
    critico: true,
    descripcion: 'Copia o exportacion oficial de los datos reportados por participante.',
  },
  {
    codigo: 'F-PSEA-09',
    nombre: 'Datos de participantes exportados para analisis PT',
    fase: 'ejecucion',
    modo: 'archivo',
    critico: true,
    descripcion: 'Exportacion oficial desde calaire-app hacia pt_app.',
  },
  {
    codigo: 'F-PSEA-10',
    nombre: 'Registro de preprocesamiento de datos',
    fase: 'evaluacion',
    modo: 'archivo',
    critico: true,
    descripcion: 'Registro trazable de preprocesamiento, exclusiones y transformaciones.',
  },
  {
    codigo: 'F-PSEA-11',
    nombre: 'Homogeneidad y estabilidad del item',
    fase: 'evaluacion',
    modo: 'no_aplica_inicial',
    critico: true,
    descripcion: 'Revision nativa o evidencia documentada de homogeneidad y estabilidad.',
  },
  {
    codigo: 'F-PSEA-12',
    nombre: 'Datos oficiales consolidados para evaluacion de aptitud',
    fase: 'evaluacion',
    modo: 'nativo_calculado',
    critico: true,
    descripcion: 'Dataset oficial consolidado con envios finales completos o justificados.',
  },
  {
    codigo: 'F-PSEA-13',
    nombre: 'Informe final de resultados',
    fase: 'cierre',
    modo: 'nativo',
    critico: true,
    descripcion: 'Revision finalizada, metricas revisadas, snapshot e informe final de resultados.',
  },
  {
    codigo: 'F-PSEA-14',
    nombre: 'Registro caso de queja o NC segun aplique',
    fase: 'cierre',
    modo: 'archivo',
    critico: true,
    descripcion: 'Registro de queja, trabajo no conforme, no conformidad o accion correctiva si aplica.',
  },
]

export function getSgcFormato(codigo: SgcFormatoCodigo) {
  return SGC_FORMATOS_FASE_1.find((formato) => formato.codigo === codigo) ?? null
}

export const SGC_RONDA_ETAPAS: SgcRondaEtapa[] = [
  {
    key: 'planificacion',
    numero: '01',
    nombre: 'Planificacion de ronda',
    carpeta: '01_planificacion_ronda',
    foco: 'planificacion',
    descripcion: 'Define alcance, calendario, participantes previstos, recursos, responsabilidades y criterios de evaluacion.',
    documentos: [
      { codigo: 'F-PSEA-01', nombre: 'Calendario global de ronda', estado: 'pendiente', nota: 'Formato maestro XLSX pendiente de integrar como evidencia de ronda.' },
      { codigo: 'F-PSEA-02', nombre: 'Cronograma detallado de ronda', estado: 'pendiente', nota: 'Formato maestro XLSX pendiente de integrar como evidencia de ronda.' },
      { codigo: 'F-PSEA-03', nombre: 'Registro de participacion y carga de datos del participante', estado: 'disponible', formatoOperativo: 'F-PSEA-03', nota: 'Se gestiona desde fichas y datos nativos de participantes.' },
      { codigo: 'F-PSEA-04', nombre: 'Equipos e instrumentos exportados desde F-PSEA-03', estado: 'pendiente', nota: 'Exportacion operativa pendiente de exponerse en el expediente.' },
      { codigo: 'F-PSEA-05', nombre: 'Ficha basica de ronda EA', estado: 'disponible', archivoBase: 'F-PSEA-05 Ficha basica de ronda EA', formatoOperativo: 'F-PSEA-05', nota: 'Existe en docs/EA-PP-2026-R1 y se cubre con datos nativos de ronda.' },
      { codigo: 'F-PSEA-06', nombre: 'Planificacion de ronda EA', estado: 'disponible', archivoBase: 'F-PSEA-06 Planificacion de ronda EA', formatoOperativo: 'F-PSEA-06', nota: 'Existe en docs/EA-PP-2026-R1 y se diligencia en el plan nativo.' },
      { codigo: 'F-PSEA-16', nombre: 'Matriz de competencia y autorizacion', estado: 'pendiente', nota: 'Aplica cuando se documente competencia especifica de la ronda.' },
      { codigo: 'F-PSEA-17', nombre: 'Evaluacion de proveedores criticos, si aplica', estado: 'pendiente', nota: 'Aplica si la ronda usa proveedores criticos.' },
    ],
  },
  {
    key: 'comunicaciones',
    numero: '02',
    nombre: 'Comunicaciones con participantes',
    carpeta: '02_comunicaciones_participantes',
    foco: 'comunicaciones',
    descripcion: 'Conserva convocatorias, aclaraciones, respuestas, acuses y comunicaciones formales emitidas durante la ronda.',
    documentos: [
      { codigo: 'F-PSEA-18', nombre: 'Formato de comunicacion oficial al participante', estado: 'pendiente', nota: 'Pendiente de enlazar con publicaciones, plantillas y notificaciones.' },
      { codigo: 'EVID-COM', nombre: 'Respuestas o acuses de recibo del participante', estado: 'pendiente', nota: 'Evidencia operativa pendiente de carga o sincronizacion.' },
      { codigo: 'EVID-ACL', nombre: 'Comunicaciones de aclaracion o cambios, si aplica', estado: 'pendiente', nota: 'Se conserva cuando existan aclaraciones o cambios.' },
    ],
  },
  {
    key: 'preparacion_item',
    numero: '03',
    nombre: 'Preparacion del item',
    carpeta: '03_preparacion_item',
    foco: 'item',
    descripcion: 'Agrupa la preparacion, control y verificaciones tecnicas del item de ensayo de aptitud.',
    documentos: [
      { codigo: 'F-PSEA-07', nombre: 'Preparacion y control del item', estado: 'disponible', archivoBase: 'F-PSEA-07 Preparacion y control del item', formatoOperativo: 'F-PSEA-07', nota: 'Existe en docs/EA-PP-2026-R1; la vista valida codigos y trazabilidad operativa.' },
      { codigo: 'EVID-CERT', nombre: 'Certificados de gases, equipos o patrones usados', estado: 'pendiente', nota: 'Evidencia tecnica pendiente de carga cuando aplique.' },
      { codigo: 'EVID-MONT', nombre: 'Evidencia de montaje, configuracion o verificacion tecnica', estado: 'pendiente', nota: 'Evidencia tecnica pendiente de carga cuando aplique.' },
    ],
  },
  {
    key: 'datos',
    numero: '04',
    nombre: 'Datos y preprocesamiento',
    carpeta: '04_datos_y_preprocesamiento',
    foco: 'datos',
    descripcion: 'Controla el flujo oficial de datos desde lo reportado por participantes hasta el dataset consolidado.',
    documentos: [
      { codigo: 'F-PSEA-08', nombre: 'Datos reportados por participante', estado: 'disponible', archivoBase: 'F-PSEA-08 Datos reportados por participante', formatoOperativo: 'F-PSEA-08', nota: 'Existe en docs/EA-PP-2026-R1; admite evidencia cargada.' },
      { codigo: 'F-PSEA-09', nombre: 'Datos de participantes exportados para analisis PT', estado: 'disponible', archivoBase: 'F-PSEA-09 Datos de participantes exportados para analisis PT', formatoOperativo: 'F-PSEA-09', nota: 'Existe en docs/EA-PP-2026-R1; admite evidencia cargada.' },
      { codigo: 'F-PSEA-10', nombre: 'Registro de preprocesamiento de datos', estado: 'disponible', archivoBase: 'F-PSEA-10 Registro de preprocesamiento de datos', formatoOperativo: 'F-PSEA-10', nota: 'Existe en docs/EA-PP-2026-R1; admite evidencia cargada.' },
      { codigo: 'F-PSEA-12', nombre: 'Datos oficiales consolidados para evaluacion de aptitud', estado: 'disponible', archivoBase: 'F-PSEA-12 Datos oficiales consolidados para evaluacion de aptitud', formatoOperativo: 'F-PSEA-12', nota: 'Existe en docs/EA-PP-2026-R1; se cubre con envios finales y dataset consolidado.' },
      { codigo: 'EVID-CSV', nombre: 'Archivos CSV o exportaciones conservadas para trazabilidad', estado: 'pendiente', nota: 'Pendiente de exponer descargas conservadas como evidencia.' },
    ],
  },
  {
    key: 'homogeneidad',
    numero: '05',
    nombre: 'Homogeneidad y estabilidad',
    carpeta: '05_homogeneidad_estabilidad',
    foco: 'homogeneidad',
    descripcion: 'Documenta muestreo, analisis, resultados y conclusiones sobre homogeneidad y estabilidad del item.',
    documentos: [
      { codigo: 'F-PSEA-11', nombre: 'Homogeneidad y estabilidad del item', estado: 'disponible', archivoBase: 'F-PSEA-11 Homogeneidad y estabilidad del item', formatoOperativo: 'F-PSEA-11', nota: 'Existe en docs/EA-PP-2026-R1; se revisa con el registro nativo de H/E.' },
      { codigo: 'F-PSEA-11A', nombre: 'Datos preprocesados de homogeneidad', estado: 'pendiente', nota: 'Subformato/anexo pendiente.' },
      { codigo: 'F-PSEA-11B', nombre: 'Datos preprocesados de estabilidad', estado: 'pendiente', nota: 'Subformato/anexo pendiente.' },
      { codigo: 'F-PSEA-11C', nombre: 'Resultados de homogeneidad', estado: 'pendiente', nota: 'Subformato/anexo pendiente.' },
      { codigo: 'F-PSEA-11D', nombre: 'Resultados de estabilidad', estado: 'pendiente', nota: 'Subformato/anexo pendiente.' },
    ],
  },
  {
    key: 'analisis_informe',
    numero: '06',
    nombre: 'Analisis e informe',
    carpeta: '06_analisis_e_informe',
    foco: 'informe',
    descripcion: 'Conserva el informe final, evidencia de envio y salidas generadas para comunicar resultados.',
    documentos: [
      { codigo: 'F-PSEA-13', nombre: 'Informe final de resultados', estado: 'disponible', archivoBase: 'F-PSEA-13 Informe final de resultados', formatoOperativo: 'F-PSEA-13', nota: 'Existe en docs/EA-PP-2026-R1; la vista permite revision final y snapshot.' },
      { codigo: 'EVID-ENVIO', nombre: 'Evidencia de envio del informe final al participante', estado: 'pendiente', nota: 'Pendiente de enlazar con publicaciones/notificaciones.' },
      { codigo: 'EVID-SALIDAS', nombre: 'Salidas, graficas o tablas generadas para el informe', estado: 'pendiente', nota: 'Pendiente de carga o sincronizacion desde pt_app.' },
    ],
  },
  {
    key: 'cierre',
    numero: '07',
    nombre: 'Cierre SGC',
    carpeta: '07_cierre_sgc',
    foco: 'cierre',
    descripcion: 'Reune evidencia de cierre, casos, quejas, no conformidades, acciones correctivas y apelaciones.',
    documentos: [
      { codigo: 'EVID-CIERRE', nombre: 'Evidencia de cierre de ronda', estado: 'pendiente', nota: 'Se completa al cerrar documentalmente la ronda.' },
      { codigo: 'F-PSEA-14', nombre: 'Registro caso de queja o no conformidad, si aplica', estado: 'disponible', archivoBase: 'F-PSEA-14 Registro caso de queja o NC segun aplique', formatoOperativo: 'F-PSEA-14', nota: 'Existe en docs/EA-PP-2026-R1; admite evidencia cargada cuando aplique.' },
      { codigo: 'F-PSEA-15', nombre: 'Registro de apelacion, si aplica', estado: 'pendiente', nota: 'Aplica si existe apelacion.' },
    ],
  },
]
