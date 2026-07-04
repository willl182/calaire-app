# Rundown: calaire-app2

**Date**: 2026-07-04

## Current State

- UI standardization changes are live in production at `https://calaire-app.vercel.app`.
- Vercel production deployment is `dpl_G2beWf2oBseJFryVPdeYgy53GiNL`, status `READY`.
- Local verification passed: `pnpm lint`, `pnpm build`, and `pnpm test`.
- Global results copy was corrected from "Dashboard global..." to "Matriz global de resultados por ronda o contaminante."
- KPI strips were normalized for global Registros/Participantes and SGC map.
- Round pages now share `RondaPageHeader` and follow the same page order across summary, configuración PT, participantes, resultados, and SGC.
- SGC map now has app-owned filters/KPIs and the embedded HTML no longer renders its own page hero.

## Critical Technical Context

- The UI standard means consistent page anatomy: nav, optional entity subnav, context header, KPI strip, filters/tabs, primary content.
- Use `sgc-kpis` / `sgc-kpi` for KPI rows; avoid `card-accent` for comparable KPI bands.
- Round pages should keep the round name as the main H1 through `RondaPageHeader`.
- `/dashboard/sgc/mapa/embed` should remain an embedded map surface, not a nested standalone page.
- Production was deployed directly from the dirty local working tree; changes are live but not committed.

## Next Steps

1. Visually verify authenticated production routes with an admin account.
2. Commit only the intended UI standardization files, keeping unrelated dirty work separate.
3. Consider extracting more shared shell primitives if future SGC/dashboard pages drift again.

## Branch Status

- Branch: `feat-drive-sgc`
- Status: dirty
- Pending changes:
  - `data/sgc/mapa_navegacion_sgc_pea.html`
  - `logs/CURRENT_SESSION.md`
  - `logs/260704_rundown.md`
  - `src/app/(protected)/dashboard/components/DirectorioPanel.tsx`
  - `src/app/(protected)/dashboard/components/RegistrosPanel.tsx`
  - `src/app/(protected)/dashboard/components/ResultadosPanel.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/RondaPageHeader.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/page.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/configuracion-pt/page.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/participantes/page.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/resultados/page.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/sgc/page.tsx`
  - `src/app/(protected)/dashboard/sgc/mapa/page.tsx`
  - `src/app/(protected)/dashboard/sgc/mapa/MapaSgcFrame.tsx`
  - `src/app/globals.css`
  - Additional pre-existing dirty UI/SGC/log files remain in the worktree.
