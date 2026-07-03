# Targets de entrega: Drive documental SGC

## Target 1: documentación y diseño técnico

Objetivo:

- Dejar cerrado el diseño de la feature antes de implementar más código.

Incluye:

- `plan_drive.md`
- `workflow_drive.md`
- `targets_drive.md`
- Decisión documentada de MVP manual vs integración Google API.
- Modelo inicial de datos y eventos de auditoría.

Criterios de aceptación:

- El equipo puede entender fases, workflow y entregables sin leer el tutorial externo.
- El plan no depende de Drizzle, Prisma, NextAuth ni Clerk.
- El documento identifica qué queda bloqueado por credenciales Google.

Verificación:

- Revisión manual de documentos.

## Target 2: modelo Convex para recursos Drive

Objetivo:

- Persistir el expediente Drive-like por ronda en Convex.

Estado: la tabla ya está en `convex/schema.ts`; falta correr codegen y validar build. Ver definición vigente en `plan_drive.md` (Fase 1).

Incluye:

- Tabla `sgcDriveRecursos` (definida).
- Índices `by_rondaId`, `by_rondaId_and_parentId`, `by_rondaId_and_codigo`, `by_rondaId_and_tipo`, `by_rondaId_and_formatoRelacionado`.
- Tipos de recurso: carpeta, documento, hoja_calculo, PDF, archivo, enlace.
- Estados: pendiente, creado, diligenciado, reemplazado, retirado, no_aplica.

Criterios de aceptación:

- `pnpm exec convex codegen` genera tipos sin errores.
- No se rompe el esquema SGC existente.
- El modelo permite representar carpetas y documentos anidados.

Verificación:

- `pnpm exec convex codegen`
- `pnpm build`

## Target 3: funciones Convex del expediente Drive

Objetivo:

- Crear API backend segura para inicializar, consultar y actualizar recursos Drive.

Ubicación: `convex/sgc/drive.ts`, expuesto desde `convex/sgc.ts`. Helpers de permisos/auditoría en `convex/sgc/shared.ts`.

Incluye:

- `getDriveTree`
- `listDriveRecursos`
- `inicializarDriveRonda`
- `upsertDriveRecurso`
- `actualizarEstadoDriveRecurso`
- `retirarDriveRecurso`
- Helpers para extraer IDs desde URLs de Google Drive.

Criterios de aceptación:

- Solo roles SGC/admin pueden mutar (`requireSgcAdmin`); lecturas con `requireSgcViewer`.
- Las queries y mutations tienen validators de argumentos y de retorno.
- No se aceptan user IDs del cliente para autorización; `createdBy`/`updatedBy` vienen de la identidad Convex.
- La inicialización es idempotente (reutiliza por `rondaId + codigo`).
- Toda mutación escribe auditoría con `writeAudit`.

Verificación:

- `pnpm exec convex codegen`
- `pnpm build`
- Prueba manual en una ronda borrador.

## Target 4: wrappers server-side en `lib/sgc`

Objetivo:

- Exponer funciones del expediente Drive a Server Components y Server Actions.

Incluye:

- Tipos TypeScript del recurso Drive.
- Funciones con `fetchQuery` y `fetchMutation`.
- Uso del token WorkOS existente mediante `sgcToken`.
- Casting centralizado a `Id<...>`.

Criterios de aceptación:

- La UI no importa Convex APIs directamente.
- Los wrappers siguen el patrón actual de `lib/sgc/index.ts`.
- Los tipos son suficientes para renderizar árbol y acciones.

Verificación:

- `pnpm build`
- `pnpm lint`

## Target 5: UI MVP en panel SGC

Objetivo:

- Mostrar expediente documental tipo Drive en `/dashboard/rondas/[id]/sgc`.

Incluye:

- Componente `DriveDocumentalSgc`.
- Vista de carpetas y documentos por sección.
- Botones para abrir enlaces: "Abrir editable" y "Abrir definitivo".
- Formularios para registrar/reemplazar URL editable y para registrar el definitivo.
- Acciones para marcar diligenciado, no aplica y retirar.
- Estados visuales consistentes.

