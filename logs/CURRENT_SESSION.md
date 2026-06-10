# Session State: SGC Round Plan Blocks Integration (calaire-app)

**Last Updated**: 2026-06-09 22:45

## Session Objective

Ensure the native Round Plan (`F-PPSEA-03` / `F-PSEA-06`) page displays and allows editing/printing of all blocks from `a` to `u` in the SGC interface, aligning with the real-world planning template `Planificacion_R1_PP (1).md`.

## Current State

- [x] Align SGC panel and `/dashboard/sgc` layout to match the base dashboard.
- [x] Create a scrollable form viewport to edit all blocks from `a` to `u` dynamically inside `app/(protected)/dashboard/rondas/[id]/sgc/page.tsx`.
- [x] Implement formal template labels on the printable page (`app/(protected)/dashboard/rondas/[id]/sgc/plan/print/page.tsx`) mapping all 21 blocks from `a` to `u`.
- [x] Verify local build (`pnpm build`) and code linting (`pnpm lint`).
- [x] Run and pass Playwright E2E tests (`pnpm test:e2e:start tests/e2e/sgc-cobertura.auth.spec.ts --workers=1`).

## Critical Technical Context

- The plan blocks are retrieved and saved via `guardarPlanRondaAction` in `actions.ts`.
- The UI controls are styled to scroll vertically up to `max-h-[500px]` to keep visual consistency.
- Relevant files are `app/(protected)/dashboard/rondas/[id]/sgc/page.tsx` and `app/(protected)/dashboard/rondas/[id]/sgc/plan/print/page.tsx`.

## Next Steps

1. Keep future additions to structured plan forms inside scrollable containers to preserve layout symmetry.
2. If new blocks are added to the schema in the future, ensure they are registered in both `PLAN_BLOQUES_INFO` (page.tsx) and `BLOQUE_LABELS` (print/page.tsx).
