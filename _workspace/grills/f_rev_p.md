# Revisión comparada: `Fab_part_plan.md` vs `sol_part_plan.md`

Fecha: 2026-07-12. Fuentes: `_workspace/grills/Fab_part_plan.md` (Fab) y `_workspace/grills/sol_part_plan.md` (sol).

## 1. Puntos comunes

Ambos planes coinciden en lo esencial del dominio:

- **Calaire no calcula estadística.** Fab ("Decisiones cerradas": "calaire no calcula estadística") y sol (§2.3: "consume resultados ya revisados y no recalcula puntajes ni clasificaciones") delegan todo el cálculo en `pt_app` (Shiny).
- **Importación por CSV con validación y previsualización antes de publicar.** Fab §3.3 (`previewImport`, `importScoresDraft`) y sol §2.3 (pasos 3–4: validaciones, previsualización, publicación).
- **Contrato CSV casi idéntico.** Las columnas coinciden columna por columna (`participant_code, contaminante, run_code, level_label, unidad, valor_asignado, u_xpt, sigma_pt, valor_participante, u_lab, U_lab, z, z_prima, zeta, en, clasificacion`); sol añade `metodo`.
- **Publicación explícita del admin, no automática al importar.** Fab: "Import crea borrador; visible solo tras publicación explícita admin". sol: estados `sin_cargar → borrador_validado → publicada`, publicación simultánea para toda la ronda.
- **Anonimato ISO 17043.** Ambos: solo códigos de participante; los datos de otros laboratorios solo alimentan agregados (Fab §3.1 nota de diseño sobre bins; sol §2.5 "Privacidad").
- **Estadísticos z, z', ζ, En con clasificación importada** como fuente de verdad (Fab tabla de decisiones; sol §2.4).
- **Calendario desde `sgcHitosRonda` con `visibleParticipante = true`**, sin crear un modelo de eventos paralelo, y el participante no crea eventos (Fab §6; sol §2.2).
- **Informe general PDF subido por el admin** y descargable por el participante (Fab §3.5 / `ptInformes`; sol §2.6).
- **Certificados PDF generados por la app** con datos del laboratorio, código de participante y ronda (Fab §7; sol §2.6).
- **Casos ligados a resultados no satisfactorios** con revisión por Calaire, cambios de estado y flujo participante↔admin (Fab §5; sol §2.7).
- **Autorización servidor: derivar identidad, verificar pertenencia a la ronda, devolver solo filas propias o agregados** (Fab §3.4; sol §3 Convex).
- **Tablas Convex separadas y normalizadas con índices por ronda/participante/ítem**, nunca arreglos embebidos en la ronda (Fab §3.1; sol §3).
- **Verificación estándar del repo:** `convex codegen`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e:start` (Fab §8 y §10; sol §6).
- **Fuera de alcance compartido:** multiusuario por laboratorio, logística/tracking de muestras, enrollment/inscripción en línea (Fab §1 "Fuera"; sol §7).

## 2. Diferencias (y qué versión resuelve mejor cada aspecto)

### 2.1 Estructura del documento
- **Fab:** organizado por fases de entrega (0–5) con matriz de pruebas, riesgos y orden de entrega; referencia documentos hermanos (`part_workflow.md`, `part_targets.md`).
- **sol:** organizado por capacidad funcional (§2 alcance) + encaje arquitectónico (§3) + dos incrementos (§4) + criterios de aceptación (§5).
- **Mejor: empate con matices.** Fab es superior como plan ejecutable (fases pequeñas, orden, PR por fase); sol es superior como especificación funcional (reglas de negocio exhaustivas por capacidad).

### 2.2 Seguridad previa (fase 0)
- **Fab §2** identifica vulnerabilidades concretas con archivo y línea: `upsertEnvioPT` (`convex/pt/index.ts:318`) confía en IDs del cliente, `submitFinalPT` (`:368`) sin chequeo de estado, fichas editables en `documentacion_pendiente` (`registro/actions.ts:78,94,118,136`), con código propuesto y tests.
- **sol** no tiene equivalente; solo enuncia el criterio genérico de que nadie acceda a filas ajenas (§5).
- **Mejor: Fab, claramente.** Es trabajo bloqueante real que sol omite.

### 2.3 Modelo de datos
- **Fab §3.1** da schemas Convex literales (`ptScores`, `ptScoreRondaStats`, `ptInformes`, `sgcCasoMensajes`, `ptRcaRegistros`) con validators e índices exactos, incluida la decisión de precalcular bins de histograma al importar para garantizar anonimato "por construcción".
- **sol §3** da un modelo conceptual más rico para casos (`evaluacionesRonda`, `resultadosEvaluados`, `casosMejora`, `casoResultadosOrigen`, `casoDocumentos`/`casoDocumentoVersiones`, `casoVerificaciones`) pero sin código.
- **Mejor: Fab en precisión implementable (schemas listos); sol en cobertura del dominio de casos** (versionado documental y verificación de eficacia que el modelo de Fab no soporta).

### 2.4 Clave de correspondencia del CSV
- **Fab §3.2:** join por `participant_code` + (`contaminante`,`run_code`,`level_label`) contra `rondaPtItems` (índice `by_ronda_cont_run`).
- **sol §2.4:** identidad = `participant_code + run_code`, correspondida con `rondaParticipantes.participantCode + replicateCode`.
- **Mejor: Fab.** Su clave es más granular (por ítem/nivel) y cita el índice existente; la clave de sol no distingue niveles del mismo run. Pero sol aporta dos reglas valiosas que Fab no tiene: vocabulario cerrado de `clasificacion` y "vacío → `null`, nunca cero".

### 2.5 Semántica de publicación
- **Fab:** borradores reimportables (`importScoresDraft` borra borradores previos, nunca toca publicados), `publicarResultados`/`despublicarResultados`, publicación por ronda con notificaciones.
- **sol:** publicación única, atómica y sin versionado posterior ("No existe edición, reemplazo o versionado posterior"), restringida a estados `documentacion_pendiente`/`cerrada`, y que publica a la vez resultados + informe + certificados + casos.
- **Mejor: sol en reglas de negocio** (restricción por estado de ronda, atomicidad, todo-o-nada ante errores, publicación conjunta con certificados y casos); **Fab en mecánica** (idempotencia del borrador, despublicar como vía de corrección — sol se pinta en una esquina al prohibir toda corrección posterior).

### 2.6 Casos / mejora
- **Fab §5:** hilo de mensajes genérico (`sgcCasoMensajes`), RCA ligero por score (`ptRcaRegistros`: causa raíz + acciones), creación **voluntaria** por el participante (quejas, apelaciones, consultas y NC/CAPA opcional desde un score no satisfactorio).
- **sol §2.7–2.8:** caso **automático y obligatorio** (uno por participante/ronda al publicar), documentos clasificados (`analisis_causa`, `plan_accion`, `implementacion`, `verificacion_eficacia`) con versiones inmutables, flujo de estados explícito, bitácora, y **verificación de eficacia** contra la siguiente ronda comparable (regla de cierre: aceptación documental + resultado satisfactorio por cada ítem originador; sin ronda posterior el caso queda abierto).
- **Mejor: sol, con ventaja grande.** Su diseño de casos es el correcto para un proveedor PT (ISO 17043/CAPA): trazable, verificable y sin depender de la iniciativa del participante. Fab conserva algo que sol excluye: quejas/apelaciones/consultas iniciadas por el participante, que sí valen la pena.

### 2.7 Vía de importación adicional
- **Fab §3.6:** HTTP action `POST /pt/scores` con `agentApiKeys` y snippet R para push directo desde Shiny.
- **sol:** solo CSV manual.
- **Mejor: Fab** (opción de automatización futura, bien acotada como fase 1b).

### 2.8 Dashboard histórico / tendencias
- **Fab §4:** query `getMiDesempeno` multi-ronda, línea temporal con bandas ±2/±3, barras apiladas, en `mi-dashboard`.
- **sol §2.5:** historial filtrable dentro de resultados, más heatmaps y comparativos por método; explícitamente **no** toca `mi-dashboard` (§1).
- **Mejor: Fab en especificidad técnica** (query, series, bandas de control); sol añade dimensión `metodo` y heatmaps que Fab no contempla. La ubicación es una decisión de producto; la restricción de sol (no tocar navegación global) es más conservadora y segura.

### 2.9 Calendario
- **Fab §6:** export ICS (route handler, formato manual validado en Google Calendar) y PDF del cronograma; vista mensual + lista anual multi-ronda.
- **sol §2.2:** recordatorios internos a 7/3/1 días, filtros por tipo/fase/estado, estados vencido/cancelado/no aplicable, calendario visible durante todo el ciclo.
- **Mejor: complementarios.** Fab aporta exportación; sol aporta recordatorios y semántica de estados. Ninguno cubre lo del otro.

### 2.10 Descargas
- **sol §2.6** define cuatro descargas: informe general, certificado (con requisitos de contenido: texto que no implique desempeño satisfactorio, firma, código/QR verificable), **CSV individual** del participante y **ZIP del expediente del caso**. Además §3 exige Route Handlers con autorización.
- **Fab** solo cubre informe PDF y certificado.
- **Mejor: sol.** CSV propio y ZIP de expediente son requisitos reales; el detalle del contenido del certificado (QR, texto de no-implicación) es normativo y Fab lo omite.

### 2.11 Riesgos, bloqueos y pruebas
- **Fab §8–9:** matriz de pruebas por área y riesgos explícitos (CSV sin export real como bloqueante, stats de ronda, librería PDF pendiente de aprobación, discrepancia AGENTS.md vs `src/`).
- **sol:** no tiene sección de riesgos; su §5 de criterios de aceptación es fuerte pero no es una matriz de pruebas.
- **Mejor: Fab.** El riesgo #1 (no existe export real de pt_app) es la observación más importante de todo el ejercicio y sol lo trata como resuelto ("contrato inicial").

## 3. Fortalezas únicas de la versión Fab

1. **Fase 0 de seguridad** con hallazgos concretos archivo:línea y código de corrección (§2) — no existe en sol.
2. **Schemas Convex listos para pegar** con índices y validators (§3.1, §5.2).
3. **Histograma con bins precalculados en importación** — anonimato garantizado por construcción, sin que la query del participante lea datos ajenos (§3.1).
4. **HTTP action + API key + snippet R** para push desde pt_app (§3.6).
5. **Reconocimiento explícito del contrato CSV como bloqueante** y de que las stats de ronda (media/SD/n) pueden no venir en el export (§9.1–9.2).
6. **Matriz de pruebas por área** (§8) mapeada a convex-test/unit/E2E.
7. **Dashboard de tendencias multi-ronda** con bandas de control ±2/±3 y En ±1 (§4).
8. **Export ICS y PDF del calendario** (§6).
9. **Precisión operativa:** reuso de patrones existentes citados (`requireAdminIdentity` de `createPTItem`, upload de `sgc/evidencias.ts`, `getHitosVisibleParticipanteConfig` en `hitos.ts:99`, `agentApiKeys`), orden de entrega con un PR por fase y `/code-review`.
10. **Riesgo de layout:** advierte que AGENTS.md describe rutas sin `src/` pero el código real vive en `src/` (§9.4).

## 4. Fortalezas únicas de la versión sol

1. **Ciclo completo de mejora (CAPA):** caso automático único por participante/ronda, documentos clasificados en cuatro categorías, versionado inmutable, bitácora y flujo de estados explícito (§2.7).
2. **Verificación de eficacia** contra la siguiente ronda comparable, con reglas para verificación parcial, resultado cuestionable, reincidencia y ausencia de participación posterior (§2.8) — completamente ausente en Fab, cuyo RCA es un formulario texto sin cierre verificable.
3. **Reglas de publicación de negocio:** solo en `documentacion_pendiente`/`cerrada`, atómica, todo-o-nada, sin publicaciones parciales, y simultánea para resultados + informe + certificados + casos (§2.3).
4. **Descargas completas:** CSV individual del participante y ZIP de expediente del caso; requisitos de contenido del certificado incluyendo QR verificable y texto que no implique desempeño satisfactorio (§2.6).
5. **Vista de ronda por estado del ciclo:** activa / cierre sin evaluación ("En evaluación") / evaluación publicada (§2.1) — la máquina de estados de UX que Fab no formula.
6. **Columna `metodo`** en el CSV y comparativos/heatmaps por método (§2.4–2.5).
7. **Reglas de datos:** vocabulario cerrado de `clasificacion`; vacío → `null`, nunca cero (§2.4).
8. **Recordatorios de calendario 7/3/1 días** y estados de hito (vencido, cancelado, no aplicable) (§2.2).
9. **Restricción de superficie:** todo dentro de `/ronda/[codigo]`, sin tocar `mi-dashboard` ni la navegación global (§1) — reduce riesgo de regresión.
10. **Procesamiento en lotes / funciones internas** para publicación masiva respetando límites transaccionales de Convex (§3).
11. **Fuera de alcance más disciplinado** (§7): prohíbe explícitamente formularios RCA estructurados, edición del envío final y casos voluntarios para satisfactorios — decisiones que evitan scope creep.

## 5. Recomendación: esquema del plan fusionado

Base estructural: las **fases de Fab** (ejecutables, con orden y pruebas), enriquecidas con las **reglas de negocio de sol**. Ítem por ítem:

1. **Alcance y decisiones cerradas** — tabla de Fab §1, añadiendo de sol: columna `metodo`, publicación restringida a `documentacion_pendiente`/`cerrada`, y la lista "fuera de alcance" de sol §7 (más completa) fusionada con la de Fab.
2. **Fase 0 — Seguridad** — íntegra de **Fab §2** (validación cross-round en `upsertEnvioPT`, estado en `submitFinalPT`, fichas, tests convex-test). sol no aporta aquí.
3. **Contrato CSV** — columnas de **Fab §3.2 + `metodo` de sol**; clave de join de **Fab** (participante × contaminante × run × nivel, índice `by_ronda_cont_run`); reglas de datos de **sol §2.4** (vocabulario cerrado de clasificación, vacío→`null`); mantener el estatus de **bloqueante** y la validación contra export real de **Fab §9.1**.
4. **Schema de resultados** — `ptScores`/`ptScoreRondaStats`/`ptInformes` de **Fab §3.1** (incluidos bins precalculados), añadiendo campo `metodo` y una cabecera tipo `evaluacionesRonda` de **sol** para el estado `sin_cargar/borrador_validado/publicada` y la referencia al CSV/PDF cargados.
5. **Importación y publicación** — mecánica de **Fab §3.3** (`validateScoreRows` pura, preview, borradores idempotentes, `writeAudit`, notificaciones) + reglas de **sol §2.3**: publicación atómica todo-o-nada, solo en `documentacion_pendiente`/`cerrada`, simultánea con informe/certificados/casos, procesada en lotes vía funciones internas (sol §3). Conservar `despublicarResultados` de Fab como vía de corrección excepcional (relajar el "sin corrección posterior" de sol, que es frágil ante errores reales).
6. **Vista de resultados del participante** — página y queries de **Fab §3.4–3.5** (`getMisResultados` con `requireParticipantOrAdminForRonda`, selector z/z'/ζ/En, histograma con marcador, skill dataviz) + de **sol §2.5**: máquina de estados de la ronda (activa / En evaluación / publicada), conteos por clasificación, filtros por método, y alerta con acceso al caso.
7. **Descargas** — sección de **sol §2.6** completa: informe general (mecánica `ptInformes` de Fab), certificado con requisitos de contenido de sol (QR, texto de no-implicación, firma), **CSV individual** y **ZIP de expediente**; implementadas como Route Handlers con autorización (sol §3) siguiendo la doc de Next.js instalada.
8. **Fase 1b — HTTP action** — íntegra de **Fab §3.6** (endpoint, `agentApiKeys`, snippet R).
9. **Fase 2 — Dashboard histórico** — query y visualizaciones de **Fab §4** (bandas ±2/±3, barras apiladas) + dimensión método y heatmaps de **sol §2.5**. Ubicación: seguir la restricción de sol (dentro de la superficie del participante) solo si el usuario confirma no tocar `mi-dashboard`; en caso contrario, `mi-dashboard` como propone Fab.
10. **Fase 3 — Casos** — modelo de **sol §2.7–2.8** como núcleo: caso automático único por participante/ronda al publicar, documentos clasificados con versiones inmutables (`casoDocumentos`/`casoDocumentoVersiones`), bitácora, flujo Pendiente→Revisión→Ajustes→Espera de verificación→Cerrado, y **verificación de eficacia** con ronda posterior comparable (`casoVerificaciones`). Implementación sobre `sgcCasos` con los detalles técnicos de **Fab §5** (hilo `sgcCasoMensajes` para la "observación textual", autorización por `rondaParticipanteId`, notificaciones vía `crearNotificacion`). Mantener de Fab la capacidad de casos voluntarios del participante (queja/apelación/consulta), que sol excluye pero es requisito ISO 17043. Descartar `ptRcaRegistros` de Fab (formulario RCA) a favor del modelo documental de sol, coherente con "sin formularios RCA estructurados".
11. **Fase 4 — Calendario** — unión de ambos: fuente `sgcHitosRonda` (ambos), vista mensual + agenda (ambos), filtros y estados de hito + **recordatorios 7/3/1 días** de **sol §2.2**, y **export ICS** (+ PDF opcional) de **Fab §6**.
12. **Fase 5 — Certificados** — flujo de generación/aprobación de **Fab §7** (`@react-pdf/renderer` pendiente de aprobación, `ptCertificados`, aprobación admin) + contenido y publicación de **sol**: emitidos junto con la publicación de resultados, disponibles aunque exista caso abierto, con QR/código verificable y texto de no-implicación de desempeño.
13. **Pruebas** — matriz de **Fab §8** ampliada con los criterios de aceptación de **sol §5** como casos E2E/convex-test (unicidad del caso automático, inmutabilidad documental, cierre solo con verificación completa, CSV individual, descarga protegida).
14. **Riesgos y orden de entrega** — íntegros de **Fab §9–10** (contrato CSV bloqueante, stats de ronda, librería PDF, discrepancia AGENTS.md/`src/`), añadiendo un riesgo nuevo derivado de sol: la verificación de eficacia introduce acoplamiento entre rondas (vinculación de "ronda comparable") que debe diseñarse antes del Incremento 2.

**Secuencia sugerida:** Fase 0 → contrato CSV validado con export real → Fase 1 (schema+import+publicación con reglas sol) → descargas → Fase 1b HTTP → Fase 2 dashboard → Fase 3 casos+verificación → Fase 4 calendario → Fase 5 certificados (adelantable a Fase 1 si se adopta la publicación conjunta de sol). Un PR por fase con `/code-review`, verificación por incremento según sol §6 / Fab §10.
