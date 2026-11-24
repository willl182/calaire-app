// Logica pura del expediente documental SGC de ronda (sin ctx de Convex) para poder testearla
// directamente. La politica de cada documento (orden, responsable, obligatoriedad, critico,
// bloqueaCierre) se lee SIEMPRE del catalogo, no de la copia guardada en `sgcDriveRecursos`:
// asi las rondas ya inicializadas toman los cambios del catalogo sin reinicializar.

import {
  getSgcRondaDocumento,
  SGC_DOCUMENTOS_ORDEN_LOGICO,
  SGC_RONDA_ETAPAS,
  type SgcObligatoriedad,
  type SgcResponsable,
  type SgcRondaEtapa,
} from './catalog'

export type SgcPoliticaDocumento = {
  enCatalogo: boolean
  orden: number | null
  ordenLogico: number | null
  responsable: SgcResponsable | null
  obligatoriedad: SgcObligatoriedad | null
  etapaKey: string | null
}

type RecursoBase = {
  codigo: string
  tipo?: string
  critico?: boolean | null
  bloqueaCierre?: boolean | null
}

/**
 * Sobrepone la politica vigente del catalogo al recurso guardado. Las carpetas y los recursos
 * fuera del catalogo conservan sus valores guardados y quedan con `enCatalogo: false`.
 */
export function enriquecerRecursoConCatalogo<T extends RecursoBase>(recurso: T): T & { politica: SgcPoliticaDocumento } {
  const documento = recurso.tipo === 'carpeta' ? null : getSgcRondaDocumento(recurso.codigo)
  if (!documento) {
    return {
      ...recurso,
      politica: { enCatalogo: false, orden: null, ordenLogico: null, responsable: null, obligatoriedad: null, etapaKey: null },
    }
  }
  return {
    ...recurso,
    critico: documento.critico,
    bloqueaCierre: documento.bloqueaCierre,
    politica: {
      enCatalogo: true,
      orden: documento.orden,
      ordenLogico: documento.ordenLogico,
      responsable: documento.responsable,
      obligatoriedad: documento.obligatoriedad,
      etapaKey: documento.etapaKey,
    },
  }
}

// ---------------------------------------------------------------------------
// Sincronizacion expediente guardado <-> catalogo (B1.3)
// ---------------------------------------------------------------------------

export const DRIVE_ROOT_CODIGO = 'DRIVE_ROOT'

export type RecursoGuardado = {
  _id: string
  codigo: string
  tipo: string
  parentId?: string | null
}

export type SincronizacionExpediente = {
  inicializado: boolean
  sincronizado: boolean
  carpetasFaltantes: Array<{ key: string; numero: string; carpeta: string; nombre: string }>
  documentosFaltantes: Array<{ codigo: string; nombre: string; etapaKey: string; carpeta: string }>
  documentosEnOtraCarpeta: Array<{ codigo: string; etapaKey: string; carpeta: string }>
  recursosFueraDeCatalogo: Array<{ codigo: string; tipo: string }>
}

function norm(codigo: string) {
  return codigo.trim().toUpperCase()
}

/**
 * Compara el expediente guardado de la ronda con el catalogo vigente: carpetas y documentos
 * faltantes (p. ej. `02A_inicio_ronda`, F-PSEA-19/20/21 en expedientes antiguos), documentos
 * colgados de otra carpeta y recursos que ya no estan en el catalogo (solo informativo).
 */
