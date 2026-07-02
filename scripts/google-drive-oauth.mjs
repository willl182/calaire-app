import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'

const OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'
const DEFAULT_REDIRECT_URI = 'http://localhost'

function parseArgs(argv) {
  const args = {
    command: argv[0],
    credentials: null,
    code: null,
    redirectUri: DEFAULT_REDIRECT_URI,
    envPath: 'dev/drive/google-drive-oauth.env',
  }
  const cleanArgv = argv.slice(1).filter((arg) => arg !== '--')
  for (let index = 0; index < cleanArgv.length; index += 1) {
    const arg = cleanArgv[index]
    if (arg === '--credentials') args.credentials = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--code') args.code = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--redirect-uri') args.redirectUri = requiredValue(cleanArgv, ++index, arg)
    else if (arg === '--env-output') args.envPath = requiredValue(cleanArgv, ++index, arg)
    else throw new Error(`Argumento no reconocido: ${arg}`)
  }
  if (!['url', 'token'].includes(args.command)) {
    throw new Error('Uso: pnpm sgc:drive-oauth:url -- --credentials <oauth-client.json> | pnpm sgc:drive-oauth:token -- --credentials <oauth-client.json> --code <codigo>')
  }
  if (!args.credentials) throw new Error('Falta --credentials <oauth-client.json>.')
  return args
}

function requiredValue(argv, index, name) {
  const value = argv[index]?.trim()
  if (!value || value.startsWith('--')) throw new Error(`Falta valor para ${name}.`)
  return value
}

async function readOauthClient(path) {
  const resolved = isAbsolute(path) ? path : resolve(process.cwd(), path)
  if (!existsSync(resolved)) throw new Error(`No existe el JSON OAuth: ${path}`)
  const parsed = JSON.parse(await readFile(resolved, 'utf8'))
  const config = parsed.installed ?? parsed.web ?? parsed
  if (!config.client_id || !config.client_secret) {
    throw new Error('El JSON OAuth no contiene client_id/client_secret.')
  }
  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
  }
}

async function printAuthUrl(args) {
  const client = await readOauthClient(args.credentials)
  const url = new URL(OAUTH_AUTH_URL)
  url.searchParams.set('client_id', client.clientId)
  url.searchParams.set('redirect_uri', args.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', DRIVE_SCOPE)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  console.log(url.toString())
}

async function exchangeCode(args) {
  if (!args.code) throw new Error('Falta --code <codigo>.')
  const client = await readOauthClient(args.credentials)
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: args.code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: args.redirectUri,
    }),
  })
  const body = await response.json()
  if (!response.ok || !body.refresh_token) {
    throw new Error(body.error_description ?? body.error ?? 'Google no devolvio refresh_token. Repite con prompt=consent.')
  }
  const env = [
    'GOOGLE_DRIVE_AUTH_MODE=oauth',
    `GOOGLE_DRIVE_OAUTH_CLIENT_ID=${client.clientId}`,
    `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=${client.clientSecret}`,
    `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=${body.refresh_token}`,
    '',
  ].join('\n')
  await writeFile(resolve(process.cwd(), args.envPath), env, 'utf8')
  console.log(`OAuth listo: ${args.envPath}`)
}

const args = parseArgs(process.argv.slice(2))
if (args.command === 'url') await printAuthUrl(args)
else await exchangeCode(args)
