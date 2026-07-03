# Targets: Criterios medibles para dejar la app funcional

**Base**: [`diagnostico.md`](diagnostico.md) y [`plan_fix.md`](plan_fix.md).
**Uso**: marcar cada target solo cuando su verificacion haya sido ejecutada o el bloqueo este documentado.

---

## Target 0: Baseline reproducible

### Goal
Saber exactamente que esta roto antes de implementar fixes.

### Entry criteria
- Repo en una rama de trabajo.
- Cambios ajenos identificados con `git status --short`.

### Success criteria
- [x] `pnpm lint` ejecutado y resultado registrado.
- [x] `pnpm test` ejecutado y resultado registrado.
- [x] `pnpm build` ejecutado y resultado registrado.
- [x] `pnpm test:e2e:start` ejecutado y resultado registrado.
- [x] Specs y rutas fallidas listadas.
- [x] Estado de Convex registrado: online, offline, vacio o con seeds.
- [x] Estado de auth E2E registrado: `.auth/workos.json`, credenciales o bloqueo.

### Verification
```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e:start
```

### Resultado Fase 0 (2026-06-30 21:15 -05)

- Rama: `feature/t3-estructura-segura`.
- Cambios locales ajenos identificados: screenshots modificados en `docs/screenshots/fase-3/*` y documentos/logs nuevos.
- `pnpm lint`: paso.
- `pnpm test`: paso.
- `pnpm build`: paso.
- `pnpm test:e2e:start`: fallo con 8 specs SGC autenticadas/screenshots y 4 tests verdes.
- `pnpm test:e2e:start --project=chromium`: paso.
- Estado Convex observado: offline durante E2E, con fallbacks registrados para SGC/rondas.
- Estado auth E2E: `.auth/workos.json` existe; `AUTH_TEST_*` ausentes; el gate degradado queda como smoke publico verde + bloqueo documentado si la suite autenticada no puede renovarse.
- Specs fallidas: `sgc-cobertura-screenshots.auth.spec.ts`, `sgc-cobertura.auth.spec.ts` (4 casos), `sgc-fase2-screenshots.auth.spec.ts`, `sgc-fase2.auth.spec.ts` (2 casos).

---

## Target 1: E2E smoke no depende de datos exactos

### Goal
Que la suite funcional principal pase con Convex vacio/offline para los casos que deben degradar.

### Files
- `tests/e2e/sgc-cobertura.auth.spec.ts`
- `tests/e2e/sgc-fase2.auth.spec.ts`
- `tests/e2e/sgc-fase2-screenshots.auth.spec.ts`
- `tests/e2e/sgc-cobertura-screenshots.auth.spec.ts`
- `tests/e2e/sgc-fase3-screenshots.auth.spec.ts`
- `playwright.config.ts`
- `package.json` si se agrega script de screenshots

### Success criteria
- [x] No quedan IDs de ronda hardcodeados en specs funcionales.
- [x] Las pruebas buscan una ronda real desde la UI antes de abrir `/dashboard/rondas/<id>/sgc`.
- [x] Si no hay rondas, se omite solo el detalle data-backed, no toda la suite.
- [x] No hay `toHaveCount(12)` en smoke funcional sin seed controlado.
- [x] Selectores exactos fragiles reemplazados por regex, `href` o test ids estables.
- [x] Redirects legacy esperan `/dashboard?tab=rondas` o el destino real vigente.
- [x] Specs de screenshots no corren en la suite funcional por defecto.

### Verification
```bash
rg "kd77ck9jqbeafg5g61c7cw0vrh8756qr|kd7b0emdk7cmzp1vn34f2bfv7986bb77|toHaveCount\\(12\\)" tests/e2e
pnpm test:e2e:start --project=chromium
pnpm test:e2e:start
```

Expected:
- El `rg` no encuentra IDs hardcodeados ni conteos exactos en smoke.
- `pnpm test:e2e:start` pasa cuando hay auth valida; si no hay auth, el bloqueo queda documentado.

### Resultado Fase 1 (2026-06-30 21:36 -05)

