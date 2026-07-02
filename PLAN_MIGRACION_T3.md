# Plan: Migración a estructura T3 (variantes de adaptación)

**Fecha**: 2026-06-29
**Objetivo**: Reorganizar el repo `calaire-app` siguiendo el reglamento de carpetas T3, sin cambiar stack (Convex + Next 16 + WorkOS + Tailwind v4), sin introducir tRPC.

**Resultado esperado**: código app/ en `src/app/`, lógica de dominio en `src/server/<modulo>/`, utils en `src/lib/`, UI compartida en `src/components/`, Convex reorganizado por dominios, `src/env.js` con validación Zod. Build verde al final.

---

## Decisiones tomadas (no se negocian en medio del plan)

| # | Punto | Decisión |
|---|------|----------|
| 1 | `proxy.ts` (WorkOS AuthKit Proxy) | Mover a `src/proxy.ts`. Next 16.2.4 depreca la convención `middleware` y documenta `proxy.ts` dentro de `src` al nivel de `app`. No entra en `src/server/`. |
| 2 | `lib/agent-router.ts` + `convex/agent*.ts` | Mudar a `src/server/agent-router/` sin refactor. Gateway HTTP legítimo hacia Convex. No meter en tRPC. |
| 3 | `app/providers.tsx` | Mudar a `src/app/providers.tsx`. Sin tocar lógica `mounted`/`ConvexClient`. Sin tRPC QueryClient. |
| 4 | Server Actions vs tRPC | **NO tRPC.** Server actions en `src/app/<modulo>/actions.ts` para mutaciones; hooks Convex (`useQuery(api.X)`) para lecturas reactivas. Validación con `convex/values`. |
| 5 | Hooks Convex en UI | Importar directo de `convex/_generated/api` desde componentes. Modo idiomático de Convex; no envolver. |
| 6 | `convex/` raíz suelto | Reorganizar por dominios en `convex/<dominio>/`. Helpers compartidos a `convex/_lib/`. NO cambiar nombres de funciones en esta fase. |
| 7 | `data/` + `scripts/` | Raíz, sin mover. |
| 8 | `src/env.js` con Zod | **Sí.** `@t3-oss/env-nextjs` con variables WorkOS/Convex/Resend. |
| 9 | Test sueltos (`*.test.ts`) | Junto al código (`src/server/<modulo>/x.test.ts`). Agregar `vitest` como dep. |
| 10 | `docs/` | Raíz, sin mover. |
| 11 | Alias `@/*` | Único alias `@/* -> ./src/*`. Sin split `@/server` ni `@/trpc`. |
| 12 | Tailwind v4 | Sin `tailwind.config.ts`. CSS-first en `globals.css`. |
| 13 | Cola de jobs | Reservar `src/server/jobs/` (vacía por ahora) para `spawnSync` scripts si proliferan. |
| 14 | Email (`lib/mailer.ts`) | Mudar a `src/server/mailer/`. Seguir usándolo desde server actions. (Posterior migración a Convex `internalAction` se evalúa aparte.) |
| 15 | Capa `repositorio.ts` por dominio | **Sí.** Hoy llama Convex; mañana Drizzle. Aísla componentes de la elección de backend. |

---

## Estructura final propuesta

