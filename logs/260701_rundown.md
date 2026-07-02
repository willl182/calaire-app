# Rundown: calaire-app2

**Date**: 2026-07-01

## Current State

- Fase 5 / Target 9 cerrado para el alcance local.
- `diagnostico.md` contiene el cierre de verificacion final con estado RESUELTO.
- Seeds y upload SGC invocan funciones con segmento explicito `sgc/index:*`.
- `scripts/poblar-plan-r1.mjs` fue eliminado como codigo muerto: no estaba en `package.json` e invocaba `sgc:seedPlanRonda`, funcion inexistente.
- `plan_fix.md`, `target_fix.md`, `review_fix.md`, `fase5.md` y este rundown quedaron alineados con la deuda cerrada.
- Verificacion post-cambio verde: `pnpm lint`, `pnpm test`, `pnpm build`, `node --check scripts/upload-sgc-document-versions.mjs`, `node --check scripts/import-sgc-seeds.mjs`.

## Critical Technical Context

- Para data-backed E2E, arrancar primero `pnpm exec convex dev --tail-logs disable`; `.env.local` apunta la app a `http://127.0.0.1:3212`.
- `convex dev --once` no deja backend local corriendo para Next; sirve para preparar/pushear, no para la suite data-backed.
- `convex/sgc/index.ts` mantiene segmento explicito, por eso `convex run` debe usar `sgc/index:<funcion>`.
- La suite principal valida correctamente el modo offline/degradado cuando Convex local no esta corriendo.
- Persisten deudas no bloqueantes: screenshots fase 3 sucios, cambios acumulados sin commit, warnings React de formularios y Target 6 de rendimiento.

## Next Steps

1. Preparar commit de cierre por fases o commit consolidado, agregando docs/rundowns versionables explicitamente.
2. Resolver la decision de `docs/screenshots/fase-3/*`: commit, regeneracion o revert controlado.
3. Considerar limpieza posterior de warnings React en formularios.

## Branch Status

- Branch: `feature/t3-estructura-segura`
- Status: dirty, con cambios acumulados de Fases 1-5.
- Pending changes: Convex guards/migrations, fallbacks offline, E2E, CI, dependencias, docs de fase, `diagnostico.md`, `fase*.md`, scripts SGC, eliminacion de `scripts/poblar-plan-r1.mjs`, screenshots fase 3 modificados y logs history/plans desindexados.
