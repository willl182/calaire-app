# Fase 2: Robustez frontend, offline y estados vacios

**Fecha**: 2026-07-01  
**Estado**: implementada con verificacion principal verde.

## Cambios implementados

- Agregado `safeConvexCallWithStatus` en `src/lib/convex-fallback.ts` para conservar fallback y exponer `offline`.
- Ampliada deteccion offline para `ETIMEDOUT`, `ECONNRESET`, `ENETUNREACH`, `UND_ERR_*` y cadenas `cause` anidadas.
- Agregadas lecturas `WithStatus` en `src/server/sgc/index.ts` para resumen SGC, normativa, mapa y panel SGC de ronda.
- Agregadas lecturas `WithStatus` en `src/server/rondas/client.ts` para ronda por id/codigo, listados admin, resumen de participantes, invitacion, asignacion participante, rondas de participante, metricas de ronda y datos PT.
- Unificado `/sgc` y `/dashboard/sgc` con `src/app/(protected)/sgc/SgcResumenView.tsx`.
- `dashboard/sgc/documentos`, `dashboard/sgc/normativa` y `dashboard/sgc/mapa` muestran `BackendOfflineBanner` y estados vacios reales.
- `/sgc/mapa` reutiliza la ruta de dashboard para no divergir.
- `/dashboard` admin deriva `backendOffline` de loaders `WithStatus`, por lo que el banner ya no depende de un `catch` inalcanzable.
- `/dashboard/rondas/[id]` distingue ronda inexistente de Convex offline y muestra banner si las metricas degradan por offline parcial.
- `/dashboard/rondas/[id]/sgc` muestra banner y expediente vacio controlado cuando no puede cargar panel SGC.
- `/ronda/[codigo]`, `/ronda/[codigo]/registro` y `/mi-dashboard` evitan confundir backend offline con recurso inexistente o ausencia real de rondas; `/mi-dashboard` renderiza estado offline-first cuando no puede cargar asignaciones.
- Agregados `loading.tsx` basicos en:
  - `src/app/(protected)/dashboard/loading.tsx`
  - `src/app/(protected)/dashboard/sgc/loading.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/loading.tsx`
  - `src/app/(protected)/ronda/[codigo]/loading.tsx`
  - `src/app/(protected)/mi-dashboard/loading.tsx`
- Ajustado `tests/e2e/sgc-cobertura.auth.spec.ts` para aceptar mapa con iframe o empty-state offline/sin relaciones.

## Verificacion ejecutada

- `pnpm lint`: verde.
- `pnpm test`: verde, 3 archivos / 23 aserciones reportadas por Vitest.
- `pnpm build`: verde.
- `pnpm test:e2e:start`: verde, 6 passed / 3 skipped intencionales por Convex offline o sin datos.
- `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9 pnpm test:e2e:start tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium`: verde, 4 passed / 1 skipped.
- Cierre F13-F15 (2026-07-01 00:14): `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes.

## Avances contra targets

- Target 2 queda cubierto para resumen SGC, centro documental, normativa y mapa: banner visible + estados vacios sin error boundary global.
- Target 3 queda cubierto para el alcance de Fase 2: rutas principales de ronda/participante distinguen offline de recurso inexistente, no convierten fallback `null` en 404 y muestran banner cuando lecturas de soporte degradan.
- Las mutaciones siguen sin fallback de exito simulado; cuando Convex no responde, se bloquean o muestran estado offline segun la ruta.

## Problemas y pendientes

- Durante Playwright con Convex offline aparece un `uncaughtException: Error: aborted` con `ECONNRESET` en el web server, pero la suite termina verde. Queda como deuda de limpieza de servidor/test harness.
- No se agregaron specs nuevas especificas para `/ronda/[codigo]` y `/dashboard/rondas/[id]/sgc` en modo offline; se valido por build y cobertura E2E SGC existente.
- Fase 3 sigue pendiente: seguridad Convex y migraciones publicas a internas.
- Cambios previos ajenos siguen presentes en screenshots, logs, `package.json`, `playwright.config.ts` y specs de Fase 1; no se revirtieron.

## Code review / fixes (2026-06-30)

Revision del cableado real offline por ruta. Detalle completo en [`review_fix.md`](review_fix.md).

**Resuelto por esta fase**: F1 (resumen SGC), F2 (`/dashboard/sgc`), F3 (subrutas `documentos`/`normativa`/`mapa`, incluido el empty-state real de normativa que en Fase 1 no existia) y F4 (deteccion offline recorre la cadena `cause` y cubre `ETIMEDOUT`/`ECONNRESET`/`ENETUNREACH`/`UND_ERR_*`). Bajo `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9` estas rutas muestran banner + estado vacio sin caer al error boundary.

**Cierre adicional 2026-07-01 00:14**: el patron raiz de F1 que persistia en F13-F15 queda corregido. Las rutas afectadas ya derivan `backendOffline` de resultados `WithStatus`, no de `try/catch` alrededor de lecturas que tragan offline.

| ID | Sev | Ruta | Estado | Fix aplicado |
|---|---|---|---|---|
| F13 | Alta | `/dashboard` (admin) | Resuelto | `loadAdminDashboardData` usa `listRondasWithStatus`, `listAllParticipantesWithStatus`, resumen de participantes y resultados PT `WithStatus`; `backendOffline` sale de `.offline` |
| F14 | Media | `/mi-dashboard` | Resuelto | Lecturas SGC de participante usan `WithStatus`; si offline deja de mostrar "sin rondas" y renderiza estado offline-first |
| F15 | Media | `/dashboard/rondas/[id]` | Resuelto | `getRondaMetricasCompletasWithStatus` agrega estado offline de participantes/resultados/PT y la pagina muestra `BackendOfflineBanner` con la ronda cargada |
| F16 | Baja | `/dashboard/rondas/[id]/sgc` | Deuda aceptada | Deshabilitar forms cuando `backendOffline && !panel` |
| F17 | Baja | `BackendOfflineBanner` | Deuda aceptada | Derivar host de `NEXT_PUBLIC_CONVEX_URL` o suavizar el texto |
| F18 | Baja | `/sgc/mapa` | Deuda aceptada | Parametrizar el mapa por `basePath` o aceptar deuda cosmetica |

Consecuencia sobre targets: Target 2 y Target 3 quedan cerrados para Fase 2. Fase 3 queda como siguiente fase activa.
