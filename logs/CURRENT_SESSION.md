# Session State: calaire-app2

**Last Updated**: 2026-07-04 15:17 -0500

## Session Objective

Standardize the CALAIRE dashboard UI anatomy across dashboard result/registry/participant pages, SGC map, and round subpages, then deploy the current working tree to production.

## Current State

- [x] Replaced the incorrect "Dashboard global..." subtitle in the global results panel with "Matriz global de resultados por ronda o contaminante."
- [x] Normalized secondary KPI strips in global `Registros` and `Participantes` views to use the shared `sgc-kpis` / `sgc-kpi` pattern.
- [x] Updated `/dashboard/sgc/mapa` to use standard page anatomy: SGC header, KPI strip, filter strip, and card-framed map content.
- [x] Removed the redundant hero/header/toolbar inside `data/sgc/mapa_navegacion_sgc_pea.html`; controls are now owned by the app wrapper through `MapaSgcFrame`.
- [x] Added shared round header component `src/app/(protected)/dashboard/rondas/[id]/RondaPageHeader.tsx`.
- [x] Applied the same round subpage anatomy to round summary, PT config, participants, results, and SGC pages: subnav, shared round header, KPI strip, tabs/filters when applicable, then main content.
- [x] Verified locally with `pnpm lint`, `pnpm build`, and `pnpm test`.
- [x] Deployed to Vercel production. Production alias `https://calaire-app.vercel.app` points to deployment `dpl_G2beWf2oBseJFryVPdeYgy53GiNL`.
- [ ] Working tree remains dirty and not committed.

## Critical Technical Context

- The user's UI standard is page anatomy, not just colors or KPI CSS. For comparable pages, preserve this order: global/top nav, optional entity subnav, context header, KPI strip, filters/tabs, primary content.
- Round subpages must use the shared `RondaPageHeader`; do not let sections like "Resultados PT" or "SGC de la ronda" replace the round name as the main H1.
- KPI strips should use `sgc-kpis` and `sgc-kpi`; avoid returning to `card-accent` for KPI rows.
- `/dashboard/sgc/mapa/embed` is an embedded map surface. Do not reintroduce an internal full-page hero/header inside `data/sgc/mapa_navegacion_sgc_pea.html`.
- Vercel deploy was done directly from the local working tree with `vercel --prod --yes`; the changes are live but not committed to git.
- Current branch is `feat-drive-sgc`; there were pre-existing dirty files before this session, so do not assume every modified file was created by this turn.

## Next Steps

1. Review the live authenticated pages visually in production with a real admin session.
2. Commit the UI standardization changes separately from unrelated pre-existing dirty files.
3. If further UI drift appears, extract the repeated page anatomy into shared shell components rather than editing each page manually.
