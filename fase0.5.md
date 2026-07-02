# Fase 0 y 0.5 - Resumen de ejecucion

**Fecha**: 2026-06-30 21:15 -05  
**Rama**: `feature/t3-estructura-segura`
**Estado Fase 0.5**: cerrada documentalmente (2026-06-30 21:27 -05)

## Cambios realizados

- Se ejecuto el preflight de Fase 0.5.
- Se ejecuto el baseline de Fase 0.
- Se actualizaron los registros de seguimiento:
  - `logs/CURRENT_SESSION.md`
  - `logs/plans/260630_2106_plan_fix-funcional-app.md`
  - `target_fix.md`
  - `logs/history/260630_2115_findings.md`
- No se hicieron cambios de codigo de producto.
- No se tocaron los screenshots modificados en `docs/screenshots/fase-3/*`.

## Avances

- `pnpm lint`: paso.
- `pnpm test`: paso.
- `pnpm build`: paso.
- `pnpm test:e2e:start --project=chromium`: paso.
- `pnpm test:e2e:start`: ejecutado y registrado; falla de forma reproducible con 8 specs SGC autenticadas/screenshots.
- Preflight de entorno registrado:
  - Convex env en shell: falta.
  - `.auth/workos.json`: existe.
  - `AUTH_TEST_*`: ausentes.
- Confirmado que no hay consumidores cliente de `api.migrations.*`:
  - `rg "api\\.migrations" src` no arrojo resultados.
- Confirmado que `isConvexOffline` cubre `ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN` y `fetch failed`.

## Problemas encontrados

- Convex se observo offline durante Playwright; el servidor registro fallbacks para:
  - `listSgcMaestro`
  - `listNormativaSgc`
  - `listMapaSgc`
  - `listRondas`
  - `listAllParticipantes`
  - `getRonda`
- La suite E2E principal falla en specs acopladas a datos seed, rutas SGC y screenshots.
- Fallos reproducidos:
  - `sgc-cobertura-screenshots.auth.spec.ts`: espera heading `Dashboard documental por ronda`.
  - `sgc-cobertura.auth.spec.ts`: selector exacto `Centro documental`.
  - `sgc-cobertura.auth.spec.ts`: espera un documento seed en la tabla.
  - `sgc-cobertura.auth.spec.ts`: espera link `Abrir HTML original` en mapa.
  - `sgc-cobertura.auth.spec.ts`: espera redirect legacy a `/dashboard/rondas/expedientes`, pero la app termina en `/dashboard?tab=rondas`.
  - `sgc-fase2-screenshots.auth.spec.ts`: timeout esperando `Panel SGC`.
  - `sgc-fase2.auth.spec.ts`: espera `Panel SGC` con ronda hardcodeada/offline.
  - `sgc-fase2.auth.spec.ts`: espera `#formato-F-PSEA-10`.
- El gate autenticado depende del cache `.auth/workos.json`; sin `AUTH_TEST_*`, si ese cache caduca no se puede renovar automaticamente.

## Pendientes

- Siguiente fase: iniciar Target 1:
  - remover IDs hardcodeados de specs funcionales;
  - reemplazar selectores exactos fragiles;
  - actualizar expectativas de redirects legacy a `/dashboard?tab=rondas`;
  - separar screenshots de la suite funcional principal;
  - permitir estados vacios cuando no haya datos seed.
- Re-ejecutar:
  - `pnpm test:e2e:start --project=chromium`
  - `pnpm test:e2e:start`
- Si la suite autenticada no puede renovarse por falta de credenciales, cerrar con gate degradado: smoke publico verde + bloqueo documentado.
- Continuar luego con Targets 2 y 3 para offline/estados vacios en rutas SGC, rondas y participante.
- F1/F2/F3 del code review no bloquean el cierre de Fase 0.5 porque la fase era de precondiciones/documentacion sin cambios de codigo; quedan promovidos a Fase 2 con prioridad alta.

---

## Code review / Fixes (2026-06-30)

Revision del codigo detras de las afirmaciones de Fase 0.5, con propuestas de fix. La verificacion previa comprobo `isConvexOffline` **en aislamiento**; esta revision comprueba su **cableado** hacia el banner y los estados vacios.

