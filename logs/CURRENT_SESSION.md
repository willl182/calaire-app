# Session State: calaire-app

**Last Updated**: 2026-06-29 11:30

## Session Objective

Iniciar la migración estructural del repo a layout T3 según `PLAN_MIGRACION_T3.md`, siguiendo `workflow_t3.md` y validando `targets_t3.md`.

## Current State

- [x] Commiteados cambios pendientes de cr-rev2 en `main`.
- [x] Rama `feature/t3-estructura-segura` creada desde `main` limpio.
- [ ] Fase 0: Preparación (deps, carpetas, inventarios).
- [ ] Fase 1: Andamiaje mínimo (`src/env.js`, `src/lib/utils.ts`).
- [ ] Fase 2: `app/` → `src/app/`.
- [ ] Fase 3: `lib/` → `src/server/<dominio>/`.
- [ ] Fase 4: `proxy.ts` → `src/middleware.ts`.
- [ ] Fase 5: `convex/` por dominios.
- [ ] Fase 6: `process.env.X!` → `env.X`.
- [ ] Fase 7: UI primitivos en `src/components/ui/`.
- [ ] Fase 8: Limpieza final y documentación.

## Critical Technical Context

- Proyecto Next.js 16.2.4 + React 19 + Convex + Tailwind v4 + pnpm.
- Layout actual: `app/`, `lib/`, `convex/`, `proxy.ts` en raíz.
- Objetivo T3: `src/app/`, `src/server/<modulo>/`, `src/components/`, `src/lib/`, `src/middleware.ts`, `src/env.js`.
- **No se introduce tRPC**; se mantienen Server Actions + hooks Convex.
- Alias único: `@/* -> ./src/*`.
- Estrategia: copiar antes de borrar, puentes temporales, build verde al final de cada fase.

## Next Steps

1. Ejecutar Fase 0: instalar deps, crear carpetas, generar inventarios de seguridad.
2. Commitear Fase 0 verificada con `pnpm build` verde.
3. Continuar con Fase 1.