```
calaire-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── auth/callback/route.ts        # si existe
│   │   ├── (protected)/
│   │   │   ├── layout.tsx
│   │   │   ├── ParticipantTopNav.tsx
│   │   │   ├── dashboard/                   # MódULO RONDAS (tablero general)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── actions.ts
│   │   │   │   ├── data.ts
│   │   │   │   ├── view-model.ts
│   │   │   │   ├── SidebarNav.tsx
│   │   │   │   ├── RondaParticipantesSelector.tsx
│   │   │   │   ├── components/
│   │   │   │   ├── rondas/
│   │   │   │   ├── participantes/
│   │   │   │   ├── registros/
│   │   │   │   └── sgc/                      # SGC anidado operativo (contexto rondas)
│   │   │   ├── sgc/                          # MódULO SGC MAESTRO (independiente)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── documentos/
│   │   │   │   ├── normativa/
│   │   │   │   └── mapa/
│   │   │   ├── ronda/[codigo]/
│   │   │   ├── inicio/
│   │   │   └── mi-dashboard/
│   │   ├── denied/
│   │   ├── agent/                            # rutas HTTP para agent-router
│   │   ├── layout.tsx
│   │   ├── providers.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   └── favicon.ico
│   │
│   ├── components/
│   │   ├── ui/                              # primitivos (Button, Card, Alert...)
│   │   ├── LogoUnal.tsx
│   │   └── Footer.tsx
│   │
│   ├── server/
│   │   ├── auth/
│   │   │   ├── index.ts                     # requireAuth, isAdmin, canViewSgcMaestro
│   │   │   ├── workos.ts
│   │   │   ├── config.ts
│   │   │   └── agent-auth.ts
│   │   ├── rondas/
│   │   │   ├── service.ts                   # antes lib/operativo.ts
│   │   │   ├── tipos.ts                     # Contaminante, Ronda, etc.
│   │   │   ├── repositorio.ts               # llamadas a Convex (instantiation agnóstica)
│   │   │   └── referencia-csv.ts            # antes lib/referencia-csv.ts
│   │   ├── sgc/
│   │   │   ├── service.ts                   # antes lib/sgc.ts lógica
│   │   │   ├── tipos.ts
│   │   │   └── repositorio.ts
│   │   ├── mailer/
│   │   │   └── index.ts                     # antes lib/mailer.ts
│   │   ├── agent-router/
│   │   │   └── index.ts                     # antes lib/agent-router.ts
│   │   └── jobs/                             # reserva, vacía
│   │
│   ├── lib/
│   │   ├── app-url.ts
│   │   ├── safe-url.ts
│   │   └── utils.ts                          # cn(), format helpers... (crear)
│   │
│   ├── env.js                               # Zod - nuevo
│   ├── env.d.ts                             # tipos de env
│   └── proxy.ts                             # antes proxy.ts raíz
│
├── convex/                                  # NO se mueve a src/
│   ├── _generated/
│   ├── _lib/                                # helpers compartidos (nuevo)
│   ├── auth.config.ts
│   ├── schema.ts
│   ├── migrations.ts
│   ├── tsconfig.json
│   ├── agent/                               # antes agent.ts, agentAuth.ts (mismo módulo api.agent.*)
│   │   ├── index.ts
│   │   └── auth.ts
│   ├── fichas/
│   │   └── index.ts                         # antes fichas.ts
│   ├── pt/
│   │   └── index.ts                         # antes pt.ts
│   ├── rondas/
│   │   └── index.ts                         # antes rondas.ts + rondas/
│   └── sgc/
│       └── index.ts                         # antes sgc.ts + sgc/
│
├── data/                                    # seeds / mapas estáticos
├── scripts/                                 # CLI (extract/import seeds)
├── tests/                                   # e2e playwright
├── docs/                                     # req_*.md, cr-rev2.md, featv3.md
├── logs/                                     # sesiones y planes
├── public/
├── next.config.ts
├── tsconfig.json                             # paths: "@/*": ["./src/*"]
├── postcss.config.mjs
├── playwright.config.ts
├── eslint.config.mjs
├── package.json
├── pnpm-lock.yaml
├── .env.example
└── README.md
```

---

## Estrategia de seguridad global

Para reducir el riesgo de las fases 2 y 5 se aplican dos principios:

1. **Copiar antes de borrar**: se mantiene el archivo/carpeta original funcional hasta que el destino esté validado con `pnpm build`.
2. **Puentes de compatibilidad**: archivos temporales que re-exportan el contenido nuevo, para no romper imports a mitad de camino.
3. **Inventario mecánico antes del cambio**: listar todos los `@/...` y todos los `api.X.Y` usados, para comparar antes y después.

### Regla operativa para Playwright

- En este repo `pnpm test:e2e` no levanta `next dev` automáticamente.
- La verificación local con Playwright debe usar `pnpm test:e2e:start` para que `config.webServer` arranque el server.
- `pnpm test:e2e` solo aplica si ya hay un server corriendo en `http://localhost:3000` o si el entorno es CI.
- La suite autenticada (`*.auth.spec.ts`) requiere uno de estos prerrequisitos:
  - `.auth/workos.json` ya generado
  - `E2E_AUTH_EMAIL` y `E2E_AUTH_PASSWORD`
  - `pnpm test:e2e:auth:manual` para regenerar storage state de forma interactiva
- Separar siempre:
  - **smoke público**: `tests/e2e/app.spec.ts`
  - **smoke autenticado**: `tests/e2e/dashboard.auth.spec.ts` y luego SGC

## Fases (cada fase = PR aislado, build verde)

### Fase 0: Preparación
**Objetivo**: crear andamiaje sin tocar nada.

