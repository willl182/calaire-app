// Validacion SOLO LECTURA del expediente SGC creado en Google Drive.
//
// Recorre el subarbol de cada carpeta de ronda bajo GOOGLE_DRIVE_ROOT_FOLDER_ID y verifica:
//   1. Ninguna copia de documento reutiliza el id de una plantilla maestra (una copia real es un
//      archivo NUEVO con id propio). Si aparece un id maestro dentro de la ronda, la "copia" en
//      realidad apunta a la plantilla.
//   2. Ningun documento es un acceso directo (shortcut) hacia otro archivo.
//   3. Cada documento cuelga de una subcarpeta de etapa, no directamente de la raiz de la ronda.
//
// No crea ni modifica nada. Uso:
//   pnpm sgc:validate-drive
//   pnpm sgc:validate-drive -- --ronda-folder <folderId>
//   node scripts/validate-sgc-drive.mjs --credentials .local/xxx.json

import { createSign } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const SHORTCUT_MIME = 'application/vnd.google-apps.shortcut'

const { SGC_RONDA_ETAPAS } = await import('../lib/sgc/catalog.ts')
const STAGE_FOLDER_NAMES = new Set(SGC_RONDA_ETAPAS.map((etapa) => etapa.carpeta))

let cachedToken = null

function parseArgs(argv) {
  const args = { rondaFolderId: null, credentialsPath: null }
  const clean = argv.filter((a) => a !== '--')
  for (let i = 0; i < clean.length; i += 1) {
    const arg = clean[i]
    if (arg === '--ronda-folder') args.rondaFolderId = requiredValue(clean, ++i, arg)
    else if (arg === '--credentials') args.credentialsPath = requiredValue(clean, ++i, arg)
    else if (arg === '--help' || arg === '-h') {
      console.log('Uso: pnpm sgc:validate-drive [-- --ronda-folder <id>] [--credentials <path>]')
      process.exit(0)
    } else throw new Error(`Argumento no reconocido: ${arg}`)
  }
  return args
}

function requiredValue(argv, index, name) {
  const value = argv[index]?.trim()
  if (!value || value.startsWith('--')) throw new Error(`Falta valor para ${name}.`)
  return value
}

async function loadEnvFile(path) {
  if (!existsSync(path)) return
  const text = await readFile(path, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '')
  }
}

function getEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta configurar ${name}.`)
  return value
}

function base64Url(value) {
  return Buffer.from(value).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

async function getServiceAccount(args) {
  const credentialsPath = args.credentialsPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (credentialsPath) {
    const raw = await readFile(join(root, credentialsPath), 'utf8').catch(async (error) => {
      if (credentialsPath.startsWith('/')) return readFile(credentialsPath, 'utf8')
      throw error
    })
    const json = JSON.parse(raw)
    if (!json.client_email || !json.private_key) throw new Error('JSON de service account sin client_email/private_key.')
    return { clientEmail: json.client_email, privateKey: json.private_key }
  }
  return {
    clientEmail: getEnv('GOOGLE_DRIVE_CLIENT_EMAIL'),
    privateKey: getEnv('GOOGLE_DRIVE_PRIVATE_KEY').replaceAll('\\n', '\n'),
  }
}

async function getConfig(args) {
  const authMode = process.env.GOOGLE_DRIVE_AUTH_MODE?.trim() === 'oauth' ? 'oauth' : 'service_account'
  const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim() || null
  const rootFolderId = args.rondaFolderId ?? getEnv('GOOGLE_DRIVE_ROOT_FOLDER_ID')
  if (authMode === 'oauth') {
    return {
      authMode,
      oauthClientId: getEnv('GOOGLE_DRIVE_OAUTH_CLIENT_ID'),
      oauthClientSecret: getEnv('GOOGLE_DRIVE_OAUTH_CLIENT_SECRET'),
      oauthRefreshToken: getEnv('GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN'),
      rootFolderId,
      sharedDriveId,
    }
  }
  const sa = await getServiceAccount(args)
  return { authMode, ...sa, rootFolderId, sharedDriveId }
}

function createJwt(config) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = { iss: config.clientEmail, scope: DRIVE_SCOPE, aud: OAUTH_TOKEN_URL, exp: now + 3600, iat: now }
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(config.privateKey)
  return `${unsigned}.${base64Url(signature)}`
}

async function getAccessToken(config) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken
  const body = config.authMode === 'oauth'
    ? {
        grant_type: 'refresh_token',
        client_id: config.oauthClientId,
        client_secret: config.oauthClientSecret,
        refresh_token: config.oauthRefreshToken,
      }
    : { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: createJwt(config) }
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })
  const json = await response.json()
  if (!response.ok || !json.access_token) throw new Error(json.error_description ?? json.error ?? 'Auth Google Drive fallo.')
  cachedToken = { accessToken: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 }
  return cachedToken.accessToken
}

async function listChildren(config, parentId) {
  const files = []
  let pageToken = null
  do {
    const url = new URL(`${DRIVE_API_BASE}/files`)
    url.searchParams.set('supportsAllDrives', 'true')
    url.searchParams.set('q', `'${parentId.replaceAll("'", "\\'")}' in parents and trashed = false`)
    url.searchParams.set('pageSize', '200')
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,shortcutDetails)')
    if (config.sharedDriveId) {
      url.searchParams.set('includeItemsFromAllDrives', 'true')
      url.searchParams.set('corpora', 'drive')
      url.searchParams.set('driveId', config.sharedDriveId)
    }
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const accessToken = await getAccessToken(config)
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error?.message ?? 'Drive rechazo el listado.')
    files.push(...(json.files ?? []))
    pageToken = json.nextPageToken ?? null
  } while (pageToken)
  return files
}

async function loadMasterTemplateIds() {
  const ids = new Map() // id -> codigo
  const manifestPath = join(root, 'dev/drive/sgc-drive-base.json')
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    for (const [codigo, value] of Object.entries(manifest.templateMap ?? {})) {
      const id = extractId(value)
      if (id) ids.set(id, codigo)
    }
  }
  const raw = process.env.GOOGLE_DRIVE_TEMPLATE_MAP?.trim()
  if (raw) {
    try {
      for (const [codigo, value] of Object.entries(JSON.parse(raw))) {
        const id = extractId(value)
        if (id) ids.set(id, codigo)
      }
    } catch {
      /* ignora map invalido; el manifest ya cubre el caso comun */
    }
  }
  return ids
}

function extractId(ref) {
  const value = String(ref ?? '').trim()
  if (!value) return null
  const m = value.match(/\/(?:folders|file\/d|document\/d|spreadsheets\/d|presentation\/d)\/([a-zA-Z0-9_-]+)/) ?? value.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m?.[1]) return m[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(value)) return value
  return null
}

async function isRondaFolder(config, folder) {
  if (folder.mimeType !== FOLDER_MIME) return false
  const children = await listChildren(config, folder.id)
  return children.some((c) => c.mimeType === FOLDER_MIME && STAGE_FOLDER_NAMES.has(c.name))
}

async function walkRonda(config, rondaFolder, masterIds, report) {
  const stages = (await listChildren(config, rondaFolder.id)).filter((c) => c.mimeType === FOLDER_MIME)
  for (const stage of stages) {
    const docs = await listChildren(config, stage.id)
    for (const doc of docs) {
      if (doc.mimeType === FOLDER_MIME) continue
      report.totalDocs += 1
      if (doc.mimeType === SHORTCUT_MIME) {
        const target = doc.shortcutDetails?.targetId ?? '?'
        report.problems.push(`ACCESO DIRECTO: "${doc.name}" (${stage.name}) apunta a ${target}, no es una copia.`)
        continue
      }
      if (masterIds.has(doc.id)) {
        report.problems.push(`ID MAESTRO: "${doc.name}" (${stage.name}) reutiliza la plantilla maestra ${masterIds.get(doc.id)} (${doc.id}).`)
        continue
      }
      report.okDocs += 1
    }
    // documentos colgados directamente de la ronda (sin etapa) se detectan aparte
  }
  const looseDocs = (await listChildren(config, rondaFolder.id)).filter(
    (c) => c.mimeType !== FOLDER_MIME && c.mimeType !== SHORTCUT_MIME
  )
  for (const doc of looseDocs) {
    report.problems.push(`FUERA DE ETAPA: "${doc.name}" cuelga de la raiz de la ronda, no de una subcarpeta de etapa.`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  await loadEnvFile(join(root, 'dev/drive/google-drive-oauth.env'))
  await loadEnvFile(join(root, 'dev/drive/google-drive.env'))
  await loadEnvFile(join(root, '.env.local'))

  const config = await getConfig(args)
  const masterIds = await loadMasterTemplateIds()
  console.log(`Auth: ${config.authMode}. Plantillas maestras conocidas: ${masterIds.size}.`)
  console.log(`Explorando carpeta: ${config.rootFolderId}${config.sharedDriveId ? ` (shared drive ${config.sharedDriveId})` : ''}\n`)

  const rootChildren = await listChildren(config, config.rootFolderId)
  const candidates = []
  if (args.rondaFolderId) {
    candidates.push({ id: config.rootFolderId, name: '(carpeta indicada)', mimeType: FOLDER_MIME })
  } else {
    for (const child of rootChildren) {
      if (await isRondaFolder(config, child)) candidates.push(child)
    }
  }

  if (candidates.length === 0) {
    console.log('No se encontraron carpetas de ronda (con subcarpetas de etapa) bajo la carpeta explorada.')
    console.log('Sugerencia: pase la carpeta de la ronda con -- --ronda-folder <id>.')
    process.exit(0)
  }

  const report = { totalDocs: 0, okDocs: 0, problems: [] }
  for (const ronda of candidates) {
    console.log(`Ronda: ${ronda.name} (${ronda.id})`)
    await walkRonda(config, ronda, masterIds, report)
  }

  console.log('\n== Resultado ==')
  console.log(`Documentos revisados: ${report.totalDocs}`)
  console.log(`Copias validas (id propio, no shortcut, dentro de etapa): ${report.okDocs}`)
  if (report.problems.length === 0) {
    console.log('OK: ninguna copia apunta a una plantilla maestra ni es acceso directo.')
    process.exit(0)
  }
  console.log(`Problemas: ${report.problems.length}`)
  for (const problem of report.problems) console.log(`  - ${problem}`)
  process.exit(1)
}

main().catch((error) => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
