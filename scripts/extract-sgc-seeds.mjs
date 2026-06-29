import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function normalizeCode(value) {
  return value.replace(/`/g, '').trim().toUpperCase()
}

function familiaFromCode(code) {
  if (code.startsWith('DG-')) return 'DG'
  if (code.startsWith('P-')) return 'P'
  if (code.startsWith('I-')) return 'I'
  if (code.startsWith('F-')) return 'F'
  return 'OTRO'
}

function procesoFromFamily(familia) {
  if (familia === 'DG') return 'Gobierno maestro'
  if (familia === 'P') return 'Procedimientos'
  if (familia === 'I') return 'Instructivos'
  if (familia === 'F') return 'Formatos y registros'
  return 'SGC'
}

function estadoFromInventory(raw) {
  const state = raw.toLowerCase()
  if (state.includes('activo') || state.includes('vigente') || state.includes('implementado') || state.includes('elaborado')) return 'vigente'
  if (state.includes('actualizacion') || state.includes('revisar') || state.includes('parcial')) return 'en_revision'
  if (state.includes('reservado') || state.includes('placeholder') || state.includes('pendiente')) return 'borrador'
  return 'borrador'
}

function modoFromCode(code) {
  if (code.startsWith('F-PSEA-03') || code.startsWith('F-PSEA-05A') || code.startsWith('F-PSEA-08') || code.startsWith('F-PSEA-13')) {
    return 'ui_nativo_exportable'
  }
  if (code.startsWith('F-')) return 'solo_archivo'
  return 'no_diligenciable'
}

function modoControlFromRow(code, location) {
  if (code === 'DG-PSEA-03' || location.toLowerCase().includes('pt_app')) return 'externo_referenciado'
  if (location.toLowerCase().includes('calaire-app')) return 'mixto'
  return 'app_oficial'
}

async function resolveInventoryLocation(code, location) {
  const clean = location.replace(/`/g, '').trim()
  if (!clean) return null
  const absolute = join(root, 'docs', clean)
  try {
    const info = await stat(absolute)
    if (!info.isDirectory()) return clean
    const entries = await readdir(absolute)
    const match = entries
      .filter((entry) => entry.toUpperCase().startsWith(code))
      .sort((a, b) => {
        const priority = (name) => name.endsWith('.md') ? 0 : name.endsWith('.docx') ? 1 : 2
        return priority(a) - priority(b) || a.localeCompare(b)
      })[0]
    return match ? `${clean.replace(/\/+$/, '')}/${match}` : clean
  } catch {
    return clean
  }
}

function parseMarkdownTables(markdown) {
  const rows = []
  let currentSection = 'SGC'
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)/)
    if (heading) currentSection = heading[1].trim()
    if (!line.startsWith('|') || line.includes('|---')) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells[0] === 'Codigo' || cells.length < 4) continue
    rows.push({ section: currentSection, cells })
  }
  return rows
}