0.1. Crear rama `feature/t3-estructura-segura`.
0.2. `pnpm add -D @t3-oss/env-nextjs zod vitest`.
0.3. Crear carpetas vacías: `src/{app,components,server,lib}`, `src/server/{auth,rondas,sgc,mailer,agent-router,jobs}`, `convex/{_lib,agent,fichas,pt,rondas,sgc}`.
0.4. **Inventarios de seguridad**:
   ```bash
   rg "(from|import)\s+['\"]@/[^'\"]+['\"]" --type ts --type tsx -o > logs/plans/imports-antes.txt
   rg "(from|import)\s+['\"]\.?\.?/[^'\"]+['\"]" --type ts --type tsx -o > logs/plans/imports-relativos.txt
   rg "api\.[a-zA-Z_]+\.[a-zA-Z_]+" src/ lib/ app/ --type ts --type tsx -o | sort | uniq > logs/plans/convex-api-uso-antes.txt
   ```
0.5. `pnpm add` scripts de utilidad en `package.json` (opcional):
   ```json
   "test": "vitest run",
   "test:watch": "vitest"
   ```
0.6. **Verificación**: `pnpm build` debe seguir verde (no cambiamos nada aún).

**Auditoría 2026-06-29**: el commit `33fc424` cumple rama, deps, scripts e inventarios. Las carpetas vacías de 0.3 quedaron persistidas posteriormente con `.gitkeep` porque git no trackea directorios vacíos. También se corrigió el nombre del inventario Convex en este plan: debe ser `convex-api-uso-antes.txt`, igual que el archivo commiteado y los targets.

---

### Fase 1: Andamiaje mínimo (sin tocar código existente)
**Objetivo**: src/ existe pero no se usa todavía. Build sigue funcionando.

1.1. Crear `src/env.js` con `@t3-oss/env-nextjs` validando:
   - `NEXT_PUBLIC_CONVEX_URL` (str, required)
   - `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_SECRET` (str, required)
   - `RESEND_API_KEY` (str, optional o required según uso)
   - `AUTHKIT_SECRET` (si existe)
   - `NEXT_PUBLIC_APP_URL` (str, optional → default localhost:3000)
1.2. Crear `src/env.d.ts` con `declare module "@/env"`.
1.3. **No reemplazar** los `process.env.X!` del código aún (se hace en Fase 3+).
1.4. Crear `src/lib/utils.ts` con `cn()` si no existe (copiar de shadcn/ui).
1.5. **Verificación**: `pnpm build` + `pnpm lint` + `pnpm test` verde.

---

### Fase 2 (segura): Mover `app/` → `src/app/`
**Objetivo**: App Router pasa a `src/` manteniendo imports, sin perder el `app/` original hasta el último momento.

**Regla**: no cambiar el alias `@/*` hasta que `src/app/` esté listo para reemplazar a `app/`.

#### Paso 2.1: Mover componentes compartidos primero
Mover solo `app/components/` → `src/components/` no rompe Next.js porque `app/` sigue existiendo.

```bash
mkdir -p src
git mv app/components src/components
```

Actualizar **solo** los imports de componentes compartidos:

```bash
find app -type f \( -name '*.ts' -o -name '*.tsx' \) -exec sed -i \
  -e 's|@/app/components/LogoUnal|@/components/LogoUnal|g' \
  -e 's|@/app/components/Footer|@/components/Footer|g' \
  {} +
```

**Verificación**: `pnpm build && pnpm lint` verde.

#### Paso 2.2: Copiar (no mover) `app/` a `src/app/`
Copiar permite validar imports sin destruir el original.

```bash
cp -a app src/app
```

Ahora existen:
- `app/` — original, todavía vigente para Next.js.
- `src/app/` — copia, no la ve Next.js todavía.

#### Paso 2.3: Corregir imports dentro de `src/app/`

```bash
find src/app -type f \( -name '*.ts' -o -name '*.tsx' \) -exec sed -i \
  -e 's|@/app/components/LogoUnal|@/components/LogoUnal|g' \
  -e 's|@/app/components/Footer|@/components/Footer|g' \
  -e 's|@/app/|@/|g' \
  {} +
```

La regla `s|@/app/|@/|g` convierte `@/app/(protected)/...` en `@/(protected)/...`, que es correcto con el alias nuevo.

#### Paso 2.4: Puente temporal para `lib/`
Si `lib/` sigue en raíz, crear espejos en `src/lib/` que re-exporten:

```ts
// src/lib/auth.ts
export * from '../../lib/auth'
```

Repetir para cada archivo de `lib/` importado desde `src/app/`. Estos puentes se eliminan en Fase 3.

#### Paso 2.5: Activar `src/app/` cambiando el alias

```bash
git rm -r app
```

Actualizar `tsconfig.json`:

```jsonc
"paths": { "@/*": ["./src/*"] }
```

Next.js detecta `src/app/` automáticamente; no tocar `next.config.ts`.

**Verificación inmediata**:
```bash
pnpm build && pnpm lint && pnpm test:e2e:start tests/e2e/app.spec.ts --project=chromium
```

#### Paso 2.6: Limpieza de puentes
Una vez que Fase 3 mueva `lib/` a `src/server/`, eliminar los `src/lib/*.ts` puente.

#### Checklist Fase 2
- [ ] `rg "@/app/" src/` devuelve 0 resultados.
- [ ] `rg "@/lib/" src/app/` devuelve 0 resultados (salvo puentes temporales).
- [ ] `pnpm build` verde.
- [ ] `pnpm lint` verde.
- [ ] Al menos un smoke test e2e de login + dashboard pasa.

---

### Fase 3: Mover `lib/` → `src/server/` por dominio
**Objetivo**: cada dominio con `service.ts`, `tipos.ts`, `repositorio.ts`.

3.1. `git mv lib/auth.ts src/server/auth/index.ts`
3.2. `git mv lib/workos.ts src/server/auth/workos.ts`
3.3. `git mv lib/agent-auth.ts src/server/auth/agent-auth.ts`
3.4. Crear `src/server/auth/config.ts` con roles/permisos extraídos de `index.ts` si procede.
3.5. `git mv lib/operativo.ts src/server/rondas/service.ts`
3.6. `git mv lib/rondas.ts src/server/rondas/operaciones.ts` (si es distinto de `rondas/` carpeta).
3.7. `git mv lib/rondas/* src/server/rondas/` (archivos individuales a la carpeta).
3.8. Crear `src/server/rondas/tipos.ts` extrayendo tipos de `service.ts`/`rondas.ts`.
3.9. Crear `src/server/rondas/repositorio.ts` envolviendo llamadas Convex (`api.rondas.list`, etc.) — hoy se hace con `ConvexHttpClient` en servidor y hooks en cliente. Conservar ambas.
3.10. `git mv lib/sgc.ts src/server/sgc/operaciones.ts`
3.11. `git mv lib/sgc/* src/server/sgc/` (archivos individuales).
3.12. Crear `src/server/sgc/{service,tipos,repositorio}.ts` igual que rondas.
3.13. `git mv lib/mailer.ts src/server/mailer/index.ts`
3.14. `git mv lib/agent-router.ts src/server/agent-router/index.ts`
3.15. `git mv lib/app-url.ts src/lib/app-url.ts`
3.16. `git mv lib/safe-url.ts src/lib/safe-url.ts`
3.17. `git mv lib/referencia-csv.ts src/server/rondas/referencia-csv.ts`
3.18. `git mv lib/referencia-csv.test.ts src/server/rondas/referencia-csv.test.ts`
3.19. Borrar `lib/` vacío.
3.20. Find/replace en todos los archivos `.ts/.tsx`:
   - `@/lib/auth` → `@/server/auth`
   - `@/lib/workos` → `@/server/auth/workos`
   - `@/lib/agent-auth` → `@/server/auth/agent-auth`
   - `@/lib/operativo` → `@/server/rondas/service`
   - `@/lib/rondas` → `@/server/rondas/operaciones` (cuidado con `@/lib/rondas/<file>` → `@/server/rondas/<file>`)
   - `@/lib/sgc` → `@/server/sgc/operaciones`
   - `@/lib/mailer` → `@/server/mailer`
   - `@/lib/agent-router` → `@/server/agent-router`
   - `@/lib/app-url` → `@/lib/app-url` (sin cambio, ya estaba en lib/)
   - `@/lib/safe-url` → `@/lib/safe-url`
   - `@/lib/referencia-csv` → `@/server/rondas/referencia-csv`
   - `@/app/components/LogoUnal` → `@/components/LogoUnal`
   - `@/app/components/Footer` → `@/components/Footer`
