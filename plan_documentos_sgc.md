# Context

SGC necesita incorporar tres registros nuevos por ronda y ampliar instrucciones entregadas a participantes. Objetivo: documentar inicio presencial, rotulado anónimo e instrumentos Calaire usados; mantener trazabilidad por ronda; publicar solo documentos acordados a participantes; mostrar pendientes críticos sin bloquear técnicamente cierre.

Alcance confirmado:

- `F-PSEA-19`: acta de inicio generada desde datos de ronda/F-PSEA-03, impresa, firmada a mano, escaneada y publicada como PDF.
- `F-PSEA-20`: etiquetas anónimas diligenciadas manualmente. Modelo visual llegará después; primera versión será placeholder válido y cargable.
- `F-PSEA-21`: relación nativa de instrumentos Calaire usados. Documento distinto de `F-PSEA-04`.
- `I-PSEA-02`: anexos A y B integrados en mismo instructivo.
- Relación documental principal: `P-PSEA-01`, con anclajes adicionales a procedimientos operativos aplicables.
- Mapa documental SGC debe incorporar nodos y relaciones de F19, F20, F21 y nueva versión de I-PSEA-02.
- Instrucciones, acta, calendario y cronograma visibles a participantes; F20/F21 internos.
- Todos aparecen como críticos en checklist, pero no forman cadena de fuerza ni bloquean cierre.

# Implementación recomendada

## 1. Actualizar documentos maestros

1. Crear `F-PSEA-19 Acta de inicio` en DOCX usando formato institucional:
   - Ronda, fecha tomada del calendario y lugar tomado del dato existente de Laboratorio Calaire.
   - Texto breve: inicio formal de ronda y referencia a `F-PSEA-21`.
   - Tabla precargada desde `F-PSEA-03` con columnas `Nombre`, `Entidad`, `Firma`.
   - Todos participantes y dos organizadores.
2. Crear `F-PSEA-20 Rotulado anónimo` como archivo placeholder válido basado en plantilla de formato. Sin inventar diseño de etiqueta; queda listo para reemplazo versionado cuando llegue modelo.
3. Crear especificación maestra de `F-PSEA-21 Relación de instrumentos Calaire usados`:
   - Siete mínimos: cuatro analizadores, aire cero, calibrador dinámico y cilindro; permite agregar más.
   - Campos: ronda, tipo, código interno, marca, modelo, serial/identificación, foto general, foto de placa/serial, observaciones, técnico y validación de coordinador.
   - Sin campo de estado técnico.
4. Ampliar `I-PSEA-02` en MD y DOCX:
   - Anexo A: instalación, calibración y medición; solo operación normal.
   - Anexo B: descarga/recepción de datos, promedios horarios según cronograma, umbral mínimo 75 %, incertidumbre por método propio documentado, unidad, `k`, nivel de confianza, carga en F-PSEA-08 y archivo original obligatorio.
5. Actualizar procedimientos y relaciones documentales en MD/DOCX, manteniendo sincronía:
   - `P-PSEA-01`: protocolo padre de F19, F20, F21 e I-PSEA-02; corregir referencias obsoletas.
   - `P-PSEA-03 Control de registros y evidencias`: conservación, versionamiento y evidencia de ronda para F19/F20/F21.
   - `P-PSEA-04 Planificación de ronda`: preparación del acta, calendario, asistentes y responsables antes del inicio.
   - `P-PSEA-05 Comunicaciones`: entrega por correo de I-PSEA-02 con anexos, calendario, cronograma y acta publicada.
   - `P-PSEA-06 Preparación y control del ítem`: uso de F20 para rotulado y F21 para instrumentos Calaire usados.
   - `P-PSEA-08 Flujo técnico de datos`: Anexo B de I-PSEA-02, archivo original, promedios horarios, incertidumbre y F-PSEA-08.
   - `P-PSEA-19 Confidencialidad operativa`: códigos anónimos y visibilidad restringida de F20/F21.
   - `P-PSEA-20 Competencia y autorización`: responsabilidades de técnico operativo y coordinador en F21.
6. Actualizar árbol, diccionario, inventario y trazabilidad en `docs/01_bloque_general/05_matrices_inventarios/`.
7. Actualizar mapa documental funcional y sus seeds para mostrar formatos nuevos, procedimientos padre y flujo hacia registros de ronda.

Archivos representativos:

- `docs/01_bloque_general/02_procedimientos/P-PSEA-01 Protocolo General EA_v2.docx`
- `docs/01_bloque_general/03_instructivos/I-PSEA-02 Instructivo participante calaire-app.md`
- `docs/01_bloque_general/03_instructivos/I-PSEA-02 Instructivo participante calaire-app.docx`
- `docs/01_bloque_general/04_formatos_maestros/F-PSEA-19 ...`
- `docs/01_bloque_general/04_formatos_maestros/F-PSEA-20 ...`
- `docs/01_bloque_general/04_formatos_maestros/F-PSEA-21 ...`

`F-PSEA-04` no cambia de finalidad: conserva equipos reportados por participantes.

