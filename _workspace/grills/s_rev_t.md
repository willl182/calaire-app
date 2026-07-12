# Revisión comparativa de targets de participantes

Documentos comparados:

- `Fab_part_targets.md`
- `sol_part_target.md`

## Resumen ejecutivo

Ambos documentos persiguen el mismo núcleo: importar resultados de `pt_app`, almacenarlos de forma segura, publicarlos administrativamente, mostrarlos al participante sin filtrar información ajena y completar la experiencia con descargas, calendario, certificados y gestión de casos.

`Fab_part_targets.md` aporta una hoja de ruta amplia, incremental y pragmática, incluyendo endurecimiento inmediato de seguridad, integración HTTP y desempeño histórico. `sol_part_target.md` especifica con más precisión el contrato de evaluación, la atomicidad e inmutabilidad de la publicación, la experiencia dentro de la ronda y un ciclo normativo de casos mucho más completo.

La síntesis recomendada debe usar la estructura incremental y los criterios rigurosos de `sol`, pero incorporar de `Fab` el target inicial de seguridad, el dashboard longitudinal y, como integración posterior y opcional, el push HTTP. Antes de cerrar el documento final hay que resolver explícitamente tres conflictos: cuándo se permite publicar, si existe despublicación/reemplazo y si los certificados nacen al publicar o al cerrar la ronda.

## Puntos en común

### Importación, almacenamiento y publicación

- Ambos parten de resultados producidos por `pt_app` e importados por un administrador.
- Exigen validación previa, previsualización y errores detallados antes de confirmar.
- Modelan los resultados en tablas Convex estructuradas y vinculadas al participante y a la ronda.
- Mantienen los resultados invisibles para participantes antes de la publicación.
- Requieren auditoría del actor y del momento de publicación.

### Experiencia del participante

- Muestran valor propio/asignado, estadísticos `z`, `z'`, `zeta`, `En` y clasificación.
- Incluyen agregados o comparaciones anonimizadas, sin revelar la identidad o los valores identificables de otros laboratorios.
- Protegen las consultas y descargas por identidad y alcance de ronda/participante.
- Incluyen informe PDF y certificado descargables.

### Casos y seguimiento

- Vinculan casos o acciones correctivas con filas de resultados insatisfactorios.
- Conservan trazabilidad y restringen el acceso según el rol.
- Contemplan notificaciones y un estado visible del proceso.

### Calendario y calidad

- Usan `sgcHitosRonda` para presentar hitos visibles al participante.
- Exigen `codegen`, lint, tests, build, E2E y pruebas negativas de autorización.

## Diferencias principales

| Tema | `Fab_part_targets.md` | `sol_part_target.md` | Evaluación |
|---|---|---|---|
| Seguridad inicial | Target T0 explícito para IDs cross-round, estado activo y registro | Seguridad centrada en evaluación, borradores, archivos y autorización negativa | El T0 de `Fab` debe conservarse como prerrequisito independiente. |
| Contrato CSV | Se deja bloqueado hasta obtener export real; esquema general | Define 17 columnas, nulos, finitos, duplicados, resolución participante/réplica y fixtures | `sol` es más verificable, pero debe confirmarse contra el export real antes de congelar “17”. |
| Modelo de datos | `ptScores` y `ptScoreRondaStats`, con campos e índices concretos | Cabecera de evaluación definitiva + filas normalizadas y acotadas | Conviene combinar cabecera/version de importación con filas y agregados separados. |
| Importación | Reimportar reemplaza borradores y nunca toca publicados | Una evaluación definitiva, publicación atómica y sin edición, reemplazo, despublicación ni versionado | Compatibles para borradores; conflicto después de publicar. Se recomienda inmutabilidad publicada y corrección excepcional mediante nueva versión auditada, no mutación silenciosa. |
| Momento de publicación | “Por ronda”, sin restringir fase; T0 exige activa para envío PT | Solo en `documentacion_pendiente` o `cerrada`; no cambia estado de ronda | La regla de `sol` es más clara y evita publicar mientras se reciben resultados. |
| Alcance de publicación | Resultados; PDF administrado separadamente; certificado al cierre | Resultados, informe, certificados y casos se publican atómicamente | La atomicidad de `sol` reduce estados incoherentes, pero el caso automático/certificado no debería hacer fallar toda la publicación si son trabajos derivados recuperables. |
| Página de resultados | Ruta dedicada `/resultados`, selector de estadístico y posición propia | Integrada en `/ronda/[codigo]`, conserva carga/calendario y añade filtros, heatmap e historial | Mantener integración en la ronda; una subsección/ruta anidada puede servir sin alterar navegación. |
| Dashboard histórico | Target multi-ronda explícito con bandas y porcentaje satisfactorio | Historial rico dentro de resultados, con más filtros técnicos | Combinar: resumen longitudinal global más exploración contextual dentro de la ronda. |
| API desde `pt_app` | Push HTTP autenticado con API keys | No aparece | Mantener como incremento posterior, reutilizando exactamente la validación del CSV y sin publicar. |
| Casos | Queja/apelación/consulta, hilo, RCA, acciones correctivas y notificaciones | Caso automático obligatorio por no satisfactorios, documentos versionados, verificación posterior y ZIP | Son dos clases de caso distintas y complementarias: caso solicitado por participante y expediente correctivo normativo automático. No deben confundirse. |
| Calendario | Timeline anual, PDF e ICS | Calendario mensual/agenda por ronda, estados, filtros y recordatorios 7/3/1 | Unir vista por ronda y vista anual; ICS es valioso. PDF anual puede quedar como mejora posterior. |
| Certificado | Se genera al cerrar y requiere aprobación admin | Se genera al publicar, participación no desempeño, firma y QR verificable | Debe definirse un único evento. Recomendación: generar al publicar resultados definitivos, con aprobación/firma incluida en el acto de publicación. |