3.21. **Verificación**: `pnpm build && pnpm lint && pnpm test && pnpm test:e2e` verde.
   - Smoke público obligatorio: `pnpm test:e2e:start tests/e2e/app.spec.ts --project=chromium`
   - Smoke autenticado opcional de fase: `pnpm test:e2e:start tests/e2e/dashboard.auth.spec.ts --project=authenticated-chromium`
   - El smoke autenticado solo cuenta si ya existe `.auth/workos.json` o si hay credenciales `E2E_AUTH_EMAIL` / `E2E_AUTH_PASSWORD`.

---

### Fase 4: Mover `proxy.ts` → `src/proxy.ts`
**Objetivo**: proxy de WorkOS AuthKit en ubicación estándar de Next.js dentro de `src`.

4.1. `git mv proxy.ts src/proxy.ts`.
4.2. Next.js detecta `src/proxy.ts` automáticamente cuando está al nivel de `src/app`. **No tocar `next.config.ts`**.
4.3. Ajustar imports dentro del proxy si los hay.
4.4. **Verificación**: dev server + ruta `/login` y `/dashboard` comportándose igual.

---

### Fase 5 (breaking aceptado): Reorganizar `convex/` por dominios
**Objetivo**: carpeta por dominio; helpers en `_lib/`; aceptar el cambio de paths públicos Convex que produce mover funciones a `index.ts`.

**Decisión 2026-06-30**: se acepta la Ruta B. En esta versión de Convex, `convex/<dominio>/index.ts` no se expone como `api.<dominio>.*`; se expone como `api.<dominio>.index.*`. Por tanto esta fase **sí cambia** los paths públicos y todos los consumidores internos deben migrar.

- `agent.ts` → `agent/index.ts` (`api.agent.*` pasa a `api.agent.index.*`)
- `agentAuth.ts` → `agent/auth.ts` (`api.agentAuth.*` pasa a `api.agent.auth.*`)
- `rondas.ts` → `rondas/index.ts` (`api.rondas.*` pasa a `api.rondas.index.*`)
- `sgc.ts` → `sgc/index.ts` (`api.sgc.*` pasa a `api.sgc.index.*`)
- `fichas.ts` → `fichas/index.ts` (`api.fichas.*` pasa a `api.fichas.index.*`)
- `pt.ts` → `pt/index.ts` (`api.pt.*` pasa a `api.pt.index.*`)

#### Paso 5.1: Inventario de referencias `api.*`
Antes de mover nada, capturar el set exacto de funciones Convex usadas:

```bash
rg "api\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+" src/ lib/ app/ scripts/ tests/ -g "*.ts" -g "*.tsx" --no-filename -o | sort | uniq > logs/plans/convex-api-uso-antes.txt
```

Al final de la fase, comparar con el mismo comando para confirmar que solo cambiaron los paths esperados:
- `api.rondas.<fn>` → `api.rondas.index.<fn>`
- `api.sgc.<fn>` → `api.sgc.index.<fn>`
- `api.fichas.<fn>` → `api.fichas.index.<fn>`
- `api.pt.<fn>` → `api.pt.index.<fn>`
- `api.agentAuth.<fn>` → `api.agent.auth.<fn>`
- `api.agent.<fn>` → `api.agent.index.<fn>` si hay consumidores.

#### Paso 5.2: Fusionar `rondas.ts` con `convex/rondas/`
`convex/rondas.ts` solo re-exporta funciones desde `convex/rondas/*.ts`.

```bash
cat convex/rondas.ts > convex/rondas/index.ts
git rm convex/rondas.ts
```

Corregir imports relativos (ahora el índice está dentro de la carpeta):

```bash
sed -i "s|from './rondas/|from './|g" convex/rondas/index.ts
sed -i "s|from './rondas'$|from './'|g" convex/rondas/index.ts
```

Verificar que los imports queden como:
```ts
import { ... } from './reads'
import { ... } from './mutations'
```

#### Paso 5.3: Fusionar `sgc.ts` con `convex/sgc/`

```bash
cat convex/sgc.ts > convex/sgc/index.ts
git rm convex/sgc.ts
sed -i "s|from './sgc/|from './|g" convex/sgc/index.ts
```

#### Paso 5.4: Fusionar `agent.ts` con `convex/agent/`

```bash
cat convex/agent.ts > convex/agent/index.ts
git rm convex/agent.ts
sed -i "s|from './agent/|from './|g" convex/agent/index.ts
```

#### Paso 5.5: Mover `agentAuth.ts` a `agent/auth.ts`

