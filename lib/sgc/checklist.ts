import { SGC_FORMATOS_FASE_1, type SgcFase, type SgcFormatoCodigo } from './catalog'

export type SgcItemEstado = 'completo' | 'pendiente' | 'no_aplica' | 'advertencia'

export type SgcCoverageInput = {
  planFinalizado: boolean
  revisionFinalizada: boolean
  snapshotsPlan: number
  snapshotsRevision: number
  participantesEsperados: number
  participantesReclamados: number
  fichasEnviadas: number
  codigosDuplicados: string[]
  codigosProvisionales: string[]
  enviosFinales: number
  enviosEsperados: number
  evidenciasVigentes: Partial<Record<SgcFormatoCodigo, boolean>>
  justificacionesVigentes: Partial<Record<SgcFormatoCodigo, { razon: string; updatedAt: number; updatedBy: string }>>
  fPsea11NoAplica: boolean
  fPsea11Razon: string | null
  hitosBloqueantesPendientes: number
}

export type SgcChecklistItem = {
  codigo: SgcFormatoCodigo
  nombre: string
  fase: SgcFase
  modo: string
  critico: boolean
  estado: SgcItemEstado
  responsable: string
  ultimaActualizacion: string | null
  vinculo: string | null
  observaciones: string
  bloqueante: boolean
}

export function detectarCodigosProvisionales(codigos: Array<string | null | undefined>) {
  return codigos
    .filter((codigo): codigo is string => Boolean(codigo))
    .filter((codigo) => /^(pendiente|tmp|temp|provisional|sin-?codigo)/i.test(codigo.trim()))
}

export function derivarBloqueantes(items: SgcChecklistItem[]) {
  return items
    .filter((item) => item.bloqueante)
    .map((item) => `${item.codigo}: ${item.observaciones}`)
}

export function agruparChecklistPorFase(items: SgcChecklistItem[]) {
  return items.reduce<Record<SgcFase, SgcChecklistItem[]>>(
    (acc, item) => {
      acc[item.fase].push(item)
      return acc
    },
    { planeacion: [], convocatoria: [], ejecucion: [], evaluacion: [], cierre: [] }
  )
}

export function calcularChecklistSgc(input: SgcCoverageInput): SgcChecklistItem[] {
  return SGC_FORMATOS_FASE_1.map((formato) => {
    let estado: SgcItemEstado = 'pendiente'
    let observaciones = formato.descripcion
    let vinculo: string | null = null
    let responsable = 'Coordinacion SGC'
    let ultimaActualizacion: string | null = null
    const justificacion = input.justificacionesVigentes[formato.codigo]

    if (formato.codigo === 'F-PPSEA-03' || formato.codigo === 'F-PSEA-06') {
      const completo = input.planFinalizado && input.snapshotsPlan > 0
      estado = completo ? 'completo' : 'pendiente'
      vinculo = 'Plan de ronda'
      observaciones = completo
        ? `Plan finalizado con ${input.snapshotsPlan} snapshot(s).`
        : 'Plan pendiente de finalizar o sin snapshot.'
    } else if (formato.codigo === 'F-PSEA-05') {
      const completo =
        input.participantesEsperados > 0 &&
        input.participantesReclamados >= input.participantesEsperados
      estado = completo || justificacion ? 'completo' : 'pendiente'
      vinculo = `${input.participantesReclamados}/${input.participantesEsperados} participantes`
      observaciones = justificacion
        ? `Justificado: ${justificacion.razon}`
        : completo
        ? 'Todos los cupos esperados estan reclamados.'
        : 'Hay cupos sin reclamar o sin justificacion.'
      if (justificacion) {
        responsable = justificacion.updatedBy
        ultimaActualizacion = new Date(justificacion.updatedAt).toISOString()
      }
    } else if (formato.codigo === 'F-PSEA-05A') {
      const completo =
        input.participantesEsperados > 0 &&
        input.fichasEnviadas >= input.participantesEsperados
      estado = completo || justificacion ? 'completo' : 'pendiente'
      vinculo = `${input.fichasEnviadas}/${input.participantesEsperados} fichas`
      observaciones = justificacion
        ? `Justificado: ${justificacion.razon}`
        : completo ? 'Fichas enviadas.' : 'Hay fichas pendientes de envio.'
      if (justificacion) {
        responsable = justificacion.updatedBy
        ultimaActualizacion = new Date(justificacion.updatedAt).toISOString()
      }
    } else if (formato.codigo === 'F-PSEA-07') {
      const completo =
        input.participantesEsperados > 0 &&
        input.codigosDuplicados.length === 0 &&
        input.codigosProvisionales.length === 0
      estado = completo ? 'completo' : 'pendiente'
      vinculo = 'Codigos de participante'
      observaciones = completo
        ? 'Codigos unicos y no provisionales.'
        : 'Hay codigos faltantes, duplicados o provisionales.'
    } else if (formato.codigo === 'F-PSEA-12') {
      const completo = input.enviosEsperados === 0 || input.enviosFinales >= input.enviosEsperados
      estado = completo || justificacion ? 'completo' : 'pendiente'
      vinculo = `${input.enviosFinales}/${input.enviosEsperados} envios finales`
      observaciones = justificacion
        ? `Justificado: ${justificacion.razon}`
        : completo ? 'Envios finales cubiertos.' : 'Hay envios finales pendientes.'
      if (justificacion) {
        responsable = justificacion.updatedBy
        ultimaActualizacion = new Date(justificacion.updatedAt).toISOString()
      }
    } else if (formato.codigo === 'F-PSEA-13') {
      const completo = input.revisionFinalizada && input.snapshotsRevision > 0
      estado = completo ? 'completo' : 'pendiente'
      vinculo = 'Revision de datos'
      observaciones = completo
        ? `Revision finalizada con ${input.snapshotsRevision} snapshot(s).`
        : 'Revision pendiente o sin snapshot.'
    } else if (formato.codigo === 'F-PSEA-11') {
      const completo = input.fPsea11NoAplica && Boolean(input.fPsea11Razon?.trim())
      estado = completo ? 'no_aplica' : 'pendiente'
      vinculo = 'No aplica'
      observaciones = completo ? input.fPsea11Razon! : 'Debe documentarse la razon de no aplica.'
    } else {
      const vigente = Boolean(input.evidenciasVigentes[formato.codigo])
      estado = vigente ? 'completo' : 'pendiente'
      vinculo = vigente ? 'Evidencia vigente' : null
      observaciones = vigente ? 'Evidencia vigente cargada.' : 'Falta evidencia vigente.'
    }

    if (formato.codigo === 'F-PSEA-12' && input.hitosBloqueantesPendientes > 0) {
      estado = estado === 'completo' ? 'advertencia' : estado
      observaciones = `${observaciones} Hay ${input.hitosBloqueantesPendientes} hito(s) bloqueante(s) pendiente(s).`
    }

    return {
      codigo: formato.codigo,
      nombre: formato.nombre,
      fase: formato.fase,
      modo: formato.modo,
      critico: formato.critico,
      estado,
      responsable,
      ultimaActualizacion,
      vinculo,
      observaciones,
      bloqueante: formato.critico && estado === 'pendiente',
    }
  })
}
