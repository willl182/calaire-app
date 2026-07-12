# Plan final (fusionado): funcionalidades de participante PT — calaire-app

Fusión de `Fab_part_plan.md` (mecánica técnica, fases ejecutables) y `sol_part_plan.md` (reglas de negocio, ciclo de mejora). Análisis comparativo: `f_rev_p.md`. Workflow: `f_final_w.md`. Aceptación: `f_final_t.md`.

## 1. Alcance y decisiones cerradas

En alcance: seguridad PT (fase 0), evaluación importada + informe + certificados + descargas (fase 1), dashboard de desempeño (fase 2), casos de mejora con verificación de eficacia + quejas/apelaciones (fase 3), calendario (fase 4).

| Tema | Decisión |
|---|---|
| Fuente de puntajes | Importados desde pt_app (Shiny); calaire no calcula estadística ni reclasifica |
| Vía de importación | CSV en UI admin primero; luego HTTP action con API key (`agentApiKeys`) para push desde Shiny |
| Granularidad | participante × contaminante × run × nivel; estadísticos z, z', ζ, En; `clasificacion` importada es la fuente de verdad |
| Publicación | Import crea borrador reimportable; publicación explícita, atómica, todo-o-nada, simultánea para toda la ronda (resultados + informe + certificados + casos), solo en `documentacion_pendiente`/`cerrada`. **Sin edición, reemplazo ni despublicación posterior**: la doble verificación ocurre antes, en pt_app |
| Anonimato | Solo códigos de participante (ISO 17043); datos ajenos solo alimentan agregados; bins de histograma precalculados al importar |
| Vista de resultados | Estructurada in-app + informe general PDF subido por admin |
| Certificados | PDF autogenerado in-app, emitido con la publicación, con QR verificable y texto de no-implicación de desempeño |
| Casos | Caso automático único por participante/ronda con no satisfactorios; ciclo documental versionado + verificación de eficacia. Además, casos voluntarios tipo queja/apelación/consulta iniciados por el participante |
| Superficie UI | Todo dentro de `/ronda/[codigo]` y panel admin de ronda; dashboard histórico en `mi-dashboard` (fase 2, confirmar con usuario antes de tocar navegación global) |
| Identidad multi-ronda | Ya existe (`workosUserId` / `directorioParticipanteId`); sin cambio de modelo |

Fuera de alcance: cálculo estadístico en calaire; corrección/versionado de una evaluación publicada; multiusuario por laboratorio/analistas/roles; logística y tracking de muestras; enrollment/inscripción en línea; formularios RCA estructurados; edición o retiro del envío PT final; casos de mejora voluntarios para resultados satisfactorios; importación ZIP o gráficos externos; multilingüe.

## 2. Fase 0 — Seguridad (bloqueante, previa a todo)

### 2.1 `upsertEnvioPT` (`convex/pt/index.ts:318`)

Hoy autoriza solo con `requireParticipantOrAdminForRondaParticipante` y confía en `rondaId`, `ptItemId`, `sampleGroupId` del cliente. Cambio (antes de toda escritura):

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

Rechazar también edición si el envío ya tiene `finalSubmittedAt`.

### 2.2 `submitFinalPT` (`convex/pt/index.ts:368`)

Mismo chequeo `ronda.estado === 'activa'`. El conteo `envios.length !== expectedCount` usa índice `by_participante` sin filtrar `rondaId`: añadir filtro `rondaId` defensivo.

### 2.3 Registro de ficha

`src/app/(protected)/ronda/[codigo]/registro/actions.ts:78,94,118,136`: cambiar `estado === 'cerrada'` por `estado !== 'activa'`. Replicar server-side en `convex/rondas/fichas.ts` (hoy no validan estado).

### 2.4 Tests

Extender `convex/access.test.ts` (convex-test): item de otra ronda, sampleGroup de otra ronda, ronda `borrador`/`documentacion_pendiente`/`cerrada`, upsert tras envío final, ficha en `documentacion_pendiente`.

## 3. Fase 1 — Evaluación: importación, publicación, consulta, descargas

### 3.1 Contrato CSV (bloqueante)

No existe aún export real de pt_app: conseguir muestra antes de codificar. Documentar en `_workspace/feats/pt_scores_csv.md`:

```
participant_code, contaminante, run_code, level_label, unidad, metodo,
valor_asignado, u_xpt, sigma_pt, valor_participante, u_lab, U_lab,
z, z_prima, zeta, en, clasificacion
```

Claves de join: `participant_code` contra `rondaParticipantes.participantCode`; (`contaminante`,`run_code`,`level_label`) contra `rondaPtItems` (índice `by_ronda_cont_run`).

