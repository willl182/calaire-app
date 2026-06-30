# Session State: calaire-app

**Last Updated**: 2026-06-30 15:34 -05

## Session Objective

Reconciliar el plan de migración T3, resolver los fallos locales de Playwright/Turbopack, verificar el funcionamiento y documentar los registros del backend.

## Current State

- [x] **Fase 0 - Fase 7**: Totalmente aplicadas y verificadas funcionalmente. La reorganización a la estructura T3 (@/app -> src/app, etc.) está completa.
- [x] **Fase 8 (Documentación)**: README.md, AGENTS.md y .env.example actualizados y alineados.
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

## Critical Technical Context

- Las consultas de servidor de Next.js se conectan a Convex en el puerto 3212 (`NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3212`).
- Si el backend local no está levantado, las páginas protegidas (`/dashboard`, `/sgc`) que ejecutan `fetchQuery` lanzarán un error runtime de `fetch failed (ECONNREFUSED)`.

## Next Steps

1. Levantar el backend de Convex (`pnpm exec convex dev`) para que las consultas al puerto 3212 respondan correctamente.
2. Iniciar el servidor local (`pnpm dev`) y abrir `http://localhost:3000`.
3. Validar el flujo de autenticación completo (WorkOS AuthKit).
