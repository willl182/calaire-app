# Session State: calaire-app

**Last Updated**: 2026-06-30 13:41 -05

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
- [ ] `pnpm test:e2e` bloqueado por problema previo: `config.webServer` no arranca porque Next intenta resolver `tailwindcss` desde `/home/w182/w421`.
- [x] Decisión posterior de auditoría: se acepta la Ruta B. Fase 5 queda documentada como cambio breaking explícito a `api.<dominio>.index.<funcion>` y `api.agent.auth.<funcion>`.

## Critical Technical Context

- Convex no expone `convex/<dominio>/index.ts` como `api.<dominio>.*`; lo genera como `api.<dominio>.index.*`.
- El criterio original "no cambiar `api.X.Y`" fue descartado por decisión explícita. Se acepta el riesgo de cambio breaking.
- Para validar la Fase 5 se debe usar inventario API-only con regex profundo: `rg "api\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+" src/ scripts/ tests/ -g "*.ts" -g "*.tsx" --no-filename -o`, porque el regex original captura solo dos segmentos, las rutas de archivo meten ruido por fases 2-3 y este entorno no reconoce `--type tsx`.
- Fase 6 exigio promover `src/env.js` a `src/env.ts` porque la declaracion ambient `src/env.d.ts` hacia que TypeScript resolviera mal imports relativos desde `convex/auth.config.ts`.
- Los unicos usos intencionales de `process.env` que quedan estan centralizados en `src/env.ts`, `tests/e2e/env.ts` y `scripts/env.mjs`.
- El working tree ya venia sucio con Fases 2-4 y cambios en planes/logs. No revertir cambios ajenos.
- Existe tag local `backup/antes-fase-5`.

## Next Steps

1. Resolver el bloqueo de Playwright/Tailwind si se requiere `pnpm test:e2e` verde para cerrar verificaciones de Fases 2, 5 y 6.
2. Reintentar `pnpm exec convex dev` cuando la autorizacion/red de Convex este disponible.
3. Ejecutar Fase 7 (`src/components/ui/`) y luego Fase 8 (docs y limpieza final).
