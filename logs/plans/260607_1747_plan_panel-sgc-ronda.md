# Plan: Panel SGC por ronda

**Created**: 2026-06-07 17:47
**Updated**: 2026-06-07 17:47
**Status**: draft
**Slug**: panel-sgc-ronda

## Objetivo

Implementar una pestaña SGC por ronda que centralice registros nativos, evidencias por archivo, plan de ronda, revisión de datos, plantillas de comunicación y cierre documental.

## Fases

### Fase 1: Catálogo y estado de ronda

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 1.1 | `convex/_generated/ai/guidelines.md` | Leer | Obligatorio antes de editar Convex. |
| 1.2 | `node_modules/next/dist/docs/` | Leer | Obligatorio antes de editar Next. |
| 1.3 | `lib/sgc/catalog.ts` | Crear | Catálogo versionado de formatos y modos. |
| 1.4 | `convex/schema.ts` | Modificar | Agregar `documentacion_pendiente` y tablas SGC. |
| 1.5 | `convex/rondas.ts` | Modificar | Actualizar transiciones y bloqueo de cierre. |

### Fase 2: Evidencias y storage

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 2.1 | `convex/schema.ts` | Modificar | Tabla `sgcEvidencias`. |
| 2.2 | `convex/sgc.ts` | Crear | Mutations/queries para subir/listar evidencias. |
| 2.3 | `app/(protected)/dashboard/rondas/[id]/sgc/` | Crear | UI de carga simple: solo archivo. |

### Fase 3: Plan de ronda y F-13

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 3.1 | `lib/sgc/templates.ts` | Crear | Plantilla F-PPSEA-03 con bloques `a` a `u`. |
| 3.2 | `convex/sgc.ts` | Modificar | Plan de ronda, F-13, snapshots y audit log. |
| 3.3 | `app/(protected)/dashboard/rondas/[id]/sgc/` | Modificar | Editores F-PPSEA-03 y F-13. |

### Fase 4: PDF imprimible y plantillas P-20

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 4.1 | `app/(protected)/dashboard/rondas/[id]/sgc/` | Modificar | Vistas imprimibles para F-PPSEA-03/F-13. |
| 4.2 | `docs/sgc/comunicaciones/` | Crear | Plantillas P-20 Markdown con variables explícitas. |
| 4.3 | `app/(protected)/dashboard/rondas/[id]/sgc/` | Modificar | Enlaces a plantillas P-20. |

### Fase 5: Validación de flujo

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 5.1 | `app/(protected)/ronda/[codigo]/` | Modificar | Bloquear edición/envío en `documentacion_pendiente`. |
| 5.2 | `app/(protected)/dashboard/rondas/[id]/actions.ts` | Modificar | Transiciones `activa -> documentacion_pendiente -> cerrada`. |
| 5.3 | `app/(protected)/dashboard/rondas/[id]/sgc/` | Verificar | Mostrar bloqueantes de cierre y cobertura completa. |

## Log de Ejecución

- [x] Plan de alcance creado en `plan_oc.md`.
- [x] Registro grill-me creado en `grillme_oc.md`.
- [ ] Fase 1 iniciada.
- [ ] Fase 1 completada.
- [ ] Fase 2 completada.
- [ ] Fase 3 completada.
- [ ] Fase 4 completada.
- [ ] Fase 5 completada.
