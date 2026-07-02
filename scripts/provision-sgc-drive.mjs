import { createSign } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const DOC_MIME = 'application/vnd.google-apps.document'
const OUTPUT_PATH = 'dev/drive/sgc-drive-base.json'
const PREFERRED_TEMPLATE_EXTENSIONS = new Map([
  ['F-PSEA-01', ['.xlsx', '.xls', '.ods', '.docx', '.doc']],
  ['F-PSEA-02', ['.xlsx', '.xls', '.ods', '.docx', '.doc']],
  ['F-PSEA-04', ['.xlsx', '.xls', '.ods', '.docx', '.doc']],
  ['F-PSEA-08', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-09', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-10', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-11', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-11A', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-11B', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-11C', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-11D', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
  ['F-PSEA-12', ['.xlsx', '.xls', '.ods', '.csv', '.docx', '.doc']],
])
const DEFAULT_TEMPLATE_EXTENSIONS = ['.docx', '.doc', '.xlsx', '.xls', '.ods', '.csv', '.md', '.pdf']

const { SGC_RONDA_ETAPAS } = await import('../lib/sgc/catalog.ts')

let cachedToken = null

function parseArgs(argv) {
  const args = {
    dryRun: false,
    createTemplatePlaceholders: false,
    baseName: 'SGC CALAIRE BASE',
    templatesFolderName: '00_plantillas_maestras',
    outputPath: OUTPUT_PATH,
    rootFolderId: null,
    discoverTemplatesFrom: null,
    discoverOnly: false,
    envOutputPath: null,
    credentialsPath: null,
  }

  const cleanArgv = argv.filter((arg) => arg !== '--')
  for (let index = 0; index < cleanArgv.length; index += 1) {
    const arg = cleanArgv[index]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--create-template-placeholders') args.createTemplatePlaceholders = true
    else if (arg === '--name') args.baseName = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--templates-folder') args.templatesFolderName = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--output') args.outputPath = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--root-folder-id') args.rootFolderId = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--discover-templates-from') args.discoverTemplatesFrom = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--discover-only') args.discoverOnly = true
    else if (arg === '--env-output') args.envOutputPath = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--credentials') args.credentialsPath = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Argumento no reconocido: ${arg}`)
    }
  }

  return args
}

function requiredValue(argv, index, name) {
  const value = argv[index]?.trim()
  if (!value || value.startsWith('--')) throw new Error(`Falta valor para ${name}.`)
  return value
}

