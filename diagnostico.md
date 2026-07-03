# Diagnóstico de funcionalidad (Actualizado)

Fecha: 2026-06-30

> **Estado: RESUELTO (cierre de verificación 2026-07-01).** El diagnóstico original se conserva abajo como referencia histórica. El plan de arreglo se ejecutó en las Fases 0-5 de [`plan_fix.md`](plan_fix.md); el detalle medible por criterio está en [`target_fix.md`](target_fix.md) y la revisión de código por fase en [`review_fix.md`](review_fix.md).

---

## Cierre de verificación (2026-07-01)

### Comandos ejecutados y resultado

Suite estándar (Convex local apagado — modo degradado):

- `pnpm lint`: verde.
- `pnpm test`: verde (4 archivos / 9 tests, incluye `convex/access.test.ts`).
- `pnpm build`: verde.
- `pnpm exec convex codegen`: verde.
- `pnpm test:e2e:start`: verde, 6 passed / 3 skipped intencionales (detalle data-backed omitido por ausencia de datos, no por fallo de producto).

Suite data-backed (Convex local activo + seeds):

- `pnpm sgc:import-seeds`: verde (51 documentos, 1.047 requisitos, 82 relaciones de mapa).
- `pnpm test:e2e:start --project=authenticated-chromium`: verde, 8 passed.

Offline determinístico:

- `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:9`: rutas SGC/rondas/participante muestran `BackendOfflineBanner` + estado vacío, sin caer al error boundary global.

### Cómo se resolvieron los hallazgos originales

- **E2E acoplado a datos:** IDs de ronda hardcodeados y `toHaveCount(12)` eliminados; las specs descubren una ronda real desde la UI o hacen `test.skip`. Screenshots separados en `pnpm test:e2e:screenshots`. (Fase 1 / Target 1)
- **Frontend offline y estados vacíos:** `safeConvexCallWithStatus` → `{ data, offline }` cablea el banner real; `/sgc` y `/dashboard/sgc` unificados; subrutas, rondas y vistas de participante distinguen offline vs recurso inexistente (`notFound()`); `loading.tsx` agregados. (Fase 2 / Targets 2-3)
- **Seguridad Convex:** guards de identidad/rol en `rondas`/`fichas`/`pt` (`convex/access.ts`), token WorkOS reenviado desde el cliente de servidor, migraciones a `internalMutation` (incl. `wipeAll`), y `convex/access.test.ts` cubre rechazo sin identidad + camino autenticado + rechazo cross-tenant. (Fase 3 / Targets 4-5)
- **Infraestructura:** `zod` y `@t3-oss/env-nextjs` movidos a `dependencies`; `logs/history/` y `logs/plans/` gitignorados y desindexados; CI mínimo en `.github/workflows/ci.yml`. (Fase 4 / Targets 7-8)

### Suites omitidas y razón

- 3 casos data-backed en la suite estándar se omiten (`test.skip`) cuando Convex local está apagado; con seeds pasan (8 passed en `authenticated-chromium`).
- E2E autenticado no corre en CI: WorkOS real y seeds no son reproducibles en el pipeline (decisión documentada, gate degradado a smoke público).

### Riesgos residuales (deuda documentada, no bloqueante)

- **Target 6 (rendimiento):** 215 `.collect()` heredados en `convex/` sin acotar/indexar; cerrado por deuda documentada, pendiente auditoría de rendimiento. (F34)
- **Validación manual contra Convex online real** del reenvío de token en `rondas`/`fichas`/`pt` (F19): verificado en E2E autenticado con backend local; queda la validación contra un deployment online real.
- **Procedimiento de commit (F35):** `docs/screenshots/fase-3/*` sin decidir revert/commit y fases sin commitear al momento del cierre.

---

## Resultado de verificación (diagnóstico original — 2026-06-30)

Comandos ejecutados:

- `pnpm lint`: paso.
- `pnpm test`: paso.
- `pnpm build`: paso.
- `pnpm test:e2e:start`: falló.

El build de producción compila, TypeScript pasa y las pruebas unitarias pasan. La app no puede considerarse completamente funcional de punta a punta porque las pruebas E2E autenticadas fallan en rutas SGC.

---

## Síntomas observados

Durante `pnpm test:e2e:start`, Playwright ejecutó las pruebas autenticadas del proyecto `authenticated` y fallaron en múltiples rutas SGC y de rondas.

Las fallas se concentran en:

- `/dashboard/sgc`
- `/dashboard/sgc/documentos`
- `/dashboard/sgc/mapa`
- `/dashboard/sgc/expedientes`
- `/dashboard/rondas/<id>/sgc`

El servidor reportó repetidamente:

```text
[convex] backend offline, usando fallback para ...
```

Con Convex offline, los fallables actuales devuelven colecciones vacías para varias consultas SGC y de rondas.