async function extractDocuments() {
  const source = 'docs/01_bloque_general/05_matrices_inventarios/Inventario Documental del SGC.md'
  const markdown = await readFile(join(root, source), 'utf8')
  const documents = []
  for (const { cells } of parseMarkdownTables(markdown)
    .filter(({ cells }) => /^[` ]*(DG|P|I|F)-/.test(cells[0]))) {
      const codigo = normalizeCode(cells[0])
      const familia = familiaFromCode(codigo)
      const location = cells[3].replace(/`/g, '').trim()
      const isPtApp = codigo === 'DG-PSEA-03' || location.toLowerCase().includes('pt_app')
      documents.push({
        codigo,
        nombre: cells[1].replace(/`/g, '').trim(),
        familia,
        ambito: 'PEA / ISO 17043',
        proceso: procesoFromFamily(familia),
        estado: estadoFromInventory(cells[2]),
        modoDiligenciamiento: modoFromCode(codigo),
        modoControl: modoControlFromRow(codigo, location),
        ubicacionFuente: await resolveInventoryLocation(codigo, location),
        origenFuente: source,
        externalSystem: isPtApp ? 'pt_app' : null,
        externalRef: isPtApp ? 'pt_app' : null,
        externalUrl: isPtApp ? 'https://w421.shinyapps.io/pt_app/' : null,
        externalLabel: isPtApp ? 'Herramienta externa pt_app' : null,
      })
  }
  return documents
}

function splitRequirementBullets(markdown, norma, versionNorma, source) {
  const requisitos = []
  let section = 'General'
  let sectionTitle = 'General'
  let counter = 0
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^(#{2,4})\s+(.+)/)
    if (heading) {
      sectionTitle = heading[2].trim()
      const numbered = sectionTitle.match(/^([0-9]+(?:\.[0-9]+)*)\s+(.+)/)
      section = numbered ? numbered[1] : sectionTitle
      counter = 0
      continue
    }
    const bullet = line.match(/^\s*-\s+(.+)/)
    if (!bullet) continue
    counter += 1
    const descripcion = bullet[1].trim()
    requisitos.push({
      norma,
      versionNorma,
      clausula: `${section}.${counter}`,
      titulo: sectionTitle.replace(/^[0-9.]+\s*/, ''),
      descripcion,
      ambito: norma.includes('17043') ? 'PEA / ISO 17043' : 'Estadistica / ISO 13528',
      criticidad: descripcion.toLowerCase().includes('debe') ? 'media' : 'pendiente',
      estado: 'activo',
      origenFuente: source,
    })
  }
  return requisitos
}

async function extractRequirements() {
  const sources = [
    { path: 'dev/req_17043.md', norma: 'ISO/IEC 17043', versionNorma: '2023' },
    { path: 'dev/req_13528.md', norma: 'ISO 13528', versionNorma: '2022' },
  ]
  const requisitos = []
  for (const source of sources) {
    const markdown = await readFile(join(root, source.path), 'utf8')
    requisitos.push(...splitRequirementBullets(markdown, source.norma, source.versionNorma, source.path))
  }
  requisitos.push({
    norma: 'ISO/IEC 17025',
    versionNorma: '2017',
    clausula: 'placeholder',
    titulo: 'Requisitos pendientes de fuente operativa',
    descripcion: 'Placeholder controlado hasta cargar una fuente equivalente a req_17043.md y req_13528.md.',
    ambito: 'Laboratorio / ISO 17025',
    criticidad: 'pendiente',
    estado: 'placeholder',
    origenFuente: 'dev/plan-protv2.md',
  })
  return requisitos
}

function blockForCode(code) {
  if (code.startsWith('DG-') || code.startsWith('P-PSEA-02') || code.startsWith('P-PSEA-03') || code.startsWith('P-PSEA-08')) return 'Gobierno maestro'
  if (code.includes('APP') || code.startsWith('I-') || code === 'DG-PSEA-02' || code === 'DG-PSEA-03') return 'Aplicativos e instructivos'
  if (code.startsWith('F-')) return 'Formatos y registros'
  return 'Rutas criticas'
}

async function extractMapRelations(documentos) {
  const source = 'public/sgc/mapa_navegacion_sgc_pea.html'
  const html = await readFile(join(root, source), 'utf8')
  const knownCodes = documentos.map((doc) => doc.codigo)
  const found = Array.from(new Set(html.match(/\b(?:DG|P|I|F)-PSEA-\d+[A-Z]?\b/g) ?? [])).map(normalizeCode)
  const allCodes = Array.from(new Set([...knownCodes, ...found]))
  const relations = []
  for (const code of allCodes) {
    const isPtApp = code === 'DG-PSEA-03' || code === 'I-PSEA-04' || code === 'I-PSEA-05'
    relations.push({
      bloque: blockForCode(code),
      rutaCritica: null,
      origenCodigo: code,
      destinoCodigo: null,
      tipoRelacion: isPtApp ? 'externo' : 'referencia',
      ambito: 'PEA / ISO 17043',
      destinoTipo: isPtApp ? 'externo' : 'documento',
      externalSystem: isPtApp ? 'pt_app' : null,
      externalUrl: isPtApp ? 'https://w421.shinyapps.io/pt_app/' : null,
      estadoResolucion: knownCodes.includes(code) ? 'resuelto' : 'pendiente',
      origenFuente: source,
    })
  }
  const routeDefs = [
    ['Flujo oficial de datos', ['P-PSEA-08', 'DG-PSEA-02', 'I-PSEA-02', 'F-PSEA-08', 'F-PSEA-09', 'DG-PSEA-03', 'F-PSEA-10', 'F-PSEA-12', 'F-PSEA-13']],
    ['Planificacion de ronda', ['P-PSEA-04', 'P-PSEA-05', 'DG-PSEA-02', 'F-PSEA-01', 'F-PSEA-02', 'F-PSEA-03', 'F-PSEA-05', 'F-PSEA-18']],
    ['Estructura de ronda', ['P-PSEA-03', 'F-PSEA-03', 'F-PSEA-07', 'F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-12', 'F-PSEA-13', 'F-PSEA-14']],
    ['Cierre y gestion SGC', ['P-PSEA-14', 'P-PSEA-15', 'P-PSEA-20', 'P-PSEA-21', 'F-PSEA-14', 'F-PSEA-15', 'F-PSEA-16', 'F-PSEA-17']],
  ]
  for (const [route, codes] of routeDefs) {
    for (let index = 0; index < codes.length - 1; index += 1) {
      relations.push({
        bloque: 'Rutas criticas',
        rutaCritica: route,
        origenCodigo: codes[index],
        destinoCodigo: codes[index + 1],
        tipoRelacion: codes[index + 1] === 'DG-PSEA-03' ? 'externo' : 'usa',
        ambito: 'PEA / ISO 17043',
        destinoTipo: codes[index + 1] === 'DG-PSEA-03' ? 'externo' : 'documento',
        externalSystem: codes[index + 1] === 'DG-PSEA-03' ? 'pt_app' : null,
        externalUrl: codes[index + 1] === 'DG-PSEA-03' ? 'https://w421.shinyapps.io/pt_app/' : null,
        estadoResolucion: knownCodes.includes(codes[index]) && knownCodes.includes(codes[index + 1]) ? 'resuelto' : 'pendiente',
        origenFuente: source,
      })
    }
  }
  return relations
}

async function main() {
  const documentos = await extractDocuments()
  const requisitos = await extractRequirements()
  const mapa = await extractMapRelations(documentos)
  const outputDir = join(root, 'dev', 'import')
  await mkdir(outputDir, { recursive: true })
  const files = [
    ['documentos_sgc.seed.json', documentos],
    ['requisitos_normativos.seed.json', requisitos],
    ['relaciones_mapa_sgc.seed.json', mapa],
    ['documento_requisitos.seed.json', []],
    ['sgc_seed_bundle.json', { documentos, requisitos, mapa }],
  ]
  for (const [name, payload] of files) {
    await writeFile(join(outputDir, name), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  }
  console.log(`SGC seeds generated: ${documentos.length} documentos, ${requisitos.length} requisitos, ${mapa.length} relaciones.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
