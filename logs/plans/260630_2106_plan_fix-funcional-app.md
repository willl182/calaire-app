# Plan: Recuperacion funcional de calaire-app

**Created**: 2026-06-30 20:58 -05
**Updated**: 2026-06-30 22:11 -05
**Status**: in_progress
**Slug**: fix-funcional-app

## Objetivo

Llevar `calaire-app` a un estado funcional verificable: `pnpm lint`, `pnpm test`, `pnpm build` y la suite E2E principal verdes, rutas SGC/rondas/participante resilientes a Convex vacio u offline, brechas Convex criticas cerradas.

## Documentos raiz

| Archivo | Rol | Estado |
|---|---|---|
| `plan_fix.md` | Plan estrategico por fases (Fase 0–5 + 0.5) | Complementado |
| `workflow_fix.md` | Workflow operativo de ejecucion | Complementado |
| `target_fix.md` | Targets medibles y verificaciones (T0–T10) | Complementado |
| `diagnostico.md` | Fuente de verdad del estado inicial | Referencia |

## Fases

### Fase 0.5: Precondiciones (nueva)

| # | Accion | Estado |
|---|---|---|
| 0.5.1 | Preflight de entorno: Convex env, AUTH_TEST_*, .auth/workos.json | Ejecutado: Convex env falta, `.auth/workos.json` existe, `AUTH_TEST_*` ausentes |
| 0.5.2 | Fijar gate de cierre segun auth disponible o degradado | Ejecutado: smoke publico verde; autenticado depende de cache/credenciales |
| 0.5.3 | Definir mecanismo offline deterministico | Documentado |
| 0.5.4 | Confirmar no-conflicto Fase3↔Fase5 (migraciones vs seed) | Verificado |
| 0.5.5 | Code review de afirmaciones de Fase 0.5 | Cerrado: F1-F5 registrados en `review_fix.md` |
| 0.5.6 | Cierre de fase documental | Cerrado: siguiente fase activa es Target 1 / Fase 1 |

### Fase 0: Baseline reproducible

| # | Accion | Estado |
|---|---|---|
| 0.1 | `pnpm lint && pnpm test && pnpm build && pnpm test:e2e:start` | Ejecutado: lint/test/build verdes; E2E principal rojo |
| 0.2 | Registrar specs fallidas y estado Convex/auth | Ejecutado |

### Fase 1: E2E funcional y desacoplado de datos exactos

| # | Archivo | Accion | Estado |
|---|---|---|---|
| 1.1 | `tests/e2e/sgc-fase2.auth.spec.ts` | Remover IDs hardcodeados | Ejecutado |
| 1.2 | `tests/e2e/sgc-cobertura.auth.spec.ts` | Ajustar selectores y redirects | Ejecutado |
| 1.3 | playwright.config.ts / package.json | Separar screenshots en suite dedicada | Ejecutado |
| 1.4 | `tests/e2e/sgc-cobertura.auth.spec.ts` | Cerrar F9: quitar rama muerta de empty-state de normativa | Ejecutado |

### Fase 2: Robustez frontend, offline y estados vacios

| # | Archivo | Accion | Estado |
|---|---|---|---|
| 2.1 | `src/app/(protected)/dashboard/sgc/page.tsx` | Igualar fallback offline de `/sgc` | Pendiente |
| 2.2 | Rutas rondas/participante | Estados vacios y 404 controlados | Pendiente |
| 2.3 | Rutas principales | Agregar `loading.tsx` basicos | Pendiente |

### Fase 3: Seguridad Convex

| # | Archivo | Accion | Estado |
|---|---|---|---|
| 3.1 | `convex/rondas`, `convex/fichas`, `convex/pt` | `getUserIdentity()` en funciones publicas protegidas | Pendiente |
| 3.2 | `convex/migrations.ts` | Pasar ~13 mutaciones a `internalMutation` | Pendiente |
| 3.3 | Queries Convex | Acotar lecturas e indexar | Pendiente |
| 3.4 | tests | Prueba `convex-test` de "sin identidad falla" | Pendiente |

### Fase 4: Infraestructura

| # | Archivo | Accion | Estado |
|---|---|---|---|
| 4.1 | `package.json` | `pnpm add zod @t3-oss/env-nextjs` | Pendiente |
| 4.2 | `.gitignore` + `git rm --cached` | Desindexar artefactos ya trackeados | Pendiente |
| 4.3 | CI opcional | Pipeline lint/test/build | Pendiente |

### Fase 5: Cierre funcional

| # | Accion | Estado |
|---|---|---|
| 5.1 | Suite completa verde o con omisiones documentadas | Pendiente |
| 5.2 | Actualizar `diagnostico.md` con resultado final | Pendiente |

## Log de Ejecucion

- [x] Plan raiz creado en `plan_fix.md` (sesion 20:58).
- [x] Workflow raiz creado en `workflow_fix.md` (sesion 20:58).
- [x] Targets raiz creados en `target_fix.md` (sesion 20:58).
- [x] Fase 0.5 incorporada al plan (sesion 21:06): arbol de decision auth, offline deterministico, confirmacion de no-conflicto Fase3↔5.
- [x] Targets 4, 5, 8, 10 reforzados/creados (sesion 21:06).
- [x] Estado persistido con `saver` (sesion 21:06).
- [x] Preflight de entorno (0.5.1–0.5.2) ejecutado (sesion 21:15): Convex env falta, `.auth/workos.json` existe, `AUTH_TEST_*` ausentes.
- [x] Baseline (Fase 0) ejecutado (sesion 21:15): `pnpm lint`, `pnpm test`, `pnpm build` verdes; `pnpm test:e2e:start` falla con 8 specs SGC; smoke publico `--project=chromium` verde.
- [x] Code review de Fase 0.5 ejecutado (sesion 21:25): F1-F5 registrados en `review_fix.md`; F1-F3 pasan a Fase 2, F5 permanece en Fase 3.
- [x] Fase 0.5 cerrada documentalmente (sesion 21:27): sin cambios de producto por alcance.
- [x] Fase 1 / Target 1 implementada (sesion 21:38): `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e:start --project=chromium` y `pnpm test:e2e:start` verdes; 3 skips data-backed intencionales por Convex offline/sin datos.
- [x] Fase 1 cerrada tras code review (sesion 22:11): F9 resuelto; `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes; siguiente fase activa Target 2 / Fase 2.