Reglas de datos:

- `clasificacion` con vocabulario cerrado: satisfactorio, cuestionable, insatisfactorio. Es la decisión oficial importada; calaire no reclasifica.
- Valores estadísticos que no apliquen: campo vacío → `null`, nunca cero. Rechazar no finitos (`NaN`, `Inf`).
- Sin duplicados participante × ítem; códigos desconocidos o filas no asociables bloquean.

Confirmar con el export real: separador decimal, encoding, nombres exactos de columnas, y cómo exporta pt_app las stats de ronda (media/SD/n): ¿filas aparte o archivo aparte?

### 3.2 Schema (`convex/schema.ts`)

```ts
ptScores: defineTable({
  rondaId: v.id('rondas'),
  rondaParticipanteId: v.id('rondaParticipantes'),
  ptItemId: v.id('rondaPtItems'),          // resuelve contaminante + runCode + levelLabel
  metodo: v.optional(v.union(v.string(), v.null())),
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
  bins: v.array(v.object({ desde: v.number(), hasta: v.number(), n: v.number() })), // histograma anonimizado precalculado
  estadoPublicacion: v.union(v.literal('borrador'), v.literal('publicado')),
  importadoAt: v.number(), importadoBy: v.string(),
})
  .index('by_ronda', ['rondaId'])
  .index('by_ronda_item', ['rondaId', 'ptItemId']),

ptEvaluaciones: defineTable({                // cabecera de la evaluación por ronda (de sol: evaluacionesRonda)
  rondaId: v.id('rondas'),
  estado: v.union(v.literal('sin_cargar'), v.literal('borrador_validado'), v.literal('publicada')),
  csvStorageId: v.optional(v.union(v.id('_storage'), v.null())),
  informeStorageId: v.optional(v.union(v.id('_storage'), v.null())),
  publicadaAt: v.optional(v.union(v.number(), v.null())),
  publicadaBy: v.optional(v.union(v.string(), v.null())),
}).index('by_ronda', ['rondaId']),           // única por ronda

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

Decisión de diseño: los bins del histograma se calculan al importar para que la query del participante nunca lea puntajes ajenos — anonimato por construcción.

### 3.3 Importación y publicación (`convex/pt/scores.ts`, nuevo)

- `validateScoreRows(rows, ronda, participantes, items)` — función pura compartida CSV/HTTP. Devuelve `{ filasValidas, errores: [{fila, campo, mensaje}] }`. Reglas: participante existente y reclamado, ítem existente, clasificación en vocabulario cerrado, números parseables/finitos, vacío→null, unidad no vacía, sin duplicados.
- `previewImport` (query admin): validación sin escribir.
- `importScoresDraft` (mutation admin, `requireAdminIdentity` — mismo helper que `createPTItem`): borra borradores previos de la ronda, inserta filas como `borrador`, calcula `ptScoreRondaStats` (media/SD/n/bins), marca `ptEvaluaciones` como `borrador_validado`. Nunca toca filas `publicado`. Audit vía `writeAudit`.
- `publicarResultados` (mutation admin): **precondiciones** — ronda en `documentacion_pendiente` o `cerrada`, evaluación en `borrador_validado`, informe general cargado. Atómica, todo-o-nada: publica en un solo acto lógico resultados + stats + informe + certificados + creación de casos automáticos (§5). Procesada en lotes vía funciones internas si el volumen lo exige (límites transaccionales Convex). Sella `publicadaAt/By`, audit, notificaciones (`crearNotificacion`) a cada participante.
- **Sin `despublicarResultados`**: la publicación es irreversible. Corrección de errores = antes de publicar (reimport de borrador es idempotente); la doble verificación ocurre en pt_app. Registrar como riesgo (§8.5).
- Parseo CSV en server Next: `src/server/rondas/scores-csv.ts` junto a `csv.ts` existente, con tests unitarios de encoding/decimales/columnas faltantes.

### 3.4 Consulta del participante

Máquina de estados de la ronda (de sol §2.1):

- **Activa:** registro/carga actual + calendario.
- **Cierre sin evaluación publicada:** calendario + confirmación de envío + estado "En evaluación".
- **Evaluación publicada:** resultados, gráficos, caso (si aplica), descargas.

Queries:

- `getMisResultados({ rondaId })`: `requireParticipantOrAdminForRonda` (patrón `submitFinalPT`); resuelve `rondaParticipanteId` propio; solo filas `publicado` propias + `ptScoreRondaStats` publicadas + metadata de ítems. Sin publicación: `{ estado: 'pendiente' }`.
- `getMiInformeUrl({ rondaId })`: `ptInformes` propio o general con `publicado === true`; URL de storage. Autorización alcance participante — NO `requireSgcManage`.

UI participante — `src/app/(protected)/ronda/[codigo]/resultados/page.tsx` (server component):

- Estado general, fecha de publicación, conteos por clasificación.
- Alerta y acceso al caso obligatorio cuando exista.
- Tabla contaminante × nivel: valor propio, valor asignado, estadístico seleccionado, clasificación con color; filtros por contaminante, nivel, método.
- Selector de estadístico (z / z' / ζ / En) — client component.
- Histograma por ítem (bins precalculados) con marcador propio; n de participantes. Seguir skill dataviz.
- Botones de descarga (§3.6). Enlace en la página de ronda cuando exista publicación.

UI admin (panel de ronda en `src/app/(protected)/dashboard/rondas/[id]/resultados/`):

1. Dropzone CSV; preview con errores por fila y resumen; "Importar borradores" deshabilitado con errores.
2. Tabla de borradores; subida del informe general PDF (patrón upload de `convex/sgc/evidencias.ts`, solo PDF); botón único "Publicar" con confirmación explícita de irreversibilidad; estado publicado con fecha/autor.

### 3.5 Certificados (emitidos con la publicación)

- Dependencia PDF: no hay ninguna en `package.json`. Propuesta `@react-pdf/renderer` (server-side). **Confirmar con el usuario antes de `pnpm add`.**
- Schema `ptCertificados` (rondaId, rondaParticipanteId, storageId, createdAt/By).
- Generados al publicar para cada participante con envío final; disponibles aunque exista caso abierto.
- Contenido (de sol §2.6): razón social, código de participante, ronda, ítems/contaminantes, fecha, identidad institucional, **texto que no implique desempeño satisfactorio**, firma configurada, **código/QR verificable**.

### 3.6 Descargas (Route Handlers con autorización server-side)

Siguiendo la doc de Next.js instalada (`node_modules/next/dist/docs/`), respuestas `Response`:

1. **Informe general PDF** (subido por admin).
2. **Certificado de participación** (§3.5).
3. **CSV individual**: solo filas del participante autenticado, todas las columnas evaluadas.
4. **ZIP del expediente del caso** cuando el caso esté cerrado (§5).

Toda descarga verifica identidad + pertenencia a la ronda en servidor; audit log de descarga de certificado.

### 3.7 Fase 1b — HTTP action

`convex/http.ts`: `POST /pt/scores`, `Authorization: Bearer <apiKey>` contra `agentApiKeys` (patrón `convex/agent/auth.ts`). Body `{ rondaCodigo, rows }` con columnas del CSV. Reutiliza `validateScoreRows`; escribe solo borradores; responde `{ ok, importadas, errores }`. Snippet R:

```r
httr::POST(url, httr::add_headers(Authorization = paste("Bearer", key)),
           body = jsonlite::toJSON(list(rondaCodigo = "R-2026-01", rows = df), dataframe = "rows"),
           encode = "raw", httr::content_type_json())
