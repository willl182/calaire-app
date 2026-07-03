# Plan por fases: Drive documental SGC por ronda

## Contexto y alcance

La feature toma como referencia el patrón del tutorial `t3dotgg/drive-tutorial`: navegación tipo Drive, carpetas, archivos, acciones y ownership. En CALAIRE App no se copia la arquitectura del tutorial porque el stack actual es T3 con Next.js, WorkOS y Convex, sin Drizzle, Prisma ni NextAuth.

El objetivo es crear un expediente documental por ronda que funcione como un Google Drive clone operativo para SGC: estructura por carpetas, documentos esperados, enlaces Drive, estados, auditoría y acciones desde el panel SGC de la ronda.

La integración con Google Drive debe avanzar en dos capas:

- MVP controlado: estructura y enlaces Drive gestionados desde Convex, con pegado/reemplazo manual de URLs reales.
- Integración Google API: creación de carpetas y copias de plantillas usando credenciales institucionales cuando se defina el modelo de autenticación.

## Mapeo tutorial `t3dotgg/drive-tutorial` → CALAIRE App

El tutorial se usa solo como referencia de UX y modelo mental. La implementación real reusa el stack y las convenciones del repo.

| Concepto del tutorial | Equivalente en CALAIRE App |
|-----------------------|----------------------------|
| Base de datos con Drizzle/SingleStore | Convex, tabla `sgcDriveRecursos` (ya definida en `convex/schema.ts`). |
| Auth con Clerk | WorkOS/AuthKit vía Convex auth; roles resueltos con `requireSgcAdmin` / `requireSgcViewer` (`convex/sgc/shared.ts`). |
| Subida de archivos con UploadThing | Sin subida binaria en MVP: se registran enlaces Drive (`webUrl`) y, en Fase 5, copias reales vía Google Drive API. |
| Carpetas/archivos con `parent` self-reference | `sgcDriveRecursos.parentId` (self-reference opcional) + `tipo` (`carpeta`, `documento`, `hoja_calculo`, `pdf`, `archivo`, `enlace`). |
| Ownership por `ownerId` de usuario | Ownership por ronda (`rondaId`) y rol SGC; no se guarda `userId` como argumento de autorización. |
| Ruta dedicada `/drive` | Sin app paralela: la feature vive dentro de `/dashboard/rondas/[id]/sgc`. |
| Datos semilla (`seed`) | Inicialización idempotente desde el catálogo `SGC_RONDA_ETAPAS` (`lib/sgc/catalog.ts`). |

## Estado actual del repo (base de trabajo)

- El repo usa `app/` y `lib/` (aún no migrado a `src/`); no crear estructura paralela sin migración explícita.
- No existe `src/env.ts`; las variables se leen con `process.env` en módulos server de `lib/` (ver `lib/workos.ts`, `lib/mailer.ts`). Las credenciales Google seguirán ese patrón hasta que exista un punto único de env.
- `convex/schema.ts` ya contiene la tabla `sgcDriveRecursos` (ver Fase 1).
- Auditoría vía helper `writeAudit(ctx, ...)` que inserta en `sgcAuditLog`.
- Catálogo de etapas y documentos esperados: `SGC_RONDA_ETAPAS` en `lib/sgc/catalog.ts`.

## Fase 0: Decisiones de base

Objetivo: cerrar supuestos antes de escribir integración irreversible con Google.

Entregables:

- Confirmar si Drive se operará con cuenta institucional, cuenta de servicio con delegación de dominio o OAuth por usuario.
- Definir carpeta raíz institucional de CALAIRE/SGC en Drive.
- Definir política de permisos: solo equipo interno, participantes, o mixto por documento.
- Definir qué documentos se crean desde plantillas Drive y cuáles solo se referencian.
- Confirmar convención de nombres: `CODIGO_RONDA - CODIGO_FORMATO - Nombre`.

Riesgos:

- Sin dueño de credenciales no hay copia automática real.
- OAuth por usuario complica ownership, permisos y trazabilidad.
- Cuenta de servicio sin configuración de dominio puede no acceder a unidades compartidas.

Salida esperada:

- Decisión documentada de autenticación Google.
- Variables de entorno requeridas: como no existe `src/env.ts`, se leen con `process.env` en un módulo server de `lib/` (patrón de `lib/workos.ts`). Documentar aquí el nombre exacto de cada variable Google.
- Lista inicial de plantillas Drive por formato SGC.

## Fase 1: Modelo Convex y expediente virtual

Objetivo: persistir la estructura Drive-like por ronda aunque todavía no exista integración automática con Google.

Estado: la tabla `sgcDriveRecursos` ya está definida en `convex/schema.ts`. Falta ejecutar `pnpm exec convex codegen` y construir la API.

Tabla `sgcDriveRecursos` (definición vigente):

- Identidad y jerarquía: `rondaId` (`v.id('rondas')`), `parentId` (self-reference opcional a `sgcDriveRecursos`), `codigo`, `nombre`, `fase`.
- Tipo de recurso: `tipo` ∈ `carpeta | documento | hoja_calculo | pdf | archivo | enlace`.
- Proveedor: `proveedor` = `google_drive` (literal, extensible a futuro).
- Relaciones opcionales: `documentoSgcId`, `documentoSgcVersionId`, `evidenciaSerieId`, `formatoRelacionado`.
- Recurso Drive (editable/principal): `driveFileId`, `driveFolderId`, `webUrl`, `templateUrl`. Para documentos, `webUrl` apunta al Google Doc/Sheet vivo; para carpetas, `driveFolderId`/`webUrl` a la carpeta.
- Versión definitiva: `definitivo` (objeto opcional `{ driveFileId?, webUrl, tipo? }`) — copia congelada/registro, típicamente PDF exportado. Recomendada, no bloqueante para el cierre.
- Estado: `pendiente | creado | diligenciado | reemplazado | retirado | no_aplica`.

### Editable vs definitivo

Cada documento esperado puede tener dos enlaces reales de Google Drive:

- **Editable**: documento vivo donde el equipo trabaja (`webUrl` / `driveFileId`).
- **Definitivo**: versión final e inmutable como evidencia (`definitivo.webUrl`), normalmente un PDF exportado o copia bloqueada.

Semántica de estado: `creado` cuando existe editable; `diligenciado` cuando el editable está completo. El definitivo se registra aparte y no cambia el estado por sí mismo. Regla de cierre (Fase 7): **basta el editable `diligenciado`**; el definitivo es recomendado pero no bloquea.
- Auditoría de fila: `notas`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Índices: `by_rondaId`, `by_rondaId_and_parentId`, `by_rondaId_and_codigo`, `by_rondaId_and_tipo`, `by_rondaId_and_formatoRelacionado`.

Funciones Convex:

- `listDriveRecursos(rondaId)`
- `getDriveTree(rondaId)`
- `inicializarDriveRonda(rondaId)`
- `upsertDriveRecurso(...)`
- `actualizarEstadoDriveRecurso(...)`
- `retirarDriveRecurso(...)`

Reglas:

- No aceptar `userId` como argumento para autorización; usar identidad WorkOS vía Convex auth.
- Toda mutación sensible exige rol SGC/admin.
- Toda creación o cambio relevante escribe `sgcAuditLog`.
- La inicialización debe ser idempotente: si ya existe expediente Drive para la ronda, reutiliza y completa faltantes.

Salida esperada:

- Una ronda puede tener árbol documental persistido en Convex.
- La app distingue carpetas, documentos esperados y enlaces existentes.
- El expediente virtual puede inicializarse sin Google API.

## Fase 2: UI Drive clone dentro del panel SGC

Objetivo: mostrar y operar el expediente documental desde `/dashboard/rondas/[id]/sgc`.

