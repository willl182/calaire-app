# Workflow final (fusionado): funcionalidades de participante PT

Plan: `f_final_p.md`. Aceptación: `f_final_t.md`. Análisis comparativo: `f_rev_w.md`.

## Reglas de ejecución

- Usar `pnpm` para scripts y dependencias.
- Antes de tocar Convex, leer `convex/_generated/ai/guidelines.md` completo.
- Antes de escribir Next.js, leer las guías relevantes instaladas en `node_modules/next/dist/docs/`.
- Conservar la estructura actual bajo `src/app`, `src/server`, `src/components` y `convex/`; no introducir migración arquitectónica. Nota: AGENTS.md describe layout sin `src/` — seguir el código, no el doc.
- Mantener importación/publicación en `Resultados`, casos/hitos en `SGC` y experiencia del participante en `/ronda/[codigo]`.
- Cada etapa termina con `pnpm build && pnpm lint && pnpm test`; si tocó Convex, antes `pnpm exec convex codegen`; si tocó rutas/auth/descargas, `pnpm test:e2e:start`. No acumular pruebas para el final.
- Cada etapa = PR propio. Antes de cada PR: `/code-review` o skill verify. Prefijos de commit convencionales (`fix(pt): ...`, `feat(pt): ...`).

## Incremento 0 — Seguridad

### Etapa 0. Hardening de mutaciones PT — sin dependencias

1. Leer `convex/pt/index.ts:300-420` (`upsertEnvioPT`, `submitFinalPT`) y su helper de autorización.
2. Añadir validación de pertenencia: cargar `rondaParticipante`, `ptItem`, `sampleGroup`; exigir `ptItem.rondaId === sampleGroup.rondaId === rondaParticipante.rondaId === args.rondaId`. Fallar con `ConvexError` antes de cualquier escritura.
3. Añadir chequeo `ronda.estado === 'activa'` en ambas mutaciones; rechazar upsert si el envío ya tiene `finalSubmittedAt`; filtro `rondaId` defensivo en el conteo de `submitFinalPT`.
4. En `src/app/(protected)/ronda/[codigo]/registro/actions.ts:78,94,118,136` cambiar condición a `estado !== 'activa'`; replicar server-side en las mutaciones de fichas (`convex/rondas/fichas.ts`).
5. Tests: extender patrón de `convex/access.test.ts` con casos cross-round, ronda no activa, upsert tras envío final, registro en `documentacion_pendiente`.
6. Verificar y commit (`fix(pt): ...`).

Salida: mutaciones PT imposibles de invocar fuera de la ronda propia y activa.

## Incremento 1 — Publicación, consulta y calendario

### Etapa 1. Contrato CSV y parser puro — bloqueante

