# Session State: Calaire App — Drive Documental SGC

**Last Updated**: 2026-07-02 19:10

## Session Objective

Rediseñar el centro documental Google Drive por-ronda (`/dashboard/rondas/[id]/sgc`) como un file manager estilo Google Drive (tarjetas grandes) y corregir el bug `?error=NEXT_REDIRECT`.

## Current State

- [x] Rediseño file-manager: breadcrumb + tarjetas grandes de carpeta (raíz) y de documento (dentro de carpeta), panel de detalle a la derecha con formularios reusados.
- [x] Eliminado el sidebar plano largo que "se perdía".
- [x] Fix `?error=NEXT_REDIRECT`: añadido `unstable_rethrow(error)` como primera línea en los `catch` de 7 drive-actions.
- [x] Eliminada función `RecursoRow` (unused, warning de lint).
- [x] `pnpm lint` limpio, `pnpm build` OK.
- [x] Commit `55b7053` pushado a `feat-drive-sgc` y desplegado a producción (dpl_36pT4WiWiUVZAqmUsxqgNGvBrd7V, ready).
- [ ] Confirmación del usuario tras hard-refresh en producción.

## Critical Technical Context

- Feature es POR RONDA, no global. URL: `/dashboard/rondas/<id>/sgc`.
- Navegación server-side vía searchParams: `?carpeta=<codigo>&doc=<id>`.
- Next.js `redirect()` lanza `NEXT_REDIRECT`; SIEMPRE llamar `unstable_rethrow(error)` primero en catch para no tragarse el redirect.
- Usuario prueba en producción `calaire-app.vercel.app` → los cambios deben desplegarse (`vercel --prod --yes`) para ser visibles.
- Archivos clave: `DriveDocumentalSgc.tsx` (UI), `page.tsx` (props/searchParams), `actions.ts` (server actions).
- pnpm only. Subagentes: solo gpt-5.4/medium o gpt-5.5/low.

## Next Steps

1. Esperar confirmación del usuario; ajustar tamaños/columnas de tarjetas si lo pide.