### Hallazgos

- **F1 (Alta) — `BackendOfflineBanner` es codigo muerto en offline (doble captura).**
  - Evidencia: `src/server/sgc/index.ts` y `src/server/rondas/client.ts` envuelven cada lectura en `safeConvexCall` (27 usos), que traga el error offline y devuelve el fallback vacio en vez de propagarlo. Por eso el `try/catch { if(!isConvexOffline) throw; backendOffline=true }` de `src/app/(protected)/sgc/page.tsx` (lineas 20-28) y `src/app/(protected)/dashboard/data.ts` (lineas 53-65) nunca recibe un error: `backendOffline` queda `false` y el banner nunca se renderiza.
  - Impacto: offline degrada a ceros silenciosos; el usuario no distingue "base vacia" de "backend caido". No hay crash, pero **el criterio "banner visible cuando Convex offline" (Target 2 y Target 3) no se cumple** con el codigo actual.
  - Correccion de registro: la nota de que "las rutas rinden banner + estado vacio" solo es cierta en la parte de estado vacio; el banner esta desconectado.
  - Fix propuesto: exponer el estado offline sin perder el fallback vacio. Opcion recomendada: variante `safeConvexCallWithStatus` que devuelva `{ data, offline }`, o que las funciones de lista que alimentan banners (`listSgcMaestro`/`listNormativaSgc`/`listMapaSgc`, `listRondas`/`listAllParticipantes`) llamen `fetchQuery` crudo dentro de su propio `try/catch` (como pretende `dashboard/data.ts`) en lugar del wrapper ya-tragado. Alternativa: senal offline por-request (AsyncLocalStorage / `cache()`) que las paginas lean.

- **F2 (Media) — `/dashboard/sgc/page.tsx` no distingue offline/vacio y diverge de `/sgc`.**
  - Llama `listSgcMaestro/Normativa/Mapa` directo y lee `.resumen.total`; no crashea (el wrapper traga) pero nunca muestra banner y duplica la vista de `/sgc`.
  - Fix propuesto: compartir componente/vista con `/sgc` y aplicar el mecanismo offline de F1 una sola vez.

- **F3 (Media) — `dashboard/sgc/{documentos,normativa,mapa}/page.tsx` sin manejo offline.**
  - Rinden pero sin banner; el mismo enmascaramiento por doble captura aplica.
  - Fix propuesto: reutilizar el mecanismo de F1.

- **F4 (Baja) — `isConvexOffline` inspecciona `cause` un solo nivel.**
  - `src/lib/convex-fallback.ts` lee `error.cause.code` y `error.code`; no recorre la cadena de `cause` anidada de undici ni cubre `ETIMEDOUT`/`ECONNRESET`/`ENETUNREACH`/`UND_ERR_*`. El fallback `message.includes('fetch failed')` cubre la mayoria.
  - Nota: los mecanismos deterministas documentados (`127.0.0.1:9`->ECONNREFUSED, host `.convex.cloud` inexistente->ENOTFOUND) si quedan cubiertos, por lo que Target 10 se sostiene.
  - Fix propuesto (opcional): agregar los codigos faltantes y recorrer la cadena `cause`.

- **F5 (Confirmatorio) — `convex/migrations.ts`: 14 mutaciones publicas, 0 internas, `wipeAll` publica.**
  - No es hallazgo nuevo; confirma Target 5 / Fase 3.2. Sin consumidores `api.migrations.*` en `src/`, por lo que pasar a `internalMutation` es seguro para el seed via `convex run`.

### Prioridad sugerida

1. F1 primero: es el que invalida el criterio de banner de Targets 2 y 3.
2. F2 y F3 se resuelven con el mismo mecanismo de F1.
3. F4 y F5 quedan como deuda acotada (F5 ya vive en Fase 3).

### Cierre de Fase 0.5 (2026-06-30 21:27 -05)

- Decisiones de auth E2E y offline deterministico escritas.
- Baseline, preflight y fallos E2E documentados.
- Code review de las afirmaciones de Fase 0.5 completado y registrado en `review_fix.md`.
- No se implementaron fixes de producto en esta fase por definicion del plan.
- Estado siguiente: Fase 1 / Target 1.
