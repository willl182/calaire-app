# Revisión comparativa de workflows de participante

Documentos comparados:

- `Fab_part_workflow.md`
- `sol_part_workflow.md`

## Conclusión ejecutiva

Los dos workflows comparten una columna vertebral clara: contrato CSV, modelo Convex en borrador, administración y publicación, consulta protegida por participante, calendario, certificados y un flujo de casos posterior. `Fab` aporta una secuencia técnica amplia, una etapa de seguridad previa y una integración opcional con `pt_app`; `sol` convierte el mismo objetivo en un flujo de producto mucho más preciso, con publicación atómica, descargas seguras, casos automáticos, documentos versionados y verificación contra rondas posteriores.

La versión final debería tomar `sol` como estructura principal y conservar de `Fab` la etapa cero de seguridad, la capa pura de validación reutilizable, el endpoint de integración como incremento opcional y algunas pruebas explícitas. No conviene conservar de `Fab` el dashboard transversal como destino principal, la creación manual de casos ni la posibilidad de despublicar, porque contradicen decisiones más concretas de `sol`.

## Puntos en común

1. **Contrato CSV antes del modelo.** Ambos hacen del formato emitido por `pt_app` una dependencia bloqueante y exigen validar columnas, tipos, claves de unión y errores por fila.
2. **Importación en borrador y publicación posterior.** Los resultados deben validarse y previsualizarse antes de ser visibles para participantes.
3. **Modelo Convex indexado y consultas autorizadas.** Ambos requieren índices por ronda y participante, validadores y aislamiento estricto de datos propios.
4. **Administración en el contexto de la ronda.** La carga, previsualización y publicación viven en el panel administrativo de resultados de una ronda.
5. **Vista participante posterior a la publicación.** Ambos contemplan tabla de métricas, clasificaciones, gráficos/distribuciones y estado previo de “pendiente” o “en evaluación”.
6. **Archivos protegidos.** Informe y certificado deben descargarse con autorización del participante, sin confiar en identificadores controlados por el cliente.
7. **Calendario basado en hitos SGC.** Ambos reutilizan `sgcHitosRonda` y plantean una vista compartida tipo calendario/agenda.
8. **Casos vinculados a resultados deficientes.** Los dos relacionan resultados no satisfactorios con un proceso de causa raíz/acciones y administración SGC.
9. **Auditoría y pruebas de acceso.** Ambos piden registrar acciones sensibles y probar que un participante no acceda a datos o casos ajenos.
10. **Disciplina de verificación.** Coinciden en `pnpm`, `convex codegen` para cambios Convex y lint/test/build más E2E para rutas o autorización.

## Diferencias principales

| Tema | `Fab` | `sol` | Recomendación |
|---|---|---|---|
| Punto de partida | Seguridad transversal T0 antes de funcionalidades | Empieza directamente por CSV | Mantener T0 como prerrequisito obligatorio |
| Contrato CSV | Pide un export real y documenta contrato externamente | Ya presupone 17 columnas y define validación exhaustiva en código | Verificar el export real, luego fijar contrato tipado, fixtures y documentación |
| Clave de unión | `participantCode + contaminante + runCode/levelLabel` | `participant_code + run_code` ↔ `participantCode + replicateCode`, luego valida dimensiones | Adoptar la clave técnica confirmada por datos reales y validar contaminante/nivel/unidad/método como invariantes |
| Estructura de datos | `ptScores` y estadísticas por ronda | Cabecera única por ronda + filas evaluadas, sin arreglos no acotados | Preferir cabecera + filas; materializar agregados solo si medición de rendimiento lo justifica |
| Importaciones grandes | No detalla lotes | Funciones internas por lotes y publicación lógica atómica | Adoptar lotes + publicación todo-o-nada |
| Publicación | Publicar y despublicar | Irreversible; exige PDF y estado de ronda permitido | Preferir publicación irreversible y atómica; correcciones mediante nueva importación antes de publicar o mecanismo administrativo auditado excepcional |
| Integración `pt_app` | Endpoint HTTP autenticado que solo escribe borradores | No incluye endpoint | Mantener como incremento opcional después del flujo CSV estable |
| Ubicación UX | Nueva página `/resultados` y dashboard transversal | Integra experiencia por etapa en `/ronda/[codigo]`; admin en `Resultados` | Seguir `sol`: experiencia contextual en la ronda y evitar fragmentar navegación |
| Visualizaciones | Selector z/z'/ζ/En y distribución; dashboard temporal separado | Resumen, filtros, distribución, heatmap, comparación e historial sin dimensión analista | Combinar métricas acordadas, pero mantener historial y gráficos dentro de la experiencia de ronda/MVP |
| Certificado | Aprobación admin independiente y storage | Se genera con la publicación, QR/código verificable y firma | Generarlo lógicamente al publicar, con autorización y verificación; definir manejo de fallos/reintentos |
| CSV individual | No está explícito | Route Handler filtra server-side por `rondaParticipanteId` | Adoptar explícitamente |
| Casos | Participante abre queja/apelación/consulta y registra RCA desde CTA | Un caso automático por participante/ronda con todas las filas no satisfactorias | Para resultados deficientes, adoptar creación automática agrupada; mantener casos generales separados si son requisito |
| Flujo del caso | Hilo de mensajes, RCA y notificaciones | Expediente documental versionado, ajustes, aceptación, espera y verificación posterior | Adoptar el flujo documental de `sol`; incorporar notificaciones e interacción básica de `Fab` |
| Cierre del caso | No define regla fuerte | Solo tras documentos aceptados y resultados satisfactorios comparables posteriores | Adoptar la regla de verificación de `sol` |
| Expediente | No contemplado | Resumen PDF + ZIP privado para casos cerrados | Adoptar como incremento final |
| Calendario | ICS y PDF anual | Recordatorios internos 7/3/1 días, estados y zona horaria | Priorizar calendario + recordatorios; dejar ICS/PDF como mejora posterior |
| Granularidad de entrega | Cada etapa = PR y commit | Dos incrementos, verificación por etapa | Mantener incrementos de producto y PRs pequeños por etapa |

