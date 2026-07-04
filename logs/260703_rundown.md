# Rundown: calaire-app2

**Date**: 2026-07-03

## Current State

- `.env.local` now points to production Convex at `https://steady-kiwi-725.convex.cloud`.
- Production Convex was deployed successfully with current functions.
- Production function spec confirms new `sgc/index.js:*` and `rondas/index.js:*` routes exist.
- Authenticated Dashboard E2E passes.
- SGC E2E remains blocked by local Next dev overlay: `adapterFn is not a function`, preceded by `Could not parse module '[project]/proxy.ts', file not found`.
- No `pnpm dev` server intentionally left running.

## Critical Technical Context

- The initial user-facing errors were real: local env pointed to an offline Convex local backend.
- After switching to production, Convex logs showed missing public functions for new `*/index:*` routes. `pnpm exec convex deploy --typecheck try` fixed that backend mismatch.
- Do not route frontend calls back to old Convex paths; the correct direction is new routes working in production.
- The remaining failure appears to be local Next 16.2.4/Turbopack/AuthKit proxy behavior, not Convex.

## Next Steps

1. Clean local Next state (`rm -rf .next`) and restart `pnpm dev`.
2. Verify `/dashboard/sgc` manually or with Playwright after the clean restart.
3. If `adapterFn` persists, inspect Next's generated middleware/proxy bundle and `src/proxy.ts` resolution.
4. Re-run the focused E2E command with `--workers=1`.

## Branch Status

- Branch: `feat-drive-sgc`
- Status: dirty
- Pending changes:
  - `.env.local` modified but ignored by git, not shown in `git status`.
  - `logs/CURRENT_SESSION.md` updated by saver.
  - `logs/260703_rundown.md` created by saver.
  - `logs/history/260703_0639_problems.md` created by saver.
  - Existing `logs/260702_rundown.md` was already modified before this save flow and was not intentionally edited here.
