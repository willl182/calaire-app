# Revisión comparada de workflows: `Fab_part_workflow.md` vs `sol_part_workflow.md`

Fuentes:
- Fab: `_workspace/grills/Fab_part_workflow.md` (9 etapas, 0–8, un solo flujo)
- Sol: `_workspace/grills/sol_part_workflow.md` (10 etapas en 2 incrementos)

---

## 1. Puntos en común

Ambos workflows coinciden en lo esencial del pipeline y de la disciplina de ejecución:

- **Cadena de verificación idéntica**: `pnpm build`, `pnpm lint`, `pnpm test` en cada paso; `pnpm exec convex codegen` cuando se toca Convex; `pnpm test:e2e:start` para rutas/auth/descargas. Fab lo pone como "Regla general" en el encabezado; Sol lo formaliza en "Verificación por etapa".
- **Leer `convex/_generated/ai/guidelines.md` antes de tocar Convex** (encabezado de Fab; "Reglas de ejecución" ítem 2 de Sol).
- **Layout real en `src/`**: ambos reconocen que el código vive en `src/app`, `src/server`, `src/components` y que Convex vive en `convex/` raíz (Fab: "Nota de layout"; Sol: regla "Conservar la estructura actual… no introducir una migración arquitectónica").
- **Contrato CSV como bloqueante temprano**: Fab Etapa 1 ("Contrato CSV, bloqueante para T1/T3") y Sol Etapa 1 ("Contrato CSV y parser puro"). Ambos con validación por fila/campo apta para preview admin y join contra códigos de participante (Fab: `participantCode + contaminante + runCode/levelLabel`; Sol: `participant_code + run_code` ↔ `participantCode + replicateCode`).
- **Modelo Convex con estado borrador/publicado** y publicación como acto explícito de admin con auditoría (Fab Etapa 2: `estadoPublicacion: 'borrador' | 'publicado'`, `publicarResultados` con audit log vía `convex/sgc/audit.ts`; Sol Etapas 2–3: borrador invisible al participante, publicación auditada con actor y fecha).
- **Autorización estricta del participante**: solo filas propias o agregados anónimos/seguros; identidad derivada de auth, nunca del cliente (Fab Etapa 3 punto 1; Sol Etapa 2 punto 6 y Etapa 4 punto 5).
- **Certificados PDF**: revisar dependencias existentes en `package.json` antes de instalar generador (Fab Etapa 8 punto 1; Sol Etapa 4 punto 1); descarga autorizada por participante.
- **Calendario de hitos reutilizando `sgcHitosRonda`** con vista mensual + agenda/lista (Fab Etapa 7; Sol Etapa 6).
- **Casos ligados a resultados no satisfactorios con CTA desde la vista de resultados** (Fab Etapa 6 punto 5; Sol Etapa 5 punto 7).
- **Diagrama de dependencias explícito al final** (Fab "Orden y dependencias"; Sol "Dependencias"), con la misma columna vertebral: CSV → modelo → publicación → vista participante, y calendario como rama independiente.
- **Pruebas de acceso cruzado entre participantes** como criterio de seguridad (Fab Etapa 3 punto 4 y Etapa 6 punto 6; Sol Etapa 4 punto 6 y "Verificación por etapa" último ítem).

---

## 2. Diferencias

### 2.1 Estructura

- **Fab**: flujo lineal de 9 etapas (0–8), cada etapa = PR propio, con etapa 0 de seguridad sin dependencias.
- **Sol**: 2 incrementos ("Publicación, consulta y calendario" / "Caso documental y verificación") con 10 etapas y una línea de "Salida:" por etapa que define el entregable.
- **Mejor: Sol** para legibilidad de producto — los incrementos comunican qué se puede lanzar y cuándo, y las "Salida:" funcionan como criterio de done por etapa. **Mejor: Fab** para trazabilidad de ejecución — la regla "cada etapa = PR propio" y el cierre "Antes de cada PR: `/code-review` o skill verify" son operativos y verificables.

