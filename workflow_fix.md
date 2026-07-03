# Workflow: Ejecucion del arreglo funcional

**Base**: [`plan_fix.md`](plan_fix.md) y [`diagnostico.md`](diagnostico.md).
**Proposito**: definir como ejecutar el arreglo sin mezclar fases, sin perder trazabilidad y sin depender de memoria implicita.

---

## 1. Preparacion de sesion

Antes de editar:

1. Leer:
   ```bash
   sed -n '1,260p' diagnostico.md
   sed -n '1,260p' plan_fix.md
   sed -n '1,260p' target_fix.md
   ```
2. Verificar estado local:
   ```bash
   git status --short
   ```
2b. Preflight de entorno (registrar disponibilidad, sin exponer secretos):
   ```bash
   # Convex
   printenv NEXT_PUBLIC_CONVEX_URL CONVEX_DEPLOYMENT >/dev/null 2>&1 && echo "convex env: ok" || echo "convex env: falta"
   # Auth E2E
   test -f .auth/workos.json && echo ".auth/workos.json: existe" || echo ".auth/workos.json: ausente"
   printenv AUTH_TEST_EMAIL >/dev/null 2>&1 && echo "AUTH_TEST_*: presentes" || echo "AUTH_TEST_*: ausentes"
   ```
   Con este preflight se decide el gate de cierre (ver seccion 8).
3. No tocar cambios ajenos. Si hay archivos modificados no relacionados, dejarlos intactos.
4. Usar `pnpm` para scripts, installs y herramientas del proyecto.
5. Si la fase toca `convex/`, leer completas las guias Convex generadas:
   ```bash
   sed -n '1,260p' convex/_generated/ai/guidelines.md
   sed -n '261,520p' convex/_generated/ai/guidelines.md
   ```

---

## 2. Rama y ritmo de trabajo

Rama recomendada:

```bash
git checkout -b fix/app-functional-e2e-convex
```

Cada fase usa el ciclo **EAVC**:

| Paso | Significado | Accion |
|---|---|---|
| E | Explorar | Leer archivos afectados y confirmar fallos actuales. |
| A | Aplicar | Hacer cambios pequenos y directamente ligados a la fase. |
| V | Verificar | Ejecutar los comandos de la fase. No avanzar en rojo. |
| C | Cerrar | Registrar resultado, diff y pendientes antes de pasar a la siguiente fase. |

---

## 3. Workflow por fase

### Fase 0: Baseline

