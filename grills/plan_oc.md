# Plan OC: Panel SGC por ronda en CALAIRE-APP

Fecha: 2026-06-07

## Objetivo

Implementar un panel SGC por ronda que centralice el cierre documental y operativo de los registros asociados a una ronda de ensayo de aptitud, sin convertir CALAIRE-APP en un gestor documental general.

La app debe cubrir nativamente los registros transaccionales que ya controla o que son necesarios para el flujo de ronda, y permitir evidencias por archivo para formatos que dependen de cálculos, preparación técnica o documentación externa.

## Alcance fase 1

La fase 1 incluye solo el panel SGC por ronda.

Incluye:

- Pestaña `SGC` en `/dashboard/rondas/[id]/sgc`.
- Tabla/checklist agrupada por fase.
- Plan de ronda nativo basado en la plantilla `F-PPSEA-03` compartida, aunque el código queda provisional hasta lista maestra documental.
- Registro F-13 nativo como checklist manual.
- Evidencias por archivo para formatos no nativos de fase 1.
- Carga de archivos en Convex Storage con metadata automática.
- Historial de evidencias, sin borrado.
- Estados de ronda ampliados con `documentacion_pendiente`.
- Vistas imprimibles a PDF para F-06/F-13 equivalentes, con estado/fechas y listado de evidencias.
- Plantillas P-20 en Markdown con variables explícitas, enlazadas desde el panel SGC.
- Bitácora SGC mínima para acciones clave.

No incluye en fase 1:

- Gestor documental general.
- NC/CAPA.
- Quejas/apelaciones.
- Proveedores, competencias, auditorías o riesgos.
- Emails reales.
- Notificaciones in-app.
- Cron automático.
- Integración estructurada con `pt_app`.
- Cálculos nativos de homogeneidad, estabilidad o estadística final.

## Principios acordados

- El panel se organiza por ronda, no por repositorio documental global.
- Lo no transaccional queda fuera de la app por ahora.
- Los formatos de ronda que no sean nativos se cubren con archivos versionados como evidencia puente.
- Los códigos SGC, salvo lo observado en plantillas, se consideran provisionales hasta revisar la lista maestra documental.
- El catálogo SGC vive en código, no editable desde UI.
- El panel usa baja fricción operativa, aunque algunas decisiones reducen control documental fino.

## Formatos fase 1

| Fase | Formato | Modo fase 1 | Criterio de cobertura |
|---|---|---|---|
| Planificación | `F-PPSEA-03` / Plan de Ronda | Nativo | Registro finalizado en la app |
| Participación | `F-PSEA-05` provisional | Nativo existente | Participantes `member` con `claimedAt` |
| Participación | `F-PSEA-05A` provisional | Nativo existente | Fichas `estado='enviado'` |
| Participación | `F-PSEA-07` provisional | Nativo existente | Participantes `member` con `participantCode` único |
| Recepción de datos | `F-PSEA-12` provisional | Nativo existente | Reportes finales completos de participantes `member` |
| Revisión de datos | `F-PSEA-13` provisional | Nativo nuevo | Checklist manual finalizado |
| Evidencia técnica | `F-PSEA-08` provisional | Archivo | Evidencia vigente cargada |
| Evidencia técnica | `F-PSEA-09` provisional | Archivo | Evidencia vigente cargada |
| Evidencia técnica | `F-PSEA-10` provisional | Archivo | Evidencia vigente cargada |
| Evidencia técnica | `F-PSEA-14` provisional | Archivo | Evidencia vigente cargada |
| Logística | `F-PSEA-11` provisional | No aplica | Marcado como `no_aplica`, porque los ítems se generan in situ |

## Estados del panel

Cada formato puede mostrarse con uno de estos estados:

- `no_aplica`
- `pendiente`
- `cubierto_nativo`
- `cubierto_archivo`
- `requiere_revision`

Los formatos nativos existentes calculan estado automáticamente y no permiten override manual en fase 1.

## Plan de ronda nativo

