# Review / Fix log — Recuperacion funcional de calaire-app

**Base**: [`plan_fix.md`](plan_fix.md), [`target_fix.md`](target_fix.md), [`workflow_fix.md`](workflow_fix.md).
**Proposito**: dejar, por fase, la revision de codigo y el fix sugerido de lo encontrado. Una seccion por fase; las fases no revisadas quedan como placeholder.

Convencion de IDs: `F<n>` por hallazgo. Severidad: Alta / Media / Baja / Confirmatorio.
Estado por hallazgo: `abierto` | `en progreso` | `resuelto` | `deuda aceptada`.

---

## Fase 0.5 — Precondiciones (revisado 2026-06-30) — cerrada

Alcance de la revision: codigo detras de las afirmaciones de Fase 0.5 (offline deterministico, `isConvexOffline`, no-consumo de `api.migrations.*`). Se comprobo el **cableado** de `isConvexOffline` hacia el banner y estados vacios, no solo su comportamiento en aislamiento.

### F1 (Alta) — `BackendOfflineBanner` es codigo muerto en offline (doble captura) — resuelto en Fase 2
- **Archivos**: `src/server/sgc/index.ts`, `src/server/rondas/client.ts`, `src/app/(protected)/sgc/page.tsx` (20-28), `src/app/(protected)/dashboard/data.ts` (53-65), `src/lib/convex-fallback.ts`.
- **Evidencia**: los wrappers de servidor envuelven cada lectura en `safeConvexCall` (27 usos en `rondas/client.ts`), que traga el error offline y devuelve el fallback vacio en vez de propagarlo. Los `try/catch { if(!isConvexOffline) throw; backendOffline=true }` de pagina nunca reciben un error, asi que `backendOffline` queda `false`.
- **Impacto**: offline degrada a ceros silenciosos; no hay crash, pero el criterio "banner visible cuando Convex offline" (Target 2 y Target 3) no se cumple. Contradice lo que Fase 0.5.3 dio por verificado.
- **Fix sugerido**: exponer el estado offline sin perder el fallback vacio. Recomendado: `safeConvexCallWithStatus` que devuelva `{ data, offline }` y usarlo en las lecturas que alimentan banners (`listSgcMaestro`/`listNormativaSgc`/`listMapaSgc`, `listRondas`/`listAllParticipantes`); las paginas leen `offline` para decidir el banner. Alternativa: `fetchQuery` crudo dentro del `try/catch` de pagina (como pretende `dashboard/data.ts`), o senal offline por-request via `cache()`/AsyncLocalStorage.
- **Verificacion del fix**: bajo `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9`, `/sgc` y `/dashboard/sgc` muestran `BackendOfflineBanner` + ceros y no caen al error boundary.

### F2 (Media) — `/dashboard/sgc/page.tsx` sin offline y divergente de `/sgc` — resuelto en Fase 2
- **Archivos**: `src/app/(protected)/dashboard/sgc/page.tsx` vs `src/app/(protected)/sgc/page.tsx`.
- **Evidencia**: llama `listSgcMaestro/Normativa/Mapa` directo y lee `.resumen.total`; no crashea (el wrapper traga) pero nunca muestra banner y duplica la vista de `/sgc`.
- **Fix sugerido**: compartir componente/vista con `/sgc` (re-export o componente comun) y aplicar el mecanismo de F1 una sola vez.

### F3 (Media) — Subrutas SGC sin manejo offline — resuelto en Fase 2
- **Archivos**: `src/app/(protected)/dashboard/sgc/documentos/page.tsx`, `.../normativa/page.tsx`, `.../mapa/page.tsx`.
- **Evidencia**: rinden pero sin banner; mismo enmascaramiento por doble captura.
- **Fix sugerido**: reutilizar el mecanismo de F1.

### F4 (Baja) — `isConvexOffline` inspecciona `cause` un solo nivel — deuda aceptada
- **Archivo**: `src/lib/convex-fallback.ts`.
- **Evidencia**: lee `error.cause.code` y `error.code`; no recorre la cadena `cause` anidada de undici ni cubre `ETIMEDOUT`/`ECONNRESET`/`ENETUNREACH`/`UND_ERR_*`. El fallback `message.includes('fetch failed')` cubre la mayoria.
- **Nota**: los mecanismos deterministas documentados (`127.0.0.1:9`->ECONNREFUSED, host inexistente->ENOTFOUND) si quedan cubiertos; Target 10 se sostiene.
- **Fix sugerido (opcional)**: agregar los codigos faltantes y recorrer la cadena `cause`.

### F5 (Confirmatorio) — Mutaciones publicas en `convex/migrations.ts` — abierto (Fase 3)
- **Archivo**: `convex/migrations.ts`.
- **Evidencia**: 14 `mutation` publicas, 0 internas, `wipeAll` publica. Sin consumidores `api.migrations.*` en `src/`.
- **Fix sugerido**: pasar a `internalMutation` (seguro para el seed via `convex run`). Ya planificado en Fase 3.2 / Target 5.

**Resumen Fase 0.5**: 3 hallazgos accionables de UX offline (F1-F3, todos con raiz comun en F1), 1 deuda menor (F4), 1 confirmacion de trabajo ya planificado (F5). F1 debe cerrarse en Fase 2 antes de declarar "offline controlado con banner".

**Cierre**: Fase 0.5 queda cerrada como fase documental/preflight. Los hallazgos abiertos no son trabajo pendiente de 0.5; son entradas de backlog ya asignadas a Fase 2 (F1-F3), Target 10 deuda menor (F4) y Fase 3/Target 5 (F5).

---

## Fase 1 — E2E funcional y desacoplado de datos exactos — cerrada (2026-06-30)

Alcance de la revision: specs Playwright funcionales SGC, separacion de screenshots y comportamiento con Convex offline/sin datos.

### F6 (Media) — Specs funcionales dependian de datos exactos — resuelto
- **Archivos**: `tests/e2e/sgc-fase2.auth.spec.ts`, `tests/e2e/sgc-helpers.ts`.
- **Evidencia**: habia IDs de ronda fijos y `toHaveCount(12)`.
- **Fix aplicado**: helper de descubrimiento desde `/dashboard?tab=rondas`; si no hay ronda, se omite solo el caso data-backed.
- **Verificacion**: grep critico sin resultados; `pnpm test:e2e:start` verde con 3 skips intencionales.

