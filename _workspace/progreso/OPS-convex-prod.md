# OPS: despliegue de Convex prod antes del push de `main`

Fecha: 2026-11-25. Rama de trabajo: `ops/convex-prod-deploy`, avanzada a `main` @ cfc7a7c, sin commits propios.
Prod: `steady-kiwi-725`. Dev: `pastel-hummingbird-770`. `origin/main` @ 57f3645.

## Conclusión

El Convex de `main` es compatible hacia atrás con el frontend de `origin/main` y con los datos de prod.
No hace falta ajustar código. Orden seguro: `convex deploy` a prod, luego `git push` de `main`.
La migración `backfillReplicateCodes` es opcional y tiene un caso a decidir (ver abajo).

## 1. Análisis de `git diff origin/main..main -- convex` (23 archivos)

### Esquema (`convex/schema.ts`)
- Solo cambia `sgcDriveRecursos`: tres campos nuevos, todos `v.optional(...)`:
  `aplica` (boolean | null), `aprobadoAt` (number | null), `aprobadoPor` (string | null).
- Sin tablas nuevas, sin campos obligatorios nuevos, sin índices nuevos ni eliminados.
- El nuevo esquema es un superconjunto estricto del actual: los datos de prod no pueden fallar la validación.
  Comprobado en prod: ninguno de los 119 `sgcDriveRecursos` tiene esos campos (correcto, quedan `undefined`).
- `rondaParticipantes.replicateCode` ya era opcional en prod; no cambia.

### Funciones
- Comparación de `convex function-spec --prod` (prod) con `convex function-spec` en dev tras empujar `main`:
  - Ninguna función de prod desaparece ni se renombra.
  - 10 queries/mutations públicas nuevas, todas en `sgc/index`: `getSincronizacionExpediente`, `actualizarExpediente`,
    `getAvanceExpediente`, `getEstadoDriveRonda`, `getSiguientePasoExpediente`, `marcarAplicaDocumento`,
    `aprobarDocumentoExpediente`, `getHitosExport`, `getEquiposExport`, `getEstadoAutomatico`.
  - 1 interna nueva: `migrations:backfillReplicateCodes`.
  - Ningún cambio de `args` en funciones existentes.
- Llamadas `api.*` del frontend:
  - `origin/main`: 180 referencias, todas existen en prod hoy.
  - `main`: 190 referencias; solo faltan en prod las 10 nuevas de arriba. Es el fallo que evita el deploy previo.
- Cambios de retorno: `listDriveRecursos` y `getDriveTree` devuelven el recurso enriquecido con el catálogo
  (`critico`, `bloqueaCierre` vigentes y un objeto `politica`). Sus validadores de retorno son `v.any()`,
  así que el frontend antiguo sigue funcionando (solo ve campos de más).
- No hay `process.env` nuevo en `convex/`: no hacen falta variables de entorno nuevas en prod.

### Cambios de comportamiento que afectan al frontend antiguo durante la ventana entre deploy y push
- Activar una ronda (`updateRondaEstado`, `transitionRondaEstado`) ahora exige que los niveles PT cuadren
  con los niveles por contaminante. Las 4 rondas `activa` de prod no se ven afectadas (ya están activas).
  `EA-CIL-2026` (borrador) cuadra: NO2/NO/O3 con 5 ítems PT y 5 niveles.
- `createPTItem` / `createPTItemsBulk` rechazan superar los niveles definidos. En prod:
  - `EA-PP2026-R2` tiene 5 ítems PT por contaminante y `niveles = 1`: ya no se le podrán añadir más ítems.
  - `EA-PP2026-R3` tiene SO2 y CO definidos (5 niveles) sin ítems PT: se pueden cargar hasta 5.
  Es el comportamiento buscado por la Ola A; no rompe lecturas.
- Altas de participantes asignan `replicateCode` automáticamente (referencia 1, participantes 2, 3, …).
- F-PSEA-11 y F-PSEA-14 dejan de bloquear el cierre.

### Migración `backfillReplicateCodes`
- Idempotente, `dryRun = true` por defecto. No es necesaria para que la app funcione
  (el plan la marcaba como "solo código + test; no se ejecuta en prod").
- Simulación local con los datos de prod (misma lógica que `planReplicateCodes`):

| Ronda | Cupo | Código asignado |
|---|---|---|
| EA-CIL-2026 | referencia (pendiente) | 1 |
| EA-CIL-2026 | participante 01 (pendiente) | 2 |
| EA-CIL-2026 | participante 02 (pendiente) | 3 |
| EA-PP-R3 | referencia (pendiente) | **2** |
| EA-PP-R3 | participante 02 (pendiente) | 3 |
| EA-PP-R3 | participante 03 (pendiente) | 4 |

