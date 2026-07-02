# Rundown: calaire-app2

**Date**: 2026-07-01

## Current State

- Mapa del SGC (`/sgc/mapa`) rediseñado y reorganizado en
  `data/sgc/mapa_navegacion_sgc_pea.html`. Usuario confirmó que quedó bien.
  - Estilo alineado a la app (Droid Sans, dorado de marca `#FDB913`, grises, tarjetas/botones).
  - Controles movidos a barra horizontal arriba (antes eran sidebar lateral).
  - Columnas más juntas (x=40/360/680, viewBox 970×1400).
  - 22 formatos en una sola columna en orden numérico (F-PSEA-01 … 18).
- Sesión previa (auth/backend producción): redirect a localhost corregido y desplegado,
  Convex prod `steady-kiwi-725` desplegado, `/login/start` verificado. Pendiente verificación
  final de rutas autenticadas por el usuario.
- Cambios sin commitear en la rama.

## Critical Technical Context

- El mapa es HTML estático servido por `.../mapa/embed/route.ts` en un `<iframe>`;
  NO hereda `globals.css`, por eso los tokens de marca se replican inline.
- CSP de la ruta embed: `default-src 'self'` — fuentes locales `/fonts/*.ttf` OK; nada externo.
- Los edges del SVG se derivan de coordenadas de nodos; reordenar no rompe relaciones.
- Extensión de Chrome desconectada: no se pudo renderizar en vivo esta sesión.
- Auth (previo): fix depende de `src/proxy.ts` (permitir `/login/start`) +
  `src/app/login/start/route.ts` (callback desde headers reenviados). Env prod:
  `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CONVEX_URL=https://steady-kiwi-725.convex.cloud`,
  `NEXT_PUBLIC_WORKOS_REDIRECT_URI=""`.

## Next Steps

1. Commitear el rediseño del mapa cuando el usuario lo indique.
2. Verificar `/sgc/mapa` en producción tras desplegar.
3. Retomar verificación pendiente de auth (`/dashboard`, `/sgc`) de la sesión previa.

## Branch Status

- Branch: `feature/t3-estructura-segura`
- Status: dirty, ahead of `origin/feature/t3-estructura-segura` by 1 commit
- Pending changes:
  - `data/sgc/mapa_navegacion_sgc_pea.html`
  - `logs/CURRENT_SESSION.md`, `logs/260701_rundown.md`
  - `src/app/login/start/route.ts`, `src/lib/app-url.ts`, `src/proxy.ts`
  - `.vercelignore` (untracked)
