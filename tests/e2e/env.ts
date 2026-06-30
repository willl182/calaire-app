import { z } from 'zod'

const e2eEnvSchema = z.object({
  CI: z.string().optional(),
  E2E_AUTH_EMAIL: z.string().email().optional(),
  E2E_AUTH_PASSWORD: z.string().min(1).optional(),
  PLAYWRIGHT_AUTH_MODE: z.enum(['manual']).optional(),
  PLAYWRIGHT_BASE_URL: z.string().url().optional(),
  PLAYWRIGHT_START_SERVER: z.enum(['1']).optional(),
})

const parsedEnv = e2eEnvSchema.parse(process.env)

export const e2eEnv = {
  authEmail: parsedEnv.E2E_AUTH_EMAIL,
  authPassword: parsedEnv.E2E_AUTH_PASSWORD,
  baseURL: parsedEnv.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
  hasAuthCredentials: Boolean(parsedEnv.E2E_AUTH_EMAIL && parsedEnv.E2E_AUTH_PASSWORD),
  isCI: Boolean(parsedEnv.CI),
  isManualAuth: parsedEnv.PLAYWRIGHT_AUTH_MODE === 'manual',
  shouldStartServer: parsedEnv.PLAYWRIGHT_START_SERVER === '1' || Boolean(parsedEnv.CI),
} as const

export function getRequiredE2EAuthCredentials() {
  if (!e2eEnv.authEmail || !e2eEnv.authPassword) {
    throw new Error('Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated E2E tests.')
  }

  return {
    email: e2eEnv.authEmail,
    password: e2eEnv.authPassword,
  }
}
