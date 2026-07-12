# Targets finales (fusionados): funcionalidades de participante PT

Plan: `f_final_p.md`. Workflow: `f_final_w.md`. Análisis comparativo: `f_rev_t.md`.
Cada target tiene entregable + criterios de aceptación verificables.

## Incremento 0 — Seguridad previa

### T0 — Seguridad PT endurecida

**Entregable:** mutaciones públicas PT imposibles de usar cross-round o fuera de estado.

- [ ] `upsertEnvioPT` y `submitFinalPT` rechazan `ptItemId`/`sampleGroupId`/`rondaId` que no pertenezcan a la misma ronda del `rondaParticipanteId` (error explícito, sin escritura).
- [ ] Ambas mutaciones exigen `ronda.estado === 'activa'` server-side (Convex, no solo action de Next).
- [ ] `upsertEnvioPT` rechaza edición tras `finalSubmittedAt`; conteo de `submitFinalPT` filtra por `rondaId`.
- [ ] Acciones de registro (`src/app/(protected)/ronda/[codigo]/registro/actions.ts`) bloquean `documentacion_pendiente` además de `cerrada`; misma regla en la mutación Convex correspondiente.
- [ ] Tests de autorización nuevos en patrón `convex/access.test.ts`: ID cross-round, ronda no activa, upsert tras envío final, registro en `documentacion_pendiente`.

## Incremento 1 — Evaluación, resultados y calendario

### T1 — Contrato CSV validado

**Entregable:** parser probado para resultados definitivos emitidos por pt_app.

- [ ] Contrato documentado en `_workspace/feats/pt_scores_csv.md`, validado contra un export real de pt_app (bloqueante).
- [ ] Acepta exactamente las 17 columnas acordadas (incluye `metodo`).
- [ ] Convierte métricas no aplicables a `null`, nunca a cero implícito.
- [ ] Rechaza números no finitos, clasificaciones fuera del vocabulario cerrado y claves duplicadas.
- [ ] Resuelve `participant_code` contra `rondaParticipantes.participantCode` y (`contaminante`,`run_code`,`level_label`) contra `rondaPtItems` de la misma ronda.
- [ ] Reporta errores por fila y campo, aptos para preview admin.
- [ ] Pruebas unitarias con fixtures válidos e inválidos (encoding, decimales, columnas faltantes).

### T2 — Evaluación almacenada con seguridad

**Entregable:** cabecera y filas normalizadas en Convex, invisibles mientras sean borrador.

- [ ] Tablas `ptEvaluaciones` (cabecera única por ronda, estados `sin_cargar`/`borrador_validado`/`publicada`), `ptScores` (valorAsignado, valorParticipante, z, zPrima, zeta, en, clasificacion, u, U, unidad, metodo, estadoPublicacion) y `ptScoreRondaStats` (media, SD, n, bins precalculados) en `convex/schema.ts` con índices por ronda, participante y dimensiones técnicas.
- [ ] Una ronda tiene como máximo una evaluación definitiva.
- [ ] Cada fila vinculada a un `rondaParticipanteId` válido; sin listas no acotadas en un documento.
- [ ] Solo admin carga y publica; import idempotente: re-importar reemplaza borradores, nunca toca filas publicadas.
- [ ] Participantes no consultan borradores ni filas ajenas mediante API directa.
- [ ] Importaciones grandes se procesan por lotes (funciones internas) sin exposición parcial.

### T3 — Publicación administrativa integrada en Resultados

**Entregable:** flujo CSV + PDF general → validación → previsualización → publicación.

- [ ] Vive en la sección administrativa existente `Resultados` de la ronda.
- [ ] Solo habilitado en `documentacion_pendiente` o `cerrada`.
- [ ] La previsualización muestra filas, participantes, clasificaciones, errores y casos previstos.
- [ ] Cualquier error o ausencia del informe PDF bloquea toda la publicación.
- [ ] Publica simultáneamente resultados, informe, certificados y casos; notifica a los participantes.
- [ ] No existe editar, reemplazar, despublicar o versionar después (irreversible en UI y backend; confirmación explícita).
- [ ] Publicar no modifica automáticamente el estado de la ronda.
- [ ] Actor y fecha auditados en `sgcAuditLog`.

