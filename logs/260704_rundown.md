# Rundown: calaire-app2

**Date**: 2026-07-04

## Current State

- Morning: SGC document browser compacted and deployed to production (`04a0a7e`, alias `https://calaire-app.vercel.app`).
- Afternoon: `plan_ui_homogeneo.md` IMPLEMENTADO completo (Fases 1–3): primitivas compartidas en `src/components/ui/drive/` (DriveIcons, DriveBreadcrumb, FolderCard, DocRow, DocGrid + `driveSplitGrid`, DriveDetailAside, DriveStatsBar, estadoTone); centro documental y drive de ronda migrados al patrón único (DocRow compacto, DocGrid dos modos, aside/breadcrumb/stats/tonos unificados, root admin y "Crear documento" en `<details>`, banner Google solo si no está listo).
- Verificación: `pnpm build`, `pnpm lint`, `pnpm test` en verde. E2E del centro documental pasan; los de ronda fallan con 404 por `rondaId` seed inexistente en Convex (dato, no UI); el e2e del redirect legacy de expedientes falla también sin estos cambios (preexistente).
- Cambios sin commitear. Plan lifecycle copy: `logs/plans/260704_1123_plan_ui-homogeneo.md` → status ahora efectivamente completed (código); actualizar si se usa.

## Critical Technical Context

- Repo migrado a `src/` (AGENTS.md desactualizado); `/sgc/documentos` re-exporta la page de `src/app/(protected)/dashboard/sgc/documentos/page.tsx` — ambas URLs sirven lo mismo.
- `tests/e2e/sgc-fase2.auth.spec.ts` ahora espera "Administrar carpeta raiz" (antes "Carpeta raiz Drive").
- E2E corridos justo tras `pnpm build` pueden fallar en TODAS las páginas con `adapterFn is not a function` (`.next` de producción stale en dev); reintentar el run resuelve.
- Server actions y contratos Convex sin cambios; todo capa de presentación.
- `pnpm release` runs `git add -A` — avoid while `logs/` is dirty; deploy manually if needed.

## Next Steps

1. Commits sugeridos por el plan: `feat(ui): primitivas drive compartidas`, `refactor(sgc): centro documental sobre primitivas + layout compacto`, `refactor(sgc): drive de ronda homogéneo con centro documental`.
2. Revisión visual de las 4 URLs de referencia con una ronda seed real (breakpoints sm/lg); los e2e de ronda necesitan un `rondaId` válido.
3. Investigar el fallo preexistente del e2e del redirect legacy de expedientes.

## Branch Status

- Branch: `feat-drive-sgc`
- Status: dirty (in sync with origin at `04a0a7e`, nada commiteado esta sesión)
- Pending changes:
  - `src/components/ui/drive/` (nuevo, 8 archivos)
  - `src/app/(protected)/dashboard/sgc/documentos/page.tsx`, `src/app/(protected)/dashboard/rondas/[id]/sgc/DriveDocumentalSgc.tsx`
  - `tests/e2e/sgc-fase2.auth.spec.ts`
  - `plan_ui_homogeneo.md` (untracked)
  - Logs: `CURRENT_SESSION.md`, `260704_rundown.md`, `logs/history/260704_1135_findings.md`, más rundowns previos dirty (260702, 260703)