```bash
git mv convex/agentAuth.ts convex/agent/auth.ts
```

Este cambio modifica el path público: `api.agentAuth.*` pasa a `api.agent.auth.*`.

Actualizar todos los usos:

```bash
rg "api\.agentAuth\." src/ app/ lib/ -g "*.ts" -g "*.tsx" -l
find src app lib -type f \( -name '*.ts' -o -name '*.tsx' \) -exec sed -i 's|api\.agentAuth\.|api.agent.auth.|g' {} +
```

No dejar puente temporal en `convex/agentAuth.ts`: esta fase acepta el cambio breaking y debe actualizar todos los consumidores internos.

#### Paso 5.6: Mover `fichas.ts` y `pt.ts` a carpetas

```bash
mkdir -p convex/fichas convex/pt
git mv convex/fichas.ts convex/fichas/index.ts
git mv convex/pt.ts convex/pt/index.ts
```

Como Convex expone `index.ts` como segmento explícito, los paths pasan a `api.fichas.index.*` y `api.pt.index.*`.

#### Paso 5.7: Helpers comunes a `convex/_lib/`
Si hay helpers compartidos (auth.config, validación de usuario, etc.), moverlos a `convex/_lib/` y actualizar sus imports dentro de `convex/`. No mover `convex/schema.ts`, `convex/auth.config.ts` ni `convex/migrations.ts` salvo que sea estrictamente necesario.

#### Paso 5.8: Regenerar tipos de Convex

```bash
pnpm exec convex codegen
```

Esto actualiza `convex/_generated/api.d.ts`. Si falla, se corrige antes de seguir.

#### Paso 5.9: Verificación mecánica

```bash
# El set debe reflejar solo los cambios breaking aceptados a .index / agent.auth.
rg "api\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+" src/ scripts/ tests/ -g "*.ts" -g "*.tsx" --no-filename -o | sort | uniq > logs/plans/convex-api-uso-despues.txt
diff logs/plans/convex-api-uso-antes.txt logs/plans/convex-api-uso-despues.txt || true

# No deben quedar consumidores internos con paths antiguos.
rg -P "api\.(rondas|sgc|fichas|pt)\.(?!index\b)[A-Za-z0-9_]+\b|api\.agentAuth\." src/ scripts/ tests/ -g "*.ts" -g "*.tsx"

# No deben quedar imports a archivos borrados
rg "from ['\"]@/lib/" src/ || true
rg "from ['\"]\.\./\.\./convex/(rondas|sgc|agent)['\"]" src/ || true
```

**Verificación final**:
```bash
pnpm exec convex codegen
pnpm build
pnpm test:e2e:start tests/e2e/app.spec.ts --project=chromium
```

#### Checklist Fase 5
- [x] `convex/rondas.ts`, `convex/sgc.ts` y `convex/agent.ts` sueltos ya no existen.
- [x] `convex/rondas/index.ts`, `convex/sgc/index.ts`, `convex/agent/index.ts` importan con `./reads`, `./mutations`, etc., no con `./rondas/reads`.
- [x] `convex-api-uso-despues.txt` usa regex profundo y muestra los paths breaking esperados (`.index` / `agent.auth`).
- [x] No quedan consumidores internos con `api.rondas.<fn>`, `api.sgc.<fn>`, `api.fichas.<fn>`, `api.pt.<fn>` ni `api.agentAuth.<fn>` fuera de los nuevos segmentos `.index`.
- [x] `pnpm exec convex codegen` sin errores.
- [x] `pnpm build` verde.
- [ ] `pnpm test:e2e:start tests/e2e/app.spec.ts --project=chromium` pasa.
- [ ] `pnpm test:e2e:start tests/e2e/dashboard.auth.spec.ts --project=authenticated-chromium` pasa si hay auth lista.
- [ ] Estado actual 2026-06-30: el repro correcto del bloqueo usa `test:e2e:start`; `config.webServer` intenta levantar `pnpm dev`, falla con `Can't resolve 'tailwindcss' in '/home/w182/w421'` y luego vence el timeout.

---

### Fase 6: Reemplazar `process.env.X!` por `env.*`
**Objetivo**: un único punto de validación.

6.1. Listar todos los `process.env.X` del repo (`grep -rn "process.env" src/`).
6.2. Reemplazar imports para usar `env.X` desde `@/env` (server) o `env.NEXT_PUBLIC_X` (cliente). Recordar:
   - Server-only vars se importan directo de `@/env` y **nunca** se acceden como `env.NEXT_PUBLIC_*`.
   - Client vars deben estar definidas en `NEXT_PUBLIC_*` en `env.js`.
