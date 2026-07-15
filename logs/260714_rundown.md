# Rundown: calaire-app

**Date**: 2026-07-14

## Current State

- Fase 9 implementada: matching automático, vínculo manual auditado, verificación por origen y cierre condicionado.
- Resultado posterior no satisfactorio reabre la iteración documental y notifica al participante.
- UI admin/participante muestra progreso y referencias posteriores.
- Codegen, lint, 12 pruebas focalizadas, suite general y build pasan.
- E2E: 7 pasadas, 1 omitida y 1 fallo externo `502` en `/dashboard/sgc`.

## Critical Technical Context

- Identidad longitudinal: `workosUserId` o `directorioParticipanteId`, nunca igualdad de `rondaParticipanteId`.
- Solo cuentan scores cuyo `importToken` coincide con la evaluación publicada vigente.
- No descartar el worktree: contiene cambios acumulados de múltiples fases y archivos del usuario.

## Next Steps

1. Reintentar E2E y añadir cobertura autenticada específica de fase 9.
2. Validar matching/idempotencia en el despliegue Convex.
3. Auditar o implementar fase 10 y organizar commits acotados.

## Branch Status

- Branch: `main`
- Status: dirty; behind `origin/main` by 1 commit; no conflicts reported.
- Pending changes: seguridad PT, evaluación/publicación, certificados, calendario, expedientes, UI, pruebas, configuración y logs acumulados.
