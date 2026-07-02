# Drive documental SGC - Fase 8

Fecha: 2026-07-02

## Cambios implementados

- Se endurecio la integracion Google Drive API existente para la fase 8:
  - crea la carpeta real de ronda con la convencion `CODIGO_RONDA - Nombre de ronda`;
  - reutiliza IDs existentes de carpeta raiz y subcarpetas antes de crear nuevos recursos;
  - crea/reutiliza subcarpetas reales por etapa;
  - copia plantillas oficiales cuando existe mapeo por `codigo` o por `formatoRelacionado`;
  - omite recursos ya enlazados, diligenciados, retirados o `no_aplica`;
  - conserva fallos parciales como notas automaticas prefijadas sin borrar notas manuales.
- `lib/google-drive.ts` ahora expone estado de configuracion server-side y valida mejor `GOOGLE_DRIVE_TEMPLATE_MAP`.
- `lib/google-drive.ts` ya no envia `includeItemsFromAllDrives` en `POST /files`; `supportsAllDrives=true`
  queda como soporte comun para Drive/shared drives.
- `lib/sgc/drive-google.ts` ahora devuelve conteos de reutilizados, copias, faltantes de plantilla y fallos, y registra auditoria especifica:
  - `sgc.drive.google_api_completado`;
  - `sgc.drive.google_api_parcial`;
  - `sgc.drive.google_api_fallo`.
- Se agrego la mutacion Convex `registrarAutomatizacionDrive` y su wrapper en `lib/sgc`.
- El panel SGC muestra si la automatizacion Google Drive esta lista o pendiente por variables de entorno, y deshabilita `Crear en Google Drive` si faltan credenciales minimas.
- La Server Action `crearDriveGoogleAction` envia el nombre de ronda y muestra un resumen mas preciso de creados, reutilizados, omitidos, sin plantilla y fallidos.
- Se agrego `pnpm sgc:provision-drive` para desplegar la base SGC en Drive desde codigo:
  - crea/reutiliza carpeta base, carpeta de plantillas y las 7 carpetas estandar del catalogo;
  - puede escanear una carpeta Drive existente con plantillas oficiales y generar `GOOGLE_DRIVE_TEMPLATE_MAP`
    por codigo detectado en el nombre del archivo;
  - puede escribir un snippet `.env` con el mapa generado para evitar copiar enlaces uno por uno.
- `lib/google-drive.ts` soporta credenciales por `GOOGLE_APPLICATION_CREDENTIALS` para usar un JSON
  de service account en local sin copiar la private key a `.env.local`.
- `lib/google-drive.ts` tambien soporta `GOOGLE_DRIVE_AUTH_MODE=oauth` con refresh token para cuentas
  personales de Google Drive, donde los service accounts no tienen cuota de almacenamiento.

## Avances frente a Target 8

- Cliente Google Drive server-side: implementado y endurecido.
- Crear carpeta de ronda: implementado con nombre real de ronda.
- Crear subcarpetas: implementado con reutilizacion idempotente.
- Copiar plantillas oficiales: implementado cuando `GOOGLE_DRIVE_TEMPLATE_MAP` contiene el codigo documental o formato operativo.
- Guardar IDs y URLs en Convex: implementado via `upsertDriveRecurso` y extraccion de IDs.
- Reintentar fallos parciales: implementado al volver a pulsar `Crear en Google Drive`; solo procesa faltantes.
- Fallos parciales visibles y auditados: notas por recurso + eventos `sgc.drive.google_api_*`.
- Reintentos idempotentes mas robustos: si existe `webUrl` sin `driveFolderId`, se extrae y guarda el
  ID antes de crear duplicados.
- Auditoria mas precisa: fallos con estructura/documentos reutilizados se registran como parcial, no
  como fallo total.
- Provisioning de base Drive: implementado via `scripts/provision-sgc-drive.mjs`, con dry-run,
  descubrimiento automatico de plantillas y manifest `dev/drive/sgc-drive-base.json`.

## Problemas pendientes

- Provisioning de descubrimiento real ejecutado contra la carpeta Drive
  `10WlUUALhXqNTuVNbdQ6P23nQMv6feoGO`: 53 candidatos, 22 entradas en `GOOGLE_DRIVE_TEMPLATE_MAP`.
- Prueba operativa desde la app ejecutada contra la ronda local `kd7b0emdk7cmzp1vn34f2bfv7986bb77`:
  raiz y 7 subcarpetas reutilizadas en Drive; con OAuth personal se copiaron 22 documentos y quedaron
  8 recursos sin plantilla mapeada.
