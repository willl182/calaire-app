# Plan: Migración a estructura T3 (variantes de adaptación)

**Fecha**: 2026-06-29
**Objetivo**: Reorganizar el repo `calaire-app` siguiendo el reglamento de carpetas T3, sin cambiar stack (Convex + Next 16 + WorkOS + Tailwind v4), sin introducir tRPC.

**Resultado esperado**: código app/ en `src/app/`, lógica de dominio en `src/server/<modulo>/`, utils en `src/lib/`, UI compartida en `src/components/`, Convex reorganizado por dominios, `src/env.js` con validación Zod. Build verde al final.

---

## Decisiones tomadas (no se negocian en medio del plan)

| # | Punto | Decisión |
|---|------|----------|
| 1 | `proxy.ts` (middleware WorkOS) | Renombrar a `src/middleware.ts`. No entra en `src/server/`. |
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
│   └── middleware.ts                        # antes proxy.ts
│
├── convex/                                  # NO se mueve a src/
│   ├── _generated/
│   ├── _lib/                                # helpers compartidos (nuevo)
│   ├── auth.config.ts
│   ├── schema.ts
│   ├── migrations.ts
│   ├── tsconfig.json
│   ├── agent/                               # antes agent.ts + archivos internos agent/*
│   │   ├── index.ts
│   ├── agentAuth.ts                         # se conserva para mantener api.agentAuth.*
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
**Regla Next 16**: antes de mover o borrar `app/`, leer la guía local relevante en `node_modules/next/dist/docs/`. Este repo no debe asumir convenciones de versiones anteriores de Next.

#### Paso 2.0: Confirmar soporte `src/app` en esta versión de Next

```bash
rg -n "src/app|src directory|app directory" node_modules/next/dist/docs/ | head -40
```

Si la documentación local contradice este plan, detener la fase y ajustar el plan antes de tocar archivos.

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
Si `lib/` sigue en raíz, crear espejos en `src/lib/` para **todo módulo importado desde `src/app`**. Esto incluye archivos planos y subrutas como `@/lib/rondas/client`, `@/lib/sgc/catalog`, `@/lib/sgc/templates` y `@/lib/fichas`.

```ts
// src/lib/auth.ts
export * from '../../lib/auth'

// src/lib/sgc/catalog.ts
export * from '../../../lib/sgc/catalog'
```

Generar el inventario de puentes requeridos antes de cambiar el alias:

```bash
rg "from ['\"]@/lib/" src/app --type ts --type tsx
```