### Mapa documental y anclajes

Actualizar `dev/import/relaciones_mapa_sgc.seed.json`, `dev/import/sgc_seed_bundle.json`, importador/extractor y vista `/dashboard/sgc/mapa` para incluir nodos y aristas resueltas. Relaciones mínimas:

- `P-PSEA-01` **usa** `F-PSEA-19`, `F-PSEA-20` y `F-PSEA-21`.
- `P-PSEA-03` **define** control y conservación de `F-PSEA-19`, `F-PSEA-20` y `F-PSEA-21`.
- `P-PSEA-04` **genera** preparación de `F-PSEA-19`.
- `P-PSEA-05` **usa** `I-PSEA-02` y **referencia** acta, calendario y cronograma comunicados.
- `P-PSEA-06` **usa** `F-PSEA-20` y `F-PSEA-21`.
- `P-PSEA-08` **usa** Anexo B de `I-PSEA-02` y **genera** `F-PSEA-08`.
- `P-PSEA-19` **define** confidencialidad de `F-PSEA-20`.
- `P-PSEA-20` **define** responsabilidades de diligenciamiento/validación de `F-PSEA-21`.
- `F-PSEA-03` **genera** asistentes de `F-PSEA-19` y códigos usados manualmente en `F-PSEA-20`.
- `F-PSEA-19` **referencia** `F-PSEA-21`.
- `I-PSEA-02` **usa** `F-PSEA-08` como registro de carga de datos.

Verificar que nodos nuevos aparezcan en mapa, relaciones abran detalle documental y no queden destinos `pendiente` cuando documento ya existe.

## 2. Catálogo, etapas y versionamiento

1. Añadir `F-PSEA-19`, `F-PSEA-20` y `F-PSEA-21` a catálogos y validadores hardcodeados:
   - `src/server/sgc/catalog.ts`
   - `convex/_lib/sgc/catalog.ts`
   - `convex/sgc/shared.ts`
   - `convex/agent/sgcMutations.ts`
2. Añadir etapa lógica `Inicio de ronda` para F19 sin renombrar carpetas existentes de rondas ya creadas. Mantener:
   - Comunicaciones: I-PSEA-02, calendario y cronograma.
   - Inicio: F-PSEA-19.
   - Preparación: F-PSEA-20 y F-PSEA-21.
3. Separar `critico` de `bloqueaCierre` en catálogo/recurso Drive. Para F19/F20/F21:
   - `critico: true`
   - `bloqueaCierre: false`
4. Ajustar `evaluateDriveCierreCalidad` y checklist para que pendientes generen advertencias críticas, nunca bloqueantes.
5. Preservar `documentoSgcVersionId` existente al reparar expediente. Cambio de versión comunicada debe ser explícito y auditado.
6. Actualizar seeds documentales y relaciones:
   - `dev/import/documentos_sgc.seed.json`
   - bundles/relaciones usados por scripts de importación.

## 3. Modelo Convex

Leer y seguir `convex/_generated/ai/guidelines.md` antes de editar.

### F-PSEA-19

Crear cabecera por ronda y firmantes hijos:

- Datos de ronda, fecha/lugar, texto, versión base, estado.
- Firmantes precargados desde F-PSEA-03 más dos organizadores.
- DOCX generado y PDF firmado almacenados en Convex Storage.
- Completitud: PDF firmado vigente cargado.
- Publicación participante solo del PDF firmado, nunca archivo editable.

### F-PSEA-20

Reusar `sgcDriveRecursos` y flujo de definitivo:

- Archivo manual cargado.
- Marca explícita `usadoEnRonda`.
- Completitud: archivo vigente + uso confirmado.
- Visibilidad interna forzada.

### F-PSEA-21

Crear cabecera e ítems hijos por ronda:

- Estados de flujo: borrador, pendiente de validación, validado, requiere ajustes.
- Precarga desde fichas existentes de analizadores/instrumentos Calaire o registro de referencia ya usado por app; copiar datos al registro de ronda para evitar cambios silenciosos.
- Validación estructural: mínimo cuatro analizadores, un aire cero, un calibrador dinámico y un cilindro; cada ítem con identificación y dos fotos nuevas.
- Técnico registra; coordinador valida.
- Cualquier edición posterior invalida validación previa.
- Exportaciones PDF y XLSX guardadas/versionadas como salidas del registro.

Módulos nuevos sugeridos:

- `convex/sgc/actaInicio.ts`
- `convex/sgc/instrumentosRonda.ts`
- registro en `convex/sgc/index.ts`
- wrappers tipados en `src/server/sgc/index.ts`

## 4. Generación y almacenamiento

1. Reusar `generateSgcUploadUrl`, `ctx.storage`, URLs firmadas y auditoría existentes.
2. F19:
   - Generar DOCX server-side desde plantilla institucional.
   - Guardarlo en Storage y permitir descarga.
   - Recibir PDF escaneado como definitivo.
3. F21:
   - Generar PDF con tabla, fotos y metadatos.
   - Generar XLSX con datos tabulares y referencias/nombres de fotos; usar plantilla base.
