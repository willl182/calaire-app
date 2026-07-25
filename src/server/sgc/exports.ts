import JSZip from 'jszip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const xml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')


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

type FotoInstrumentoExport = {
  bytes: Uint8Array
  contentType: 'image/jpeg' | 'image/png'
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
  fotoGeneral?: FotoInstrumentoExport | null
  fotoPlaca?: FotoInstrumentoExport | null
}

export async function crearInstrumentosPdf(data: { rondaCodigo: string; rondaNombre: string; revision: number; tecnicoNombre?: string | null; coordinadorNombre?: string | null; items: InstrumentoExport[] }) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pageSize: [number, number] = [842, 595]
  const topY = 550
  const bottomY = 35
  const photoBlockHeight = 185
  let page = pdf.addPage(pageSize)
  let y = topY
  const maxWidth = pageSize[0] - 70
  const addPage = () => {
    page = pdf.addPage(pageSize)
    y = topY
  }
  const ensureSpace = (height: number) => {
    if (y - height < bottomY) addPage()
  }
  // El PDF es evidencia: el texto se dibuja sin normalizar ni recortar. Si la fuente no puede
  // representar un caracter se falla explicitamente en lugar de exportar contenido alterado.
  const medir = (activeFont: typeof font, text: string, size: number) => {
    try {
      return activeFont.widthOfTextAtSize(text, size)
    } catch {
      throw new Error(`El texto "${text}" contiene caracteres que la fuente del PDF no puede representar.`)
    }
  }
  const partirPalabra = (activeFont: typeof font, word: string, size: number) => {
    const partes: string[] = []
    let actual = ''
    for (const char of word) {
      if (actual && medir(activeFont, actual + char, size) > maxWidth) {
        partes.push(actual)
        actual = char
      } else {
        actual += char
      }
    }
    if (actual) partes.push(actual)
    return partes
  }
  const envolver = (activeFont: typeof font, text: string, size: number) => {
    const lineas: string[] = []
    let actual = ''
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const candidato = actual ? `${actual} ${word}` : word
      if (medir(activeFont, candidato, size) <= maxWidth) {
        actual = candidato
        continue
      }
      if (actual) lineas.push(actual)
      const partes = partirPalabra(activeFont, word, size)
      lineas.push(...partes.slice(0, -1))
      actual = partes[partes.length - 1] ?? ''
    }
    if (actual) lineas.push(actual)
    return lineas.length > 0 ? lineas : ['']
  }
  const line = (text: string, size = 9, strong = false) => {
    const activeFont = strong ? bold : font
    const lineHeight = size + 7
    for (const fragmento of envolver(activeFont, text, size)) {
      ensureSpace(lineHeight)
      page.drawText(fragmento, { x: 35, y, size, font: activeFont, color: rgb(0.08, 0.12, 0.16) })
      y -= lineHeight
    }
  }
  const drawPhoto = async (foto: FotoInstrumentoExport, x: number, photoTopY: number, label: string) => {
    const image = foto.contentType === 'image/jpeg'
      ? await pdf.embedJpg(foto.bytes)
      : await pdf.embedPng(foto.bytes)
    const scale = Math.min(360 / image.width, 150 / image.height)
    page.drawText(label, { x, y: photoTopY - 10, size: 8, font: bold, color: rgb(0.08, 0.12, 0.16) })
    page.drawImage(image, { x, y: photoTopY - 170, width: image.width * scale, height: image.height * scale })
  }

  line('F-PSEA-21 RELACION DE INSTRUMENTOS CALAIRE USADOS', 16, true)
  line(`Ronda: ${data.rondaCodigo} - ${data.rondaNombre}`, 10, true)
  line(`Revision: ${data.revision} | Tecnico: ${data.tecnicoNombre ?? ''} | Coordinador: ${data.coordinadorNombre ?? ''}`)
  y -= 6
  for (let index = 0; index < data.items.length; index += 1) {
    const item = data.items[index]
    if (!item.fotoGeneral || !item.fotoPlaca) throw new Error(`Instrumento ${item.codigoInterno || index + 1} sin las dos fotos requeridas.`)
    const identificacion = `${index + 1}. ${item.tipo} | ${item.codigoInterno} | ${item.marca} | ${item.modelo} | ${item.serialIdentificacion}`
    const observaciones = `Observaciones: ${item.observaciones || 'Sin observaciones'}`
    const textHeight = envolver(bold, identificacion, 9).length * 16 + envolver(font, observaciones, 8).length * 15
    const itemHeight = textHeight + photoBlockHeight
    if (itemHeight <= topY - bottomY && y - itemHeight < bottomY) addPage()

    line(identificacion, 9, true)
    line(observaciones, 8)
    ensureSpace(photoBlockHeight)
    const photoTopY = y
    await drawPhoto(item.fotoGeneral, 35, photoTopY, `Foto general: ${item.fotoGeneralFileName ?? ''}`)
    await drawPhoto(item.fotoPlaca, 430, photoTopY, `Foto placa/serial: ${item.fotoPlacaFileName ?? ''}`)
    y = photoTopY - photoBlockHeight
  }
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
