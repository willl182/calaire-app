# Plan: Recuperacion funcional de la app

**Created**: 2026-06-30 20:58
**Updated**: 2026-07-01 00:14
**Status**: in_progress
**Slug**: fix-funcional-app

## Objetivo

Llevar `calaire-app` a un estado funcional verificable con lint, unit, build y E2E principal verdes, degradacion offline controlada y seguridad Convex cerrada antes del cierre final.

## Fases

### Fase 0: Baseline

| # | Archivo | Accion | Notas |
|---|---------|--------|-------|
| 0.1 | `target_fix.md` | Registrar | Cerrada; baseline verde salvo E2E autenticado inicial |

### Fase 1: E2E funcional

| # | Archivo | Accion | Notas |
|---|---------|--------|-------|
| 1.1 | `tests/e2e/*` | Modificar | Cerrada; smoke desacoplado de IDs exactos y screenshots separados |

### Fase 2: UX offline y estados vacios

| # | Archivo | Accion | Notas |
|---|---------|--------|-------|
| 2.1 | `src/lib/convex-fallback.ts` | Modificar | `safeConvexCallWithStatus` y deteccion offline ampliada |
| 2.2 | `src/server/sgc/index.ts` | Modificar | Lecturas SGC `WithStatus`, incluidas lecturas de participante |
| 2.3 | `src/server/rondas/client.ts` | Modificar | Lecturas de rondas/PT/metricas `WithStatus` |
| 2.4 | `src/app/(protected)/*` | Modificar | Banner offline y estados vacios controlados |

### Fase 3: Seguridad Convex

| # | Archivo | Accion | Notas |
|---|---------|--------|-------|
| 3.1 | `convex/rondas`, `convex/fichas`, `convex/pt` | Pendiente | Validar identidad y ownership backend |
| 3.2 | `convex/migrations.ts` | Pendiente | Migrar utilidades destructivas a internas |

## Log de Ejecucion

- [x] Fase 0 cerrada.
- [x] Fase 1 cerrada.
- [x] Fase 2 cerrada el 2026-07-01 00:14; F13-F15 resueltos.
- [ ] Fase 3 pendiente.
- [ ] Fase 4 pendiente.
- [ ] Fase 5 pendiente.

## Verificacion Ultima

- `pnpm lint`: verde.
- `pnpm test`: verde.
- `pnpm build`: verde.
- `pnpm test:e2e:start`: verde, 6 passed / 3 skipped intencionales.
