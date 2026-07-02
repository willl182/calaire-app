# Rundown: CALAIRE App

**Date**: 2026-07-02

## Current State

- Drive documental SGC Fase 8 queda endurecida con F1-F5 aplicados.
- Integracion Google Drive API crea/reutiliza carpeta raiz, subcarpetas y copias de plantillas.
- La raiz y subcarpetas reutilizan `driveFolderId` o IDs extraidos de `webUrl` antes de crear duplicados.
- `createGoogleDriveFolder` ya no envia `includeItemsFromAllDrives` en operaciones create.
- Fallos parciales con recursos reutilizados se auditan como `sgc.drive.google_api_parcial`.
- Estados automaticos quedan en `notas` con prefijo `[Google Drive API]` preservando notas manuales.
- `review_drive.md` y `drive8.md` actualizados con fixes, pendientes y verificacion.
- Entorno E2E autenticado validado con `.auth/workos.json`; `pnpm test:e2e:start` paso 12/12.
- Provisioning Drive por codigo agregado: `pnpm sgc:provision-drive` crea/reutiliza estructura base y descubre plantillas desde una sola carpeta.
- Escaneo real de carpeta Drive `10WlUUALhXqNTuVNbdQ6P23nQMv6feoGO` completado: 53 candidatos, 22 entradas en `GOOGLE_DRIVE_TEMPLATE_MAP`.
- `.env.local` quedo configurado con `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_DRIVE_ROOT_FOLDER_ID` y `GOOGLE_DRIVE_TEMPLATE_MAP`.
- OAuth personal configurado para Google Drive; prueba UI `Crear en Google Drive` ejecutada con exito: 8/8 carpetas con URL Drive; 22/30 documentos copiados; 0 fallos; 8 `EVID-*` quedan para carga/enlace manual.
- Verificacion: `pnpm exec tsc --noEmit`, `pnpm exec convex codegen`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e:start`.

## Critical Technical Context

- Stack real: Next.js 16.2.4, WorkOS/AuthKit, Convex, pnpm.
- Layout real: `app/`, `lib/`, `convex/`; no existe `src/`.
- Alias real: `@/* -> ./*`.
- Convex SGC se consume como `api.sgc.<funcion>`.
- Leer `convex/_generated/ai/guidelines.md` antes de tocar Convex.
- Leer docs locales de Next en `node_modules/next/dist/docs/` antes de cambios App Router.
- Variables requeridas para fase 8: `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_DRIVE_TEMPLATE_MAP`.
- En local puede usarse `GOOGLE_APPLICATION_CREDENTIALS=.local/calaire-app-sgc-0ed7506fc240.json`; `.local/` esta ignorado por git.
- `GOOGLE_DRIVE_SHARED_DRIVE_ID` es opcional para unidades compartidas; falta validacion real con shared drive institucional.
- En cuentas personales usar `GOOGLE_DRIVE_AUTH_MODE=oauth`; el service account queda util para lectura/provisioning, pero no para copiar en Mi unidad por cuota cero.

## Next Steps

1. HECHO: validacion contra Drive real via `pnpm sgc:validate-drive` (22/22 copias validas, 0
   problemas; ronda `R1 - R1`). Ver `drive9.md` (a).
2. HECHO: permisos/visibilidad participante definidos. El participante solo ve el archivo que el
   admin sube a la app (Convex storage, URL firmada); nunca enlaces de Drive. Ver `drive9.md` (b) y
   `lib/sgc/drive-visibility.ts`.
3. HECHO (parcial): shared drive soportado en runtime/provisioning/validacion; tests de cierre
   (Target 11) ampliados. Pendiente unico: ciclo real contra unidad compartida institucional
   (requiere ese recurso). Ver `drive9.md` (c).
4. Cargar/enlazar `EVID-*` solo cuando exista evidencia real.

## Branch Status

- Branch: `feat-drive-sgc`
- Status: dirty, con cambios tracked y varios archivos nuevos sin seguimiento.
- Pending changes: Drive SGC en `convex/sgc/drive.ts`, `convex/sgc.ts`, `convex/_generated/api.d.ts`, `lib/google-drive.ts`, `lib/sgc/drive-google.ts`, `lib/sgc/index.ts`, `scripts/provision-sgc-drive.mjs`, `scripts/google-drive-oauth.mjs`, `package.json`, `.gitignore`, `.env.example`, `dev/drive/*`, `app/(protected)/dashboard/rondas/[id]/sgc/*`, `drive8.md`, `review_drive.md`, logs y cambios previos de fases 1-7.