```

## 4. Fase 2 — Dashboard de desempeño histórico

- Query `getMiDesempeno` (`convex/pt/scores.ts`): todas las `rondaParticipantes` del usuario (`by_user`), `ptScores` publicados, agrupados por contaminante × nivel, ordenados por fecha. Series `{ contaminante, nivel, puntos: [{rondaCodigo, fecha, z, zPrima, zeta, en, clasificacion}] }` + `% satisfactorio` por ronda.
- UI en `src/app/(protected)/mi-dashboard` (confirmar con usuario; alternativa conservadora: dentro de resultados de ronda, según restricción de sol):
  - Línea temporal del estadístico elegido con bandas ±2 (advertencia) y ±3 (acción); para En banda ±1.
  - Barras apiladas por clasificación por ronda.
  - Heatmaps y comparativos por método (de sol §2.5).
  - Filtros: periodo, ronda, contaminante, nivel, método, estadístico.
- Sin librería de charts nueva si ya existe una en deps; revisar `package.json` y skill dataviz.

## 5. Fase 3 — Casos: mejora obligatoria + quejas/apelaciones

### 5.1 Caso de mejora automático (núcleo de sol §2.7–2.8)

Al publicar, si el participante tiene ≥1 resultado **insatisfactorio**: crear automáticamente **un solo caso** por participante/ronda (sobre `sgcCasos`, tipo `nc_capa`) agrupando todos esos resultados.

Reglas:

- El resultado publicado permanece inmutable; el cierre nunca altera la evaluación original.
- Solo el responsable (participante) carga documentos y envía; documentos privados para responsable y Calaire.
- Documentos clasificados: `analisis_causa`, `plan_accion`, `implementacion`, `verificacion_eficacia`; formatos PDF/imagen/hoja de cálculo.
- Para enviar a revisión: mínimo un documento de análisis de causa + uno de plan de acción + uno de implementación.
- Al enviar, archivos inmutables; ajustes agregan **versiones nuevas** sin borrar anteriores.
- Sin formularios RCA estructurados: la observación de Calaire es texto simple (hilo de mensajes).
- Bitácora de toda actuación (actor, fecha, cambio).
- Vencimiento documental no bloquea: marca el caso vencido, permite entrega extemporánea, queda en bitácora; Calaire puede mover el plazo conservando historial.

Flujo: `Pendiente de análisis → En revisión por Calaire → (Ajustes requeridos → En revisión)* → En espera de verificación → Cerrado`.

### 5.2 Verificación de eficacia

Cierre exige conjuntamente: (1) aceptación documental por Calaire y (2) resultado satisfactorio en la siguiente participación comparable para **cada** ítem originador.

- Sin participación posterior: el caso queda abierto indefinidamente; el calendario muestra la próxima oportunidad.
- Calaire puede vincular manualmente una ronda técnicamente equivalente.
- Verificación parcial no cierra; se listan pendientes. Cuestionable mantiene en espera. Insatisfactorio exige nueva iteración documental con historial.
- ZIP final: resumen/bitácora + todas las versiones documentales + referencia a resultados posteriores que demostraron eficacia.

### 5.3 Casos voluntarios del participante (de Fab §5, requisito ISO 17043)

- `crearCasoParticipante({ rondaId, tipo: queja|apelacion|consulta, titulo, descripcion })` — `buildCodigoCaso`, estado `abierto`, notifica admin.
- `misCasos`, `getCasoParticipante` (rechaza ajenos), `responderCaso` (solo en `esperando_participante`; pasa a `en_revision`, notifica admin).
- Autorización: resolver `rondaParticipanteId` propio vía identidad; verificar pertenencia en cada acceso.

### 5.4 Schema

```ts
sgcCasoMensajes: defineTable({
  casoId: v.id('sgcCasos'),
  autorTipo: v.union(v.literal('participante'), v.literal('admin')),
  autorId: v.string(),
  texto: v.string(),
  adjuntoStorageId: v.optional(v.union(v.id('_storage'), v.null())),
  adjuntoNombre: v.optional(v.union(v.string(), v.null())),
  createdAt: v.number(),
}).index('by_caso', ['casoId']),

