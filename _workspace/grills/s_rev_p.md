# Revisión comparativa de los planes de participantes

Documentos comparados:

- `Fab_part_plan.md` (en adelante, **Fab**)
- `sol_part_plan.md` (en adelante, **Sol**)

## 1. Resumen ejecutivo

Ambos planes comparten el núcleo correcto: Calaire no calcula la evaluación estadística; importa resultados revisados desde `pt_app`, los valida antes de publicarlos, protege el anonimato, muestra resultados propios y agregados seguros, reutiliza hitos SGC para el calendario y ofrece evidencia descargable. También coinciden en separar datos normalizados e indexados en Convex, exigir autorización servidor a servidor y verificar la implementación con codegen, lint, tests, build y E2E.

La diferencia principal es de profundidad y orientación:

- **Fab** es un plan técnico incremental, amplio y cercano al código actual. Incluye una fase de seguridad previa, contratos de tablas y funciones concretas, importación CSV seguida de una API HTTP, dashboard histórico, casos conversacionales/RCA, calendario y certificados.
- **Sol** es un plan funcional y de gobierno más cohesivo. Define con mayor precisión el ciclo de publicación, la inmutabilidad de la evaluación, el caso obligatorio de mejora, el versionado documental y la verificación de eficacia en participaciones posteriores. Mantiene toda la experiencia dentro de la ronda y agrupa la entrega en dos incrementos.

La versión final debería conservar la precisión técnica y la fase de seguridad de Fab, pero adoptar de Sol el modelo de publicación única, el expediente documental inmutable y el cierre condicionado a eficacia posterior. No conviene fusionar literalmente ambos modelos de casos: describen productos distintos y requieren una decisión explícita.

## 2. Puntos comunes

### 2.1 Fuente y tratamiento de resultados

Los dos planes acuerdan que:

- `pt_app` es la fuente de los valores y clasificaciones evaluadas.
- Calaire importa, valida, almacena, publica y presenta; no recalcula estadísticos ni clasificación.
- El CSV contiene identidad anonimizada, clave técnica, valores asignados/del participante y métricas `z`, `z_prima`, `zeta` y `en`.
- Los valores no aplicables deben persistirse como `null`, no como cero implícito.
- La publicación requiere revisión administrativa y los borradores no son visibles al participante.

### 2.2 Privacidad y autorización

Ambos exigen:

- acceso individual solamente a resultados propios;
- agregados o histogramas seguros para comparaciones grupales;
- ausencia de identidades, correos o resultados individuales de terceros;
- autorización en Convex y en rutas de descarga, no solo ocultamiento en UI;
- códigos de participante como identidad visible.

### 2.3 Modelo de datos

Los dos proponen tablas normalizadas, no arreglos embebidos en una ronda, con:

- cabecera o estado de evaluación/publicación;
- filas de resultados por ronda y participante;
- índices por ronda, participante, ítem o combinación técnica;
- almacenamiento separado de informes/certificados;
- modelos separados para casos y su documentación.

### 2.4 Experiencia de resultados

Coinciden en presentar:

- valores propios frente a valores asignados;
- estadísticos y clasificación importada;
- filtros por dimensión técnica;
- gráficos o distribuciones grupales sin revelar terceros;
- informe PDF descargable;
- estado pendiente cuando todavía no se publica la evaluación.

### 2.5 Calendario

Los dos reutilizan `sgcHitosRonda` y limitan la vista a hitos con `visibleParticipante === true`. Coinciden también en una vista mensual/lista, en no crear un segundo modelo de eventos y en excluir seguimiento logístico.

### 2.6 Calidad y verificación

Ambos contemplan pruebas para parser, autorización, privacidad, publicación y descargas, además de:

- `pnpm exec convex codegen` para cambios Convex;
- `pnpm lint`;
- `pnpm test`;
- `pnpm build`;
- `pnpm test:e2e:start` para cambios de ruta o autorización.

## 3. Diferencias relevantes

