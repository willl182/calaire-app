# Plan: Cierre rama carga-referencia-csv y reconciliacion Convex/PT/Dashboard

**Created**: 2026-05-06 21:12 -05
**Updated**: 2026-05-06 21:55 -05
**Status**: in_progress
**Slug**: cierre-carga-referencia-csv-convex-pt-dashboard

## Objetivo

Cerrar de forma ordenada la rama real actual `carga-referencia-csv`, incorporando los ultimos cambios detectados: carga CSV para laboratorio de referencia, reorganizacion de archivos de datos/docs, y pendientes heredados de Convex/PT/dashboard. No se debe implementar ninguna restriccion de "maximo 2 participantes".

## Alcance actualizado segun Fase 0

- Rama actual detectada: `carga-referencia-csv`.
- Plan especifico relacionado: `logs/plans/260506_2109_plan_carga-referencia-csv.md`.
- Cambios de codigo actuales relacionados con carga CSV:
  - `app/(protected)/ronda/[codigo]/FormularioReferencia.tsx`
  - `app/(protected)/ronda/[codigo]/FormularioRonda.tsx`
  - `app/(protected)/ronda/[codigo]/actions.ts`
  - `app/(protected)/ronda/[codigo]/registro/FormularioRegistro.tsx`
  - `app/(protected)/ronda/[codigo]/registro/actions.ts`
  - `convex/fichas.ts`
  - `convex/schema.ts`
  - `lib/fichas.ts`
  - `lib/referencia-csv.ts`
  - `lib/referencia-csv.test.ts`
- Cambios de organizacion de archivos:
  - Datos movidos probablemente a `data/`.
  - Documentos/planes legacy movidos probablemente a `otros/`.
  - `docs/ronda_simple/*` aparecen eliminados sin equivalente detectado por basename.
- `package.json` solo tiene cambio de version de pnpm y formateo de `onlyBuiltDependencies`.

## Reglas de trabajo

- Usar `pnpm`, no `npm`, `npm run` ni `npx`.
- Para cualquier cambio Convex, leer primero `convex/_generated/ai/guidelines.md`.
- Next.js es 16.2.4; revisar docs locales de Next antes de tocar APIs Next no verificadas.
- No revertir ni borrar cambios no relacionados sin confirmacion.
- No implementar restriccion de participantes a 2.

## Fases y dependencias

### Fase 0: Higiene del worktree y diagnostico inicial ✅

**Tipo:** serie, completada.

| # | Archivo/Area | Accion | Resultado |
|---|--------------|--------|-----------|
| 0.1 | Git | Revisar branch, status y diff stat | Branch real: `carga-referencia-csv`. |
| 0.2 | `data/`, `otros/`, docs eliminados | Determinar movimientos probables | Datos a `data/`, legacy/docs a `otros/`; `docs/ronda_simple/*` sin equivalente detectado. |
| 0.3 | `logs/CURRENT_SESSION.md` | Corregir estado vivo | Pendiente falso de limitar a 2 removido del estado activo. |
| 0.4 | Git diff | Separar cambios de codigo vs datos/docs | Codigo CSV/fichas/schema identificado; datos/docs separados. |

**Criterio de salida:** worktree entendido y estado vivo actualizado.

---

### Fase 1: Cerrar funcionalidad de carga CSV de referencia

**Tipo:** prioridad actual; en serie despues de Fase 0. Algunas revisiones pueden paralelizarse internamente.

| # | Archivo/Area | Accion | Notas |
|---|--------------|--------|-------|
| 1.1 | `logs/plans/260506_2109_plan_carga-referencia-csv.md` | Reconciliar implementacion real vs plan | Confirmar que parser, accion bulk, UI y tests existen/completan el criterio. |
| 1.2 | `lib/referencia-csv.ts` | Revisar parser/normalizadores/preview | Validar columnas requeridas, NA, niveles, contaminantes y celdas destino. |
| 1.3 | `lib/referencia-csv.test.ts` | Ejecutar/revisar pruebas | Deben cubrir `data/referencia_ronda.csv`, niveles, NA y errores. |
| 1.4 | `app/(protected)/ronda/[codigo]/actions.ts` | Revisar accion bulk `guardarReferenciaCsvAction` | Debe validar auth, ronda, perfil `member_special`, pertenencia de items/grupos y numeros finitos. |
| 1.5 | `app/(protected)/ronda/[codigo]/FormularioReferencia.tsx` | Revisar UI de importacion | Previsualizar, advertir sobrescrituras, cargar, limpiar, deshabilitar si cerrado/enviado. |
| 1.6 | Formularios/registro/fichas/schema | Entender cambios colaterales | Validar si son necesarios para CSV o pertenecen a otro bloque. |
| 1.7 | Verificacion local | Ejecutar pruebas relevantes y typecheck parcial/global | Usar `pnpm`; registrar warnings/fallos. |

