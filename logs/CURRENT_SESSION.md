# Session State: calaire-app

**Last Updated**: 2026-06-30 15:03 -05

## Session Objective

Reconciliar el plan de migracion T3 con el estado real de la rama y cerrar el cleanup estricto de `@/app/...`.

## Current State

- [x] Fase 0: Preparacion commiteada como `33fc424`.
- [x] Fase 1: Andamiaje minimo commiteado como `996fc97`.
- [x] Fase 2 aplicada y verificada funcionalmente:
  - `app/` raiz eliminado y `src/app/` activo.
  - `src/components/` contiene los componentes movidos desde `app/components/`.
  - Cleanup estricto de `@/app/...` cerrado: `rg "@/app/" src/app` en cero.
- [x] Fase 3 aplicada y verificada funcionalmente:
  - `lib/` raiz eliminado.
  - Logica redistribuida entre `src/server/*` y `src/lib/*`.
- [x] Fase 4 aplicada y verificada funcionalmente:
  - `proxy.ts` raiz eliminado.
  - `src/proxy.ts` activo con matcher preservado.
- [x] Fase 5 implementada funcionalmente en el working tree:
  - `convex/rondas.ts` -> `convex/rondas/index.ts`.
  - `convex/sgc.ts` -> `convex/sgc/index.ts`.
  - `convex/agent.ts` -> `convex/agent/index.ts`.
  - `convex/agentAuth.ts` -> `convex/agent/auth.ts`.
  - `convex/fichas.ts` -> `convex/fichas/index.ts`.
  - `convex/pt.ts` -> `convex/pt/index.ts`.
  - Imports relativos de los nuevos archivos movidos ajustados a `../_generated/*` y `./<modulo>`.
  - `src/server/auth/agent-auth.ts` usa `anyApi.agent.auth`.
  - Consumidores de Convex actualizados a `api.rondas.index.*`, `api.sgc.index.*`, `api.fichas.index.*` y `api.pt.index.*`.
- [x] `pnpm exec convex codegen` verde.
- [x] `pnpm build` verde.
- [x] `pnpm lint` verde.
- [x] `pnpm test` verde.
- [x] Fase 6 implementada funcionalmente en el working tree:
  - Consumidores en `src/` y `convex/auth.config.ts` migrados a `env`.
  - `src/env.js` se consolido como modulo tipado real en `src/env.ts`.
  - Se eliminaron `src/env.js` y `src/env.d.ts`, que estaban causando conflictos de resolucion de tipos.
  - `rg "process\\.env\\." src convex --glob '!src/env.ts'` no devuelve resultados.
  - Tooling alineado: `tests/e2e/env.ts` y `scripts/env.mjs` concentran las variables de entorno de Playwright y scripts.
- [ ] `pnpm exec convex dev` bloqueado por entorno: falla autorizando con `TypeError: fetch failed`.
- [x] Fase 7 implementada funcionalmente en el working tree:
  - Primitivos compartidos extraidos a `src/components/ui/`: `Alert`, `ConfirmSubmitButton`, `CopyInvitationLinkButton`, `EstadoBadge` y `SgcHeader`.
  - Consumidores actualizados para importar desde `@/components/ui/*`.
  - Eliminadas las copias antiguas en `src/app/(protected)/dashboard/components/` y `src/app/(protected)/dashboard/sgc/`.
  - `rg "components/(Alert|ConfirmSubmitButton|CopyInvitationLinkButton|EstadoBadge)|dashboard/sgc/SgcHeader" src` en cero.
  - `src/components/ui/` no importa Convex ni auth.
- [ ] `pnpm test:e2e` sigue bloqueado por entorno: `PLAYWRIGHT_START_SERVER` no esta activo y Playwright intenta abrir `http://localhost:3000` sin servidor escuchando.
- [x] Decisión posterior de auditoría: se acepta la Ruta B. Fase 5 queda documentada como cambio breaking explícito a `api.<dominio>.index.<funcion>` y `api.agent.auth.<funcion>`.
- [x] Fase 8 de documentación aplicada en el working tree:
  - `README.md` actualizado a la estructura T3 real.
  - `AGENTS.md` actualizado con reglas de paths/capas/verificación.
  - `.env.example` alineado con `src/env.ts`.
  - copia del plan guardada en `logs/plans/260629_1755_plan_migracion_estructura_t3.md`.
