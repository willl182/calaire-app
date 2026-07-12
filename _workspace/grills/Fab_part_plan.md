# Plan detallado: nuevas funcionalidades para participantes (calaire-app)

Insumos: `_workspace/feats/part_curr.md` (estado actual), `part_reqs.md` (referencia LGC PORTAL), Q&A en `_workspace/grills/grillme_partfeat.md`.
Ejecución paso a paso: `_workspace/feats/part_workflow.md`. Criterios de aceptación: `_workspace/feats/part_targets.md`.

## 1. Alcance y decisiones

En alcance: seguridad PT (fase 0), puntajes importados + informe final (fase 1), dashboard de tendencias (fase 2), casos/RCA (fase 3), calendario (fase 4), certificados (fase 5).
Fuera: multi-usuario por laboratorio, multi-resultado por analito, multilingüe, enrollment self-service, tracking de envíos físicos.

Decisiones cerradas:

| Tema | Decisión |
|---|---|
| Fuente de puntajes | Importados desde pt_app (Shiny, https://w421.shinyapps.io/pt_app/); calaire no calcula estadística |
| Vía de importación | CSV en UI admin primero; luego HTTP action con API key (`agentApiKeys`) para push desde Shiny |
| Granularidad | participante × item × nivel; estadísticos z, z', ζ, En |
| Vista de informe | Estructurada in-app + PDF subido por admin, descargable |
| Anonimato | Solo códigos de participante (ISO 17043) |
| Publicación | Import crea borrador; visible solo tras publicación explícita admin |
| Certificados | PDF autogenerado in-app con aprobación admin |
| Identidad multi-ronda | Ya existe (`workosUserId` / `directorioParticipanteId`); sin cambio de modelo |

## 2. Fase 0 — Seguridad

### 2.1 `upsertEnvioPT` (`convex/pt/index.ts:318`)

Hoy: autoriza solo con `requireParticipantOrAdminForRondaParticipante(ctx, rondaParticipanteId)`; confía en `rondaId`, `ptItemId`, `sampleGroupId` del cliente.

Cambio (dentro del handler, antes de toda escritura):

```ts
const [participante, ptItem, sampleGroup, ronda] = await Promise.all([
  ctx.db.get(rondaParticipanteId), ctx.db.get(ptItemId),
  ctx.db.get(sampleGroupId), ctx.db.get(rondaId),
])
if (!participante || !ptItem || !sampleGroup || !ronda) throw new ConvexError('Referencia inválida')
if (participante.rondaId !== rondaId || ptItem.rondaId !== rondaId || sampleGroup.rondaId !== rondaId)
  throw new ConvexError('Los identificadores no pertenecen a la ronda')
if (ronda.estado !== 'activa') throw new ConvexError('La ronda no está activa')
```

También rechazar edición si el envío ya tiene `finalSubmittedAt` (hoy `upsertEnvioPT` puede pisar un envío final — cerrar ese hueco).

### 2.2 `submitFinalPT` (`convex/pt/index.ts:368`)

Añadir mismo chequeo `ronda.estado === 'activa'`. Nota: el conteo `envios.length !== expectedCount` usa índice `by_participante` sin filtrar `rondaId`; con la validación 2.1 los envíos cross-round dejan de crearse, pero añadir filtro `rondaId` defensivo al conteo.

### 2.3 Registro de ficha

`src/app/(protected)/ronda/[codigo]/registro/actions.ts:78,94,118,136`: cambiar `estado === 'cerrada'` por `estado !== 'activa'`. Replicar server-side en las mutaciones de fichas (`convex/rondas/fichas.ts`), que hoy no validan estado.

### 2.4 Tests

Extender `convex/access.test.ts` (convex-test): item de otra ronda, sampleGroup de otra ronda, ronda `borrador`/`documentacion_pendiente`/`cerrada`, upsert tras envío final, ficha en `documentacion_pendiente`.

## 3. Fase 1 — Puntajes, importación, publicación, informe

### 3.1 Schema nuevo (`convex/schema.ts`)

```ts
ptScores: defineTable({
  rondaId: v.id('rondas'),
  rondaParticipanteId: v.id('rondaParticipantes'),
  ptItemId: v.id('rondaPtItems'),          // resuelve contaminante + runCode + levelLabel
  valorAsignado: v.number(),
  incertidumbreAsignada: v.optional(v.union(v.number(), v.null())), // u(xpt)
  sigmaPt: v.optional(v.union(v.number(), v.null())),
  valorParticipante: v.number(),
  uParticipante: v.optional(v.union(v.number(), v.null())),
  UParticipante: v.optional(v.union(v.number(), v.null())),
  unidad: v.string(),
  z: v.optional(v.union(v.number(), v.null())),
  zPrima: v.optional(v.union(v.number(), v.null())),
  zeta: v.optional(v.union(v.number(), v.null())),
  en: v.optional(v.union(v.number(), v.null())),
  clasificacion: v.union(v.literal('satisfactorio'), v.literal('cuestionable'), v.literal('insatisfactorio')),
  estadoPublicacion: v.union(v.literal('borrador'), v.literal('publicado')),
  importadoAt: v.number(), importadoBy: v.string(),
  publicadoAt: v.optional(v.union(v.number(), v.null())),
  publicadoBy: v.optional(v.union(v.string(), v.null())),
})
  .index('by_ronda', ['rondaId'])
  .index('by_ronda_estado', ['rondaId', 'estadoPublicacion'])
  .index('by_participante', ['rondaParticipanteId'])
  .index('by_participante_item', ['rondaParticipanteId', 'ptItemId']),

ptScoreRondaStats: defineTable({
  rondaId: v.id('rondas'),
  ptItemId: v.id('rondaPtItems'),
  media: v.number(), sd: v.number(), n: v.number(),
  // histograma anonimizado precalculado para la vista comparativa:
  bins: v.array(v.object({ desde: v.number(), hasta: v.number(), n: v.number() })),
  estadoPublicacion: v.union(v.literal('borrador'), v.literal('publicado')),
  importadoAt: v.number(), importadoBy: v.string(),
})
  .index('by_ronda', ['rondaId'])
  .index('by_ronda_item', ['rondaId', 'ptItemId']),

ptInformes: defineTable({                    // PDF por participante o general
  rondaId: v.id('rondas'),
  rondaParticipanteId: v.optional(v.union(v.id('rondaParticipantes'), v.null())), // null = informe general
  storageId: v.id('_storage'),
  nombreArchivo: v.string(),
  publicado: v.boolean(),
  createdAt: v.number(), createdBy: v.string(),
})
  .index('by_ronda', ['rondaId'])
  .index('by_participante', ['rondaParticipanteId']),
```

Decisión de diseño: los bins del histograma se calculan al importar (en la capa de validación) para que la query del participante nunca lea puntajes ajenos — anonimato garantizado por construcción.

### 3.2 Contrato CSV (bloqueante)

Falta un export real de pt_app. Contrato borrador a validar, documentar en `_workspace/feats/pt_scores_csv.md`:

```
participant_code, contaminante, run_code, level_label, unidad,
valor_asignado, u_xpt, sigma_pt, valor_participante, u_lab, U_lab,
z, z_prima, zeta, en, clasificacion
```

Claves de join: `participant_code` contra `rondaParticipantes.participantCode`; (`contaminante`,`run_code`,`level_label`) contra `rondaPtItems` (índice `by_ronda_cont_run`). Puntos a confirmar con el export real: separador decimal (R suele emitir `.`), encoding, nombres exactos de columnas, cómo exporta pt_app las stats de ronda (media/SD/n) — ¿filas aparte o archivo aparte?

### 3.3 Capa de importación (`convex/pt/scores.ts`, nuevo)

- `validateScoreRows(rows, ronda, participantes, items)` — función pura compartida CSV/HTTP. Devuelve `{ filasValidas, errores: [{fila, campo, mensaje}] }`. Reglas: código de participante existente y reclamado, item existente, clasificación válida, números parseables, unidad no vacía, sin duplicados (participante × item).
- `previewImport` (query admin): recibe filas parseadas, devuelve resultado de validación sin escribir.
- `importScoresDraft` (mutation admin, `requireAdminIdentity` — mismo helper que `createPTItem`): borra borradores previos de la ronda, inserta filas nuevas como `borrador`, calcula e inserta `ptScoreRondaStats` (media/SD/n/bins). Nunca toca filas `publicado`. Audit vía `writeAudit`.
- `publicarResultados` / `despublicarResultados` (mutation admin): flip masivo `borrador → publicado` (y stats), sella `publicadoAt/By`, audit log, dispara notificación (`crearNotificacion`) a cada participante con puntajes.
- Parseo CSV en server Next: `src/server/rondas/scores-csv.ts` junto a `csv.ts` existente (reusar utilidades), con tests unitarios de encoding/decimales/columnas faltantes.

### 3.4 Queries de participante

- `getMisResultados({ rondaId })`: autoriza con `requireParticipantOrAdminForRonda` (patrón de `submitFinalPT`); resuelve `rondaParticipanteId` propio; devuelve solo filas `publicado` propias + `ptScoreRondaStats` publicadas + metadata de items. Sin datos publicados: `{ estado: 'pendiente' }`.
- `getMiInformeUrl({ rondaId })`: busca `ptInformes` del participante (o general) con `publicado === true`; genera URL de storage. Autorización de alcance participante — explícitamente NO `requireSgcManage` (hallazgo #4 de part_curr.md).

### 3.5 UI

Admin (panel de ronda en `src/app/(protected)/dashboard/rondas/...`), sección "Resultados PT":
1. Dropzone CSV; parseo server action; tabla preview con errores por fila (rojo) y resumen (n válidas / n errores); botón "Importar borradores" deshabilitado si hay errores.
2. Tabla de borradores importados; botón "Publicar resultados" con confirmación; estado publicado con fecha/autor; subida de PDFs de informe (por participante o general) reutilizando patrón de upload de `convex/sgc/evidencias.ts` (content types permitidos: PDF).

Participante — `src/app/(protected)/ronda/[codigo]/resultados/page.tsx`:
- Server component; llama `getMisResultados`.
- Tabla por contaminante × nivel: valor propio, valor asignado, estadístico seleccionado, clasificación con color (verde/ámbar/rojo).
- Selector de estadístico (z / z' / ζ / En) — client component.
- Histograma por item (bins precalculados) con marcador de posición propia. Seguir skill dataviz.
- Botón "Descargar informe (PDF)" si existe `ptInformes` publicado.
- Estado pendiente: mensaje "Resultados aún no publicados".
- Enlace en `ParticipantTopNav` / página de ronda cuando existan resultados publicados.

### 3.6 Fase 1b — HTTP action

`convex/http.ts`: `POST /pt/scores`, header `Authorization: Bearer <apiKey>` validado contra `agentApiKeys` (patrón `convex/agent/auth.ts`). Body `{ rondaCodigo, rows: [...] }` con las mismas columnas del CSV. Reutiliza `validateScoreRows`; escribe solo borradores; responde `{ ok, importadas, errores }`. Documentar snippet R:

```r
httr::POST(url, httr::add_headers(Authorization = paste("Bearer", key)),
           body = jsonlite::toJSON(list(rondaCodigo = "R-2026-01", rows = df), dataframe = "rows"),
           encode = "raw", httr::content_type_json())
```

## 4. Fase 2 — Dashboard de desempeño

- Query `getMiDesempeno` (`convex/pt/scores.ts`): todas las `rondaParticipantes` del usuario (`by_user`), sus `ptScores` publicados, agrupados por contaminante × levelLabel, ordenados por fecha de ronda. Devuelve series `{ contaminante, nivel, puntos: [{rondaCodigo, fecha, z, zPrima, zeta, en, clasificacion}] }` + agregado `% satisfactorio` por ronda.
- UI: sección "Mi desempeño" en `src/app/(protected)/mi-dashboard` (ya existe la página): 
  - Línea temporal de estadístico elegido con bandas ±2 (advertencia) y ±3 (acción) para z/z'/ζ; para En banda ±1.
  - Barras apiladas % satisfactorio/cuestionable/insatisfactorio por ronda.
  - Filtros: contaminante, nivel, estadístico.
- Sin librería de charts nueva si ya existe una en deps; revisar `package.json` y skill dataviz antes de elegir.

## 5. Fase 3 — Casos y RCA

### 5.1 Estado actual

`sgcCasos` ya tiene tipos (`consulta|desviacion|queja|apelacion|nc_capa|otro`), severidad, estados (`abierto|en_revision|esperando_participante|resuelto|cerrado`) y `rondaParticipanteId` opcional. `convex/sgc/casos.ts` es 100 % admin (`requireSgcManage`). No hay hilo de mensajes (los `sgcComentariosRonda` son por ronda, no por caso).

### 5.2 Schema nuevo

```ts
sgcCasoMensajes: defineTable({
  casoId: v.id('sgcCasos'),
  autorTipo: v.union(v.literal('participante'), v.literal('admin')),
  autorId: v.string(),                       // workosUserId o actor admin
  texto: v.string(),
  adjuntoStorageId: v.optional(v.union(v.id('_storage'), v.null())),
  adjuntoNombre: v.optional(v.union(v.string(), v.null())),
  createdAt: v.number(),
}).index('by_caso', ['casoId']),

ptRcaRegistros: defineTable({
  ptScoreId: v.id('ptScores'),
  rondaParticipanteId: v.id('rondaParticipantes'),
  casoId: v.optional(v.union(v.id('sgcCasos'), v.null())),
  causaRaiz: v.string(),
  accionesCorrectivas: v.string(),
  estado: v.union(v.literal('registrado'), v.literal('revisado')),
  createdAt: v.number(), createdBy: v.string(),
  updatedAt: v.number(), updatedBy: v.string(),
})
  .index('by_score', ['ptScoreId'])
  .index('by_participante', ['rondaParticipanteId']),
```

### 5.3 Funciones (`convex/sgc/casos.ts` + wrappers en `src/server/sgc`)

Participante (autorización: resolver `rondaParticipanteId` propio vía identidad; verificar pertenencia en cada acceso):
- `crearCasoParticipante({ rondaId, tipo: queja|apelacion|consulta, titulo, descripcion })` — genera código con `buildCodigoCaso`, estado `abierto`, severidad por defecto `media`, notifica a admin.
- `misCasos({ rondaId? })` — solo casos con su `rondaParticipanteId`.
- `getCasoParticipante({ casoId })` — caso + mensajes; rechaza casos ajenos o sin `rondaParticipanteId`.
- `responderCaso({ casoId, texto, adjunto? })` — solo si `estado === 'esperando_participante'`; al responder, estado pasa a `en_revision`; notifica admin.
- `registrarRca({ ptScoreId, causaRaiz, accionesCorrectivas, crearCaso?: boolean })` — valida que el score sea propio y `clasificacion !== 'satisfactorio'`; opcionalmente abre caso tipo `nc_capa` vinculado.

Admin (extender existentes): responder en hilo (mensaje `autorTipo: 'admin'`), cambiar estado a `esperando_participante`, marcar RCA `revisado`. Cambios de estado disparan `crearNotificacion` al participante.

### 5.4 UI participante

- Zona post-cierre (donde hoy viven hitos/avisos/comentarios): pestaña "Casos" — lista con estado/color, botón "Nuevo caso", detalle con hilo de mensajes y formulario de respuesta (visible solo en `esperando_participante`).
- En `/resultados`: fila con clasificación cuestionable/insatisfactoria muestra acción "Registrar análisis de causa raíz" (modal: causa raíz + acciones + checkbox "abrir caso NC/CAPA").
- Panel admin: pestaña de casos existente gana hilo de mensajes + vista de RCA vinculados.

## 6. Fase 4 — Calendario

- Query `getMiCalendario`: para todas las rondas del usuario, hitos con `visibleParticipante === true` (tabla `sgcHitosRonda`; reusar lógica de `getHitosVisibleParticipanteConfig` en `convex/sgc/hitos.ts:99` generalizada a multi-ronda). Devuelve `{ rondaCodigo, hito: {nombre, fase, fechaObjetivo, fechaReal, estado} }`.
- UI: página o sección "Calendario" en área participante — vista mensual (grid simple, sin dependencia nueva) + lista anual agrupada por ronda.
- Export ICS: route handler `src/app/(protected)/calendario/ics/route.ts` — generación manual del formato iCalendar (VEVENT por hito con `fechaObjetivo`; es texto plano, no requiere librería). Validar en Google Calendar.
- Export PDF del cronograma anual: usa el mismo generador PDF de fase 5 (si fase 5 aún no está, botón se pospone).

## 7. Fase 5 — Certificados

- Dependencia PDF: no hay ninguna en `package.json` hoy. Propuesta: `@react-pdf/renderer` (server-side, sin browser headless). Confirmar antes de instalar (`pnpm add`).
- Schema: `ptCertificados` (rondaId, rondaParticipanteId, storageId, aprobado, aprobadoAt/By, createdAt). 
- Flujo: al pasar ronda a `cerrada`, acción admin "Generar certificados" — server action itera participantes con envío final, genera PDF (nombre laboratorio de `directorioParticipantes`/ficha, código de ronda, fechas, código de participante), guarda en storage Convex como no aprobado. Botón "Aprobar y publicar certificados" los hace visibles.
- Participante: botón "Descargar certificado" en página de ronda cerrada; query con autorización de participante + audit log de descarga.

## 8. Matriz de pruebas mínima

| Área | Test |
|---|---|
| Fase 0 | convex-test: cross-round IDs, estados no activos, upsert tras final, ficha en `documentacion_pendiente` |
| Import | Unit parser CSV (decimales, columnas faltantes, duplicados); convex-test: idempotencia, no toca publicados, solo admin |
| Publicación | convex-test: participante no ve borradores; ve publicados propios; nunca filas ajenas |
| HTTP | curl con key válida/inválida/expirada; payload malformado |
| Casos | convex-test: participante no lee casos ajenos; responder solo en `esperando_participante`; RCA solo sobre score propio no satisfactorio |
| Calendario | ICS parseable (import en Google Calendar); solo hitos `visibleParticipante` |
| Certificados | descarga solo aprobados y propios |
| E2E | flujo completo por fase con `pnpm test:e2e:start` |

## 9. Riesgos y bloqueos

1. **Contrato CSV de pt_app sin export real** — bloquea fase 1; conseguir muestra primero (etapa 1 del workflow).
2. Stats de ronda (media/SD/n) — confirmar si pt_app las exporta o hay que derivarlas de las filas.
3. Volumen: rondas pequeñas (decenas de participantes) — sin problema de límites Convex; si creciera, revisar paginación en imports.
4. AGENTS.md describe layout sin `src/`, pero el código real vive en `src/` — seguir el código, no el doc.
5. Librería PDF nueva: requiere aprobación del usuario antes de `pnpm add`.

## 10. Orden de entrega

Fase 0 → contrato CSV → fase 1 (schema+import → vista participante → HTTP) → fase 2 → fase 3 → fase 4 → fase 5. Cada fase un PR con `/code-review` previo. Detalle operativo en `part_workflow.md`; aceptación en `part_targets.md`.
