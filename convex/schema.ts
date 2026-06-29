import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Literales reutilizados
// ---------------------------------------------------------------------------
const contaminante = v.union(
  v.literal('CO'),
  v.literal('SO2'),
  v.literal('O3'),
  v.literal('NO'),
  v.literal('NO2'),
)

export default defineSchema({
  // -------------------------------------------------------------------------
  // directorio_participantes
  // -------------------------------------------------------------------------
  directorioParticipantes: defineTable({
    nit:                  v.string(),
    correo:               v.string(),
    nombreLaboratorio:    v.optional(v.union(v.string(), v.null())),
    nombreResponsable:    v.optional(v.union(v.string(), v.null())),
    cargo:                v.optional(v.union(v.string(), v.null())),
    ciudad:               v.optional(v.union(v.string(), v.null())),
    departamento:         v.optional(v.union(v.string(), v.null())),
    telefono:             v.optional(v.union(v.string(), v.null())),
    workosUserId:         v.optional(v.union(v.string(), v.null())),
    createdAt:            v.number(),
    updatedAt:            v.number(),
  })
    .index('by_nit', ['nit'])
    .index('by_correo', ['correo'])
    .index('by_workos_user', ['workosUserId']),

  // -------------------------------------------------------------------------
  // rondas
  // -------------------------------------------------------------------------
  rondas: defineTable({
    codigo:    v.string(),
    nombre:    v.string(),
    estado:    v.union(
      v.literal('borrador'),
      v.literal('activa'),
      v.literal('documentacion_pendiente'),
      v.literal('cerrada')
    ),
    createdAt: v.number(), // Unix ms
  })
    .index('by_codigo', ['codigo']),

  // -------------------------------------------------------------------------
  // ronda_contaminantes
  // -------------------------------------------------------------------------
  rondaContaminantes: defineTable({
    rondaId:     v.id('rondas'),
    contaminante,
    niveles:     v.number(),
    replicas:    v.union(v.literal(2), v.literal(3)),
  })
    .index('by_ronda',                  ['rondaId'])
    .index('by_ronda_contaminante',     ['rondaId', 'contaminante']),

  // -------------------------------------------------------------------------
  // ronda_participantes
  // -------------------------------------------------------------------------
  rondaParticipantes: defineTable({
    rondaId:           v.id('rondas'),
    workosUserId:      v.string(),
    email:             v.string(),
    directorioParticipanteId: v.optional(v.union(v.id('directorioParticipantes'), v.null())),
    invitadoAt:        v.number(),
    participantProfile: v.union(v.literal('member'), v.literal('member_special')),
    participantCode:   v.optional(v.union(v.string(), v.null())),
    replicateCode:     v.optional(v.union(v.number(), v.null())),
    claimedAt:         v.optional(v.number()),
  })
    .index('by_ronda',              ['rondaId'])
    .index('by_ronda_user',         ['rondaId', 'workosUserId'])
    .index('by_user',               ['workosUserId']),

  // -------------------------------------------------------------------------
  // ronda_pt_items
  // -------------------------------------------------------------------------
  rondaPtItems: defineTable({
    rondaId:     v.id('rondas'),
    contaminante,
    runCode:     v.string(),
    levelLabel:  v.string(),
    sortOrder:   v.number(),
    createdAt:   v.number(),
  })
    .index('by_ronda',              ['rondaId'])
    .index('by_ronda_contaminante', ['rondaId', 'contaminante'])
    .index('by_ronda_cont_run',     ['rondaId', 'contaminante', 'runCode']),

  // -------------------------------------------------------------------------
  // ronda_pt_sample_groups
  // -------------------------------------------------------------------------
  rondaPtSampleGroups: defineTable({
    rondaId:     v.id('rondas'),
    sampleGroup: v.string(),
    sortOrder:   v.number(),
    createdAt:   v.number(),
  })
    .index('by_ronda',             ['rondaId'])
    .index('by_ronda_group',       ['rondaId', 'sampleGroup']),

  // -------------------------------------------------------------------------
  // envios_pt
  // -------------------------------------------------------------------------
  enviosPt: defineTable({
    rondaId:             v.id('rondas'),
    rondaParticipanteId: v.id('rondaParticipantes'),
    ptItemId:            v.id('rondaPtItems'),
    sampleGroupId:       v.id('rondaPtSampleGroups'),
    d1:                  v.optional(v.number()),
    d2:                  v.optional(v.number()),
    d3:                  v.optional(v.number()),
    meanValue:           v.number(),
    sdValue:             v.number(),
    ux:                  v.optional(v.number()),
    k:                   v.optional(v.number()),
    uxExp:               v.optional(v.number()),
    draftSavedAt:        v.number(),
    finalSubmittedAt:    v.optional(v.number()),
    updatedAt:           v.number(),
  })
    .index('by_ronda',              ['rondaId'])
    .index('by_participante',       ['rondaParticipanteId'])
    .index('by_pt_item',            ['ptItemId'])
    // índice compuesto para buscar antes de insertar; no es un UNIQUE constraint.
    .index('by_participante_item_group', ['rondaParticipanteId', 'ptItemId', 'sampleGroupId']),

  // -------------------------------------------------------------------------
  // envios  (resultados regulares — no PT)
  // -------------------------------------------------------------------------
  envios: defineTable({
    rondaId:       v.id('rondas'),
    workosUserId:  v.string(),
    contaminante,
    nivel:         v.number(),
    valores:       v.array(v.number()),
    promedio:      v.optional(v.number()),
    incertidumbre: v.optional(v.number()),
    submittedAt:   v.number(),
    updatedAt:     v.number(),
  })
    .index('by_ronda',          ['rondaId'])
    .index('by_user',           ['workosUserId'])
    .index('by_ronda_user',     ['rondaId', 'workosUserId'])
    // índice compuesto para buscar antes de insertar; no es un UNIQUE constraint.
    .index('by_ronda_user_cont_nivel', ['rondaId', 'workosUserId', 'contaminante', 'nivel']),

  // -------------------------------------------------------------------------
  // fichas_registro  (1:1 con rondaParticipantes)
  // -------------------------------------------------------------------------
  fichasRegistro: defineTable({
    rondaParticipanteId:  v.id('rondaParticipantes'),
    directorioParticipanteId: v.optional(v.union(v.id('directorioParticipantes'), v.null())),
    // Sección 2: Datos del participante
    nitLaboratorio:       v.optional(v.union(v.string(), v.null())),
    nombreLaboratorio:    v.optional(v.union(v.string(), v.null())),
    correoLaboratorio:    v.optional(v.union(v.string(), v.null())),
    nombreResponsable:    v.optional(v.union(v.string(), v.null())),
    cargo:                v.optional(v.union(v.string(), v.null())),
    ciudad:               v.optional(v.union(v.string(), v.null())),
    departamento:         v.optional(v.union(v.string(), v.null())),
    telefono:             v.optional(v.union(v.string(), v.null())),
    // Sección 6: Logística
    transporte:                  v.optional(v.union(v.string(), v.null())),
    diaLlegada:                  v.optional(v.union(v.string(), v.null())),
    horaLlegada:                 v.optional(v.union(v.string(), v.null())),
    estacionamiento:             v.boolean(),
    observaciones:               v.optional(v.union(v.string(), v.null())),
    justificacionCambioEquipo:   v.optional(v.union(v.string(), v.null())),
    decNoCambioEquiposDuranteRonda: v.optional(v.boolean()),
    // Sección 7: Declaraciones
    decDatosCorrectos:           v.boolean(),
    decAceptaCondiciones:        v.boolean(),
    decCompromisos:              v.boolean(),
    decProcedimientosCalaire:    v.optional(v.boolean()),
    decFirmaAutorizada:          v.boolean(),
    nombreFirma:                 v.optional(v.union(v.string(), v.null())),
    estado:               v.union(v.literal('borrador'), v.literal('enviado')),
    createdAt:            v.number(),
    updatedAt:            v.number(),
  })
    .index('by_ronda_participante', ['rondaParticipanteId'])
    .index('by_correo_laboratorio', ['correoLaboratorio']),

  // -------------------------------------------------------------------------
  // fichas_registro_acompanantes  (0-N por ficha)
  // -------------------------------------------------------------------------
  fichasAcompanantes: defineTable({
    fichaId:            v.id('fichasRegistro'),
    sortOrder:          v.number(),
    nombreCompleto:     v.string(),
    documentoIdentidad: v.string(),
    correo:             v.optional(v.union(v.string(), v.null())),
    telefono:           v.optional(v.union(v.string(), v.null())),
    rol:                v.string(),
    seguridadSocialArlStorageId: v.optional(v.union(v.id('_storage'), v.null())),
    seguridadSocialArlFileName:  v.optional(v.union(v.string(), v.null())),
    seguridadSocialArlContentType: v.optional(v.union(v.string(), v.null())),
    seguridadSocialArlSize:      v.optional(v.union(v.number(), v.null())),
  })
    .index('by_ficha', ['fichaId']),

  // -------------------------------------------------------------------------
  // fichas_registro_analizadores  (0-N por ficha)
  // -------------------------------------------------------------------------
  fichasAnalizadores: defineTable({
    fichaId:                v.id('fichasRegistro'),
    sortOrder:              v.number(),
    analito:                v.string(),
    fabricante:             v.string(),
    modelo:                 v.string(),
    numeroSerie:            v.string(),
    metodoEpa:              v.string(),
    fechaUltimaCalibracion: v.optional(v.string()), // ISO date string
    tipoVerificacion:       v.string(),
    incertidumbreDeclarada: v.string(),
    unidadSalida:           v.string(),
  })
    .index('by_ficha', ['fichaId']),

  // -------------------------------------------------------------------------
  // fichas_registro_instrumentos  (0-N por ficha)
  // -------------------------------------------------------------------------
  fichasInstrumentos: defineTable({
    fichaId:     v.id('fichasRegistro'),
    sortOrder:   v.number(),
    equipo:      v.string(),
    marcaModelo: v.string(),
    numeroSerie: v.string(),
    cantidad:    v.number(),
  })
    .index('by_ficha', ['fichaId']),

  sgcPlanRonda: defineTable({
    rondaId: v.id('rondas'),
    estado: v.union(v.literal('borrador'), v.literal('finalizado'), v.literal('requiere_revision')),
    bloques: v.record(v.string(), v.string()),
    camposEstructurados: v.record(v.string(), v.string()),
    motivoRevision: v.optional(v.union(v.string(), v.null())),
    finalizadoAt: v.optional(v.union(v.number(), v.null())),
    finalizadoBy: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId']),

  sgcRevisionDatos: defineTable({
    rondaId: v.id('rondas'),
    estado: v.union(v.literal('borrador'), v.literal('finalizado'), v.literal('requiere_revision')),
    checks: v.record(v.string(), v.object({
      cumple: v.boolean(),
      observacion: v.union(v.string(), v.null()),
      updatedAt: v.number(),
      updatedBy: v.string(),
    })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
    finalizadoAt: v.optional(v.union(v.number(), v.null())),
    finalizadoBy: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId']),

  sgcRevisionHomogeneidad: defineTable({
    rondaId: v.id('rondas'),
    estado: v.union(v.literal('borrador'), v.literal('finalizado'), v.literal('requiere_revision')),
    checks: v.record(v.string(), v.object({
      cumple: v.boolean(),
      observacion: v.union(v.string(), v.null()),
      updatedAt: v.number(),
      updatedBy: v.string(),
    })),
    metricas: v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
    conclusiones: v.optional(v.union(v.string(), v.null())),
    finalizadoAt: v.optional(v.union(v.number(), v.null())),
    finalizadoBy: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId']),

  sgcHitosRonda: defineTable({
    rondaId: v.id('rondas'),
    codigo: v.string(),
    nombre: v.string(),
    fase: v.string(),
    fechaObjetivo: v.optional(v.union(v.string(), v.null())),
    fechaReal: v.optional(v.union(v.string(), v.null())),
    estado: v.union(
      v.literal('pendiente'),
      v.literal('en_progreso'),
      v.literal('completado'),
      v.literal('vencido'),
      v.literal('cancelado'),
      v.literal('no_aplica')
    ),
    responsable: v.string(),
    visibleParticipante: v.boolean(),
    bloqueaCierre: v.boolean(),
    formatoRelacionado: v.optional(v.union(v.string(), v.null())),
    notas: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_estado', ['rondaId', 'estado']),

  sgcJustificaciones: defineTable({
    rondaId: v.id('rondas'),
    formato: v.string(),
    alcance: v.string(),
    razon: v.string(),
    estado: v.union(v.literal('vigente'), v.literal('reemplazada'), v.literal('retirada')),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_formato', ['rondaId', 'formato'])
    .index('by_rondaId_and_formato_and_estado', ['rondaId', 'formato', 'estado']),

  sgcEvidenciaSeries: defineTable({
    rondaId: v.id('rondas'),
    formato: v.string(),
    seccion: v.optional(v.union(v.string(), v.null())),
    nombre: v.string(),
    requerida: v.boolean(),
    publicaParticipante: v.boolean(),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_formato', ['rondaId', 'formato']),

  sgcEvidenciaVersiones: defineTable({
    serieId: v.id('sgcEvidenciaSeries'),
    rondaId: v.id('rondas'),
    storageId: v.id('_storage'),
    version: v.number(),
    estado: v.union(v.literal('vigente'), v.literal('reemplazada'), v.literal('retirada')),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    hash: v.optional(v.union(v.string(), v.null())),
    motivoRetiro: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_serieId', ['serieId'])
    .index('by_serieId_and_estado', ['serieId', 'estado']),

  sgcRegistroSnapshots: defineTable({
    rondaId: v.id('rondas'),
    tipoRegistro: v.string(),
    registroId: v.string(),
    version: v.number(),
    payload: v.any(),
    createdAt: v.number(),
    createdBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_tipoRegistro', ['rondaId', 'tipoRegistro']),

  sgcAuditLog: defineTable({
    rondaId: v.id('rondas'),
    actor: v.string(),
    evento: v.string(),
    detalle: v.optional(v.union(v.string(), v.null())),
    targetTipo: v.optional(v.union(v.string(), v.null())),
    targetId: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
  })
    .index('by_rondaId', ['rondaId']),

  sgcComunicaciones: defineTable({
    rondaId: v.id('rondas'),
    tipo: v.union(v.literal('email'), v.literal('llamada'), v.literal('reunion'), v.literal('otro')),
    destinatario: v.string(),
    asunto: v.string(),
    notas: v.optional(v.union(v.string(), v.null())),
    fecha: v.string(),
    responsable: v.string(),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_tipo', ['rondaId', 'tipo']),

  agentAuthClaims: defineTable({
    claimTokenHash: v.string(),
    claimViewTokenHash: v.string(),
    email: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('claimed'),
      v.literal('revoked')
    ),
    otpHash: v.optional(v.union(v.string(), v.null())),
    otpExpiresAt: v.optional(v.union(v.number(), v.null())),
    claimExpiresAt: v.number(),
    claimedAt: v.optional(v.union(v.number(), v.null())),
    apiKeyHash: v.optional(v.union(v.string(), v.null())),
    apiKeyExpiresAt: v.optional(v.union(v.number(), v.null())),
    scopes: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_claim_token_hash', ['claimTokenHash'])
    .index('by_claim_view_token_hash', ['claimViewTokenHash'])
    .index('by_api_key_hash', ['apiKeyHash'])
    .index('by_email', ['email']),

  agentApiKeys: defineTable({
    apiKeyHash: v.string(),
    claimId: v.id('agentAuthClaims'),
    email: v.string(),
    scopes: v.array(v.string()),
    expiresAt: v.number(),
    revokedAt: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
  })
    .index('by_api_key_hash', ['apiKeyHash'])
    .index('by_email', ['email'])
    .index('by_claim_id', ['claimId']),

  sgcPublicaciones: defineTable({
    rondaId: v.id('rondas'),
    titulo: v.string(),
    contenido: v.string(),
    tipo: v.union(v.literal('resultado'), v.literal('comunicado'), v.literal('cronograma'), v.literal('evidencia')),
    visibleDesde: v.number(),
    visibleHasta: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_visible', ['rondaId', 'visibleDesde']),

  sgcComentariosRonda: defineTable({
    rondaId: v.id('rondas'),
    rondaParticipanteId: v.id('rondaParticipantes'),
    autorNombre: v.string(),
    autorEmail: v.string(),
    mensaje: v.string(),
    estado: v.union(v.literal('abierto'), v.literal('respondido'), v.literal('cerrado')),
    respuestaAdmin: v.optional(v.union(v.string(), v.null())),
    respondidoAt: v.optional(v.union(v.number(), v.null())),
    respondidoBy: v.optional(v.union(v.string(), v.null())),
    cerradoAt: v.optional(v.union(v.number(), v.null())),
    cerradoBy: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_estado', ['rondaId', 'estado'])
    .index('by_rondaParticipanteId', ['rondaParticipanteId']),

  sgcNotificaciones: defineTable({
    rondaId: v.id('rondas'),
    rondaParticipanteId: v.optional(v.union(v.id('rondaParticipantes'), v.null())),
    destinatarioEmail: v.string(),
    titulo: v.string(),
    mensaje: v.string(),
    tipo: v.union(v.literal('recordatorio'), v.literal('cronograma'), v.literal('resultado'), v.literal('sgc'), v.literal('otro')),
    estado: v.union(v.literal('publicada'), v.literal('archivada')),
    leidaAt: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaParticipanteId', ['rondaParticipanteId'])
    .index('by_destinatarioEmail', ['destinatarioEmail']),

  sgcResultadosPtApp: defineTable({
    rondaId: v.id('rondas'),
    tipoResultado: v.union(v.literal('homogeneidad'), v.literal('estabilidad'), v.literal('estadistico')),
    evidenciaSerieId: v.id('sgcEvidenciaSeries'),
    evidenciaVersionId: v.optional(v.union(v.id('sgcEvidenciaVersiones'), v.null())),
    estado: v.union(v.literal('pendiente'), v.literal('cargado'), v.literal('en_revision'), v.literal('aprobado'), v.literal('rechazado')),
    observaciones: v.optional(v.union(v.string(), v.null())),
    version: v.number(),
    origen: v.literal('pt_app'),
    fechaCalculo: v.optional(v.union(v.string(), v.null())),
    aprobadoAt: v.optional(v.union(v.number(), v.null())),
    aprobadoBy: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_tipoResultado', ['rondaId', 'tipoResultado'])
    .index('by_evidenciaSerieId', ['evidenciaSerieId']),

  sgcCasos: defineTable({
    rondaId: v.id('rondas'),
    rondaParticipanteId: v.optional(v.union(v.id('rondaParticipantes'), v.null())),
    codigo: v.string(),
    tipo: v.union(v.literal('consulta'), v.literal('desviacion'), v.literal('queja'), v.literal('apelacion'), v.literal('nc_capa'), v.literal('otro')),
    severidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta'), v.literal('critica')),
    estado: v.union(v.literal('abierto'), v.literal('en_revision'), v.literal('esperando_participante'), v.literal('resuelto'), v.literal('cerrado')),
    titulo: v.string(),
    descripcion: v.string(),
    responsable: v.string(),
    formatoRelacionado: v.optional(v.union(v.string(), v.null())),
    evidenciaSerieId: v.optional(v.union(v.id('sgcEvidenciaSeries'), v.null())),
    fechaObjetivo: v.optional(v.union(v.string(), v.null())),
    resolucion: v.optional(v.union(v.string(), v.null())),
    cerradoAt: v.optional(v.union(v.number(), v.null())),
    cerradoBy: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_rondaId', ['rondaId'])
    .index('by_rondaId_and_estado', ['rondaId', 'estado'])
    .index('by_rondaParticipanteId', ['rondaParticipanteId']),

  documentosSgc: defineTable({
    codigo: v.string(),
    nombre: v.string(),
    familia: v.optional(v.union(v.literal('DG'), v.literal('P'), v.literal('I'), v.literal('F'), v.literal('OTRO'))),
    ambito: v.optional(v.union(v.string(), v.null())),
    proceso: v.string(),
    subproceso: v.optional(v.union(v.string(), v.null())),
    tipo: v.union(v.literal('formato'), v.literal('procedimiento'), v.literal('instructivo'), v.literal('plantilla'), v.literal('registro'), v.literal('otro')),
    estado: v.union(v.literal('borrador'), v.literal('vigente'), v.literal('obsoleto'), v.literal('en_revision')),
    modoDiligenciamiento: v.optional(v.union(v.literal('no_diligenciable'), v.literal('solo_archivo'), v.literal('ui_nativo'), v.literal('ui_nativo_exportable'))),
    visibilidad: v.optional(v.union(v.literal('interna'), v.literal('participantes'), v.literal('publica'))),
    modoControl: v.optional(v.union(v.literal('app_oficial'), v.literal('externo_referenciado'), v.literal('mixto'))),
    fuenteEditableUrl: v.optional(v.union(v.string(), v.null())),
    versionVigenteId: v.optional(v.union(v.id('documentoSgcVersiones'), v.null())),
    responsable: v.optional(v.union(v.string(), v.null())),
    propietario: v.string(),
    criticidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta')),
    retencion: v.optional(v.union(v.string(), v.null())),
    ubicacionFuente: v.optional(v.union(v.string(), v.null())),
    origenFuente: v.optional(v.union(v.string(), v.null())),
    externalSystem: v.optional(v.union(v.literal('pt_app'), v.null())),
    externalRef: v.optional(v.union(v.string(), v.null())),
    externalUrl: v.optional(v.union(v.string(), v.null())),
    externalLabel: v.optional(v.union(v.string(), v.null())),
    notas: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_codigo', ['codigo'])
    .index('by_familia', ['familia'])
    .index('by_ambito', ['ambito'])
    .index('by_proceso', ['proceso'])
    .index('by_estado', ['estado'])
    .index('by_modoDiligenciamiento', ['modoDiligenciamiento'])
    .index('by_proceso_and_estado', ['proceso', 'estado']),

  documentoSgcVersiones: defineTable({
    documentoId: v.id('documentosSgc'),
    version: v.number(),
    estado: v.union(v.literal('vigente'), v.literal('reemplazada'), v.literal('retirada')),
    fechaVigencia: v.optional(v.union(v.string(), v.null())),
    cambioResumen: v.string(),
    resumenCambios: v.optional(v.union(v.string(), v.null())),
    storageId: v.optional(v.union(v.id('_storage'), v.null())),
    fileName: v.optional(v.union(v.string(), v.null())),
    contentType: v.optional(v.union(v.string(), v.null())),
    size: v.optional(v.union(v.number(), v.null())),
    hash: v.optional(v.union(v.string(), v.null())),
    elaboradoPor: v.optional(v.union(v.string(), v.null())),
    revisadoPor: v.optional(v.union(v.string(), v.null())),
    aprobadoPor: v.optional(v.union(v.string(), v.null())),
    fechaRevision: v.optional(v.union(v.string(), v.null())),
    fechaAprobacion: v.optional(v.union(v.string(), v.null())),
    motivoObsolescencia: v.optional(v.union(v.string(), v.null())),
    motivoRetiro: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_documentoId', ['documentoId'])
    .index('by_documentoId_and_estado', ['documentoId', 'estado']),

  documentoSgcAnexos: defineTable({
    documentoId: v.id('documentosSgc'),
    versionId: v.optional(v.union(v.id('documentoSgcVersiones'), v.null())),
    storageId: v.id('_storage'),
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    descripcion: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
  })
    .index('by_documentoId', ['documentoId'])
    .index('by_versionId', ['versionId']),

  requisitosNormativos: defineTable({
    norma: v.string(),
    versionNorma: v.string(),
    clausula: v.string(),
    titulo: v.string(),
    descripcion: v.string(),
    ambito: v.string(),
    criticidad: v.union(v.literal('baja'), v.literal('media'), v.literal('alta'), v.literal('pendiente')),
    estado: v.union(v.literal('activo'), v.literal('placeholder'), v.literal('retirado')),
    origenFuente: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_norma', ['norma'])
    .index('by_norma_and_clausula', ['norma', 'clausula'])
    .index('by_norma_and_versionNorma_and_clausula', ['norma', 'versionNorma', 'clausula'])
    .index('by_estado', ['estado']),

  documentoRequisitos: defineTable({
    documentoId: v.id('documentosSgc'),
    requisitoId: v.id('requisitosNormativos'),
    tipoCobertura: v.union(v.literal('cubre'), v.literal('apoya'), v.literal('evidencia'), v.literal('no_aplica_justificado')),
    estadoCobertura: v.union(v.literal('cubierto'), v.literal('parcial'), v.literal('pendiente'), v.literal('no_aplica')),
    responsable: v.optional(v.union(v.string(), v.null())),
    observacion: v.optional(v.union(v.string(), v.null())),
    fechaRevision: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_documentoId', ['documentoId'])
    .index('by_requisitoId', ['requisitoId'])
    .index('by_requisitoId_and_estadoCobertura', ['requisitoId', 'estadoCobertura']),

  registrosSgc: defineTable({
    documentoId: v.id('documentosSgc'),
    versionBaseId: v.optional(v.union(v.id('documentoSgcVersiones'), v.null())),
    codigo: v.string(),
    nombre: v.string(),
    estado: v.union(v.literal('borrador'), v.literal('vigente'), v.literal('cerrado'), v.literal('anulado')),
    visibilidad: v.union(v.literal('interna'), v.literal('participantes'), v.literal('publica')),
    entidadTipo: v.union(v.literal('ronda'), v.literal('equipo'), v.literal('proveedor'), v.literal('auditoria'), v.literal('caso'), v.literal('transversal')),
    rondaId: v.optional(v.union(v.id('rondas'), v.null())),
    entidadRef: v.optional(v.union(v.string(), v.null())),
    storageId: v.optional(v.union(v.id('_storage'), v.null())),
    fileName: v.optional(v.union(v.string(), v.null())),
    contentType: v.optional(v.union(v.string(), v.null())),
    size: v.optional(v.union(v.number(), v.null())),
    externalSystem: v.optional(v.union(v.literal('pt_app'), v.null())),
    externalRef: v.optional(v.union(v.string(), v.null())),
    externalUrl: v.optional(v.union(v.string(), v.null())),
    externalLabel: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_documentoId', ['documentoId'])
    .index('by_rondaId', ['rondaId'])
    .index('by_entidadTipo', ['entidadTipo'])
    .index('by_documentoId_and_estado', ['documentoId', 'estado']),

  mapaSgcRelaciones: defineTable({
    bloque: v.string(),
    rutaCritica: v.optional(v.union(v.string(), v.null())),
    origenCodigo: v.string(),
    destinoCodigo: v.optional(v.union(v.string(), v.null())),
    documentoOrigenId: v.optional(v.union(v.id('documentosSgc'), v.null())),
    documentoDestinoId: v.optional(v.union(v.id('documentosSgc'), v.null())),
    requisitoId: v.optional(v.union(v.id('requisitosNormativos'), v.null())),
    tipoRelacion: v.union(v.literal('define'), v.literal('usa'), v.literal('genera'), v.literal('evidencia'), v.literal('referencia'), v.literal('externo')),
    ambito: v.string(),
    destinoTipo: v.union(v.literal('documento'), v.literal('requisito'), v.literal('registro'), v.literal('gestion'), v.literal('externo'), v.literal('pendiente')),
    externalSystem: v.optional(v.union(v.literal('pt_app'), v.null())),
    externalUrl: v.optional(v.union(v.string(), v.null())),
    estadoResolucion: v.union(v.literal('resuelto'), v.literal('pendiente')),
    origenFuente: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index('by_bloque', ['bloque'])
    .index('by_origenCodigo', ['origenCodigo'])
    .index('by_documentoOrigenId', ['documentoOrigenId'])
    .index('by_estadoResolucion', ['estadoResolucion']),
})
