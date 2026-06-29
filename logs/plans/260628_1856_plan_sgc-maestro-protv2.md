# Plan: SGC Maestro protv2

**Created**: 2026-06-28 18:56 -05
**Updated**: 2026-06-28 18:56 -05
**Status**: draft
**Slug**: sgc-maestro-protv2

## Objetivo

Transformar el prototipo `/dashboard/sgc/prototype` en una implementacion real de SGC Maestro CALAIRE con fuente unica de datos, rutas productivas, precarga auditada y separacion macro entre SGC, Gestion y `pt_app` externo.

## Fases

### Fase 0: Cierre del prototipo y alcance

| # | Archivo | Accion | Notas |
|---|---------|--------|-------|
| 0.1 | `dev/prototipo-appv2.md` | Revisar | Confirmar experiencia validada. |
| 0.2 | `dev/plan-protv2.md` | Usar como guia | Confirmar separacion SGC/Gestion/pt_app. |

### Fase 1: Fuente unica SGC y precarga

| # | Archivo | Accion | Notas |
|---|---------|--------|-------|
| 1.1 | `convex/_generated/ai/guidelines.md` | Leer | Obligatorio antes de tocar Convex. |
| 1.2 | `dev/Inventario Documental del SGC.md` | Extraer | Documentos maestros PEA. |
| 1.3 | `dev/req_17043.md` | Extraer | Requisitos ISO/IEC 17043:2023. |
| 1.4 | `dev/req_13528.md` | Extraer | Requisitos ISO 13528:2022. |
| 1.5 | `mapa_navegacion_sgc_pea.html` | Extraer | Bloques, rutas criticas y relaciones del mapa. |

### Fase 2: UI real y navegacion macro

| # | Archivo | Accion | Notas |
|---|---------|--------|-------|
| 2.1 | `node_modules/next/dist/docs/` | Leer | Obligatorio antes de tocar Next.js. |
| 2.2 | Rutas SGC | Implementar | Centro documental, detalle, normativa, expedientes, mapa. |
| 2.3 | Navegacion dashboard | Ajustar | SGC y Gestion internos; `pt_app` externo. |

## Log de Ejecucion

- [x] Plan detallado creado en `dev/plan-protv2.md`.
- [x] Workflow detallado creado en `dev/workflow-protv2.md`.
- [x] Targets creados en `dev/targets-protv2.md`.
- [x] Fuentes de precarga incorporadas al plan.
- [ ] Usuario revisa/aprueba separacion macro.
- [ ] Se define fuente ISO/IEC 17025:2017 o placeholder.
- [ ] Se implementa extractor/seed intermedio.
- [ ] Se implementa schema Convex.
- [ ] Se reemplaza prototipo por rutas reales.
