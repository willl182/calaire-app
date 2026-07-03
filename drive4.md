# Drive documental SGC - Fase 4

## Cambios implementados

- Se agrego `reemplazarDriveRecurso` en Convex para reemplazar enlaces manuales de Drive con motivo obligatorio.
- El reemplazo conserva el recurso vigente y registra trazabilidad en `sgcAuditLog` con evento `sgc.drive.recurso_reemplazado`, URL anterior, URL nueva y motivo.
- `upsertDriveRecurso` ahora bloquea reemplazos directos sin motivo cuando ya existe un enlace vigente.
- La auditoria distingue eventos manuales relevantes:
  - `sgc.drive.root_registrado` para carpeta raiz.
  - `sgc.drive.recurso_enlazado` para editable operativo.
  - `sgc.drive.definitivo_registrado` para version definitiva.
  - `sgc.drive.recurso_reemplazado` para reemplazos.
- Se expuso el wrapper server-side `reemplazarDriveRecurso` en `lib/sgc/index.ts`.
- Se agrego `reemplazarDriveRecursoAction` en las Server Actions del panel SGC.
- La UI de `DriveDocumentalSgc` separa registrar enlace de reemplazar enlace:
  - Si el recurso no tiene URL, muestra formulario de registro.
  - Si el recurso ya tiene URL, muestra formulario de reemplazo con motivo obligatorio.
- Se mantiene la extraccion automatica de `driveFileId` / `driveFolderId` desde URLs comunes de Google Drive para registros y reemplazos.
- Se mantiene el flujo de `no_aplica` con justificacion obligatoria y auditoria por cambio de estado.

## Avances frente a targets

- Target 3: API backend reforzada con mutacion especifica para reemplazo y auditoria completa del cambio manual.
- Target 4: wrapper server-side actualizado sin importar Convex directamente desde la UI.
- Target 5: UI MVP ahora cubre registro manual, reemplazo con motivo, version definitiva, diligenciado, no aplica y retiro.
- Fase 4 del plan: queda operable el MVP manual sin credenciales Google API.

## Verificacion

- `pnpm exec convex codegen`
- `pnpm lint`
- `pnpm build`

## Problemas pendientes

- Falta prueba manual en navegador con una ronda borrador y URLs reales de Drive.
- El historial de reemplazo queda en auditoria, no como recursos versionados independientes. Esto sigue la opcion MVP del workflow; una tabla/historial completo queda pendiente si se decide exigir trazabilidad documental navegable.
- `no_aplica` guarda la justificacion en `notas` del recurso Drive; no crea ni sincroniza todavia `sgcJustificaciones` por formato.
- No se implemento Google Drive API; sigue bloqueado por decision de autenticacion, credenciales y carpeta raiz institucional.
