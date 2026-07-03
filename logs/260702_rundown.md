# Rundown: Calaire App — Drive Documental SGC

**Date**: 2026-07-02

## Current State

- Rediseño file-manager del Drive por-ronda completado, commit `55b7053`, desplegado a producción (ready).
- Fix `?error=NEXT_REDIRECT` aplicado y desplegado.
- Pendiente: confirmación del usuario tras hard-refresh.

## Critical Technical Context

- URL feature: `/dashboard/rondas/<id>/sgc` (por ronda, no global).
- Navegación server-side: `?carpeta=<codigo>&doc=<id>`.
- `redirect()` lanza `NEXT_REDIRECT` → `unstable_rethrow(error)` primero en cada catch.
- Usuario prueba en producción; desplegar con `vercel --prod --yes`.

## Next Steps

1. Esperar feedback del usuario sobre tarjetas/navegación.
2. Ajustar tamaños/columnas de tarjetas si lo solicita.

## Branch Status

- Branch: feat-drive-sgc
- Status: clean (sincronizado con lo commiteado)
- Pending changes: none