| Tema | Fab | Sol | Evaluación |
|---|---|---|---|
| Punto de partida | Fase 0 de seguridad PT antes de nuevas funciones | Empieza por evaluación/calendario | Conservar la fase 0 de Fab; reduce riesgo sobre datos existentes. |
| Superficie participante | Añade `/ronda/[codigo]/resultados` y dashboard histórico en `mi-dashboard` | Mantiene todo dentro de `/ronda/[codigo]`; no cambia `mi-dashboard` | Para el primer incremento, Sol reduce dispersión. El historial puede quedar como fase posterior dentro de la ronda o aprobarse explícitamente para dashboard. |
| Publicación | Puntajes, stats e informes pueden tener estados/acciones propios; contempla despublicar | Una acción publica simultáneamente evaluación, informe, certificados y casos; sin reemplazo, edición ni versionado | Adoptar la publicación lógica única de Sol. Evitar `despublicar` ordinario; cualquier corrección requiere un procedimiento excepcional auditado fuera del MVP. |
| Momento de publicación | No restringe claramente por estado de ronda | Solo en `documentacion_pendiente` o `cerrada` | Adoptar restricción de Sol. |
| Importaciones posteriores | CSV primero y luego HTTP push desde Shiny; reemplaza borradores, nunca publicados | Un CSV definitivo; sin reemplazo posterior | Compatible si HTTP queda como incremento posterior y solo puede crear/reemplazar borradores antes de publicación. |
| Atomicidad/escala | Mutaciones masivas directas; nota de volumen pequeño | Atomicidad lógica y procesamiento interno por lotes | Adoptar lotes internos y una cabecera de evaluación que controle visibilidad conjunta. |
| Clave CSV | `participant_code` + `(contaminante, run_code, level_label)` contra ítem | identidad del envío `participant_code + run_code`, además de dimensiones técnicas | Debe validarse con un export real. La clave de fila probablemente necesita participante + réplica + ítem/nivel; `participant_code + run_code` por sí sola puede no distinguir varios analitos/niveles. |
| Vocabulario de clasificación | `satisfactorio`, `cuestionable`, `insatisfactorio` | `satisfactoria`, `cuestionable`, `no satisfactoria` | Definir un vocabulario canónico único y un mapeo estricto desde el CSV. No mezclar literales en schema/UI. |
| Stats y visualización | Media, SD, n y bins precalculados; histogramas y tendencias | Resúmenes, distribuciones, heatmaps y comparaciones por método | Usar agregados precalculados/seguros; heatmaps y comparaciones avanzadas pueden ser una segunda capa tras tabla e histograma. |
| Casos disparadores | Casos voluntarios (`queja`, `apelacion`, `consulta`) y RCA opcional para cuestionable/insatisfactorio | Un caso automático obligatorio por participante/ronda si hay al menos un no satisfactorio | Son flujos distintos. Mantener casos generales existentes, pero crear un tipo especializado de mejora automático solamente por resultados no satisfactorios. |
| Modelo de mejora | Formulario estructurado `causaRaiz` + `accionesCorrectivas`; hilo de mensajes | Expediente documental simple, categorías obligatorias, versiones inmutables y observación textual | Para el caso de mejora adoptar Sol. No duplicar la misma información en formulario RCA y documentos salvo requisito normativo confirmado. |
| Cierre de caso | Admin marca RCA revisado; flujo conversacional | Requiere aceptación documental y resultado satisfactorio posterior comparable para todos los ítems origen | Adoptar Sol: es más trazable y representa eficacia, no solo revisión documental. |
| Certificado | Se genera al cerrar ronda y se aprueba/publica después | Se genera al publicar evaluación; disponible aunque el caso esté abierto, con QR verificable y texto neutral | Adoptar Sol, aclarando que acredita participación y no conformidad del desempeño. |
| Descargas | Informe PDF y certificado; PDF por participante o general | Informe general, certificado, CSV propio y ZIP final del caso | Incluir el conjunto de Sol; conservar autorización explícita de Fab. |
| Calendario | Multi-ronda, ICS y PDF anual | Dentro de ronda, filtros y recordatorios 7/3/1 días | Combinar calendario por ronda + recordatorios. Dejar ICS, vista anual multi-ronda y PDF como mejora posterior. |
| Notificaciones | Publicación y cambios de caso | Recordatorios de hitos y publicación conjunta | Integrar ambas con deduplicación/idempotencia. |
| Fuera de alcance | Multiusuario, multilingüe, self-service, logística | Además excluye RCA estructurado, edición de envío final y cambios a dashboard | Usar la lista unificada, resolviendo primero el conflicto sobre RCA estructurado. |

