# Plan: Refactorizacion por Etapas para Mantenibilidad

**Created**: 2026-06-10 00:06 -05
**Status**: draft
**Slug**: refactorizacion-mantenibilidad

## Objetivo

Reducir el riesgo de mantenibilidad causado por modulos grandes sin romper el aplicativo. El refactor debe preservar las interfaces publicas actuales, especialmente las referencias Convex `api.rondas.*`, `api.sgc.*` y `api.agent.*`, mientras se extrae implementacion por dominio.

## Riesgos Iniciales

- `convex/sgc.ts`: aproximadamente 1867 lineas.
- `convex/agent.ts`: aproximadamente 1724 lineas.
- `app/(protected)/dashboard/page.tsx`: aproximadamente 1692 lineas.
- `convex/rondas.ts`: aproximadamente 1382 lineas.
- `lib/rondas.ts`: aproximadamente 1286 lineas.

El riesgo principal no es visual sino de localidad: entender o cambiar una regla de negocio obliga a tocar archivos demasiado grandes y mezclados.

## Principio de Refactor

Usar un enfoque incremental tipo strangler:

- Mantener fachadas publicas durante varias fases.
- Extraer implementacion a modulos internos por dominio.
- No cambiar rutas, acciones, exports publicos ni referencias Convex sin una fase explicita de migracion.
- Agregar tests de caracterizacion antes de mover logica critica.
- Ejecutar Playwright y tomar capturas en cada fase que toque UI.

## Roadmap

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

## Fase 0: Baseline Tecnica

Antes de tocar codigo:

1. Ejecutar `pnpm lint`.
2. Ejecutar `pnpm build`.
3. Ejecutar `pnpm test:e2e` o `pnpm test:e2e:start`.
4. Confirmar que `.auth/workos.json` existe o correr `pnpm test:e2e:auth:manual`.
5. Tomar capturas baseline con Playwright de:
   - `/login`
   - `/dashboard`
   - `/dashboard/sgc`
   - pestaña "Cobertura por Ronda"
   - pestaña "Documentos"

Target: crear `docs/screenshots/refactor-baseline/` para comparar visualmente cada fase.

## Fase 1: Tests de Caracterizacion

Agregar o fortalecer tests antes de extraer:

- `lib/rondas`:
  - `filtrarParticipantes`
  - `derivarEstadoOperativo`
  - `buildResultadosCsv`
  - `buildPTCsv`
  - `isInitialConcentrationLevel`
  - `getRequiredPTReplicateCount`
- `lib/sgc`:
  - `calcularChecklistSgc`
  - `derivarBloqueantes`
  - `agruparChecklistPorFase`
  - matriz documental
  - reglas de documentos obligatorios/opcionales
- Dashboard:
  - Playwright smoke de `/dashboard`
  - presencia de rondas
  - cambio de tab
  - acciones visibles por estado

Target: los tests deben describir el comportamiento actual, incluso si el diseño interno todavia es malo.

## Fase 2: Refactor de `lib/rondas.ts`

Extraer sin cambiar imports publicos todavia. `lib/rondas.ts` queda como fachada que re-exporta.

Estructura sugerida:

```txt
lib/rondas/
  constants.ts
  types.ts
  filtros.ts
  csv.ts
  pt.ts
  estados.ts
  metricas.ts
  client.ts
  index.ts
lib/rondas.ts
```

Targets:

- `lib/rondas.ts`: <20 lineas.
- `lib/rondas/index.ts`: <150 lineas.
- cada modulo: idealmente <300 lineas.
- cero cambios en callers.

Validacion:

- `pnpm lint`
- `pnpm build`
- unit tests de `lib/rondas`
- Playwright `/dashboard` y flujo de resultados/PT
- capturas si cambia cualquier componente que use datos de rondas

## Fase 3: Refactor de `app/(protected)/dashboard/page.tsx`

Dividir entre carga de datos, helpers y UI. No cambiar UX.

Estructura sugerida:

```txt
app/(protected)/dashboard/
  page.tsx
  data.ts
  view-model.ts
  components/
    RondaConfigForm.tsx
    RondaStatusActions.tsx
    RondasTable.tsx
    ParticipantesPanel.tsx
    ResultadosPanel.tsx
    PtItemsPanel.tsx
    DashboardTabs.tsx
```

Targets:

- `page.tsx`: <450 lineas.
- componentes individuales: <250 lineas.
- helpers de formato fuera del page.
- no duplicar llamadas a Convex.

Validacion:

- `pnpm lint`
- `pnpm build`
- Playwright:
  - `/dashboard`
  - tabs principales
  - edicion de ronda si hay fixture/auth disponible
  - estado vacio si aplica