## Fortalezas de `Fab`

- Detecta riesgos de autorización previos a cualquier nueva funcionalidad: pertenencia cruzada entre ronda, participante, ítem y grupo, además del bloqueo de escrituras fuera de ronda activa.
- Explicita una capa de validación pura compartida entre CSV y HTTP.
- Considera integración automática con `pt_app` sin permitir publicación directa.
- Incluye audit log, notificaciones y pruebas concretas de cross-round.
- Hace visibles dependencias y permite paralelizar calendario y certificados después de seguridad.
- Propone exportación ICS y una vista longitudinal del desempeño, útiles como extensiones futuras.

## Fortalezas de `sol`

- Define con mayor precisión el comportamiento de producto y los estados de ronda.
- Trata importaciones grandes, evita arreglos no acotados y exige publicación lógica todo-o-nada.
- Establece una frontera de seguridad correcta: identidad derivada de auth y archivos filtrados en servidor.
- Evita dispersar la experiencia del participante: adapta `/ronda/[codigo]` según la etapa.
- Especifica una publicación irreversible, auditada y bloqueada por errores o falta del informe PDF.
- Convierte resultados no satisfactorios en un caso único y agrupado, evitando duplicación y carga manual.
- Modela versiones documentales inmutables, verificaciones posteriores y un criterio de cierre auditable.
- Incluye casos límite útiles para calendario, archivos y autorización.

## Conflictos y decisiones que la versión final debe resolver

### 1. Estructura de directorios

Ambos documentos afirman que el código vive bajo `src/`, e incluso `Fab` declara desactualizado `AGENTS.md`. Sin embargo, las instrucciones vigentes del repositorio proporcionadas para esta tarea dicen conservar `app/`, `lib/` y `app/components/` y no crear un árbol paralelo `src/`. La versión final no debe repetir rutas hasta inspeccionar el árbol real y las guías instaladas de Next.js. Debe expresar ubicaciones por módulo y usar las rutas efectivas verificadas en el repositorio.

### 2. Publicar/despublicar frente a publicación irreversible

Son incompatibles. La síntesis recomendada es publicación irreversible para usuarios, con validación completa previa. Si el negocio necesita corregir un error publicado, debe existir un procedimiento excepcional separado, autorizado y auditado, no un botón normal de “despublicar”.

### 3. Caso manual frente a automático

No son exactamente el mismo producto. Los no satisfactorios deben generar automáticamente un caso documental único por participante/ronda. Quejas, consultas y apelaciones manuales pueden permanecer como tipo de caso SGC independiente, sin sustituir ni duplicar el caso de resultado no satisfactorio.

### 4. Dashboard transversal frente a experiencia dentro de la ronda

