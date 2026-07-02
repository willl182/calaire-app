# Drive documental SGC - Fase 1

## Cambios implementados

- Se implemento la API Convex inicial del expediente Drive-like en `convex/sgc/drive.ts`.
- Se expusieron funciones desde `convex/sgc.ts`:
  - `listDriveRecursos`
  - `getDriveTree`
  - `inicializarDriveRonda`
  - `upsertDriveRecurso`
  - `actualizarEstadoDriveRecurso`
  - `retirarDriveRecurso`
- Se agregaron helpers para:
  - normalizar codigos documentales,
  - extraer IDs desde URLs comunes de Google Drive,
  - inferir tipo de recurso desde URL,
  - asociar recursos con `sgcEvidenciaSeries`, `documentosSgc` y `documentoSgcVersiones` cuando existe `formatoRelacionado`.
- `inicializarDriveRonda` crea/reutiliza una raiz virtual `DRIVE_ROOT`, carpetas por `SGC_RONDA_ETAPAS` y documentos esperados por etapa.
- La inicializacion es idempotente por `rondaId + codigo`: reutiliza recursos existentes, crea faltantes y repara parent/metadata de catalogo sin sobrescribir enlaces diligenciados.
- Las mutaciones usan `requireSgcAdmin`; las lecturas usan `requireSgcViewer`.
- Las mutaciones escriben auditoria en `sgcAuditLog` via `writeAudit`.
- Se ejecuto `pnpm exec convex codegen`, actualizando bindings generados en `convex/_generated/api.d.ts`.

## Avances contra targets

- Target 2: validado con `pnpm exec convex codegen`; la tabla `sgcDriveRecursos` queda usable por tipos generados.
- Target 3: implementada la primera version funcional de las funciones Convex del expediente Drive.
- Se mantiene el MVP manual: no hay llamadas a Google API ni dependencia de credenciales.

## Verificacion

- `pnpm exec convex codegen`: OK.
- `pnpm build`: OK.
- `pnpm lint`: OK.
- `pnpm test`: no se ejecuto porque `package.json` no define script `test`.

## Problemas encontrados

- No hubo bloqueos tecnicos en Fase 1.
- El repo ya tenia cambios previos sin seguimiento y modificaciones existentes antes de esta fase, incluyendo `convex/schema.ts`, documentos de plan y logs. No se revirtieron.
- Los validadores de retorno existen en las nuevas configs, pero las respuestas de lista/arbol usan `v.any()` para no duplicar todavia todo el shape documental; se puede endurecer cuando se estabilice la UI.

## Pendientes

- Implementar wrappers server-side en `lib/sgc` para consumir esta API desde Server Components/Actions.
- Construir UI MVP `DriveDocumentalSgc` dentro de `/dashboard/rondas/[id]/sgc`.
- Agregar acciones de UI para inicializar, registrar enlaces, registrar definitivo, marcar diligenciado, no aplica y retirar.
- Probar manualmente con una ronda real/borrador desde el panel SGC.
- Definir integracion Google Drive API, credenciales y carpeta raiz institucional en fases posteriores.