### 2.2 Alcance

- **Fab incluye trabajo que Sol omite**: Etapa 0 (hardening de `upsertEnvioPT`/`submitFinalPT` con validación de pertenencia cross-round y `ronda.estado === 'activa'`, más el fix en `registro/actions.ts:78,94,118,136`), Etapa 4 (endpoint HTTP `POST /pt/scores` para pt_app con auth `agentApiKeys`) y Etapa 5 (dashboard de desempeño multi-ronda `getMiDesempeno`).
- **Sol incluye trabajo que Fab apenas esboza**: el ciclo documental completo del caso (Etapas 7–10): tabla hija de resultados originadores, documentos con versiones inmutables, verificación contra la ronda siguiente, cierre normativo y expediente ZIP. Fab Etapa 6 solo cubre hilo de mensajes + RCA simple.
- **Mejor: Fab** en cobertura de superficie de riesgo inmediato (seguridad primero) e integraciones (HTTP para pt_app evita depender de uploads manuales). **Mejor: Sol** en profundidad del proceso de acciones correctivas, que es el requisito normativo más complejo (verificación con ronda posterior, Etapa 9).

### 2.3 Contenido / nivel de especificidad técnica

- **Fab es file-level**: cita rutas y líneas concretas (`convex/pt/index.ts:300-420`, `src/app/(protected)/ronda/[codigo]/registro/actions.ts:78,94,118,136`, `convex/sgc/shared.ts` junto a `requireParticipanteOAdmin`, parser en `src/server/rondas/csv.ts`). Un ejecutor puede empezar sin explorar.
- **Sol es requirement-level**: define reglas de negocio precisas que Fab no tiene — 17 columnas del contrato CSV, "no alterar los valores estadísticos emitidos por pt_app", "no usar arreglos no acotados", importación por lotes con funciones internas, publicación todo-o-nada e irreversible, "exactamente un caso por participante/ronda", bloqueo de publicación si falta el PDF general.
- **Mejor: empate deliberado** — Fab gana en "dónde tocar", Sol gana en "qué debe cumplirse". Son complementarios, no redundantes.

### 2.4 Enfoque de publicación

- **Fab** permite `publicarResultados` + `despublicar`.
- **Sol** hace la publicación **irreversible en UI y backend**, restringida a estados `documentacion_pendiente` o `cerrada`, bloqueada ante cualquier error de validación o ausencia del informe PDF, y con creación automática de casos como parte del mismo acto de publicar.
- **Mejor: Sol** — la irreversibilidad más las precondiciones de estado es el modelo correcto para un evento con efectos secundarios (casos, certificados, notificaciones); `despublicar` de Fab crea inconsistencias (¿qué pasa con casos y certificados ya emitidos?). Si se necesita corrección, debe ser una re-publicación versionada, no un toggle.

### 2.5 Vista del participante

- **Fab Etapa 3**: página nueva `/ronda/[codigo]/resultados` con tabla coloreada, selector z/z'/ζ/En, distribución con posición propia y estado "pendiente de publicación".
- **Sol Etapa 5**: refactor de `/ronda/[codigo]` en componentes por etapa de ronda (activa / en evaluación / publicada), con estado intermedio "En evaluación" que reemplaza el bloqueo total, heatmap, comparación por método e historial sin dimensión analista.
- **Mejor: Sol** en el modelo de UX (la máquina de estados por etapa de ronda cubre todo el ciclo de vida, no solo el estado final) ; **Fab** aporta el detalle concreto de visualización (selector de estadístico, bandas ±2/±3 en Etapa 5, y la instrucción "Leer skill dataviz antes de codificar charts").

### 2.6 Casos / no conformidades

