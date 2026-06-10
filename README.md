# CALAIRE App

Portal web para la gestión de rondas de Ensayos de Aptitud (EA). Permite a coordinadores crear rondas, administrar participantes, generar enlaces individuales de acceso y recibir resultados cargados por participantes autenticados.

## Stack

| Área | Tecnología |
|---|---|
| Frontend / rutas | Next.js 16 App Router + React 19 |
| Lenguaje | TypeScript |
| Autenticación | WorkOS AuthKit |
| Backend / datos | Convex |
| Estilos | Tailwind CSS 4 |
| Paquetes | pnpm |
| Deploy | Vercel + Convex Cloud |

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

Copiar el archivo de ejemplo:

```bash
cp .env.example .env.local
```

Completar `.env.local`:

```bash
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_COOKIE_PASSWORD=
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
RESEND_API_KEY=
MAIL_FROM=wilsonsalasc@gmail.com
```

Notas:

- `WORKOS_COOKIE_PASSWORD` debe ser un secreto fuerte.
- `NEXT_PUBLIC_APP_URL` se usa para construir enlaces formales de acceso por participante.
- `RESEND_API_KEY` y `MAIL_FROM` habilitan el envio transaccional de enlaces de claim para agentes. Sin `RESEND_API_KEY`, el flujo dev devuelve el enlace en la respuesta JSON y omite el correo. Para envio normal con Resend, `MAIL_FROM` debe pertenecer a un dominio verificado.
- No commitear `.env.local`; solo `.env.example` debe versionarse.

### 3. Configurar WorkOS

En WorkOS:

1. Crear una Application.
2. Agregar redirect local:
   - `http://localhost:3000/auth/callback`
3. Crear roles:
   - `admin` para coordinadores.
   - `member` o `participante` para participantes.
4. Crear/asignar usuarios según corresponda.
5. Copiar `API Key` y `Client ID` al `.env.local`.

### 4. Configurar Convex

Durante desarrollo:

```bash
pnpm dlx convex dev
```

Para desplegar funciones/schema:

```bash
pnpm dlx convex deploy
```

Luego copiar las URLs y deployment de Convex a `.env.local`.

## Desarrollo

```bash
pnpm dev
```

La app queda disponible en:

```text
http://localhost:3000
```

## Scripts útiles

```bash
pnpm lint
pnpm build
pnpm start
pnpm release -- "mensaje del commit"
pnpm test:e2e
```

### Playwright local

Para correr solo el smoke público, deja activo `pnpm dev` y ejecuta:

```bash
pnpm test:e2e
```

Para probar rutas autenticadas en local, usa un usuario WorkOS sin MFA/captcha:

```bash
E2E_AUTH_EMAIL="usuario@example.com" E2E_AUTH_PASSWORD="..." pnpm test:e2e
```

Si prefieres hacer login manual una sola vez:

```bash
pnpm test:e2e:auth:manual
pnpm test:e2e
```

Ambos flujos guardan la sesión local en `.auth/workos.json`, ignorado por git.

Notas para WorkOS/AuthKit en este entorno:

- Usa `http://localhost:3000`, no `http://127.0.0.1:3000`. El redirect URI de WorkOS está configurado con `localhost`; mezclar hosts puede terminar en `Couldn't sign in`.
- Para renovar la sesión manual de WorkOS, usa Chromium de sistema: `/usr/bin/chromium`. El Chromium empaquetado por Playwright puede ser rechazado por Google/WorkOS.
- Si automatizas el login manual, lanza `/usr/bin/chromium` visible con `--disable-blink-features=AutomationControlled` y guarda el estado en `.auth/workos.json`.
- En esta máquina, los lanzamientos de Chromium/Playwright necesitan ejecutarse fuera del sandbox; dentro del sandbox falla Chromium con `sandbox_host_linux.cc`.

Antes de desplegar, correr al menos:

```bash
pnpm build
```

## Release

Para publicar cambios en una sola pasada:

```bash
pnpm release -- "mensaje del commit"
```

El flujo ejecuta:

1. `pnpm lint`
2. `pnpm build`
3. `git add -A`
4. `git commit`
5. `pnpm exec convex deploy`
6. `vercel --prod`
7. `git push origin HEAD`

## Rutas principales

| Ruta | Uso |
|---|---|
| `/login` | Inicio de sesión |
| `/dashboard` | Vista principal autenticada |
| `/mi-dashboard` | Vista de participante |
| `/ronda/[codigo]` | Carga/gestión de información de una ronda |
| `/denied` | Acceso denegado por permisos |
| `/auth/callback` | Callback de WorkOS |

## Flujo general

1. El coordinador inicia sesión con rol `admin`.
2. Crea una ronda de EA.
3. Define el número de participantes esperados.
4. La app genera enlaces individuales de invitación.
5. Cada participante entra con su enlace, se autentica y reclama su cupo.
6. El participante carga sus resultados.
7. El coordinador revisa la información desde el dashboard.

## Deploy en Vercel

1. Importar el repositorio en Vercel.
2. Configurar las variables de entorno del proyecto.
3. En WorkOS, agregar el redirect de producción, por ejemplo:

```text
https://TU-DOMINIO/auth/callback
```

4. Confirmar que `NEXT_PUBLIC_CONVEX_URL` apunte al despliegue Convex productivo.
5. Ejecutar smoke test:
   - login,
   - creación de ronda,
   - generación de invitaciones,
   - acceso de participante,
   - carga de resultados.

## Migrar a otra cuenta

El acoplamiento con servicios externos vive en las variables de entorno.

### WorkOS

1. Crear nueva Application.
2. Configurar redirects local/producción.
3. Recrear roles `admin` y `member`/`participante`.
4. Actualizar variables `WORKOS_*` y `NEXT_PUBLIC_WORKOS_REDIRECT_URI`.

### Convex

1. Crear o vincular un nuevo proyecto Convex.
2. Ejecutar:

```bash
pnpm dlx convex deploy
```

3. Actualizar:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CONVEX_SITE_URL`

Si hay datos productivos, planear exportación/importación antes del corte.
