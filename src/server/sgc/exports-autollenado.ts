import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'
import type { EquiposExport, EstadoAutomatico, HitosExport } from '../../../convex/sgc/autollenado'

export type { EquiposExport, EstadoAutomatico, HitosExport } from '../../../convex/sgc/autollenado'

/**
 * B2: exportaciones de documentos autollenados. Se generan como CSV compatible con Excel
 * (BOM UTF-8, separador `;`): no hay libreria XLSX en las dependencias.
 */

const csvCell = (value: unknown) => {
  const text = String(value ?? '')
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildCsv(headers: string[], rows: unknown[][]) {
  return '﻿' + [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
}

/** F-PSEA-01 (calendario global) o F-PSEA-02 (cronograma detallado), desde los hitos. */
export function buildHitosCsv(data: HitosExport, formato: 'F-PSEA-01' | 'F-PSEA-02') {
  const rows = formato === 'F-PSEA-01' ? data.calendario : data.cronograma
  return buildCsv(
    ['Ronda', 'Fase', 'Codigo', 'Hito', 'Fecha objetivo', 'Fecha real', 'Estado', 'Responsable', 'Formato relacionado', 'Notas'],
    rows.map((h) => [data.rondaCodigo, h.fase, h.codigo, h.nombre, h.fechaObjetivo, h.fechaReal, h.estado, h.responsable, h.formatoRelacionado, h.notas])
  )
}

/** F-PSEA-04: equipos e instrumentos exportados de las fichas F-PSEA-03 enviadas. */
export function buildEquiposCsv(data: EquiposExport) {
  return buildCsv(
    ['Ronda', 'Codigo participante', 'Laboratorio', 'Tipo', 'Analito / equipo', 'Fabricante / modelo', 'Numero de serie', 'Metodo EPA', 'Ultima calibracion', 'Incertidumbre declarada', 'Unidad de salida', 'Cantidad'],
    data.equipos.map((e) => [data.rondaCodigo, e.participantCode, e.laboratorio, e.tipo, e.descripcion, e.fabricanteModelo, e.numeroSerie, e.metodoEpa, e.fechaUltimaCalibracion, e.incertidumbreDeclarada, e.unidadSalida, e.cantidad])
  )
}

export async function getHitosExportSgc(rondaId: string): Promise<HitosExport | null> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getHitosExport, { rondaId: rondaId as Id<'rondas'> }, { token })
}

export async function getEquiposExportSgc(rondaId: string): Promise<EquiposExport | null> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getEquiposExport, { rondaId: rondaId as Id<'rondas'> }, { token })
}

/** `estadoAutomatico(rondaId, codigo)`: F-03/F-04 cumplido automatico; F-05 "datos listos". */
export async function estadoAutomaticoSgc(rondaId: string, codigo: string): Promise<EstadoAutomatico> {
  const token = await getConvexToken('operar SGC')
  return fetchQuery(api.sgc.index.getEstadoAutomatico, { rondaId: rondaId as Id<'rondas'>, codigo }, { token })
}

/** Exportacion lista para descargar (para una ruta/accion de C1). */
export async function exportarDocumentoAutollenadoSgc(rondaId: string, codigo: string) {
  const c = codigo.trim().toUpperCase()
  if (c === 'F-PSEA-01' || c === 'F-PSEA-02') {
    const data = await getHitosExportSgc(rondaId)
    return data ? { fileName: `${c}_${data.rondaCodigo}.csv`, contentType: 'text/csv; charset=utf-8', body: buildHitosCsv(data, c) } : null
  }
  if (c === 'F-PSEA-04') {
    const data = await getEquiposExportSgc(rondaId)
    return data ? { fileName: `${c}_${data.rondaCodigo}.csv`, contentType: 'text/csv; charset=utf-8', body: buildEquiposCsv(data) } : null
  }
  return null
}
