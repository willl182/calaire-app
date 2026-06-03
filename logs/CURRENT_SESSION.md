# Session State: CALAIRE App

**Last Updated**: 2026-06-03 12:10 -05

## Session Objective

Automatizar el flujo de release para el repo con `lint`, `build`, `git commit` y despliegue a Convex + Vercel sin confirmaciones intermedias.

## Current State

- [x] Se agregó `pnpm release` en `package.json`.
- [x] Se creó `scripts/release.mjs` para ejecutar el flujo completo.
- [x] El orden actual es `pnpm lint` -> `pnpm build` -> `git add -A` -> `git commit` -> `convex deploy` -> `vercel deploy`.
- [x] Se actualizó `README.md` con el uso del nuevo comando.
- [x] Se dejó documentado el humo test solo como concepto, no implementado.

## Critical Technical Context

- El proyecto usa `pnpm`; evitar `npm`/`npx` salvo que sea estrictamente necesario.
- Next.js 16.2.4: seguir leyendo la doc local en `node_modules/next/dist/docs/` si se toca algo de Next.
- Convex requiere seguir `convex/_generated/ai/guidelines.md` para cualquier cambio backend.
- El script de release no pide confirmación: si hay cambios, intenta commit y luego despliegue.

## Next Steps

1. Ejecutar `pnpm release -- "<mensaje>"` cuando se quiera publicar.
2. Si se quiere endurecer el flujo, decidir si agregar smoke test automático post-deploy.
