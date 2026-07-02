# Session State: CALAIRE App

**Last Updated**: 2026-07-02 15:38 -05

## Session Objective

Completar la prueba operativa de Drive documental SGC con Google Drive real y persistir el cierre.

## Current State

- [x] Fase 8 de Drive documental SGC queda con F1-F5 aplicados.
- [x] `pnpm sgc:provision-drive` escanea una carpeta Drive y genera `GOOGLE_DRIVE_TEMPLATE_MAP`.
- [x] Carpeta Drive real `10WlUUALhXqNTuVNbdQ6P23nQMv6feoGO` escaneada: 53 candidatos, 22 plantillas seleccionadas.
- [x] Service account validado para lectura/provisioning; en cuenta personal no sirve para copiar por cuota cero.
- [x] OAuth personal configurado con `GOOGLE_DRIVE_AUTH_MODE=oauth`.
- [x] Prueba UI `Crear en Google Drive` ejecutada contra ronda `kd7b0emdk7cmzp1vn34f2bfv7986bb77`.
- [x] Resultado operativo final: 8/8 carpetas con URL Drive, 22/30 documentos copiados, 0 fallos.
- [x] Los 8 restantes son `EVID-*` y se cargaran/enlazaran manualmente cuando exista evidencia real.

## Critical Technical Context

- Stack: Next.js 16.2.4, WorkOS/AuthKit, Convex, pnpm.
- Layout: `app/`, `lib/`, `convex/`; no crear `src/`.
- Convex SGC se consume como `api.sgc.<funcion>`.
- Antes de tocar Convex leer `convex/_generated/ai/guidelines.md`.
- Antes de tocar App Router leer docs locales en `node_modules/next/dist/docs/`.
- En cuentas personales de Google Drive usar `GOOGLE_DRIVE_AUTH_MODE=oauth`; service account no puede copiar archivos en Mi unidad por falta de cuota.
- Secretos locales quedan bajo `.local/` y `.env.local`, ambos ignorados por git.
- Verificacion reciente: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`; previamente tambien `pnpm test`, `pnpm test:e2e:start`, `pnpm exec convex codegen`.

## Next Steps

1. Verificar manualmente en Drive que las 22 copias creadas no apunten a plantillas maestras.
2. Definir permisos/visibilidad participante antes de exponer documentos definitivos.
3. Cargar/enlazar `EVID-*` solo cuando exista evidencia real.
