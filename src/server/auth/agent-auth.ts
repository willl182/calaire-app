import crypto from 'node:crypto'
import { ConvexHttpClient } from 'convex/browser'
import { anyApi, type FunctionReference } from 'convex/server'
import { env, requireEnv } from '@/env'

let _convex: ConvexHttpClient | null = null

function getConvex(): ConvexHttpClient {
  if (!_convex) {
    _convex = new ConvexHttpClient(requireEnv('NEXT_PUBLIC_CONVEX_URL', env.NEXT_PUBLIC_CONVEX_URL), {
      skipConvexDeploymentUrlCheck: true,
    })
  }
  return _convex
}

const agentAuthApi = anyApi.agent.auth as unknown as {
  createClaim: FunctionReference<'mutation'>
  getClaimByTokenHash: FunctionReference<'query'>
  getClaimByViewTokenHash: FunctionReference<'query'>
  getApiKeyRecord: FunctionReference<'query'>
  rotateOtp: FunctionReference<'mutation'>
  completeClaim: FunctionReference<'mutation'>
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url')
}

function randomOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

export function getAgentAppUrl(pathname: string) {
  const origin =
    env.NEXT_PUBLIC_APP_URL ??
    env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ??
    'http://localhost:3000'
  return new URL(pathname, origin).toString()
}

export async function createAgentClaim(email: string) {
  const claimToken = randomToken()
  const claimViewToken = randomToken()
  const claimTokenHash = sha256(claimToken)
  const claimViewTokenHash = sha256(claimViewToken)
  const claimExpiresAt = Date.now() + 60 * 60 * 1000
  const scopes = ['calaire.agent.me', 'calaire.agent.admin']

  const claimId = await getConvex().mutation(agentAuthApi.createClaim, {
    claimTokenHash,
    claimViewTokenHash,
    email: email.toLowerCase(),
    claimExpiresAt,
    scopes,
  })

  return {
    claimId,
    claimToken,
    claimViewToken,
    claimTokenHash,
    claimViewTokenHash,
    claimViewUrl: getAgentAppUrl(`/agent/auth/claim/view?token=${encodeURIComponent(claimViewToken)}`),
    claimExpiresAt,
    scopes,
  }
}

export async function getClaimByToken(claimToken: string) {
  return await getConvex().query(agentAuthApi.getClaimByTokenHash, {
    claimTokenHash: sha256(claimToken),
  })
}

export async function getClaimByViewToken(claimViewToken: string) {
  return await getConvex().query(agentAuthApi.getClaimByViewTokenHash, {
    claimViewTokenHash: sha256(claimViewToken),
  })
}

export async function getApiKeyRecord(apiKey: string) {
  return await getConvex().query(agentAuthApi.getApiKeyRecord, {
    apiKeyHash: sha256(apiKey),
  })
}

export async function saveOtp(claimId: string, otp: string) {
  await getConvex().mutation(agentAuthApi.rotateOtp, {
    claimId,
    otpHash: sha256(otp),
    otpExpiresAt: Date.now() + 10 * 60 * 1000,
  })
}

export async function completeClaim(claimId: string) {
  const apiKey = randomToken(32)
  const apiKeyHash = sha256(apiKey)
  const apiKeyExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  await getConvex().mutation(agentAuthApi.completeClaim, {
    claimId,
    apiKeyHash,
    apiKeyExpiresAt,
    claimCompletedAt: Date.now(),
  })
  return { apiKey, apiKeyExpiresAt }
}

export async function getClaimViewState(claimViewToken: string) {
  const claim = await getClaimByViewToken(claimViewToken)
  const now = Date.now()
  return {
    claim,
    expired: !claim || claim.claimExpiresAt < now,
    otpExpired: !claim || !claim.otpExpiresAt || claim.otpExpiresAt < now,
  }
}

export function generateOtp() {
  return randomOtp()
}

export function hashValue(value: string) {
  return sha256(value)
}
