import { describe, expect, it } from 'vitest'
import {
  calcularAvanceExpediente,
  compararExpedienteConCatalogo,
  enriquecerRecursoConCatalogo,
  type EstadosNativosExpediente,
} from '../../../convex/_lib/sgc/expediente'
import { SGC_RONDA_ETAPAS } from './catalog'

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
