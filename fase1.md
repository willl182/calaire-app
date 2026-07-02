# Fase 1: E2E funcional y desacoplado de datos exactos

**Fecha**: 2026-06-30 21:36 -05  
**Actualizado**: 2026-06-30 22:11 -05  
**Estado**: cerrada  
**Target asociado**: Target 1 (`target_fix.md`)

## Cambios realizados

- Se eliminaron IDs de ronda hardcodeados de las specs funcionales SGC.
- Se agrego `tests/e2e/sgc-helpers.ts` para descubrir una ronda real desde `/dashboard?tab=rondas` y omitir solo los casos data-backed cuando no hay rondas.
- Se elimino `toHaveCount(12)` de smoke funcional; ahora se valida presencia funcional del panel cuando existe una ronda.
- Se quitaron screenshots de specs funcionales y se marcaron las specs de capturas con `@screenshots`.
- `playwright.config.ts` excluye specs `*screenshots*.auth.spec.ts` del proyecto `authenticated-chromium` normal.
- Se agrego `pnpm test:e2e:screenshots` como comando dedicado para capturas.
- Se ajustaron redirects legacy a la ruta real vigente: `/dashboard?tab=rondas`.
- Se ajustaron selectores fragiles a `href`, regex o UI actual.

## Avances frente a Target 1

- [x] No quedan IDs de ronda hardcodeados en specs funcionales.
- [x] Las pruebas buscan una ronda real desde la UI antes de abrir `/dashboard/rondas/<id>/sgc`.
- [x] Si no hay rondas, se omite solo el detalle data-backed.
- [x] No queda `toHaveCount(12)` en smoke funcional.
- [x] Selectores exactos fragiles reemplazados por regex, `href` o selectores de UI actual.
- [x] Redirects legacy esperan `/dashboard?tab=rondas`.
- [x] Specs de screenshots no corren en la suite funcional por defecto.

## Verificacion ejecutada

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e:start --project=chromium
pnpm test:e2e:start
rg "kd77ck9jqbeafg5g61c7cw0vrh8756qr|kd7b0emdk7cmzp1vn34f2bfv7986bb77|toHaveCount\\(12\\)" tests/e2e
```

Resultados:

- `pnpm lint`: verde.
- `pnpm test`: verde.
- `pnpm build`: verde.
- `pnpm test:e2e:start --project=chromium`: verde, 1 passed.
- `pnpm test:e2e:start`: verde, 6 passed / 3 skipped.
- `rg` critico: sin resultados.

## Problemas encontrados

- Convex estuvo offline durante E2E; la suite principal lo tolera para smoke, pero los casos data-backed se omiten cuando no hay documentos/rondas.
- Los skips observados fueron intencionales: detalle de documento SGC sin documentos disponibles, panel SGC de ronda sin ronda disponible, y formato seleccionado sin ronda disponible.
- No se ejecuto `pnpm test:e2e:screenshots` para no regenerar capturas existentes en `docs/screenshots/*`.

## Code review / Fixes (2026-06-30)

Revision del codigo de la implementacion de Fase 1 (specs Playwright, `sgc-helpers.ts`, `playwright.config.ts`), contrastado con las paginas reales. Detalle y verificacion en [`review_fix.md`](review_fix.md).

- **F9 (Media) — resuelto.** Se elimino la rama muerta del test `opens the SGC normative matrix`: ya no asevera texto inexistente `/sin requisitos.../`. El test ahora valida los encabezados reales y el contador visible `(\d+ requisitos filtrados)`, sin fingir un empty-state que todavia pertenece a F3/Fase 2.
- **F10 (Baja) — `#formato-F-PSEA-10` sigue hardcodeado.** Se removio el ID de ronda pero persiste un formato seed; si la ronda no lo tiene, el caso falla en vez de omitirse. Deuda aceptada (codigo de formato es identificador de dominio estable y solo corre data-backed).
- **F11 (Baja) — `discoverRoundSgcUrl` es heuristico.** Lanza (no `skip`) si cambia `heading /CALAIRE-APP/i` e infiere la URL agregando `/sgc` al primer enlace de ronda. Seguro hoy; preferible `a[href$="/sgc"]`.
- **F12 (Baja) — `@screenshots` es convencion de titulo, no tag estructurado.** El guard real es `testIgnore: screenshotSpecs`; el tag es cosmetico.

F9 queda cerrado en Fase 1 como fix de test. F10-F12 quedan como deuda documentada.

Verificacion adicional del cierre:

```bash
rg "table\\.count|sin requisitos|no hay requisitos|0 requisitos" tests/e2e/sgc-cobertura.auth.spec.ts
pnpm test:e2e:start tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium
pnpm lint
pnpm test
pnpm build
pnpm test:e2e:start
```

Resultados:

- `rg`: sin resultados.
- Playwright enfocado: 4 passed / 1 skipped.
- `pnpm lint`: verde.
- `pnpm test`: verde.
- `pnpm build`: verde.
- `pnpm test:e2e:start`: verde, 6 passed / 3 skipped.

## Pendientes

- Fase 2 debe cerrar los hallazgos F1-F3: banner offline y estados vacios visibles en rutas SGC/rondas.
- Implementar el empty-state real de normativa en Fase 2/F3 y ampliar el test al texto visible real cuando exista.
- Con Convex online y seeds cargados, re-ejecutar `pnpm test:e2e:start` para convertir los skips data-backed en validaciones efectivas.
- Ejecutar `pnpm test:e2e:screenshots` solo cuando se quiera actualizar documentacion visual.
