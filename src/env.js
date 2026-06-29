import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-only variables.
   */
  server: {
    WORKOS_API_KEY: z.string().min(1),
    WORKOS_CLIENT_ID: z.string().min(1),
    WORKOS_SECRET: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min().optional(),
    MAIL_FROM: z.string().email().optional(),
  },

  /**
   * Client-side variables exposed via NEXT_PUBLIC_*.
   */
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.string().url().optional(),
  },

  /**
   * Manual mapping for Next.js 16 / app router compatibility.
   */
  runtimeEnv: {
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_SECRET: process.env.WORKOS_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  },

  /**
   * Treat empty strings as undefined so optional vars don't fail validation.
   */
  emptyStringAsUndefined: true,
});
