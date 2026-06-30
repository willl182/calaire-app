# Targets: Objetivos medibles por fase de la migración T3

**Propósito**: definir qué significa "terminado" para cada fase, con criterios de entrada, salida y verificación concretos.

**Base**: [`PLAN_MIGRACION_T3.md`](PLAN_MIGRACION_T3.md).

---

## Fase 0: Preparación

### Goal
Crear un entorno seguro para ejecutar la migración sin perder el estado actual.

### Entry criteria
- Rama `main` actualizada y estable.
- `pnpm build` y `pnpm lint` verdes en `main`.

### Targets / Success criteria
- [x] Rama `feature/t3-estructura-segura` creada desde `main`. (commit base `ca5d0b9`)
- [x] Dependencias instaladas: `@t3-oss/env-nextjs@0.13.11`, `zod@4.4.3`, `vitest@4.1.9`. (commit `33fc424`)
- [x] Carpetas vacías creadas: `src/{app,components,server,lib}`, `src/server/{auth,rondas,sgc,mailer,agent-router,jobs}`, `convex/{_lib,agent,fichas,pt,rondas,sgc}`.
  - **Corrección**: se agregaron `.gitkeep` en `src/server/`, sus subcarpetas, `convex/_lib/`, `convex/fichas/` y `convex/pt/` para persistir directorios vacíos en git.
- [x] Tres inventarios generados en `logs/plans/`:
  - `imports-antes.txt` (192 líneas).
  - `imports-relativos.txt` (228 líneas).
  - `convex-api-uso-antes.txt` (120 líneas).
- [x] `pnpm build` sigue verde (no se tocó código aún). (documentado en `logs/history/260629_1851_findings.md`; no re-corrido en auditoría porque el árbol está sucio con trabajo de Fase 2/3 sin commitear).

### Exit criteria
Poder empezar Fase 1 sabiendo exactamente qué imports y referencias Convex existen antes del cambio.

### Verificación
```bash
pnpm build
ls logs/plans/imports-antes.txt logs/plans/imports-relativos.txt logs/plans/convex-api-uso-antes.txt
```

### Auditoría (2026-06-29)
- **Commit**: `33fc424` "t3(fase0): andamiaje, deps e inventarios de seguridad".
- **Conforme**: 0.1 (rama), 0.2 (deps), 0.4 (inventarios), 0.5 (scripts test/test:watch).
- **Gaps corregidos**: 0.3 carpetas vacías persistidas con `.gitkeep`; `logs/CURRENT_SESSION.md` ya marca Fase 0 como completada.
- **Corrección de plan**: `PLAN_MIGRACION_T3.md` decía `convex-api-uso.txt`, pero el commit y los targets usan `convex-api-uso-antes.txt`. El plan raíz fue corregido para que coincida con el archivo real.
- **Sospechoso**: `src/convex/` aparece como untracked en `git status`. El plan deja `convex/` en raíz, no en `src/`. Investigar antes de Fase 2.

---

## Fase 1: Andamiaje mínimo

### Goal
Crear los archivos base de configuración sin afectar el código existente.

### Entry criteria
Fase 0 completada.

### Targets / Success criteria
- [ ] `src/env.js` creado con `@t3-oss/env-nextjs` validando:
  - `NEXT_PUBLIC_CONVEX_URL`
  - `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_SECRET`
  - `RESEND_API_KEY`
  - `AUTHKIT_SECRET` (si aplica)
  - `NEXT_PUBLIC_APP_URL`
- [ ] `src/env.d.ts` creado con `declare module "@/env"`.
- [ ] `src/lib/utils.ts` creado con `cn()` y helpers puros.
- [ ] Scripts de test agregados a `package.json`:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
- [ ] `vitest.config.ts` creado si es necesario.

### Exit criteria
El andamiaje existe pero el código aún no lo usa. Build verde.

### Verificación
```bash
pnpm build
pnpm lint
pnpm test        # debe correr y pasar (posiblemente 0 tests)
```

---

## Fase 2: `app/` → `src/app/`

### Goal
Mover el App Router a `src/app/` manteniendo todos los imports funcionales.

### Entry criteria
Fase 1 completada. Inventarios de Fase 0 disponibles.

### Targets / Success criteria
- [ ] `app/components/` movido a `src/components/`.
- [ ] `app/` copiado a `src/app/` (`cp -a`).
- [ ] Imports dentro de `src/app/` corregidos:
  - `@/app/components/LogoUnal` → `@/components/LogoUnal`
  - `@/app/components/Footer` → `@/components/Footer`
  - `@/app/...` → `@/...`