## Fortalezas de `Fab_part_targets.md`

1. **Prioriza una vulnerabilidad concreta antes de ampliar funcionalidad.** T0 cubre pertenencia cross-round, estado de ronda y coherencia entre Next y Convex.
2. **Presenta una secuencia de producto fácil de ejecutar.** Seguridad → resultados → integración → histórico → casos → calendario → certificados.
3. **Incluye integración automatizada con `pt_app`.** El endpoint HTTP reutilizable evita que el CSV sea la única vía futura.
4. **Da identidad al dashboard longitudinal.** Las bandas ±2/±3, porcentaje satisfactorio y filtros convierten los resultados en seguimiento de desempeño.
5. **Reconoce casos iniciados por el participante.** Quejas, apelaciones y consultas no quedan reducidas a no conformidades automáticas.

## Fortalezas de `sol_part_target.md`

1. **Tiene criterios de aceptación más precisos.** Define nulos, números no finitos, duplicados, claves de resolución, batching y errores por campo.
2. **Modela la publicación como una transición consistente.** La previsualización bloqueante, invisibilidad del borrador y auditoría reducen exposición parcial.
3. **Encaja la experiencia en la ronda existente.** Define claramente qué ocurre activa, cerrada sin publicar y publicada, sin romper `mi-dashboard`.
4. **Es más fuerte en privacidad documental.** Incluye manipulación de URL/ID, CSV individual, informe general y anonimización.
5. **Es mucho más completo en cumplimiento posterior.** Caso automático agrupado, documentos versionados, revisión, verificación satisfactoria posterior y expediente ZIP.
6. **Detalla calendario y recordatorios idempotentes.** Estados, filtros y no duplicación ante cambios de fecha son verificables.

## Conflictos y decisiones necesarias

### 1. Inmutabilidad frente a despublicación

`Fab` permite una acción administrativa explícita de despublicar; `sol` prohíbe editar, reemplazar, despublicar o versionar. La prohibición absoluta protege la trazabilidad, pero puede dejar al sistema sin mecanismo seguro para corregir una publicación materialmente errónea.

**Recomendación:** borradores reemplazables e idempotentes; publicación ordinaria irreversible. Si el negocio exige corrección, crear una operación excepcional y auditada que invalide la publicación previa y publique una nueva revisión, preservando ambas. Nunca editar filas publicadas in situ.

### 2. Estado de ronda habilitado

`sol` limita la publicación a `documentacion_pendiente` o `cerrada`; `Fab` no lo fija. A la vez, `Fab` exige que los envíos PT solo ocurran con ronda activa.

**Recomendación:** aceptar PT únicamente en `activa`; importar/previsualizar evaluación en borrador después del cierre de recepción; publicar solo en `documentacion_pendiente` o `cerrada`; publicar no cambia automáticamente el estado.

### 3. Transacción de publicación y efectos derivados

`sol` exige publicar simultáneamente resultados, informe, certificados y casos. Certificados PDF, archivos y creación masiva de casos pueden requerir trabajo asíncrono, y hacerlos parte de una única transacción conceptual puede aumentar fallos y límites.

**Recomendación:** la transición atómica mínima comprende cabecera, filas, agregados e informe general validado. Certificados y casos se crean idempotentemente como efectos derivados con estado de procesamiento y reintentos; la UI no expone artefactos incompletos como disponibles.