### F7 (Media) — Screenshots bloqueaban suite funcional — resuelto
- **Archivos**: `playwright.config.ts`, `package.json`, `tests/e2e/*screenshots*.auth.spec.ts`.
- **Fix aplicado**: specs de screenshots marcadas con `@screenshots`; proyecto normal `authenticated-chromium` las ignora; comando dedicado `pnpm test:e2e:screenshots`.

### F8 (Baja) — Selectores y redirects legacy obsoletos — resuelto
- **Archivos**: `tests/e2e/sgc-cobertura.auth.spec.ts`, `tests/e2e/sgc-cobertura-screenshots.auth.spec.ts`.
- **Fix aplicado**: redirects esperan `/dashboard?tab=rondas`; selectores ajustados a `href`, regex y mapa actual por iframe.

### F9 (Media) — Rama de estado vacio de normativa es codigo muerto y asevera texto inexistente — resuelto
- **Archivo**: `tests/e2e/sgc-cobertura.auth.spec.ts` (test `opens the SGC normative matrix`), contra `src/app/(protected)/dashboard/sgc/normativa/page.tsx`.
- **Evidencia**: el test agrega `if ((await table.count()) === 0) { expect(getByText(/sin requisitos|no hay requisitos|0 requisitos/i)); return }`. Pero la pagina **siempre** renderiza `<table>` con `<thead>` estatico (linea 178), incluso con cero filas (el `<tbody>` queda vacio). Ademas **no existe** ningun texto "sin requisitos"/"no hay requisitos"/"0 requisitos" en la pagina.
- **Impacto**: la rama nunca se ejecuta (`table.count()` no es 0), asi que da cobertura ilusoria de "estado vacio". Si alguna vez la tabla faltara, la asercion fallaria porque el texto no existe. Contradice el criterio de Target 2 "Matriz normativa muestra mensaje vacio si no hay requisitos": el mensaje vacio **no esta implementado** en la pagina.
- **Fix aplicado**: se elimino la rama falsa y el regex de texto inexistente. El test valida encabezados reales (`Norma`, `Cobertura`, `Documentos`) y el contador visible `(\d+ requisitos filtrados)`.
- **Verificacion del fix**: `rg "table\\.count|sin requisitos|no hay requisitos|0 requisitos" tests/e2e/sgc-cobertura.auth.spec.ts` sin resultados; `pnpm test:e2e:start tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium` paso con 4 passed / 1 skipped; `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes.

### F10 (Baja) — `#formato-F-PSEA-10` mantiene acoplamiento a un formato seed — deuda aceptada
- **Archivo**: `tests/e2e/sgc-fase2.auth.spec.ts` (test `focuses the selected SGC format`).
- **Evidencia**: se removio el ID de ronda pero persiste `?formato=F-PSEA-10` + `#formato-F-PSEA-10`. Si una ronda existe pero su expediente no incluye ese formato, el caso **falla** en vez de omitirse.
- **Nota**: menor que el ID de ronda (los codigos `F-PSEA-*` son identificadores de dominio estables y el caso solo corre data-backed), por eso se acepta como deuda; aun asi contradice parcialmente el principio "condiciones funcionales, no datos exactos".
- **Fix sugerido (opcional)**: descubrir un `formato` real desde el expediente/coverage board, o `test.skip` si `#formato-F-PSEA-10` no esta presente tras cargar el panel.

### F11 (Baja) — `discoverRoundSgcUrl` es heuristico y lanza en vez de omitir si cambia el layout — deuda aceptada
- **Archivo**: `tests/e2e/sgc-helpers.ts`.
- **Evidencia**: asevera `heading /CALAIRE-APP/i` visible antes de leer enlaces (si el heading cambia, lanza, no `skip`), e infiere la URL SGC agregando `/sgc` al primer `a[href^="/dashboard/rondas/"]:not([href*="/nueva"])`. Hoy en `tab=rondas` solo se renderizan enlaces `/dashboard/rondas/<id>` limpios (`RondasTable`, `CoordinatorOverview`), asi que es seguro.
- **Fix sugerido (opcional)**: preferir `a[href^="/dashboard/rondas/"][href$="/sgc"]` cuando exista, o filtrar con regex de ID Convex, para no depender del sufijo agregado a mano.

### F12 (Baja) — `@screenshots` vive en el titulo del test, no en la API de tags — deuda aceptada
- **Archivos**: `tests/e2e/*screenshots*.auth.spec.ts`, `playwright.config.ts`.
- **Evidencia**: `@screenshots` esta embebido en el string del titulo, no en `test(..., { tag: '@screenshots' })`. Funciona con `--grep`, pero el guard real que saca screenshots de la suite funcional es `testIgnore: screenshotSpecs` (glob por nombre de archivo) en `authenticated-chromium`; el tag es cosmetico/redundante.
- **Fix sugerido (opcional)**: migrar a la API de tags de Playwright si se quiere el filtrado estructurado; el glob `testIgnore` ya sostiene la separacion.

**Resumen Fase 1**: Target 1 queda cerrado (sin IDs de ronda ni `toHaveCount(12)` en smoke; screenshots separados). F9 fue corregido en el test para no dar cobertura ilusoria de empty-state. F10-F12 quedan como deuda documentada.

---

## Fase 2 — Robustez frontend, offline y estados vacios — cerrada 2026-07-01

Alcance de la revision: cableado real de `safeConvexCallWithStatus` -> `.offline` -> `BackendOfflineBanner` en todas las rutas de Fase 2; distincion offline vs recurso inexistente vs vacio real; `loading.tsx`; unificacion `/sgc` <-> `/dashboard/sgc`.

**Estado heredado de Fase 0.5**: F1 (resumen SGC) y F2 (`/dashboard/sgc`) quedan **resueltos** por `safeConvexCallWithStatus` + `SgcResumenView` compartida (banner real bajo `127.0.0.1:9`). F3 (subrutas SGC) queda **resuelto**: `documentos`, `normativa` y `mapa` leen `WithStatus` y muestran banner + estado vacio real (incl. el mensaje de normativa que en Fase 1 no existia). F4 (codigos `cause`) queda **resuelto**: `collectErrorDetails` recorre la cadena `cause` y cubre `ETIMEDOUT`/`ECONNRESET`/`ENETUNREACH`/`UND_ERR_*`.

