# Rundown: calaire-app2

**Date**: 2026-07-12

## Current State

- Plan, workflow y targets PT corregidos y sincronizados; aún no implementados.
- El CSV real fue validado y define el contrato inicial.
- `s_final_p.md`, `s_final_w.md` y `s_final_t.md` son los documentos canónicos.

## Critical Technical Context

- Clave de puntaje: participante × ítem × método.
- Clasificaciones: `Satisfactorio` y `No satisfactorio`, normalizadas sin reclasificación.
- Publicación mediante cambio atómico de cabecera; artefactos derivados son jobs posteriores idempotentes.
- Certificado opcional y no bloqueante.
- Mantener layout raíz `app/`/`lib/`/`convex/`, sin `src/`.

## Next Steps

1. Aprobar los tres documentos canónicos.
2. Implementar y probar Fase 0 de seguridad.
3. Documentar el contrato CSV y crear fixtures de parser.

## Branch Status

- Branch: `main`
- Status: dirty, aligned with `origin/main`; no conflicts reported
- Pending changes: existing Convex modifications, PT planning/export files, logs, memory and other untracked workspace artifacts