### 4. Evento de emisión del certificado

`Fab` lo genera al cerrar la ronda; `sol`, al publicar. Cerrar no garantiza que la evaluación esté lista, mientras que publicar sí representa el conjunto definitivo.

**Recomendación:** emitir al publicar, declarar participación —no desempeño—, firmar/aprobar como parte del flujo administrativo y mantenerlo disponible aunque exista un caso abierto.

### 5. Alcance de casos

`Fab` describe casos iniciados por participante; `sol`, expedientes correctivos automáticos. Unificarlos en un solo flujo produciría permisos, estados y obligaciones ambiguos.

**Recomendación:** compartir infraestructura de mensajes, documentos, auditoría y notificaciones, pero diferenciar al menos `solicitud_participante` (queja/apelación/consulta) y `accion_correctiva` (automática por clasificación no satisfactoria).

### 6. “17 columnas acordadas”

`sol` afirma un número cerrado; `Fab` dice que el contrato depende del export real de `pt_app`.

**Recomendación:** conservar los criterios estrictos de `sol`, pero tratar el fixture real y la documentación del contrato como gate del Incremento 1. Solo entonces congelar nombres y cantidad de columnas.

## Síntesis recomendada para el documento final

### Incremento 0 — Seguridad y contrato

- Endurecimiento cross-round y por estado para las mutaciones PT y el registro.
- Fixture/export real de `pt_app` y contrato CSV documentado.
- Parser puro con validaciones de columnas, nulos, finitos, clasificaciones, duplicados y resolución participante/réplica.
- Tests unitarios y negativos de autorización.

### Incremento 1 — Evaluación definitiva y publicación

- Cabecera de importación/evaluación, filas normalizadas y agregados separados, con índices y paginación.
- Importación administrativa por lotes, borrador reemplazable, preview completo y cero exposición parcial.
- Publicación en `documentacion_pendiente` o `cerrada`, auditada e inmutable en el flujo ordinario.
- Informe general validado; certificados y casos derivados de forma idempotente.

### Incremento 2 — Resultados, privacidad y descargas

- Experiencia integrada en `/ronda/[codigo]`, con estados “carga”, “en evaluación” y “publicada”.
- Tabla, filtros, criterios, agregados, distribución/heatmap y comparación técnica anonimizada.
- Informe general, certificado de participación y CSV individual con autorización estricta.
- Historial contextual limitado a rondas publicadas.

### Incremento 3 — Calendario y desempeño longitudinal

- Calendario mensual/agenda por ronda basado en hitos visibles, con estados, filtros y recordatorios idempotentes.
- Vista anual y exportación ICS.
- Dashboard “Mi desempeño” multi-ronda con bandas, porcentaje satisfactorio y filtros técnicos.

### Incremento 4 — Casos y acciones correctivas

- Solicitudes iniciadas por participante: queja, apelación y consulta, con hilo y resolución.
- Caso correctivo automático único por participante/ronda, agrupando filas no satisfactorias.
- Documentos privados versionados, revisión administrativa, auditoría y notificaciones.
- Verificación posterior contra resultados comparables, cierre condicionado y expediente ZIP.

### Incremento 5 — Integración automatizada

- Endpoint HTTP autenticado para `pt_app` que use el mismo contrato y validador.
- Solo escribe borradores; devuelve errores estructurados y nunca publica.
- Documentación reproducible con `curl` y cliente R.

## Criterios transversales que debe conservar la versión final

- Toda query o mutación de participante tiene pruebas de aislamiento entre participantes de la misma ronda y de rondas distintas.
- Funciones sensibles son internas salvo que deban exponerse deliberadamente.
- Queries usan índices, paginación y resultados acotados.
- Ningún borrador, archivo o resultado ajeno es accesible manipulando URL, código o ID.
- Toda transición administrativa relevante registra actor, fecha y cambio.
- Procesos derivados son idempotentes y reintentables.
- Verificación mínima: `pnpm exec convex codegen`, `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` para flujos de admin y participante.

## Conclusión

La mejor base formal es `sol_part_target.md` por su precisión y profundidad normativa. Sin embargo, la versión final quedaría incompleta sin el T0 de seguridad, el dashboard longitudinal, la API futura y los casos iniciados por participante de `Fab_part_targets.md`. La unión debe evitar una simple suma de targets: debe distinguir el núcleo crítico de publicación de sus efectos derivados, separar solicitudes de expedientes correctivos y fijar una política explícita de corrección de publicaciones.
