# Plan: Implementación de la Gestión SGC en CALAIRE-APP

**Created**: 2026-06-07 16:07
**Updated**: 2026-06-07 16:07
**Status**: approved
**Slug**: gestion-sgc

## Objetivo

Implementar la Fase 1 de la gestión digital del Sistema de Gestión de Calidad (SGC) en CALAIRE-APP. Esto incluye el Panel SGC, la carga de documentos específicos por ronda en Convex storage, y los flujos/campos para F-PSEA-06 (Plan de Ronda), F-PSEA-08 (Preparación del Ítem) y F-PSEA-13 (Revisión de Datos).

## Fases

### Fase 1: Base de Datos y Backend (Convex)

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 1.1 | [schema.ts](file:///home/w182/w421/calaire-app/convex/schema.ts) | Modificar | Agregar las nuevas tablas `rondaDocumentos` y `rondaHitos`, y campos adicionales en `rondas` y `rondaContaminantes`. |
| 1.2 | `convex/sgc.ts` | Crear | Consultas (queries) y mutaciones para la carga de documentos e hitos del cronograma. |

### Fase 2: Interfaz de Usuario (Dashboard Admin)

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 2.1 | [SidebarNav.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/SidebarNav.tsx) | Modificar | Agregar sección de SGC para los administradores. |
| 2.2 | `app/(protected)/dashboard/sgc/page.tsx` | Crear | Vista principal del Panel SGC con estado de cumplimiento por ronda y gestor de carga de archivos. |
| 2.3 | Vista de detalle de ronda | Modificar | Añadir las pestañas para configurar Plan de Ronda, Preparación Ítem y realizar el Checklist de Revisión de Datos. |

## Log de Ejecución

- [x] Plan de diseño definido en la sesión de grill-me.
- [ ] Fase 1 iniciada.
- [ ] Fase 1 completada.
- [ ] Fase 2 iniciada.
- [ ] Fase 2 completada.
