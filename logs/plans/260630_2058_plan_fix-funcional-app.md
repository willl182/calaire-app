# Plan: Recuperacion funcional de calaire-app

**Created**: 2026-06-30 20:58 -05  
**Updated**: 2026-06-30 20:58 -05  
**Status**: draft  
**Slug**: fix-funcional-app

## Objetivo

Ejecutar el proceso documentado en `plan_fix.md`, `workflow_fix.md` y `target_fix.md` para que `calaire-app` quede funcional de punta a punta: lint, tests unitarios, build y E2E principal verdes, con rutas SGC/rondas resilientes a Convex vacio u offline y con brechas Convex criticas cerradas.

## Documentos creados

| Archivo | Rol | Estado |
|---|---|---|
| `plan_fix.md` | Plan estrategico por fases | Creado |
| `workflow_fix.md` | Workflow operativo de ejecucion | Creado |
| `target_fix.md` | Targets medibles y verificaciones | Creado |

## Fases

### Fase 0: Baseline reproducible

| # | Archivo/Area | Accion | Notas |
|---|---|---|---|
| 0.1 | repo | Ejecutar `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e:start` | Registrar fallos reales antes de tocar codigo |
| 0.2 | E2E/auth | Registrar estado de `.auth/workos.json` o credenciales | Necesario para interpretar specs autenticadas |

### Fase 1: E2E funcional

| # | Archivo/Area | Accion | Notas |
|---|---|---|---|
| 1.1 | `tests/e2e/sgc-fase2.auth.spec.ts` | Remover IDs de ronda hardcodeados | Descubrir ronda desde UI o saltar solo detalle data-backed |
| 1.2 | `tests/e2e/sgc-cobertura.auth.spec.ts` | Ajustar selectores y redirects | Redirect actual: `/dashboard?tab=rondas` |
| 1.3 | screenshots | Separar suite de screenshots | No debe bloquear `pnpm test:e2e:start` funcional |

### Fase 2: Robustez frontend

| # | Archivo/Area | Accion | Notas |
|---|---|---|---|
| 2.1 | `src/app/(protected)/dashboard/sgc/page.tsx` | Igualar fallback offline de `/sgc` | Usar `BackendOfflineBanner` y fallback a datos vacios |
| 2.2 | rutas SGC/rondas/participante | Estados vacios y 404 controlados | Distinguir recurso inexistente de Convex offline |
| 2.3 | rutas principales | Agregar `loading.tsx` basicos | Mejorar transiciones |

### Fase 3: Seguridad Convex

| # | Archivo/Area | Accion | Notas |
|---|---|---|---|
| 3.1 | `convex/rondas`, `convex/fichas`, `convex/pt` | Validar `ctx.auth.getUserIdentity()` | No depender solo del proxy Next |
| 3.2 | `convex/migrations.ts` | Pasar mutaciones sensibles a `internalMutation`/`internalAction` | Evitar API publica destructiva |
| 3.3 | queries Convex | Acotar lecturas e indexar | Seguir `convex/_generated/ai/guidelines.md` |

### Fase 4: Infraestructura

| # | Archivo/Area | Accion | Notas |
|---|---|---|---|
| 4.1 | `package.json` | Mover `zod` y `@t3-oss/env-nextjs` a `dependencies` | Usar `pnpm add` |
| 4.2 | `.gitignore` / `logs` | Decidir versionado de logs | Evitar bloat accidental |
| 4.3 | CI opcional | Agregar pipeline minimo | Lint, test, build |

### Fase 5: Cierre funcional

| # | Archivo/Area | Accion | Notas |
|---|---|---|---|
| 5.1 | verificacion | Correr suite completa | `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm exec convex codegen`, `pnpm test:e2e:start` |
| 5.2 | diagnostico | Actualizar estado final | Documentar verde, skips o riesgos residuales |

## Log de Ejecucion

- [x] Plan raiz creado en `plan_fix.md`.
- [x] Workflow raiz creado en `workflow_fix.md`.
- [x] Targets raiz creados en `target_fix.md`.
- [x] Estado persistido con `saver`.
- [ ] Implementacion no iniciada.
- [ ] Baseline pendiente de ejecutar.