- **Fab Etapa 6**: caso creado por el participante (queja/apelación/consulta), hilo de mensajes (`sgcCasoMensajes`), RCA como mutación `registrarRca`, estado `esperando_participante`, notificaciones vía `convex/sgc/notificaciones.ts`.
- **Sol Etapas 7–9**: caso creado **automáticamente** al publicar (agrupando filas no satisfactorias), documentos versionados e inmutables, exigencia de causa raíz + plan de acción + implementación al enviar, estado `en_espera_verificacion`, verificación técnica contra la siguiente ronda publicada con correspondencias propuestas y vínculo manual, bitácora de toda transición.
- **Mejor: Sol** — su flujo modela el proceso normativo real (acción correctiva verificada en ronda posterior) mientras Fab modela solo mensajería. Fab conserva valor en los detalles de implementación: dónde vive el código (`convex/sgc/casos.ts`, `convex/sgc/comentarios.ts`), notificaciones y el tipado queja/apelación/consulta.

### 2.7 Calendario

- **Fab Etapa 7**: incluye export **ICS** validado en Google Calendar y **PDF del cronograma anual**.
- **Sol Etapa 6**: incluye **recordatorios internos idempotentes a 7, 3 y 1 día**, derivación de estado visual desde `sgcHitosRonda.estado`, y casos de prueba de zona horaria, hitos cancelados/"no aplica" y ausencia de fecha.
- **Mejor: Sol** en robustez (recordatorios + casos borde de fechas); **Fab** en interoperabilidad (ICS/PDF). Ninguno cubre lo del otro: se suman.

### 2.8 Certificados

- **Fab Etapa 8**: acción admin "aprobar certificados" por ronda, storage Convex, audit log en descarga.
- **Sol Etapa 4**: QR/código verificable y firma configurada, generación como parte de la publicación, Route Handlers autorizados también para informe general y CSV individual filtrado server-side por `rondaParticipanteId`, con pruebas de URL manipulada.
- **Mejor: Sol** — plantilla verificable + descarga endurecida + acoplamiento a la publicación es más completo; Fab aporta el audit log de descarga, ausente en Sol.

---

## 3. Fortalezas únicas de la versión Fab

1. **Etapa 0 de seguridad sin dependencias**: cierre inmediato de la validación de pertenencia cross-round en `upsertEnvioPT`/`submitFinalPT` (con la cadena exacta `ptItem.rondaId === sampleGroup.rondaId === rondaParticipante.rondaId === args.rondaId`) y el fix de `estado !== 'activa'` en `registro/actions.ts` con líneas concretas. Sol no aborda vulnerabilidades existentes.
2. **Etapa 4 — Endpoint HTTP `POST /pt/scores`** para integración directa con pt_app (Shiny/R), reutilizando la capa de validación del CSV, auth por `agentApiKeys` (patrón `convex/agent/auth.ts`), y hasta el snippet R `httr::POST` documentado.
3. **Etapa 5 — Dashboard de desempeño histórico** (`getMiDesempeno`, línea temporal de z con bandas ±2/±3, filtros), ausente por completo en Sol.
4. **Precisión de rutas y líneas**: reduce a cero la fase de exploración del ejecutor.
5. **Disciplina de PRs**: "Cada etapa = PR propio. Antes de cada PR: `/code-review` o skill verify", y prefijos de commit (`fix(pt): ...`).
6. **Detalles de visualización**: selector de estadístico z/z'/ζ/En, distribución anonimizada "binned server-side", y la referencia explícita a la skill dataviz.
7. **Contrato CSV con validación humana**: pedir export real de pt_app y validar ambigüedades (unidades, separador decimal, encoding) con el usuario antes de codificar.

## 4. Fortalezas únicas de la versión sol

