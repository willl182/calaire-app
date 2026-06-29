# Session State: calaire-app

**Last Updated**: 2026-06-29 11:14

## Session Objective

Implementar los 15 hallazgos de la revisión de código `cr-rev2.md` (CodeRabbit Review) en la rama feature/sgc-maestro-protv2.

## Current State

- [x] Derivar siguiente número de versión en `scripts/upload-sgc-document-versions.mjs`
- [x] Manejar errores de lanzamiento de `spawnSync`
- [x] Alinear denominador de `completado` en `convex/sgc/maestro.ts`
- [x] Computar resumen de normativa desde relaciones no filtradas
- [x] Resaltar sección SGC activa en `app/(protected)/sgc/layout.tsx`
- [x] Limpiar campo legacy `cambioResumen` y backfilling de `resumenCambios`
- [x] Marcar motivos de retiro como `required`
- [x] Usar `ronda.codigo` en lugar de `EA-PP-2026-R1`
- [x] Agregar `encType="multipart/form-data"` al formulario de evidencia
- [x] Incluir estado `disponible` en cálculo de progreso
- [x] Evitar hardcode de `EA-PP-2026-R1` en `ExpedienteSgc.tsx`
- [x] Mover mapa SGC fuera de `public/` a ruta protegida
- [x] Verificar UI de filtros del mapa (ya visible, sin `display: none`)
- [x] Proteger entradas SGC en `SidebarNav.tsx` con `canViewSgcMaestro`
- [x] No renderizar árbol sin providers en `app/providers.tsx`
- [x] `pnpm build` exitoso
- [x] `pnpm lint` exitoso
- [x] Actualizar `cr-rev2.md` con marcador `[completed]` en cada hallazgo

## Critical Technical Context

- Proyecto Next.js 16.2.4 + React 19 + Convex + Tailwind v4 + pnpm.
- El mapa SGC ahora se sirve desde `app/(protected)/dashboard/sgc/mapa/embed/route.ts` leyendo `data/sgc/mapa_navegacion_sgc_pea.html`, con validación `canViewSgcMaestro`.
- `app/(protected)/sgc/layout.tsx` se convirtió a cliente (`'use client'`) para usar `usePathname` y marcar la navegación activa.
- `DocumentoSgcVersion` ya no expone `cambioResumen`; las versiones se normalizan en `collectDocumentBundle` para garantizar `resumenCambios`.

## Next Steps

1. Desplegar/verificar en entorno de integración.
2. Continuar con próximos issues o revisiones pendientes de `cr-rev2.md` si los hay.
