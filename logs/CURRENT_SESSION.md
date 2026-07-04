# Session State: calaire-app2 (feat-drive-sgc)

**Last Updated**: 2026-07-04 11:35

## Session Objective

Implementar `plan_ui_homogeneo.md`: homogeneizar UI/UX del navegador documental SGC entre el centro documental (`/sgc/documentos`) y el drive de ronda (`/dashboard/rondas/[id]/sgc`).

## Current State

- [x] Fase 1: primitivas compartidas creadas en `src/components/ui/drive/` (DriveIcons, DriveBreadcrumb, FolderCard, DocRow + DocMetaDot, DocGrid + `driveSplitGrid`, DriveDetailAside, DriveStatsBar, estadoTone).
- [x] Fase 2: centro documental (`src/app/(protected)/dashboard/sgc/documentos/page.tsx`) sobre primitivas: encabezados fusionados, KPIs como franja, filtros en línea (preservan carpeta activa), tabs falsos eliminados, "Crear documento maestro" en `<details>`, DocGrid de dos modos.
- [x] Fase 3: drive de ronda (`DriveDocumentalSgc.tsx`): DocRow compactos, root admin en `<details>` "Administrar carpeta raiz", banner Google solo si `!driveGoogleReady` (chip "Drive conectado" si listo), stats compartidas, aside con RecursoForms en secciones colapsables.
- [x] Fase 4 parcial: `pnpm build`, `pnpm lint`, `pnpm test` en verde; e2e del centro documental pasan.
- [ ] E2E de ronda (`sgc-fase2.auth.spec.ts`) fallan por 404: el `rondaId` fijo no existe en el backend Convex actual (dato, no UI).
- [ ] Revisión visual manual del drive de ronda pendiente (requiere ronda seed).
- [ ] Commits sin hacer (plan sugiere 3: primitivas / centro documental / ronda).

## Critical Technical Context

- El repo YA está migrado a `src/` pese a lo que dice AGENTS.md (rutas en `src/app`, alias `@/*` apunta a `src`).
- `/sgc/documentos` re-exporta `src/app/(protected)/dashboard/sgc/documentos/page.tsx` — ambas URLs sirven la misma página.
- `tests/e2e/sgc-fase2.auth.spec.ts` actualizado: espera "Administrar carpeta raiz" en vez de "Carpeta raiz Drive".
- Al correr e2e justo después de `pnpm build`, el dev server puede arrancar con `.next` viejo y todas las páginas fallan con `adapterFn is not a function`; reintentar arregla.
- El e2e "keeps the legacy SGC expedientes URL as a compatibility redirect" falla también sin estos cambios (preexistente).
- Server actions de ronda no cambiaron de contrato; todo es capa de presentación.

## Next Steps

1. Hacer los 3 commits sugeridos por el plan (o uno solo si se prefiere).
2. Conseguir/crear ronda seed y hacer revisión visual de las 4 URLs (raíz y carpeta en ambas vistas, breakpoints sm/lg).
3. Revisar el fallo preexistente del redirect legacy de expedientes.