- Caso a decidir: en `EA-PP-R3` el participante `depulgar@unal.edu.co` ya tiene `replicateCode = 1` puesto a mano.
  Como la migración no pisa valores existentes, la referencia recibiría 2, contra la convención pt_app.
  Opciones: corregir antes a mano el código de ese participante a 2 en Configuración PT, o aceptar el 2 de la referencia.
- Datos heredados (no los toca la migración): en `EA-PP2026-R1`, `R2` y `R3` la referencia y el participante tienen ambos `replicateCode = 1`.

## 1b. Integración de `fix/detalles-menores` (nota del coordinador)

- El CI ejecuta `pnpm sgc:validate-documents`, que fallaba en `main` @ 5ee1044 porque a P-PSEA-20 le faltaba la sección de F-PSEA-21.
- El coordinador lo corrigió en `fix/detalles-menores` (9970588) y ya lo integró: `main` está ahora en cfc7a7c (95 commits sobre `origin/main`).
- Esos commits solo tocan un documento SGC y tres páginas del frontend. No cambian `convex/` (`git diff 5ee1044 cfc7a7c -- convex` vacío) ni añaden llamadas `api.*`.
  El análisis de Convex de arriba sigue valiendo sin cambios.
- Consecuencia para el orden: el deploy de Convex y el push se hacen desde cfc7a7c (o un `main` posterior),
  nunca desde 5ee1044, para que el CI del push pase la validación de documentos.

## 2. Validaciones hechas

| Comprobación | Resultado |
|---|---|
| `nice -n 10 pnpm test` (5ee1044 y cfc7a7c) | 29 archivos, 136 tests OK |
| `pnpm lint` (5ee1044 y cfc7a7c) | OK |
| `pnpm exec tsc --noEmit` (5ee1044 y cfc7a7c) | OK |
| `pnpm sgc:validate-documents` | Falla en 5ee1044, OK en cfc7a7c |
| `pnpm build` (cfc7a7c) | OK |
| `convex dev --once --typecheck enable` (dev) | OK, `_generated` sin cambios |
| `convex deploy --dry-run` (prod) | Abortó al pedir confirmación interactiva; no se envió nada |

Operaciones contra prod hechas en esta sesión, todas de solo lectura:
`convex data --prod <tabla>` (rondas, rondaParticipantes, rondaContaminantes, rondaPtItems, rondaPtSampleGroups, sgcDriveRecursos) y `convex function-spec --prod`.

## 3. Plan de despliegue (pendiente de confirmación del usuario)

Desde un checkout en `main` @ cfc7a7c (o esta rama, que es idéntica), con la CLI autenticada en el proyecto:

```bash
# 0. Comprobación previa
git rev-parse main            # cfc7a7c0c6c28ba62c3ebca4e66fc0e6cf6353cd (o posterior)
git status --short            # limpio
pnpm sgc:validate-documents   # debe pasar: si falla, no seguir
git diff --stat cfc7a7c main -- convex   # si main avanzó y esto no está vacío, repetir el análisis

# 1. Convex prod primero (compatible con el frontend actual de prod)
pnpm exec convex deploy -y --typecheck enable --message "Olas A-E + detalles menores (main cfc7a7c)"
#   -y es una opción oculta de la CLI 1.38: sin ella pide confirmación interactiva.

# 2. Verificar que las funciones nuevas existen en prod
pnpm exec convex function-spec --prod | grep -c 'getAvanceExpediente\|getEstadoAutomatico'   # esperado: 2

# 3. Publicar el frontend (Vercel despliega Production automáticamente)
git push origin main

# 4. (Opcional) migración de códigos de réplica, primero en seco
pnpm exec convex run --prod migrations:backfillReplicateCodes '{}'
pnpm exec convex run --prod migrations:backfillReplicateCodes '{"dryRun": false}'
```

Rollback: si el paso 1 falla, prod queda como está (el push es atómico). Si algo falla tras el paso 3,
el Convex nuevo sigue sirviendo al frontend antiguo, así que basta con revertir el despliegue en Vercel.

Pendiente de verificar por el usuario: que `NEXT_PUBLIC_CONVEX_URL` de Vercel Production apunte a
`https://steady-kiwi-725.convex.cloud` (no se ejecutó `vercel` en esta sesión).

## 4. Ejecución (2026-11-25, con confirmación del usuario: "lleva a prod")

