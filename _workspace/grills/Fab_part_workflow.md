# Workflow: implementación de funcionalidades para participantes

Plan base: `_workspace/feats/part_plan.md`. Targets y criterios: `_workspace/feats/part_targets.md`.
Regla general: cada paso termina con `pnpm build && pnpm lint && pnpm test`; si tocó Convex, antes `pnpm exec convex codegen`; si tocó rutas/auth, `pnpm test:e2e:start`. Leer `convex/_generated/ai/guidelines.md` antes de tocar Convex.

Nota de layout: el código vive en `src/` (`src/app`, `src/server`, `src/components`, `src/lib`) — la sección "T3 structure" de AGENTS.md está desactualizada en esto. Convex vive en `convex/` raíz.

## Etapa 0 — Seguridad (T0) — sin dependencias

1. Leer `convex/pt/index.ts:300-420` (`upsertEnvioPT`, `submitFinalPT`) y el helper de autorización que usan.
2. Añadir validación de pertenencia: cargar `rondaParticipante`, `ptItem`, `sampleGroup`; exigir `ptItem.rondaId === sampleGroup.rondaId === rondaParticipante.rondaId === args.rondaId`. Fallar con `ConvexError` antes de cualquier escritura.
3. Añadir chequeo `ronda.estado === 'activa'` en ambas mutaciones.
4. En `src/app/(protected)/ronda/[codigo]/registro/actions.ts:78,94,118,136` cambiar condición a `estado !== 'activa'` (bloquea `cerrada` y `documentacion_pendiente`); replicar la regla en la mutación Convex de fichas (`convex/rondas/fichas.ts` / `convex/fichas/index.ts`).
5. Tests: extender patrón de `convex/access.test.ts` con casos cross-round, ronda no activa, registro en `documentacion_pendiente`.
6. Verificar y commit (`fix(pt): ...`).

## Etapa 1 — Contrato CSV (bloqueante para T1/T3)

