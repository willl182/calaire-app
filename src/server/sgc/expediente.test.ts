import { describe, expect, it } from 'vitest'
import {
  calcularAvanceExpediente,
  calcularEstadoDriveRonda,
  calcularPasosPrevios,
  calcularSiguientePaso,
  compararExpedienteConCatalogo,
  enriquecerRecursoConCatalogo,
  type EstadosNativosExpediente,
  type PasosPreviosInput,
} from '../../../convex/_lib/sgc/expediente'
import { SGC_DOCUMENTOS_ORDEN_LOGICO, SGC_RONDA_ETAPAS } from './catalog'

describe('enriquecerRecursoConCatalogo', () => {
  it('toma orden, responsable y obligatoriedad del catalogo aunque la copia guardada sea antigua', () => {
    const guardado = { codigo: 'f-psea-14', tipo: 'documento', critico: true, bloqueaCierre: true }
    const recurso = enriquecerRecursoConCatalogo(guardado)
    expect(recurso.bloqueaCierre).toBe(false)
    expect(recurso.politica).toMatchObject({
      enCatalogo: true,
      obligatoriedad: 'si_aplica',
      responsable: 'coordinador',
      etapaKey: 'cierre',
    })
  })

  it('carpetas y recursos fuera del catalogo conservan lo guardado', () => {
    const carpeta = enriquecerRecursoConCatalogo({ codigo: 'PLANIFICACION', tipo: 'carpeta', critico: false })
    expect(carpeta.politica.enCatalogo).toBe(false)
    const extra = enriquecerRecursoConCatalogo({ codigo: 'OTRO-1', tipo: 'documento', bloqueaCierre: true })
    expect(extra.bloqueaCierre).toBe(true)
    expect(extra.politica.enCatalogo).toBe(false)
  })
})

function expedienteCompleto() {
  return [
    { _id: 'root', codigo: 'DRIVE_ROOT', tipo: 'carpeta', parentId: null },
    ...SGC_RONDA_ETAPAS.map((e) => ({ _id: e.key, codigo: e.key.toUpperCase(), tipo: 'carpeta', parentId: 'root' })),
    ...SGC_RONDA_ETAPAS.flatMap((e) =>
      e.documentos.map((d) => ({ _id: d.codigo, codigo: d.codigo, tipo: 'documento', parentId: e.key }))
    ),
  ]
}

describe('compararExpedienteConCatalogo', () => {
  it('sin raiz no esta inicializado', () => {
    const r = compararExpedienteConCatalogo([])
    expect(r.inicializado).toBe(false)
    expect(r.carpetasFaltantes).toHaveLength(SGC_RONDA_ETAPAS.length)
  })

  it('detecta documento en otra carpeta y recursos fuera del catalogo', () => {
    const recursos = [...expedienteCompleto(), { _id: 'x', codigo: 'VIEJO-1', tipo: 'documento', parentId: 'root' }]
    expect(compararExpedienteConCatalogo(recursos).sincronizado).toBe(true)
    const movido = recursos.map((r) => (r.codigo === 'F-PSEA-21' ? { ...r, parentId: 'inicio_ronda' } : r))
    const res = compararExpedienteConCatalogo(movido)
    expect(res.sincronizado).toBe(false)
    expect(res.documentosEnOtraCarpeta).toEqual([
      { codigo: 'F-PSEA-21', etapaKey: 'preparacion_item', carpeta: '03_preparacion_item' },
    ])
    expect(res.recursosFueraDeCatalogo).toEqual([{ codigo: 'VIEJO-1', tipo: 'documento' }])
  })
})

describe('calcularEstadoDriveRonda', () => {
  it('expediente inicializado no implica carpeta creada en Drive', () => {
    const recursos = expedienteCompleto()
    const sinDrive = calcularEstadoDriveRonda(recursos)
    expect(sinDrive).toMatchObject({ expedienteInicializado: true, carpetaRondaCreada: false, carpetaRondaUrl: null })
    expect(sinDrive.carpetas).toEqual({ total: SGC_RONDA_ETAPAS.length, creadasEnDrive: 0 })

    const conDrive = calcularEstadoDriveRonda(
      recursos.map((r) =>
        r.codigo === 'DRIVE_ROOT' ? { ...r, driveFolderId: 'abc', webUrl: 'https://drive.google.com/open?id=abc' } : r
      )
    )
    expect(conDrive).toMatchObject({ carpetaRondaCreada: true, carpetaRondaId: 'abc', carpetaRondaUrl: 'https://drive.google.com/open?id=abc' })
    expect(calcularEstadoDriveRonda([]).expedienteInicializado).toBe(false)
  })
})