**Dependencias:** 1.1 primero; 1.2 y 1.3 pueden revisarse juntos; 1.4 y 1.5 dependen del contrato del parser; 1.7 al final.

**Criterio de salida:** carga desde `data/referencia_ronda.csv` completa la referencia CO/SO2 esperada, no cambia flujo de participantes regulares y permite revisar antes de enviar informe final.

---

### Fase 2: Reconciliar datos/docs movidos

**Tipo:** puede ir en paralelo con revisiones de Fase 1 si no toca codigo.

| # | Archivo/Area | Accion | Notas |
|---|--------------|--------|-------|
| 2.1 | `data/` | Confirmar que archivos de datos eliminados fueron movidos intencionalmente | Verificar nombres equivalentes detectados. |
| 2.2 | `otros/` | Confirmar que docs/planes legacy movidos son intencionales | Evitar mezclar limpieza documental con feature si no corresponde. |
| 2.3 | `docs/ronda_simple/*` | Decidir restaurar, mover o dejar eliminados | No se encontro equivalente; requiere decision explicita. |
| 2.4 | Git | Si se mantienen movimientos, considerar staging/commit separado | Separar de cambios de codigo de CSV. |

**Criterio de salida:** estrategia clara para archivos eliminados/no trackeados antes de PR/commit.

---

### Fase 3: Verificacion Convex del bloque CSV/fichas

**Tipo:** serie si se modifica Convex; leer guidelines primero.

| # | Archivo/Area | Accion | Notas |
|---|--------------|--------|-------|
| 3.0 | `convex/_generated/ai/guidelines.md` | Leer antes de tocar Convex | Obligatorio. |
| 3.1 | `convex/schema.ts` | Revisar cambios de schema | Confirmar compatibilidad con datos de referencia/fichas y no romper validadores existentes. |
| 3.2 | `convex/fichas.ts` | Revisar cambios | Determinar si pertenecen a CSV, ficha registro u otro bloque. |
| 3.3 | `lib/fichas.ts` | Revisar mapeos/defaults | Confirmar coherencia con schema y formularios. |
| 3.4 | Typecheck | Validar contratos Convex/lib/UI | `pnpm exec tsc --noEmit`. |

**Criterio de salida:** cambios Convex entendidos, justificados y type-safe.

---

### Fase 4: Pendientes heredados de codigo automatico PT/exportacion

**Tipo:** despues de cerrar o aislar la feature CSV; no prioridad si la rama actual es solo `carga-referencia-csv`.

| # | Archivo/Area | Accion | Notas |
|---|--------------|--------|-------|
| 4.1 | `convex/rondas.ts` | Confirmar estabilidad de `participantCode` | `claimParticipanteToken` y `regenerateParticipanteSlot` no deben modificarlo. |
| 4.2 | `convex/migrations.ts` | Revisar/validar `backfillParticipantCodes` | Dry-run antes de escritura real. |
| 4.3 | `convex/pt.ts`, `lib/rondas.ts` | Confirmar `participantCode` -> `participant_id` | Contrato para CSV PT/exportacion. |
| 4.4 | `export-pt.csv/route.ts` | Validar bloqueo por datos incompletos | `409 pt_export_incomplete` si falta codigo/replica. |

**Criterio de salida:** pendiente heredado cerrado o documentado como fuera de alcance de esta rama.

---

### Fase 5: Pendientes UX/dashboard heredados

**Tipo:** diferible; paralelizable si no toca archivos del CSV.

| # | Archivo/Area | Accion | Notas |
|---|--------------|--------|-------|
| 5.1 | `app/(protected)/dashboard/page.tsx` | Verificar seccion Rondas | Tabla plana, acciones visibles, formulario nueva ronda. |
| 5.2 | `app/(protected)/dashboard/SummaryActions.tsx` | Eliminar si obsoleto | Solo si sin referencias y dentro del alcance. |
| 5.3 | Dashboard/resultados | Reducir imports no usados | Opcional/no bloqueante. |

