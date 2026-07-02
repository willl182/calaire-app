# Rundown: CALAIRE App

**Date**: 2026-07-01

## Current State

- Se documentó la feature Drive documental SGC en `plan_drive.md`, `workflow_drive.md` y `targets_drive.md`.
- Se revisó `featv3.md`, Convex AI guidelines y docs locales de Next 16 relevantes.
- Se inspeccionó el tutorial `t3dotgg/drive-tutorial`; se decidió adaptar solo el patrón Drive-like, no el stack.
- Hay un cambio aplicado en `convex/schema.ts`: tabla `sgcDriveRecursos`.
- No se implementaron funciones/backend/UI todavía.
- No se corrieron codegen/build/lint/tests tras el cambio de esquema.

## Critical Technical Context

- Stack real: Next.js + WorkOS/AuthKit + Convex.
- No usar Drizzle, Prisma, NextAuth, Clerk ni UploadThing del tutorial.
- El repo real todavía usa `app/` y `lib/`, aunque las instrucciones mencionan `src/`; no crear estructura paralela sin migración explícita.
- Para Convex, leer `convex/_generated/ai/guidelines.md` antes de continuar.
- MVP recomendado: expediente virtual/manual con enlaces Drive; Google Drive API después de definir credenciales y ownership.

## Next Steps

1. Decidir si se conserva el cambio actual de `sgcDriveRecursos` en `convex/schema.ts`.
2. Ejecutar `pnpm exec convex codegen` y corregir cualquier problema de schema.
3. Implementar funciones Convex de Target 3 en `targets_drive.md`.
4. Agregar wrappers `lib/sgc`, server actions y UI en `/dashboard/rondas/[id]/sgc`.

## Branch Status

- Branch: `main`
- Status: dirty, ahead 2, behind 1 relative to `origin/main`
- Pending changes: `convex/schema.ts`, `plan_drive.md`, `workflow_drive.md`, `targets_drive.md`, nuevos archivos en `logs/`
