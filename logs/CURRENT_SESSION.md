# Session State: CALAIRE App

**Last Updated**: 2026-06-28 23:21 -0500

## Session Objective

Implementar los hallazgos de `cr-rev.md` sobre el PR SGC Maestro protv2, preservando la separacion entre SGC maestro global y dashboard documental por ronda.

## Current State

- [x] Review de `cr-rev.md` implementado localmente.
- [x] No se hizo commit ni push, por instruccion explicita del usuario.
- [x] Server actions SGC corregidas:
  - `redirect()` de exito queda fuera de `try/catch`.
  - `documento_id` se valida antes de subir archivo oficial.
  - URLs editables/externas se validan como `http(s)` antes de persistir.
- [x] Seguridad de URLs agregada:
  - Nuevo helper `lib/safe-url.ts`.
  - Render de `fuenteEditableUrl` y `externalUrl` evita links para valores no `http(s)`.
- [x] Convex SGC endurecido:
  - Indice version-aware `by_norma_and_versionNorma_and_clausula`.
  - Imports de requisitos usan norma + version + clausula.
  - Validacion de existencia de documento/requisito en `documentoRequisitos`.
  - Validacion de pertenencia `versionBaseId` -> documento.
  - Versiones oficiales deben ser enteras positivas y no duplicarse por documento.
  - Registros derivados rechazan codigo/nombre vacios.
  - Filtro `pendiente` conserva requisitos sin relacion.
  - Conteo de registros deja de usar `take(50)` como total.
  - Imports de mapa no borran relaciones curadas en import generico y son idempotentes por clave natural.
  - Relaciones de mapa a `requisito` se rechazan hasta que puedan resolverse con `requisitoId`.
- [x] Visibilidad SGC aplicada en backend:
  - `admin`, `admin_sgc`, `coordinador_proceso` leen todo.
  - `consulta` solo recibe documentos `publica`.
  - Descargas de versiones heredan la misma regla y validan documento + version.
- [x] UI y accesibilidad:
  - Formularios del detalle de documento tienen nombres accesibles.
  - Matriz normativa calcula cobertura agregada, no `relaciones[0]`.
  - Mapa y detalle no renderizan links inseguros.
  - Fallback activo de navegacion SGC para subrutas no listadas.
  - Prototype ajusta estados `activa`/`cerrada` y padding inferior.
  - HTML estatico del mapa responde a Space y Enter.
- [x] Tests screenshot esperan tabla antes de capturar.
- [x] Docs/logs ajustados para no listar expedientes como ruta real del SGC maestro.
- [x] Validaciones ejecutadas:
  - `pnpm exec convex codegen`: pasa.
  - `pnpm lint`: pasa limpio.
  - `pnpm build`: pasa.
  - `git diff --check`: pasa.
- [x] Follow-up review de `convex/sgc/documentos.ts` resuelto:
  - Helper `visible` ahora es generico y preserva el tipo completo de fila.
  - `requireSgcViewerAccess(ctx)` queda fuera del `try` de matriz documental para no ocultar fallos de autorizacion.
  - Revalidado con `pnpm exec convex codegen`, `pnpm lint` y `pnpm build`.

## Critical Technical Context

- Instruccion vigente del usuario: **no hacer commit ni push**.
- Rama local sigue con cambios sin commitear.
- `cr-rev.md` sigue sin trackear y contiene la salida de review.
- `logs/history/260628_2231_problems.md` tambien sigue sin trackear desde la sesion anterior.
- Nuevo archivo sin trackear creado por esta tanda: `lib/safe-url.ts`.
- Smoke Playwright autenticado no se ejecuto porque no habia servicios locales respondiendo en:
  - `http://localhost:3000`
  - `http://127.0.0.1:3212`
- Para repetir smoke autenticado, levantar:
  - `pnpm dev`
  - `pnpm exec convex dev`
- Next local sigue en 16.2.4; antes de tocar rutas Next hay que consultar `node_modules/next/dist/docs/`.
- Antes de tocar Convex hay que leer `convex/_generated/ai/guidelines.md`.

## Key Files Changed

- `lib/safe-url.ts`
- `app/(protected)/dashboard/sgc/documentos/actions.ts`
- `app/(protected)/dashboard/sgc/documentos/[id]/page.tsx`
- `app/(protected)/dashboard/sgc/documentos/[id]/versiones/[versionId]/download/route.ts`
- `app/(protected)/dashboard/sgc/documentos/page.tsx`
- `app/(protected)/dashboard/sgc/mapa/page.tsx`
- `app/(protected)/dashboard/sgc/normativa/actions.ts`
- `app/(protected)/dashboard/sgc/normativa/page.tsx`
- `convex/schema.ts`
- `convex/sgc/documentos.ts`
- `convex/sgc/maestro.ts`
- `convex/sgc/shared.ts`
- `lib/sgc/index.ts`
- `tests/e2e/sgc-cobertura-screenshots.auth.spec.ts`
- `tests/e2e/sgc-fase3-screenshots.auth.spec.ts`

## Next Steps

1. Revisar el diff completo antes de commit.
2. Si se quiere smoke UI, levantar `pnpm dev` y `pnpm exec convex dev`, luego correr:
   `pnpm exec playwright test tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium --workers=1 --timeout=30000 --reporter=list`
3. Solo cuando el usuario autorice, crear commit con los fixes del review.