**Criterio de salida:** dejar claro si se cierra ahora o queda para otra rama.

---

### Fase 6: Verificacion final y preparacion de cierre

**Tipo:** serie, al final.

| # | Comando/Area | Accion | Notas |
|---|--------------|--------|-------|
| 6.1 | Tests parser CSV | Ejecutar prueba especifica si existe script viable | Prioridad para esta rama. |
| 6.2 | `pnpm exec tsc --noEmit` | Typecheck final | Debe pasar. |
| 6.3 | `pnpm lint` | Lint final | Registrar warnings restantes. |
| 6.4 | `pnpm build` | Build final | Debe pasar sin dependencias de red. |
| 6.5 | `git diff` | Revisar cambios por bloque | Separar CSV, Convex/fichas, datos/docs, logs. |
| 6.6 | PR/commit summary | Preparar resumen | Incluir verificaciones, riesgos y decisiones pendientes. |

**Criterio de salida:** rama lista para revision humana o lista de bloqueos concreta.

## Orden recomendado actualizado

1. Fase 1: cerrar carga CSV de referencia.
2. En paralelo o inmediatamente despues: Fase 2 para decidir datos/docs movidos.
3. Fase 3 si hay cambios Convex/fichas que mantener.
4. Fases 4 y 5 solo si se confirma que siguen dentro del alcance de esta rama; si no, documentarlas como heredadas/fuera de alcance.
5. Fase 6 final.

## Log de Ejecucion

- [x] Plan original creado.
- [x] Fase 0 iniciada.
- [x] Fase 0 completada.
- [x] Plan ajustado a la rama real `carga-referencia-csv` y al plan especifico `260506_2109_plan_carga-referencia-csv.md`.
- [x] Fase 1 completada.
  - Parser/preview revisado en `lib/referencia-csv.ts`.
  - Se ajusto `lib/referencia-csv.ts` para evitar dependencia runtime de `lib/rondas.ts` en tests Node; conserva imports de tipos y replica helpers puros necesarios.
  - Se ajusto `lib/referencia-csv.test.ts` para importar el parser con extension `.ts` y ejecutar con `node --test`.
  - Se habilito `allowImportingTsExtensions` en `tsconfig.json` para mantener typecheck verde con tests TS ejecutables por Node.
  - Accion bulk `guardarReferenciaCsvAction` revisada: valida auth, ronda activa, acceso, perfil `member_special`, codigos PT, envio final, pertenencia item/grupo y numeros finitos/no negativos.
  - UI `FormularioReferencia.tsx` revisada: previsualizar, cargar, limpiar, advertencias/errores, sobrescritura y bloqueo en solo lectura.
  - Verificaciones: `pnpm exec node --test lib/referencia-csv.test.ts`, `pnpm exec tsc --noEmit`, y eslint focal pasan.
- [x] Fase 2 completada.
  - Se confirmo que los archivos operativos eliminados de la raiz tienen equivalente en `data/`.
  - Se confirmo que documentos/planes legacy eliminados de raiz y `docs/` tienen equivalente en `otros/`.
  - Se restauraron `docs/ronda_simple/*` para evitar una eliminacion no relacionada con la feature.
  - Se agregaron `data/README.md` y `otros/README.md` para dejar explicita la estrategia de organizacion.
- [x] Fase 3 completada.
  - Se leyo completo `convex/_generated/ai/guidelines.md` antes de revisar Convex.
  - Cambios de schema/fichas revisados: nuevos campos de ficha son opcionales en schema salvo defaults en nuevas fichas, por compatibilidad con documentos existentes.
  - `convex/fichas.ts` permite persistir `diaLlegada`, `justificacionCambioEquipo` y `decProcedimientosCalaire` mediante allowlist validada.
  - `lib/fichas.ts` mapea snake_case/camelCase y aplica defaults para documentos existentes.
  - Se alinea `FichaAdminEditor.tsx` con los nuevos campos y labels para que administracion pueda ver/editar lo mismo que registro.
  - Verificaciones: `pnpm exec tsc --noEmit` y eslint focal pasan.
- [ ] Fase 3 completada.
- [ ] Fase 4 evaluada/cerrada o marcada fuera de alcance.
- [ ] Fase 5 evaluada/cerrada o marcada fuera de alcance.
- [ ] Fase 6 completada.