Criterios de aceptación:

- El coordinador puede inicializar expediente desde la página SGC.
- El coordinador puede pegar un enlace Drive en un documento.
- El enlace aparece en el recurso correcto.
- El estado puede cambiar a diligenciado.
- No se crea una ruta `/drive` separada.

Verificación:

- `pnpm build`
- `pnpm lint`
- Prueba manual en navegador.

## Target 6: integración con checklist SGC

Objetivo:

- Conectar los recursos Drive con cobertura documental de la ronda.

Incluye:

- Mostrar enlaces Drive (editable y definitivo) dentro de documentos del expediente.
- Asociar recursos con `formatoOperativo`.
- Mostrar faltantes por documento requerido y definitivos recomendados ausentes.
- No contar retirados como cobertura.

Criterios de aceptación:

- Un documento con recurso diligenciado aparece cubierto en el panel.
- Un documento no aplica muestra justificación.
- Un recurso retirado no se presenta como vigente.

Verificación:

- Prueba manual con al menos tres formatos:
  - uno diligenciado,
  - uno pendiente,
  - uno no aplica.

## Target 7: reparación e idempotencia

Objetivo:

- Permitir ejecutar inicialización varias veces sin duplicar recursos.

Incluye:

- Reutilización de recursos existentes por `rondaId + codigo`.
- Creación de faltantes cuando el catálogo cambia.
- Acción “reparar expediente”.
- Auditoría diferenciada entre inicialización y reparación.

Criterios de aceptación:

- Ejecutar inicialización dos veces no duplica carpetas.
- Si se agrega un nuevo documento al catálogo, reparación lo crea.
- Enlaces existentes no se sobrescriben.

Verificación:

- Prueba manual o test Convex sobre idempotencia.

## Target 8: integración Google Drive API

Objetivo:

- Automatizar creación de carpetas y copias de plantillas.

Dependencias:

- Decisión de autenticación Google.
- Credenciales configuradas.
- Carpeta raíz Drive institucional.
- Plantillas oficiales registradas.

Incluye:

- Cliente Google Drive server-side.
- Crear carpeta de ronda.
- Crear subcarpetas.
- Copiar plantillas oficiales.
- Guardar IDs y URLs en Convex.
- Reintentar fallos parciales.

Criterios de aceptación:

- Una ronda nueva crea carpeta real en Drive.
- Las subcarpetas reales coinciden con el catálogo.
- Los documentos copiados apuntan a copias de ronda, no a plantillas.
- Fallos parciales se muestran y auditan.

Verificación:

- Prueba en Drive sandbox o carpeta institucional de pruebas.
- `pnpm build`
- `pnpm lint`

Code review / fixes (2026-07-02) — ver `review_drive.md`:

- F1 (aplicado): el nombre físico de la subcarpeta Drive se resuelve desde el catálogo
  (`buildFolderName`), no desde `notas`; evita crear carpetas nombradas con mensajes de error en
  reintentos. Verificado con `tsc --noEmit`.
- F2/F3/F4/F5 (documentados): param inútil de shared drive en create, posible raíz duplicada,
  semántica de `google_api_fallo` con progreso previo y sobrescritura de notas manuales.
- F6 (pendiente producto): permisos Google Workspace de las copias antes de producción.

## Target 9: permisos y publicación a participantes

Objetivo:

- Controlar exposición de recursos Drive a participantes.

Incluye:

- Campo o relación de visibilidad participante.
- Query para recursos publicados.
- UI en dashboard participante.
- Auditoría de cambios de visibilidad.

Criterios de aceptación:

- Por defecto ningún recurso interno se publica.
- Solo recursos marcados explícitamente aparecen al participante.
- Un participante no puede ver recursos de otra ronda.

Verificación:

- `pnpm test:e2e:start` si cambia flujo auth/rutas.
- Prueba manual con usuario participante.

