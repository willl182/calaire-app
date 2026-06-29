import { createHash } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const identity = JSON.stringify({
  tokenIdentifier: 'seed|sgc',
  email: 'seed@calaire.local',
  roles: ['admin_sgc'],
})
const deploymentArgs = process.argv.includes('--prod') ? ['--prod'] : []

const contentTypes = new Map([
  ['.csv', 'text/csv'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.md', 'text/markdown'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.txt', 'text/plain'],
  ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
])

function runConvex(functionName, args) {
  const result = spawnSync('pnpm', ['exec', 'convex', 'run', ...deploymentArgs, functionName, JSON.stringify(args), '--identity', identity], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.stdout) process.stderr.write(result.stdout)
    process.exit(result.status ?? 1)
  }
  return JSON.parse(result.stdout)
}

function localPathForSource(source) {
  let clean = source?.trim()
  if (!clean || /^https?:\/\//.test(clean)) return null
  const maestroMatch = clean.match(/Maestro:\s*([^;]+)/i)
  if (maestroMatch) clean = maestroMatch[1].trim()
  if (clean === 'calaire-app' || clean.startsWith('calaire-app /')) return null
  return join(root, 'docs', clean)
}

function contentTypeFor(path) {
  const extension = path.slice(path.lastIndexOf('.')).toLowerCase()
  return contentTypes.get(extension) ?? 'application/octet-stream'
}

async function uploadToStorage(filePath, contentType) {
  const uploadUrl = runConvex('sgc:generateUploadUrl', {})
  const bytes = await readFile(filePath)
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: bytes,
  })
  if (!response.ok) throw new Error(`No fue posible subir ${filePath}: ${response.status} ${response.statusText}`)
  return { uploaded: await response.json(), bytes }
}

async function main() {
  const seed = JSON.parse(await readFile(join(root, 'dev/import/documentos_sgc.seed.json'), 'utf8'))
  const maestro = runConvex('sgc:listSgcMaestro', {
    ambito: null,
    familia: null,
    estado: null,
    modoDiligenciamiento: null,
    texto: null,
  })
  const byCode = new Map(maestro.documentos.map((doc) => [doc.codigo, doc]))
  const vigenteByDoc = new Set(maestro.versiones.filter((item) => item.vigente).map((item) => item.documentoId))
  const nextVersionByDoc = new Map()
  for (const version of maestro.versiones) {
    const current = nextVersionByDoc.get(version.documentoId) ?? 1
    nextVersionByDoc.set(version.documentoId, Math.max(current, version.version + 1))
  }

  const summary = { uploaded: 0, skippedWithVersion: 0, skippedNoFile: 0, skippedUnsupported: 0 }
  for (const item of seed) {
    const doc = byCode.get(item.codigo)
    if (!doc) continue
    if (vigenteByDoc.has(doc._id)) {
      summary.skippedWithVersion += 1
      continue
    }
    const filePath = localPathForSource(item.ubicacionFuente)
    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
      summary.skippedNoFile += 1
      continue
    }
    const contentType = contentTypeFor(filePath)
    if (contentType === 'application/octet-stream') {
      summary.skippedUnsupported += 1
      continue
    }
    const { uploaded, bytes } = await uploadToStorage(filePath, contentType)
    const hash = createHash('sha256').update(bytes).digest('hex')
    runConvex('sgc:registrarVersionOficial', {
      documentoId: doc._id,
      version: nextVersionByDoc.get(doc._id) ?? 1,
      estado: 'vigente',
      storageId: uploaded.storageId,
      fileName: basename(filePath),
      contentType,
      size: bytes.byteLength,
      hash,
      resumenCambios: 'Version vigente precargada desde docs/01_bloque_general.',
      elaboradoPor: null,
      revisadoPor: null,
      aprobadoPor: null,
      fechaRevision: null,
      fechaAprobacion: null,
      fechaVigencia: null,
    })
    summary.uploaded += 1
    console.log(`Uploaded ${item.codigo}: ${basename(filePath)}`)
  }
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
