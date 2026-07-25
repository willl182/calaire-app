import { describe, expect, test } from 'vitest'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { crearActaInicioDocx, crearInstrumentosPdf, crearInstrumentosXlsx } from './exports'

const png = {
  bytes: Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==', 'base64')),
  contentType: 'image/png' as const,
}

const items = [{
  tipo: 'analizador',
  codigoInterno: 'AN-01',
  marca: 'Marca',
  modelo: 'Modelo',
  serialIdentificacion: 'SER-1',
  observaciones: 'Operativo',
  fotoGeneralFileName: 'general.png',
  fotoPlacaFileName: 'placa.png',
  fotoGeneral: png,
  fotoPlaca: png,
}]

describe('exportaciones SGC', () => {
  test('genera DOCX F-PSEA-19 legible como OpenXML', async () => {
    const bytes = await crearActaInicioDocx({ rondaCodigo: 'R-01', rondaNombre: 'Ronda', fecha: '2026-07-25', lugar: 'Calaire', textoInicio: 'Inicio formal.', firmantes: [{ tipo: 'organizador', nombre: 'Responsable', entidad: 'Calaire' }] })
    const zip = await JSZip.loadAsync(bytes)
    const document = await zip.file('word/document.xml')?.async('string')
    expect(document).toContain('F-PSEA-19')
    expect(document).toContain('Responsable')
  })

  test('genera PDF F-PSEA-21 válido con ambas fotos', async () => {
    const bytes = await crearInstrumentosPdf({ rondaCodigo: 'R-01', rondaNombre: 'Ronda', revision: 2, tecnicoNombre: 'Tecnico', coordinadorNombre: 'Coordinador', items })
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBeGreaterThan(0)
    expect(bytes.byteLength).toBeGreaterThan(1_000)
  })

  test('rechaza PDF F-PSEA-21 sin ambas fotos', async () => {
    await expect(crearInstrumentosPdf({
      rondaCodigo: 'R-01',
      rondaNombre: 'Ronda',
      revision: 2,
      items: [{ ...items[0], fotoPlaca: null }],
    })).rejects.toThrow(/sin las dos fotos requeridas/)
  })

  test('genera XLSX F-PSEA-21 con datos', async () => {
    const bytes = await crearInstrumentosXlsx(items)
    const zip = await JSZip.loadAsync(bytes)
    const sheet = await zip.file('xl/worksheets/sheet1.xml')?.async('string')
    expect(sheet).toContain('AN-01')
    expect(sheet).toContain('SER-1')
  })
})