Componentes:

- Panel resumen de Drive documental.
- Breadcrumb tipo Drive por carpeta/sección.
- Lista de carpetas y documentos esperados.
- Acciones por recurso: abrir, copiar enlace, editar enlace, marcar diligenciado, reemplazar, retirar, justificar no aplica.
- Estados visuales claros para pendiente, creado, diligenciado, reemplazado, retirado y no aplica.

Integración con UI existente:

- Mantener `RondaContextNav`.
- Insertar el bloque dentro de `ExpedienteSgc` o componente dedicado `DriveDocumentalSgc`.
- No crear una app paralela `/drive`; esta feature vive dentro del expediente SGC de ronda.

Salida esperada:

- El coordinador ve una experiencia tipo Drive en la ronda.
- Puede pegar enlaces Drive reales y cambiar estados.
- Los documentos del checklist muestran su enlace cuando exista.

## Fase 3: Inicialización documental SGC

Objetivo: generar la estructura estándar de carpetas y documentos esperados por ronda.

Estructura inicial:

- `01_planificacion_ronda`
- `02_comunicaciones_participantes`
- `03_preparacion_item`
- `04_datos_y_preprocesamiento`
- `05_homogeneidad_estabilidad`
- `06_analisis_e_informe`
- `07_cierre_sgc`

Fuente:

- Reutilizar `SGC_RONDA_ETAPAS` (`lib/sgc/catalog.ts`) como catálogo de carpetas y documentos. Cada etapa aporta `numero`, `nombre`, `carpeta` (nombre real de carpeta) y `documentos[]`.
- Por cada etapa: crear un recurso `tipo: 'carpeta'` con `codigo = etapa.key`, `nombre = etapa.nombre`, `fase = etapa.foco` y `parentId = <raíz de ronda>`.
- Por cada `documento` de la etapa: crear un recurso hijo con `codigo = documento.codigo`, `nombre = documento.nombre` y `formatoRelacionado = documento.formatoOperativo` cuando exista.
- Mapear `documento.formatoOperativo` contra `sgcEvidenciaSeries` (campo `formato`) para vincular `evidenciaSerieId`.
- Marcar como críticos los documentos cuyo formato tenga `critico: true` en `SGC_FORMATOS_FASE_1` (relevante para el cierre, Fase 7).
- Cuando exista documento maestro vigente por código, guardar relación con `documentosSgc` y `documentoSgcVersiones`.

Reglas:

- No duplicar carpetas/documentos si se ejecuta dos veces.
- Crear faltantes si el catálogo cambia.
- No sobrescribir enlaces ya diligenciados.
- Auditar inicialización, reparación y cambios de enlace.

Salida esperada:

- Acción “Inicializar expediente documental”.
- Árbol estándar creado por ronda.
- Documentos esperados asociados al checklist SGC.

## Fase 4: Integración manual con Google Drive

Objetivo: habilitar operación real sin credenciales Google API.

Acciones:

- Registrar carpeta raíz Drive de la ronda pegando URL y/o folderId.
- Registrar URL por documento o carpeta.
- Extraer `driveFileId` o `driveFolderId` desde URLs comunes de Drive cuando sea posible.
- Permitir reemplazo con motivo.
- Permitir marcar “no aplica” con justificación.

Ventajas:

- Entrega valor inmediato.
- Evita bloquear la feature por OAuth o administración Google Workspace.
- Permite validar nomenclatura y workflow con usuarios reales.

Salida esperada:

- Expediente navegable con enlaces funcionales.
- Auditoría completa de enlaces registrados y reemplazos.
- Base estable para automatización posterior.

## Fase 5: Google Drive API

Objetivo: crear carpetas y copiar plantillas automáticamente.

Componentes técnicos:

- Cliente Google Drive en una capa server-side, no en componentes (p. ej. `lib/google-drive.ts`, siguiendo el patrón `process.env` de `lib/workos.ts` mientras no exista `src/env.ts`).
- Variables de entorno validadas en ese módulo server; documentar nombre y rotación.
- Convex action para llamadas externas si se decide ejecutar desde Convex (las queries/mutations no pueden hacer fetch; requieren `action`).
- Alternativa Next server action si se decide mantener Google API del lado app.

Operaciones Google:

- Crear carpeta de ronda dentro de la raíz institucional.
- Crear subcarpetas estándar.
- Copiar archivos plantilla oficiales.
- Renombrar copias con convención de ronda.
- Guardar `driveFileId`, `driveFolderId`, `webUrl` y estado.

Reglas:

- La copia automática nunca debe apuntar el expediente a la plantilla maestra.
- Si una copia falla, registrar el recurso en estado `pendiente` con error/notas.
- Reintento por recurso y reparación general del expediente.
- No borrar archivos Drive automáticamente en MVP de integración; retirar en app debe marcar estado y auditar.

Salida esperada:

- Inicialización automática de Drive desde el panel SGC.
- Copias reales de plantillas en carpeta de ronda.
- Reintentos por fallos parciales.

## Fase 6: Permisos y participantes

Objetivo: controlar qué enlaces se exponen a participantes.

Alcance:

- Mantener default interno (`requireSgcViewer` expone `canReadInternal`; el participante no lo tiene).
- Reusar el campo `publicaParticipante` que ya existe en `sgcEvidenciaSeries` cuando el recurso esté vinculado a una serie; para recursos sin serie, decidir si se agrega `publicaParticipante` a `sgcDriveRecursos` o se deriva de la serie asociada.
- Integrar con dashboard del participante cuando aplique.
- Evitar exponer carpetas internas completas por accidente.

Reglas:

- Un enlace Drive visible para participante debe estar explícitamente marcado.
- La UI participante solo muestra recursos publicados.
- La app no debe asumir que un permiso Drive equivale a permiso CALAIRE.

Salida esperada:

- Recursos internos protegidos.
- Recursos publicados visibles desde la vista participante.
- Auditoría de cambios de visibilidad.

### Code review / fixes (2026-07-02)

Revisión completa en `review_drive.md`. Hallazgos que ajustan el diseño de esta fase:

- **F1 (alta):** reutilizar `sgcEvidenciaSeries.publicaParticipante` como escritura acopla la
  visibilidad Drive con "Evidencias publicadas" (`getEvidenciasPublicas`). Decisión de diseño
  corregida: `sgcDriveRecursos.publicaParticipante` es la **única fuente de verdad** de la
  visibilidad Drive; la mutación de visibilidad Drive no debe escribir en la serie. La herencia
  desde la serie queda solo como default de lectura al crear.
- **F2 (media-alta):** la bandera no debe re-heredarse de la serie en cada `upsert`/reparación;
  solo al crear el recurso.
- **F3 (media):** a participantes se debe exponer preferentemente el `definitivo`, no el enlace
  editable vivo (permiso Drive ≠ permiso CALAIRE).
- **F4/F5/F6/F7:** excluir `no_aplica` del listado participante, gating por estado de ronda,
  validador de retorno explícito, y documentar la propagación por serie.

## Fase 7: Cierre documental y calidad

Objetivo: integrar Drive documental al cierre SGC.

Validaciones:

- Recursos requeridos tienen enlace editable o justificación.
- Formatos críticos están diligenciados, no aplica o reemplazados con motivo.
- El **editable `diligenciado` es suficiente** para cerrar; el definitivo se recomienda y se resalta como faltante si no existe, pero **no bloquea**.
- Evidencias con estado retirado no cuentan como cobertura vigente.
- Checklist SGC muestra faltantes del expediente Drive, incluyendo definitivos recomendados ausentes.

Salida esperada:

- El cierre documental considera el estado del Drive documental.
- La auditoría permite reconstruir quién creó, reemplazó o retiró enlaces.
- Reporte de faltantes por ronda.

