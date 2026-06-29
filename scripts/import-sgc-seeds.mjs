import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const identity = JSON.stringify({
  tokenIdentifier: 'seed|sgc',
  email: 'seed@calaire.local',
  roles: ['admin_sgc'],
})

function chunks(items, size) {
  const result = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

function runConvex(functionName, args, push = false) {
  const cmdArgs = ['exec', 'convex', 'run']
  if (push) cmdArgs.push('--push')
  cmdArgs.push(functionName, JSON.stringify(args), '--identity', identity)
  const result = spawnSync('pnpm', cmdArgs, {
    cwd: root,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    if (result.error) console.error(result.error)
    process.exit(result.status ?? 1)
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), 'utf8'))
}

async function main() {
  const documentos = await readJson('dev/import/documentos_sgc.seed.json')
  const requisitos = await readJson('dev/import/requisitos_normativos.seed.json')
  const mapa = await readJson('dev/import/relaciones_mapa_sgc.seed.json')

  const documentChunks = chunks(documentos, 50)
  documentChunks.forEach((chunk, index) => runConvex('sgc:importarDocumentosSeedSgc', { documentos: chunk }, index === 0))

  for (const chunk of chunks(requisitos, 75)) {
    runConvex('sgc:importarRequisitosSeedSgc', { requisitos: chunk })
  }

  chunks(mapa, 75).forEach((chunk, index) => runConvex('sgc:importarMapaSeedSgc', { mapa: chunk, reemplazar: index === 0 }))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