1. **División en 2 incrementos entregables** con línea "Salida:" por etapa — criterios de done y puntos de lanzamiento claros.
2. **Publicación irreversible, todo-o-nada, con precondiciones** (estados `documentacion_pendiente`/`cerrada`, sin errores, PDF obligatorio) y previsualización de los casos que se crearán.
3. **Creación automática de exactamente un caso por participante/ronda** al publicar, en lugar de depender de que el participante lo abra.
4. **Ciclo documental completo del caso**: documentos versionados inmutables, exigencia de causa raíz + plan + implementación, observaciones del admin, bitácora por transición (Etapas 7–8).
5. **Verificación normativa con la ronda posterior** (Etapa 9): correspondencias técnicas propuestas, vínculo manual, verificación parcial mantiene el caso abierto — es el corazón regulatorio y no existe en Fab.
6. **Expediente ZIP del caso cerrado** (Etapa 10) con resumen PDF, versiones con nombres deterministas y descarga restringida.
7. **Reglas de ingeniería Convex específicas**: "no usar arreglos no acotados", importación por lotes con funciones internas, cabecera de evaluación única por ronda.
8. **Máquina de estados de la vista de ronda** (activa / "En evaluación" / publicada) que elimina el bloqueo total en cierre.
9. **Recordatorios idempotentes 7/3/1 días** y batería de casos borde del calendario (zona horaria, hito cancelado, sin fecha).
10. **Descargas endurecidas**: Route Handlers con filtrado server-side por `rondaParticipanteId`, pruebas de URL manipulada; CSV individual como artefacto descargable.
11. **Regla de leer las guías de Next.js en `node_modules/next/dist/docs/`** antes de escribir código Next (alineada con AGENTS.md; Fab la omite).

---

## 5. Recomendación — workflow fusionado "lo mejor de ambos"

Estructura propuesta: los 2 incrementos de Sol + la Etapa 0 y las etapas de integración/dashboard de Fab, conservando "Salida:" por etapa (Sol) y "cada etapa = PR + /code-review" (Fab).

**Encabezado y reglas de ejecución** — de **Sol** (lista completa: pnpm, guidelines Convex, docs Next.js, estructura `src/`, pruebas proporcionales), añadiendo de **Fab** la regla condensada de verificación por paso y la nota de que AGENTS.md está desactualizado respecto a `src/`.

### Incremento 0 — Seguridad (nuevo, de Fab)
- **Etapa 0** — íntegra de **Fab**: hardening `upsertEnvioPT`/`submitFinalPT` (pertenencia cross-round, `ronda.estado === 'activa'`), fix `estado !== 'activa'` en `registro/actions.ts:78,94,118,136`, tests estilo `convex/access.test.ts`. Salida (estilo Sol): "mutaciones PT imposibles de invocar fuera de la ronda propia y activa".

