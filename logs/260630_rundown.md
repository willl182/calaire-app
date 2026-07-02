# Rundown: calaire-app

**Updated**: 2026-06-30 22:41

## Current State

- **Fase 2 complete** (Targets 2-3): SGC offline UX and participante routes fully implemented.
- Banner offline and empty states working across: `/sgc`, `/dashboard/sgc`, `/dashboard/rondas/[id]/sgc`, `/ronda/[codigo]`, `/ronda/[codigo]/registro`, `/mi-dashboard`.
- `SgcResumenView` unified between `/sgc` and `/dashboard/sgc` to prevent divergence.
- E2E smoke testing deterministic and green: `pnpm test:e2e:start` passes 6 specs + intentional skips; offline cobertura suite passes 4 + 1 skip with `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9`.
- All CI checks pass: `pnpm lint`, `pnpm test`, `pnpm build`.

## Critical Technical Context

- **Key pattern**: `safeConvexCallWithStatus` returns `{ data, offline }` to allow UI to distinguish:
  - `data: null, offline: false` → resource not found → use `notFound()`
  - `data: null, offline: true` → Convex unavailable → show offline UI
- **Important**: Do not revert prior work:
  - Fase 1-3 screenshots in `docs/screenshots/fase-3/`
  - Logs, specs, playwright config, package.json changes
  - Untracked files: fase0.5.md, fase1-2.md, plan_fix.md, target_fix.md, review_fix.md, workflow_fix.md, diagnostico.md
- **Known debt**: Playwright reports `ECONNRESET` on web server during offline mode, but test suite exits green. Investigate post-Fase 3.
- **Branch**: feature/t3-estructura-segura (dirty, ~25 modified files + untracked documentation)

## Next Steps

1. **Fase 3 / Targets 4-5**: Convex authorization rules and internal-only query migration.
2. Optionally: Add dedicated offline E2E specs for dynamic routes (ronda/participante).
3. Post-Fase-3: Clean up ECONNRESET web server logging during offline mode.

## Branch Status

- Branch: `feature/t3-estructura-segura`
- Status: dirty
- Pending changes: 25 modified files (mostly routes, server logic, tests) + 37+ untracked (documentation, loading.tsx, helpers, new specs)
