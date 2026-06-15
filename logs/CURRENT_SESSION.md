# Session State: CALAIRE App

**Last Updated**: 2026-06-10 11:47 -05

## Session Objective

Implementar el plan de refactorizacion de mantenibilidad, preservar las fachadas publicas de Next/Convex, commitear, desplegar a produccion y dejar memoria del hito.

## Current State

- [x] Fase 1 parcial: agregados tests de caracterizacion para helpers criticos de `lib/rondas`.
- [x] Fase 2: `lib/rondas.ts` quedo como fachada; implementacion extraida a `lib/rondas/**`.
- [x] Fase 3: `app/(protected)/dashboard/page.tsx` quedo como server component orquestador; UI/data/view-model extraidos a modulos del dashboard.
- [x] Fase 4: `convex/rondas.ts` quedo como fachada de `api.rondas.*`; implementacion extraida a `convex/rondas/**`.
- [x] Fase 5: `convex/sgc.ts` quedo como fachada de `api.sgc.*`; implementacion extraida a `convex/sgc/**`.
- [x] Fase 6: `convex/agent.ts` quedo como fachada de `api.agent.*`; implementacion extraida a `convex/agent/**`.
- [x] Fase 7: documentada estructura en `docs/architecture.md`.
- [x] Commit local y remoto: `d4b13b3 -- Refactor maintainability modules`.
- [x] Produccion desplegada en Vercel y Convex.

## Critical Technical Context

- Branch actual: `main`; `HEAD` y `origin/main` apuntan a `d4b13b3f02822e7511464de6591a83cba94538f5`.
- URL produccion: `https://calaire-app.vercel.app`.
- Deployment Vercel: `https://calaire-zr2x4chb4-will-salas-projects.vercel.app`.
- Inspector Vercel: `https://vercel.com/will-salas-projects/calaire-app/F1r5c62Y2U3kdqVr8yjZhXpBMasW`.
- Convex deployment: `https://steady-kiwi-725.convex.cloud`.
- Verificacion HTTP final: `curl -I https://calaire-app.vercel.app/login` respondio `HTTP/2 200`.
- `pnpm lint`, `pnpm build`, `pnpm exec convex codegen` y `node --test lib/referencia-csv.test.ts lib/rondas/rondas.test.ts` pasaron.
- Playwright final: `pnpm test:e2e:start` dejo 5 pruebas pasando y 3 fallando en `sgc-fase2*`; las fallas se asocian a rutas de ronda especifica SGC que intentan consultar Convex local en `127.0.0.1:3212`.
- Las fachadas publicas preservadas son `lib/rondas.ts`, `convex/rondas.ts`, `convex/sgc.ts` y `convex/agent.ts`.
- `convex/_generated/api.d.ts` fue actualizado por `convex codegen` para registrar modulos internos nuevos.
- El release mostro aviso de Convex AI files desactualizados; no se actualizo en esta sesion.

## Next Steps

1. Si se necesita cerrar el e2e completo, levantar o configurar Convex local para `127.0.0.1:3212` y rerun `pnpm test:e2e:start`.
2. Revisar si conviene actualizar Convex AI files con el comando recomendado por Convex.
3. En una pasada futura, reducir modulos internos aun grandes: `lib/rondas/client.ts`, `convex/sgc/shared.ts` y `convex/agent/sgcMutations.ts`.