4. Añadir librerías DOCX/XLSX solo si prueba técnica confirma que preservan plantilla y tablas dinámicas. `pdf-lib` ya existe para PDF.
5. Subir fotos desde componente cliente directamente a URL de Convex Storage para evitar límite de 1 MB de Server Actions. Validar MIME y tamaño en backend.

## 5. UI administrativa

Extender expediente existente:

- `src/app/(protected)/dashboard/rondas/[id]/sgc/DriveDocumentalSgc.tsx`
- `src/app/(protected)/dashboard/rondas/[id]/sgc/SgcRegistroDiligenciable.tsx`
- `src/app/(protected)/dashboard/rondas/[id]/sgc/actions.ts`

### F19

Ruta dedicada o vista nativa amplia:

- Inicializar desde calendario y F-PSEA-03.
- Revisar asistentes y registrar dos organizadores.
- Generar/descargar DOCX.
- Cargar/reemplazar PDF firmado.
- Publicar/despublicar acta a participantes.

### F20

En detalle Drive:

- Descargar placeholder vigente.
- Cargar archivo manual.
- Marcar “usado en esta ronda”.
- Mostrar diseño visual pendiente.

### F21

Ruta dedicada:

- Precargar siete mínimos desde fichas existentes.
- Editar/agregar instrumentos.
- Subir dos fotos por ítem.
- Mostrar conteos y faltantes.
- Enviar a validación, validar o devolver.
- Descargar PDF y XLSX.

## 6. Portal participante

Consumir `listDriveRecursosParticipante`, hoy sin UI consumidora, desde dashboard/ronda participante.

Mostrar agrupados por etapa:

- I-PSEA-02 y anexos.
- Calendario.
- Cronograma.
- F-PSEA-19 firmado.

Reglas:

- Permitir consulta en ronda activa, documentación pendiente o cerrada; nunca borrador.
- Exigir publicación explícita, archivo definitivo en Storage y versión vigente.
- No mostrar F20/F21, enlaces Drive editables ni IDs internos.
- Correo queda como evidencia suficiente; no implementar acuse digital.

## 7. Checklist y cierre

Agregar evaluadores puros y mensajes concretos:

- F19 pendiente si falta PDF firmado.
- F20 pendiente si falta archivo o marca de uso.
- F21 pendiente si faltan tipos mínimos, identificación, fotos o validación.
- I-PSEA-02 pendiente si ronda no tiene versión publicada/congelada.

Mostrar etiqueta “Crítico, no bloquea cierre”. Separar en panel:

- `bloqueantes`: deshabilitan transición.
- `pendientesCriticos`: informan y quedan auditables.

No añadir F19/F20/F21 a `collectChecklistFaltantes` de bloqueo real.

## 8. Migración compatible

1. Añadir tablas/campos opcionales y ejecutar codegen.
2. Reparar expedientes idempotentemente para crear nueva etapa y recursos.
3. No renombrar ni mover carpetas existentes automáticamente.
4. No marcar documentos completos ni generar fechas por defecto.
5. No reemplazar versiones congeladas en rondas existentes.
6. Inicializar F19/F21 solo por acción explícita del usuario.

# Verificación

## Unitarias

- Catálogos frontend/Convex permanecen equivalentes.
- Documento crítico no bloqueante genera advertencia, no bloqueo.
- Reglas completas de F19/F20/F21.
- F21 exige distribución mínima y dos fotos por ítem.
- Modificar F21 validado revoca validación.

## Convex

- Inicialización idempotente.
- Permisos organizador/participante.
- Aislamiento entre rondas.
- Participante descarga F19 publicado y no puede leer F20/F21.
- Reparación conserva versión congelada.
- Auditoría en generación, carga, reemplazo, uso y validación.

## Generación

- DOCX F19 abre correctamente y contiene ronda, fecha, lugar y todas filas.
- PDF F21 incluye ambas fotos por instrumento.
- XLSX F21 abre y contiene campos/metadata esperados.
- Nombres con tildes y entidades largas no rompen salidas.

## Documentación y mapa

- P-PSEA-01, 03, 04, 05, 06, 08, 19 y 20 contienen anclajes acordados y versiones MD/DOCX sincronizadas cuando ambas existen.
- Árbol, diccionario, inventario y matriz de trazabilidad incluyen F19/F20/F21.
- Seeds importan documentos y relaciones sin duplicados.
- Mapa SGC muestra nodos F19/F20/F21, relaciones hacia procedimientos y enlace F19→F21.
- Ninguna relación nueva queda con destino pendiente después de importar seed.

## E2E

- Admin completa ciclos F19, F20 y F21.
- Participante ve instrucciones, calendario, cronograma y acta en ronda activa.
- Pendientes críticos aparecen, pero transición sigue habilitada.
- F20/F21 nunca aparecen al participante.
- Mapa documental permite navegar desde procedimientos ancla hacia formatos nuevos.

Comandos finales:

- `pnpm exec convex codegen`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e:start`