casoResultadosOrigen: defineTable({          // scores insatisfactorios agrupados en el caso
  casoId: v.id('sgcCasos'),
  ptScoreId: v.id('ptScores'),
})
  .index('by_caso', ['casoId'])
  .index('by_score', ['ptScoreId']),

casoDocumentos: defineTable({
  casoId: v.id('sgcCasos'),
  categoria: v.union(v.literal('analisis_causa'), v.literal('plan_accion'),
                     v.literal('implementacion'), v.literal('verificacion_eficacia')),
  createdAt: v.number(), createdBy: v.string(),
}).index('by_caso', ['casoId']),

casoDocumentoVersiones: defineTable({        // versiones inmutables
  documentoId: v.id('casoDocumentos'),
  version: v.number(),
  storageId: v.id('_storage'),
  nombreArchivo: v.string(),
  createdAt: v.number(), createdBy: v.string(),
}).index('by_documento', ['documentoId']),

casoVerificaciones: defineTable({            // correspondencia con resultados de rondas posteriores
  casoId: v.id('sgcCasos'),
  ptScoreOrigenId: v.id('ptScores'),
  ptScorePosteriorId: v.optional(v.union(v.id('ptScores'), v.null())),
  rondaPosteriorId: v.optional(v.union(v.id('rondas'), v.null())),
  resultado: v.union(v.literal('pendiente'), v.literal('satisfactorio'),
                     v.literal('cuestionable'), v.literal('insatisfactorio')),
  updatedAt: v.number(),
})
  .index('by_caso', ['casoId']),
