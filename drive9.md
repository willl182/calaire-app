# Drive documental SGC - Fase 8 (cierre de pendientes)

Fecha: 2026-07-02

Cierra los tres pendientes de `drive8.md`: (a) validacion contra Drive real, (b) permisos/visibilidad
del participante, (c) shared drive + tests de cierre (Target 11).

## (a) Validacion manual contra Drive real

- Nuevo script SOLO LECTURA `scripts/validate-sgc-drive.mjs` (`pnpm sgc:validate-drive`). No crea ni
  modifica nada.
- Recorre cada carpeta de ronda bajo `GOOGLE_DRIVE_ROOT_FOLDER_ID` (detectadas por contener
  subcarpetas de etapa) y verifica por documento:
  1. que la copia tenga id propio y NO reutilice el id de una plantilla maestra
     (`GOOGLE_DRIVE_TEMPLATE_MAP` / `dev/drive/sgc-drive-base.json`);
  2. que no sea un acceso directo (`application/vnd.google-apps.shortcut`) hacia la plantilla;
  3. que cuelgue de una subcarpeta de etapa, no de la raiz de la ronda.
- Soporta OAuth personal y service account, y `GOOGLE_DRIVE_SHARED_DRIVE_ID`.
- **Ejecutado en vivo (OAuth)** contra la carpeta `10WlUUALhXqNTuVNbdQ6P23nQMv6feoGO`, ronda
  `R1 - R1` (`1YSdf_XCha_sXP2RZEEpLr4h-krVvKn74`):
  - 22 documentos revisados, 22 copias validas, 0 problemas.
  - Ninguna copia apunta a una plantilla maestra ni es acceso directo.

## (b) Permisos/visibilidad del participante

Decision: **el participante solo ve el archivo que el admin sube manualmente a la app** (Convex
storage), servido como URL de descarga firmada. Nunca recibe un enlace de Drive: ni el enlace de
trabajo editable (`webUrl`) ni un definitivo que sea enlace externo de Drive.

- Nuevo modulo puro `lib/sgc/drive-visibility.ts`:
  - `definitivoEsArchivoSubido`: true solo si el definitivo tiene `storageId`.
  - `esRecursoVisibleParaParticipante`: no carpeta + `publicaParticipante` + estado no
    retirado/reemplazado/no_aplica + definitivo con archivo subido.
- `convex/sgc/drive.ts`:
  - `listDriveRecursosParticipante` filtra con `esRecursoVisibleParaParticipante` y descarta lo que no
    resuelva a archivo.
  - `resolveDefinitivoParticipante` devuelve solo la URL firmada del storage; para enlace externo de
    Drive devuelve `null` (no se expone).
  - `toParticipanteDto` fija `webUrl: null` siempre; se elimino el respaldo al enlace editable y el
    helper `isPublicableDriveRecurso`/`definitivoDisponible` ya no usados.
- UI:
  - `mi-dashboard`: se quito el boton "Abrir" del enlace editable; queda solo "Descargar" del
    definitivo.
  - `DriveDocumentalSgc`: el texto de ayuda aclara que sin archivo cargado el documento no le aparece
    al participante y que no se comparten enlaces de Drive.

## (c) Shared drive + tests de cierre (Target 11)

- Shared drive: el path de runtime (`lib/google-drive.ts`, crear carpeta / copiar archivo) opera con
  `supportsAllDrives=true`, suficiente para crear/copiar dentro de una unidad compartida cuando el
  padre esta en ella. El listado del provisioning y de la validacion agregan `corpora=drive` +
  `driveId` + `includeItemsFromAllDrives` cuando `GOOGLE_DRIVE_SHARED_DRIVE_ID` esta seteado.
  Pendiente unico: correr un ciclo real contra una unidad compartida institucional (requiere ese
  recurso; no disponible en este entorno).
- Tests de cierre (`lib/sgc/cierre.test.ts`, Target 11): se agregaron casos para `creado` sin
  definitivo (advertencia, no bloqueante), advertencias que no bloquean el cierre, y acumulacion de
  multiples bloqueantes en orden de catalogo.
- Tests nuevos `lib/sgc/drive-visibility.test.ts` cubren la regla de visibilidad del participante.

## Verificacion

- `pnpm exec tsc --noEmit`: paso.
- `pnpm exec convex codegen`: paso.
- `pnpm lint`: paso.
- `pnpm test`: paso (36 tests).
- `pnpm build`: paso.
- `pnpm sgc:validate-drive` (OAuth, Drive real): 22/22 copias validas, 0 problemas.
