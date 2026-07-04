# Rundown: calaire-app2

**Date**: 2026-07-04

## Current State

- Vista final de Rondas afinada: header compacto, único botón `+ Nueva ronda`, tabla limpia (`Ingresar` → `Gestionar`), skeleton del dashboard alineado.
- Ajustes visuales globales de dashboard/SGC (panels, layout, SgcHeader, DriveStatsBar, globals.css +368 líneas).
- Verificación local completa: `pnpm lint`, `pnpm build`, `pnpm test` pasan.
- Commit `1e1583f` (33 archivos, +3052/-694) pusheado a `origin/feat-drive-sgc`.
- Deploy de producción por Vercel git integration sobre la rama `feat-drive-sgc`.

## Critical Technical Context

- Deploy a producción via push a `feat-drive-sgc` (Vercel git integration).
- Primitiva nueva `RondaPageHeader` centraliza el header contextual de rondas; no duplicar branding dentro del contenido.
- `MapaSgcFrame` desacopla el contenido del HTML del mapa del wrapper de la app.
- Estándar de UI = anatomía de página (nav → subnav → header → KPI strip → filtros → contenido).

## Next Steps

1. Verificar el deploy de Vercel para `feat-drive-sgc` y la URL de producción.
2. Revisión visual con sesión admin real.
3. Si más deriva de UI: extraer anatomía repetida a shell components compartidos.

## Branch Status

- Branch: `feat-drive-sgc`
- Status: clean (recién pusheado)
- Pending changes: none
- HEAD: `1e1583f refactor(ui): vista final de Rondas compacta y afinación visual dashboard/SGC`