- capturas:
  - `docs/screenshots/refactor-fase-3/01-dashboard.png`
  - `docs/screenshots/refactor-fase-3/02-rondas.png`
  - `docs/screenshots/refactor-fase-3/03-participantes.png`
  - `docs/screenshots/refactor-fase-3/04-resultados.png`

## Fase 4: Refactor de `convex/rondas.ts`

No mover todavia los exports publicos. Convex usa file-based routing, asi que `api.rondas.listRondas` debe seguir existiendo.

Extraer implementacion interna:

```txt
convex/rondas/
  validators.ts
  access.ts
  reads.ts
  participantes.ts
  resultados.ts
  pt.ts
  mutations.ts
  mapping.ts
convex/rondas.ts
```

Targets:

- `convex/rondas.ts`: <500 lineas.
- logica compartida en helpers tipados.
- validators centralizados.
- sin cambios en `api.rondas.*`.

Validacion:

- leer siempre `convex/_generated/ai/guidelines.md` antes de tocar Convex.
- `pnpm build`
- `pnpm lint`
- e2e dashboard/rondas
- pruebas manuales de crear/editar/cerrar/reabrir ronda si no hay e2e completo

## Fase 5: Refactor de `convex/sgc.ts`

Mantener `api.sgc.*` estable y extraer implementacion.

Estructura sugerida:

```txt
convex/sgc/
  validators.ts
  panel.ts
  documentos.ts
  evidencias.ts
  plan-ronda.ts
  revision-datos.ts
  revision-homogeneidad.ts
  hitos.ts
  comunicaciones.ts
  publicaciones.ts
  comentarios.ts
  notificaciones.ts
  casos.ts
  audit.ts
convex/sgc.ts
```

Targets:

- `convex/sgc.ts`: <600 lineas.
- documentos, comunicaciones y casos separados.
- helpers compartidos sin duplicar auth/audit.
- mantener `api.sgc.*`.

Validacion:

- `pnpm build`
- `pnpm lint`
- Playwright existente:
  - `sgc-cobertura.auth.spec.ts`
  - `sgc-fase2.auth.spec.ts`
  - `sgc-fase3-screenshots.auth.spec.ts`
- capturas:
  - `docs/screenshots/refactor-fase-5/01-resumen-sgc.png`
  - `docs/screenshots/refactor-fase-5/02-cobertura-rondas.png`
  - `docs/screenshots/refactor-fase-5/03-matriz-documental.png`
  - `docs/screenshots/refactor-fase-5/04-formulario-documento.png`
  - `docs/screenshots/refactor-fase-5/05-casos-sgc.png`

## Fase 6: Refactor de `convex/agent.ts`

Separar por capacidad de agent-api, no solo por tabla.

Estructura sugerida:

```txt
convex/agent/
  auth.ts
  rondas.ts
  participantes.ts
  resultados.ts
  pt.ts
  fichas.ts
  sgc.ts
  mutations.ts
  mapping.ts
convex/agent.ts
```

Targets:

- `convex/agent.ts`: <500 lineas.
- autorizacion agent centralizada.
- cero divergencia de reglas con `convex/rondas.ts` y `convex/sgc.ts`.
- reducir duplicacion sin acoplar transacciones Convex de forma peligrosa.

Validacion:

- tests sobre rutas:
  - `/agent/auth`
  - `/agent/me`
  - `/agent/v1/...`
- smoke test con token valido si existe fixture.
- casos negativos:
  - sin token
  - token invalido
  - recurso no permitido

## Fase 7: Limpieza y Consolidacion

Solo despues de estabilizar:

- evaluar si algunas fachadas pueden desaparecer.
- documentar modulos principales en `CONTEXT.md` o `docs/architecture.md`.
- agregar regla de tamano maximo orientativa:
  - UI pages: <500 lineas.
  - Convex fachadas: <600 lineas.
  - modulos de dominio: <300-400 lineas salvo justificacion.
- agregar checklist de PR:
  - `pnpm lint`
  - `pnpm build`
  - tests unitarios
  - Playwright relevante
  - capturas si toco UI

## Orden Recomendado

1. `lib/rondas.ts`
2. `app/(protected)/dashboard/page.tsx`
3. `convex/rondas.ts`
4. `convex/sgc.ts`
5. `convex/agent.ts`

Este orden reduce riesgo porque primero se extrae logica local y UI con menor probabilidad de romper referencias Convex. Luego se toca backend manteniendo APIs publicas estables. `agent.ts` queda despues porque depende de varias areas.

## Criterio de Exito

El refactor esta sano si al final:

- las rutas publicas siguen iguales.
- `api.rondas.*`, `api.sgc.*` y `api.agent.*` no cambian sin migracion explicita.
- los archivos grandes bajan al rango objetivo.
- cada dominio tiene tests propios.
- cada fase deja capturas comparables.
- una nueva feature de rondas, participantes, resultados, SGC o agent-api puede tocar 1-3 modulos, no cinco archivos gigantes.