1. Comprobación previa: `main` = `HEAD` = cfc7a7c, `convex/` sin cambios, validación de documentos SGC OK, `origin/main` sin commits nuevos.
2. `pnpm exec convex deploy -y --typecheck enable --message "Olas A-E + detalles menores (main cfc7a7c)"`:
   OK en `steady-kiwi-725`. "No indexes are deleted by this push", "Schema validation complete".
3. Verificación: prod pasó de 295 a 306 funciones, ninguna perdida; el conjunto es idéntico al de `main` en dev.
4. `git push origin main`: `57f3645..fa6a68a`. `main` había avanzado a fa6a68a entre la comprobación y el push.
   El commit extra (`docs(progreso): pendientes tras las Olas A–E`) solo añade `_workspace/progreso/POST-E.md`:
   sin cambios en `convex/` ni en `src/`, así que el Convex desplegado sigue siendo el correcto.
5. Migración `backfillReplicateCodes`: no ejecutada. Queda pendiente la decisión sobre EA-PP-R3.
6. Vercel Production de fa6a68a: `success` ("Deployment has completed").
   Registros recientes de Convex prod (`convex logs --prod --history 200`): sin errores ni funciones inexistentes.

## 5. Decisión sobre `replicateCode`: la referencia siempre lleva 1

Decisión del usuario: referencia = 1 siempre; participantes 2, 3, …

### Código (rama `ops/convex-prod-deploy`, sin desplegar en prod)
- `69f4ce1` `fix(rondas)`: `planReplicateCodes` aplica la regla nueva.
  - La referencia recibe 1 aunque un participante ya lo tenga a mano.
  - El participante con 1, sin código, con un código no válido o repetido pasa al siguiente libre (>= 2). Ante repetidos conserva el código quien se dio de alta primero.
  - Con varias referencias, la principal es la que ya tiene 1 (o la primera en alta); las demás se tratan como participantes.
  - Cada cambio devuelve el código anterior. Idempotente: sobre una ronda conforme no propone nada.
- `0c410eb` `fix(migrations)`: `backfillReplicateCodes` usa ese plan, mantiene `dryRun = true` por defecto y excluye las rondas con resultados.
  - Una ronda tiene resultados si tiene envíos PT finales, puntajes (`ptScores`), evaluación (`ptEvaluaciones`) o resultados de pt_app (`sgcResultadosPtApp`).
  - Las excluidas salen en `excluidas` con sus motivos y el plan previsto, sin tocarse.
  - Solo se corrigen si se pasan en `incluirRondasConResultados`, como corrección aparte.
- Tests nuevos en `convex/replicate-codes.test.ts`: casos de EA-PP-R3, datos heredados, repetidos, sin referencia, varias referencias, idempotencia y exclusión por envíos finales.
- Validación: `nice -n 10 pnpm test` (144 tests OK), `pnpm lint` OK, `pnpm exec tsc --noEmit` OK.
  En dev, `convex dev --once` y la migración en seco funcionan (dev ya cumple la regla: 0 cambios).

### ¿Se usa `replicateCode` para casar resultados?
- **Dentro de la app, no.** La importación de puntajes (`convex/pt/scores.ts`, CSV `participant_code`) casa por `participantCode`.
  `listResultadosPTRonda`, `ptScores` y los casos usan el id del participante (`rondaParticipanteId`).
  Ninguna tabla guarda una copia de `replicateCode`.
- **Hacia pt_app, sí se exporta.** El CSV de envíos (`listEnviosPTRound`, `export-pt.csv`, API de agente `pt.ts`)
  incluye `participant_id` y `replicate`, leído en vivo del participante. Solo exporta envíos finales.
- **En pt_app** (`/home/w421/w421/pt_app`), la referencia se identifica por `participant_id = "ref"` y los cálculos
  agrupan por `participant_id`. `replicate` no se usa para casar participantes; en homogeneidad y estabilidad es la réplica de muestra, que es otro concepto.
- **Riesgo real.** Renumerar una ronda cuyo CSV ya se exportó haría que un CSV nuevo no coincidiera con el ya
  procesado o archivado en pt_app, en informes y en el registro de códigos F-PSEA-07. No rompe nada dentro de la app.
  Por eso la migración excluye las rondas con envíos finales o datos importados.

### Plan en prod (simulación del código real sobre una copia de solo lectura de prod)
Prod no tiene puntajes, evaluaciones ni resultados de pt_app importados.