export function compararExpedienteConCatalogo(
  recursos: readonly RecursoGuardado[],
  etapas: readonly SgcRondaEtapa[] = SGC_RONDA_ETAPAS
): SincronizacionExpediente {
  const porCodigo = new Map(recursos.map((recurso) => [norm(recurso.codigo), recurso]))
  const root = porCodigo.get(DRIVE_ROOT_CODIGO)
  const carpetasFaltantes: SincronizacionExpediente['carpetasFaltantes'] = []
  const documentosFaltantes: SincronizacionExpediente['documentosFaltantes'] = []
  const documentosEnOtraCarpeta: SincronizacionExpediente['documentosEnOtraCarpeta'] = []
  const codigosCatalogo = new Set<string>([DRIVE_ROOT_CODIGO])

  for (const etapa of etapas) {
    const carpetaCodigo = norm(etapa.key)
    codigosCatalogo.add(carpetaCodigo)
    const carpeta = porCodigo.get(carpetaCodigo)
    const carpetaValida = carpeta && carpeta.tipo === 'carpeta' ? carpeta : null
    if (!carpetaValida) {
      carpetasFaltantes.push({ key: etapa.key, numero: etapa.numero, carpeta: etapa.carpeta, nombre: etapa.nombre })
    }
    for (const documento of etapa.documentos) {
      const codigo = norm(documento.codigo)
      codigosCatalogo.add(codigo)
      const recurso = porCodigo.get(codigo)
      if (!recurso) {
        documentosFaltantes.push({ codigo, nombre: documento.nombre, etapaKey: etapa.key, carpeta: etapa.carpeta })
      } else if (carpetaValida && (recurso.parentId ?? null) !== carpetaValida._id) {
        documentosEnOtraCarpeta.push({ codigo, etapaKey: etapa.key, carpeta: etapa.carpeta })
      }
    }
  }

  const recursosFueraDeCatalogo = recursos
    .filter((recurso) => !codigosCatalogo.has(norm(recurso.codigo)))
    .map((recurso) => ({ codigo: recurso.codigo, tipo: recurso.tipo }))

  const inicializado = Boolean(root)
  return {
    inicializado,
    sincronizado:
      inicializado &&
      carpetasFaltantes.length === 0 &&
      documentosFaltantes.length === 0 &&
      documentosEnOtraCarpeta.length === 0,
    carpetasFaltantes,
    documentosFaltantes,
    documentosEnOtraCarpeta,
    recursosFueraDeCatalogo,
  }
}

// ---------------------------------------------------------------------------
// Avance y checklist del expediente (B1.4)
// ---------------------------------------------------------------------------

export type SgcNivelPendiente = 'bloqueante' | 'critico' | 'advertencia'
export type SgcAvanceEstado = 'completo' | 'en_proceso' | 'pendiente' | 'no_aplica'

export type RecursoAvanceInput = {
  codigo: string
  tipo?: string
  estado: string
  notas?: string | null
  aplica?: boolean | null
  aprobadoAt?: number | null
  aprobadoPor?: string | null
}

export type EstadosNativosExpediente = {
  planFinalizado: boolean
  revisionFinalizada: boolean
  participantesEsperados: number
  participantesReclamados: number
  fichasEnviadas: number
  actaInicioEstado: 'borrador' | 'docx_generado' | 'pdf_firmado_cargado' | 'publicado' | null
  relacionInstrumentosEstado: 'borrador' | 'pendiente_validacion' | 'validado' | 'requiere_ajustes' | null
  informePublicado: boolean
  /** Bloqueantes del checklist de cierre ajenos a EVID-CIERRE (se arma automaticamente). */
  bloqueantesCierre: number
  /** Gancho para `estadoAutomatico(rondaId, codigo)` de B2: true = cumplido automatico. */
  automaticos?: Partial<Record<string, boolean>>
}

export type SgcAvanceItem = {
  codigo: string
  nombre: string
  etapaKey: string
  etapaNumero: string
  carpeta: string
  orden: number
  ordenLogico: number
  responsable: SgcResponsable
  obligatoriedad: SgcObligatoriedad
  /** Un "si aplica" solo aplica si se marco explicitamente; los obligatorios siempre aplican. */
  aplica: boolean
  cuentaEnAvance: boolean
  estado: SgcAvanceEstado
  /** Sub-estado legible, p. ej. F-PSEA-19 "diligenciada_por_subir" / "subida". */
  subestado: string | null
  nivel: SgcNivelPendiente | null
  motivo: string
  destino: string
}

export type SgcAvanceExpediente = {
  completos: number
  total: number
  porcentaje: number
  items: SgcAvanceItem[]
  bloqueantes: SgcAvanceItem[]
  criticos: SgcAvanceItem[]
  advertencias: SgcAvanceItem[]
}

const DESTINOS_ESPECIFICOS: Record<string, string> = {
  'F-PSEA-03': '/participantes',
  'F-PSEA-19': '/sgc/f-psea-19',
  'F-PSEA-21': '/sgc/f-psea-21',
}

