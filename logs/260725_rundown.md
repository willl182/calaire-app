# Rundown: calaire-app2

**Date**: 2026-07-25

## Current State

- Alcance de documentos de ronda SGC definido mediante entrevista.
- Plan guardado en `plan_documentos_sgc.md`.
- Workflow técnico guardado en `workflow_documentos_sgc.md`.
- Incluidos F-PSEA-19, F-PSEA-20, F-PSEA-21, anexos I-PSEA-02, mapa documental, procedimientos, endpoints y pruebas.
- Implementación todavía no iniciada.
- Modelo visual F-PSEA-20 pendiente de entrega.

## Critical Technical Context

- F-PSEA-04 sigue destinado a equipos de participantes; F-PSEA-21 registra instrumentos Calaire.
- F19/F20/F21 son críticos sin bloqueo técnico de cierre.
- Participantes ven instrucciones, calendario, cronograma y F19; F20/F21 son internos.
- Mapa debe anclar formatos nuevos a P-PSEA-01, 03, 04, 05, 06, 08, 19 y 20.
- Mantener paridad entre catálogos SGC duplicados.
- No descartar cambios existentes del usuario.

## Next Steps

1. Aprobar plan y workflow.
2. Crear documentos maestros y actualizar procedimientos/matrices/seeds.
3. Implementar separación `critico`/`bloqueaCierre`.
4. Implementar F19, F20 y F21 con pruebas por fase.
5. Ejecutar codegen, lint, tests, build y E2E.

## Branch Status

- Branch: `main`
- Status: dirty, alineado con `origin/main`
- Pending changes: páginas y auth existentes; mapa SGC; logs; documentos de análisis; `plan_documentos_sgc.md`; `workflow_documentos_sgc.md`; presentación HTML; pruebas auth.