Code review / fixes (2026-07-02) — ver `review_drive.md`. Todos aplicados y verificados:

- F1: visibilidad Drive desacoplada de `sgcEvidenciaSeries.publicaParticipante`;
  `sgcDriveRecursos.publicaParticipante` es la fuente de verdad y la mutación no escribe la serie.
- F2: la bandera solo se hereda de la serie al crear, no en `upsert`/reparación.
- F3: al participante se expone el `definitivo`; el editable solo si no hay definitivo.
- F4/F5/F6: se excluye `no_aplica`, gating por estado de ronda y validador de retorno explícito.
- F7: aviso en UI de que publicar aplica a todos los documentos Drive de la misma serie.
- Criterio de aceptación cumplido: cambiar la visibilidad de un documento Drive no altera qué
  evidencias aparecen en "Evidencias publicadas".

## Target 10: cierre documental con Drive

Objetivo:

- Usar estado del expediente Drive como parte del cierre SGC.

Incluye:

- Validación de recursos críticos.
- Lista de faltantes bloqueantes.
- Integración con transición a documentación pendiente/cerrada.

Criterios de aceptación:

- Una ronda con recursos críticos pendientes no puede cerrarse documentalmente.
- Una ronda con editables diligenciados o justificados puede avanzar (el definitivo no es obligatorio).
- Los documentos sin definitivo se muestran como advertencia recomendada, no como bloqueo.
- El mensaje de bloqueo lista documentos concretos.

Verificación:

- Pruebas manuales de transición.
- `pnpm build`
- `pnpm lint`

Code review / fixes (2026-07-02) — ver `review_drive.md`. Todos aplicados y verificados:

- F1: una ronda sin expediente Drive inicializado muestra un único bloqueante accionable y CTA para
  inicializar, no la lista completa del catálogo.
- F2: el gating de UI es específico por etapa; `documentacion_pendiente` usa su subconjunto de
  checklist + Drive, y `cerrar` usa checklist completo + Drive.
- F3: la UI consume los faltantes calculados por los mismos helpers que usan las mutaciones.
- F4: la normalización de códigos Drive se consolidó en `normalizeCodigoDocumento`.
- Verificación: `pnpm exec convex codegen`, `pnpm lint`, `pnpm build`.

## Target 11: pruebas y hardening

Objetivo:

- Reducir regresiones y dejar la feature mantenible.

Incluye:

- Tests de helpers de URL Google.
- Tests de idempotencia de inicialización.
- Tests de autorización básica.
- E2E mínimo del panel SGC si el flujo UI queda estable.

Criterios de aceptación:

- Helpers soportan URLs comunes de Google Drive.
- Mutaciones rechazan usuarios sin rol.
- El panel no rompe rondas sin expediente inicializado.

Verificación recomendada:

- `pnpm exec convex codegen`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e:start` cuando cambie flujo de rutas/auth.

## Orden recomendado de entrega

1. Target 1: documentación.
2. Target 2: modelo Convex.
3. Target 3: funciones Convex.
4. Target 4: wrappers server-side.
5. Target 5: UI MVP.
6. Target 6: checklist SGC.
7. Target 7: reparación.
8. Target 8: Google API.
9. Target 9: participantes.
10. Target 10: cierre documental.
11. Target 11: hardening.

## Definición de MVP

El MVP termina en Target 7.

Debe permitir:

- Inicializar expediente documental por ronda.
- Ver estructura tipo Drive.
- Registrar enlaces Drive manualmente.
- Marcar estados.
- Auditar cambios.
- Reparar estructura sin duplicados.

No requiere:

- Crear carpetas reales vía Google API.
- Copiar plantillas automáticamente.
- Gestionar permisos Drive.
- Publicar recursos a participantes.

## Definición de versión completa

La versión completa termina en Target 11.

Debe permitir:

- Crear estructura real en Google Drive.
- Copiar plantillas oficiales.
- Gestionar fallos parciales.
- Publicar recursos específicos a participantes.
- Usar el expediente Drive para bloquear o permitir cierre documental.
