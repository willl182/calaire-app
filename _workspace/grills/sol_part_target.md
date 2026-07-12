# Targets: evaluación y calendario de participantes

Plan fuente: `_workspace/grills/sol_part_plan.md`  
Workflow: `_workspace/grills/sol_part_workflow.md`

## Incremento 1

### T1 — Contrato CSV validado

**Entregable:** parser probado para resultados definitivos emitidos por `pt_app`.

- [ ] Acepta exactamente las 17 columnas acordadas.
- [ ] Convierte métricas no aplicables a `null`, nunca a cero implícito.
- [ ] Rechaza números no finitos, clasificaciones desconocidas y claves duplicadas.
- [ ] Resuelve `participant_code + run_code` contra `participantCode + replicateCode` de la misma ronda.
- [ ] Reporta errores por fila y campo.
- [ ] Tiene pruebas unitarias con fixtures válidos e inválidos.

### T2 — Evaluación almacenada con seguridad

**Entregable:** cabecera y filas normalizadas en Convex, invisibles mientras sean borrador.

- [ ] Una ronda tiene como máximo una evaluación definitiva.
- [ ] Cada fila queda vinculada a un `rondaParticipanteId` válido.
- [ ] Existen índices para participante y dimensiones técnicas; no hay listas no acotadas en un documento.
- [ ] Solo admin carga y publica.
- [ ] Participantes no consultan borradores ni filas ajenas mediante API directa.
- [ ] Importaciones grandes se procesan por lotes sin exposición parcial.

### T3 — Publicación administrativa integrada en Resultados

**Entregable:** flujo CSV + PDF general → validación → previsualización → publicación.

- [ ] Vive en la sección administrativa existente `Resultados` de la ronda.
- [ ] Solo está habilitado en `documentacion_pendiente` o `cerrada`.
- [ ] La previsualización muestra filas, participantes, clasificaciones, errores y casos previstos.
- [ ] Cualquier error bloquea toda la publicación.
- [ ] Publica simultáneamente resultados, informe, certificados y casos.
- [ ] No existe editar, reemplazar, despublicar o versionar después.
- [ ] Publicar no modifica automáticamente el estado de la ronda.
- [ ] Actor y fecha quedan auditados.

### T4 — Resultados evaluados dentro de la ronda

**Entregable:** experiencia publicada en `/ronda/[codigo]`.

- [ ] Activa conserva carga PT y calendario.
- [ ] Cierre sin publicación muestra “En evaluación”, no un bloqueo total.
- [ ] Publicada muestra conteos, filtros y tabla con valor propio/asignado, `z`, `z'`, `zeta`, `En` y clasificación.
- [ ] Incluye criterio breve, resúmenes y número de participantes.
- [ ] Incluye distribución, heatmap y comparación por método/combinación técnica.
- [ ] Historial filtra rondas publicadas, periodo, contaminante/ítem, método, instrumento, puntaje y clasificación; no analistas.
- [ ] No cambia la navegación ni redirección actual de `mi-dashboard`.

### T5 — Privacidad y descargas

**Entregable:** informe general, certificado y CSV individual protegidos.

- [ ] Participante descarga el informe general PDF cargado para su ronda.
- [ ] Certificado se genera al publicar e incluye contenido institucional, firma y QR/código verificable.
- [ ] Certificado declara participación, no desempeño, y está disponible aunque haya caso abierto.
- [ ] CSV descargable contiene solo filas del participante autenticado.
- [ ] Manipular URL, código o ID no permite descargar archivos de otro participante/ronda.
- [ ] Otros códigos solo aparecen anonimizados en agregados/informe general.

### T6 — Calendario desde hitos

**Entregable:** calendario mensual y agenda dentro de la ronda.

- [ ] Usa `sgcHitosRonda` con `visibleParticipante = true` y fecha objetivo.
- [ ] Está disponible durante todo el ciclo de la ronda.
- [ ] Distingue próximo, completado, vencido, cancelado y no aplica.
- [ ] Permite filtrar por fase/tipo y estado.
- [ ] Genera una sola notificación por umbral a 7, 3 y 1 día.
- [ ] Cambios de fecha no duplican recordatorios indebidamente.
- [ ] No incluye guías, transportadoras ni estados logísticos.

## Incremento 2

### T7 — Caso automático agrupado

**Entregable:** un caso obligatorio por participante/ronda con no satisfactorios.

- [ ] `clasificacion` importada es la única fuente de activación.
- [ ] Agrupa todos los no satisfactorios de esa publicación.
- [ ] Nunca crea más de un caso para el mismo participante/ronda.
- [ ] Conserva cada fila originadora en una relación auditable.
- [ ] Solo el responsable asignado edita/envía; admin revisa/cierra.
- [ ] La evaluación original permanece inmutable.

### T8 — Documentos privados y revisión sencilla

**Entregable:** flujo documental mínimo con versiones.

- [ ] Admite PDF, imágenes y hojas de cálculo.
- [ ] Clasifica análisis de causa, plan de acción, implementación y verificación de eficacia.
- [ ] Exige las primeras tres categorías antes de enviar.
- [ ] Tras envío, las versiones quedan inmutables.
- [ ] Ajustes crean nuevas versiones sin borrar historial.
- [ ] Admin devuelve el caso con una observación textual simple.
- [ ] Responsable y admin son los únicos que acceden a documentos.
- [ ] Cada acción registra actor, fecha y cambio.

### T9 — Verificación normativa posterior

**Entregable:** cierre condicionado a desempeño satisfactorio posterior.

- [ ] Tras aceptación documental, el caso queda `en_espera_verificacion`.
- [ ] Cada resultado originador exige un resultado satisfactorio comparable.
- [ ] Verificación parcial, cuestionable o no satisfactoria mantiene el caso abierto.
- [ ] Sin participación posterior el caso permanece abierto indefinidamente.
- [ ] El calendario muestra la próxima oportunidad cuando exista.
- [ ] Admin puede vincular una ronda técnicamente equivalente.
- [ ] El caso solo cierra cuando documentos y todos los resultados están verificados.

### T10 — Expediente ZIP

**Entregable:** expediente descargable al cerrar.

- [ ] Solo existe para casos cerrados.
- [ ] Incluye resumen PDF y bitácora.
- [ ] Incluye todas las versiones de documentos.
- [ ] Incluye referencia a resultados posteriores satisfactorios.
- [ ] Solo responsable y admin pueden descargarlo.

## Calidad transversal

- [ ] `pnpm exec convex codegen` pasa tras cambios Convex.
- [ ] `pnpm lint` pasa.
- [ ] `pnpm test` pasa.
- [ ] `pnpm build` pasa.
- [ ] `pnpm test:e2e:start` cubre flujos de admin y participante.
- [ ] Hay pruebas negativas de autorización entre participantes de la misma ronda y de rondas distintas.
- [ ] Funciones Convex sensibles son internas cuando no necesitan formar parte del API público.
- [ ] Queries usan índices y resultados acotados/paginados conforme a las guías del repositorio.