1. Pedir al usuario un export CSV real de pt_app (https://w421.shinyapps.io/pt_app/); validar ambigüedades (unidades, separador decimal, encoding, stats de ronda) antes de codificar.
2. Documentar columnas, tipos y mapeo en `_workspace/feats/pt_scores_csv.md`.
3. Crear tipos explícitos para las 17 columnas (incluye `metodo`).
4. Normalización de encabezados, strings, números, vacíos (→ `null`, nunca cero) y `clasificacion` (vocabulario cerrado).
5. Validar encabezados exactos, campos requeridos, números finitos y duplicados de clave técnica.
6. Claves de join: `participant_code` ↔ `rondaParticipantes.participantCode`; (`contaminante`,`run_code`,`level_label`) ↔ `rondaPtItems` (índice `by_ronda_cont_run`).
7. No alterar los valores estadísticos emitidos por pt_app; errores por fila/campo aptos para preview admin.
8. Parser en `src/server/rondas/scores-csv.ts` junto a la infraestructura CSV existente; fixtures y pruebas unitarias: válido, columnas faltantes, códigos desconocidos, duplicados, números inválidos, métricas vacías, clasificación inválida.

Salida: parser reutilizable y contrato documentado en código.

### Etapa 2. Modelo Convex de evaluación

1. Schema (`convex/schema.ts`): cabecera `ptEvaluaciones` única por ronda (estados `sin_cargar`/`borrador_validado`/`publicada`, referencias a CSV fuente e informe PDF), `ptScores` (una fila por registro, `estadoPublicacion: 'borrador' | 'publicado'`), `ptScoreRondaStats` (media/SD/n + bins precalculados), `ptInformes`. Índices `by_ronda`, `by_participante`, `by_ronda_estado`, `by_participante_item` y dimensiones técnicas para visualizaciones. No usar arreglos no acotados.
2. `pnpm exec convex codegen`.
3. Módulo `convex/pt/scores.ts`: capa de validación pura `validateScoreRows` (compartida CSV/HTTP), `previewImport` (query admin), `importScoresDraft` (admin, idempotente sobre borradores, nunca toca publicados, calcula stats/bins), consultas participantes que derivan identidad desde auth y devuelven solo filas propias o agregados seguros.
4. Importaciones grandes en lotes vía funciones internas; publicación lógica todo-o-nada.
5. Tests de autorización y de idempotencia.

Salida: datos estructurados en borrador, invisibles al participante.

### Etapa 3. Administración y publicación en Resultados

1. Extender `src/app/(protected)/dashboard/rondas/[id]/resultados/`.
2. Carga de CSV e informe general PDF (patrón upload de `convex/sgc/evidencias.ts`, solo PDF).
3. Resumen de validación: filas, participantes, clasificaciones, no satisfactorios, errores por fila.
4. Bloquear publicación ante cualquier error o falta del PDF.
5. Previsualización de los casos que serán creados.
6. `publicarResultados`: acción única, solo en `documentacion_pendiente` o `cerrada`, atómica, todo-o-nada; publica resultados + stats + informe + certificados + casos automáticos; notificaciones a participantes.
7. Publicación **irreversible** en UI y backend (sin `despublicar`; corrección post-publicación, si algún día se necesita, será re-publicación versionada, nunca toggle). Confirmación explícita en UI.
8. Auditoría de actor y fecha vía `convex/sgc/audit.ts`.

Salida: evaluación publicada simultáneamente para toda la ronda.

### Etapa 4. Endpoint HTTP para pt_app

1. `convex/http.ts` (crear si no existe): `POST /pt/scores`, autenticación contra `agentApiKeys` (patrón `convex/agent/auth.ts`), body JSON con las mismas filas del CSV; reutiliza `validateScoreRows` de la Etapa 2.
2. Respuesta `{ok, importadas, errores: [{fila, campo, mensaje}]}`. Solo escribe borradores.
3. Probar con `curl` (key válida/inválida/expirada, payload malformado); documentar snippet R `httr::POST` en `_workspace/feats/pt_scores_csv.md`.

Salida: pt_app puede empujar borradores sin upload manual.

### Etapa 5. Certificados y descargas protegidas

1. Revisar `package.json` antes de escoger generador PDF; si no hay ninguno, proponer `@react-pdf/renderer` y **confirmar con el usuario antes de `pnpm add`**.
2. Plantilla institucional del certificado: razón social, código de participante, ronda, ítems, fecha, texto de no-implicación de desempeño, firma configurada, QR/código verificable.
3. Generación de certificados como parte del proceso lógico de publicación (Etapa 3); disponibles aunque exista caso abierto.
4. Route Handlers autorizados para informe general, certificado y CSV individual.
5. CSV individual filtrado en servidor por `rondaParticipanteId`; nunca confiar en códigos del cliente. Storage Convex; audit log de descarga de certificado.
6. Probar acceso cruzado, URL manipulada y participante no asignado.

Salida: descargas disponibles desde la ronda publicada.

### Etapa 6. Vista participante por etapa de ronda

1. Refactorizar `/ronda/[codigo]` en componentes de etapa sin cambiar la ruta ni `mi-dashboard`.
2. Activa: conservar formulario y añadir calendario.
3. Cierre sin publicación: sustituir bloqueo total por "En evaluación" + confirmación del envío + calendario.
4. Publicada: resumen, fecha de publicación, conteos por clasificación, filtros (contaminante/nivel/método) y tabla de métricas con clasificación coloreada.
5. Selector de estadístico z/z'/ζ/En (client component); distribución anonimizada con bins server-side y marcador propio; heatmap y comparación por método desde agregados autorizados. Leer skill dataviz antes de codificar charts.
6. Historial de rondas publicadas sin dimensión analista.
7. Bloque de descargas y CTA del caso cuando corresponda.
8. E2E: participante ve solo lo suyo; sin publicar no ve nada. `pnpm test:e2e:start`.

Salida: ciclo de consulta completo dentro de la ronda.

### Etapa 7. Dashboard de desempeño histórico

1. Query `getMiDesempeno` en `convex/pt/scores.ts`: `ptScores` publicados de todas las rondas del usuario (join por `workosUserId` en `rondaParticipantes`), series por contaminante × nivel.
2. UI en `src/app/(protected)/mi-dashboard` (confirmar con el usuario antes de tocar navegación global; alternativa: dentro de la superficie de ronda): línea temporal del estadístico con bandas ±2/±3 (En: ±1), barras de % satisfactorio por ronda, heatmaps por método, filtros.
3. Tests de autorización + e2e básico.

Salida: tendencia multi-ronda visible para el participante.

### Etapa 8. Calendario y recordatorios

1. Query de hitos visibles ampliada a todo estado de ronda y multi-ronda (reusar `getHitosVisibleParticipanteConfig`, `convex/sgc/hitos.ts:99`). El participante no crea ni modifica eventos.
2. Componente compartido mensual/agenda en `src/components`; filtros por tipo/fase/estado.
3. Estado visual derivado de `sgcHitosRonda.estado` y fechas (próximo/completado/vencido/cancelado/no aplica).
4. Recordatorios internos idempotentes a 7, 3 y 1 día vía `crearNotificacion`.
5. Export ICS (route handler, formato iCalendar manual) validado en Google Calendar; PDF del cronograma opcional (reusa generador de Etapa 5).
6. Probar zona horaria, cambio de fecha, hitos cancelados/no aplica y ausencia de fecha.

Salida: calendario operativo sin tracking logístico.

## Incremento 2 — Caso documental y verificación

### Etapa 9. Modelo especializado del caso

1. Leer `convex/sgc/casos.ts` y `convex/sgc/comentarios.ts`; decidir extensión 1:1 de `sgcCasos` vs tabla especializada, preservando la administración SGC existente.
2. Tabla hija de resultados originadores (`casoResultadosOrigen`).
3. Documentos y versiones inmutables en tablas separadas (`casoDocumentos`, `casoDocumentoVersiones`).
4. Verificaciones contra resultados publicados posteriores (`casoVerificaciones`).
5. Hilo de mensajes participante↔admin (`sgcCasoMensajes`).
6. Índices por participante/estado, caso/categoría, caso/resultado, documento/versión.
7. Bitácora para cada transición, observación y carga.

Salida: estructura capaz de conservar historial completo.

### Etapa 10. Creación automática y flujo documental

1. Durante publicación (Etapa 3), agrupar todas las filas insatisfactorias del participante y crear **exactamente un caso** por participante/ronda.
2. Cargas privadas en PDF, imagen y hoja de cálculo, clasificadas (`analisis_causa`, `plan_accion`, `implementacion`, `verificacion_eficacia`).
3. Exigir al enviar: análisis de causa + plan de acción + implementación.
4. Inmutabilizar versiones enviadas; ajustes agregan versiones nuevas sin borrar anteriores.
5. Administrador solicita ajustes con observación simple (hilo de mensajes); vencimiento documental no bloquea (marca vencido, bitácora, plazo modificable).
6. Tras aceptar documentos: `en_espera_verificacion`.
7. Casos voluntarios del participante (queja/apelación/consulta): `crearCasoParticipante`, `misCasos`, `getCasoParticipante`, `responderCaso` (solo en `esperando_participante`).
8. Notificaciones de cambio de estado vía `convex/sgc/notificaciones.ts`.
9. Tests: unicidad del caso automático; participante no ve casos ajenos; no responde fuera del estado permitido; inmutabilidad de versiones.

Salida: revisión documental mínima y auditable.

### Etapa 11. Verificación con la siguiente ronda

1. Al publicar otra ronda, buscar casos en espera del mismo participante.
2. Proponer correspondencias técnicamente comparables para cada resultado originador.
3. Permitir al administrador vincular manualmente una ronda/resultado equivalente.
4. Marcar cada origen verificado solo con clasificación satisfactoria.
5. Mantener el caso abierto ante verificación parcial, cuestionable, insatisfactoria o ausencia de participación; insatisfactorio exige nueva iteración documental con historial.
6. Cerrar (automático o con confirmación admin) solo con todos los orígenes verificados y documentos aceptados. El cierre nunca altera la evaluación original.
7. Registrar toda decisión en bitácora.

Salida: cierre conforme a la regla normativa.

### Etapa 12. Expediente ZIP

1. Resumen PDF con origen, estados, observaciones, bitácora y verificaciones.
2. Todas las versiones documentales con nombres deterministas.
3. Referencias a los resultados posteriores satisfactorios.
4. ZIP únicamente para casos cerrados.
5. Descarga autorizada solo a responsable y administrador (Route Handler).

Salida: evidencia final descargable y privada.

## Verificación por etapa

- Cambios Convex: `pnpm exec convex codegen`.
- Siempre: `pnpm lint`, `pnpm test`, `pnpm build`.
- Rutas/autorización/descargas: `pnpm test:e2e:start`.
- Antes de cerrar cada incremento: probar explícitamente acceso cruzado entre dos participantes de la misma ronda y de rondas distintas.

## Dependencias

```text
Etapa 0 (seguridad) ─ independiente, primero

Contrato CSV (1)
  -> Modelo de evaluación (2)
     -> Administración/publicación (3)
        -> Certificados y descargas (5)
        -> Vista participante (6) -> Dashboard histórico (7)
        -> Creación automática del caso (10)
     -> Endpoint HTTP (4)

Hitos existentes -> Calendario y recordatorios (8)

Modelo del caso (9) -> Flujo documental (10)
  -> Verificación en ronda posterior (11)
     -> Expediente ZIP (12)
```