1. Ejecutar:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   pnpm test:e2e:start
   ```
2. Registrar:
   - specs fallidas;
   - rutas fallidas;
   - si Convex esta offline;
   - si falta `.auth/workos.json` o credenciales E2E.
3. No arreglar todavia durante esta fase.

### Fase 1: Pruebas E2E

Estado previo: Fase 0.5 cerrada documentalmente el 2026-06-30 21:27 -05. Empezar aqui salvo que se reabra explicitamente el preflight.
Estado actual: cerrada el 2026-06-30 22:11 -05. Detalle en `fase1.md`.

1. Editar solo `tests/e2e/*` y `playwright.config.ts` si hace falta separar screenshots.
2. Reproducir cada spec fallida de forma aislada:
   ```bash
   pnpm test:e2e:start tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium
   pnpm test:e2e:start tests/e2e/sgc-fase2.auth.spec.ts --project=authenticated-chromium
   ```
3. Cuando los casos aislados pasen, correr:
   ```bash
   pnpm test:e2e:start
   ```
4. Si no hay auth disponible, validar al menos la suite publica y dejar el bloqueo escrito:
   ```bash
   pnpm test:e2e:start --project=chromium
   ```

### Fase 2: UX offline y estados vacios

Estado actual: cerrada el 2026-07-01 00:14 -05. Detalle en `fase2.md`; F13-F15 resueltos y Target 3 cerrado para el alcance de la fase.

1. Editar rutas y componentes de UI.
2. Mantener lecturas con fallback; las mutaciones deben fallar de forma visible si Convex esta offline.
3. Probar rutas con Convex offline de forma **deterministica** (no esperar a que el backend caiga solo):
   ```bash
   NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9 pnpm dev
   ```
   Abrir manualmente y confirmar banner + estado vacio (sin error boundary global):
   - `/dashboard`
   - `/dashboard/sgc`
   - `/dashboard/sgc/documentos`
   - `/dashboard/sgc/mapa`
   - `/mi-dashboard`
   - `/ronda/<codigo-cualquiera>` y `/dashboard/rondas/<id-inexistente>/sgc` (verificar que offline != recurso inexistente)
4. Verificar:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   pnpm test:e2e:start
   ```

### Fase 3: Convex seguro

1. Leer guias Convex antes de editar.
2. Cambiar una familia de funciones a la vez:
   - `rondas`;
   - `fichas`;
   - `pt`;
   - `migrations`.
3. Despues de cada familia:
   ```bash
   pnpm exec convex codegen
   pnpm build
   pnpm test
   ```
4. Para cambios de acceso, agregar o ajustar tests unitarios cuando haya helpers puros. Para funciones Convex, preferir `convex-test` si se introduce cobertura directa. DoD minimo: una prueba que confirme que una llamada sin identidad a `rondas`/`fichas`/`pt` protegida falla controladamente.
5. Al pasar migraciones/utilidades a `internalMutation`, confirmar que no hay consumidores cliente y que el seed sigue verde:
   ```bash
   rg "api\\.migrations" src
   pnpm sgc:import-seeds   # usa `convex run`, sigue funcionando con funciones internas
   ```
   Los caminos de utilidad que exijan identidad se invocan con `convex run <fn> --identity '<json>'`, nunca pasando `userId` como argumento de autorizacion.

### Fase 4: Infraestructura

1. Mover dependencias con pnpm:
   ```bash
   pnpm add zod @t3-oss/env-nextjs
   ```
2. Revisar que no aparezca `package-lock.json`.
3. Actualizar `.gitignore` solo si se decide excluir logs generados.
4. Agregar CI minimo si se decide cerrar la puerta automatizada:
   - incluir `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` y `pnpm build`;
   - no incluir E2E autenticado hasta tener auth/seeds reproducibles;
   - usar variables dummy validas para `src/env.ts` si el build valida entorno.
5. Verificar:
   ```bash
   pnpm install --frozen-lockfile
   pnpm lint
   pnpm test
   pnpm build
   ```

Estado actual (2026-07-01 21:05 -05): Fase 4 cerrada. `.github/workflows/ci.yml` ejecuta el CI minimo sin E2E autenticado; las puertas locales de Fase 4 pasaron tras agregarlo.

### Fase 5: Cierre

1. Correr verificacion completa:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   pnpm exec convex codegen
   pnpm test:e2e:start
   ```
2. Con backend local y datos:
   ```bash
   pnpm exec convex dev
   pnpm sgc:import-seeds
   pnpm test:e2e:start --project=authenticated-chromium
   ```
3. Actualizar `diagnostico.md` o crear un cierre con:
   - comandos ejecutados;
   - resultado;
   - suites omitidas y razon;
   - riesgos residuales.

---

## 4. Separacion de suites Playwright

La suite funcional principal debe responder a "la app carga y los flujos principales no rompen".

Categorias recomendadas:

| Categoria | Incluye | Debe correr en `pnpm test:e2e:start` |
|---|---|---|
| Public smoke | `/`, `/login`, redirects basicos | Si |
| Auth smoke | dashboard y SGC sin depender de datos exactos | Si, si hay auth |
| Data-backed | expediente de una ronda real, documentos seed | Solo con seeds |
| Screenshots | `docs/screenshots/**` | No |

Si se crea comando dedicado:

```json
{
  "scripts": {
    "test:e2e:screenshots": "PLAYWRIGHT_START_SERVER=1 playwright test --grep @screenshots",
    "test:e2e:offline": "NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9 PLAYWRIGHT_START_SERVER=1 playwright test --project=chromium --grep @offline"
  }
}
```

Las specs de screenshots deben marcarse con tag `@screenshots` o moverse a un proyecto Playwright separado. Un smoke `@offline` (con URL de Convex inalcanzable) hace verificable la resiliencia offline de Targets 2 y 3 en vez de dejarla al azar.

### Gate de cierre segun disponibilidad de auth

- Auth disponible (`.auth/workos.json` o `AUTH_TEST_*`): el cierre exige suite autenticada verde.
- Auth ausente: el cierre exige smoke publico verde (`--project=chromium`) y el bloqueo de la suite autenticada queda documentado como omision por credenciales, no como fallo de producto.

---

## 5. Politica de commits

Un commit por fase:

```text
fix(e2e): desacoplar SGC de datos hardcodeados
fix(sgc): fallback offline y estados vacios consistentes
fix(convex): validar identidad y ocultar migraciones internas
fix(deps): mover dependencias runtime y sanear logs
test(e2e): separar screenshots de la suite funcional
```

No commitear si falla una verificacion obligatoria de la fase.

---

## 6. Reglas de rollback

Si una fase queda en rojo y no hay avance claro:

1. Revisar diff:
   ```bash
   git diff --stat
   git diff
   ```
2. Revertir solo los archivos de la fase con un patch manual o commit de revert.
3. No usar `git reset --hard` salvo instruccion explicita del responsable del repo.

---

## 7. Checklist de cierre

- [x] `pnpm lint` verde.
- [x] `pnpm test` verde.
- [x] `pnpm build` verde.
- [x] `pnpm exec convex codegen` verde si se toco Convex.
- [x] `pnpm test:e2e:start` verde o con omisiones intencionales documentadas.
- [x] Gate de auth aplicado segun disponibilidad (autenticado verde con backend local + seeds; CI documentado sin auth reproducible).
- [x] Screenshots fuera de la suite funcional principal.
- [x] Rutas SGC con estado vacio/offline controlado, verificado con URL de Convex inalcanzable (no por accidente).
- [x] Convex no expone migraciones destructivas publicas; seed sigue verde por `convex run`.
- [x] Prueba de "sin identidad falla" presente para `rondas`/`fichas`/`pt`.
- [x] Dependencias runtime en `dependencies`.
- [x] Artefactos ya trackeados que se decidio ignorar, desindexados con `git rm --cached`.

Estado (2026-07-01): checklist cerrado para el alcance funcional. Quedan fuera del gate de cierre las deudas documentadas F34 (auditoria de rendimiento futura) y F35 (decision/commit de screenshots y docs versionables).
