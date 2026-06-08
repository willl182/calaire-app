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
