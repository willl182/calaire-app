# Session State: FT2 Expediente SGC Closed at MVP

**Last Updated**: 2026-06-09 22:50 America/Bogota

## Session Objective

Stop FT2 work at the completed MVP boundary, preserving what is done and what remains for post-MVP Etapa 9.

## Current State

- [x] FT2 `plan_ft2.md` MVP is implemented.
- [x] `roadmap_ft2.md` is complete through Etapa 8 / Milestone 3.
- [x] Production Convex and Vercel deployments were completed in prior commits.
- [x] Focused production E2E for the SGC expediente passed in prior validation.
- [x] Native SGC round plan blocks `a` through `u` were integrated and committed in `9bf1d7c`.
- [x] User confirmed we can stop at the current scope boundary.

## Critical Technical Context

- Current branch is `main`.
- Working tree was clean before this saver update.
- Latest relevant commits:
  - `9bf1d7c feat: implement blocks a-u in SGC round plan editor and print layout`
  - `cfa5a36 Validate SGC expediente in production`
  - `b755610 Implement SGC expediente`
- Production app alias: `https://calaire-app.vercel.app`.
- Production Convex target: `steady-kiwi-725` / `https://steady-kiwi-725.convex.cloud`.
- Etapa 9 remains post-MVP and intentionally unimplemented.

## Next Steps

1. If work resumes, start with Etapa 9 only after selecting one concrete improvement with acceptance criteria.
2. Recommended Etapa 9 order: historial expandible por formato, export del expediente documental, progreso de carga, filtros internos, drag and drop, vista participante solo lectura.
3. For future E2E hardening, replace hardcoded production ronda IDs with seeded or dynamically discovered fixtures.