### Code review / fixes (2026-07-02)

Revisión completa en `review_drive.md`. Hallazgos que ajustan el diseño de esta fase:

- **F1 (alta):** `collectDriveCierreCalidad` bloquea toda ronda **sin expediente Drive
  inicializado** (un bloqueante por documento del catálogo). Como `inicializarDriveRonda` es
  manual, las rondas preexistentes no pueden transicionar. Decisión de diseño: cuando el expediente
  no está inicializado, emitir un **único** bloqueante accionable ("expediente no inicializado") y
  ofrecer la CTA de inicialización, en vez de N bloqueantes por documento.
- **F2 (media):** el gating del botón de UI debe ser **por etapa**: para `documentacion_pendiente`
  reflejar el subconjunto real que valida la mutación; para `cerrar`, el checklist completo. Hoy la
  UI usa el checklist completo para ambos y deshabilita transiciones que el backend permitiría.
- **F3 (baja):** unificar la fuente de faltantes entre UI y mutación (`collectChecklistFaltantes`)
  para que la lista mostrada coincida con el mensaje de error.
- **F4 (baja):** consolidar `normalizeCodigo`/`normalizeCodigoDocumento` en un helper compartido; el
  emparejamiento init↔cierre depende de que ambos normalicen igual.

Estado: aplicado y verificado el 2026-07-02.

- Sin expediente Drive: un único bloqueante accionable y CTA de inicialización desde el cierre.
- Gating UI por etapa: `documentacion_pendiente` usa el subconjunto validado por su mutación; `cerrar`
  usa el checklist completo.
- Faltantes UI/mutación: el panel expone los faltantes calculados por los mismos helpers Convex.
- Normalización: `convex/sgc/drive.ts` reutiliza `normalizeCodigoDocumento` de `shared.ts`.

## Fase 8: Observabilidad y mantenimiento

Objetivo: hacer la feature operable en producción.

Entregables:

- Estados de error claros por recurso.
- Eventos de auditoría normalizados.
- Pruebas unitarias de idempotencia e inicialización.
- Pruebas e2e de flujo básico en panel SGC.
- Documentación de variables Google y rotación de credenciales.

Salida esperada:

- Feature mantenible sin depender de conocimiento tribal.
- Diagnóstico rápido de fallos de Drive API.
- Camino claro para ampliar a Google Calendar u otras integraciones.

### Code review / fixes (2026-07-02)

Revisión completa en `review_drive.md`. Hallazgos que ajustan el diseño de esta fase:

- **F1 (media):** el nombre físico de la subcarpeta Drive se derivaba de `notas`, campo que
  `saveRecursoLink` sobrescribe con mensajes de estado/error; un reintento podía crear la carpeta con
  el texto del error como nombre. Corregido: el nombre se resuelve desde `SGC_RONDA_ETAPAS` por
  `codigo` de etapa (`buildFolderName`); `notas` queda solo como campo de estado/auditoría.
- **F2 (baja):** `createGoogleDriveFolder` pasa un parámetro de `list` (`includeItemsFromAllDrives`)
  en un create; el flujo de unidades compartidas debe validarse con una unidad real antes de
  publicitarlo.
- **F3 (baja):** la raíz se recrea si hay `webUrl` pero no `driveFolderId`, arriesgando una carpeta
  raíz duplicada; se recomienda intentar extraer el id de `webUrl` antes de recrear.
- **F4/F5 (baja):** normalizar la semántica del evento `google_api_fallo` cuando ya hay estructura y
  preservar notas manuales de coordinador al automatizar.
- **F6 (producto):** definir permisos Google Workspace de las copias antes de producción (exponer
  definitivo, no editable).

Estado: F1 aplicado y verificado (`tsc --noEmit`); F2–F5 documentados como fix sugerido; F6 pendiente
de decisión de producto.
