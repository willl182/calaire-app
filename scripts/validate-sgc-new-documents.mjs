import { access, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const docsDir = join(root, 'docs/01_bloque_general/04_formatos_maestros')

async function validateOptionalNonEmptyFile(path) {
  try {
    await access(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }
  if ((await stat(path)).size === 0) throw new Error(`${path} esta vacio.`)
}
const codes = ['F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21']
const files = {
  'F-PSEA-19': ['F-PSEA-19 Acta de inicio de ronda.md', 'F-PSEA-19 Acta de inicio de ronda.docx'],
  'F-PSEA-20': ['F-PSEA-20 Rotulado anonimo.md', 'F-PSEA-20 Rotulado anonimo.docx'],
  'F-PSEA-21': ['F-PSEA-21 Relacion de instrumentos Calaire usados.md', 'F-PSEA-21 Relacion de instrumentos Calaire usados.docx'],
}

for (const code of codes) {
  const mdPath = join(docsDir, files[code][0])
  await access(mdPath)
  if ((await stat(mdPath)).size === 0) throw new Error(`${files[code][0]} esta vacio.`)
  await validateOptionalNonEmptyFile(join(docsDir, files[code][1]))
  const md = await readFile(mdPath, 'utf8')
  if (!md.includes(`**Codigo:** ${code}`)) throw new Error(`${code} no coincide con contenido maestro.`)
}

const instructivo = await readFile(join(root, 'docs/01_bloque_general/03_instructivos/I-PSEA-02 Instructivo participante calaire-app.md'), 'utf8')
for (const heading of ['## Anexo A.', '## Anexo B.']) {
  if (!instructivo.includes(heading)) throw new Error(`I-PSEA-02 no contiene ${heading}`)
}

const procedimientosDir = join(root, 'docs/01_bloque_general/02_procedimientos')
const procedimientos = {
  'P-PSEA-03 Control de registros y evidencias del PEA.md': ['02A_inicio_ronda', 'F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21'],
  'P-PSEA-04 Planificacion de ronda EA.md': ['INICIO_RONDA', 'F-PSEA-19'],
  'P-PSEA-05 Comunicaciones del PEA.md': ['F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21'],
  'P-PSEA-06 Preparacion y control del item de ensayo gaseoso.md': ['usadoEnRonda', 'F-PSEA-21'],
  'P-PSEA-08 Flujo tecnico de datos digitales del PEA.md': ['75 %', 'factor `k`'],
  'P-PSEA-19 Confidencialidad operativa interna del PEA.md': ['F-PSEA-20', 'F-PSEA-21'],
  'P-PSEA-20 Competencia y autorizacion operativa del PEA.md': ['F-PSEA-21', 'PDF y XLSX'],
}
for (const [name, expected] of Object.entries(procedimientos)) {
  const content = await readFile(join(procedimientosDir, name), 'utf8')
  for (const value of expected) if (!content.includes(value)) throw new Error(`${name} no contiene ${value}.`)
  const docx = join(procedimientosDir, name.replace(/\.md$/, '.docx'))
  await validateOptionalNonEmptyFile(docx)
}

const mapa = await readFile(join(root, 'data/sgc/mapa_navegacion_sgc_pea.html'), 'utf8')
for (const code of codes) {
  if (!mapa.includes(`id: "${code}"`)) throw new Error(`Mapa visual no contiene nodo ${code}.`)
}

const documentos = JSON.parse(await readFile(join(root, 'dev/import/documentos_sgc.seed.json'), 'utf8'))
for (const code of codes) {
  if (documentos.filter((item) => item.codigo === code).length !== 1) throw new Error(`Seed documental invalido para ${code}.`)
}

const relaciones = JSON.parse(await readFile(join(root, 'dev/import/relaciones_mapa_sgc.seed.json'), 'utf8'))
for (const code of codes) {
  const pendientes = relaciones.filter((item) => (item.origenCodigo === code || item.destinoCodigo === code) && item.estadoResolucion === 'pendiente')
  if (pendientes.length) throw new Error(`${code} conserva relaciones pendientes.`)
}
const keys = relaciones.map((item) => `${item.origenCodigo}|${item.destinoCodigo ?? ''}|${item.tipoRelacion}|${item.rutaCritica ?? ''}`)
if (new Set(keys).size !== keys.length) throw new Error('Seed de relaciones contiene duplicados.')

console.log('Documentos SGC nuevos validos: F-PSEA-19, F-PSEA-20 y F-PSEA-21.')