- `rg "kd77ck9jqbeafg5g61c7cw0vrh8756qr|kd7b0emdk7cmzp1vn34f2bfv7986bb77|toHaveCount\\(12\\)" tests/e2e`: sin resultados.
- `pnpm test:e2e:start --project=chromium`: paso, 1 passed.
- `pnpm test:e2e:start`: paso, 6 passed / 3 skipped.
- Skips intencionales por Convex offline/sin datos: detalle documental, panel SGC de ronda, formato seleccionado.
- Screenshots quedan fuera de la suite funcional; comando dedicado: `pnpm test:e2e:screenshots`.
- Cierre adicional 2026-06-30 22:11 -05: F9 resuelto en `tests/e2e/sgc-cobertura.auth.spec.ts`; `rg "table\\.count|sin requisitos|no hay requisitos|0 requisitos" tests/e2e/sgc-cobertura.auth.spec.ts` sin resultados; spec enfocada paso con 4 passed / 1 skipped; `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes.

---

## Target 2: Rutas SGC resilientes

### Goal
Que SGC renderice de forma controlada con datos vacios u offline.

### Files
- `src/app/(protected)/dashboard/sgc/page.tsx`
- `src/app/(protected)/sgc/page.tsx`
- `src/app/(protected)/dashboard/sgc/documentos/page.tsx`
- `src/app/(protected)/dashboard/sgc/mapa/page.tsx`
- `src/app/(protected)/dashboard/sgc/normativa/page.tsx`
- `src/components/ui/BackendOfflineBanner.tsx`
- `src/lib/convex-fallback.ts`

### Success criteria
- [x] `/dashboard/sgc` usa el mismo patron offline que `/sgc` (unificados en `SgcResumenView`).
- [x] Hay banner visible cuando Convex offline afecta contadores o listas.
- [x] Centro documental muestra mensaje vacio si no hay documentos.
- [x] Matriz normativa muestra mensaje vacio si no hay requisitos (mensaje real implementado en Fase 2; cierra F3/F9).
- [x] Mapa SGC muestra mensaje vacio si no hay relaciones.
- [x] Ninguna de esas rutas cae en error boundary global por `fetch failed`, `ECONNREFUSED`, `ENOTFOUND` o `EAI_AGAIN`.

**Estado (2026-07-01)**: Target 2 cerrado. Verificado con `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9`; banner + estado vacio en resumen SGC, documentos, normativa y mapa. Detalle en [`review_fix.md`](review_fix.md) (F1-F3 resueltos).

### Verification
```bash
pnpm test
pnpm build
pnpm test:e2e:start tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium
```

Manual smoke con Convex offline:
- `/dashboard/sgc`
- `/dashboard/sgc/documentos`
- `/dashboard/sgc/normativa`
- `/dashboard/sgc/mapa`

---

## Target 3: Rutas de ronda y participante resilientes

### Goal
Que rondas y participante distingan recurso inexistente, datos vacios y backend offline.

### Files
- `src/app/(protected)/dashboard/rondas/[id]/page.tsx`
- `src/app/(protected)/dashboard/rondas/[id]/sgc/page.tsx`
- `src/app/(protected)/ronda/[codigo]/page.tsx`
- `src/app/(protected)/ronda/[codigo]/registro/page.tsx`
- `src/app/(protected)/mi-dashboard/page.tsx`
- `src/server/rondas/*`
- `src/server/sgc/*`

### Success criteria
- [x] ID de ronda inexistente produce `notFound()` o UI 404 local, no crash.
- [x] Codigo de participante inexistente produce respuesta controlada.
- [x] Convex offline produce fallback visible donde haya lecturas. F13-F15 cerrados: `/dashboard` admin, `/mi-dashboard` y metricas de `/dashboard/rondas/[id]` derivan banner de loaders `WithStatus`.
- [x] Mutaciones no simulan exito cuando Convex esta offline.
- [x] Playwright no falla por ausencia de rondas cuando el objetivo del test es smoke.

**Estado (2026-07-01 00:14)**: Target 3 cerrado para el alcance de Fase 2. F14 y F15 quedan resueltos: `/mi-dashboard` muestra estado offline-first en lugar de "sin rondas" cuando Convex no responde, y `/dashboard/rondas/[id]` muestra banner si las metricas degradan por offline parcial. F13 tambien queda resuelto para `/dashboard` admin.

### Verification
```bash
pnpm test
pnpm build
pnpm test:e2e:start tests/e2e/sgc-fase2.auth.spec.ts --project=authenticated-chromium
```

Resultado de cierre Fase 2:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e:start
```

Todos verdes; E2E principal: 6 passed / 3 skipped intencionales.

---

## Target 4: Convex con autorizacion backend

### Goal
Cerrar el hueco donde dominios operativos confian solo en el proxy de Next.

### Files
- `convex/rondas/index.ts`
- `convex/rondas/*.ts`
- `convex/fichas/index.ts`
- `convex/pt/index.ts`
- `convex/auth.config.ts`

### Success criteria
- [x] Funciones publicas de `rondas` validan `ctx.auth.getUserIdentity()` cuando leen o mutan datos protegidos.
- [x] Funciones publicas de `fichas` validan identidad.
- [x] Funciones publicas de `pt` validan identidad.
- [x] Las verificaciones de ownership/usuario derivan del token, no de un `userId` recibido como argumento.
- [x] Los errores de no autenticado/no autorizado son consistentes y testeables.
- [x] Existe al menos una prueba (`convex-test`) que afirme que una llamada sin identidad a una funcion protegida de `rondas`/`fichas`/`pt` falla de forma controlada. Este es el DoD concreto de "testeable".
- [x] Los caminos de seed/util que invoquen estas funciones pasan identidad via `convex run --identity`, no via argumento `userId`.

### Verification
```bash
pnpm exec convex codegen
pnpm build
pnpm test
rg "getUserIdentity" convex/rondas convex/fichas convex/pt
```

**Estado (2026-07-01)**: Target 4 cerrado por los fixes F19-F23. `src/server/rondas/client.ts` y `src/server/rondas/fichas.ts` reenvian `{ token }` derivado de `requireAuth().accessToken`; las lecturas sensibles de F20 usan `requireAdminIdentity`, `requireParticipantOrAdminForRonda` u ownership por ficha; los roles admin se unificaron entre SGC y `convex/access.ts`; los parametros `userId` muertos fueron eliminados o hechos vivos con guard admin; `convex/access.test.ts` cubre rechazo sin identidad, exito autenticado propio, rechazo cross-tenant y admin. Pendiente de Target 9: validacion manual contra un Convex online real. Detalle en [`review_fix.md`](review_fix.md).

---

## Target 5: Migraciones Convex no expuestas

### Goal
Evitar que utilidades destructivas sean invocables desde clientes.

### Files
- `convex/migrations.ts`
- consumidores que llamen migraciones, si existen

### Success criteria
- [x] `wipeAll` no esta exportada como `mutation` publica (ahora `internalMutation`).
- [x] Cargas utilitarias o backfills usan `internalMutation`/`internalAction` cuando no son parte de la API cliente.
- [x] Cualquier invocacion interna usa `internal.*`, no `api.*`.
- [x] Todas las funciones tienen `args` validado.
- [x] Confirmado que ningun consumidor cliente usa `api.migrations.*` (grep en `src/`); el seeding via `scripts/import-sgc-seeds.mjs` usa `convex run` y no depende de que sean publicas.

**Estado (2026-07-01)**: Target 5 cerrado. `convex/migrations.ts` es `internalQuery`/`internalMutation`; `rg "api\\.migrations" src` sin resultados. La deuda operativa menor quedo cerrada en Fase 5: `pnpm sgc:import-seeds` paso con Convex local activo y confirmo el flujo con funciones internas.

### Verification
```bash
rg "export const .*=( |\\n)*mutation|mutation\\(" convex/migrations.ts
rg "internalMutation|internalAction" convex/migrations.ts
rg "api\\.migrations" src convex/_generated 2>/dev/null
pnpm exec convex codegen
pnpm build
```

Expected:
- El primer `rg` no debe mostrar mutaciones destructivas publicas.
- El grep de `api.migrations` en `src/` no debe arrojar consumidores cliente.
- `codegen` y `build` pasan.

Nota de seguridad de cambio: `convex run` puede invocar funciones internas, por lo que mover migraciones a `internalMutation` no rompe `pnpm sgc:import-seeds`. No se requiere un entrypoint publico "guardado".

---

## Target 6: Consultas Convex acotadas o indexadas

### Goal
Reducir riesgo de rendimiento por escaneos completos y filtros en memoria.

### Files
- `convex/rondas/*.ts`
- `convex/fichas/index.ts`
- `convex/pt/index.ts`
- `convex/sgc/*.ts`
- `convex/schema.ts`

### Success criteria
- [x] No se introducen nuevos `.collect()` sin limite.
- [x] Listados grandes usan `.take(n)` o paginacion. (Auditoria: no existen listados grandes sin acotar; los `.collect()` de tabla completa restantes son catalogos chicos.)
- [x] Filtros frecuentes usan `withIndex`. (278 usos de `withIndex` vs 212 `.collect()`; los caminos por proceso/estado/codigo/ronda ya van por indice.)
- [x] Indices nuevos en `schema.ts` siguen el nombre `by_<campo>_and_<campo>`. (No se requirieron indices nuevos; N/A.)
- [x] No hay `.collect().length` nuevo para conteos.

### Verification
```bash
rg "\\.collect\\(|\\.collect\\(\\)\\.length|\\.filter\\(" convex
pnpm exec convex codegen
pnpm build
```

Nota: este target puede cerrarse por inventario y deuda documentada si el cambio de paginacion completa es demasiado amplio para el fix funcional inmediato.

**Estado (2026-07-01, auditado)**: Target 6 **cerrado por auditoria de evidencia** (F34). Se auditaron los `.collect()` de `convex/` (excluyendo `_generated`):

- **212 `.collect()` totales**; **278 usos de `withIndex`**. La mayoria de los `.collect()` van precedidos de `withIndex('by_ronda'|'by_participante'|'by_documentoId'|...)`, es decir estan **acotados por indice**, no son scans completos.
- **Scans de tabla completa sin indice (~21)**: todos sobre **catalogos chicos** — `rondas` (decenas), `documentosSgc` (~51 en seed), `mapaSgcRelaciones` (~82 en seed). Semanticamente son "listar todo el catalogo", donde `.take(n)` **descartaria datos** (seria incorrecto) y la paginacion **cambiaria la firma** y romperia consumidores/UI.
- **Filtros en memoria sin indice (5 sitios)**: `sgc/panel.ts` (rondas), `sgc/maestro.ts` (mapaSgcRelaciones+documentosSgc), `sgc/documentos.ts` (documentosSgc), `fichas/index.ts` (fichasRegistro). Todos sobre esos catalogos chicos y/o con **filtros multi-dimensionales** (acceso + ambito + familia + estado) donde un unico indice no resuelve la combinacion; los caminos de dimension unica (`by_proceso`/`by_estado`/`by_codigo`) **ya usan `withIndex`**.

Conclusion: **no hay scans sin acotar en rutas calientes**; los `.collect()` restantes son apropiados para su tamano de tabla. El arreglo funcional (Fases 1-5) no introdujo `.collect()` ni `.collect().length` nuevos. Reescribirlos a `withIndex`/`.take(n)`/paginacion a esta escala **no aporta beneficio** y arriesga cambio de semantica sin backend en vivo para verificar; queda como optimizacion futura solo si alguno de esos catalogos crece de forma material. Detalle en [`review_fix.md`](review_fix.md) (F34).

---

## Target 7: Dependencias runtime corregidas

### Goal
Evitar deploys donde modulos usados en produccion viven en `devDependencies`.

### Files
- `package.json`
- `pnpm-lock.yaml`

### Success criteria
- [x] `zod` esta en `dependencies`.
- [x] `@t3-oss/env-nextjs` esta en `dependencies`.
- [x] No existe `package-lock.json`.
- [x] `pnpm-lock.yaml` queda actualizado.

**Estado (2026-07-01)**: Target 7 cerrado en Fase 4. `zod` y `@t3-oss/env-nextjs` fueron movidos a `dependencies` con `pnpm add --save-prod`; `pnpm-lock.yaml` quedo consistente y `package-lock.json` sigue ausente.

### Verification
```bash
pnpm add zod @t3-oss/env-nextjs
test ! -f package-lock.json
pnpm install --frozen-lockfile
pnpm build
```

---

## Target 8: Logs y artefactos no bloquean el repo

### Goal
Evitar crecimiento accidental del repositorio por bitacoras y screenshots generados.

### Files
- `.gitignore`
- `logs/`
- `docs/screenshots/`

### Success criteria
- [x] Se decide explicitamente que partes de `logs/` se versionan.
- [x] `logs/history/` se ignora si no es artefacto de equipo.
- [x] Screenshots generados por Playwright no cambian durante E2E funcional.
- [x] La suite de screenshots corre por comando separado.
- [x] Los archivos ya trackeados que se decidan ignorar se desindexan con `git rm --cached` (agregar a `.gitignore` no basta para archivos ya versionados; los screenshots de `docs/screenshots/fase-3/*` ya aparecen trackeados y modificados).
- [x] Existe CI minimo para las puertas reproducibles sin auth/seeds (`install`, `lint`, `test`, `build`).

**Estado (2026-07-01)**: Target 8 cerrado para Fase 4. Se versionan los rundowns/cierres de fase y `logs/CURRENT_SESSION.md`; se ignoran `logs/history/` y `logs/plans/`, y ambas carpetas quedaron desindexadas (`git ls-files logs/history logs/plans` -> `0`). Los screenshots se mantienen versionados por decision acotada; `pnpm test:e2e:start` no agrego cambios nuevos sobre los tres screenshots que ya estaban modificados antes de esta fase. CI minimo agregado en `.github/workflows/ci.yml` para `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` y `pnpm build`; E2E autenticado queda fuera hasta tener auth/seeds reproducibles.

### Verification
```bash
git ls-files docs/screenshots logs | head
git status --short
pnpm test:e2e:start
git status --short
```

Expected:
- La segunda salida no muestra screenshots modificados por la suite funcional principal.
- Los artefactos que se decidio ignorar dejan de aparecer en `git status` tras `git rm --cached` + `.gitignore`.

---

## Target 9: Cierre funcional

### Goal
Declarar la app funcional con evidencia.

### Success criteria
- [x] `pnpm lint` verde.
- [x] `pnpm test` verde.
- [x] `pnpm build` verde.
- [x] `pnpm exec convex codegen` verde si hubo cambios en Convex.
- [x] `pnpm test:e2e:start` verde para la suite funcional aplicable.
- [x] E2E data-backed documentado como verde con seeds o omitido con razon concreta.
- [x] `diagnostico.md` actualizado o complementado con resultado final.

### Verification
```bash
pnpm lint
pnpm test
pnpm build
pnpm exec convex codegen
pnpm test:e2e:start
```

**Estado (2026-07-01)**: Target 9 **cerrado**. `pnpm lint`, `pnpm test` (4 archivos / 9 tests), `pnpm build`, `pnpm exec convex codegen` y `pnpm test:e2e:start` (6 passed / 3 skipped intencionales con Convex apagado) verdes; con backend local + seeds `pnpm sgc:import-seeds` (51 docs / 1.047 requisitos / 82 relaciones) y `pnpm test:e2e:start --project=authenticated-chromium` (8 passed). La suite data-backed queda documentada como verde con seeds. `diagnostico.md` complementado con el bloque "Cierre de verificacion (2026-07-01)": estado RESUELTO, comandos y resultados, resolucion por hallazgo, suites omitidas con razon y riesgos residuales. Detalle en [`fase5.md`](fase5.md) y [`review_fix.md`](review_fix.md).

---

## Target 10: Reproducibilidad de offline y auth (habilitador de Targets 1-3 y 9)

### Goal
Que "offline controlado" y "gate E2E" sean condiciones deterministas y medibles, no accidentales.

### Files
- `playwright.config.ts`
- `package.json`
- `src/lib/convex-fallback.ts`

### Success criteria
- [x] Existe una forma deterministica de forzar Convex offline (por ejemplo `NEXT_PUBLIC_CONVEX_URL` apuntando a host inalcanzable) usada por un proyecto/comando dedicado, sin depender de que el backend "este caido por casualidad".
- [x] `isConvexOffline` cubre el caso forzado (`ECONNREFUSED`/`fetch failed`) y las rutas SGC/rondas/participante rinden banner + estado vacio bajo ese modo.
- [x] El DoD de auth E2E esta escrito: con auth -> gate autenticado; sin auth -> smoke publico verde + bloqueo documentado (no cuenta como fallo de producto).
- [x] Los screenshots corren por comando separado (`test:e2e:screenshots` o grep de tag) y no bloquean la suite funcional.

### Verification
```bash
# Offline deterministico (ejemplo)
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9 pnpm test:e2e:start --project=chromium
# Gate degradado sin auth
pnpm test:e2e:start --project=chromium
```

Expected:
- Bajo URL inalcanzable, las rutas objetivo muestran fallback y ninguna cae al error boundary global.
- El smoke publico pasa aun sin credenciales WorkOS.

**Estado (2026-07-01)**: Target 10 cerrado. Fase 2 verifico offline deterministico con `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9` (banner + estado vacio en SGC/rondas/participante, sin error boundary); `collectErrorDetails`/`isConvexOffline` recorren la cadena `cause` y cubren `ECONNREFUSED`/`fetch failed`/`ETIMEDOUT`/`ECONNRESET`/`ENETUNREACH`/`UND_ERR_*` (F4 resuelto). El DoD de auth E2E esta escrito (Fase 0.5.2). Screenshots por comando separado `pnpm test:e2e:screenshots`, excluidos de la suite funcional via `testIgnore`. Detalle en [`review_fix.md`](review_fix.md).

---

## Code review Fase 0.5 (hallazgos y fixes propuestos)

Registro completo en [`review_fix.md`](review_fix.md) y [`fase0.5.md`](fase0.5.md). Impacto por target:

| ID | Sev | Hallazgo | Target afectado | Fix propuesto |
|---|---|---|---|---|
| F1 | Alta | `safeConvexCall` (server) traga el error offline; los `try/catch` de pagina nunca setean `backendOffline`, asi que `BackendOfflineBanner` no se renderiza en offline | Target 2, Target 3, Target 10 | `safeConvexCallWithStatus` -> `{ data, offline }`, o `fetchQuery` crudo en el `try/catch` de pagina para lecturas que alimentan banner |
| F2 | Media | `/dashboard/sgc/page.tsx` sin manejo offline y divergente de `/sgc` | Target 2 | Compartir vista con `/sgc` + mecanismo de F1 |
| F3 | Media | `dashboard/sgc/{documentos,normativa,mapa}` sin manejo offline | Target 2 | Reutilizar mecanismo de F1 |
| F4 | Baja | `isConvexOffline` inspecciona `cause` un solo nivel; faltan `ETIMEDOUT`/`ECONNRESET`/`ENETUNREACH`/`UND_ERR_*` | Target 10 | Agregar codigos + recorrer cadena `cause` (los deterministas documentados ya quedan cubiertos) |
| F5 | Confirm | 14 mutaciones publicas en `convex/migrations.ts`, `wipeAll` incluida | Target 5 | Ya cubierto por Target 5 / Fase 3.2 |

Nota: **F1 reabre parcialmente Target 2 y Target 3**: hoy el modo offline rinde estado vacio sin crash (correcto), pero el criterio "banner visible cuando Convex offline" no se cumple hasta aplicar el fix.

## Code review Fase 1 (hallazgos y fixes propuestos)

Registro completo en [`review_fix.md`](review_fix.md) y [`fase1.md`](fase1.md). Impacto por target:

| ID | Sev | Hallazgo | Target afectado | Fix propuesto |
|---|---|---|---|---|
| F9 | Media | Resuelto: se elimino la rama de empty-state falsa de normativa; el test ahora valida encabezados reales y contador de requisitos filtrados | Target 1, Target 2 | Implementar el empty-state real en Fase 2/F3 y ampliar el test al texto visible real cuando exista |
| F10 | Baja | `#formato-F-PSEA-10` mantiene acoplamiento a un formato seed; falla en vez de omitir si la ronda no lo tiene | Target 1 | Descubrir un `formato` real o `test.skip` si el selector no aparece |
| F11 | Baja | `discoverRoundSgcUrl` lanza si cambia el heading e infiere la URL agregando `/sgc` al primer enlace de ronda | Target 1, Target 10 | Preferir `a[href$="/sgc"]` o filtrar por regex de ID Convex |
| F12 | Baja | `@screenshots` vive en el titulo del test, no en la API de tags; el guard real es `testIgnore` | Target 1, Target 8 | Migrar a la API de tags si se quiere filtrado estructurado (opcional) |

Nota: **F9 queda cerrado para Target 1**. El criterio de Target 2 "Matriz normativa muestra mensaje vacio si no hay requisitos" sigue pendiente porque el mensaje real aun no esta implementado en la pagina; eso corresponde a Fase 2/F3.

## Code review Fase 2 (hallazgos y fixes propuestos)

Registro completo en [`review_fix.md`](review_fix.md) y [`fase2.md`](fase2.md). Impacto por target:

| ID | Sev | Hallazgo | Target afectado | Fix propuesto |
|---|---|---|---|---|
| F13 | Alta | `/dashboard` admin: `loadAdminDashboardData` usa lecturas `safeConvexCall` dentro de try/catch; `backendOffline` nunca es true en offline; banner muerto | Target 2, Target 10 | Migrar a `listRondasWithStatus`/`listAllParticipantesWithStatus` (o `fetchQuery` crudo) y derivar `backendOffline` de `.offline` |
| F14 | Media | `/mi-dashboard`: try/catch SGC muerto (lecturas tragan offline) + `EmptyParticipantState` "sin rondas" en offline junto al banner | Target 3 | Lecturas SGC `WithStatus`; render offline-first en vez del empty-state |
| F15 | Media | `/dashboard/rondas/[id]`: `getRondaMetricasCompletas` con `safeConvexCall`; offline parcial -> ceros sin banner | Target 3 | Loaders de metricas `WithStatus` + banner en el render con ronda |
| F16 | Baja | `.../[id]/sgc`: forms de mutacion editables en offline | Target 3 | Deshabilitar forms cuando `backendOffline && !panel` |
| F17 | Baja | `BackendOfflineBanner` hardcodea `127.0.0.1:3212 (ECONNREFUSED)` | Target 2, Target 10 | Derivar host de `NEXT_PUBLIC_CONVEX_URL` o suavizar el texto |
| F18 | Baja | `/sgc/mapa` reexporta la pagina dashboard sin parametrizar por `basePath` | Target 2 | Parametrizar el mapa o aceptar deuda cosmetica |

Nota: **F13-F15 son el antipatron de doble captura de F1** (F1/F2/F3 resueltos para SGC y rutas migradas a `WithStatus`, pero pendiente en `/dashboard`, `/mi-dashboard` y las metricas de ronda). Target 2 cierra; **Target 3 permanece abierto hasta corregir F14-F15**.

## Code review Fase 3 (hallazgos y fixes propuestos)

Registro completo en [`review_fix.md`](review_fix.md) y [`fase3.md`](fase3.md). Impacto por target:

| ID | Sev | Hallazgo | Target afectado | Fix propuesto |
|---|---|---|---|---|
| F5 | Confirm | Resuelto: `convex/migrations.ts` a `internalQuery`/`internalMutation`, `wipeAll` incluida; sin consumidores `api.migrations.*` en `src/` | Target 5 | Ya aplicado |
| F19 | Alta/bloqueante | Resuelto: `src/server/rondas/client.ts` y `src/server/rondas/fichas.ts` reenvian `{ token }` derivado de `requireAuth().accessToken`; los guards ya no rechazan al usuario autenticado por falta de token | Target 4, Target 9 | Ya aplicado; queda validacion manual contra Convex online real en Target 9 |
| F20 | Media | Resuelto: lecturas sensibles pasaron a `requireAdminIdentity`, `requireParticipantOrAdminForRonda` u ownership por ficha segun la superficie | Target 4 | Ya aplicado |
| F21 | Baja | Resuelto: roles admin unificados entre `convex/access.ts` y `convex/sgc/shared.ts` | Target 4 | Ya aplicado |
| F22 | Baja | Resuelto: parametros `userId` muertos eliminados o hechos vivos con guard admin en `listRondasParticipante` | Target 4 | Ya aplicado |
| F23 | Baja/confirm | Resuelto: `convex/access.test.ts` cubre rechazo sin identidad, exito autenticado, rechazo cross-tenant y admin | Target 4 | Ya aplicado |

Nota: **Target 4 queda cerrado** por F19-F23. F5 cierra Target 5. La validacion manual con Convex online real permanece como pendiente de Target 9/cierre final, no como bloqueo de Fase 3.

## Code review Fase 4 (hallazgos y fixes propuestos)

Registro completo en [`review_fix.md`](review_fix.md) y [`fase4.md`](fase4.md). Revision post-implementacion: **sin defectos de codigo**; el move de dependencias y el saneamiento de logs quedan confirmados por verificacion (imports de `src/` -> `dependencies`, `convex/` sin `zod`, `pnpm install --frozen-lockfile` OK, `logs/history`+`logs/plans` desindexados sin perdida local). Impacto por target:

| ID | Sev | Hallazgo | Target afectado | Fix propuesto |
|---|---|---|---|---|
| F27 | Baja | Rundowns/cierres de fase que la decision F25 marca "versionables" siguen untracked; ninguna Fase 1-4 commiteada | Target 8 | Incluirlos al commitear (`git add logs/*.md *fix.md fase*.md`) o commitear por fase segun workflow |
| F28 | Baja | Resuelto documentalmente: diff de `package.json` arrastra `@edge-runtime/vm` + `convex-test` (tooling de test de Fase 3); bien ubicados como devDeps | Target 7 | Ya documentado en `fase4.md` |
| F29 | Baja | Resuelto: CI minimo agregado sin E2E autenticado | Target 8 | `.github/workflows/ci.yml` con install congelado, lint, tests y build |
| F30 | Baja | `docs/screenshots/fase-3/*` modificados sin resolver (E2E no los cambia, pero siguen sucios) | Target 8 | Revert o commit en Fase 5 |

Nota: **Target 7 confirmado cerrado** (dependencias runtime correctas y verificadas). **Target 8 cerrado** para el alcance de Fase 4; F27 y F30 son deuda Baja de cierre. Ningun hallazgo bloquea.

## Code review Fase 5 (hallazgos y fixes propuestos)

Registro completo en [`review_fix.md`](review_fix.md) y [`fase5.md`](fase5.md). Los dos cambios de Fase 5 (`import-sgc-seeds.mjs`, `sgc-fase2.auth.spec.ts`) son correctos y estan verificados; los hallazgos son un fix incompleto y brechas de cierre. Impacto por target:

| ID | Sev | Hallazgo | Target afectado | Fix propuesto |
|---|---|---|---|---|
| F31 | Media | Resuelto: el fix de segmento `sgc:` -> `sgc/index:` se aplico solo a `import-sgc-seeds.mjs`; `upload-sgc-document-versions.mjs` (wired a `pnpm sgc:upload-document-versions`) seguia roto en `generateUploadUrl`/`listSgcMaestro`/`registrarVersionOficial` | Target 5, Target 9 | Ya aplicado; deuda cerrada: `poblar-plan-r1.mjs` invocaba `sgc:seedPlanRonda` inexistente y se elimino como codigo muerto |
| F32 | Baja | Resuelto: `sgc-fase2.auth.spec.ts` aseveraba `Registrar evidencia` (falla si F-PSEA-10 ya tiene evidencia vigente) | Target 1, Target 9 | Ya aplicado con regex `Registrar\|Reemplazar evidencia` |
| F33 | Media | Resuelto: Target 9 y Target 10 tenian criterios sin marcar pese al cierre declarado; `diagnostico.md` tambien quedo complementado con el cierre de verificacion | Target 9, Target 10 | Ya aplicado; checkboxes marcados con evidencia y diagnostico actualizado |
| F34 | Baja | Target 6 (consultas acotadas/indexadas) se cierra sin abordar; 215 `.collect()` heredados en `convex/` | Target 6 | Cerrado por deuda documentada; auditoria de rendimiento futura |
| F35 | Baja | F30 (screenshots `fase-3/*` dirty) y F27 (fases sin commitear / rundowns untracked) sin resolver | Target 8 | Decidir revert/commit de screenshots e incluir docs versionables al commitear |

Nota: **Target 9 y Target 10 quedan cerrados** (F33). **Target 6 cerrado por deuda documentada** (F34). F31/F32 corregidos en codigo. F35 queda como procedimiento del commit de cierre. Ningun hallazgo bloquea el cierre funcional.

## Estado de Fase 0.5 (2026-06-30 21:27 -05)

- [x] Decisiones de auth E2E escritas.
- [x] Offline deterministico definido para verificacion futura.
- [x] Confirmado que `src/` no consume `api.migrations.*`.
- [x] Baseline y preflight registrados.
- [x] Code review de Fase 0.5 registrado en `review_fix.md`.
- [x] Fase 0.5 cerrada sin cambios de producto, segun alcance del plan.

Estado final: **Fase 5 / Target 9 cerrado**. No queda target activo dentro de `plan_fix.md`; permanecen solo deudas documentadas no bloqueantes (rendimiento Target 6 y procedimiento de commit F35).
