import { describe, expect, test, vi } from 'vitest'

vi.mock('@/server/convex', () => ({ getConvexToken: vi.fn() }))
vi.mock('convex/nextjs', () => ({ fetchQuery: vi.fn() }))
vi.mock('@/convex/_generated/api', () => ({ api: {} }))

import { calcularEstadoAutomatico, construirEquiposExport, construirHitosExport } from '../../../convex/sgc/autollenado'
import { buildEquiposCsv, buildHitosCsv } from './exports-autollenado'

const ronda = { codigo: 'R-1', nombre: 'Ronda 1' }
const datos = { participantes: 2, participantesReclamados: 2, fichasEnviadasReclamados: 2, equiposExportados: 3, contaminantes: 1, hitoInicioConFecha: true }

describe('autollenado B2', () => {
  test('hitos: calendario solo con fecha, sin cancelados; CSV con BOM y escape', () => {
    const data = construirHitosExport(ronda, [
      { codigo: 'B', nombre: 'Cierre; final', fase: 'cierre', fechaObjetivo: '2026-12-10', estado: 'pendiente', responsable: 'coord' },
      { codigo: 'A', nombre: 'Inicio', fase: 'ejecucion', fechaObjetivo: '2026-12-01', estado: 'pendiente', responsable: 'coord' },
      { codigo: 'C', nombre: 'Sin fecha', fase: 'ejecucion', estado: 'pendiente', responsable: 'coord' },
      { codigo: 'X', nombre: 'Cancelado', fase: 'ejecucion', fechaObjetivo: '2026-11-01', estado: 'cancelado', responsable: 'coord' },
    ])
    expect(data.calendario.map((h) => h.codigo)).toEqual(['A', 'B'])
    expect(data.cronograma.map((h) => h.codigo)).toEqual(['B', 'A', 'C'])
    const csv = buildHitosCsv(data, 'F-PSEA-01')
    expect(csv.startsWith('﻿Ronda;Fase')).toBe(true)
    expect(csv).toContain('"Cierre; final"')
  })

  test('equipos: solo fichas enviadas', () => {
    const analizador = { sortOrder: 0, analito: 'CO', fabricante: 'Teledyne', modelo: 'T300', numeroSerie: 'S1', metodoEpa: 'RFCA', incertidumbreDeclarada: '2%', unidadSalida: 'ppm' }
    const data = construirEquiposExport(ronda, [
      { participantCode: 'P2', workosUserId: 'u2', ficha: { estado: 'enviado', nombreLaboratorio: 'Lab 2' }, analizadores: [analizador], instrumentos: [{ sortOrder: 0, equipo: 'Calibrador', marcaModelo: 'X', numeroSerie: 'C1', cantidad: 2 }] },
      { participantCode: 'P1', workosUserId: 'u1', ficha: { estado: 'borrador' }, analizadores: [analizador], instrumentos: [] },
    ])
    expect(data.fichasEnviadas).toBe(1)
    expect(data.equipos.map((e) => `${e.tipo}:${e.descripcion}`)).toEqual(['analizador:CO', 'instrumento:Calibrador'])
    expect(buildEquiposCsv(data).split('\r\n')[1]).toContain('Teledyne T300')
  })

  test('estadoAutomatico por codigo', () => {
    expect(calcularEstadoAutomatico('F-PSEA-03', datos).cumplido).toBe(true)
    expect(calcularEstadoAutomatico('F-PSEA-03', { ...datos, fichasEnviadasReclamados: 1 }).cumplido).toBe(false)
    expect(calcularEstadoAutomatico('F-PSEA-03', { ...datos, participantesReclamados: 0, fichasEnviadasReclamados: 0 }).cumplido).toBe(false)
    expect(calcularEstadoAutomatico('F-PSEA-04', { ...datos, equiposExportados: 0 }).cumplido).toBe(false)
    expect(calcularEstadoAutomatico('f-psea-04', datos).cumplido).toBe(true)
    const f05 = calcularEstadoAutomatico('F-PSEA-05', datos)
    expect(f05).toMatchObject({ cumplido: true, requiereRevision: true })
    expect(calcularEstadoAutomatico('F-PSEA-05', { ...datos, hitoInicioConFecha: false }).motivo).toContain('INICIO_RONDA')
    expect(calcularEstadoAutomatico('F-PSEA-01', datos)).toMatchObject({ soportado: false, cumplido: false })
  })
})