- [ ] Puentes temporales `src/lib/*.ts` creados si `lib/` aún no migró.
- [ ] Alias `@/*` cambiado a `./src/*` en `tsconfig.json`.
- [ ] Carpeta `app/` eliminada de raíz.
- [ ] `rg "@/app/" src/` devuelve 0 resultados.
- [ ] `rg "@/lib/" src/app/` devuelve 0 resultados (salvo puentes temporales).

### Exit criteria
Next.js sirve la aplicación desde `src/app/`. Login, dashboard y rutas protegidas funcionan.

### Verificación
```bash
pnpm build
pnpm lint
pnpm test:e2e
```

---

## Fase 3: `lib/` → `src/server/`

### Goal
Reorganizar la lógica de servidor por dominios bajo `src/server/`.

### Entry criteria
Fase 2 completada y verificada.

### Targets / Success criteria
- [ ] `lib/auth.ts` → `src/server/auth/index.ts`.
- [ ] `lib/workos.ts` → `src/server/auth/workos.ts`.
- [ ] `lib/agent-auth.ts` → `src/server/auth/agent-auth.ts`.
- [ ] `lib/operativo.ts` → `src/server/rondas/service.ts`.
- [ ] `lib/rondas.ts` → `src/server/rondas/operaciones.ts`.
- [ ] Archivos de `lib/rondas/` → `src/server/rondas/`.
- [ ] `lib/sgc.ts` → `src/server/sgc/operaciones.ts`.
- [ ] Archivos de `lib/sgc/` → `src/server/sgc/`.
- [ ] `lib/mailer.ts` → `src/server/mailer/index.ts`.
- [ ] `lib/agent-router.ts` → `src/server/agent-router/index.ts`.
- [ ] `lib/app-url.ts` y `lib/safe-url.ts` → `src/lib/`.
- [ ] `lib/referencia-csv.ts` + test → `src/server/rondas/`.
- [ ] Todos los imports `@/lib/...` actualizados a `@/server/...` o `@/lib/...` según corresponda.
- [ ] Puentes temporales de Fase 2 eliminados.
- [ ] Carpeta `lib/` vacía eliminada.

### Exit criteria
Toda la lógica de dominio vive en `src/server/<modulo>/`. No quedan imports rotos.

