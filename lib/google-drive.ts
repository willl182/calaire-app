import 'server-only'
import { createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'

type GoogleDriveFile = {
  id: string
  name?: string
  webViewLink?: string
  mimeType?: string
}

type GoogleDriveConfig = {
  authMode: 'service_account' | 'oauth'
  clientEmail?: string
  privateKey?: string
  oauthClientId?: string
  oauthClientSecret?: string
  oauthRefreshToken?: string
  rootFolderId: string
  sharedDriveId: string | null
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null
let cachedServiceAccount: { clientEmail: string; privateKey: string } | null = null

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function getEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta configurar ${name} para Google Drive.`)
  return value
}

function readServiceAccountFromFile(path: string) {
  if (cachedServiceAccount) return cachedServiceAccount
  const resolved = isAbsolute(path) ? path : resolve(/* turbopackIgnore: true */ process.cwd(), path)
  const parsed = JSON.parse(readFileSync(/* turbopackIgnore: true */ resolved, 'utf8')) as {
    client_email?: string
    private_key?: string
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(`El JSON de service account no contiene client_email/private_key: ${path}`)
  }
  cachedServiceAccount = {
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key,
  }
  return cachedServiceAccount
}

function getServiceAccount() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (credentialsPath) return readServiceAccountFromFile(credentialsPath)
  return {
    clientEmail: getEnv('GOOGLE_DRIVE_CLIENT_EMAIL'),
    privateKey: getEnv('GOOGLE_DRIVE_PRIVATE_KEY').replaceAll('\\n', '\n'),
  }
}

function getConfig(): GoogleDriveConfig {
  const authMode = process.env.GOOGLE_DRIVE_AUTH_MODE?.trim() === 'oauth' ? 'oauth' : 'service_account'
  if (authMode === 'oauth') {
    return {
      authMode,
      oauthClientId: getEnv('GOOGLE_DRIVE_OAUTH_CLIENT_ID'),
      oauthClientSecret: getEnv('GOOGLE_DRIVE_OAUTH_CLIENT_SECRET'),
      oauthRefreshToken: getEnv('GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN'),
      rootFolderId: getEnv('GOOGLE_DRIVE_ROOT_FOLDER_ID'),
      sharedDriveId: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim() || null,
    }
  }

  const serviceAccount = getServiceAccount()
  return {
    authMode,
    clientEmail: serviceAccount.clientEmail,
    privateKey: serviceAccount.privateKey,
    rootFolderId: getEnv('GOOGLE_DRIVE_ROOT_FOLDER_ID'),
    sharedDriveId: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim() || null,
  }
}

export function getGoogleDriveConfigStatus() {
  const authMode = process.env.GOOGLE_DRIVE_AUTH_MODE?.trim() === 'oauth' ? 'oauth' : 'service_account'
  const hasCredentialsFile = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim())
  const hasOauth = Boolean(
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim() &&
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN?.trim()
  )
  return {
    clientEmail: authMode === 'oauth' ? hasOauth : hasCredentialsFile || Boolean(process.env.GOOGLE_DRIVE_CLIENT_EMAIL?.trim()),
    privateKey: authMode === 'oauth' ? hasOauth : hasCredentialsFile || Boolean(process.env.GOOGLE_DRIVE_PRIVATE_KEY?.trim()),
    rootFolderId: Boolean(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim()),
    templateMap: Boolean(process.env.GOOGLE_DRIVE_TEMPLATE_MAP?.trim()),
    sharedDriveId: Boolean(process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim()),
  }
}

function createJwt(config: GoogleDriveConfig) {
  if (!config.clientEmail || !config.privateKey) throw new Error('Faltan credenciales service account para Google Drive.')
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

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken

  const config = getConfig()
  const bodyParams: Record<string, string> = config.authMode === 'oauth'
    ? {
        grant_type: 'refresh_token',
        client_id: config.oauthClientId ?? '',
        client_secret: config.oauthClientSecret ?? '',
        refresh_token: config.oauthRefreshToken ?? '',
      }
    : {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: createJwt(config),
      }

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(bodyParams),
  })

  const body = (await response.json()) as { access_token?: string; expires_in?: number; error_description?: string; error?: string }
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description ?? body.error ?? 'No fue posible autenticar con Google Drive.')
  }

  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  }
  return cachedToken.accessToken
}

function driveUrl(path: string, params: Record<string, string | boolean | null | undefined> = {}) {
  const url = new URL(`${DRIVE_API_BASE}${path}`)
  url.searchParams.set('supportsAllDrives', 'true')
  url.searchParams.set('fields', 'id,webViewLink')
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value))
  }
  return url
}

function escapeQueryValue(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

async function driveRequest(path: string, init: RequestInit, params?: Record<string, string | boolean | null | undefined>) {
  const accessToken = await getAccessToken()
  const response = await fetch(driveUrl(path, params), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  const body = (await response.json()) as GoogleDriveFile & { error?: { message?: string } }
  if (!response.ok) throw new Error(body.error?.message ?? 'Google Drive rechazo la operacion.')
  return body
}

function viewUrl(id: string) {
  return `https://drive.google.com/open?id=${id}`
}

export function googleDriveRootFolderId() {
  return getConfig().rootFolderId
}

export function extractGoogleDriveIdFromRef(ref: string | null | undefined) {
  const value = ref?.trim()
  if (!value) return null
  const match = value.match(/\/(?:folders|file\/d|document\/d|spreadsheets\/d|presentation\/d)\/([a-zA-Z0-9_-]+)/) ?? value.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (match?.[1]) return match[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(value)) return value
  return null
}

export function parseGoogleDriveTemplateMap() {
  const raw = process.env.GOOGLE_DRIVE_TEMPLATE_MAP?.trim()
  if (!raw) return {}
  let parsed: Record<string, string>
  try {
    parsed = JSON.parse(raw) as Record<string, string>
  } catch {
    throw new Error('GOOGLE_DRIVE_TEMPLATE_MAP debe ser un JSON valido de codigo documental a fileId/URL.')
  }
  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key.trim().toUpperCase(), value.trim()])
  )
}