El defecto de raiz de F1 (doble captura: `safeConvexCall` traga el error, el `try/catch` de pagina nunca lo ve) persistia en tres rutas que no se habian migrado a `WithStatus`. Quedo corregido el 2026-07-01 00:14.

### F13 (Alta) — `/dashboard` admin: el banner offline es codigo muerto — resuelto
- **Archivos**: `src/app/(protected)/dashboard/data.ts` (31-67), `src/app/(protected)/dashboard/page.tsx` (111).
- **Evidencia**: `loadAdminDashboardData` envuelve en `try { ... } catch (isConvexOffline) { backendOffline = true }` las lecturas `listRondas()`, `listAllParticipantes()`, `listParticipantesRondaResumen()`, `listPTItems/SampleGroups/ResultadosPTRonda` — **todas usan `safeConvexCall`**, que traga el offline y devuelve `[]` sin lanzar. El `catch` nunca se ejecuta por offline de Convex (`listWorkOSUsers` no es Convex). Resultado: `backendOffline` queda `false` y `{adminData?.backendOffline && <BackendOfflineBanner />}` no se renderiza; `/dashboard` muestra tablas vacias silenciosas.
- **Impacto**: el workflow Fase 2 lista `/dashboard` en el smoke manual offline con "banner + estado vacio"; hoy no cumple. Es exactamente F1 reintroducido en el dashboard principal.
- **Fix aplicado**: `loadAdminDashboardData` usa `listRondasWithStatus`, `listAllParticipantesWithStatus`, `listParticipantesRondaResumenWithStatus` y resultados PT `WithStatus`; `backendOffline` se deriva de `.offline` y ya no depende del `catch`.
- **Verificacion del fix**: `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes; la suite E2E principal navego `/dashboard` con Convex offline y registro fallback para `listRondas`/`listAllParticipantes` sin fallar.

### F14 (Media) — `/mi-dashboard`: try/catch SGC muerto + empty-state contradictorio en offline — resuelto
- **Archivo**: `src/app/(protected)/mi-dashboard/page.tsx` (292-319, 248-282, 365-366).
- **Evidencia (a)**: el `try/catch` por ronda que llama `getHitosVisibleParticipante`/`getEvidenciasPublicas`/`listPublicacionesParticipante`/`listMisComentariosRonda`/`listMisNotificaciones` espera un throw offline, pero esas cinco lecturas usan `safeConvexCall` y ya tragan el error -> `sgcOfflineResults` es siempre `false`. La rama `if (isConvexOffline(error)) return true` es codigo muerto. (El caso full-offline aun se cubre por `rondasResult.offline`, que si es `WithStatus`.)
- **Evidencia (b)**: cuando `rondasResult.offline` es true, `rondas` es `[]`, asi que se renderiza `EmptyParticipantState` ("Aun no tiene rondas asignadas... no fue vinculada a una ronda activa") **junto con** el banner. Confunde "offline" con "sin rondas", justo lo que Target 3 pide evitar.
- **Fix aplicado**: las lecturas SGC del participante (`getHitosVisibleParticipante`, `getEvidenciasPublicas`, publicaciones, comentarios y notificaciones) tienen variantes `WithStatus`; `/mi-dashboard` agrega `OfflineParticipantState` y no muestra "sin rondas asignadas" cuando el backend esta offline.
- **Verificacion del fix**: `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes.