- [x] Bloqueo de Convex por `WORKOS_API_KEY` resuelto sin eliminar la variable del sistema:
  - `convex/auth.config.ts` ya no importa `src/env.ts`.
  - `convex/auth.config.ts` valida solo `WORKOS_CLIENT_ID`, que es lo único que usa.
  - `pnpm exec convex codegen` vuelve a pasar.
- [x] `pnpm test:e2e:start` resuelto:
  - Causa raíz: `/home/w182/w421/.git` (repo Git padre vacío sin commits) hacía que Turbopack calculara el root en el directorio padre. El cache `.next` persistía esa raíz incorrecta.
  - Fix: se eliminó `/home/w182/w421/.git`, se creó `.npmrc` con `public-hoist-pattern[]=tailwindcss` y `@tailwindcss/*`, se limpió `.next` y se reinstalaron deps.
  - Resultado: `pnpm test:e2e:start` → 1 passed (5.9s).

## Critical Technical Context

- Convex no expone `convex/<dominio>/index.ts` como `api.<dominio>.*`; lo genera como `api.<dominio>.index.*`.
- El criterio original "no cambiar `api.X.Y`" fue descartado por decisión explícita. Se acepta el riesgo de cambio breaking.
- Para validar la Fase 5 se debe usar inventario API-only con regex profundo: `rg "api\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+" src/ scripts/ tests/ -g "*.ts" -g "*.tsx" --no-filename -o`, porque el regex original captura solo dos segmentos, las rutas de archivo meten ruido por fases 2-3 y este entorno no reconoce `--type tsx`.
- Fase 6 exigio promover `src/env.js` a `src/env.ts` porque la declaracion ambient `src/env.d.ts` hacia que TypeScript resolviera mal imports relativos desde `convex/auth.config.ts`.
- Los unicos usos intencionales de `process.env` que quedan estan centralizados en `src/env.ts`, `tests/e2e/env.ts` y `scripts/env.mjs`.
- `WORKOS_API_KEY` sigue siendo una variable válida y necesaria para runtime de la app; el problema era solo el acoplamiento falso de `convex/auth.config.ts` con la validación global de `src/env.ts`.
- `pnpm exec convex codegen` ahora pasa porque `convex/auth.config.ts` solo depende de `WORKOS_CLIENT_ID`.
- El working tree ya venia sucio con Fases 2-4 y cambios en planes/logs. No revertir cambios ajenos.
- Existe tag local `backup/antes-fase-5`.

## Next Steps

1. ~~Diagnosticar `pnpm test:e2e:start`~~: **resuelto** (ver arriba).
2. Revalidar `pnpm exec convex dev` si se necesita además de `codegen`.
3. Commitear Fase 8, el desacople de `convex/auth.config.ts`, y el fix de `.npmrc`/`.git` padre si el usuario quiere cerrar la rama.

## Migración T3 - Fase 8

- [x] `app/`, `lib/` y `proxy.ts` raíz siguen ausentes.
- [x] `README.md` actualizado a la estructura T3 real del repo.
- [x] `AGENTS.md` actualizado con reglas de paths, capas y verificación.
- [x] `.env.example` alineado con `src/env.ts`.
- [x] Copia del plan guardada en `logs/plans/260629_1755_plan_migracion_estructura_t3.md`.
- [x] `pnpm build`, `pnpm lint`, `pnpm test` y `pnpm exec convex codegen` re-ejecutados.
- [x] `pnpm test:e2e:start` resuelto — 1 passed (5.9s).
- ~~**Bloqueador**~~: resuelto. Causa: `.git` padre vacío + cache `.next` stale.
- **Notas**: el README anterior seguía documentando `WORKOS_COOKIE_PASSWORD`, `NEXT_PUBLIC_CONVEX_SITE_URL` y fragmentos de migración ya obsoletos. Además, `convex/auth.config.ts` estaba forzando la validación de `WORKOS_API_KEY` aunque no la usaba.