export async function createGoogleDriveFolder(args: { name: string; parentId: string }) {
  const result = await driveRequest(
    '/files',
    {
      method: 'POST',
      body: JSON.stringify({
        name: args.name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [args.parentId],
      }),
    }
  )
  return {
    id: result.id,
    webUrl: result.webViewLink ?? viewUrl(result.id),
  }
}

export async function findGoogleDriveFolder(args: { name: string; parentId: string }) {
  const config = getConfig()
  const params: Record<string, string | boolean | null | undefined> = {
    q: [
      `'${escapeQueryValue(args.parentId)}' in parents`,
      `name = '${escapeQueryValue(args.name)}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      'trashed = false',
    ].join(' and '),
    pageSize: '1',
    fields: 'files(id,name,webViewLink,mimeType)',
  }
  if (config.sharedDriveId) {
    params.includeItemsFromAllDrives = true
    params.corpora = 'drive'
    params.driveId = config.sharedDriveId
  }
  const result = await driveRequest('/files', { method: 'GET' }, params) as { files?: GoogleDriveFile[] }
  const folder = result.files?.[0]
  if (!folder) return null
  return {
    id: folder.id,
    webUrl: folder.webViewLink ?? viewUrl(folder.id),
  }
}

export async function copyGoogleDriveFile(args: { templateFileId: string; name: string; parentId: string }) {
  const result = await driveRequest(`/files/${encodeURIComponent(args.templateFileId)}/copy`, {
    method: 'POST',
    body: JSON.stringify({
      name: args.name,
      parents: [args.parentId],
    }),
  })
  return {
    id: result.id,
    webUrl: result.webViewLink ?? viewUrl(result.id),
  }
}
