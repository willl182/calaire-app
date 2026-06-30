# Session State: calaire-app

**Last Updated**: 2026-06-30 18:00 -05

## Session Objective

Reconciliar el plan de migración T3, resolver los fallos locales de Playwright/Turbopack, verificar el funcionamiento y documentar los registros del backend.

## Current State

- [x] **Fase 0 - Fase 8**: Totalmente aplicadas y verificadas funcionalmente. La reorganización a la estructura T3 (@/app -> src/app, etc.) está completa.
- [x] **Resolución del Bloqueador Playwright**:
  - Se eliminó el `.git` padre vacío en `/home/w182/w421` que confundía la raíz de Turbopack.
  - Se añadió `.npmrc` con directivas de hoist para `tailwindcss`.
  - Se limpió `.next/` cache.
  - E2E smoke tests pasando en 5.9s.
- [x] **Verificación del Aplicativo**:
  - Ejecución de `pnpm dev` exitosa.
  - Smoke tests de endpoints retornan HTTP 200 en rutas públicas (`/`, `/login`) y HTTP 307 (Redirect) en protegidas (`/dashboard`, `/sgc`).
- [x] **Historial de Errores**:
  - Documentados logs de fallos `ECONNREFUSED 127.0.0.1:3212` cuando el servidor local de Convex no está activo (`260630_1529_problems.md` y `260630_1530_problems.md`).
- [x] **Resiliencia frente a Convex offline** (`260630_1550_findings.md`):
  - Helper `src/lib/convex-fallback.ts` con `isConvexOffline(error)` y `safeConvexCall(op, fn, fallback)`.
  - `listRondas`, `loadAdminDashboardData` y `SgcPage` degradan a estado vacío + bandera `backendOffline` en vez de lanzar `TypeError: fetch failed`.
  - Banneres ámbar en `/dashboard` y `/sgc` que guían al usuario a iniciar `pnpm exec convex dev`.
  - `error.tsx` de respaldo añadidos en `(protected)/dashboard` y `(protected)/sgc` que distinguen entre error de Convex y error genérico.
  - 7 tests iniciales en `src/lib/convex-fallback.test.ts`.
- [x] **Extensión del fallback offline a todas las lecturas** (esta sesión, pendiente commitear):
  - 27 wraps nuevos en `src/server/rondas/client.ts` (todas las lecturas: `getRonda`, `listParticipantes`, `listAllParticipantes`, `listPTItems`, `listPTSampleGroups`, `getRondaParticipantePT`, `listEnviosPT`, `getEnvioPT`, `getEstadoEnvioParticipante`, `getEstadoEnvioPTParticipante`, `isInvitado`, etc.).
  - 19 wraps nuevos en `src/server/sgc/index.ts` (`getPanelSgc`, `listSgcMaestro`, `listNormativaSgc`, `listMapaSgc`, `listExpedientesSgc`, `getHitosVisibleParticipante`, `getEvidenciasPublicas`, `listPublicaciones`, `listMisComentariosRonda`, `listMisNotificaciones`, `getSgcDownloadUrl`, etc.).
  - 6 wraps nuevos en `src/server/rondas/fichas.ts` (`getFichaByRondaParticipante`, `getFichaResumenByRondaParticipante`, `findFichaTemplateByLookup`, `getFichasResumenByRpIds`, `listFichaResumenesByRonda`).
  - Las mutaciones (`fetchMutation`) se dejan sin envolver: deben fallar ruidosamente para que el usuario sepa que la operación no se completó.
  - 7 tests adicionales en `src/lib/convex-fallback.test.ts` (ENOTFOUND, EAI_AGAIN, code en error directo, contador de invocaciones en camino feliz y offline). Total 14 tests.
- [x] **Componentes compartidos para errores y banners**:
  - `src/components/ui/ConvexErrorView.tsx`: cliente que renderiza la tarjeta de error con la detección `isConvexOffline` y un botón de reintento. Reemplaza el código duplicado en `error.tsx`.
  - `src/components/ui/BackendOfflineBanner.tsx`: banner ámbar reutilizado en `dashboard/page.tsx` y `sgc/page.tsx`.
- [x] **Cobertura de error.tsx ampliada**:
  - `src/app/(protected)/mi-dashboard/error.tsx`
  - `src/app/(protected)/ronda/[codigo]/error.tsx`
  - `src/app/(protected)/ronda/[codigo]/registro/error.tsx`
  - `src/app/(protected)/dashboard/rondas/[id]/error.tsx`
  - Las tres `error.tsx` existentes refactorizadas para usar `ConvexErrorView`.
- [x] **Verificación final**: `pnpm exec tsc --noEmit` verde, `pnpm lint` verde, `pnpm test` 14 tests pasan, `pnpm build` genera las 26 páginas dinámicas sin errores.

## Critical Technical Context

- Las consultas de servidor de Next.js se conectan a Convex en el puerto 3212 (`NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3212`).
- El helper `@/lib/convex-fallback` es la fuente canónica para detectar ECONNREFUSED/ENOTFOUND/EAI_AGAIN. Detecta por `cause.code`, `error.code` y mensaje (`fetch failed` / `ECONNREFUSED`).
- Las lecturas en `src/server/rondas/{client,fichas}.ts` y `src/server/sgc/index.ts` están todas protegidas con `safeConvexCall`. Las mutaciones siguen lanzando errores para que la UI los reporte correctamente.
- Si el backend local no está levantado, las páginas protegidas renderizan UI con datos vacíos (y `BackendOfflineBanner` donde corresponde) en lugar de un error de runtime.

## Next Steps

1. Commitear los cambios como `t3(fase7-deps): extender safeConvexCall a todas las lecturas + error.tsx compartidos`.
2. Levantar el backend de Convex (`pnpm exec convex dev`) para validar el flujo con datos reales.
3. Iniciar el servidor local (`pnpm dev`) y abrir `http://localhost:3000`.
4. Validar el flujo de autenticación completo (WorkOS AuthKit).
5. Considerar añadir una suite Playwright que verifique el banner ámbar en cada ruta protegida cuando Convex está offline.

