# Session State: calaire-app

**Last Updated**: 2026-06-09 22:31 America/Bogota

## Session Objective

Complete FT2 Expediente SGC validation, fix Convex deployment mismatch, and verify in production.

## Current State

- [x] Restored context with the `continue` skill.
- [x] Confirmed `convex/rondas.ts` exports `getRonda`; the prior `FunctionPathNotFound` was deployment/runtime mismatch, not missing source code.
- [x] Ran `pnpm exec convex dev --once`; local Convex functions synced, but local E2E needs a long-running Convex process because `.env.local` points to `127.0.0.1:3212`.
- [x] Ran `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` successfully.
- [x] Deployed Convex production to `https://steady-kiwi-725.convex.cloud`.
- [x] Deployed Vercel production and aliased `https://calaire-app.vercel.app`.
- [x] Fixed `tests/e2e/sgc-fase2.auth.spec.ts` to use existing production ronda `kd77ck9jqbeafg5g61c7cw0vrh8756qr` instead of stale `kd7b0emdk7cmzp1vn34f2bfv7986bb77`.
- [x] Verified production with `PLAYWRIGHT_BASE_URL=https://calaire-app.vercel.app pnpm test:e2e tests/e2e/sgc-fase2.auth.spec.ts`: 2 passed.

## Critical Technical Context

- This project uses Next.js 16.2.4; read local docs in `node_modules/next/dist/docs/` before future Next changes.
- This project uses Convex; read `convex/_generated/ai/guidelines.md` before Convex edits.
- Package manager is `pnpm`.
- Playwright must use `/usr/bin/chromium`; the repo config already sets that executable for projects.
- Production Convex target is `steady-kiwi-725` / `https://steady-kiwi-725.convex.cloud`.
- Production app alias is `https://calaire-app.vercel.app`.
- `pnpm exec convex dev --once` can update `.env.local` to a local Convex URL but does not leave the local Convex HTTP service running for E2E.
- To run local E2E against `.env.local`, keep `pnpm exec convex dev` running while `pnpm test:e2e:start ...` starts Next.

## Next Steps

1. Commit the E2E fixture update and session logs if preserving this validation state in git.
2. For future SGC tests, prefer resolving a valid ronda from Convex or using a stable seeded fixture instead of hardcoding a stale ID.
