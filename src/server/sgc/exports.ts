import JSZip from 'jszip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const xml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const ascii = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '')

export type ActaInicioExport = {
  rondaCodigo: string
  rondaNombre: string
  fecha: string
  lugar: string
  textoInicio: string
  firmantes: Array<{ tipo: string; nombre: string; entidad: string }>
}

export async function crearActaInicioDocx(data: ActaInicioExport) {
  const rows = data.firmantes.map((item, index) => `
    <w:tr>
      <w:tc><w:p><w:r><w:t>${index + 1}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${xml(item.nombre)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${xml(item.entidad)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${xml(item.tipo)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>Firma: ____________________</w:t></w:r></w:p></w:tc>
    </w:tr>`).join('')
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>F-PSEA-19 ACTA DE INICIO DE RONDA</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Ronda: </w:t></w:r><w:r><w:t>${xml(data.rondaCodigo)} - ${xml(data.rondaNombre)}</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Fecha: </w:t></w:r><w:r><w:t>${xml(data.fecha)}</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Lugar: </w:t></w:r><w:r><w:t>${xml(data.lugar)}</w:t></w:r></w:p>
<w:p><w:r><w:t>${xml(data.textoInicio)}</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Firmantes</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
<w:tr><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>No.</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Nombre</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Entidad</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Rol</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Firma</w:t></w:r></w:p></w:tc></w:tr>${rows}</w:tbl>
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>`
  const zip = new JSZip()
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
  zip.folder('_rels')?.file('.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  zip.folder('word')?.file('document.xml', documentXml)
  return zip.generateAsync({ type: 'uint8array' })
}

export type InstrumentoExport = {
  tipo: string
  codigoInterno: string
  marca: string
  modelo: string
  serialIdentificacion: string
  observaciones: string
  fotoGeneralFileName?: string | null
  fotoPlacaFileName?: string | null
}

export async function crearInstrumentosPdf(data: { rondaCodigo: string; rondaNombre: string; revision: number; tecnicoNombre?: string | null; coordinadorNombre?: string | null; items: InstrumentoExport[] }) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  let page = pdf.addPage([842, 595])
  let y = 550
  const line = (text: string, size = 9, strong = false) => {
    if (y < 45) { page = pdf.addPage([842, 595]); y = 550 }
    page.drawText(ascii(text).slice(0, 145), { x: 35, y, size, font: strong ? bold : font, color: rgb(0.08, 0.12, 0.16) })
    y -= size + 7
  }
  line('F-PSEA-21 RELACION DE INSTRUMENTOS CALAIRE USADOS', 16, true)
  line(`Ronda: ${data.rondaCodigo} - ${data.rondaNombre}`, 10, true)
  line(`Revision: ${data.revision} | Tecnico: ${data.tecnicoNombre ?? ''} | Coordinador: ${data.coordinadorNombre ?? ''}`)
  y -= 6
  data.items.forEach((item, index) => {
    line(`${index + 1}. ${item.tipo} | ${item.codigoInterno} | ${item.marca} | ${item.modelo} | ${item.serialIdentificacion}`, 9, true)
    line(`Observaciones: ${item.observaciones || 'Sin observaciones'}`, 8)
    line(`Fotos: general=${item.fotoGeneralFileName ?? 'pendiente'}; placa/serial=${item.fotoPlacaFileName ?? 'pendiente'}`, 8)
    y -= 4
  })
  return pdf.save()
}

function columnName(index: number) {
  let value = index + 1
  let result = ''
  while (value > 0) { value -= 1; result = String.fromCharCode(65 + (value % 26)) + result; value = Math.floor(value / 26) }
  return result
}

export async function crearInstrumentosXlsx(items: InstrumentoExport[]) {
  const rows = [
    ['Tipo', 'Codigo interno', 'Marca', 'Modelo', 'Serial/identificacion', 'Observaciones', 'Foto general', 'Foto placa/serial'],
    ...items.map((item) => [item.tipo, item.codigoInterno, item.marca, item.modelo, item.serialIdentificacion, item.observaciones, item.fotoGeneralFileName ?? '', item.fotoPlacaFileName ?? '']),
  ]
  const sheetRows = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, columnIndex) => `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${xml(cell)}</t></is></c>`).join('')}</row>`).join('')
  const zip = new JSZip()
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
  zip.folder('_rels')?.file('.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
  zip.folder('xl')?.file('workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Instrumentos" sheetId="1" r:id="rId1"/></sheets></workbook>')
  zip.folder('xl')?.folder('_rels')?.file('workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
  zip.folder('xl')?.folder('worksheets')?.file('sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`)
  return zip.generateAsync({ type: 'uint8array' })
}