function printHelp() {
  console.log(`Provisiona la estructura base SGC en Google Drive.

Uso:
  pnpm sgc:provision-drive -- --dry-run
  pnpm sgc:provision-drive -- --name "SGC CALAIRE BASE"
  pnpm sgc:provision-drive -- --create-template-placeholders

Opciones:
  --dry-run                         No llama Google Drive; imprime lo que crearia.
  --name <nombre>                   Nombre de la carpeta base. Default: SGC CALAIRE BASE.
  --root-folder-id <id>             Padre Drive. Default: GOOGLE_DRIVE_ROOT_FOLDER_ID.
  --templates-folder <nombre>       Carpeta para plantillas. Default: 00_plantillas_maestras.
  --create-template-placeholders    Crea Google Docs vacios por documento del catalogo y genera templateMap.
  --discover-templates-from <id>    Escanea una carpeta Drive existente y mapea plantillas por codigo en el nombre.
  --discover-only                   Solo genera el mapa de plantillas; no crea carpetas base.
  --env-output <path>               Escribe un snippet .env con GOOGLE_DRIVE_TEMPLATE_MAP.
  --credentials <path>              JSON de service account. Alternativa: GOOGLE_APPLICATION_CREDENTIALS.
  --output <path>                   Manifest local. Default: ${OUTPUT_PATH}.`)
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
    const value = rawValue
      .replace(/\s+#.*$/, '')
      .replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

function getEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta configurar ${name}.`)
  return value
}

async function getServiceAccount(args) {
  const credentialsPath = args.credentialsPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (credentialsPath) {
    const raw = await readFile(join(root, credentialsPath), 'utf8').catch(async (error) => {
      if (credentialsPath.startsWith('/')) return readFile(credentialsPath, 'utf8')
      throw error
    })
    const json = JSON.parse(raw)
    if (!json.client_email || !json.private_key) {
      throw new Error(`El JSON de service account no contiene client_email/private_key: ${credentialsPath}`)
    }
    return {
      clientEmail: json.client_email,
      privateKey: json.private_key,
    }
  }

  return {
    clientEmail: getEnv('GOOGLE_DRIVE_CLIENT_EMAIL'),
    privateKey: getEnv('GOOGLE_DRIVE_PRIVATE_KEY').replaceAll('\\n', '\n'),
  }
}

async function getConfig(args) {
  const serviceAccount = await getServiceAccount(args)
  return {
    ...serviceAccount,
    rootFolderId: args.rootFolderId ?? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim() ?? null,
    sharedDriveId: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim() || null,
  }
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function createJwt(config) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: config.clientEmail,
    scope: DRIVE_SCOPE,
    aud: OAUTH_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(config.privateKey)
  return `${unsigned}.${base64Url(signature)}`
}

async function getAccessToken(config) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createJwt(config),
    }),
  })
  const body = await response.json()
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description ?? body.error ?? 'No fue posible autenticar con Google Drive.')
  }
  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  }
  return cachedToken.accessToken
}

function driveUrl(path, config, params = {}) {
  const url = new URL(`${DRIVE_API_BASE}${path}`)
  url.searchParams.set('supportsAllDrives', 'true')
  if (config.sharedDriveId) url.searchParams.set('includeItemsFromAllDrives', 'true')
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value))
  }
  return url
}

async function driveRequest(config, path, init, params) {
  const accessToken = await getAccessToken(config)
  const response = await fetch(driveUrl(path, config, params), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.message ?? 'Google Drive rechazo la operacion.')
  return body
}

function escapeQueryValue(value) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

async function findChild(config, parentId, name, mimeType) {
  const query = [
    `'${escapeQueryValue(parentId)}' in parents`,
    `name = '${escapeQueryValue(name)}'`,
    `mimeType = '${escapeQueryValue(mimeType)}'`,
    'trashed = false',
  ].join(' and ')
  const params = {
    q: query,
    pageSize: '10',
    fields: 'files(id,name,webViewLink,mimeType)',
  }
  if (config.sharedDriveId) {
    params.corpora = 'drive'
    params.driveId = config.sharedDriveId
  }
  const result = await driveRequest(config, '/files', { method: 'GET' }, params)
  return result.files?.[0] ?? null
}

async function listChildren(config, parentId, pageToken = null) {
  const query = [
    `'${escapeQueryValue(parentId)}' in parents`,
    'trashed = false',
  ].join(' and ')
  const params = {
    q: query,
    pageSize: '100',
    fields: 'nextPageToken,files(id,name,webViewLink,mimeType)',
    pageToken,
  }
  if (config.sharedDriveId) {
    params.corpora = 'drive'
    params.driveId = config.sharedDriveId
  }
  return driveRequest(config, '/files', { method: 'GET' }, params)
}

async function ensureFile(config, parentId, name, mimeType) {
  const existing = await findChild(config, parentId, name, mimeType)
  if (existing) return { ...toManifestFile(existing), created: false }
  const created = await driveRequest(config, '/files', {
    method: 'POST',
    body: JSON.stringify({ name, mimeType, parents: [parentId] }),
  }, { fields: 'id,name,webViewLink,mimeType' })
  return { ...toManifestFile(created), created: true }
}

function toManifestFile(file) {
  return {
    id: file.id,
    name: file.name,
    webUrl: file.webViewLink ?? `https://drive.google.com/open?id=${file.id}`,
    mimeType: file.mimeType,
  }
}

function allCatalogDocuments() {
  const byCode = new Map()
  for (const etapa of SGC_RONDA_ETAPAS) {
    for (const documento of etapa.documentos) {
      if (!byCode.has(documento.codigo)) byCode.set(documento.codigo, documento)
    }
  }
  return Array.from(byCode.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))
}

function knownTemplateCodes() {
  const codes = new Set()
  for (const documento of allCatalogDocuments()) {
    codes.add(documento.codigo)
    if (documento.formatoOperativo) codes.add(documento.formatoOperativo)
  }
  return Array.from(codes).sort((a, b) => b.length - a.length || a.localeCompare(b))
}