### Incremento 1 — Publicación, consulta y calendario
- **Etapa 1 — Contrato CSV y parser**: base de **Sol** (17 columnas, normalización, no alterar estadísticos, fixtures y batería de pruebas unitarias), añadiendo de **Fab**: pedir export CSV real de pt_app, validar unidades/separador decimal/encoding con el usuario, documentar en `_workspace/feats/pt_scores_csv.md`, y ubicar el parser en `src/server/rondas/` junto a la infraestructura CSV existente.
- **Etapa 2 — Modelo Convex**: base de **Sol** (cabecera de evaluación por ronda, una fila por registro, sin arreglos no acotados, importación por lotes, referencias a CSV fuente e informe PDF), añadiendo de **Fab**: nombres/índices concretos (`ptScores`, `by_ronda`, `by_participante`, `by_ronda_item_nivel`), módulo `convex/pt/scores.ts`, y capa de validación pura compartida CSV/HTTP (habilita la Etapa HTTP).
- **Etapa 3 — Administración y publicación**: de **Sol** casi íntegra (resumen de validación, bloqueo por errores o falta de PDF, preview de casos, publicación irreversible en `documentacion_pendiente`/`cerrada`, auditoría de actor/fecha). **Descartar** el `despublicar` de Fab; tomar de **Fab** el audit log vía `convex/sgc/audit.ts` y la ruta `src/app/(protected)/dashboard/rondas/[id]/resultados/`. Si se requiere corrección post-publicación, especificar re-publicación versionada, no toggle.
- **Etapa 4 — Endpoint HTTP para pt_app**: íntegra de **Fab** (`convex/http.ts`, `POST /pt/scores`, auth `agentApiKeys`, respuesta `{ok, errores}`, solo borradores, snippet R). Depende de la capa de validación compartida de la Etapa 2.
- **Etapa 5 — Certificados y descargas protegidas**: base de **Sol** (QR verificable, generación en la publicación, Route Handlers para informe/certificado/CSV individual, filtrado server-side, pruebas de acceso cruzado y URL manipulada), añadiendo de **Fab**: revisar `package.json` antes de instalar generador (ambos lo dicen; conservar la sugerencia de `@react-pdf/renderer` de Fab), storage Convex y audit log de descargas.
- **Etapa 6 — Vista participante por etapa de ronda**: base de **Sol** (refactor por etapas activa/"En evaluación"/publicada, heatmap, comparación por método, historial sin analista, bloque de descargas y CTA de caso), añadiendo de **Fab**: selector de estadístico z/z'/ζ/En, distribución anonimizada binned server-side, estado "pendiente de publicación", leer skill dataviz antes de codificar charts, y e2e "participante ve solo lo suyo; sin publicar no ve nada".
- **Etapa 7 — Dashboard de desempeño histórico**: íntegra de **Fab** (`getMiDesempeno` multi-ronda por `workosUserId`, línea temporal z con bandas ±2/±3, barras de % satisfactorio, filtros). Ubicación `mi-dashboard` según regla de Sol de no mover la experiencia.
- **Etapa 8 — Calendario y recordatorios**: base de **Sol** (query de hitos ampliada, componente compartido mensual/agenda, estado visual desde `sgcHitosRonda.estado`, recordatorios idempotentes 7/3/1, pruebas de zona horaria y casos borde), añadiendo de **Fab**: export ICS validado en Google Calendar y PDF del cronograma anual como Route Handlers.

### Incremento 2 — Caso documental y verificación
- **Etapa 9 — Modelo del caso**: base de **Sol** Etapa 7 (extensión de `sgcCasos` vs tabla especializada, tabla hija de resultados originadores, documentos/versiones, verificaciones, bitácora), añadiendo de **Fab**: decidir al leer `convex/sgc/casos.ts` y `convex/sgc/comentarios.ts`, y conservar los tipos de caso iniciados por participante (queja/apelación/consulta) además del caso automático.
- **Etapa 10 — Creación automática y flujo documental**: de **Sol** Etapa 8 íntegra (un caso por participante/ronda al publicar, cargas privadas, causa raíz + plan + implementación, versiones inmutables, observaciones, `en_espera_verificacion`), añadiendo de **Fab**: hilo de mensajes participante↔admin, notificaciones de cambio de estado vía `convex/sgc/notificaciones.ts`, y tests "no responde fuera del estado que lo permite".
- **Etapa 11 — Verificación con la siguiente ronda**: íntegra de **Sol** Etapa 9 (correspondencias propuestas, vínculo manual, cierre solo con todos los orígenes verificados, bitácora). Sin equivalente en Fab.
- **Etapa 12 — Expediente ZIP**: íntegra de **Sol** Etapa 10.

### Cierres transversales
- **Verificación por etapa**: sección de **Sol** (incluida la prueba explícita de acceso cruzado entre dos participantes antes de cerrar cada incremento), más la regla de **Fab** "cada etapa = PR propio; antes de cada PR `/code-review` o skill verify" y prefijos de commit.
- **Diagrama de dependencias**: fusionar ambos — la columna de Sol (CSV → modelo → publicación → {certificados, vista, caso automático}; hitos → calendario; caso → documentos → verificación → ZIP) añadiendo las ramas de Fab: Etapa 0 independiente al inicio, HTTP como rama desde el modelo, y dashboard histórico tras la vista participante.

**Resumen de descartes**: `despublicar` (Fab, sustituido por publicación irreversible de Sol); vista de resultados como página aislada `/resultados` (Fab, sustituida por el refactor por etapas de Sol); dependencia exclusiva del caso iniciado por el participante (Fab, complementada por la creación automática de Sol).
