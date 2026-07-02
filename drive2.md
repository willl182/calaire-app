# Drive documental SGC - Fase 2

Fecha: 2026-07-02

## Cambios implementados

- Se ajusto `AGENTS.md` al layout real del repo: `app/`, `lib/`, alias `@/* -> ./*`, API SGC en `api.sgc.*` y uso de `pnpm exec convex ai-files install`.
- Se agregaron tipos y wrappers server-side en `lib/sgc/index.ts` para:
  - consultar `getDriveTreeSgc`,
  - inicializar/reparar expediente Drive,
  - registrar o actualizar recursos Drive,
  - cambiar estados,
  - retirar recursos.
- Se agregaron Server Actions en `app/(protected)/dashboard/rondas/[id]/sgc/actions.ts` para:
  - inicializar o reparar expediente documental,
  - registrar/reemplazar URL editable,
  - registrar version definitiva,
  - marcar diligenciado,
  - justificar no aplica,
  - retirar recurso.
- Se creo `DriveDocumentalSgc` dentro del panel SGC de ronda:
  - resumen de carpetas, editables, cobertura y definitivos,
  - breadcrumb simple tipo Drive,
  - vista de carpetas y documentos esperados,
  - acciones para abrir editable, copiar enlace y abrir definitivo,
  - formularios para editable, definitivo, no aplica y retiro,
  - estados visuales para pendiente, creado, diligenciado, reemplazado, retirado y no aplica.
- Se integro `DriveDocumentalSgc` en `/dashboard/rondas/[id]/sgc` sin crear ruta `/drive` paralela.
- Se corrigio `convex/sgc/drive.ts` para preservar el estado del recurso cuando el editable no cambia. Esto evita que registrar un definitivo haga retroceder un recurso `diligenciado` a `creado`.

## Avances frente a targets

- Target 4 completado: la UI consume wrappers de `lib/sgc` y no importa Convex directamente.
- Target 5 completado como MVP: el coordinador puede inicializar/reparar, pegar enlaces Drive, cambiar estados y operar recursos desde el panel SGC.
- Base preparada para Target 6: los recursos ya exponen `formatoRelacionado`, enlaces editable/definitivo y estados. Falta reflejar esos enlaces dentro del checklist documental real.

## Verificacion

- `pnpm exec convex codegen`: OK.
- `pnpm lint`: OK.
- `pnpm build`: OK.
- `pnpm test`: no se ejecuto porque `package.json` no define script `test`.

## Problemas y pendientes

- Falta prueba manual en navegador con una ronda borrador y URLs reales de Drive.
- La accion "copiar enlace" usa el boton cliente existente `CopyInvitationLinkButton`; depende de permisos del navegador para clipboard.
- La integracion con checklist SGC todavia no muestra los enlaces Drive dentro de cada documento del checklist. Queda para Target 6.
- Reemplazo historico completo no esta implementado: el MVP actual actualiza el mismo recurso y audita el cambio desde Convex.
- No hay integracion Google API ni creacion real de carpetas/plantillas; sigue pendiente para fases posteriores.