- Falta definir la estrategia final de permisos Google Workspace para carpetas y documentos creados.
- La automatizacion todavia no asigna permisos Drive por participante; eso corresponde al flujo de permisos/publicacion posterior.
- Para cuentas personales de Google Drive, usar `GOOGLE_DRIVE_AUTH_MODE=oauth`. El service account
  puede leer/crear carpetas, pero las copias en "Mi unidad" fallan con
  `Service Accounts do not have storage quota`.

## Provisioning Drive desde codigo

Para no pasar enlaces uno por uno, suba o ubique las plantillas oficiales en una sola carpeta de
Drive y nombre cada archivo con su codigo documental, por ejemplo `F-PSEA-05 Ficha basica de ronda`.
Luego comparta esa carpeta y la carpeta raiz destino con el service account.

Comandos:

```bash
pnpm sgc:provision-drive -- --dry-run
pnpm sgc:provision-drive -- --discover-templates-from <folderIdPlantillas> --env-output dev/drive/google-drive.env
pnpm sgc:provision-drive -- --discover-templates-from <folderIdPlantillas> --name "SGC CALAIRE BASE" --env-output dev/drive/google-drive.env
```

El script genera `dev/drive/sgc-drive-base.json` con IDs/URLs y, si se pasa `--env-output`, un
snippet con `GOOGLE_DRIVE_TEMPLATE_MAP`. Si solo se quiere generar el mapa sin crear carpetas:

```bash
pnpm sgc:provision-drive -- --discover-only --discover-templates-from <folderIdPlantillas> --env-output dev/drive/google-drive.env
```

En local quedo configurado:

- `GOOGLE_DRIVE_AUTH_MODE=oauth`
- `GOOGLE_DRIVE_OAUTH_CLIENT_ID`, `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID=10WlUUALhXqNTuVNbdQ6P23nQMv6feoGO`
- `GOOGLE_DRIVE_TEMPLATE_MAP` generado en `dev/drive/google-drive.env`

## Code review / fixes (2026-07-02)

Revision completa en `review_drive.md` (seccion Fase 8).

- **F1 (media) — aplicado:** el nombre de la subcarpeta Drive se derivaba de `notas`, campo que
  `saveRecursoLink` sobrescribe con mensajes de estado/error; un reintento podia crear la carpeta con
  el texto del error como nombre. Ahora `automatizarDriveRondaSgc` usa `buildFolderName`, que resuelve
  el slug fisico desde `SGC_RONDA_ETAPAS` por `codigo`. `notas` queda solo como estado/auditoria.
  Verificado con `tsc --noEmit`.
- **F2 (baja) — aplicado:** `createGoogleDriveFolder` ya no pasa `includeItemsFromAllDrives` en un
  create.
- **F3 (baja) — aplicado:** la raiz y subcarpetas reutilizan IDs extraibles de `webUrl` antes de
  crear recursos nuevos, evitando duplicados cuando falta `driveFolderId`.
- **F4 (baja) — aplicado:** el evento `google_api_fallo` ahora considera progreso reutilizado; con
  estructura existente y fallos parciales registra `google_api_parcial`.
- **F5 (nota) — aplicado:** `saveRecursoLink` preserva notas manuales y reemplaza solo estados
  automaticos bajo el prefijo `[Google Drive API]`.
- **F6 (producto) — resuelto:** el participante no accede a Drive ni recibe permisos; es solo
  visualizador. El `definitivo` ahora admite **archivo cargado en la app** (Convex storage), servido al
  participante por URL firmada (`subirDriveDefinitivoAction` + `resolveDefinitivoParticipante`). Los
  definitivos que sean enlace externo de Drive se comparten manualmente como solo lectura. Sin
  asignacion automatica de permisos.

Estado: F1-F6 aplicados.

## Verificacion

- `pnpm exec tsc --noEmit`: paso.
- `pnpm exec convex codegen`: paso.
- `pnpm lint`: paso.
- `pnpm build`: paso.
- `pnpm test`: paso (26 tests; solo warnings ESM `MODULE_TYPELESS_PACKAGE_JSON` existentes).
- `pnpm test:e2e:start`: paso (12 tests autenticados; usa `.auth/workos.json` y Convex dev local).
- `pnpm sgc:provision-drive -- --dry-run --discover-templates-from fakeFolderId --env-output dev/drive/google-drive.env`: paso.
- `pnpm sgc:provision-drive -- --credentials .local/calaire-app-sgc-0ed7506fc240.json --discover-only --discover-templates-from 10WlUUALhXqNTuVNbdQ6P23nQMv6feoGO --env-output dev/drive/google-drive.env`: paso.
- Prueba UI `Crear en Google Drive` con OAuth: paso. Resultado: raiz reutilizada, 7 carpetas
  reutilizadas, 22 copias, 0 fallidos, 8 sin plantilla.