### F15 (Media) — `/dashboard/rondas/[id]`: metricas offline-parcial -> ceros sin banner — resuelto
- **Archivo**: `src/app/(protected)/dashboard/rondas/[id]/page.tsx` (263-311), `src/server/rondas/client.ts` `getRondaMetricasCompletas` (1419-1450).
- **Evidencia**: la pagina distingue bien ronda inexistente vs offline en `getRondaWithStatus` (264-279). Pero si la ronda carga y luego el backend no responde, `getRondaMetricasCompletas` usa `listParticipantesRondaResumen`/`listResultadosPTRonda`/`listPTItems` (todas `safeConvexCall`), que devuelven vacio -> metricas en cero. El render normal (con ronda) **no incluye `BackendOfflineBanner`**, asi que el usuario ve ceros sin senal de offline.
- **Impacto**: acotado (el full-offline lo intercepta `getRondaWithStatus` antes), pero el criterio "fallback visible donde haya lecturas" no se cumple en offline parcial.
- **Fix aplicado**: `getRondaMetricasCompletasWithStatus` compone `listParticipantesRondaResumenWithStatus`, `listResultadosPTRondaWithStatus` y `listPTItemsWithStatus`; la pagina muestra `BackendOfflineBanner` cuando las metricas degradan aunque la ronda exista.
- **Verificacion del fix**: `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes.

### F16 (Baja) — `/dashboard/rondas/[id]/sgc`: formularios de mutacion editables en offline — deuda aceptada
- **Archivo**: `src/app/(protected)/dashboard/rondas/[id]/sgc/page.tsx` (168-329).
- **Evidencia**: el checklist y los forms de F-PSEA-06/13/11 se renderizan siempre, fuera del condicional `panel ?`. En offline el banner avisa, pero los forms invitan a escrituras que fallaran. Consistente con "mutaciones fallan de forma visible", pero UX mejorable.
- **Fix sugerido (opcional)**: deshabilitar/ocultar los forms de escritura cuando `backendOffline` y `!panel`.

### F17 (Baja) — `BackendOfflineBanner` hardcodea `127.0.0.1:3212 (ECONNREFUSED)` — deuda aceptada
- **Archivo**: `src/components/ui/BackendOfflineBanner.tsx` (9-13).
- **Evidencia**: el texto fijo cita `127.0.0.1:3212` y `ECONNREFUSED`. Con offline forzado por otro host/codigo (`127.0.0.1:9`, ENOTFOUND, ETIMEDOUT) el mensaje es inexacto aunque el `detail` por-ruta compensa.
- **Fix sugerido (opcional)**: leer el host de `NEXT_PUBLIC_CONVEX_URL` o suavizar el texto a "no se pudo conectar con Convex".

### F18 (Baja) — `/sgc/mapa` reexporta la pagina dashboard sin parametrizar — deuda aceptada
- **Archivos**: `src/app/(protected)/sgc/mapa/page.tsx` (re-export), `src/app/(protected)/dashboard/sgc/mapa/page.tsx`.
- **Evidencia**: `/sgc/mapa` hace `export { default } from '../../dashboard/sgc/mapa/page'`. Reduce divergencia (bien), pero la pagina reusada trae boton "Cerrar sesion" e `iframe src="/dashboard/sgc/mapa/embed"` con textos del dashboard; no se parametriza por `basePath` como `SgcResumenView`.
- **Fix sugerido (opcional)**: parametrizar el mapa por `basePath` o aceptar la deuda cosmetica.

**Resumen Fase 2**: F1/F2/F3/F4 quedan resueltos para SGC (resumen, documentos, normativa, mapa). F13/F14/F15 quedan resueltos con loaders `WithStatus` en dashboard admin, mi-dashboard y metricas de ronda. Target 2 y Target 3 quedan cerrados para el alcance de Fase 2. F16-F18 permanecen como deuda baja aceptada.

---

## Fase 3 — Seguridad Convex (revisado 2026-07-01)

Alcance de la revision: guards de identidad/rol nuevos en `convex/rondas/*`, `convex/pt/index.ts`, `convex/fichas/index.ts`; helpers de `convex/access.ts`; migraciones a internas en `convex/migrations.ts`; y el **cableado real de identidad** entre el cliente de servidor (`src/server/rondas/client.ts`, `src/server/rondas/fichas.ts`) y esas funciones. No basta con leer los guards: hay que comprobar que el token de sesion llega al backend.

**Estado heredado**: F5 (migraciones publicas) queda **resuelto**: `convex/migrations.ts` es `internalQuery`/`internalMutation` (incl. `wipeAll`), sin consumidores `api.migrations.*` en `src/`. Target 5 se sostiene.

### F19 (Alta / bloqueante) — Los guards nuevos rompen `rondas`/`pt`/`fichas` con Convex online: el cliente de servidor no reenvia el token — resuelto (2026-07-01)
- **Archivos**: `src/server/rondas/client.ts` (todos los `fetchQuery`/`fetchMutation`), `src/server/rondas/fichas.ts` (idem), contra `convex/rondas/*`, `convex/pt/index.ts`, `convex/fichas/index.ts`. Contraste: `src/server/sgc/index.ts`.
- **Evidencia**: Fase 3 agrega `requireIdentity`/`requireParticipantOrAdminForRonda`/`requireAdminIdentity`/... a las funciones de rondas/pt/fichas, que dependen de `ctx.auth.getUserIdentity()`. Pero `client.ts` y `fichas.ts` invocan `fetchQuery(api..., args)` y `fetchMutation(api..., args)` **sin el tercer argumento `{ token }`**. El unico modulo que si autentica es SGC: `sgcToken()` -> `requireAuth().accessToken` -> `fetchQuery(..., { token })`. Sin ese token, en un backend Convex real y con usuario autenticado, `getUserIdentity()` devuelve `null` y **todo guard lanza** `Autenticacion requerida`.
- **Impacto**:
  - Lecturas (envueltas en `safeConvexCall`/`WithStatus`): el error se traga y se devuelve el fallback vacio -> el dashboard admin, listados de rondas, participantes, PT y fichas se ven **vacios pese a estar autenticado** (no es offline: Convex responde, pero rechaza por falta de identidad; `isConvexOffline` no lo marca como offline, asi que ni siquiera muestra banner).
  - Mutaciones (`fetchMutation` directo, sin `safeConvexCall`): **lanzan al usuario**. Crear/configurar ronda, transicionar estado, asignar/rehacer participantes, `upsertEnvio`, `submitFinalPT`, `claimParticipanteToken`, y todas las mutaciones de ficha (`getOrCreateFicha`, `upsertFichaScalar`, `replace*`, `submitFicha`, admin*) fallan.
- **Por que paso la verificacion**: toda la validacion de Fase 3 (`build`, `test`, E2E) corrio con **Convex offline**, donde cada lectura degrada a fallback y las mutaciones no se ejercen contra un backend real. `convex/access.test.ts` solo prueba el **rechazo sin identidad**, nunca el camino autenticado. El defecto queda 100% enmascarado.
- **Fix sugerido**: replicar el patron SGC en rondas/pt/fichas. Extraer un helper `rondasToken()` (o reutilizar uno comun) `= (await requireAuth()).accessToken` y pasar `{ token }` como tercer argumento en cada `fetchQuery`/`fetchMutation` de `client.ts` y `fichas.ts` que ahora exige identidad. Para lecturas con fallback, cuidar de no tragar el `Autenticacion requerida` como si fuera offline (distinguir 401/authz de `isConvexOffline`).
- **Fix aplicado**: en `client.ts` y `fichas.ts` se aliasan los imports reales (`fetchQuery as rawFetchQuery`, `fetchMutation as rawFetchMutation`) y se definen wrappers locales `fetchQuery`/`fetchMutation` que reenvian `{ token }` derivado de `requireAuth().accessToken` (`rondasToken()`/`fichasToken()`, mismo patron que `sgcToken()`). Al sombrear los nombres, los ~50 call-sites existentes reenvian el token sin editarse uno por uno. No se toca `isConvexOffline`: un `Autenticacion requerida` no matchea los codigos de red ni `fetch failed`, asi que `safeConvexCall` lo relanza en vez de tragarlo como offline.
- **Verificacion del fix**: `pnpm exec convex codegen`, `pnpm lint`, `pnpm build`, `pnpm test` y `pnpm test:e2e:start` verdes. La suite E2E offline sigue degradando a fallback sin regresion (el token se deriva pero Convex offline lanza error de red que `isConvexOffline` captura). El camino autenticado + rechazo cross-tenant queda cubierto por los nuevos casos `withIdentity` de `convex/access.test.ts` (ver F23). Falta pendiente la validacion manual contra un Convex **online** real.

### F20 (Media) — Lecturas sensibles solo `requireIdentity`, sin ownership ni rol -> exposicion horizontal — resuelto (2026-07-01)
- **Archivos**: `convex/fichas/index.ts` (`getFichaById`, `getFichaDirectorioPreview`, `findFichaTemplateByLookup`, `listFichaResumenesByRpIds`, `listFichaResumenesByRonda`), `convex/rondas/reads.ts` (`listRondas`, `listAllParticipantes`, `listDirectorioParticipantes`, `getDirectorioParticipanteByLookup`), `convex/rondas/resultados.ts` (`listResultados`, `listResultadosRonda`), `convex/pt/index.ts` (`listPTItems`, `listPTSampleGroups`, `listParticipantesPT`, `listResultadosPTRonda`, `listEnviosPTRound`).
- **Evidencia**: todas usan `await requireIdentity(ctx)` (cualquier autenticado), sin `requireAdminIdentity` ni `requireParticipantOrAdminForRonda`. `getFichaById` devuelve **cualquier** ficha por id sin verificar que el llamante sea su participante/admin, a diferencia de `getFichaByRondaParticipante`. `listAllParticipantes`/`listDirectorio*` exponen emails y NIT de **todos** los laboratorios a cualquier participante autenticado.
- **Impacto**: escalamiento horizontal / fuga de datos cross-lab. `fase3.md` ya reconoce esta deuda ("algunas lecturas de admin siguen siendo autenticacion-only").
- **Fix sugerido**: aplicar `requireAdminIdentity` a los listados de superficie admin (`listAllParticipantes`, `listDirectorio*`, `listRondas` si aplica) y derivar ownership por la ficha/ronda en `getFichaById` y los resumenes. Priorizar los que exponen datos de otros labs.
- **Decision de producto**: un participante **no** puede ver resultados agregados de co-participantes (confirmado por el usuario 2026-07-01).
- **Fix aplicado** (guard por-funcion, no una talla unica):
  - **admin-only** (`requireAdminIdentity`) — exponen datos de otros labs/participantes: `rondas/reads.ts` `listRondas`, `listAllParticipantes`; `rondas/directorio_definitions.ts` `listDirectorioParticipantes`, `getDirectorioParticipanteByLookup`; `rondas/resultados.ts` `listResultados`, `listResultadosRonda`; `pt/index.ts` `listParticipantesPT`, `listResultadosPTRonda`, `listEnviosPTRound`; `fichas/index.ts` `getFichaDirectorioPreview`, `findFichaTemplateByLookup`, `listFichaResumenesByRpIds`, `listFichaResumenesByRonda`.
  - **participante-o-admin de la ronda** (`requireParticipantOrAdminForRonda`) — config PT que el participante necesita para su propio envio, sin fuga cross-participante: `pt/index.ts` `listPTItems`, `listPTSampleGroups`.
  - **ownership por ficha** (`requireParticipantOrAdminForFicha`): `fichas/index.ts` `getFichaById`.
  - No se afecta el `agent-router` (usa el namespace propio `api.agent.*` con `apiKey`, no `api.rondas.index.*`/`api.pt.index.*`/`api.fichas.index.*`). El unico consumidor por Convex client de navegador (`findFichaTemplateByLookup` en `FichaAdminEditor`) opera bajo `ConvexProviderWithAuth` con el token WorkOS del admin, asi que el guard admin se satisface.
- **Verificacion del fix**: `pnpm exec convex codegen`, `pnpm lint`, `pnpm build`, `pnpm test` (`access.test.ts`: 8 passed) y `pnpm test:e2e:start` verdes. `access.test.ts` cubre: rechazo no-admin en `listAllParticipantes`/`listRondas` (`Permisos insuficientes`), exito admin, y `listPTItems` exigiendo membresia de ronda (`No tiene acceso a esta ronda` en ronda ajena).

### F21 (Baja) — Definicion de "admin" divergente entre `access.ts` y `sgc/shared.ts` — resuelto (2026-07-01)
- **Archivos**: `convex/access.ts` (`ADMIN_ROLES = {admin, admin_sgc, coordinador_proceso}`) vs `convex/sgc/shared.ts` (`requireParticipanteOAdmin` solo trata `admin`).
- **Impacto**: un `admin_sgc`/`coordinador_proceso` es admin para rondas/pt/fichas pero no para el bypass de participante en SGC; autorizacion inconsistente entre dominios.
- **Fix aplicado**: fuente unica en `convex/sgc/shared.ts` (`export const ADMIN_ROLES` + `isAdminRole(roles)`). `requireSgcAdmin`, `requireSgcViewerAccess` (viewer = `[...ADMIN_ROLES, 'consulta']`, `canReadInternal = isAdminRole`) y `requireParticipanteOAdmin` (antes `roles.includes('admin')`) usan el helper; `convex/access.ts` `isAdminIdentity` = `isAdminRole(identityRoles(identity))`. Ahora `admin_sgc`/`coordinador_proceso` tambien hacen bypass de participante en SGC, consistente con rondas/pt/fichas.
- **Verificacion del fix**: `pnpm exec convex codegen`, `pnpm lint`, `pnpm build`, `pnpm test` y `pnpm test:e2e:start` verdes.

### F22 (Baja) — Parametros `userId` muertos en la API del cliente — resuelto (2026-07-01)
- **Archivo**: `src/server/rondas/client.ts` (`isInvitado`, `listEnvios`, `getEstadoEnvioParticipante`, `getRondaParticipantePT`, `listEnviosPT`, `getEstadoEnvioPTParticipante`, `submitFinalPT`, `claimParticipanteToken`, `listRondasParticipante`).
- **Evidencia**: se conservo la firma `(rondaId, _userId)` con `void _userId`; los callers en `src/app/**` siguen pasando `auth.user.id` que ahora se ignora (el backend deriva el sujeto del token). Riesgo de confusion: parece que el `userId` sigue gobernando el acceso.
- **Hallazgo adicional (bug funcional)**: `listRondasParticipante` **no** era un param muerto inocuo: `dashboard/participantes/[uid]/page.tsx` (admin) le pasa el `uid` de otro participante, pero el backend derivaba de `identity.subject` e **ignoraba** el userId, devolviendo las rondas del admin -> `notFound()`. El panel admin de detalle de participante estaba roto desde Fase 3.
- **Fix aplicado**:
  - **Params self-context eliminados** (el backend siempre usa `identity.subject`): `isInvitado(WithStatus)`, `listEnvios`, `getEstadoEnvioParticipante`, `getRondaParticipantePT(WithStatus)`, `listEnviosPT(WithStatus)`, `getEstadoEnvioPTParticipante(WithStatus)`, `submitFinalPT`, `claimParticipanteToken` (ahora `(rondaId, token, email)`). Callers en `ronda/[codigo]/**` actualizados.
  - **`listRondasParticipante`: userId hecho *vivo* y correcto** en vez de eliminado. Convex `listRondasParticipanteDefinition` acepta `userId: v.optional(v.string())`: si difiere del sujeto del token exige admin (`isAdminIdentity`), si no usa el sujeto. El cliente vuelve a reenviar `{ userId }`. Los callers self (layout, mi-dashboard, dashboard) siguen pasando `auth.user.id` (== sujeto -> sin admin), y el panel admin `[uid]` ahora recibe las rondas del participante correcto.
- **Verificacion del fix**: `pnpm exec convex codegen`, `pnpm lint`, `pnpm build`, `pnpm test` (`access.test.ts`: 9 passed, incluye el nuevo caso admin/no-admin de `listRondasParticipante`) y `pnpm test:e2e:start` verdes.

### F23 (Baja / confirmatorio) — El test de acceso solo cubre el rechazo sin identidad — resuelto (2026-07-01)
- **Archivo**: `convex/access.test.ts`.
- **Evidencia**: 3 casos, todos "sin identidad -> throw". No hay caso `withIdentity` que confirme (a) exito autenticado ni (b) rechazo cross-tenant (participante de ronda A no puede leer ronda B). Justo esa ausencia dejo pasar F19.
- **Fix aplicado**: se agregaron dos casos `withIdentity`. (1) Participante de la ronda A (`rondaParticipantes.workosUserId === subject`) lee `listParticipantesRondaResumen` de A con **exito** y es **rechazado** en la ronda B con `/No tiene acceso a esta ronda/` (guard `requireParticipantOrAdminForRonda`). (2) Un `admin` (identidad con `role: 'admin'`) lee cualquier ronda sin ser participante. Ejercen el camino autenticado exitoso, no solo el rechazo.
- **Verificacion del fix**: `pnpm exec vitest run convex/access.test.ts` -> 5 passed; incluido en `pnpm test`.

**Resumen Fase 3**: F5 resuelto (migraciones internas). **F19 (bloqueante) resuelto**: `client.ts`/`fichas.ts` reenvian el token (patron `sgcToken()`), asi que la app autenticada opera con Convex online. **F23 resuelto**: `access.test.ts` cubre el camino autenticado (exito propio + rechazo cross-tenant + admin). Con F19 corregido y F23 agregado, **Target 4 (autorizacion backend) queda cerrado** salvo la validacion manual pendiente contra un Convex online real. **F20 resuelto**: las lecturas sensibles pasaron de `requireIdentity` a `requireAdminIdentity` / `requireParticipantOrAdminForRonda` / ownership por ficha, cerrando la fuga cross-lab (un participante ya no ve resultados ni datos de otros labs). **F21 resuelto**: fuente unica de roles admin (`ADMIN_ROLES`/`isAdminRole` en `sgc/shared.ts`) compartida con `access.ts`. **F22 resuelto**: params `userId` muertos eliminados y, de paso, corregido un bug funcional (panel admin de detalle de participante) haciendo `userId` vivo con guard admin en `listRondasParticipante`. **Fase 3 cerrada** (F5, F19-F23), a falta solo de la validacion manual contra un Convex online real.

---

## Fase 4 — Infraestructura minima

Alcance de la revision: dependencias runtime (`package.json`/`pnpm-lock.yaml`), lockfile unico, artefactos generados en `logs/`, separacion de screenshots y verificacion local de infraestructura.

### F24 (Media) — Dependencias runtime vivian en `devDependencies` — resuelto (2026-07-01)
- **Archivos**: `package.json`, `pnpm-lock.yaml`.
- **Evidencia**: `zod` y `@t3-oss/env-nextjs` son usados por runtime/config de la app, pero estaban en `devDependencies`.
- **Fix aplicado**: `pnpm add --save-prod zod @t3-oss/env-nextjs`. Ambas dependencias quedaron en `dependencies`; `pnpm-lock.yaml` actualizado y `package-lock.json` ausente.
- **Verificacion**: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build`.

### F25 (Baja) — Historial local de agente estaba versionado — resuelto (2026-07-01)
- **Archivos**: `.gitignore`, `logs/history/`, `logs/plans/`.
- **Evidencia**: `logs/history/` y `logs/plans/` contienen bitacoras/planes generados y numerosos archivos ya trackeados.
- **Decision**: mantener versionables `logs/CURRENT_SESSION.md` y rundowns/cierres de fase; ignorar historial y planes generados.
- **Fix aplicado**: `.gitignore` agrega `logs/history/` y `logs/plans/`; `git rm --cached -r --ignore-unmatch logs/history logs/plans` desindexo esas carpetas sin borrar archivos locales.
- **Verificacion**: `git ls-files logs/history logs/plans` devuelve `0`; `git check-ignore -v` confirma ambas reglas.

### F26 (Confirmatorio) — Screenshots separados de la suite funcional — resuelto previamente, verificado en Fase 4
- **Archivos**: `package.json`, `playwright.config.ts`, `docs/screenshots/`.
- **Evidencia**: `pnpm test:e2e:screenshots` existe como comando dedicado y `pnpm test:e2e:start` excluye screenshots funcionalmente.
- **Verificacion Fase 4**: antes y despues de `pnpm test:e2e:start` siguen apareciendo solo los tres screenshots de `docs/screenshots/fase-3/*` que ya estaban modificados antes de esta fase; la suite funcional no genero cambios nuevos.

### Revision post-implementacion (2026-07-01) — verificacion del cableado real

Alcance: verificar, no solo leer la afirmacion, que (a) las dependencias movidas son de runtime y ninguna otra quedo mal ubicada, (b) el lockfile resuelve congelado, y (c) el saneamiento de logs no arrastro artefactos que la decision queria versionar.

Comprobaciones ejecutadas:

- **Ubicacion de dependencias completa y correcta.** Todo import npm de `src/` resuelve a `dependencies`: `clsx`, `convex`, `next`, `react`, `react-dom`, `resend`, `tailwind-merge`, `@workos-inc/authkit-nextjs`, `@workos-inc/node`, `@t3-oss/env-nextjs`, `zod`. Ningun modulo de runtime en `src/` importa un paquete de `devDependencies`. `src/env.ts` es el unico consumidor de `zod`/`@t3-oss/env-nextjs` (justifica el move). `convex/` **no** importa `zod`, asi que no se necesita como dep de runtime adicional para `convex deploy`.
- **Lockfile.** `pnpm install --frozen-lockfile` -> "Lockfile is up to date, resolution step is skipped / Already up to date". `package-lock.json` ausente.
- **Logs.** `git ls-files logs/` -> solo `logs/CURRENT_SESSION.md`. `logs/history/` (166 archivos) y `logs/plans/` (25) preservados en disco y desindexados; `git check-ignore` confirma ambas reglas.

### F27 (Baja) — Rundowns/cierres de fase "versionables" siguen sin trackearse — abierto (procedimiento)
- **Archivos**: `logs/260701_rundown.md`, `logs/260630_rundown.md` (y los propios `fase4.md`, `review_fix.md`, `plan_fix.md`, `target_fix.md`).
- **Evidencia**: la decision F25 dice mantener versionables "`logs/CURRENT_SESSION.md` y los rundowns/cierres de fase". Estos no estan ignorados (viven en `logs/` raiz, no en `history/`/`plans/`), pero hoy solo `logs/CURRENT_SESSION.md` esta trackeado; los rundowns figuran como untracked. Ademas ninguna de las Fases 1-4 se ha commiteado (el workflow pide "un commit por fase"), asi que todo el set documental sigue en el arbol sucio.
- **Impacto**: bajo. No hay defecto de codigo; el `.gitignore` es correcto. Riesgo real solo si se hace un `git add` selectivo que omita los rundowns, o si el arbol se limpia antes de commitear.
- **Fix sugerido**: al commitear la fase, incluir explicitamente los rundowns y docs de fase (`git add logs/*.md *fix.md fase*.md`), o commitear por fase segun `workflow_fix.md` seccion 5.

### F28 (Baja) — El diff de `package.json` incluye tooling de test no documentado en Fase 4 — resuelto documentalmente
- **Archivo**: `package.json` (diff vs HEAD).
- **Evidencia**: ademas del move de `zod`/`@t3-oss/env-nextjs`, el diff agrega `@edge-runtime/vm` y `convex-test` a `devDependencies`. Son de **Fase 3** (test de `convex/access.test.ts`, que declara `// @vitest-environment edge-runtime` segun la guia de convex-test). Estan bien ubicados como devDeps; solo no se mencionan en `fase4.md`/F24.
- **Impacto**: nulo funcional; claridad de trazabilidad.
- **Fix aplicado**: `fase4.md` documenta que `@edge-runtime/vm` y `convex-test` pertenecen al test de acceso de Fase 3 y estan correctamente ubicados como `devDependencies`.

### F29 (Baja) — CI minimo agregado (accion 4 de Fase 4 / Target 8) — resuelto
- **Archivos**: `.github/workflows/ci.yml`.
- **Evidencia previa**: la accion 4 de Fase 4 y el Target 8 contemplaban "CI o checklist manual". Se habia optado por checklist manual, dejando sin puerta automatizada `install --frozen-lockfile` + `lint`/`test`/`build`.
- **Fix aplicado**: se agrego `.github/workflows/ci.yml` con `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` y `pnpm build`. Usa `corepack`, Node 22 y variables dummy validas para `src/env.ts`. No corre E2E autenticado porque auth/seeds no son reproducibles en CI.
- **Verificacion del fix**: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes localmente tras agregar el workflow; E2E funcional: 6 passed / 3 skipped intencionales.

### F30 (Baja) — `docs/screenshots/fase-3/*` modificados sin resolver — deuda aceptada
- **Archivos**: `docs/screenshots/fase-3/{01-resumen-sgc-global,02-matriz-documental-maestra,03-tabla-documental-sgc}.png`.
- **Evidencia**: el criterio de Target 8 "screenshots no cambian durante E2E funcional" **se cumple** (la suite no agrego cambios). Pero esas tres modificaciones son previas a Fase 4 y siguen en el arbol sucio, ni revertidas ni commiteadas.
- **Fix sugerido**: decidir en Fase 5 revert (si son ruido) o commit (si reflejan UI vigente). No es bloqueante.

**Resumen Fase 4**: Target 7 y Target 8 quedan cerrados; la revision post-implementacion **confirma** el move de dependencias (completo, sin runtime deps huerfanas, lockfile congelado OK), el saneamiento de logs (desindexado sin perdida local) y el CI minimo reproducible (`install`, `lint`, `test`, `build`, sin E2E autenticado). Sin defectos de codigo. F28 queda resuelto documentalmente y F29 resuelto con `.github/workflows/ci.yml`. Quedan dos observaciones Baja no bloqueantes: F27 (rundowns aun untracked / fases sin commitear) y F30 (screenshots dirty). F27 conviene resolverla al commitear.

---

## Fase 5 — Verificacion final y cierre — revisado 2026-07-01

Alcance de la revision: los dos cambios de codigo de Fase 5 (`scripts/import-sgc-seeds.mjs`, `tests/e2e/sgc-fase2.auth.spec.ts`) y la coherencia del cierre (checkboxes de targets, deudas heredadas). Los dos cambios de Fase 5 son **correctos y estan verificados** (seed importo 51 docs / 1.047 requisitos / 82 relaciones; E2E autenticado 8 passed). Los hallazgos son un fix incompleto y brechas de cierre, no defectos en lo ya modificado.

### F31 (Media) — El fix de segmento `sgc/index:` se aplico de forma incompleta — resuelto (2026-07-01)
- **Archivos**: `scripts/upload-sgc-document-versions.mjs` (59, 72, 107); contraste con `scripts/import-sgc-seeds.mjs` (ya corregido en Fase 5).
- **Evidencia**: Fase 5 corrigio `sgc:` -> `sgc/index:` **solo** en el script de seeds, pero `scripts/upload-sgc-document-versions.mjs` —cableado a `pnpm sgc:upload-document-versions` (`package.json:20`)— seguia invocando `sgc:generateUploadUrl`, `sgc:listSgcMaestro` y `sgc:registrarVersionOficial`. Como `convex/sgc/index.ts` es segmento explicito (regla del repo), esas tres llamadas fallan con el mismo "function not found" que motivo el fix de seeds. Las tres funciones existen (`convex/sgc/index.ts:27,38,42`), asi que el script esta roto de punta a punta.
- **Impacto**: la carga de versiones oficiales de documentos SGC (`pnpm sgc:upload-document-versions`) no funciona contra un Convex real; mismo bug de Fase 5 sin resolver en un script hermano y wired.
- **Fix aplicado**: los tres call-sites pasan a `sgc/index:generateUploadUrl`, `sgc/index:listSgcMaestro`, `sgc/index:registrarVersionOficial`. `node --check` verde.
- **Deuda relacionada cerrada**: `scripts/poblar-plan-r1.mjs:114` invocaba `sgc:seedPlanRonda`, pero esa funcion **ya no existe** en `convex/` y el script **no** estaba en `package.json`. Se elimino el script como codigo muerto en vez de corregir el segmento de un entrypoint inexistente.

### F32 (Baja) — Test data-backed acoplado al estado de evidencia de F-PSEA-10 — resuelto (2026-07-01)
- **Archivo**: `tests/e2e/sgc-fase2.auth.spec.ts` (test `focuses the selected SGC format`).
- **Evidencia**: aseveraba el boton `Registrar evidencia`, que `ExpedienteSgc.tsx` (107) solo muestra cuando **no** hay version vigente; si el expediente ya tiene evidencia cargada para F-PSEA-10 el boton dice `Reemplazar evidencia` y el caso **falla** en vez de pasar. Misma clase de acoplamiento que F10/F16. Hoy pasa porque los seeds SGC no cargan evidencia de ronda.
- **Fix aplicado**: la asercion usa `getByRole('button', { name: /Registrar evidencia|Reemplazar evidencia/ })`; tolera ambos estados sin perder cobertura. La corrida verde actual (`Registrar evidencia`) sigue satisfaciendola.

### F33 (Media / documental) — Inconsistencia de cierre: Target 9 y Target 10 sin marcar — resuelto (2026-07-01)
- **Archivo**: `target_fix.md` (Target 9, Target 10).
- **Evidencia**: `fase5.md` y el rundown declaran **Target 9 cerrado localmente** (lint/test/build/codegen/E2E smoke + E2E autenticado con seeds verdes) y Target 10 sustancialmente completo (offline deterministico `127.0.0.1:9`, gate de auth escrito, screenshots por comando separado), pero sus `Success criteria` seguian todos en `[ ]`. Cierre no trazable.
- **Fix aplicado**: se marcaron los criterios de Target 9 y Target 10 con la evidencia de Fase 5, se agrego el bloque de estado correspondiente y `diagnostico.md` quedo complementado con el cierre de verificacion final.

### F34 (Baja) — Target 6 se cierra sin abordar: consultas Convex no acotadas — deuda aceptada
- **Archivos**: `convex/**` (215 `.collect()` en `convex/`), `target_fix.md` (Target 6).
- **Evidencia**: el cierre funcional no toco Target 6 (consultas acotadas/indexadas); sus criterios siguen en `[ ]`. El propio Target 6 admite "cerrarse por inventario y deuda documentada si el cambio de paginacion completa es demasiado amplio para el fix funcional inmediato".
- **Decision**: se cierra Target 6 **por deuda documentada** (no se introdujeron `.collect()` nuevos en el arreglo funcional; la paginacion completa excede el alcance de recuperacion funcional). Queda como deuda de rendimiento explicita, no como bloqueo de Fase 5.
- **Fix sugerido (futuro)**: auditar los 215 `.collect()`, migrar los listados grandes a `withIndex`/`.take(n)`/paginacion y agregar indices `by_<campo>` en `convex/schema.ts`.

### F35 (Baja / procedimiento) — Deudas de cierre heredadas sin resolver (F27, F30) — abierto (procedimiento)
- **Evidencia**: (a) `docs/screenshots/fase-3/*` siguen modificados sin decidir revert/commit —`fase5.md` lo reconoce explicitamente—; Fase 5 era el lugar asignado para F30. (b) Ninguna Fase 1-5 esta commiteada y los rundowns/docs versionables siguen untracked (F27).
- **Impacto**: bajo; no hay defecto de codigo. Riesgo solo si un `git add` selectivo omite los docs versionables o si el arbol se limpia antes del commit.
- **Fix sugerido**: al preparar el commit de cierre, (1) decidir los tres screenshots (revert si son ruido, commit si reflejan UI vigente) y (2) incluir explicitamente docs y rundowns (`git add logs/*.md *fix.md fase*.md`), commiteando por fase o consolidado segun `workflow_fix.md` seccion 5.

**Resumen Fase 5**: los dos cambios de Fase 5 son correctos y verificados. Se encontro **F31 (Media)**: el fix de segmento `sgc/index:` estaba incompleto y dejaba roto `upload-sgc-document-versions.mjs` (wired) — **corregido**. **F32 (Baja)** acoplamiento del test a la evidencia de F-PSEA-10 — **corregido** con regex tolerante. **F33 (Media/doc)** — checkboxes de Target 9/10 marcados con evidencia y `diagnostico.md` complementado con cierre final. **F34 (Baja)** — Target 6 cerrado por deuda documentada. **F35** — F27/F30 quedan como procedimiento de commit. Con F31-F33 aplicados, el cierre funcional (Target 9) queda consistente; deudas de rendimiento (Target 6) y de commit (F35) quedan documentadas, no bloquean.