El plan de ronda usa la plantilla compartida `Planificacion_R1_PP (1).md`, identificada como `F-PPSEA-03`.

Decisiones:

- Se implementa como un documento por ronda con bloques internos `a` a `u`.
- Cada bloque es editable.
- La plantilla base vive como constante versionada en código.
- Los bloques se inicializan con textos plantilla editables.
- Se autocompleta lo que la app ya conoce cuando sea práctico.
- Solo algunos literales tienen subcampos críticos estructurados.
- Las evidencias por literal se cargan usando el mismo sistema de evidencias, con `seccion='a'...'u'`.

Subcampos críticos iniciales:

- `d`: número y tipo de participantes esperados.
- `f`: rangos esperados por contaminante.
- `j/k`: cronograma de hitos.
- `o`: análisis estadístico.
- `p`: trazabilidad e incertidumbre de valores asignados.
- `r`: criterio de evaluación de desempeño.

El cronograma de F-06/F-PPSEA-03 será de hitos simples, no calendario completo.

Campos por hito:

- Nombre.
- Fecha objetivo.
- Fecha real opcional.
- Responsable.
- Estado.
- Notas.

Los hitos no disparan recordatorios automáticos en fase 1.

## F-13 revisión de datos

F-13 es manual, no automático.

Decisiones:

- Revisa solo datos ya capturados en CALAIRE-APP.
- Muestra métricas de apoyo, pero el checklist formal es manual.
- El checklist es fijo en código.
- Cada ítem usa checkbox simple.
- Puede finalizarse aunque haya ítems sin marcar.
- No exige observación final obligatoria.
- El responsable formal es el admin autenticado que finaliza.

Métricas de apoyo sugeridas:

- Participantes esperados.
- Envíos finales.
- Completitud.
- Celdas faltantes.
- Estado de exportación CSV.

## Evidencias por archivo

Las evidencias se cargan en Convex Storage.

Decisiones:

- Solo se pide archivo al usuario.
- La app registra metadata automática.
- La última carga queda vigente automáticamente.
- Se conserva historial.
- No se permite borrar evidencias en fase 1.
- Las evidencias muestran versión automática incremental: `v1`, `v2`, `v3`.
- Tipos permitidos: PDF, DOCX, XLSX, CSV, PNG/JPG.
- Límite inicial recomendado: 10 MB por archivo.

Metadata automática sugerida:

- `rondaId`
- `codigoFormato`
- `seccion` opcional
- `storageId`
- `fileName`
- `contentType`
- `size`
- `versionNumber`
- `isCurrent`
- `uploadedBy`
- `uploadedAt`

## PDF imprimible

F-06/F-PPSEA-03 y F-13 deben tener vista formal imprimible/descargable a PDF desde navegador.

Decisiones:

- No basta con mostrar el registro en la app.
- El PDF incluye contenido del formato.
- El PDF incluye estado y fechas, sin usuarios.
- El PDF lista evidencias relacionadas.
- No incrusta los archivos de evidencia.
- No incluye bitácora completa.

Aunque los códigos estén pendientes de verificación documental, la app permitirá generar PDF final sin marca de borrador.

## Snapshots e historial

F-06/F-PPSEA-03 y F-13 pueden editarse directamente aun si están finalizados.

Para preservar trazabilidad:

- Se guardan snapshots históricos.
- No se muestra número de versión para estos registros.
- Los snapshots se identifican por fecha y usuario.
- El historial de snapshots es visible para admins en una sección colapsable.

Esto difiere de las evidencias por archivo, que sí muestran versión incremental `v1`, `v2`, `v3`.

## Estados de ronda

El estado actual `cerrada` debe significar cierre final documental/operativo, no solo cierre de recepción.

Se agrega el estado:

- `documentacion_pendiente`

Flujo acordado:

- `borrador -> activa -> documentacion_pendiente -> cerrada`

Significado de `documentacion_pendiente`:

- La recepción de resultados está cerrada.
- Participantes ya no pueden enviar/modificar F-12.
- Participantes sí pueden consultar sus datos enviados.
- Coordinador completa F-13, carga F-08/F-09/F-10/F-14 y cierra documentación.

Requisitos para pasar de `activa` a `documentacion_pendiente`:

- F-05 cubierto.
- F-05A cubierto.
- F-07 cubierto.
- F-12 cubierto.
- Plan de ronda finalizado.

Requisitos para pasar de `documentacion_pendiente` a `cerrada`:

- Todo el panel SGC cubierto o no aplica.
- F-08/F-09/F-10/F-14 con evidencia vigente.
- F-13 finalizado.
- F-11 en `no_aplica`.

Reapertura:

- Una ronda `cerrada` puede reabrirse a `documentacion_pendiente`.
- No vuelve a `activa` por defecto.

## Plantillas P-20

P-20 fase 1 incluye solo plantillas, no motor de comunicación.

Decisiones:

- Plantillas en Markdown dentro del repo.
- Enlaces a plantillas desde la pestaña SGC.
- Variables explícitas con placeholders.
- No emails reales.
- No notificaciones in-app.
- No cron automático.

Plantillas mínimas sugeridas:

- Invitación a participar.
- Recordatorio de plazo.
- Cambio de cronograma.
- Resultados disponibles.
- Cierre de recepción.

Variables sugeridas:

- `{{ronda_codigo}}`
- `{{ronda_nombre}}`
- `{{fecha_limite}}`
- `{{enlace_app}}`
- `{{contacto_calaire}}`

## UI propuesta

Ubicación:

- Nueva pestaña `SGC` en `RondaContextNav`.

Layout:

- Tabla/checklist agrupada por fase.
- Resumen superior de progreso.
- Lista de bloqueantes para transición de estado.
- Acciones por formato.

Columnas sugeridas:

- Código.
- Nombre.
- Modo.
- Estado.
- Registro/evidencia vigente.
- Última actualización.
- Acción principal.

Agrupación:

- Planificación.
- Participación/registro.
- Recepción de datos.
- Análisis/evidencia técnica.
- No aplica.

## Modelo de datos propuesto

Tablas nuevas sugeridas:

- `sgcPlanRonda`
- `sgcRevisionDatos`
- `sgcEvidencias`
- `sgcAuditLog`
- `sgcRegistroSnapshots`

Cambios a `rondas`:

- Agregar estado `documentacion_pendiente` al union de estados.
- Actualizar reglas de transición.
- Bloquear envíos de participantes en `documentacion_pendiente` y `cerrada`.

Catálogo en código:

- `lib/sgc/catalog.ts`
- `lib/sgc/templates.ts`
- Plantillas P-20 Markdown en carpeta por definir, por ejemplo `docs/sgc/comunicaciones/`.

## Riesgos y tradeoffs aceptados

- Los códigos documentales son provisionales, pero se permitirá PDF final sin marca de borrador.
- F-13 puede finalizarse con checks pendientes y sin justificación obligatoria.
- F-06/F-13 finalizados pueden editarse directamente, mitigado con snapshots.
- No se implementa proveedor de email en fase 1.
- No se implementa gestor documental general.
- La lista maestra documental debe revisarse antes de uso oficial/auditoría.

## Orden de implementación sugerido

1. Confirmar guía de Convex y Next antes de editar código.
2. Crear catálogo SGC en código y plantillas base.
3. Ampliar estado de ronda con `documentacion_pendiente`.
4. Crear schema Convex para evidencias, plan, revisión, snapshots y audit log.
5. Implementar carga de evidencias con Convex Storage.
6. Implementar pestaña SGC con tabla/checklist.
7. Implementar F-06/F-PPSEA-03 nativo por bloques.
8. Implementar F-13 manual con métricas de apoyo.
9. Implementar vistas imprimibles para F-06/F-13.
10. Enlazar plantillas P-20 Markdown desde SGC.
11. Bloquear transiciones de estado según cobertura SGC.
12. Verificar participantes en `documentacion_pendiente`: lectura sin edición.