---

## Diagnóstico Completo y Hallazgos Adicionales

El análisis profundo del proyecto revela que el problema no es solamente código roto o datos faltantes, sino una combinación de acoplamiento en pruebas, inconsistencias arquitectónicas y brechas de configuración e infraestructura:

### 1. Pruebas E2E (Playwright) y su Acoplamiento de Datos
- **IDs de Ronda Hardcodeados:** Las pruebas en `sgc-fase2.auth.spec.ts` y `sgc-fase2-screenshots.auth.spec.ts` utilizan IDs de ronda estáticos (`kd77ck9jqbeafg5g61c7cw0vrh8756qr` y `kd7b0emdk7cmzp1vn34f2bfv7986bb77`). Si la base de datos de Convex está vacía, no contiene exactamente esos IDs, o está desconectada, las rutas devuelven 404 (o su equivalente visual) y los tests fallan.
- **Aserciones Rígidas de Conteos:** `sgc-fase2.auth.spec.ts` busca exactamente 12 ítems de expedientes (`toHaveCount(12)`), lo que hace que cualquier variación en los datos iniciales rompa la prueba.
- **Selectores de Texto Frágiles:** Pruebas como `sgc-cobertura.auth.spec.ts` usan nombres de accesibilidad exactos (`name: 'Centro documental', exact: true`) que no coinciden con la UI actual (la cual concatena el título y la descripción del elemento).
- **Expectativas de Redirección Desactualizadas:** El test espera que `/dashboard/sgc/expedientes` y `/dashboard/rondas/expedientes` muestren un heading `"Expedientes de ronda"`, pero la aplicación redirige de forma dura a `/dashboard?tab=rondas`.
- **Mezcla de Pruebas Funcionales y Captura de Pantallas:** Las specs que generan capturas de pantalla para documentación (`docs/screenshots/fase-3/*`) se ejecutan como pruebas normales de Playwright. Si fallan por falta de datos, bloquean la verificación funcional.
- **Baja Cobertura de Rutas:** Se prueban aproximadamente 11 rutas de más de 30 existentes. Los flujos de participante (`/ronda/[codigo]`, `/mi-dashboard`) y la administración de usuarios o creación de rondas carecen de pruebas E2E.
- **Dependencia de Credenciales Externas:** El flujo de autenticación de Playwright (`auth.setup.ts`) utiliza WorkOS real con variables de entorno (`AUTH_TEST_EMAIL` y `AUTH_TEST_PASSWORD`). No hay mocks locales del proveedor de identidad.

### 2. Backend (Convex) - Seguridad y Rendimiento
- **Falta de Validación de Autenticación en Rondas, Fichas y PT:** El dominio SGC implementa correctamente control de acceso mediante `requireSgcAdmin()` y `requireSgcViewer()`. Sin embargo, las funciones de los dominios `rondas/`, `fichas/` y `pt/` **no realizan ninguna validación de identidad en el backend**. Confían exclusivamente en que el middleware de Next.js (`src/proxy.ts`) filtre los accesos, lo cual expone la base de datos si la URL de Convex es descubierta.
- **Mutaciones de Migración Públicas:** El archivo `convex/migrations.ts` expone mutaciones como `wipeAll` y cargas de datos como públicas de Convex (`mutation`) en lugar de declararlas como `internalMutation`, lo que representa un riesgo de seguridad alto.
- **Consultas con Carga Ineficiente:** Múltiples funciones realizan un `.collect()` de tablas completas para luego filtrar en memoria JS (por ejemplo, `listAllParticipantes` o búsquedas de templates de fichas), lo cual no es escalable.
- **Falta de Paginación:** Excepto en `listNormativaSgc`, todos los listados de auditoría, documentos maestros y rondas devuelven colecciones ilimitadas en una sola consulta.

### 3. Frontend y Arquitectura de Rutas
- **Inconsistencia en el Manejo de Convex Offline:** `/dashboard/sgc/page.tsx` no maneja de forma segura las caídas de Convex en su nivel de página, delegando el error directamente al Error Boundary global. En cambio, la ruta paralela `/sgc/page.tsx` sí utiliza un bloque try-catch con `BackendOfflineBanner`.
- **Duplicidad de Rutas de SGC:** Coexisten `/dashboard/sgc/*` y `/sgc/*`. La mayoría de páginas de `/sgc/*` re-exportan el componente de dashboard, pero la del mapa `/sgc/mapa/page.tsx` es una copia literal del código, incrementando el esfuerzo de mantenimiento.
- **Ausencia de `loading.tsx`:** Ninguna ruta cuenta con archivos `loading.tsx` para streaming o skeletons. Todas las transiciones de página de Next.js bloquean el hilo hasta que las llamadas del servidor Convex finalizan.
- **Sin Soporte Offline en Vistas de Participante:** Las rutas `/ronda/[codigo]` y `/mi-dashboard` no capturan de forma amigable los fallos de conexión de Convex y rompen la experiencia de usuario final mostrando pantallas de error genéricas.

