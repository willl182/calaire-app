# Session State: CALAIRE App

**Last Updated**: 2026-06-09 23:36 -05

## Session Objective

Organizar el ruido del repositorio sin tocar el aplicativo.

## Current State

- [x] Revisada la raiz del repo y separada la app real del material de trabajo.
- [x] Creada la carpeta `_workspace/` para planes, guias, reportes, analisis SGC y revisiones internas.
- [x] Movidos Markdown sueltos de raiz hacia `_workspace/` usando `git mv`.
- [x] Movida la carpeta `grills/` hacia `_workspace/grills/`.
- [x] Conservada `logs/` como carpeta interna propia en la raiz, por decision del usuario.
- [x] Conservados `AGENTS.md` y `CLAUDE.md` en la raiz.
- [x] Movido el duplicado `guia-participante-cargue-datos.html` a `_workspace/guides/`; la app sigue usando `public/guia.html`.
- [x] Creado `_workspace/README.md` para explicar el criterio de organizacion.

## Critical Technical Context

- No se tocaron `app/`, `convex/`, `lib/`, `tests/`, `public/`, ni configuracion de runtime.
- La app tiene referencias activas a `/guia.html` desde:
  - `app/(protected)/ParticipantTopNav.tsx`
  - `app/(protected)/mi-dashboard/page.tsx`
- `public/guia.html` permanece en su lugar y no fue modificado.
- Esta sesion produjo principalmente renames/moves de documentacion y material interno.

## Next Steps

1. Revisar si `skills-lock.json`, `next-env.d.ts` y `tsconfig.tsbuildinfo` deben seguir trackeados o salir del repositorio.
2. Luego abordar limpieza arquitectonica del aplicativo: modulos grandes en `convex/sgc.ts`, `convex/agent.ts`, `convex/rondas.ts`, `lib/rondas.ts` y `app/(protected)/dashboard/page.tsx`.
