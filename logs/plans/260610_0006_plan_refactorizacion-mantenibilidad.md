# Plan: Refactorizacion por Etapas para Mantenibilidad

**Created**: 2026-06-10 00:06 -05
**Updated**: 2026-06-10 00:06 -05
**Status**: draft
**Slug**: refactorizacion-mantenibilidad

## Objetivo

Reducir el riesgo de mantenibilidad causado por modulos grandes sin romper el aplicativo. El refactor debe preservar las interfaces publicas actuales, especialmente las referencias Convex `api.rondas.*`, `api.sgc.*` y `api.agent.*`, mientras se extrae implementacion por dominio.

## Fases

| Fase | Objetivo | Target esperado | Validacion |
|---|---|---:|---|
| 0 | Linea base y proteccion | Sin cambios funcionales | `pnpm lint`, `pnpm build`, Playwright baseline |
| 1 | Tests de caracterizacion | Cubrir logica critica antes de moverla | Unit tests + e2e existentes |
| 2 | Extraer `lib/rondas.ts` | Bajar de ~1286 a <400 lineas | Unit tests de CSV, estados, filtros |
| 3 | Extraer dashboard | Bajar `page.tsx` de ~1692 a <450 lineas | Playwright dashboard + capturas |
| 4 | Extraer `convex/rondas.ts` | Bajar de ~1382 a <500 lineas | Build + e2e ronda/dashboard |
| 5 | Extraer `convex/sgc.ts` | Bajar de ~1867 a <600 lineas | Playwright SGC + capturas |
| 6 | Extraer `convex/agent.ts` | Bajar de ~1724 a <500 lineas | Tests agent/auth + smoke e2e |
| 7 | Limpieza final | Fachadas pequenas, modulos por dominio | Suite completa + revision manual |

## Detalle

La copia completa del plan de trabajo esta en `_workspace/plans/plan_refactorizacion_mantenibilidad.md`.

## Log de Ejecucion

- [x] Plan propuesto.
- [x] Plan guardado en `_workspace/plans/`.
- [ ] Fase 0 iniciada.
- [ ] Fase 0 completada.