export function destinoDocumento(rondaId: string, codigo: string) {
  const base = `/dashboard/rondas/${rondaId}`
  const especifico = DESTINOS_ESPECIFICOS[norm(codigo)]
  return especifico ? `${base}${especifico}` : `${base}/sgc#doc-${norm(codigo)}`
}

type Evaluacion = { estado: Exclude<SgcAvanceEstado, 'no_aplica'>; subestado?: string | null; motivo: string }

function evaluarDocumento(
  codigo: string,
  responsable: SgcResponsable,
  recurso: RecursoAvanceInput | undefined,
  nativos: EstadosNativosExpediente
): Evaluacion {
  const diligenciado = recurso?.estado === 'diligenciado'
  const automatico = nativos.automaticos?.[codigo]
  const todosParticipantes = (n: number) => nativos.participantesEsperados > 0 && n >= nativos.participantesEsperados

  switch (codigo) {
    case 'F-PSEA-06':
      return nativos.planFinalizado
        ? { estado: 'completo', motivo: 'Plan de ronda finalizado.' }
        : { estado: 'pendiente', motivo: 'Finalice el plan de ronda (F-PSEA-06).' }
    case 'F-PSEA-03':
      return todosParticipantes(nativos.fichasEnviadas) || automatico
        ? { estado: 'completo', motivo: 'Fichas de todos los participantes enviadas.' }
        : { estado: 'pendiente', motivo: `Fichas enviadas ${nativos.fichasEnviadas}/${nativos.participantesEsperados}.` }
    case 'F-PSEA-04': {
      // Exportado automaticamente de F-PSEA-03: se cumple cuando F-PSEA-03 esta completo.
      const f03 = todosParticipantes(nativos.fichasEnviadas)
      return (automatico ?? f03)
        ? { estado: 'completo', motivo: 'Exportado automaticamente desde F-PSEA-03.' }
        : { estado: 'pendiente', motivo: 'Se genera al completar F-PSEA-03.' }
    }
    case 'F-PSEA-05': {
      // Automatico con datos nativos + marca "revisado" del coordinador (decision 5).
      if (!recurso?.aprobadoAt) return { estado: 'pendiente', motivo: 'Falta la marca "revisado" del coordinador.' }
      return { estado: 'completo', motivo: `Revisado por ${recurso.aprobadoPor ?? 'coordinador'}.` }
    }
    case 'EVID-COM':
      // Sin acuse separado: se da por hecho al ingresar el participante a la app (decision 8).
      return todosParticipantes(nativos.participantesReclamados) || automatico
        ? { estado: 'completo', motivo: 'Todos los participantes ingresaron a la app.' }
        : { estado: 'pendiente', motivo: `Participantes que ingresaron ${nativos.participantesReclamados}/${nativos.participantesEsperados}.` }
    case 'F-PSEA-19': {
      // Solo "subida" (PDF firmado) cuenta; publicar no cuenta (decision 10).
      const acta = nativos.actaInicioEstado
      if (acta === 'pdf_firmado_cargado' || acta === 'publicado') {
        return { estado: 'completo', subestado: 'subida', motivo: 'Acta firmada cargada.' }
      }
      if (acta === 'borrador' || acta === 'docx_generado') {
        return { estado: 'en_proceso', subestado: 'diligenciada_por_subir', motivo: 'Acta diligenciada: falta subir el PDF firmado.' }
      }
      return { estado: 'pendiente', subestado: null, motivo: 'Inicialice el acta de inicio de ronda.' }
    }
    case 'F-PSEA-21':
      if (nativos.relacionInstrumentosEstado === 'validado') return { estado: 'completo', motivo: 'Relacion de instrumentos validada.' }
      return nativos.relacionInstrumentosEstado
        ? { estado: 'en_proceso', subestado: nativos.relacionInstrumentosEstado, motivo: 'Relacion de instrumentos sin validar.' }
        : { estado: 'pendiente', motivo: 'Registre la relacion de instrumentos Calaire.' }
    case 'F-PSEA-13':
      return nativos.revisionFinalizada
        ? { estado: 'completo', motivo: 'Revision final del informe finalizada.' }
        : { estado: 'pendiente', motivo: 'Finalice la revision del informe (F-PSEA-13).' }
    case 'EVID-ENVIO':
      // Publicar el informe en el portal cuenta como evidencia (decision 15).
      return nativos.informePublicado || automatico
        ? { estado: 'completo', motivo: 'Informe publicado en el portal.' }
        : { estado: 'pendiente', motivo: 'Se cumple al publicar el informe en el portal.' }
    case 'EVID-CIERRE': {
      // Checklist automatico + aprobacion explicita del coordinador (decision 17).
      if (nativos.bloqueantesCierre > 0) {
        return { estado: 'pendiente', motivo: `El checklist de cierre tiene ${nativos.bloqueantesCierre} bloqueante(s).` }
      }
      if (!recurso?.aprobadoAt) return { estado: 'pendiente', motivo: 'Checklist completo: falta la aprobacion del coordinador.' }
      return { estado: 'completo', motivo: `Cierre aprobado por ${recurso.aprobadoPor ?? 'coordinador'}.` }
    }
    default:
      if (responsable === 'automatico' && automatico) return { estado: 'completo', motivo: 'Cumplido automaticamente.' }
      if (diligenciado) return { estado: 'completo', motivo: 'Documento diligenciado.' }
      if (!recurso) return { estado: 'pendiente', motivo: 'Recurso faltante: actualice el expediente.' }
      return recurso.estado === 'creado'
        ? { estado: 'en_proceso', motivo: 'Documento creado, pendiente de diligenciar.' }
        : { estado: 'pendiente', motivo: 'Documento pendiente.' }
  }
}

