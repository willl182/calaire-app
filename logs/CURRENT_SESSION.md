# Session State: SGC Layout Alignment (calaire-app)

**Last Updated**: 2026-06-09 06:41

## Session Objective

Align `/dashboard/sgc` to the same dashboard base layout as the other admin views and keep the width identical to `Participantes`.

## Current State

- [x] Reuse the same `header-bar` identity block used by the other dashboard views.
- [x] Move SGC into the same `max-w-7xl` page wrapper and keep the internal tabs as content, not as a separate layout shell.
- [x] Add SGC KPI cards and keep the summary section ordering consistent with the rest of the dashboard.
- [x] Fix the accessible label for the coverage filter checkbox so the authenticated Playwright spec keeps passing.
- [x] Verify locally with `pnpm lint` and `pnpm build`.
- [x] Deploy the layout correction to Vercel production.
- [x] Verify the production alias passes the authenticated SGC Playwright spec.
- [x] Measure the rendered width of `/dashboard/sgc` against `/dashboard?tab=participantes` in production.

## Critical Technical Context

- The production alias is `https://calaire-app.vercel.app`.
- The SGC layout now matches the base dashboard wrapper and measures the same as `Participantes`: `x=275`, `width=1280`, `right=1555` at desktop width `1830`.
- The authenticated Playwright spec `tests/e2e/sgc-cobertura.auth.spec.ts` passes against production.
- The relevant files are `app/(protected)/dashboard/sgc/page.tsx`, `app/(protected)/dashboard/sgc/layout.tsx`, `app/(protected)/dashboard/sgc/SgcResumenClient.tsx`, `app/(protected)/dashboard/sgc/SgcTabs.tsx`, and `app/(protected)/dashboard/sgc/TableroCoberturaRondas.tsx`.

## Next Steps

1. Keep future SGC UI changes inside the shared dashboard width and wrapper pattern.
2. If a later visual tweak touches the tabs or board table, re-run the width measurement against `/dashboard?tab=participantes`.