### Verificación
```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

---

## Fase 4: `proxy.ts` → `src/proxy.ts`

### Goal
Ubicar el proxy de WorkOS AuthKit en la ruta estándar de Next.js dentro de `src`.

### Entry criteria
Fase 3 completada.

### Targets / Success criteria
- [x] `proxy.ts` movido a `src/proxy.ts`.
- [x] Configuración `matcher` preservada idéntica.
- [x] Rutas `/login`, `/dashboard`, `/denied` y `/agent/*` comportándose igual.

### Exit criteria
El proxy sigue protegiendo rutas y excluyendo rutas de agente y estáticos.

### Verificación
```bash
pnpm build
pnpm lint
# Manual: levantar dev y probar /login, /dashboard, /denied, /agent/me
```

---

## Fase 5: `convex/` por dominios

### Goal
Reorganizar las funciones Convex en carpetas por dominio aceptando el cambio breaking de paths públicos generado por `index.ts`.

### Entry criteria
Fase 4 completada. Inventario `convex-api-uso-antes.txt` disponible.

### Targets / Success criteria
- [x] `convex/rondas.ts` fusionado en `convex/rondas/index.ts`.
- [x] `convex/sgc.ts` fusionado en `convex/sgc/index.ts`.
- [x] `convex/agent.ts` fusionado en `convex/agent/index.ts`.
- [x] `convex/agentAuth.ts` movido a `convex/agent/auth.ts`.
- [x] `convex/fichas.ts` movido a `convex/fichas/index.ts`.
- [x] `convex/pt.ts` movido a `convex/pt/index.ts`.
- [x] Imports relativos dentro de los `index.ts` corregidos (`./rondas/reads` → `./reads`).
- [x] Todos los usos de `api.agentAuth.*` reemplazados por `api.agent.auth.*`.
- [x] Todos los usos internos de `api.rondas.*`, `api.sgc.*`, `api.fichas.*` y `api.pt.*` reemplazados por `api.rondas.index.*`, `api.sgc.index.*`, `api.fichas.index.*` y `api.pt.index.*`.
- [x] Helpers comunes movidos a `convex/_lib/` (si aplica).
- [x] `convex/_generated/` regenerado con `pnpm exec convex codegen`.
- [x] Inventario `convex-api-uso-despues.txt` generado como lista API-only con regex profundo: `api\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+`.
- [x] `diff convex-api-uso-antes.txt convex-api-uso-despues.txt` explicado por los cambios breaking aceptados a `.index` / `agent.auth`.
- [x] `rg -P "api\.(rondas|sgc|fichas|pt)\.(?!index\b)[A-Za-z0-9_]+\b|api\.agentAuth\." src/ scripts/ tests/ -g "*.ts" -g "*.tsx"` no encuentra consumidores antiguos.

### Exit criteria
Todas las funciones Convex usadas por la app apuntan a los nuevos paths `api.<dominio>.index.<funcion>` o `api.agent.auth.<funcion>`. Build y codegen verdes.

### Verificación
```bash
pnpm exec convex codegen
pnpm build
pnpm lint
pnpm test:e2e
```

### Estado de verificación (2026-06-30)
- `pnpm exec convex codegen`: verde.
- `pnpm build`: verde.
- `pnpm lint`: verde.
- `pnpm test`: verde.
- `pnpm test:e2e`: bloqueado por un problema previo de `config.webServer`; Next intenta resolver `tailwindcss` desde `/home/w182/w421`.

---

## Fase 6: `process.env.X!` → `env.X`

### Goal
Centralizar y validar todas las variables de entorno en `src/env.js`.

### Entry criteria
Fase 5 completada.

### Targets / Success criteria
- [ ] Todos los `process.env.X!` del repo identificados.
- [ ] Variables server importadas desde `@/env`.
- [ ] Variables cliente usadas como `env.NEXT_PUBLIC_*`.
- [ ] Ningún `process.env.X!` queda en código fuente.

### Exit criteria
Un único punto de verdad para variables de entorno. Runtime falla temprano si falta algo.

### Verificación
```bash
rg "process\.env\." src/ --type ts --type tsx
# debe devolver solo usos en src/env.js o cero resultados
pnpm build
pnpm test:e2e
```

---

## Fase 7: `src/components/ui/`

### Goal
Extraer primitivos UI reutilizables a `src/components/ui/`.

### Entry criteria
Fase 6 completada.

### Targets / Success criteria
- [ ] Primitivos usados desde 2+ dominios identificados.
- [ ] Cada primitivo movido a `src/components/ui/<Nombre>.tsx`.
- [ ] Imports actualizados en todos los consumidores.
- [ ] Ningún componente en `src/components/ui/` importa Convex ni auth.

### Exit criteria
Los componentes UI compartidos son puros y reutilizables por props.

### Verificación
```bash
pnpm build
pnpm lint
pnpm test:e2e
```

---

## Fase 8: Limpieza final y documentación

### Goal
Eliminar toda huella del layout anterior y documentar las nuevas convenciones.

### Entry criteria
Fases 0-7 completadas.

### Targets / Success criteria
- [ ] `app/` no existe en raíz.
- [ ] `lib/` no existe en raíz.
- [ ] `proxy.ts` no existe en raíz.
- [ ] `README.md` actualizado con la nueva estructura.
- [ ] `AGENTS.md` actualizado con reglas de paths, capas y convenciones.
- [ ] `logs/CURRENT_SESSION.md` actualizado con el cierre de la migración.
- [ ] Copia del plan guardada en `logs/plans/260629_1755_plan_migracion_estructura_t3.md`.

### Exit criteria
El repo parece creado con estructura T3 desde el inicio. Documentación al día.

### Verificación
```bash
pnpm build
pnpm lint
pnpm test
pnpm exec convex codegen
pnpm test:e2e
ls app/ lib/ proxy.ts 2>/dev/null || echo "OK: layout anterior limpio"
```

---

## Resumen de targets por fase

| Fase | Goal principal | Verificación obligatoria | Verificación extra |
|---|---|---|---|
| 0 | Preparar entorno seguro | `pnpm build` | Inventarios generados |
| 1 | Andamiaje mínimo | `pnpm build`, `pnpm lint`, `pnpm test` | `src/env.js` válido |
| 2 | Mover App Router a `src/app/` | `pnpm build`, `pnpm lint`, `pnpm test:e2e` | `rg "@/app/" src/` vacío |
| 3 | Reorganizar dominios en `src/server/` | `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` | `lib/` eliminado |
| 4 | Middleware estándar | `pnpm build`, `pnpm lint` | Login + dashboard + agente manual |
| 5 | Convex por dominios | `pnpm exec convex codegen`, `pnpm build`, `pnpm test:e2e` | `diff` de `api.X.Y` vacío |
| 6 | Variables de entorno centralizadas | `pnpm build`, `pnpm test:e2e` | `rg "process\.env\." src/` vacío |
| 7 | UI primitivos compartidos | `pnpm build`, `pnpm lint`, `pnpm test:e2e` | Sin imports de Convex/auth en `src/components/ui/` |
| 8 | Limpieza y docs | Todo lo anterior + verificación de archivos borrados | `README.md` y `AGENTS.md` actualizados |
