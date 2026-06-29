# Session State: CALAIRE App

**Last Updated**: 2026-06-28 21:21 -0500

## Session Objective

Implementar `dev/plan-protv2.md` siguiendo `dev/workflow-protv2.md` y `dev/targets-protv2.md`, con una separacion correcta entre el dashboard SGC maestro global y el dashboard documental operativo por ronda.

## Current State

- [x] Schema Convex extendido para SGC maestro:
  - `documentosSgc` ampliado con familia, ambito, modo de diligenciamiento, fuente editable, version vigente y referencias externas.
  - Nuevas tablas: `documentoSgcAnexos`, `requisitosNormativos`, `documentoRequisitos`, `registrosSgc`, `mapaSgcRelaciones`.
- [x] API Convex SGC maestro creada en `convex/sgc/maestro.ts` y exportada desde `convex/sgc.ts`.
- [x] Seeds auditables creados con `scripts/extract-sgc-seeds.mjs`.
- [x] Seeds importados a Convex con `scripts/import-sgc-seeds.mjs`.
- [x] Conteos verificados en Convex:
  - 52 documentos SGC.
  - 713 requisitos normativos.
  - 83 relaciones de mapa.
  - 1 ronda real.
- [x] Rutas SGC maestro global implementadas:
  - `/dashboard/sgc`
  - `/dashboard/sgc/documentos`
  - `/dashboard/sgc/documentos/[id]`
  - `/dashboard/sgc/normativa`
  - `/dashboard/sgc/mapa`
- [x] Dashboard documental por ronda separado:
  - `/dashboard/rondas/expedientes`
  - `/dashboard/rondas/[id]/sgc`
  - `/dashboard/sgc/expedientes` queda solo como redireccion de compatibilidad.
- [x] Navegacion principal separa `SGC`, `Gestion` y `Sistemas externos`.
- [x] `pt_app` tratado como referencia externa (`externalSystem: "pt_app"`), no como modulo interno.
- [x] Componentes legacy del antiguo resumen SGC removidos:
  - `SgcResumenClient.tsx`
  - `SgcTabs.tsx`
  - `TableroCoberturaRondas.tsx`
  - `MatrizInteractiva.tsx`
  - `app/(protected)/dashboard/sgc/actions.ts`
- [x] Descarga de version oficial agregada en `/dashboard/sgc/documentos/[id]/versiones/[versionId]/download`.
- [x] Matriz normativa permite relacionar documento-requisito desde UI para roles editores.
  - El formulario pesado de relacion queda bajo demanda por fila seleccionada para evitar renderizar 713 formularios x 52 documentos.
- [x] Registro derivado trazable creado para el MVP:
  - Documento: `F-PSEA-13`.
  - Ronda: `R1`.
  - Registro: `F-PSEA-13-R1-MVP`.
- [x] Permisos MVP basicos agregados:
  - `consulta` puede leer y descargar.
  - `admin_sgc` y `coordinador_proceso` pueden editar.
  - acciones de edicion ocultas para solo consulta.
- [x] `pnpm lint` pasa limpio.
- [x] `pnpm build` pasa.
- [x] Smoke Playwright autenticado SGC pasa:
  - portada SGC maestro separada de expedientes de ronda.
  - centro documental y detalle de documento.
  - matriz normativa persistida.
  - mapa SGC persistido con `pt_app` externo.
  - redireccion `/dashboard/sgc/expedientes` hacia `/dashboard/rondas/expedientes`.

## Critical Technical Context

- Regla corregida por el usuario: el SGC maestro global y el SGC/expediente de rondas son dos dashboards distintos.
- No volver a listar `/dashboard/sgc/expedientes` como ruta real del SGC maestro; es solo compatibilidad.
- Clasificacion correcta:
  - SGC maestro global: `/dashboard/sgc`, `/dashboard/sgc/documentos`, `/dashboard/sgc/documentos/[id]`, `/dashboard/sgc/normativa`, `/dashboard/sgc/mapa`.
  - Dashboard documental por ronda: `/dashboard/rondas/expedientes`, `/dashboard/rondas/[id]/sgc`.
- La portada `/dashboard/sgc` ya no debe renderizar resumen de cierre documental de rondas.
- Componentes legacy del resumen SGC global fueron eliminados para evitar que se vuelva a mezclar cierre documental de rondas con SGC maestro.
- Las rutas nuevas son server-rendered y usan `params/searchParams` como `Promise`, siguiendo Next 16 local.
- Convex fue regenerado con `pnpm exec convex codegen`.
- Para pruebas locales autenticadas deben estar corriendo ambos servicios:
  - `pnpm dev` en `http://localhost:3000`.
  - `pnpm exec convex dev` porque `.env.local` apunta `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3212`.
- Si Convex local no esta arriba, el dashboard falla con `Runtime TypeError: fetch failed` desde `ConvexHttpClient.queryInner`.

## Known Pending Work

- [x] Verificar si `app/(protected)/dashboard/sgc/SgcResumenClient.tsx`, `SgcTabs.tsx`, `TableroCoberturaRondas.tsx` y `MatrizInteractiva.tsx` siguen siendo necesarios o deben moverse/eliminarse para evitar confusion.
- [x] Completar acciones/UI para relacionar documentos con requisitos desde la matriz normativa.
- [x] Completar descarga de version oficial desde detalle de documento.
- [x] Mejorar permisos MVP: distinguir `admin_sgc`, `coordinador_proceso`, `consulta` en UI y backend, no solo admin general.
- [x] Documentos `dev/plan-protv2.md`, `dev/workflow-protv2.md`, `dev/targets-protv2.md` actualizados con la separacion corregida:
  - SGC maestro global no incluye expedientes de ronda.
  - Expedientes vive bajo Gestion/Rondas.
- [x] Revisado que `/dashboard/rondas/expedientes` es el listado agregado operativo y `/dashboard/sgc/expedientes` solo redirige.
- [x] Smoke UI autenticado agregado/actualizado en `tests/e2e/sgc-cobertura.auth.spec.ts`.
- [x] Decision final MVP del prototipo: `/dashboard/sgc/prototype` se conserva temporalmente por URL directa, sin enlace en portada productiva.

## Validation

- `pnpm lint`: pasa limpio.
- `pnpm build`: pasa.
- `pnpm exec playwright test tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium --workers=1 --timeout=30000 --reporter=list`: 5 passed.
- Smoke Convex de conteos: documentos 52, requisitos 713, mapa 83, rondas 1, registros derivados 1.

## Next Steps

1. Objetivo protv2 cerrado para MVP.
2. Mantener `pnpm dev` y `pnpm exec convex dev` activos al repetir smoke local autenticado.
