# Drive documental SGC - Fase 3

Fecha: 2026-07-02

## Cambios implementados

- Se reforzo `inicializarDriveRonda` para crear y reparar la estructura estandar desde `SGC_RONDA_ETAPAS`.
- Las carpetas de etapa ahora quedan con nombre humano de etapa (`etapa.nombre`) y conservan el nombre real de carpeta (`etapa.carpeta`) en notas.
- Se agrego el campo `critico` a `sgcDriveRecursos` para marcar documentos cuyo `formatoOperativo` existe en `SGC_FORMATOS_FASE_1` con `critico: true`.
- La inicializacion vincula recursos con `sgcEvidenciaSeries` por `formatoOperativo` y con documentos maestros por codigo documental disponible.
- La reparacion idempotente actualiza metadatos faltantes o desalineados sin sobrescribir enlaces `webUrl`, definitivos ni estados diligenciados.
- La auditoria diferencia ejecuciones nuevas (`sgc.drive.inicializado`) de ejecuciones de reparacion/reintento (`sgc.drive.reparado`).
- La UI muestra una etiqueta `Critico` en los recursos Drive que aplican.

## Avances

- La accion "Inicializar expediente documental" crea raiz, 7 carpetas estandar y documentos esperados por ronda.
- La accion "Reparar expediente" puede ejecutarse repetidamente sin duplicar por `rondaId + codigo`.
- Si cambia el catalogo, la mutacion crea faltantes y repara relaciones con evidencia/documento maestro.
- Los wrappers server-side y tipos de `lib/sgc` exponen `critico` a la UI.

## Verificacion

- `pnpm exec convex codegen`: exitoso.
- `pnpm lint`: exitoso.
- `pnpm build`: exitoso.

No se ejecuto `pnpm test` porque `package.json` no define ese script.

## Problemas y pendientes

- Falta prueba manual en navegador con una ronda borrador y URLs reales de Drive.
- Sigue pendiente decidir si el reemplazo debe conservar historial completo creando un nuevo recurso vigente o si basta actualizar el recurso actual con auditoria.
- La integracion con checklist documental real queda para el Target 6.
- La creacion automatica en Google Drive sigue bloqueada por decision de autenticacion, credenciales y carpeta raiz institucional.