```

Se descarta `ptRcaRegistros` (formulario RCA de Fab): contradice "sin formularios RCA estructurados"; el modelo documental de sol lo reemplaza.

### 5.5 UI

- Participante, zona post-cierre de la ronda: pestaña "Casos" — lista con estado/color, detalle con documentos por categoría, versiones, hilo de mensajes, botón enviar a revisión (habilitado con las 3 categorías mínimas); botón "Nuevo caso" para queja/apelación/consulta.
- En `/resultados`: fila insatisfactoria enlaza al caso automático.
- Admin: pestaña de casos existente (extender `convex/sgc/casos.ts`, hoy 100 % `requireSgcManage`) gana hilo, revisión documental (aceptar/solicitar ajustes), vinculación de ronda de verificación, cierre, y generación de ZIP.

## 6. Fase 4 — Calendario

- Fuente única: `sgcHitosRonda` con `visibleParticipante === true` y `fechaObjetivo` (reusar `getHitosVisibleParticipanteConfig`, `convex/sgc/hitos.ts:99`, generalizada a multi-ronda). El participante no crea ni modifica eventos.
- Query `getMiCalendario`: `{ rondaCodigo, hito: {nombre, fase, fechaObjetivo, fechaReal, estado} }` para todas las rondas del usuario.
- Visible durante todo el ciclo de la ronda, no solo en cierre.
- UI: vista mensual (grid simple, sin dependencia nueva) + agenda cronológica; filtros por tipo/fase/estado; estados próximos/completados/vencidos/cancelados/no aplicables.
- **Recordatorios internos 7/3/1 días** antes de `fechaObjetivo` vía `crearNotificacion`, idempotentes (no duplicar por hito/umbral/participante). Cron/scheduler Convex.
- **Export ICS**: route handler `src/app/(protected)/calendario/ics/route.ts` — formato iCalendar generado a mano (texto plano, VEVENT por hito); validar importándolo en Google Calendar.
- Sin logística, transportadoras ni tracking de muestras.

## 7. Matriz de pruebas mínima

| Área | Test |
|---|---|
| Fase 0 | convex-test: cross-round IDs, estados no activos, upsert tras final, ficha en `documentacion_pendiente` |
| Import | Unit parser CSV (decimales, encoding, columnas faltantes, duplicados, vacío→null, vocabulario clasificacion); convex-test: idempotencia de borrador, no toca publicados, solo admin |
| Publicación | convex-test: precondiciones de estado de ronda; atomicidad todo-o-nada; participante no ve borradores; ve publicados propios; nunca filas ajenas; simultaneidad resultados+informe+certificados+casos |
| Descargas | Route handlers: CSV solo filas propias; certificado solo propio; ZIP solo con caso cerrado; acceso directo ajeno rechazado |
| HTTP | key válida/inválida/expirada; payload malformado |
| Casos | convex-test: unicidad del caso automático por participante/ronda; inmutabilidad de versiones documentales; envío exige 3 categorías; cierre solo con aceptación + verificación completa; sin ronda posterior queda abierto; participante no lee casos ajenos; responder solo en `esperando_participante` |
| Calendario | solo hitos `visibleParticipante`; recordatorios 7/3/1 idempotentes; ICS parseable en Google Calendar |
| Certificados | descarga solo propios; contenido con QR y texto de no-implicación |
| E2E | flujo completo por fase con `pnpm test:e2e:start` |

## 8. Riesgos y bloqueos

1. **Contrato CSV sin export real de pt_app** — bloquea fase 1; conseguir muestra primero.
2. Stats de ronda (media/SD/n): confirmar si pt_app las exporta o se derivan de filas.
3. Librería PDF nueva (`@react-pdf/renderer`): requiere aprobación del usuario antes de `pnpm add`.
4. AGENTS.md describe layout sin `src/`, pero el código real vive en `src/` — seguir el código.
5. **Publicación irreversible**: un CSV erróneo publicado no tiene vía de corrección in-app. Mitigación: preview obligatoria, confirmación explícita, validación estricta, doble verificación en pt_app. Si en operación real se necesita corrección, diseñarla después como re-emisión versionada, nunca como edición silenciosa.
6. **Verificación de eficacia acopla rondas**: la vinculación "ronda comparable" (automática/manual) debe diseñarse antes de la fase 3.
7. Volumen: rondas de decenas de participantes — sin problema de límites Convex; si crece, lotes en imports/publicación ya previstos.

## 9. Orden de entrega

Fase 0 → contrato CSV validado con export real → Fase 1 (schema + import + publicación atómica + resultados + certificados + descargas) → Fase 1b HTTP → Fase 2 dashboard → Fase 3 casos + verificación → Fase 4 calendario.

Un PR por fase con `/code-review` previo. Verificación por fase: `pnpm exec convex codegen` (si hay cambios Convex), `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e:start`.
