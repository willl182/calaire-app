# CALAIRE App

Portal web para gestionar rondas de Ensayos de Aptitud (EA) con Next.js 16, Convex y WorkOS.

## Stack

| Área | Tecnología |
|---|---|
| Frontend / rutas | Next.js 16 App Router + React 19 |
| Lenguaje | TypeScript |
| Backend / datos | Convex |
| Autenticación | WorkOS AuthKit |
| Estilos | Tailwind CSS 4 |
| Paquetes | pnpm |
| Deploy | Vercel + Convex Cloud |

## Estructura T3

```text
src/
  app/                  Rutas, layouts y server components de página
  components/           UI reutilizable sin Convex/auth
  components/ui/        Primitivos compartidos
  server/               Lógica de dominio por módulo
  lib/                  Helpers puros
  env.ts                Validación centralizada de variables de entorno
  proxy.ts              Proxy de WorkOS/AuthKit

convex/
  <dominio>/index.ts    Queries/mutations/actions públicas por dominio
  _lib/                 Helpers compartidos de Convex
  schema.ts             Schema global
  auth.config.ts        Configuración auth de Convex

tests/
  e2e/                  Playwright
```

## Reglas de arquitectura

- `src/app/**`: solo rutas, layouts, pages y acciones de página.
- `src/server/<modulo>/`: lógica de negocio, tipos y acceso a datos por dominio.
- `src/components/**`: componentes reutilizables por props; no importan Convex ni auth.
- `src/lib/**`: utilidades puras, sin lógica de dominio.
- `convex/<dominio>/`: API de backend por dominio. En este repo las funciones públicas quedan como `api.<dominio>.index.<funcion>` y `api.agent.auth.<funcion>`.
- Alias único: `@/* -> ./src/*`.
- Variables de entorno: se validan en `src/env.ts`. No se agregan nuevos `process.env.X` fuera de `src/env.ts`, `tests/e2e/env.ts` y `scripts/env.mjs`.

## Requisitos

- Node.js compatible con Next.js 16
- pnpm
- Cuenta de WorkOS
- Proyecto de Convex

## Configuración local

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Variables usadas por la app:

```bash
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_SECRET=
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
RESEND_API_KEY=
MAIL_FROM=equipo@example.com
```

Notas:

- `WORKOS_SECRET` es opcional en `src/env.ts`, pero si el entorno lo requiere debe configurarse en `.env.local`.
- `NEXT_PUBLIC_CONVEX_URL` es obligatorio para cliente y servidor.
- `RESEND_API_KEY` y `MAIL_FROM` habilitan el envío de correos para flujos de agente.
- `CONVEX_DEPLOYMENT` lo usan scripts operativos como `scripts/env.mjs` y `pnpm release`.
- No se versiona `.env.local`.

### 3. Configurar WorkOS

1. Crear una Application.
2. Agregar `http://localhost:3000/auth/callback` como redirect local.
3. Crear roles `admin` y `member`/`participante`.
4. Copiar `API Key`, `Client ID` y, si aplica, el secreto correspondiente al `.env.local`.

### 4. Configurar Convex

Desarrollo local:

```bash
pnpm exec convex dev
```

Deploy manual:

```bash
pnpm exec convex deploy
```

## Desarrollo

```bash
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

## Scripts

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:e2e:start
pnpm test:e2e:auth:manual
pnpm release -- "mensaje del commit"
```

## Playwright

- `pnpm test:e2e` asume que ya existe un servidor en `http://localhost:3000`.
- `pnpm test:e2e:start` levanta el servidor antes de ejecutar Playwright.
- Para rutas autenticadas:

```bash
E2E_AUTH_EMAIL="usuario@example.com" E2E_AUTH_PASSWORD="..." pnpm test:e2e:start
```

- Si prefieres login manual:

```bash
pnpm test:e2e:auth:manual
pnpm test:e2e
```

La sesión local se guarda en `.auth/workos.json`, ignorado por git.

## Verificación mínima

Antes de mergear:

```bash
pnpm build
pnpm lint
pnpm test
pnpm exec convex codegen
pnpm test:e2e:start
```

Si `pnpm exec convex dev` o Playwright fallan por red, auth o ausencia de servidor, dejarlo documentado en `logs/CURRENT_SESSION.md`.

## Rutas principales

| Ruta | Uso |
|---|---|
| `/login` | Inicio de sesión |
| `/dashboard` | Vista principal autenticada |
| `/mi-dashboard` | Vista de participante |
| `/ronda/[codigo]` | Carga y gestión de una ronda |
| `/denied` | Acceso denegado |
| `/auth/callback` | Callback de WorkOS |
| `/agent/*` | Endpoints HTTP del agent router |

## Release

```bash
pnpm release -- "mensaje del commit"
```

El flujo ejecuta lint, build, commit, deploy de Convex, deploy de Vercel y push.