`Fab` propone `/mi-dashboard`; `sol` pide expresamente no mover la experiencia allí. Para el alcance principal, la ronda debe ser el centro. Un dashboard longitudinal puede quedar como mejora posterior que reutilice consultas seguras, sin bloquear publicación, consulta y caso documental.

### 5. Calendario MVP frente a exportaciones

Los recordatorios y manejo correcto de estados/zonas horarias tienen más valor operativo inmediato que ICS/PDF. La exportación puede seguir como etapa posterior independiente.

### 6. Certificados dentro de la publicación

Generarlos en la publicación mejora consistencia, pero una operación PDF/storage puede fallar. La versión final debe definir publicación como transición lógica atómica y generación idempotente/reintentable, bloqueando disponibilidad del certificado hasta completar el artefacto sin dejar resultados parcialmente visibles.

## Síntesis recomendada

### Fase 0 — Confirmación técnica y seguridad

1. Inspeccionar estructura real del repositorio y leer las guías vigentes de Next.js y Convex.
2. Corregir autorización de envíos/fichas: pertenencia completa a ronda y estado activo antes de escribir.
3. Añadir pruebas cross-round, cross-participant y estados no activos.

### Incremento 1 — Evaluación publicada y consulta

1. Obtener un CSV real; fijar contrato tipado de 17 columnas (o corregir el número), claves, normalización y fixtures.
2. Implementar parser puro con errores fila/campo y resolución contra entidades de ronda.
3. Crear cabecera de evaluación por ronda y filas de resultado indexadas; guardar referencias seguras al CSV y PDF.
4. Importar por lotes a borrador; derivar identidad desde auth y devolver solo filas propias/agregados anonimizados.
5. Extender administración de `Resultados` con upload, preview, resumen de errores y preview de casos.
6. Publicar de forma atómica, irreversible y auditada solo en estados permitidos, exigiendo cero errores y PDF.
7. Generar certificados de forma idempotente y crear descargas protegidas de informe, certificado y CSV individual.
8. Adaptar `/ronda/[codigo]` por etapa: activa, en evaluación y publicada; incluir resultados, filtros, gráficos seguros, descargas y estado del caso.
9. Implementar calendario/agenda con hitos visibles en todo estado y recordatorios idempotentes 7/3/1.

### Incremento 2 — Caso documental y verificación

1. Extender `sgcCasos` 1:1 o mediante tabla especializada, preservando la administración existente.
2. En publicación, agrupar no satisfactorios y crear exactamente un caso por participante/ronda.
3. Modelar resultados originadores, documentos, versiones inmutables, observaciones, transiciones y bitácora.
4. Exigir causa, plan e implementación; permitir ajustes y nuevas versiones; notificar cambios.
5. Tras aceptación, esperar una ronda posterior y proponer resultados técnicamente comparables.
6. Mantener abierto ante ausencia, parcialidad o clasificación no satisfactoria; cerrar solo al verificar todos los orígenes.
7. Generar resumen PDF y expediente ZIP privado únicamente al cerrar.

### Incremento 3 — Extensiones no bloqueantes

1. Endpoint HTTP autenticado para que `pt_app` cargue borradores usando el mismo validador.
2. Dashboard longitudinal de desempeño.
3. Exportación ICS y PDF anual del calendario.
4. Casos manuales generales de consulta/queja/apelación, si no quedan cubiertos por SGC existente.

## Reglas recomendadas de verificación

- Ejecutar `pnpm exec convex codegen` tras cambios Convex.
- Ejecutar `pnpm lint`, `pnpm test` y `pnpm build` por etapa.
- Ejecutar `pnpm test:e2e:start` para rutas, auth, descargas y cambios por estado de ronda.
- Probar explícitamente dos participantes de una misma ronda y de rondas distintas.
- Probar manipulación de URL/identificador, importación duplicada, lotes parcialmente fallidos, reintentos de publicación y generación de artefactos.
- Hacer cada etapa desplegable y auditable en un PR acotado.

## Dependencias sugeridas

```text
Seguridad + estructura confirmada
  -> Contrato CSV real
     -> Parser puro
        -> Modelo/importación en borrador
           -> Administración/publicación atómica
              -> Vista participante + descargas + certificado
              -> Creación automática del caso
                 -> Documentos/versiones
                    -> Verificación posterior
                       -> Expediente ZIP

Hitos existentes
  -> Calendario/recordatorios

Validador estable + importación estable
  -> Endpoint pt_app (opcional)
```
