# Fase 5 - Cierre funcional

**Fecha**: 2026-07-01
**Alcance**: Target 9 de `target_fix.md`, siguiendo `workflow_fix.md`.

## Cambios implementados en esta fase

- Corregido `scripts/import-sgc-seeds.mjs` para invocar las funciones SGC con el segmento Convex real `sgc/index:*`, consistente con la regla del repo donde `convex/sgc/index.ts` permanece como segmento explicito.
- Actualizada `tests/e2e/sgc-fase2.auth.spec.ts` contra la UI vigente del expediente SGC:
  - descubre una ronda real con `skipWhenNoRound`;
  - valida `SGC de la ronda`, `Expediente documental de la ronda`, checklist documental y formularios F-PSEA-06/F-PSEA-13/F-PSEA-11;
  - reemplaza la expectativa obsoleta de atributo `open` por la clase de foco real `ring-amber-300`;
  - usa selectores accesibles especificos para el formato F-PSEA-10.

## Verificacion ejecutada

```bash
pnpm lint
pnpm test
pnpm build
pnpm exec convex codegen
pnpm test:e2e:start
pnpm exec convex dev --once
pnpm sgc:import-seeds
pnpm exec convex dev --tail-logs disable
pnpm test:e2e:start tests/e2e/sgc-fase2.auth.spec.ts --project=authenticated-chromium
pnpm test:e2e:start --project=authenticated-chromium
```

Resultados:

- `pnpm lint`: verde.
- `pnpm test`: verde, 4 archivos / 9 tests.
- `pnpm build`: verde.
- `pnpm exec convex codegen`: verde.
- `pnpm test:e2e:start`: verde, 6 passed / 3 skipped intencionales con Convex local apagado.
- `pnpm exec convex dev --once`: verde; funciones Convex listas.
- `pnpm sgc:import-seeds`: verde despues del fix `sgc/index:*`; importo 51 documentos, 1.047 requisitos y 82 relaciones de mapa.
- `pnpm test:e2e:start tests/e2e/sgc-fase2.auth.spec.ts --project=authenticated-chromium`: verde, 2 passed con Convex local activo.
- `pnpm test:e2e:start --project=authenticated-chromium`: verde, 8 passed con Convex local activo y seeds.

## Avances por target

- Target 9 queda cerrado para el alcance local: lint, tests unitarios, build, codegen, E2E smoke degradado y E2E autenticado con seeds pasaron.
- La deuda operativa de Target 5 sobre confirmar `pnpm sgc:import-seeds` con funciones internas quedo cerrada.
- La suite data-backed ya no depende de IDs hardcodeados ni de expectativas visuales obsoletas para el panel SGC de ronda.

## Code review / fixes Fase 5

Revision de los dos cambios de esta fase y de la coherencia del cierre. Detalle completo en [`review_fix.md`](review_fix.md) (F31-F35). Los dos cambios de Fase 5 son correctos y estan verificados; los hallazgos son un fix incompleto y brechas de cierre.

- **F31 (Media) — resuelto.** El fix `sgc:` -> `sgc/index:` se habia aplicado **solo** a `scripts/import-sgc-seeds.mjs`. `scripts/upload-sgc-document-versions.mjs` (cableado a `pnpm sgc:upload-document-versions`) seguia invocando `sgc:generateUploadUrl`, `sgc:listSgcMaestro` y `sgc:registrarVersionOficial`; como `convex/sgc/index.ts` es segmento explicito, fallarian con el mismo "function not found". Se corrigieron los tres a `sgc/index:*` (`node --check` verde). Deuda relacionada cerrada: `scripts/poblar-plan-r1.mjs` usaba `sgc:seedPlanRonda`, funcion inexistente en `convex/`, y no estaba wired en `package.json`; se elimino como codigo muerto.
- **F32 (Baja) — resuelto.** `tests/e2e/sgc-fase2.auth.spec.ts` aseveraba el boton `Registrar evidencia`, que solo aparece cuando F-PSEA-10 no tiene evidencia vigente; con evidencia cargada el boton dice `Reemplazar evidencia` y el caso fallaria. Se cambio a `getByRole('button', { name: /Registrar evidencia|Reemplazar evidencia/ })`; la corrida verde actual sigue satisfaciendola.
- **F33 (Media/doc) — resuelto.** `target_fix.md` tenia Target 9 y Target 10 con criterios sin marcar pese al cierre declarado aqui; se marcaron con evidencia y bloque de estado. `diagnostico.md` ya quedo complementado con el cierre de verificacion final.
- **F34 (Baja) — deuda aceptada.** Target 6 (consultas Convex acotadas/indexadas) se cierra por inventario y deuda documentada: el arreglo funcional no introdujo `.collect()` nuevos, pero quedan 215 en `convex/` como deuda de rendimiento para una auditoria posterior.
- **F35 (Baja/proc) — abierto.** F30 (screenshots `fase-3/*` dirty) y F27 (fases sin commitear / rundowns untracked) quedan como procedimiento del commit de cierre (ver abajo).

Verificacion de los fixes de review: `node --check scripts/upload-sgc-document-versions.mjs` verde; `tsc --noEmit` sin errores nuevos en la spec.

## Problemas pendientes

- `docs/screenshots/fase-3/*` siguen modificados desde antes de esta fase; Fase 5 no los revirtio ni regenero.
- El arbol mantiene cambios acumulados de Fases 1-5 y documentos/rundowns untracked; deben agregarse explicitamente al preparar el commit de cierre.
- Durante Playwright aparecen warnings no bloqueantes de React sobre formularios con `action` funcion y `method`/`encType`; no rompen la suite, pero conviene limpiarlos en una fase posterior.
- Convex reporta que existe una actualizacion menor disponible y que los AI files estan desactualizados; no se actualizo tooling porque no era parte del cierre funcional.
