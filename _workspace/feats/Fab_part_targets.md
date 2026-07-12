# Targets: funcionalidades para participantes

Derivado de `_workspace/feats/part_plan.md`. Cada target tiene criterios de aceptación verificables.
Workflow de ejecución: `_workspace/feats/part_workflow.md`.

## T0 — Seguridad PT endurecida (fase 0)

**Entregable:** mutaciones públicas PT imposibles de usar cross-round o fuera de estado.

Criterios:
- [ ] `upsertEnvioPT` y `submitFinalPT` rechazan `ptItemId`/`sampleGroupId`/`rondaId` que no pertenezcan a la misma ronda del `rondaParticipanteId` (error explícito, sin escritura).
- [ ] Ambas mutaciones exigen `ronda.estado === 'activa'` server-side (Convex, no solo action de Next).
- [ ] Acciones de registro (`src/app/(protected)/ronda/[codigo]/registro/actions.ts`) bloquean `documentacion_pendiente` además de `cerrada`; misma regla en mutación Convex correspondiente.
- [ ] Tests de autorización nuevos en patrón `convex/access.test.ts` cubren: ID cross-round, ronda no activa, registro en `documentacion_pendiente`.

## T1 — Puntajes importados y publicación (fase 1)

**Entregable:** admin importa CSV de pt_app, revisa, publica; datos quedan en tablas estructuradas.

Criterios:
- [ ] Tablas `ptScores` (participante × item × nivel: valorAsignado, valorParticipante, z, zPrima, zeta, en, clasificacion, u, U, unidad, estadoPublicacion) y `ptScoreRondaStats` (media, SD, n por item × nivel) en `convex/schema.ts` con índices por ronda y por participante.
- [ ] UI admin en panel de ronda: subir CSV, preview con validación (códigos de participante contra `rondaParticipantes`, items/niveles contra `rondaPtItems`), errores fila a fila antes de confirmar.
- [ ] Import idempotente: re-importar reemplaza borradores, nunca toca filas publicadas.
- [ ] Acción "publicar resultados" por ronda; escribe `sgcAuditLog`; irreversible sin acción admin explícita de despublicar.
- [ ] Contrato CSV documentado en `_workspace/feats/pt_scores_csv.md` (bloqueante: requiere export real de pt_app).

## T2 — Vista de resultados del participante (fase 1)

**Entregable:** participante ve su informe in-app y descarga PDF, solo tras publicación.

Criterios:
- [ ] Página `src/app/(protected)/ronda/[codigo]/resultados`: puntajes propios con clasificación coloreada, por contaminante × nivel, selector de estadístico (z/z'/ζ/En).
- [ ] Comparación anonimizada: distribución de la ronda con posición propia; otros labs solo como códigos.
- [ ] Query Convex devuelve exclusivamente filas del participante autenticado + agregados; nunca valores de otros participantes con identidad.
- [ ] Antes de publicación: página muestra estado "pendiente", cero datos.
- [ ] PDF del informe subido por admin descargable vía autorización con alcance participante (nueva, no `requireSgcManage`).

## T3 — Push HTTP desde pt_app (fase 1b)

**Entregable:** endpoint autenticado que acepta el mismo payload que el CSV.

Criterios:
- [ ] Convex HTTP action `POST /pt/scores` autenticada con `agentApiKeys`; reutiliza la capa de validación del import CSV.
- [ ] Respuesta con errores estructurados por fila; escribe borradores, jamás publica.
- [ ] Probado con `curl`; snippet R (`httr::POST`) documentado para pt_app.

## T4 — Dashboard de desempeño (fase 2)

**Entregable:** página "Mi desempeño" multi-ronda.

Criterios:
- [ ] Ruta `src/app/(protected)/mi-desempeno` (o sección en `mi-dashboard`): z-score en el tiempo por contaminante × nivel con bandas ±2/±3, % satisfactorio histórico, filtro por estadístico.
- [ ] Solo rondas con resultados publicados; identidad por `directorioParticipanteId`/`workosUserId`.
- [ ] Charts siguen skill dataviz.

## T5 — Casos y RCA para participante (fase 3)

**Entregable:** ciclo de vida de queja/apelación/consulta accesible al participante.

Criterios:
- [ ] Participante crea caso (tipo queja/apelación/consulta) ligado a su ronda; ve lista y estado de sus casos.
- [ ] Hilo de mensajes: participante responde y adjunta solo cuando `estado === 'esperando_participante'`; ve resolución al cierre.
- [ ] Autorización: participante solo ve casos con su `rondaParticipanteId`; admin ve todo (mutaciones en `convex/sgc/casos.ts` hoy solo admin).
- [ ] RCA: desde puntaje cuestionable/insatisfactorio, registrar causa raíz + acciones correctivas; vínculo caso ↔ fila `ptScores` visible en panel admin.
- [ ] Notificaciones (`sgcNotificaciones`) en cambios de estado del caso.

## T6 — Calendario e ICS (fase 4)

**Entregable:** vista de hitos + cronograma anual exportable.

Criterios:
- [ ] Vista calendario/timeline de hitos participante-visibles (`sgcHitosRonda`) de sus rondas.
- [ ] Cronograma anual: todas sus rondas del año; export PDF e ICS válidos (ICS abre en Google Calendar/Outlook).

## T7 — Certificados (fase 5)

**Entregable:** certificado de participación PDF autogenerado.

Criterios:
- [ ] Generación server-side con plantilla (laboratorio, ronda, fechas) al cerrar ronda; visible solo tras aprobación admin.
- [ ] Descarga desde portal con autorización de participante; registro en audit log.

## Verificación transversal (todo target)

- `pnpm build && pnpm lint && pnpm test`
- Cambios Convex: `pnpm exec convex codegen`
- Cambios ruta/auth: `pnpm test:e2e:start`
- Toda query/mutación nueva de participante con test de autorización.