const PREVIOS_OK: PasosPreviosInput = {
  contaminantes: 2,
  descuadresPT: [],
  participantes: 3,
  participantesSinCodigoReplica: 0,
  participantesSinCodigo: 0,
  hitoInicioConFecha: true,
  expedienteInicializado: true,
  invitacionesEnviadas: 3,
}

describe('siguiente paso', () => {
  it('pasos previos en orden y con estado calculado', () => {
    const pasos = calcularPasosPrevios('r1', { ...PREVIOS_OK, descuadresPT: [{ contaminante: 'CO', niveles: 3, nivelesPT: 2 }] })
    expect(pasos.map((p) => p.key)).toEqual(['crear_ronda', 'configuracion_pt', 'codigos_replica', 'hitos', 'expediente', 'invitaciones'])
    const pt = pasos.find((p) => p.key === 'configuracion_pt')!
    expect(pt).toMatchObject({ completo: false, destino: '/dashboard/rondas/r1/configuracion-pt' })
    expect(pt.motivo).toContain('CO 2/3')
  })

  it('primero los previos, luego el primer obligatorio en orden logico', () => {
    const avance = calcularAvanceExpediente('r1', recursosPendientes(), NATIVOS_VACIOS)
    const conPrevio = calcularSiguientePaso(calcularPasosPrevios('r1', { ...PREVIOS_OK, participantesSinCodigoReplica: 1 }), avance)
    expect(conPrevio).toMatchObject({ tipo: 'previo', paso: { key: 'codigos_replica' } })

    const previos = calcularPasosPrevios('r1', PREVIOS_OK)
    expect(calcularSiguientePaso(previos, avance)).toMatchObject({ tipo: 'documento', documento: { codigo: 'F-PSEA-06' } })
  })

  it('F-PSEA-21 y F-PSEA-07 se piden antes que F-PSEA-19', () => {
    const completos: Record<string, { estado: string; aprobadoAt?: number }> = Object.fromEntries(
      SGC_DOCUMENTOS_ORDEN_LOGICO.filter((d) => d.ordenLogico < 130).map((d) => [d.codigo, { estado: 'diligenciado', aprobadoAt: 1 }])
    )
    const nativos = { ...NATIVOS_VACIOS, planFinalizado: true, fichasEnviadas: 2, participantesReclamados: 2 }
    const previos = calcularPasosPrevios('r1', PREVIOS_OK)
    const paso = (extra: typeof completos, n = nativos) =>
      calcularSiguientePaso(previos, calcularAvanceExpediente('r1', recursosPendientes(extra), n))
    expect(paso(completos)).toMatchObject({ documento: { codigo: 'F-PSEA-21' } })
    const conF21 = { ...nativos, relacionInstrumentosEstado: 'validado' as const }
    expect(paso({ ...completos, 'F-PSEA-20': { estado: 'diligenciado' } }, conF21)).toMatchObject({ documento: { codigo: 'F-PSEA-07' } })
    expect(
      paso({ ...completos, 'F-PSEA-20': { estado: 'diligenciado' }, 'F-PSEA-07': { estado: 'diligenciado' } }, conF21)
    ).toMatchObject({ documento: { codigo: 'F-PSEA-19' } })
  })
})

const NATIVOS_VACIOS: EstadosNativosExpediente = {
  planFinalizado: false,
  revisionFinalizada: false,
  participantesEsperados: 2,
  participantesReclamados: 0,
  fichasEnviadas: 0,
  actaInicioEstado: null,
  relacionInstrumentosEstado: null,
  informePublicado: false,
  bloqueantesCierre: 3,
}

function recursosPendientes(extra: Record<string, Partial<{ estado: string; aplica: boolean; aprobadoAt: number }>> = {}) {
  return SGC_RONDA_ETAPAS.flatMap((e) =>
    e.documentos.map((d) => ({ codigo: d.codigo, tipo: 'documento', estado: 'pendiente', ...extra[d.codigo] }))
  )
}

