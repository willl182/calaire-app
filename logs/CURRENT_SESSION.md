# Session State: calaire-app

**Last Updated**: 2026-07-14 16:41 -05

## Session Objective

Implementar la fase 9 del plan final: verificación posterior de eficacia de expedientes correctivos PT.

## Current State

- [x] Matching automático por participante, contaminante, nivel y método sobre resultados posteriores publicados.
- [x] Solo se aceptan puntajes del `importToken` actualmente publicado de la ronda posterior.
- [x] Vínculo manual administrativo corregido para participaciones distintas del mismo participante y protegido con justificación/auditoría.
- [x] Cada resultado origen se evalúa por separado; ausencia, parcialidad o resultado no satisfactorio mantienen abierto el expediente.
- [x] El cierre exige conjuntamente documentación aceptada y todas las verificaciones satisfactorias.
- [x] Un resultado posterior no satisfactorio reabre la iteración documental, limpia la aceptación previa, audita y notifica.
- [x] UI admin y participante muestran progreso y referencia del resultado posterior por origen.
- [x] `convex codegen`, lint, 12 pruebas focalizadas, suite general y build pasan.
- [ ] E2E terminó con 7 pasadas, 1 omitida y 1 fallo ajeno a fase 9 por `502 Bad Gateway` de Convex/Cloudflare en `/dashboard/sgc`.
- [ ] Cambios acumulados de varias fases siguen sin commit en el worktree compartido.

## Critical Technical Context

- Implementación principal: `convex/pt/cases.ts`; pruebas: `convex/cases.test.ts`.
- El bug corregido comparaba `rondaParticipanteId` entre rondas; esos IDs son distintos aunque sea el mismo participante. La identidad se valida por `workosUserId` o `directorioParticipanteId`.
- Tanto matching automático como candidatos/vínculo manual deben comprobar la cabecera publicada y que el score pertenezca a su `importToken` vigente.
- `closeIfComplete` no cierra con verificaciones pendientes/no satisfactorias ni sin `documentacionAceptadaAt`.
- Un fallo posterior tras aceptación cambia el caso a `esperando_participante` y exige una nueva versión documental.
- Las pruebas Convex focalizadas se ejecutan explícitamente con `pnpm exec vitest run convex/cases.test.ts`.
- No descartar ni restaurar globalmente el worktree; contiene fases previas y archivos del usuario.

## Next Steps

1. Reintentar `pnpm test:e2e:start` cuando Convex/Cloudflare esté estable y añadir escenarios E2E específicos de fase 9.
2. Validar en despliegue el matching automático al publicar una ronda posterior y la idempotencia de auditoría/notificaciones.
3. Implementar/auditar la fase 10 (expediente ZIP) contra T10.
4. Separar commits o PRs acotados preservando el diff acumulado.