1. Pedir al usuario un export CSV real de pt_app (https://w421.shinyapps.io/pt_app/).
2. Documentar columnas, tipos, mapeo a `ptScores` en `_workspace/feats/pt_scores_csv.md`; decidir claves de join (participantCode + contaminante + runCode/levelLabel contra `rondaPtItems`).
3. Validar con el usuario ambigüedades (unidades, separador decimal, encoding).

## Etapa 2 — Modelo y import de puntajes (T1)

1. Schema: `ptScores` + `ptScoreRondaStats` en `convex/schema.ts`; índices `by_ronda`, `by_participante`, `by_ronda_item_nivel`. `estadoPublicacion: 'borrador' | 'publicado'`.
2. `pnpm exec convex codegen`.
3. Módulo `convex/pt/scores.ts`: capa de validación pura (compartida CSV/HTTP), mutación `importScoresDraft` (admin, idempotente sobre borradores), query admin de preview, mutación `publicarResultados` + `despublicar` (audit log vía `convex/sgc/audit.ts`).
4. Parser CSV en `src/server/rondas/csv.ts` (ya existe infraestructura CSV ahí) o módulo hermano `scores-csv.ts` con tests unitarios.
5. UI admin: sección en panel de ronda (`src/app/(protected)/dashboard/rondas/...`): upload, tabla de preview con errores por fila, confirmar import, botón publicar.
6. Tests de autorización (solo admin importa/publica) + tests de parser. Verificar y commit.

## Etapa 3 — Vista de resultados del participante (T2)

1. Query Convex `getMisResultados` en `convex/pt/scores.ts`: autoriza por `rondaParticipanteId` del usuario, devuelve filas propias + `ptScoreRondaStats` + distribución anonimizada (valores sin identidad o binned server-side); solo si `estadoPublicacion === 'publicado'`.
2. Nueva autorización de descarga con alcance participante (helper en `convex/sgc/shared.ts` junto a `requireParticipanteOAdmin`); aplicarla a PDF de informe subido por admin (reusar `sgcEvidenciaSeries`/`sgcPublicaciones` con marca per-participante o tabla ligera `ptInformes`).
3. Página `src/app/(protected)/ronda/[codigo]/resultados/page.tsx` + componentes: tabla de puntajes con clasificación coloreada, selector z/z'/ζ/En, distribución con posición propia, botón descarga PDF. Estado "pendiente de publicación" cuando no hay datos.
4. E2E: participante ve solo lo suyo; sin publicar no ve nada. `pnpm test:e2e:start`. Commit.

## Etapa 4 — Endpoint HTTP para pt_app (T3)

1. `convex/http.ts` (crear si no existe): `POST /pt/scores`, autenticación contra `agentApiKeys` (patrón de `convex/agent/auth.ts`), body JSON con mismas filas que CSV; reutiliza capa de validación de etapa 2.
2. Respuesta `{ok, errores: [{fila, campo, mensaje}]}`. Solo escribe borradores.
3. Probar con `curl`; escribir snippet R `httr::POST` en `_workspace/feats/pt_scores_csv.md`. Commit.

## Etapa 5 — Dashboard de desempeño (T4)

1. Query `getMiDesempeno`: agrupa `ptScores` publicados de todas las rondas del usuario (join por `workosUserId` en `rondaParticipantes`), series por contaminante × nivel.
2. Leer skill dataviz antes de codificar charts.
3. UI en `src/app/(protected)/mi-dashboard` (nueva pestaña/sección): línea temporal de z con bandas ±2/±3, barras de % satisfactorio, filtros de estadístico y contaminante.
4. Tests de autorización + e2e básico. Commit.

## Etapa 6 — Casos y RCA (T5)

1. Schema: tabla `sgcCasoMensajes` (casoId, autorTipo participante|admin, texto, adjuntos, createdAt) o extender comentarios con `casoId`; campo/tabla de RCA (`causaRaiz`, `accionesCorrectivas`, `ptScoreId`) — decidir al leer `convex/sgc/casos.ts` y `convex/sgc/comentarios.ts`.
2. Mutaciones participante en `convex/sgc/casos.ts`: `crearCasoParticipante` (tipos queja/apelación/consulta, liga `rondaParticipanteId` propio), `responderCaso` (solo si `esperando_participante`), queries `misCasos`/`getCasoParticipante` con autorización estricta.
3. RCA: mutación `registrarRca` ligando caso ↔ `ptScores`; vista admin del RCA en panel de casos existente.
4. Notificaciones de cambio de estado vía `convex/sgc/notificaciones.ts`.
5. UI participante: lista de casos + detalle con hilo en la zona post-cierre de ronda; CTA "abrir caso / registrar RCA" desde fila de puntaje malo en `/resultados`.
6. Tests autorización (participante no ve casos ajenos; no responde fuera de `esperando_participante`) + e2e. Commit.

## Etapa 7 — Calendario (T6)

1. Query `getMisHitos`: hitos participante-visibles (`sgcHitosRonda`, ver `convex/sgc/hitos.ts`) de todas las rondas del usuario.
2. UI calendario/timeline (componente en `src/components`), vista mensual + lista anual.
3. Export ICS (generación server-side, ruta handler `src/app/.../route.ts`) y PDF del cronograma anual. Validar ICS en Google Calendar.
4. Commit.

## Etapa 8 — Certificados (T7)

1. Elegir generador PDF ya presente en deps (revisar `package.json`; si no hay, proponer `@react-pdf/renderer` o similar antes de instalar).
2. Plantilla certificado (datos de `directorioParticipantes` + ronda + fechas); acción admin "aprobar certificados" por ronda; generación y almacenamiento en storage Convex.
3. Query/descarga con autorización participante + audit log. UI: botón en página de ronda cerrada.
4. Commit.

## Orden y dependencias

```
Etapa 0 ──────────────────────────────┐
Etapa 1 ─→ Etapa 2 ─→ Etapa 3 ─→ Etapa 5
                 └──→ Etapa 4
Etapa 3 ─→ Etapa 6 (CTA desde resultados)
Etapa 7, Etapa 8: independientes tras Etapa 0
```

Cada etapa = PR propio. Antes de cada PR: `/code-review` o skill verify.
