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
// --refresh: registra una version nueva cuando el archivo del seed no coincide
// con el nombre de la version vigente (por ejemplo, al pasar de .md a .docx).
const refresh = process.argv.includes('--refresh')
const dryRun = process.argv.includes('--dry-run')

const contentTypes = new Map([
  ['.csv', 'text/csv'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.md', 'text/markdown'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.txt', 'text/plain'],
  ['.xls', 'application/vnd.ms-excel'],
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
  const uploadUrl = runConvex('sgc/index:generateUploadUrl', {})
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
  const maestro = runConvex('sgc/index:listSgcMaestro', {
    ambito: null,
    familia: null,
    estado: null,
    modoDiligenciamiento: null,
    texto: null,
  })
  const byCode = new Map(maestro.documentos.map((doc) => [doc.codigo, doc]))
  const vigenteByDoc = new Map(
    maestro.versiones.filter((item) => item.vigente).map((item) => [item.documentoId, item.vigente]),
  )
  const nextVersionByDoc = new Map()
  for (const item of maestro.versiones) {
    if (!item.vigente) continue
    const current = nextVersionByDoc.get(item.documentoId) ?? 1
    nextVersionByDoc.set(item.documentoId, Math.max(current, (item.vigente.version ?? 0) + 1))
  }

  const summary = { uploaded: 0, replaced: 0, skippedWithVersion: 0, skippedSameFile: 0, skippedNoFile: 0, skippedUnsupported: 0 }
  for (const item of seed) {
    const doc = byCode.get(item.codigo)
    if (!doc) continue
    const vigente = vigenteByDoc.get(doc._id)
    if (vigente && !refresh) {
      summary.skippedWithVersion += 1
      continue
    }
    const filePath = localPathForSource(item.ubicacionFuente)
    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
      summary.skippedNoFile += 1
      continue
    }
    if (vigente && vigente.fileName === basename(filePath)) {
      summary.skippedSameFile += 1
      continue
    }
    const contentType = contentTypeFor(filePath)
    if (contentType === 'application/octet-stream') {
      summary.skippedUnsupported += 1
      continue
    }
    if (dryRun) {
      console.log(`[dry-run] ${item.codigo}: ${vigente ? `${vigente.fileName} -> ` : ''}${basename(filePath)}`)
      if (vigente) summary.replaced += 1
      else summary.uploaded += 1
      continue
    }
    const { uploaded, bytes } = await uploadToStorage(filePath, contentType)
    const hash = createHash('sha256').update(bytes).digest('hex')
    runConvex('sgc/index:registrarVersionOficial', {
      documentoId: doc._id,
      version: nextVersionByDoc.get(doc._id) ?? 1,
      estado: 'vigente',
      storageId: uploaded.storageId,
      fileName: basename(filePath),
      contentType,
      size: bytes.byteLength,
      hash,
      resumenCambios: vigente
        ? `Version oficial actualizada al formato editable (${basename(filePath)}) desde docs/01_bloque_general.`
        : 'Version vigente precargada desde docs/01_bloque_general.',
      elaboradoPor: null,
      revisadoPor: null,
      aprobadoPor: null,
      fechaRevision: null,
      fechaAprobacion: null,
      fechaVigencia: null,
    })
    if (vigente) summary.replaced += 1
    else summary.uploaded += 1
    console.log(`${vigente ? 'Replaced' : 'Uploaded'} ${item.codigo}: ${basename(filePath)}`)
  }
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