6.3. `\`ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)\` → \`new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL)\`.
6.4. **Verificación**: arrancar dev, login, dashboard, sgc funcionando. `pnpm build`.

---

### Fase 7: Migrar componentes UI compartidos a `src/components/ui/`
**Objetivo**: primitivos accesibles por todos los dominios.

7.1. Identificar primitivos: revisar `src/app/(protected)/dashboard/components/` y `src/app/(protected)/sgc/components/` en busca de `Alert`, `Card`, `Button`, `Tabs`, etc. que se usen desde dos o más dominios.
7.2. Mover cada primitivo a `src/components/ui/<Nombre>.tsx`.
7.3. Actualizar imports: `@/app/(protected)/dashboard/components/Alert` → `@/components/ui/Alert`.
7.4. Validar que **ningún** componente en `src/components/ui/` importe Convex ni auth — si lo hace, no es primitivo; queda en el dominio.
7.5. **Verificación**: build + lint + e2e.

---

### Fase 8: Limpieza final
**Objetivo**: cero huella del layout anterior.

8.1. Confirmar que `lib/` ya no existe.
8.2. Confirmar que `app/` ya no existe (todo en `src/app/`).
8.3. Confirmar que `proxy.ts` ya no existe en raíz.
8.4. Actualizar `README.md` con la nueva estructura y reglas (ver below).
8.5. Actualizar `AGENTS.md` con el nuevo reglamento (paths, capas, reglas).
8.6. Correr **todas** las verificaciones:
   - `pnpm build`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm exec convex dev` (CI Convex)
   - `pnpm test:e2e:start` (subir server, smoke público y luego dashboard/sgc si hay auth lista)
8.7. Merge a `main` (squash o por fases, según política del repo).

---

## Reglas a documentar en `AGENTS.md` o `README.md`

1. **`src/app/**`**: solo rutas, layouts y *page-level* server components. Cero lógica de negocio. Si una página crece, muévela a `src/server/<modulo>/service.ts`.
2. **`src/server/<modulo>/`**: cada dominio tiene `service.ts` (reglas), `tipos.ts` (types), `repositorio.ts` (acceso a Convex). Nuevo módulo = nueva carpeta.
3. **`src/components/`**: UI reutilizable **sin imports a Convex ni a `/auth`**. Datos por props.
4. **`src/lib/`**: helpers puros. Nada que toque dominio.
5. **`convex/<dominio>/`**: queries/mutations por dominio. Helpers en `convex/_lib/`.
6. **Server actions** para mutaciones en `src/app/<modulo>/actions.ts`. **Hooks Convex** en cliente para lecturas (`useQuery(api.<dominio>.<fn>)`).
7. **Alias único**: `@/* -> ./src/*`.
8. **Env**: toda variable se valida en `src/env.js` con Zod. Nunca `process.env.X!` en código nuevo.
9. **Tests unitarios**: junto al código, `*.test.ts`. Vitest.
10. **No tRPC**: Convex + server actions es la API.
11. **Nuevo módulo**: `src/app/(protected)/<modulo>/` + `src/server/<modulo>/` + `convex/<modulo>/`.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| `convex/rondas.ts` + `convex/rondas/` colisionan al mover | Fusionar `rondas.ts` en `rondas/index.ts` y corregir imports relativos (`./rondas/reads` → `./reads`). Mismo para `sgc` y `agent`. No renombrar módulos. |
| Cambio de path de función Convex rompe `api.rondas.list` | Inventario mecánico de `api.X.Y` antes y después. No renombrar módulos (`agent` se mantiene `agent`, no `agente`). Verificar con `pnpm exec convex codegen` y `diff` del inventario. |
| Mover `app/` de golpe rompe imports y deja build rojo largo | Copiar `app/` a `src/app/`, corregir imports, activar con el cambio de alias y recién entonces borrar `app/`. Usar puentes `src/lib/*.ts` si `lib/` aún no se movió. |
| WorkOS AuthKit no reacciona a `src/proxy.ts` | Next.js 16 detecta `src/proxy.ts` automáticamente al nivel de `src/app`; copiar el matcher exacto de `proxy.ts` y verificar `/login`, `/dashboard`, `/denied`. |
| `env.js` cambia firma de vars (server vs client) | Validar con `NEXT_PUBLIC_*` solo las que el cliente usa (Convex URL). Server vars nunca en cliente. |
| Antiguos `process.env.X!` dispersos se caen en runtime | Fase 6 reemplaza todos de un solo sweep; correr e2e que toca Resend + WorkOS. |
| Tests e2e que dependen de rutas estáticas (`/docs/screenshots`) | `proxy.ts` matcher se mantiene idéntico en `src/proxy.ts`. |
| La verificación e2e local se ejecuta con el comando equivocado | Usar `pnpm test:e2e:start` para local. `pnpm test:e2e` solo si ya existe server o en CI. |
| La suite autenticada no corre en clones limpios | Documentar y preparar `.auth/workos.json`, credenciales `E2E_AUTH_*`, o el flujo `pnpm test:e2e:auth:manual`. |