### T4 — Resultados evaluados dentro de la ronda

**Entregable:** experiencia publicada en `/ronda/[codigo]` por etapa de ronda.

- [ ] Activa conserva carga PT y añade calendario.
- [ ] Cierre sin publicación muestra "En evaluación", no un bloqueo total.
- [ ] Publicada muestra conteos, filtros (contaminante/nivel/método) y tabla con valor propio/asignado, `z`, `z'`, `zeta`, `En` y clasificación coloreada, con selector de estadístico.
- [ ] Incluye criterio breve, resúmenes y número de participantes.
- [ ] Incluye distribución (bins server-side con posición propia), heatmap y comparación por método/combinación técnica desde agregados autorizados.
- [ ] La query Convex devuelve exclusivamente filas del participante autenticado + agregados; nunca valores de otros participantes con identidad.
- [ ] Historial filtra rondas publicadas, periodo, contaminante/ítem, método, puntaje y clasificación; sin dimensión analista.
- [ ] No cambia la navegación ni redirección actual de `mi-dashboard`.
- [ ] Charts siguen skill dataviz.

### T5 — Privacidad, descargas y certificado

**Entregable:** informe general, certificado y CSV individual protegidos.

- [ ] Participante descarga el informe general PDF cargado para su ronda, con autorización de alcance participante (no `requireSgcManage`).
- [ ] Certificado se genera al publicar; incluye contenido institucional, firma y QR/código verificable.
- [ ] Certificado declara participación, no desempeño; disponible aunque haya caso abierto.
- [ ] CSV descargable contiene solo filas del participante autenticado, filtradas server-side por `rondaParticipanteId`.
- [ ] Manipular URL, código o ID no permite descargar archivos de otro participante/ronda.
- [ ] Otros códigos solo aparecen anonimizados en agregados/informe general.
- [ ] Descargas de certificado registradas en audit log.

### T6 — Calendario desde hitos

**Entregable:** calendario mensual y agenda con recordatorios y export.

- [ ] Usa `sgcHitosRonda` con `visibleParticipante = true` y fecha objetivo; el participante no crea ni modifica eventos.
- [ ] Disponible durante todo el ciclo de la ronda.
- [ ] Distingue próximo, completado, vencido, cancelado y no aplica; filtros por fase/tipo y estado.
- [ ] Genera una sola notificación por umbral a 7, 3 y 1 día; cambios de fecha no duplican recordatorios.
- [ ] Export ICS válido (abre en Google Calendar/Outlook); cronograma anual con export PDF opcional.
- [ ] No incluye guías, transportadoras ni estados logísticos.

### T7 — Push HTTP desde pt_app (opcional / fase 1b)

**Entregable:** endpoint autenticado que acepta el mismo payload que el CSV.

- [ ] Convex HTTP action `POST /pt/scores` autenticada con `agentApiKeys`; reutiliza la capa de validación del import CSV.
- [ ] Respuesta con errores estructurados por fila; escribe borradores, jamás publica.
- [ ] Probado con `curl` (key válida/inválida/expirada, payload malformado); snippet R (`httr::POST`) documentado.

## Incremento 2 — Casos y desempeño

### T8 — Caso automático agrupado

**Entregable:** un caso obligatorio por participante/ronda con no satisfactorios.

- [ ] `clasificacion` importada es la única fuente de activación.
- [ ] Agrupa todos los no satisfactorios de esa publicación.
- [ ] Nunca crea más de un caso para el mismo participante/ronda.
- [ ] Conserva cada fila originadora en una relación auditable (vínculo caso ↔ fila `ptScores` visible en panel admin).
- [ ] Solo el responsable asignado edita/envía; admin revisa/cierra.
- [ ] La evaluación original permanece inmutable.
- [ ] Notificaciones (`sgcNotificaciones`) en cambios de estado del caso.