| Ronda | Participante | Cambio | Estado |
|---|---|---|---|
| EA-CIL-2026 | referencia (pendiente) | null → 1 | se aplica |
| EA-CIL-2026 | participante 01 (pendiente) | null → 2 | se aplica |
| EA-CIL-2026 | participante 02 (pendiente) | null → 3 | se aplica |
| EA-PP-R3 | referencia (pendiente) | null → 1 | se aplica |
| EA-PP-R3 | depulgar@unal.edu.co | 1 → 2 | se aplica (sin envíos) |
| EA-PP-R3 | participante 02 (pendiente) | null → 3 | se aplica |
| EA-PP-R3 | participante 03 (pendiente) | null → 4 | se aplica |
| EA-PP2026-R2 | mauricio.ramirez@siata.gov.co | 1 → 2 | se aplica (sin envíos) |
| EA-PP2026-R1 | mauricio.ramirez@siata.gov.co | 1 → 2 | se aplica (4 borradores, nunca exportados) |
| EA-PP2026-R3 | participante 01 (pendiente) | 1 → 2 | **excluida**: 15 envíos finales |

- En las rondas de 2026 la referencia ya tiene 1 y la conserva; solo cambia el participante.
- **Corrección aparte para EA-PP2026-R3.** Los 15 envíos finales son de la referencia, que conserva el 1.
  El participante que cambiaría (cupo pendiente con 15 borradores) nunca entró en un CSV exportado.
  El riesgo es bajo, pero si ya se pasó un CSV de esta ronda a pt_app conviene confirmarlo antes.
  Corrección: `incluirRondasConResultados: ["kd763crwy2e9948jdvknmmhnzn88hsxv"]`.

### Comandos (pendientes de confirmación del usuario)
```bash
# 1. Desplegar en Convex prod el código de la migración (rama ops/convex-prod-deploy, tras integrarla en main)
pnpm exec convex deploy -y --typecheck enable --message "backfillReplicateCodes: referencia = 1"
# 2. En seco: revisar planned y excluidas
pnpm exec convex run --prod migrations:backfillReplicateCodes '{}'
# 3. Aplicar en las rondas sin resultados (9 cambios esperados)
pnpm exec convex run --prod migrations:backfillReplicateCodes '{"dryRun": false}'
# 4. Corrección aparte de EA-PP2026-R3 (1 cambio), solo si se confirma
pnpm exec convex run --prod migrations:backfillReplicateCodes '{"incluirRondasConResultados": ["kd763crwy2e9948jdvknmmhnzn88hsxv"]}'
pnpm exec convex run --prod migrations:backfillReplicateCodes '{"dryRun": false, "incluirRondasConResultados": ["kd763crwy2e9948jdvknmmhnzn88hsxv"]}'
```
El cambio solo toca una función interna de Convex, así que el deploy del paso 1 no necesita push del frontend.
Conviene integrar antes la rama en `main` para que prod no quede por delante del repositorio.

### Pendiente fuera de este alcance
- Las altas nuevas (`generateNextReplicateCode`) no fuerzan la regla. Si un participante ocupa el 1 a mano,
  una referencia nueva recibe el siguiente libre. Tras la migración no ocurre salvo edición manual;
  se puede endurecer aparte.

### Ejecutado: EA-PP2026-R3 (2026-11-25, confirmado por el usuario: "si son pruebas. muevelos entonces")
- El usuario confirmó que los 15 borradores del cupo pendiente son pruebas.
- Cambio puntual con la mutación que usa Configuración PT, sin desplegar la migración nueva:
  `convex run --prod --identity '{"subject":"ops-cli","role":"admin"}' pt/index:updateParticipantePT
  '{"participanteId":"k17cnnte18fx390kfqrc2qhdsx88hskw","participantCode":"ZFT5R6","replicateCode":2}'`
- Verificado en prod: referencia `4UDY72` = 1, cupo `ZFT5R6` (participante 01, pendiente) = 2.
- Los borradores de prueba no se borraron.
- EA-PP2026-R3 ya cumple la regla: la migración no propondrá cambios para ella ni hará falta `incluirRondasConResultados`.

### Integración en `main` (2026-11-25)
- `ops/convex-prod-deploy` integrada con `--no-ff` en `main` como `0d8496e`, sobre `cd21d2b`. Sin conflictos. El cambio sin commit del checkout principal no se tocó.
- Validación del `main` integrado: `sgc:validate-documents` OK, `pnpm test` (144) OK, `pnpm lint` OK, `pnpm exec tsc --noEmit` OK.
- Sin push. `main` va por delante de `origin/main`. En `convex/` solo difieren los 3 archivos de la migración. El resto son documentos SGC y frontend (registro de ronda en borrador, panel del participante).
- Simulación con datos frescos de prod y el código integrado: 9 cambios, 0 rondas excluidas (EA-PP2026-R3 ya está conforme).