## 4. Fortalezas de Fab

1. **Parte del riesgo real del repositorio.** La fase 0 identifica huecos concretos: IDs cruzados entre rondas, edición después del envío final, estados de ronda inválidos y conteos defensivos.
2. **Es accionable para implementación.** Nombra archivos, funciones, índices, esquemas, helpers de autorización y pruebas específicas.
3. **Separa validación pura de persistencia.** `validateScoreRows` reutilizable por CSV y HTTP es una buena frontera.
4. **Privacidad por construcción.** Precalcular bins evita que una consulta participante lea filas de terceros para construir un gráfico.
5. **Propone una evolución razonable de integración.** CSV primero y HTTP con API key después disminuye dependencia inicial de `pt_app`.
6. **Incluye auditoría y notificaciones.** La publicación y cambios de estado quedan trazables.
7. **Expone bloqueos reales.** Señala correctamente que falta un CSV real y que el origen de media/SD/n debe confirmarse.

## 5. Fortalezas de Sol

1. **Define mejor la experiencia completa.** Los estados de ronda/evaluación y qué ve el participante antes y después de publicación están claros.
2. **Establece una transacción de negocio coherente.** Evaluación, informe, certificados y casos aparecen juntos mediante una publicación formal.
3. **Protege la integridad documental.** No permite reemplazar resultados publicados y versiona evidencias posteriores sin borrar historia.
4. **Modela un caso de mejora real.** Agrupa todos los resultados no satisfactorios en un solo caso por participante/ronda.
5. **Distingue aceptación documental de eficacia.** El cierre exige evidencia posterior comparable, incluyendo verificación parcial y nueva iteración ante reincidencia.
6. **Amplía correctamente las descargas.** CSV propio y expediente ZIP aportan portabilidad sin comprometer privacidad.
7. **Considera límites transaccionales.** La publicación por lotes controlada mediante funciones internas es más robusta que una mutación masiva indefinida.
8. **Acota la arquitectura de UI.** Mantener el primer incremento dentro de la ruta de ronda evita navegación paralela prematura.

## 6. Conflictos que la versión final debe resolver

### 6.1 Inmutabilidad frente a despublicación

Fab incluye `despublicarResultados`; Sol declara que no hay corrección, reemplazo o versionado posterior. La síntesis recomendada es eliminar la despublicación del flujo normal. La publicación debe ser irreversible desde la UI. Si por cumplimiento se necesita corrección excepcional, debe diseñarse posteriormente como procedimiento administrativo explícito, auditado y con preservación de la versión anterior.

### 6.2 Caso/RCA voluntario frente a caso obligatorio

No deben mezclarse en un solo flujo:

- consultas, quejas y apelaciones pueden seguir usando `sgcCasos` y conversación;
- la mejora por desempeño debe ser una especialización 1:1 de `sgcCasos`, creada automáticamente solo cuando exista al menos un resultado no satisfactorio;
- un resultado cuestionable puede mostrar orientación, pero no crear automáticamente el caso salvo que la política institucional lo exija.

### 6.3 Formulario RCA frente a expediente documental

Fab propone campos estructurados; Sol los excluye deliberadamente. Para el MVP se recomienda el expediente documental categorizado de Sol más una observación textual del revisor. Es suficiente para trazabilidad y evita que Calaire duplique formatos controlados que probablemente ya viven en documentos SGC. Los campos estructurados pueden evaluarse después con un requisito normativo concreto.

### 6.4 Publicación simultánea frente a procesamiento por lotes

Convex no garantiza una única mutación ilimitada para toda la ronda. La solución es atomicidad lógica:

1. cabecera `evaluacionesRonda` en estado `sin_cargar`/`borrador_validado`/`publicando`/`publicada` (el estado técnico `publicando` puede ser interno);
2. inserción por lotes de resultados, agregados, certificados y casos sin hacerlos visibles;
3. validación final de conteos e integridad;
4. un único cambio de cabecera a `publicada`, que habilita todas las consultas participantes;
5. jobs idempotentes y recuperables si falla un lote.

### 6.5 Clave del CSV

Los planes no expresan exactamente la misma clave. Antes del schema definitivo se necesita un CSV real de `pt_app` y muestras de `rondaPtItems`/envíos. La clave recomendada debe identificar inequívocamente:

`ronda + participant_code + replicateCode/run_code + contaminante/item + level_label`

Si `ptItemId` ya encapsula contaminante, corrida y nivel, la importación debe resolverlo de forma única. `participant_code + run_code` identifica al envío, no necesariamente cada fila evaluada.

### 6.6 Certificados

La generación debe ocurrir como parte de la preparación/publicación de evaluación, no depender del cierre posterior de la ronda. El certificado debe ser de participación, usar texto neutral y permanecer descargable aun con caso abierto. Deben definirse firma institucional, datos exactos y mecanismo de verificación antes de elegir la librería PDF.

### 6.7 Ubicación del historial

Fab propone `mi-dashboard`; Sol lo excluye. La recomendación es:

- incremento 1: resultados actuales, calendario y caso dentro de `/ronda/[codigo]`;
- incremento posterior: historial consolidado, inicialmente accesible desde la experiencia de ronda; moverlo o duplicar acceso en `mi-dashboard` solo con decisión de navegación explícita.

## 7. Síntesis recomendada para el plan final

### 7.1 Principios cerrados

- `pt_app` calcula y clasifica; Calaire nunca recalcula la decisión oficial.
- Una evaluación publicada es inmutable y visible mediante una publicación lógica única.
- El participante solo recibe filas propias y agregados anonimizados seguros.
- Un caso de mejora automático se crea por participante/ronda si existe al menos un resultado no satisfactorio y agrupa todos sus resultados origen.
- El caso solo cierra tras aceptación documental y eficacia satisfactoria posterior completa.
- El calendario reutiliza hitos SGC visibles y el participante no modifica eventos.
- Toda importación, publicación, descarga y actuación del caso se autoriza en servidor y se audita.

### 7.2 Orden recomendado de entrega

#### Fase 0 — Seguridad y precondiciones

- Corregir validaciones cross-round, estado activo y edición posterior al envío final.
- Extender pruebas de acceso y estados.
- Obtener un CSV real de `pt_app` y cerrar vocabulario, claves, decimales, encoding, nulos y origen de agregados.
- Confirmar requisitos institucionales de certificado, firma y verificación QR.

#### Incremento 1 — Evaluación, publicación y experiencia de ronda

1. Crear cabecera `evaluacionesRonda`, resultados normalizados y agregados seguros.
2. Implementar parser, validación estricta, previsualización y reemplazo de borrador previo a publicación.
3. Preparar informe PDF, certificados de participación y CSV individual.
4. Publicar lógicamente por lotes, solo en `documentacion_pendiente` o `cerrada`, sin publicación parcial.
5. Adaptar `/ronda/[codigo]` a estados: activa, en evaluación y publicada.
6. Presentar tabla, conteos, filtros e histograma/distribución inicial; añadir heatmaps/comparaciones solo si los agregados están definidos y son seguros.
7. Añadir calendario de hitos visibles, agenda, filtros y recordatorios 7/3/1.
8. Añadir descargas protegidas: informe general, certificado y CSV propio.

#### Incremento 2 — Mejora documental y verificación

1. Crear automáticamente el caso agrupado durante la preparación de publicación.
2. Modelar resultados origen, categorías documentales y versiones inmutables.
3. Implementar envío a revisión, observación, ajustes, aceptación y bitácora.
4. Mantener plazo e historial sin bloquear entregas tardías.
5. Vincular siguiente resultado comparable automática o manualmente.
6. Evaluar eficacia por cada resultado origen; conservar casos abiertos ante ausencia o verificación parcial.
7. Cerrar únicamente con aceptación documental + eficacia completa.
8. Generar ZIP final con bitácora, documentos/versiones y referencias de verificación.