Repetir para cada módulo de `lib/` importado desde `src/app/`. Estos puentes se eliminan en Fase 3.

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
pnpm build && pnpm lint && pnpm test:e2e
```

#### Paso 2.6: Limpieza de puentes
Una vez que Fase 3 mueva `lib/` a `src/server/`, eliminar los `src/lib/*.ts` puente.

#### Checklist Fase 2
- [ ] `rg "@/app/" src/` devuelve 0 resultados.
- [ ] Todo `@/lib/*` usado por `src/app/` resuelve contra un puente temporal en `src/lib/`.
- [ ] `rg "from ['\"]@/lib/" src/app --type ts --type tsx` está inventariado para la Fase 3.
- [ ] `pnpm build` verde.
- [ ] `pnpm lint` verde.
- [ ] Smoke e2e pasa para login, dashboard, una ruta protegida de ronda, `/agent/me` y rutas `.well-known`.

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

---

### Fase 4: Renombrar `proxy.ts` → `src/middleware.ts`
**Objetivo**: middleware en ubicación estándar T3.

4.1. `git mv proxy.ts src/middleware.ts`.
4.2. Next.js detecta `src/middleware.ts` automáticamente. **No tocar `next.config.ts`**.
4.3. Ajustar imports dentro del middleware si los hay.
4.4. **Verificación**: dev server + ruta `/login` y `/dashboard` comportándose igual.

---

### Fase 5 (segura): Reorganizar `convex/` por dominios
**Objetivo**: carpeta por dominio; helpers en `_lib/`; **sin renombrar módulos** para no romper `api.X.Y`.

**Regla de oro**: no renombrar módulos públicos. Solo fusionar archivos sueltos con carpetas existentes del mismo nombre, o mover archivos sueltos a carpetas nuevas con `index.ts` cuando el path público quede idéntico. Si un movimiento cambia `api.X.Y`, no pertenece a esta fase.

- `agent.ts` → `agent/index.ts` (mismo módulo `api.agent.*`)
- `agentAuth.ts` queda en raíz como `convex/agentAuth.ts` para conservar `api.agentAuth.*`. No se migra en este plan.
- `rondas.ts` → `rondas/index.ts` (mismo módulo `api.rondas.*`)
- `sgc.ts` → `sgc/index.ts` (mismo módulo `api.sgc.*`)
- `fichas.ts` → `fichas/index.ts` (mismo módulo `api.fichas.*`)
- `pt.ts` → `pt/index.ts` (mismo módulo `api.pt.*`)

#### Paso 5.1: Inventario de referencias `api.*`
Antes de mover nada, capturar el set exacto de funciones Convex usadas:

```bash
rg "api\.[a-zA-Z_]+\.[a-zA-Z_]+" src/ lib/ app/ --type ts --type tsx -o | sort | uniq > logs/plans/convex-api-uso-antes.txt
```

Al final de la fase, comparar con el mismo comando para confirmar que ningún `api.X.Y` cambió.

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

#### Paso 5.5: Mantener `agentAuth.ts` estable

No mover `convex/agentAuth.ts` en esta migración. Es un módulo público distinto de `convex/agent.ts`; moverlo bajo `convex/agent/` cambiaría el path público y rompería el criterio de fase.

Si se quiere preparar el código internamente, extraer helpers privados a `convex/agent/authHelpers.ts` o `convex/_lib/agent-auth.ts`, pero conservar las funciones públicas exportadas desde `convex/agentAuth.ts`.

#### Paso 5.6: Mover `fichas.ts` y `pt.ts` a carpetas

```bash
mkdir -p convex/fichas convex/pt
git mv convex/fichas.ts convex/fichas/index.ts
git mv convex/pt.ts convex/pt/index.ts
```

Como antes no existían carpetas `fichas/` ni `pt/`, los paths `api.fichas.*` y `api.pt.*` se mantienen.

#### Paso 5.7: Helpers comunes a `convex/_lib/`
Si hay helpers compartidos (auth.config, validación de usuario, etc.), moverlos a `convex/_lib/` y actualizar sus imports dentro de `convex/`. No mover `convex/schema.ts`, `convex/auth.config.ts` ni `convex/migrations.ts` salvo que sea estrictamente necesario.

#### Paso 5.8: Regenerar tipos de Convex

```bash
pnpm exec convex codegen
```

Esto actualiza `convex/_generated/api.d.ts`. Si falla, se corrige antes de seguir.

#### Paso 5.9: Verificación mecánica

```bash
# El set de api.X.Y debe ser idéntico al del inventario
rg "api\.[a-zA-Z_]+\.[a-zA-Z_]+" src/ --type ts --type tsx -o | sort | uniq > logs/plans/convex-api-uso-despues.txt
diff logs/plans/convex-api-uso-antes.txt logs/plans/convex-api-uso-despues.txt

# No deben quedar imports a archivos borrados
rg "from ['\"]@/lib/" src/ || true
rg "from ['\"]\.\./\.\./convex/(rondas|sgc|agent)['\"]" src/ || true
```

**Verificación final**:
```bash
pnpm exec convex codegen
pnpm build
pnpm test:e2e
```

#### Checklist Fase 5
- [ ] `convex/rondas.ts`, `convex/sgc.ts` y `convex/agent.ts` sueltos ya no existen.
- [ ] `convex/agentAuth.ts` sigue existiendo si expone funciones públicas usadas como `api.agentAuth.*`.
- [ ] `convex/rondas/index.ts`, `convex/sgc/index.ts`, `convex/agent/index.ts` importan con `./reads`, `./mutations`, etc., no con `./rondas/reads`.
- [ ] `convex-api-uso-antes.txt` y `convex-api-uso-despues.txt` son idénticos.
- [ ] `pnpm exec convex codegen` sin errores.
- [ ] `pnpm build` verde.
- [ ] `pnpm test:e2e` pasa login + dashboard + una ronda.

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
   - `pnpm test:e2e` (subir servers, login flow, dashboard, sgc)
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
| WorkOS AuthKit no reacciona a `src/middleware.ts` | Next.js 16 detecta `src/middleware.ts` automáticamente; copiar el matcher exacto de `proxy.ts` y verificar `/login`, `/dashboard`, `/denied`. |
| `env.js` cambia firma de vars (server vs client) | Validar con `NEXT_PUBLIC_*` solo las que el cliente usa (Convex URL). Server vars nunca en cliente. |
| Antiguos `process.env.X!` dispersos se caen en runtime | Fase 6 reemplaza todos de un solo sweep; correr e2e que toca Resend + WorkOS. |
| Tests e2e que dependen de rutas estáticas (`/docs/screenshots`) | `proxy.ts` matcher se mantiene idéntico en `src/middleware.ts`. |

---

## Estado de cargo (checklist)

- [ ] Fase 0: ramificación + deps + inventarios mecánicos (`@/...`, `api.X.Y`, imports relativos).
- [ ] Fase 1: `src/env.js`, `src/lib/utils.ts`.
- [ ] Fase 2: `app/components/` → `src/components/`; copiar `app/` → `src/app/`; corregir imports; activar alias `@/* → ./src/*`; borrar `app/`; puentes `src/lib/*` temporales.
- [ ] Fase 3: `lib/` → `src/server/{auth,rondas,sgc,mailer,agent-router}` + `src/lib/`; eliminar puentes de Fase 2.
- [ ] Fase 4: `proxy.ts` → `src/middleware.ts`.
- [ ] Fase 5: `convex/` por dominios sin renombrar módulos; inventario `api.X.Y` antes/después idéntico.
- [ ] Fase 6: `process.env.X!` → `env.X`.
- [ ] Fase 7: `src/components/ui/` con primitivos compartidos.
- [ ] Fase 8: limpieza + docs + AGENTS.md actualizado.

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
