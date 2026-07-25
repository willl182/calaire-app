# Session State: calaire-app2

**Last Updated**: 2026-07-25 08:21

## Session Objective

Definir plan y workflow técnico para incorporar nuevos documentos de ronda al SGC, incluyendo integración Convex/Next.js, mapa documental, endpoints y pruebas.

## Current State

- [x] Alcance funcional acordado mediante entrevista `grill-me`.
- [x] Plan principal creado en `plan_documentos_sgc.md`.
- [x] Workflow técnico creado en `workflow_documentos_sgc.md`.
- [x] Definidos F-PSEA-19 Acta de inicio, F-PSEA-20 Rotulado anónimo y F-PSEA-21 Relación de instrumentos Calaire.
- [x] Definidos anexos A/B de I-PSEA-02.
- [x] Definidos anclajes a P-PSEA-01, 03, 04, 05, 06, 08, 19 y 20.
- [x] Definidas relaciones para mapa documental, seeds, endpoints y matriz de pruebas.
- [ ] Implementación documental y de código no iniciada.
- [ ] Modelo visual definitivo F-PSEA-20 pendiente de entrega por usuario.

## Critical Technical Context

- F-PSEA-04 conserva equipos reportados por participantes. F-PSEA-21 es formato separado para instrumentos Calaire usados.
- F-PSEA-19: DOCX precargado desde calendario/F-PSEA-03, firmas manuales, PDF escaneado visible a participantes.
- F-PSEA-20: carga manual, solo etiquetas, interno; primera versión será placeholder válido.
- F-PSEA-21: nativo, siete mínimos, dos fotos nuevas por instrumento, técnico registra, coordinador valida, exporta PDF/XLSX.
- I-PSEA-02 incorpora Anexo A de operación normal y Anexo B de procesamiento, promedio horario con 75 % mínimo, incertidumbre propia documentada y archivo original obligatorio.
- Instrucciones, calendario, cronograma y acta visibles a participantes. F20/F21 internos.
- F19/F20/F21 son críticos para checklist, pero no bloquean técnicamente cierre.
- Catálogo SGC está duplicado en `src/server/sgc/catalog.ts` y `convex/_lib/sgc/catalog.ts`; mantener paridad.
- Cambios Convex requieren leer `convex/_generated/ai/guidelines.md` y ejecutar codegen.
- Mapa documental usa `dev/import/relaciones_mapa_sgc.seed.json` y `mapaSgcRelaciones`.
- Repositorio ya tiene cambios del usuario. No descartarlos ni sobrescribirlos.

## Next Steps

1. Revisar y aprobar `plan_documentos_sgc.md` y `workflow_documentos_sgc.md`.
2. Implementar primero documentos maestros, procedimientos, matrices y seeds del mapa.
3. Separar criticidad de bloqueo antes de registrar formatos nuevos en expediente.
4. Implementar F19, F20 y F21 por fases con pruebas descritas en workflow.
5. Ejecutar `pnpm exec convex codegen`, `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start`.
