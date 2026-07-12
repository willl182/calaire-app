# Targets finales: evaluación, mejora y calendario para participantes

Plan: `_workspace/grills/s_final_p.md`  
Workflow: `_workspace/grills/s_final_w.md`

## T0 — Seguridad PT

- [ ] IDs de participante, ronda, ítem y sample group deben pertenecer a la misma ronda.
- [ ] Envíos y fichas solo escriben con ronda `activa`.
- [ ] Un envío final no puede editarse.
- [ ] Tests cubren cross-round, cross-participant y estados no activos.

## T1 — Contrato CSV validado

- [ ] `_workspace/Puntajes_Finales_PT_2026-07-12.csv` es el fixture real inicial y sus 17 columnas están documentadas.
- [ ] El parser soporta UTF-8, decimal con punto y los encabezados exactos del fixture.
- [ ] La clave participante × ítem × método identifica inequívocamente cada fila; omitir `metodo` se prueba como colisión inválida.
- [ ] `Satisfactorio` y `No satisfactorio` se normalizan a `satisfactorio` y `no_satisfactorio` sin reclasificar.
- [ ] Nulos se convierten a `null`, nunca a cero.
- [ ] Se rechazan columnas, finitos, clasificaciones, duplicados y referencias inválidas.
- [ ] Los errores señalan fila y campo y existen fixtures válidos/inválidos.

## T2 — Evaluación almacenada con seguridad

- [ ] Hay una cabecera de evaluación por ronda, filas normalizadas y agregados de visualización separados.
- [ ] Borradores son reemplazables, pero invisibles para participantes.
- [ ] Importaciones grandes usan lotes internos idempotentes y solo llegan a `borrador_validado` tras verificar que el import está completo.
- [ ] La unicidad participante × ítem × método se comprueba en cada escritura; las consultas de cabecera que esperan una fila usan `.unique()`.
- [ ] Queries usan índices y resultados acotados/paginados.
- [ ] Ningún participante consulta filas ajenas o borradores por API directa.

## T3 — Publicación administrativa

- [ ] El flujo CSV + PDF + preview vive en Resultados.
- [ ] Cualquier error bloquea la publicación completa.
- [ ] Solo publica en `documentacion_pendiente` o `cerrada`.
- [ ] Una sola mutation cambia la cabecera de `borrador_validado` a `publicada`; no recorre ni publica filas individualmente.
- [ ] Todas las lecturas condicionan resultados, agregados e informe a la cabecera, de modo que aparecen juntos o no aparecen.
- [ ] Publicar no cambia el estado de ronda.
- [ ] No hay edición/despublicación ordinaria; actor y fecha quedan auditados.
- [ ] Casos, notificaciones y certificados opcionales son jobs posteriores idempotentes/reintentables y no forman parte de la atomicidad de visibilidad.

## T4 — Resultados dentro de la ronda

- [ ] Activa conserva carga PT y calendario.
- [ ] Cierre sin publicación muestra “En evaluación”.
- [ ] Publicada muestra conteos, filtros, valores, `z`, `z'`, `zeta`, `En` y clasificación importada.
- [ ] Incluye `n` y bins anonimizados derivados solo de filas importadas; Calaire no recalcula desempeño, estadísticos ni clasificación.
- [ ] Historial muestra solo rondas publicadas y no cambia `mi-dashboard`.

## T5 — Privacidad y descargas

- [ ] Informe general y CSV propio, además del certificado cuando exista, exigen autorización server-side.
- [ ] El CSV contiene solo filas del usuario autenticado.
- [ ] El certificado es opcional, declara participación y no desempeño, y sigue disponible con caso abierto cuando fue generado.
- [ ] Un certificado pendiente o fallido puede reintentarse sin ocultar, revertir ni modificar resultados publicados.
- [ ] Manipular URL, código o ID no expone otra ronda o participante.
- [ ] Agregados respetan el umbral de anonimización acordado.

## T6 — Calendario

- [ ] Usa `sgcHitosRonda` visibles con fecha objetivo.
- [ ] Está disponible durante todo el ciclo de ronda.
- [ ] Incluye vista mensual, agenda, filtros y estados operativos.
- [ ] Genera una sola notificación por umbral 7/3/1.
- [ ] Cambios de fecha no duplican recordatorios.
- [ ] Excluye seguimiento logístico.

## T7 — Expediente correctivo automático

- [ ] Solo la clasificación no satisfactoria importada activa el expediente.
- [ ] Un job idempotente posterior a la publicación garantiza exactamente uno por participante/ronda y agrupa todas las filas origen.
- [ ] La evaluación publicada permanece inmutable.
- [ ] Responsable y admin son los únicos usuarios autorizados.
- [ ] Casos manuales de consulta/queja/apelación permanecen separados.

## T8 — Documentos y revisión

- [ ] Se exigen análisis de causa, plan e implementación antes de enviar.
- [ ] Documentos admitidos, categorías y límites están definidos.
- [ ] Versiones enviadas son inmutables; ajustes crean nuevas versiones.
- [ ] Admin solicita ajustes mediante observación y acepta documentación.
- [ ] Cada acción registra actor, fecha y cambio y genera notificación pertinente.

## T9 — Verificación de eficacia

- [ ] Cada resultado origen exige un resultado posterior satisfactorio del mismo participante, contaminante, nivel y método.
- [ ] Si cambian esos identificadores entre rondas, el admin puede vincular manualmente un resultado y la decisión queda auditada.
- [ ] Ausencia, verificación parcial o resultado no satisfactorio mantiene el caso abierto.
- [ ] Solo documentos aceptados más eficacia completa permiten cerrar.

## T10 — Expediente ZIP

- [ ] Solo se genera para casos cerrados.
- [ ] Incluye resumen, bitácora, todas las versiones y referencias posteriores.
- [ ] Solo responsable y admin pueden descargarlo.

## T11 — Extensiones posteriores

- [ ] HTTP autenticado reutiliza el parser, escribe solo borradores y nunca publica.
- [ ] Dashboard longitudinal usa únicamente resultados publicados.
- [ ] ICS/PDF anual y visualizaciones avanzadas preservan autorización y anonimización.

## Calidad transversal

- [ ] `pnpm exec convex codegen` pasa tras cambios Convex.
- [ ] `pnpm lint`, `pnpm test` y `pnpm build` pasan por etapa.
- [ ] `pnpm test:e2e:start` cubre admin, participante, auth y descargas.
- [ ] Hay pruebas negativas entre participantes de una misma ronda y de rondas distintas.
- [ ] Funciones sensibles son internas cuando no requieren API pública.
- [ ] Transiciones se auditan y procesos derivados soportan reintentos seguros.
