# Session State: calaire-app

**Last Updated**: 2026-06-30 12:55 -05

## Session Objective

Implementar Fase 5 de la migracion estructural T3: reorganizar `convex/` por dominios.

## Current State

- [x] Fase 0: Preparacion commiteada como `33fc424`.
- [x] Fase 1: Andamiaje minimo commiteado como `996fc97`.
- [x] Fases 2, 3 y 4 siguen aplicadas funcionalmente en el working tree, pero pendientes de commit aislado.
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
- [ ] `pnpm exec convex dev` bloqueado por entorno: falla autorizando con `TypeError: fetch failed`.
- [ ] `pnpm test:e2e` bloqueado por problema previo: `config.webServer` no arranca porque Next intenta resolver `tailwindcss` desde `/home/w182/w421`.
- [x] Decisión posterior de auditoría: se acepta la Ruta B. Fase 5 queda documentada como cambio breaking explícito a `api.<dominio>.index.<funcion>` y `api.agent.auth.<funcion>`.

## Critical Technical Context

- Convex no expone `convex/<dominio>/index.ts` como `api.<dominio>.*`; lo genera como `api.<dominio>.index.*`.
- El criterio original "no cambiar `api.X.Y`" fue descartado por decisión explícita. Se acepta el riesgo de cambio breaking.
- Para validar la Fase 5 se debe usar inventario API-only con regex profundo: `rg "api\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+" src/ scripts/ tests/ -g "*.ts" -g "*.tsx" --no-filename -o`, porque el regex original captura solo dos segmentos, las rutas de archivo meten ruido por fases 2-3 y este entorno no reconoce `--type tsx`.
- El working tree ya venia sucio con Fases 2-4 y cambios en planes/logs. No revertir cambios ajenos.
- Existe tag local `backup/antes-fase-5`.

## Next Steps

1. Resolver el bloqueo de Playwright/Tailwind si se requiere e2e verde antes de commitear fases.
2. Reintentar `pnpm exec convex dev` cuando la autorizacion/red de Convex este disponible.
3. Hacer staging selectivo si se mantienen commits separados para Fases 2, 3, 4 y 5.
4. Antes de commitear fase 5, conservar el diff del inventario profundo como evidencia del cambio breaking aceptado a `.index` / `agent.auth`.
