# Session State: CALAIRE App

**Last Updated**: 2026-06-10 00:06 -05

## Session Objective

Guardar un plan de refactorizacion por etapas para reducir riesgos de mantenibilidad sin romper el aplicativo.

## Current State

- [x] Identificados modulos de alto riesgo por tamano: `convex/sgc.ts`, `convex/agent.ts`, `app/(protected)/dashboard/page.tsx`, `convex/rondas.ts` y `lib/rondas.ts`.
- [x] Propuesto roadmap incremental con targets de reduccion por archivo.
- [x] Incluidas validaciones por fase: `pnpm lint`, `pnpm build`, tests unitarios, Playwright y capturas donde aplique.
- [x] Guardada copia completa en `_workspace/plans/plan_refactorizacion_mantenibilidad.md`.
- [x] Guardado registro del plan en `logs/plans/260610_0006_plan_refactorizacion-mantenibilidad.md`.

## Critical Technical Context

- Este es un plan documental; no cambia codigo runtime.
- El refactor propuesto mantiene fachadas publicas para evitar romper referencias Convex como `api.rondas.*`, `api.sgc.*` y `api.agent.*`.
- Antes de tocar Convex se debe leer `convex/_generated/ai/guidelines.md`.
- El proyecto usa `pnpm`; evitar `npm`/`npx` salvo excepcion justificada.
- Hay tests e2e Playwright existentes, incluyendo specs autenticadas y capturas SGC por fase.
- Existe un cambio no relacionado en `_workspace/reports/reporte_avances_proyecto.md` que no pertenece a este plan.

## Next Steps

1. Ejecutar Fase 0: baseline con `pnpm lint`, `pnpm build` y Playwright.
2. Tomar capturas baseline en `docs/screenshots/refactor-baseline/`.
3. Iniciar Fase 1 agregando tests de caracterizacion antes de mover implementacion.