function discoverCodesFromName(name, codes) {
  const normalized = name.toUpperCase()
  return codes.filter((code) => {
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^A-Z0-9])${escaped}([^A-Z0-9]|$)`).test(normalized)
  })
}

function extensionOf(name) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/)
  return match?.[0] ?? ''
}

function scoreTemplateCandidate(code, path, file) {
  const extension = extensionOf(file.name)
  const preferred = PREFERRED_TEMPLATE_EXTENSIONS.get(code) ?? DEFAULT_TEMPLATE_EXTENSIONS
  const extensionIndex = preferred.indexOf(extension)
  const extensionScore = extensionIndex === -1 ? 0 : 100 - extensionIndex * 10
  const name = file.name.toUpperCase()
  const exactPrefixScore = name.startsWith(code) ? 25 : 0
  const masterFolderScore = path.includes('/04_formatos_maestros/') || path.startsWith('04_formatos_maestros/') ? 10 : 0
  const markdownPenalty = extension === '.md' ? -40 : 0
  const imagePenalty = ['.png', '.jpg', '.jpeg'].includes(extension) ? -80 : 0
  return extensionScore + exactPrefixScore + masterFolderScore + markdownPenalty + imagePenalty
}

async function discoverTemplates(config, folderId) {
  const codes = knownTemplateCodes()
  const templateMap = {}
  const templateCandidates = {}
  const discovered = []
  const duplicates = []
  const pendingFolders = [{ id: folderId, path: '' }]

  while (pendingFolders.length > 0) {
    const folder = pendingFolders.shift()
    let pageToken = null
    do {
      const page = await listChildren(config, folder.id, pageToken)
      for (const file of page.files ?? []) {
        const path = folder.path ? `${folder.path}/${file.name}` : file.name
        if (file.mimeType === FOLDER_MIME) {
          pendingFolders.push({ id: file.id, path })
          continue
        }

        const matchedCodes = discoverCodesFromName(file.name, codes)
        if (matchedCodes.length === 0) continue
        const manifestFile = toManifestFile(file)
        discovered.push({ path, codes: matchedCodes, file: manifestFile })
        for (const code of matchedCodes) {
          const candidate = {
            code,
            path,
            file: manifestFile,
            score: scoreTemplateCandidate(code, path, file),
          }
          const current = templateCandidates[code]
          if (current && current.file.id !== file.id) {
            if (candidate.score > current.score) {
              duplicates.push({ code, kept: file.id, ignored: current.file.id, ignoredPath: current.path, replaced: true })
              templateCandidates[code] = candidate
              templateMap[code] = file.id
            } else {
              duplicates.push({ code, kept: current.file.id, ignored: file.id, ignoredPath: path, replaced: false })
            }
            continue
          }
          templateCandidates[code] = candidate
          templateMap[code] = file.id
        }
      }
      pageToken = page.nextPageToken ?? null
    } while (pageToken)
  }

  return { templateMap, discovered, duplicates, selectedTemplates: Object.values(templateCandidates).sort((a, b) => a.code.localeCompare(b.code)) }
}

function summarizeCatalog() {
  const documentos = allCatalogDocuments()
  return {
    etapas: SGC_RONDA_ETAPAS.length,
    documentos: documentos.length,
    formatosOperativos: documentos.filter((documento) => documento.formatoOperativo).length,
  }
}

async function dryRun(args) {
  const summary = summarizeCatalog()
  console.log(`Dry run: crearia carpeta base "${args.baseName}" bajo GOOGLE_DRIVE_ROOT_FOLDER_ID/root seleccionado.`)
  console.log(`Etapas: ${summary.etapas}; documentos unicos: ${summary.documentos}; formatos operativos: ${summary.formatosOperativos}.`)
  console.log('Carpetas de etapa:')
  for (const etapa of SGC_RONDA_ETAPAS) {
    console.log(`- ${etapa.carpeta} (${etapa.documentos.length} documentos esperados)`)
  }
  if (args.createTemplatePlaceholders) {
    console.log('Tambien crearia plantillas placeholder en la carpeta de plantillas.')
  }
  if (args.discoverTemplatesFrom) {
    console.log(`Tambien escanearia plantillas desde folderId=${args.discoverTemplatesFrom}.`)
  }
}

async function provision(args) {
  await loadEnvFile(join(root, '.env.local'))
  const config = await getConfig(args)
  const discoveredTemplates = args.discoverTemplatesFrom
    ? await discoverTemplates(config, args.discoverTemplatesFrom)
    : { templateMap: {}, discovered: [], duplicates: [] }

  if (args.discoverOnly) {
    await writeManifest(args, {
      generatedAt: new Date().toISOString(),
      base: null,
      templatesFolder: { id: args.discoverTemplatesFrom, source: 'discovered' },
      etapas: [],
      templateMap: discoveredTemplates.templateMap,
      discoveredTemplates: discoveredTemplates.discovered,
      selectedTemplates: discoveredTemplates.selectedTemplates,
      duplicateTemplateMatches: discoveredTemplates.duplicates,
      summary: {
        ...summarizeCatalog(),
        discoveredTemplates: discoveredTemplates.discovered.length,
        templateMapEntries: Object.keys(discoveredTemplates.templateMap).length,
        duplicateTemplateMatches: discoveredTemplates.duplicates.length,
      },
    })
    return
  }

  if (!config.rootFolderId) {
    throw new Error('Falta GOOGLE_DRIVE_ROOT_FOLDER_ID o --root-folder-id para crear la base SGC.')
  }

  const base = await ensureFile(config, config.rootFolderId, args.baseName, FOLDER_MIME)
  const templates = await ensureFile(config, base.id, args.templatesFolderName, FOLDER_MIME)
  const etapas = []
  let createdFolders = Number(base.created) + Number(templates.created)
  let reusedFolders = Number(!base.created) + Number(!templates.created)

  for (const etapa of SGC_RONDA_ETAPAS) {
    const folder = await ensureFile(config, base.id, etapa.carpeta, FOLDER_MIME)
    if (folder.created) createdFolders += 1
    else reusedFolders += 1
    etapas.push({
      key: etapa.key,
      numero: etapa.numero,
      nombre: etapa.nombre,
      carpeta: etapa.carpeta,
      folder,
      documentos: etapa.documentos.map((documento) => ({
        codigo: documento.codigo,
        nombre: documento.nombre,
        estado: documento.estado,
        formatoOperativo: documento.formatoOperativo ?? null,
      })),
    })
  }

  const templateMap = { ...discoveredTemplates.templateMap }
  const templatesCreated = []
  if (args.createTemplatePlaceholders) {
    for (const documento of allCatalogDocuments()) {
      const name = `${documento.codigo} - ${documento.nombre}`
      const file = await ensureFile(config, templates.id, name, DOC_MIME)
      templateMap[documento.codigo] = file.id
      if (documento.formatoOperativo) templateMap[documento.formatoOperativo] = file.id
      templatesCreated.push({ codigo: documento.codigo, formatoOperativo: documento.formatoOperativo ?? null, file })
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    base,
    templatesFolder: templates,
    etapas,
    templateMap,
    discoveredTemplates: discoveredTemplates.discovered,
    selectedTemplates: discoveredTemplates.selectedTemplates,
    duplicateTemplateMatches: discoveredTemplates.duplicates,
    summary: {
      ...summarizeCatalog(),
      foldersCreated: createdFolders,
      foldersReused: reusedFolders,
      discoveredTemplates: discoveredTemplates.discovered.length,
      templateMapEntries: Object.keys(templateMap).length,
      duplicateTemplateMatches: discoveredTemplates.duplicates.length,
      templatePlaceholdersCreated: templatesCreated.filter((item) => item.file.created).length,
      templatePlaceholdersReused: templatesCreated.filter((item) => !item.file.created).length,
    },
  }

  await writeManifest(args, manifest)
}

async function writeManifest(args, manifest) {
  const outputPath = join(root, args.outputPath)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  if (args.envOutputPath) {
    const envPath = join(root, args.envOutputPath)
    await mkdir(dirname(envPath), { recursive: true })
    await writeFile(
      envPath,
      `GOOGLE_DRIVE_TEMPLATE_MAP='${JSON.stringify(manifest.templateMap)}'\n`,
      'utf8'
    )
  }

  if (manifest.base?.webUrl) console.log(`Base SGC Drive lista: ${manifest.base.webUrl}`)
  console.log(`Manifest: ${args.outputPath}`)
  if (args.envOutputPath) console.log(`Env snippet: ${args.envOutputPath}`)
  console.log(JSON.stringify(manifest.summary, null, 2))
  if (Object.keys(manifest.templateMap).length > 0) {
    console.log('GOOGLE_DRIVE_TEMPLATE_MAP:')
    console.log(JSON.stringify(manifest.templateMap, null, 2))
  }
  if (manifest.duplicateTemplateMatches?.length > 0) {
    console.warn('Advertencia: hubo codigos duplicados; se conservo el candidato con mayor prioridad.')
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.dryRun) await dryRun(args)
  else await provision(args)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