describe('calcularAvanceExpediente', () => {
  it('excluye los "si aplica" no activados y los cuenta al activarlos', () => {
    const base = calcularAvanceExpediente('r1', recursosPendientes(), NATIVOS_VACIOS)
    const item = (codigo: string, avance = base) => avance.items.find((i) => i.codigo === codigo)!
    expect(item('F-PSEA-17')).toMatchObject({ estado: 'no_aplica', cuentaEnAvance: false, nivel: null })
    expect(item('F-PSEA-11A').cuentaEnAvance).toBe(false)
    const obligatorios = SGC_RONDA_ETAPAS.flatMap((e) => e.documentos).filter((d) => d.obligatoriedad === 'obligatorio').length
    expect(base.total).toBe(obligatorios)

    const activado = calcularAvanceExpediente('r1', recursosPendientes({ 'F-PSEA-17': { aplica: true } }), NATIVOS_VACIOS)
    expect(activado.total).toBe(obligatorios + 1)
    expect(item('F-PSEA-17', activado)).toMatchObject({ estado: 'pendiente', nivel: 'critico' })
  })

  it('clasifica bloqueantes, criticos y advertencias con motivo, responsable y destino', () => {
    const avance = calcularAvanceExpediente('r1', recursosPendientes(), NATIVOS_VACIOS)
    const f06 = avance.bloqueantes.find((i) => i.codigo === 'F-PSEA-06')
    expect(f06).toMatchObject({ responsable: 'coordinador', destino: '/dashboard/rondas/r1/sgc#doc-F-PSEA-06' })
    expect(f06?.motivo).toMatch(/plan/i)
    expect(avance.criticos.map((i) => i.codigo)).toEqual(expect.arrayContaining(['F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21']))
    expect(avance.items.find((i) => i.codigo === 'F-PSEA-19')?.destino).toBe('/dashboard/rondas/r1/sgc/f-psea-19')
    expect(avance.bloqueantes.some((i) => i.codigo === 'F-PSEA-19')).toBe(false)
  })

  it('F-PSEA-19 solo cuenta completo con el PDF firmado subido; publicar no es requisito', () => {
    const item = (acta: EstadosNativosExpediente['actaInicioEstado']) =>
      calcularAvanceExpediente('r1', recursosPendientes(), { ...NATIVOS_VACIOS, actaInicioEstado: acta }).items.find((i) => i.codigo === 'F-PSEA-19')!
    expect(item('docx_generado')).toMatchObject({ estado: 'en_proceso', subestado: 'diligenciada_por_subir' })
    expect(item('pdf_firmado_cargado')).toMatchObject({ estado: 'completo', subestado: 'subida' })
    expect(item('publicado').estado).toBe('completo')
  })

  it('F-PSEA-05 y EVID-CIERRE requieren la marca del coordinador; EVID-COM se cumple con el ingreso', () => {
    const nativos = { ...NATIVOS_VACIOS, participantesReclamados: 2, bloqueantesCierre: 0 }
    const sinMarca = calcularAvanceExpediente('r1', recursosPendientes(), nativos)
    const item = (avance: typeof sinMarca, codigo: string) => avance.items.find((i) => i.codigo === codigo)!
    expect(item(sinMarca, 'F-PSEA-05').estado).toBe('pendiente')
    expect(item(sinMarca, 'EVID-CIERRE').motivo).toMatch(/aprobacion/)
    expect(item(sinMarca, 'EVID-COM').estado).toBe('completo')
    const conMarca = calcularAvanceExpediente(
      'r1',
      recursosPendientes({ 'F-PSEA-05': { aprobadoAt: 1 }, 'EVID-CIERRE': { aprobadoAt: 1 } }),
      nativos
    )
    expect(item(conMarca, 'F-PSEA-05').estado).toBe('completo')
    expect(item(conMarca, 'EVID-CIERRE').estado).toBe('completo')
  })

  it('EVID-ENVIO se cumple al publicar el informe; un automatico de B2 se respeta', () => {
    const avance = calcularAvanceExpediente('r1', recursosPendientes(), {
      ...NATIVOS_VACIOS,
      informePublicado: true,
      automaticos: { 'F-PSEA-09': true },
    })
    expect(avance.items.find((i) => i.codigo === 'EVID-ENVIO')?.estado).toBe('completo')
    expect(avance.items.find((i) => i.codigo === 'F-PSEA-09')?.estado).toBe('completo')
  })
})