### 4. Infraestructura y Configuración
- **Dependencias en DevDependencies Necesarias en Runtime:** `zod` y `@t3-oss/env-nextjs` están definidos bajo `devDependencies` en `package.json`, pero son importados activamente en código que corre en producción (`src/env.ts`, etc.).
- **Inexistencia de Pipeline de CI/CD:** No hay flujos de GitHub Actions ni verificaciones automáticas de PR. El despliegue a Vercel es manual a través del script `release.mjs`.
- **Bloat de Logs en el Repositorio:** El directorio `logs/` contiene más de 148 archivos Markdown de depuración personal y bitácoras que no están gitignoradas y se suben al repositorio.

---

## Decisión recomendada

1. **Robustecer el Comportamiento Frente a Datos Vacíos u Offline:**
   - La aplicación debe ser capaz de renderizar e indicar estados vacíos limpios en todas las pantallas.
   - Rutas dinámicas con IDs inexistentes deben retornar respuestas controladas (UI de 404 local usando `notFound()`).
   - Las pruebas E2E no deben presuponer IDs fijos en Convex; deben descubrir el primer link disponible desde la UI o saltarse aserciones específicas si el entorno está vacío.

2. **Segregar Pruebas E2E:**
   - Distinguir entre pruebas `smoke` (que verifican carga de layouts e infraestructura sin datos o incluso offline) y pruebas de flujo (`data-backed`) que requieran seeds de base de datos.
   - Aislar la ejecución de capturas de pantalla para documentación en una suite separada que no bloquee las pruebas de integración estándar.

3. **Resolver Brechas de Seguridad en Convex:**
   - Implementar validaciones de identidad (`ctx.auth.getUserIdentity()`) en todas las funciones públicas de rondas, fichas y PT en Convex.
   - Cambiar a `internalMutation` todas las mutaciones utilitarias y de migración en `convex/migrations.ts`.

---

## Plan de arreglo sugerido

### Fase 1: Corrección de E2E y Selectores
1. **Actualizar Redirecciones y URLs Esperadas:**
   - Modificar las aserciones de expedientes en `sgc-cobertura.auth.spec.ts` y screenshots para que esperen la redirección real hacia `/dashboard?tab=rondas`.
2. **Saneamiento de Selectores Frágiles:**
   - Cambiar búsquedas de enlaces como `'Centro documental'` por expresiones regulares flexibles (`/Centro documental/i`).
3. **Remover Dependencia de IDs de Ronda Hardcodeados:**
   - En las pruebas de SGC de rondas, implementar una lógica que busque primero un enlace de ronda dinámico en el dashboard. Si no hay rondas, omitir de forma segura las verificaciones detalladas en lugar de fallar la suite completa.
4. **Controlar Estados Vacíos:**
   - Permitir que las aserciones de tablas de documentos validen el mensaje "No hay documentos para los filtros seleccionados" cuando la colección esté vacía.

### Fase 2: Robustez de la Aplicación y Frontend
1. **Implementar Manejo de Errores e Inconsistencias:**
   - Agregar captura de errores offline en `/dashboard/sgc/page.tsx` para evitar que rompa toda la sección.
   - Investigar la unificación de los árboles de rutas `/sgc` y `/dashboard/sgc`.
2. **Skeletons y Estados de Carga:**
   - Crear archivos `loading.tsx` básicos para las rutas principales para mejorar el UX durante transiciones de red.

### Fase 3: Seguridad de Backend (Convex)
1. **Validaciones en Funciones de Convex:**
   - Agregar control de acceso basado en identidad en los endpoints de `convex/rondas/`, `convex/fichas/` y `convex/pt/`.
2. **Protección de Migraciones:**
   - Modificar `convex/migrations.ts` para usar funciones internas (`internalMutation`) en lugar de mutaciones públicas expuestas a la API del cliente.

### Fase 4: Ajustes de Infraestructura y Configuración
1. **Corrección de Dependencias:**
   - Mover `zod` y `@t3-oss/env-nextjs` a `dependencies` en `package.json`.
2. **Saneamiento de Repositorio:**
   - Considerar añadir `logs/history/` y archivos de bitácora intermedios a `.gitignore` para evitar el crecimiento del repositorio.

---

## Verificación esperada después del arreglo

Ejecutar:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e:start
```

Resultados esperados:
- Las pruebas smoke de Playwright pasan sin importar el estado de Convex.
- La aplicación responde de forma controlada y segura ante un Convex offline o sin datos.
- Las mutaciones de Convex no quedan expuestas de manera pública sin autenticación.