/**
 * Avance del expediente. Excluye los "si aplica" no activados (pueden quedar en no aplica sin
 * justificacion). Clasifica cada pendiente: bloqueante (obligatorio que bloquea cierre), critico
 * (critico que no bloquea, o "si aplica" activado) y advertencia (resto).
 */
export function calcularAvanceExpediente(
  rondaId: string,
  recursos: readonly RecursoAvanceInput[],
  nativos: EstadosNativosExpediente
): SgcAvanceExpediente {
  const porCodigo = new Map(
    recursos.filter((recurso) => recurso.tipo !== 'carpeta').map((recurso) => [norm(recurso.codigo), recurso])
  )
  const items: SgcAvanceItem[] = SGC_DOCUMENTOS_ORDEN_LOGICO.map((documento) => {
    const codigo = norm(documento.codigo)
    const recurso = porCodigo.get(codigo)
    const siAplica = documento.obligatoriedad === 'si_aplica'
    const aplica = !siAplica || recurso?.aplica === true
    const base = {
      codigo,
      nombre: documento.nombre,
      etapaKey: documento.etapaKey,
      etapaNumero: documento.etapaNumero,
      carpeta: documento.carpeta,
      orden: documento.orden,
      ordenLogico: documento.ordenLogico,
      responsable: documento.responsable,
      obligatoriedad: documento.obligatoriedad,
      aplica,
      destino: destinoDocumento(rondaId, codigo),
    }
    if (!aplica || recurso?.estado === 'no_aplica') {
      return {
        ...base,
        aplica: false,
        cuentaEnAvance: false,
        estado: 'no_aplica' as const,
        subestado: null,
        nivel: null,
        motivo: siAplica ? 'Si aplica: no activado.' : `No aplica: ${recurso?.notas?.trim() || 'sin justificacion'}`,
      }
    }
    const evaluacion = evaluarDocumento(codigo, documento.responsable, recurso, nativos)
    let nivel: SgcNivelPendiente | null = null
    if (evaluacion.estado !== 'completo') {
      nivel = documento.bloqueaCierre ? 'bloqueante' : documento.critico || siAplica ? 'critico' : 'advertencia'
    }
    return {
      ...base,
      cuentaEnAvance: true,
      estado: evaluacion.estado,
      subestado: evaluacion.subestado ?? null,
      nivel,
      motivo: evaluacion.motivo,
    }
  })

  const cuentan = items.filter((item) => item.cuentaEnAvance)
  const completos = cuentan.filter((item) => item.estado === 'completo').length
  return {
    completos,
    total: cuentan.length,
    porcentaje: cuentan.length === 0 ? 0 : Math.round((completos / cuentan.length) * 100),
    items,
    bloqueantes: items.filter((item) => item.nivel === 'bloqueante'),
    criticos: items.filter((item) => item.nivel === 'critico'),
    advertencias: items.filter((item) => item.nivel === 'advertencia'),
  }
}