### T9 — Documentos privados y revisión sencilla

**Entregable:** flujo documental mínimo con versiones.

- [ ] Admite PDF, imágenes y hojas de cálculo.
- [ ] Clasifica análisis de causa, plan de acción, implementación y verificación de eficacia.
- [ ] Exige las primeras tres categorías antes de enviar.
- [ ] Tras envío, las versiones quedan inmutables; ajustes crean versiones nuevas sin borrar historial.
- [ ] Admin devuelve el caso con una observación textual simple (hilo de mensajes).
- [ ] Responsable y admin son los únicos que acceden a documentos.
- [ ] Cada acción registra actor, fecha y cambio (bitácora).
- [ ] Vencimiento documental no bloquea el envío: marca vencido, permite entrega extemporánea, queda en bitácora.

### T10 — Verificación normativa posterior y expediente

**Entregable:** cierre condicionado a desempeño satisfactorio posterior + ZIP.

- [ ] Tras aceptación documental, el caso queda `en_espera_verificacion`.
- [ ] Cada resultado originador exige un resultado satisfactorio comparable en ronda posterior.
- [ ] Verificación parcial, cuestionable o no satisfactoria mantiene el caso abierto; insatisfactoria exige nueva iteración documental con historial.
- [ ] Sin participación posterior el caso permanece abierto indefinidamente; el calendario muestra la próxima oportunidad.
- [ ] Admin puede vincular una ronda técnicamente equivalente.
- [ ] El caso solo cierra cuando documentos y todos los resultados están verificados; el cierre nunca altera la evaluación original.
- [ ] Expediente ZIP solo para casos cerrados: resumen PDF, bitácora, todas las versiones documentales (nombres deterministas) y referencia a resultados posteriores satisfactorios; descarga solo responsable y admin.

### T11 — Casos iniciados por el participante

**Entregable:** ciclo de vida de queja/apelación/consulta accesible al participante (requisito ISO 17043).

- [ ] Participante crea caso (tipo queja/apelación/consulta) ligado a su ronda; ve lista y estado de sus casos.
- [ ] Hilo de mensajes: participante responde y adjunta solo cuando `estado === 'esperando_participante'`; ve resolución al cierre.
- [ ] Autorización: participante solo ve casos con su `rondaParticipanteId`; admin ve todo.
- [ ] Notificaciones en cambios de estado.

### T12 — Dashboard multi-ronda "Mi desempeño"

**Entregable:** tendencia histórica del participante.

- [ ] Sección en `mi-dashboard` (o superficie de ronda, según decisión de producto): z-score en el tiempo por contaminante × nivel con bandas ±2/±3 (En: ±1), % satisfactorio histórico, barras apiladas por clasificación, heatmaps por método, filtros por estadístico/contaminante/periodo.
- [ ] Solo rondas con resultados publicados; identidad por `directorioParticipanteId`/`workosUserId`.
- [ ] Charts siguen skill dataviz.

## Calidad transversal (todo target)

- [ ] `pnpm exec convex codegen` pasa tras cambios Convex.
- [ ] `pnpm lint`, `pnpm test`, `pnpm build` pasan.
- [ ] `pnpm test:e2e:start` cubre flujos de admin y participante (incluida publicación y descargas protegidas).
- [ ] Pruebas negativas de autorización entre participantes de la misma ronda y de rondas distintas.
- [ ] Toda query/mutación nueva de participante tiene test de autorización.
- [ ] Funciones Convex sensibles son internas cuando no necesitan formar parte del API público.
- [ ] Queries usan índices y resultados acotados/paginados conforme a `convex/_generated/ai/guidelines.md`.