#### Incremento 3 — Evolución opcional

- Historial y dashboard consolidado de tendencias.
- Importación HTTP autenticada desde Shiny, reutilizando exactamente la validación del CSV y limitada a borradores.
- Exportación ICS y vista anual multi-ronda.
- Comparaciones avanzadas por método, heatmaps y otras visualizaciones agregadas.
- Casos generales de consulta/queja/apelación, si aún no están suficientemente expuestos al participante.

### 7.3 Modelo conceptual recomendado

- `evaluacionesRonda`: una por ronda; estado de negocio, archivos fuente, actores y fechas.
- `resultadosEvaluados`: una fila por combinación inequívoca participante/réplica/ítem/nivel.
- `agregadosEvaluacion`: bins, conteos y estadísticas seguras por dimensión técnica.
- `informesEvaluacion`: informe general publicado (y solo informes individuales si existe requisito real).
- `certificadosParticipacion`: artefacto generado, verificación y estado de publicación derivado de la evaluación.
- `casosMejora`: especialización 1:1 de `sgcCasos` por participante/ronda.
- `casoResultadosOrigen`: todos los resultados no satisfactorios que disparan el caso.
- `casoDocumentos` y `casoDocumentoVersiones`: categorías y evidencia inmutable.
- `casoVerificaciones`: relación con resultados posteriores comparables y estado de eficacia.

La visibilidad participante debe depender de `evaluacionesRonda.estado === 'publicada'`, evitando estados de publicación repetidos por cada fila que puedan quedar inconsistentes.

## 8. Aspectos que requieren confirmación antes de implementar

1. Export real de `pt_app`, incluido cómo representa método, réplica, nulos y agregados.
2. Clave única definitiva de cada fila evaluada.
3. Literales canónicos de clasificación y textos visibles en español.
4. Si el informe es exclusivamente general o también puede existir uno por participante.
5. Dimensiones permitidas para comparabilidad posterior (analito, nivel, método, instrumento, matriz u otras).
6. Quién puede ser el “responsable asignado” y cómo se representa mientras multiusuario por laboratorio está fuera de alcance.
7. Reglas exactas del plazo documental y de su modificación.
8. Campos, firma, URL verificable y política QR del certificado.
9. Umbrales mínimos de anonimización para agregados de grupos pequeños.
10. Si los recordatorios deben generarse por job programado, al crear/cambiar hitos o mediante ambos con idempotencia.

## 9. Criterios esenciales para trasladar a la versión final

- Ningún acceso directo a Convex o a Route Handlers permite leer resultados o archivos privados ajenos.
- Un error de columnas, tipos, duplicados, códigos, claves técnicas o pertenencia de ronda bloquea la publicación completa.
- La publicación habilita simultáneamente resultados, informe, certificados y casos mediante la cabecera de evaluación.
- Los valores y la clasificación mostrados son exactamente los importados.
- No existe despublicación o sobrescritura ordinaria de una evaluación publicada.
- Solo hay un caso automático por participante/ronda y contiene todos los resultados no satisfactorios.
- Los documentos enviados son inmutables; los ajustes crean versiones nuevas.
- El caso no cierra sin aceptación documental y eficacia posterior satisfactoria para todos los resultados origen.
- La falta de siguiente participación comparable mantiene el caso abierto.
- El participante descarga únicamente su CSV, aunque el informe general sea común.
- Los hitos visibles aparecen durante todo el ciclo y los recordatorios no se duplican.
- Las operaciones por lotes son idempotentes, recuperables y no exponen estados parciales.

## 10. Conclusión

Fab aporta el mejor mapa de implementación inmediata y los controles técnicos que deben anteceder al desarrollo. Sol aporta el mejor modelo de producto, publicación y cumplimiento para el ciclo de mejora. La combinación más sólida es: **seguridad y precisión técnica de Fab; publicación, expediente inmutable y verificación de eficacia de Sol; funciones avanzadas de Fab aplazadas a un tercer incremento**.
