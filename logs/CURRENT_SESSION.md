# Session State: calaire-app2

**Last Updated**: 2026-07-01 23:24 -05

## Session Objective

Rediseñar el mapa de navegación del SGC (`/sgc/mapa`) para que siga el estilo
visual de la app (fuentes, colores) y reorganizar su layout.

## Current State

- [x] Reestilizado el HTML embebido del mapa (`data/sgc/mapa_navegacion_sgc_pea.html`)
      para usar Droid Sans + tokens de marca (dorado `#FDB913`, grises de superficie)
      igual que `src/app/globals.css`.
- [x] Códigos y números en fuente monoespaciada con `tabular-nums`.
- [x] Componentes alineados a la app: header con borde dorado, botones/chips con
      gradiente, tarjetas con borde izquierdo dorado, foco dorado, scrollbar dorada.
- [x] Recodificadas las 5 familias documentales con paleta armónica + leyenda sincronizada.
- [x] Movidos los controles laterales (`aside`) a una **barra horizontal arriba** del mapa.
- [x] Columnas más juntas: Procedimientos x40, Documentos/instructivos x360, Formatos x680;
      `viewBox` 970×1400.
- [x] Los 22 formatos ahora en **una sola columna en orden numérico** (F-PSEA-01 … 18).
- [x] Usuario confirmó: "tuvo bien".
- [ ] (Pendiente de sesión previa, auth) Verificar `/dashboard` y `/sgc` en producción tras deploy de Convex.
- [ ] Commit de los cambios pendientes en la rama.

## Critical Technical Context

- Project uses `pnpm`; do not use `npm` for scripts.
- El mapa es un HTML estático en `data/sgc/mapa_navegacion_sgc_pea.html`, servido por
  `src/app/(protected)/dashboard/sgc/mapa/embed/route.ts` dentro de un `<iframe>` desde
  `src/app/(protected)/dashboard/sgc/mapa/page.tsx`. `/sgc/mapa` re-exporta esa página.
- La ruta embed aplica CSP `default-src 'self'`; las fuentes `@font-face url('/fonts/...')`
  cargan bien porque `font-src` hereda `'self'` (mismo origen). No usar fuentes externas.
- Solo Droid Sans existe localmente en `public/fonts/`; la stack mono cae a fuentes de sistema.
- Los edges del SVG se recalculan desde las coordenadas de los nodos, así que reordenar
  nodos no rompe las relaciones.
- No se pudo renderizar en vivo: la extensión de Chrome no está conectada. Copia autónoma
  de preview (con rutas de fuente locales) en el scratchpad de la sesión.
- Contexto previo (auth, sin resolver del todo): producción en `https://calaire-app.vercel.app`,
  Convex prod `https://steady-kiwi-725.convex.cloud`. Ver `logs/history` para detalle.

## Next Steps

1. Commitear el rediseño del mapa cuando el usuario lo pida.
2. Verificar visualmente en producción tras desplegar (`/sgc/mapa`).
3. Retomar verificación pendiente de auth en `/dashboard` y `/sgc` si aplica.
