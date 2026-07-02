# Drive documental SGC - Fase 7

Fecha: 2026-07-02

## Cambios implementados

- Se agrego `collectDriveCierreCalidad` en `convex/sgc/shared.ts` para evaluar el expediente Drive contra el catalogo `SGC_RONDA_ETAPAS`.
- La evaluacion de cierre Drive ahora reporta:
  - recursos documentales faltantes;
  - recursos retirados que no cuentan como cobertura vigente;
  - recursos `no_aplica` sin justificacion;
  - recursos `reemplazado` sin enlace vigente o motivo;
  - recursos sin enlace editable;
  - formatos criticos con editable no `diligenciado`;
  - definitivos recomendados ausentes como advertencia no bloqueante.
- `transitionRondaToDocumentacionPendiente` y `transitionRondaToCerrada` ahora integran los bloqueantes Drive junto con los faltantes del checklist SGC.
- Las transiciones auditadas `sgc.ronda.documentacion_pendiente` y `sgc.ronda.cerrada` registran el numero de advertencias Drive por definitivos faltantes.
- `getPanelSgc` devuelve `driveCierre` para que la UI pueda mostrar el reporte de cierre.
- Se extendio el tipo `SgcPanel` en `lib/sgc/index.ts` con `driveCierre`.
- En `/dashboard/rondas/[id]/sgc` se agrego la seccion `Cierre documental SGC`:
  - muestra bloqueantes concretos;
  - muestra advertencias por definitivos recomendados;
  - muestra resumen de recursos Drive;
  - permite pasar a documentacion pendiente, cerrar documentalmente o reabrir segun estado;
  - deshabilita avance cuando hay bloqueantes.

## Avances frente a la fase 7

- El cierre documental ya considera el estado del Drive documental.
- Los editables `diligenciado` permiten cierre aunque no exista definitivo.
- Los definitivos faltantes quedan visibles como recomendacion no bloqueante.
- Los documentos concretos que bloquean se listan en UI y en el mensaje de error de la mutacion.
- Los recursos retirados no cuentan como cobertura vigente.
- La regla aplica tanto desde la pagina SGC como desde cualquier server action que use las mutaciones SGC publicas.

## Problemas pendientes

- Falta prueba manual con una ronda real en los tres estados clave: `activa`, `documentacion_pendiente` y `cerrada`.
- No se agregaron tests automatizados de cierre Drive; quedan para Target 11/hardening.
- Las mutaciones agent internas de SGC mantienen su comportamiento previo y no fueron ampliadas en esta fase.
- `pnpm test:e2e:start` no se ejecuto en esta pasada porque la suite requiere `pnpm exec convex dev` local levantado para SSR autenticado estable.

## Verificacion

- `pnpm exec convex codegen`: paso.
- `pnpm lint`: paso.
- `pnpm build`: paso.

## Code review / fixes (2026-07-02)

Revision completa en `review_drive.md`. Resumen de hallazgos de esta fase:

- **F1 (alta):** `collectDriveCierreCalidad` bloquea toda ronda sin expediente Drive inicializado
  (un bloqueante por documento del catalogo). Como `inicializarDriveRonda` es solo manual, las
  rondas preexistentes no pueden pasar a `documentacion_pendiente` ni `cerrada`. Fix sugerido:
  cuando `recursosDocumentales === 0`, emitir un unico bloqueante accionable y ofrecer la CTA de
  inicializacion.
- **F2 (media):** la UI (`page.tsx`) deshabilita ambos botones con el checklist completo, pero la
  mutacion de `documentacion_pendiente` solo bloquea en un subconjunto de 5 items (+ Drive). El
  gating de UI debe ser especifico por etapa.
- **F3 (baja):** unificar la fuente de faltantes entre UI (`derivarBloqueantes`) y mutacion
  (`collectChecklistFaltantes`) para que la lista mostrada coincida con el error real.
- **F4 (baja):** consolidar `normalizeCodigo` (drive.ts) y `normalizeCodigoDocumento` (shared.ts)
  en un helper compartido.

Estado: fixes aplicados y verificados el 2026-07-02.

- **F1 aplicado:** `collectDriveCierreCalidad` ya no genera un bloqueante por cada documento cuando
  no hay expediente Drive. Devuelve un unico bloqueante accionable: "Expediente Drive no
  inicializado"; la seccion de cierre muestra CTA para inicializar el expediente.
- **F2 aplicado:** `getPanelSgc` expone bloqueantes separados para `documentacion_pendiente` y para
  cierre completo. La UI deshabilita cada boton con el mismo criterio que valida su mutacion.
- **F3 aplicado:** la lista de faltantes mostrada en UI sale de los mismos helpers Convex usados por
  las mutaciones (`collectChecklistFaltantes` y
  `collectChecklistFaltantesDocumentacionPendiente`).
- **F4 aplicado:** `convex/sgc/drive.ts` usa `normalizeCodigoDocumento` desde `shared.ts`; se elimino
  el normalizador local duplicado.

Verificacion final:

- `pnpm exec convex codegen`: paso.
- `pnpm lint`: paso.
- `pnpm build`: paso.