---

## Estado de cargo (checklist)

- [x] Fase 0: ramificación + deps + inventarios mecánicos (`@/...`, `api.X.Y`, imports relativos). Commit `33fc424`. Carpetas vacías de 0.3 persistidas con `.gitkeep`; `src/convex/` untracked sospechoso (debe quedar en raíz); nombre de inventario Convex corregido a `convex-api-uso-antes.txt`.
- [x] Fase 1: `src/env.js`, `src/lib/utils.ts`. Commit `996fc97`. Luego se consolidó en `src/env.ts` durante Fase 6 para corregir conflictos de tipos con `convex/auth.config.ts`.
- [x] Fase 2: `app/components/` → `src/components/`; `app/` → `src/app/`; alias `@/* → ./src/*`; `app/` raíz eliminado; cleanup estricto de `@/app/...` cerrado con `rg "@/app/" src/app` en cero y `pnpm build` + `pnpm lint` verdes. `pnpm test:e2e` sigue bloqueado por el problema previo de `config.webServer`.
- [x] Fase 3: `lib/` → `src/server/{auth,rondas,sgc,mailer,agent-router}` + `src/lib/`; `lib/` raíz eliminado.
- [x] Fase 4: `proxy.ts` → `src/proxy.ts`.
- [x] Fase 5: `convex/` por dominios con breaking change aceptado a `api.<dominio>.index.*`; inventario API-only antes/después explicado.
- [x] Fase 6: `process.env.X!` → `env.X`. Incluye saneamiento de Playwright y scripts en `tests/e2e/env.ts` y `scripts/env.mjs`.
- [ ] Fase 7: `src/components/ui/` con primitivos compartidos.
- [ ] Fase 8: limpieza + docs + AGENTS.md actualizado.

### Estado Playwright al 2026-06-30

- `pnpm test:e2e:start tests/e2e/app.spec.ts --project=chromium` reproduce el bloqueo actual.
- El fallo observado hoy es de arranque de `config.webServer`, no de descubrimiento de tests:
  - Next intenta resolver `tailwindcss` desde `/home/w182/w421`
  - luego Playwright vence esperando `${baseURL}/login`
- `pnpm test:e2e` a secas no sirve como repro local canónico de este bug porque no fuerza el arranque del server.

---

## Orden estricto de ejecución

0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

**No saltar fases**: cada una garantiza build verde al cierre. Si saltás 5 antes que 2, los imports de Convex se rompen y `pnpm dev` no arranca.

**Commit por fase** (no por archivo): cada fase termina con `pnpm build` verde, se commitea.
**PR por fase** si querés review; o **un solo PR al final** si vas con cuidado.

---

## Qué NO incluye este plan

- Migrar a tRPC (decisión 4: no).
- Cambiar WorkOS por otra auth (decisión 1: rename only).
- Cambiar Tailwind v4 → v3 (decisión 12: no).
- Reescribir queries Convex a Drizzle (decisión 15: se prepara el espacio `repositorio.ts` pero la migración real queda fuera de alcance).
- Refactorizar `agent-router` (decisión 2: mudar sin refactor).
- Mover Resend desde server actions a Convex `internalAction` (decisión 14: pendiente de evaluar aparte).

---

## Cómo retomar este plan

Guardar una copia de este archivo como `logs/plans/260629_1755_plan_migracion_estructura_t3.md`. Al comenzar una sesión nueva, leer:
1. `logs/CURRENT_SESSION.md` para estado actual.
2. Este plan (o su copia en `logs/plans/`), marcando las fases [x] ya completadas.
3. `cr-rev2.md` y `featv3.md` para contexto de funcionalidades pendientes.
