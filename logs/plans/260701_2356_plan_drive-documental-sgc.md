# Plan: Drive documental SGC por ronda

**Created**: 2026-07-01 23:56
**Updated**: 2026-07-01 23:56
**Status**: draft
**Slug**: drive-documental-sgc

## Objetivo

Implementar una experiencia tipo Google Drive clone para el expediente documental SGC de cada ronda, adaptada a CALAIRE App con Next.js, WorkOS y Convex.

## Fases

### Fase 1: Documentación y diseño

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 1.1 | `plan_drive.md` | Crear | Plan por fases, con MVP manual e integración Google API posterior. |
| 1.2 | `workflow_drive.md` | Crear | Workflow detallado por actor, estado y operación. |
| 1.3 | `targets_drive.md` | Crear | Targets de entrega, aceptación y verificación. |

### Fase 2: Modelo Convex

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 2.1 | `convex/schema.ts` | Modificar | Añadir `sgcDriveRecursos` para carpetas/documentos/enlaces Drive por ronda. |
| 2.2 | `convex/_generated/*` | Regenerar | Ejecutar `pnpm exec convex codegen`. |

### Fase 3: API Convex

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 3.1 | `convex/sgc/drive.ts` | Crear | Queries/mutations: listar, inicializar, actualizar estado, retirar. |
| 3.2 | `convex/sgc.ts` | Modificar | Exportar funciones públicas de Drive documental. |
| 3.3 | `convex/sgc/shared.ts` | Modificar | Helpers si hacen falta para permisos/auditoría. |

### Fase 4: Capa server-side y UI

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 4.1 | `lib/sgc/index.ts` | Modificar | Wrappers con `fetchQuery`/`fetchMutation` y token WorkOS. |
| 4.2 | `app/(protected)/dashboard/rondas/[id]/sgc/actions.ts` | Modificar | Server actions para formularios. |
| 4.3 | `app/(protected)/dashboard/rondas/[id]/sgc/DriveDocumentalSgc.tsx` | Crear | UI tipo Drive dentro del panel SGC. |
| 4.4 | `app/(protected)/dashboard/rondas/[id]/sgc/page.tsx` | Modificar | Incluir componente Drive documental. |

## Log de Ejecución

- [x] Fase 1 completada.
- [x] Fase 2.1 iniciada con cambio de esquema.
- [ ] Fase 2.2 pendiente.
- [ ] Fase 3 pendiente.
- [ ] Fase 4 pendiente.
