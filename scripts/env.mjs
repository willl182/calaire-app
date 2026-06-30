import { z } from 'zod'

const scriptEnvSchema = z.object({
  CONVEX_DEPLOYMENT: z.string().min(1).optional(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  RONDA_ID: z.string().min(1).optional(),
})

const parsedEnv = scriptEnvSchema.parse(process.env)

export const scriptEnv = {
  convexDeployment: parsedEnv.CONVEX_DEPLOYMENT ?? 'steady-kiwi-725',
  convexUrl: parsedEnv.NEXT_PUBLIC_CONVEX_URL ?? 'https://steady-kiwi-725.convex.cloud',
  rondaId: parsedEnv.RONDA_ID ?? 'kd77ck9jqbeafg5g61c7cw0vrh8756qr',
}

export function withScriptEnv(extraEnv = {}) {
  return {
    ...process.env,
    ...extraEnv,
  }
}
