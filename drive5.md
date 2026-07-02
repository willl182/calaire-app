# Drive documental SGC - Fase 5

## Cambios implementados

- Se agrego `lib/google-drive.ts` como cliente server-side de Google Drive API usando cuenta de servicio y REST directo, sin dependencias nuevas.
- Se agrego `lib/sgc/drive-google.ts` como orquestador de inicializacion automatica:
  - asegura/repara el expediente virtual en Convex,
  - crea la carpeta raiz de ronda dentro de la raiz institucional,
  - crea subcarpetas estandar,
  - copia plantillas oficiales cuando existe mapeo,
  - deja recursos sin plantilla en `pendiente` con nota visible,
  - conserva recursos ya enlazados, diligenciados, retirados o no aplica.
- Se agrego la Server Action `crearDriveGoogleAction` en el panel SGC.
- `DriveDocumentalSgc` ahora muestra el boton `Crear en Google Drive` junto a la reparacion manual del expediente.
- La automatizacion actualiza Convex mediante `upsertDriveRecurso`, por lo que mantiene permisos, auditoria y extraccion de `driveFileId` / `driveFolderId` existentes.

## Variables de entorno requeridas

- `GOOGLE_DRIVE_CLIENT_EMAIL`: email de la cuenta de servicio.
- `GOOGLE_DRIVE_PRIVATE_KEY`: private key PEM de la cuenta de servicio. Puede venir con saltos escapados como `\n`.
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`: carpeta institucional donde se crean las carpetas de ronda.
- `GOOGLE_DRIVE_TEMPLATE_MAP`: JSON opcional para mapear codigo documental o referencia de plantilla a fileId/URL de plantilla. Ejemplo:

```json
{
  "F-PSEA-05": "1abcTemplateFileId",
  "F-PSEA-06": "https://docs.google.com/document/d/1defTemplateFileId/edit"
}
```

- `GOOGLE_DRIVE_SHARED_DRIVE_ID`: opcional, documentado para unidades compartidas; la operacion usa `supportsAllDrives`.

## Avances contra Fase 5

- Cliente Google Drive server-side: implementado.
- Validacion de variables en modulo server: implementada con errores explicitos.
- Crear carpeta de ronda: implementado.
- Crear subcarpetas estandar: implementado.
- Copiar plantillas y renombrar copias: implementado cuando existe mapeo.
- Guardar IDs, URLs y estado en Convex: implementado via wrappers existentes.
- Reintento por fallos parciales: implementado al volver a pulsar `Crear en Google Drive`; solo procesa recursos faltantes.
- No apuntar a plantilla maestra: implementado; el expediente solo guarda la URL de la copia creada.
- No borrar archivos Drive automaticamente: respetado.

## Problemas y pendientes

- No se ejecuto prueba real contra Drive porque requiere credenciales y carpeta sandbox/institucional configuradas.
- Falta confirmar el modelo operativo final de permisos Google Workspace: cuenta de servicio con acceso directo, delegacion de dominio o unidad compartida.
- Falta poblar `GOOGLE_DRIVE_TEMPLATE_MAP` con los fileId reales de plantillas oficiales.
- La auditoria queda registrada como eventos de enlace existentes (`sgc.drive.root_registrado`, `sgc.drive.recurso_enlazado`, `sgc.drive.recurso_actualizado`), no como un evento especifico `sgc.drive.google_api_*`.
- Los fallos parciales se guardan en `notas` del recurso y en el mensaje de la accion; no hay todavia una vista agrupada historica de errores de automatizacion.

## Verificacion

- `pnpm exec convex codegen`
- `pnpm lint`
- `pnpm build`
