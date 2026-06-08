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
    rol:                v.string(),
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
})
