# Evaluación comparativa de los 4 planes SGC

## Resumen ejecutivo

Los cuatro planes apuntan al mismo objetivo general: implementar en CALAIRE-APP un módulo SGC asociado principalmente a las rondas de ensayo. Sin embargo, difieren mucho en alcance, nivel de detalle, priorización y riesgo de sobrediseño.

| Plan | Caracterización |
|---|---|
| `plan_agy.md` | Plan mínimo, muy resumido, útil como punto de partida pero insuficiente para implementar sin ambigüedad. |
| `plan_codex.md` | Plan funcional muy completo y bien balanceado entre operación, cierre documental, evidencias, comunicaciones y visibilidad por rol. |
| `plan_oc.md` | Plan más aterrizado para una Fase 1 implementable, con decisiones concretas, buen control de alcance y buena traducción a modelo de datos. |
| `plan_pi.md` | Plan más ambicioso y arquitectónico, cubre una visión SGC más amplia, pero corre riesgo de sobreextender el MVP. |

La mejor estrategia no sería escoger uno tal cual, sino combinar:

- **Alcance MVP y precisión técnica de `plan_oc.md`**
- **Modelo funcional y visión de cierre documental de `plan_codex.md`**
- **Matriz documental y visión por procesos de `plan_pi.md`, pero desplazada a incrementos posteriores**
- **Simplicidad de ejecución de `plan_agy.md`, solo como checklist macro**

---

# 1. Evaluación de `plan_agy.md`

## Fortalezas

### 1. Claridad básica

El plan es directo y fácil de entender. Define dos fases principales:

1. Backend / Convex.
2. Interfaz admin.

Esto lo hace útil como resumen ejecutivo o lista inicial de tareas.

### 2. Identifica piezas clave

Incluye elementos importantes:

- Nuevas tablas `rondaDocumentos` y `rondaHitos`.
- Modificación de `rondas` y `rondaContaminantes`.
- Creación de `convex/sgc.ts`.
- Panel SGC.
- Carga de documentos.
- Campos/flujos para:
  - F-PSEA-06 Plan de Ronda.
  - F-PSEA-08 Preparación del Ítem.
  - F-PSEA-13 Revisión de Datos.

### 3. Tiene orientación implementable

Al listar archivos específicos, empieza a conectar el plan con el código real.

## Debilidades

### 1. Es demasiado superficial

No define:

- Estados.
- Roles.
- Permisos.
- Qué es nativo y qué es archivo.
- Qué bloquea el cierre documental.
- Cómo se versionan evidencias.
- Cómo se relacionan documentos con rondas.
- Cómo se gestionan cambios.
- Qué ve el participante.
- Qué ocurre con F-PSEA-05, F-PSEA-05A, F-PSEA-07, F-PSEA-12, F-PSEA-09/10/14.

Esto lo vuelve insuficiente como plan de implementación serio.

### 2. No delimita el MVP

Menciona F-PSEA-06, F-PSEA-08 y F-PSEA-13 como parte de la primera implementación, pero no justifica si los tres deben ser nativos desde el inicio.

Comparado con los otros planes, puede estar mezclando demasiado para una primera fase.

### 3. Modelo de datos incompleto

Propone `rondaDocumentos` y `rondaHitos`, pero eso probablemente no basta.

Faltan estructuras para:

- Versiones de documentos.
- Evidencias.
- Checklist SGC.
- Snapshots de registros nativos.
- Bitácora.
- Comunicaciones.
- Comentarios.
- Resultados externos.
- Estados calculados.

### 4. No contiene decisiones de diseño

No establece principios como:

- Panel SGC por ronda, no gestor documental general.
- Documentos narrativos como archivos.
- Registros vivos como nativos.
- Comunicaciones manuales en MVP.
- No automatizar correos.
- No integrar aún con `pt_app`.

Estas decisiones son críticas para evitar desviaciones.

## Riesgo principal

El riesgo de `plan_agy.md` es que, al ser tan corto, puede llevar a una implementación inconsistente: cada desarrollador tendría que inferir decisiones funcionales importantes.

## Valor del plan

Sirve como:

- Resumen macro.
- Registro de intención.
- Punto de entrada.

No sirve como:

- Especificación funcional.
- Especificación técnica.
- Plan de implementación detallado.

---

# 2. Evaluación de `plan_codex.md`

## Fortalezas

### 1. Muy buena definición conceptual

Este plan establece una idea central muy sólida:

> El módulo SGC debe ser un panel operativo de cierre documental por ronda, no un repositorio documental completo.

Esta frase ordena todo el diseño.

Además, define claramente:

- Qué es nativo.
- Qué es archivo.
- Qué es mixto.
- Qué corresponde al admin.
- Qué corresponde al participante.
- Qué bloquea y qué solo advierte.

Es uno de los planes mejor pensados funcionalmente.

### 2. Excelente separación entre MVP 1 y MVP 2

El plan propone un MVP 1 claro:

1. Pestaña SGC.
2. Selector de ronda.
3. Checklist de cierre documental.
4. Cronograma nativo.
5. Evidencias versionadas.
6. Comunicaciones manuales.
7. Notificaciones.
8. Comentarios de ronda.
9. Visibilidad participante.
10. Advertencias.
11. Bloqueo solo al cierre documental.

Y deja para MVP 2:

- F-PSEA-08 nativo.
- F-PSEA-11 nativo.
- F-PSEA-13 nativo.
- Casos SGC.
- Importación estructurada desde `pt_app`.
- Gantt/calendario.
- Correos automáticos.

Esta separación es sana porque evita meter todo en la primera entrega.

### 3. Muy buena tabla de visibilidad por rol

Define con claridad qué ve admin y qué ve participante.

Esto reduce mucho el riesgo de errores de permisos.

### 4. Cronograma bien especificado

El plan define:

- Hitos mínimos.
- Campos mínimos.
- Visibilidad.
- Relación con SGC.
- Cuáles ve el participante.

Esto es valioso porque el cronograma es un eje operativo real, no solo una lista decorativa.

### 5. Cierre documental bien modelado

El plan distingue:

- Registros críticos siempre.
- Registros críticos condicionales.
- Advertencias durante operación.
- Bloqueos solo en cierre documental.

Esta es una de sus mejores contribuciones.

### 6. Evidencias con versionamiento claro

La distinción entre:

- Serie documental.
- Versión documental.
- Versión vigente.
- Reemplazada.
- Retirada.

es fuerte y auditable.

## Debilidades

### 1. MVP 1 quizá sigue siendo amplio

Aunque está bien separado, su MVP 1 incluye bastantes cosas:

- Checklist.
- Cronograma.
- Evidencias.
- Comunicaciones.
- Notificaciones.
- Comentarios.
- Visibilidad participante.
- Validaciones de cierre.

Para una primera entrega técnica, puede ser demasiado si el equipo necesita avanzar rápido.

Sería más realista partir con:

1. Checklist.
2. Cronograma.
3. Evidencias versionadas.
4. Estado de cierre.

Y dejar comunicaciones/notificaciones/comentarios para un segundo corte.

### 2. No aterriza tanto como `plan_oc.md` en rutas concretas

Propone arquitectura funcional y tablas, pero no entra tanto en:

- Ruta exacta.
- Estados específicos de ronda.
- Snapshots.
- PDF imprimible.
- Catálogo en código.
- Decisiones sobre códigos provisionales.

### 3. Puede solaparse con la noción de matriz documental

No contempla una matriz documental maestra como `plan_pi.md`, lo cual puede ser una carencia si CALAIRE necesita mapear todo el SGC a futuro.

Pero para MVP, esta ausencia no es grave.

### 4. Notificaciones en MVP pueden crear complejidad innecesaria

El plan incluye `sgcNotificaciones` en MVP 1. Esto podría complicar:

- Modelo de destinatarios.
- Lectura/no lectura.
- Audiencias.
- UI participante.
- Eventos generadores.

Si el MVP busca cierre documental básico, las notificaciones podrían posponerse.

## Riesgo principal

El principal riesgo de `plan_codex.md` es que el MVP 1 se vuelva demasiado grande por incluir muchas funcionalidades operativas además del cierre documental.

## Valor del plan

Es probablemente el mejor plan como **visión funcional integral del panel SGC por ronda**.

---

# 3. Evaluación de `plan_oc.md`

## Fortalezas

### 1. Es el plan más implementable para Fase 1

`plan_oc.md` tiene una virtud clave: toma decisiones duras de alcance.

Define explícitamente qué entra y qué no entra en Fase 1.

Incluye:

- Pestaña `SGC` en `/dashboard/rondas/[id]/sgc`.
- Checklist agrupado por fase.
- Plan de ronda nativo.
- F-13 nativo como checklist manual.
- Evidencias por archivo.
- Carga en Convex Storage.
- Historial sin borrado.
- Estado `documentacion_pendiente`.
- Vistas imprimibles.
- Plantillas P-20 Markdown.
- Bitácora mínima.

Excluye:

- Gestor documental general.
- NC/CAPA.
- Quejas/apelaciones.
- Emails reales.
- Notificaciones in-app.
- Cron automático.
- Integración estructurada con `pt_app`.
- Cálculos nativos.

Esa delimitación es excelente.

### 2. Muy buena incorporación de estados de ronda

Propone agregar:

```txt
documentacion_pendiente
```

con flujo:

```txt
borrador -> activa -> documentacion_pendiente -> cerrada
```

Esto es una mejora importante, porque evita que `cerrada` signifique ambiguamente:

- cierre de recepción de datos,
- cierre operativo,
- cierre documental,
- cierre final.

Separar `documentacion_pendiente` mejora el dominio.

### 3. Buen enfoque sobre F-13

La decisión de que F-13 sea:

- manual,
- apoyado por métricas,
- no completamente automático,

es pragmática.

Esto evita sobrediseñar validaciones que quizá aún no están maduras.

### 4. Buen modelo de evidencias

Aunque más simple que `plan_codex.md`, es suficiente para MVP:

- Metadata automática.
- Última carga vigente.
- Historial.
- Sin borrado.
- Versiones automáticas `v1`, `v2`, `v3`.
- Convex Storage.

Es simple, implementable y auditable.

### 5. Introduce snapshots para registros nativos

Esta es una contribución muy importante.

Si F-06/F-13 son registros editables incluso después de finalizados, los snapshots son necesarios para trazabilidad.

Esto es más maduro que simplemente guardar el estado actual.

### 6. PDF imprimible

El plan entiende que para SGC no basta con mostrar una pantalla. Algunos registros deben poder imprimirse/exportarse formalmente.

Esto es clave para auditoría.

### 7. Buen orden de implementación

El orden sugerido es realista:

1. Guías Convex y Next.
2. Catálogo.
3. Estado de ronda.
4. Schema.
5. Storage.
6. UI.
7. F-06.
8. F-13.
9. Imprimibles.
10. P-20.
11. Transiciones.
12. Bloqueo lectura/edición participante.

## Debilidades

### 1. Puede estar demasiado centrado en la ronda específica

Ubica la pestaña en:

```txt
/dashboard/rondas/[id]/sgc
```

Esto es muy bueno para el trabajo por ronda, pero puede faltar una vista global SGC:

```txt
/dashboard/sgc
```

para ver todas las rondas, documentos pendientes, evidencias faltantes, etc.

Aquí `plan_codex.md` y `plan_pi.md` aportan más.

### 2. La decisión de permitir PDF final con códigos provisionales es riesgosa

El propio plan advierte:

> Los códigos documentales son provisionales, pero se permitirá PDF final sin marca de borrador.

Esto puede ser peligroso en contexto de calidad. Si los códigos aún no están verificados contra la lista maestra, generar documentos finales puede inducir a error.

Mejor sería:

- permitir PDF,
- pero mostrar estado documental o leyenda interna mientras los códigos estén pendientes de validación.

### 3. F-13 puede finalizarse con checks pendientes y sin justificación

Esto reduce fricción, pero debilita el control SGC.

Una opción intermedia:

- permitir finalizar con checks pendientes,
- pero exigir observación si algún ítem queda sin marcar.

### 4. F-06/F-13 finalizados editables directamente

Aunque se mitiga con snapshots, desde perspectiva SGC sería preferible:

- editar genera nueva revisión/snapshot explícito,
- mostrar historial,
- pedir motivo de cambio.

No necesariamente bloquear edición, pero sí hacer visible que se alteró un registro finalizado.

### 5. No incluye notificaciones ni comentarios en Fase 1

Esto es razonable para alcance, pero comparado con `plan_codex.md`, queda menos completo operativamente.

## Riesgo principal

El principal riesgo de `plan_oc.md` es que, por hacerlo muy implementable, podría quedarse corto como visión SGC global y terminar siendo solo una pestaña por ronda sin tablero consolidado.

## Valor del plan

Es el mejor plan para iniciar implementación real de Fase 1.

---

# 4. Evaluación de `plan_pi.md`

## Fortalezas

### 1. Visión más completa del SGC

`plan_pi.md` entiende el SGC como algo más amplio que una ronda individual.

Incluye:

- Dashboard SGC.
- Matriz documental.
- Vista por procesos.
- Cronograma.
- Plan de ronda.
- Comentarios/comunicaciones.
- Casos SGC.
- Preparación de ítem.
- Revisión de datos.
- Evidencias `pt_app`.

Esto da una arquitectura global muy valiosa.

### 2. Excelente regla para decidir nativo vs archivo

Define un criterio más formal:

Un registro debe ser nativo si cumple al menos dos condiciones:

- se diligencia por ronda;
- se diligencia por participante;
- tiene estados;
- requiere timestamps;
- alimenta reportes;
- se consulta frecuentemente;
- implica interacción admin/participante.

Es una regla útil para tomar futuras decisiones.

### 3. Matriz documental maestra

Esta es la gran contribución de `plan_pi.md`.

Propone `documentosSgc` y `documentoSgcVersiones`, con:

- código,
- ronda opcional,
- categoría,
- proceso,
- modo de gestión,
- estado de gestión,
- estado de implementación,
- visibilidad,
- versión actual,
- responsable,
- fechas,
- path de módulo app.

Esto permitiría mapear todo el SGC, no solo documentos de ronda.

Es muy valioso para auditoría, gobierno documental y crecimiento futuro.

### 4. Separación entre estado de gestión y estado de implementación

Muy buena distinción:

```ts
estadoGestion:
- borrador
- vigente
- obsoleto
```

versus:

```ts
estadoImplementacion:
- implementado
- parcial
- pendiente
- no_aplica_app
```

Esto permite decir:

- este documento está vigente como documento SGC,
- pero su soporte en la app aún es parcial.

Esa separación es sofisticada y útil.

### 5. Buena estructura por procesos

Los 8 procesos propuestos ayudan a organizar el sistema:

1. Gestión documental.
2. Planificación de ronda.
3. Convocatoria e inscripción.
4. Preparación y logística.
5. Ejecución y reporte.
6. Revisión y análisis.
7. Informe y cierre.
8. Mejora.

Esto ayuda a no pensar solo en tablas, sino en procesos de calidad.

### 6. Modelo incremental explícito

Divide en:

- Incremento 1.
- Incremento 2.
- Después.

Esto es útil.

## Debilidades

### 1. Riesgo alto de sobrediseño para MVP

El plan incorpora desde el inicio:

- matriz documental,
- importación CSV,
- vista por procesos,
- documentos globales y por ronda,
- control documental,
- dashboard SGC,
- cronograma,
- plan de ronda.

Aunque lo llama Incremento 1, sigue siendo bastante grande.

El riesgo es construir infraestructura documental antes de resolver la necesidad más inmediata: cerrar documentalmente una ronda.

### 2. Contradicción con otros planes sobre F-13

En `plan_pi.md`, F-PSEA-13 no entra en Incremento 1:

> No entra en Incremento 1.

Mientras que en `plan_oc.md`, F-13 sí entra en Fase 1.

Esta es una decisión crítica.

Si el objetivo inmediato es cierre documental de ronda, F-13 parece suficientemente importante para entrar temprano.

### 3. Preparación F-PSEA-08 demasiado detallada para etapa inicial

El modelo de preparación por niveles, contaminante, cilindro, lote, etc. puede ser correcto, pero quizá requiere más validación de dominio.

`plan_oc.md` propone F-08 como archivo en Fase 1, lo cual parece más prudente.

### 4. Casos SGC incluidos en la visión principal

NC/CAPA, quejas y apelaciones son importantes, pero meterlos temprano puede expandir demasiado el alcance.

`plan_codex.md` y `plan_oc.md` son más prudentes al dejarlos para después.

### 5. Confusión potencial entre matriz documental y evidencias por ronda

El plan mezcla:

- documentos globales del SGC,
- documentos específicos por ronda,
- registros nativos,
- evidencias,
- integraciones,
- archivos controlados.

Esto es poderoso, pero si no se diseña cuidadosamente puede terminar siendo demasiado abstracto para el usuario.

## Riesgo principal

El riesgo de `plan_pi.md` es intentar construir un mini sistema documental completo antes de validar el flujo operativo por ronda.

## Valor del plan

Es el mejor plan como **arquitectura futura del módulo SGC completo**, pero no necesariamente como primera implementación.

---

# Comparación por dimensiones

## 1. Claridad de alcance

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | Bajo detalle, alcance ambiguo. |
| `plan_codex.md` | Muy buen alcance funcional, aunque MVP amplio. |
| `plan_oc.md` | Mejor delimitación de Fase 1. |
| `plan_pi.md` | Visión amplia, pero alcance inicial ambicioso. |

Ganador: **`plan_oc.md`**

## 2. Calidad funcional

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | Básico. |
| `plan_codex.md` | Muy alto. |
| `plan_oc.md` | Alto y pragmático. |
| `plan_pi.md` | Alto, más arquitectónico. |

Ganador: **`plan_codex.md`**

## 3. Implementabilidad inmediata

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | Fácil pero incompleto. |
| `plan_codex.md` | Implementable pero amplio. |
| `plan_oc.md` | Más implementable y concreto. |
| `plan_pi.md` | Requiere más diseño previo. |

Ganador: **`plan_oc.md`**

## 4. Arquitectura futura

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | Insuficiente. |
| `plan_codex.md` | Buena para panel por ronda. |
| `plan_oc.md` | Buena para Fase 1. |
| `plan_pi.md` | Mejor visión futura completa. |

Ganador: **`plan_pi.md`**

## 5. Gestión documental

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | Muy limitada. |
| `plan_codex.md` | Evidencias/versiones por ronda bien pensadas. |
| `plan_oc.md` | Evidencias simples y snapshots. |
| `plan_pi.md` | Matriz documental maestra más robusta. |

Ganador: **`plan_pi.md`**, con aporte fuerte de **`plan_codex.md`**

## 6. Control de cierre documental por ronda

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | Lo menciona, no lo define. |
| `plan_codex.md` | Muy sólido. |
| `plan_oc.md` | Muy sólido y aterrizado. |
| `plan_pi.md` | Más indirecto, dividido entre matriz y módulos. |

Ganador: empate entre **`plan_codex.md`** y **`plan_oc.md`**

## 7. Manejo de roles

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | Casi ausente. |
| `plan_codex.md` | Muy claro. |
| `plan_oc.md` | Más implícito. |
| `plan_pi.md` | Bueno. |

Ganador: **`plan_codex.md`**

## 8. Manejo de riesgos

| Plan | Evaluación |
|---|---|
| `plan_agy.md` | No identifica riesgos. |
| `plan_codex.md` | Riesgos implícitos, buen equilibrio. |
| `plan_oc.md` | Muy explícito sobre tradeoffs. |
| `plan_pi.md` | Menos enfocado en riesgos de entrega. |

Ganador: **`plan_oc.md`**

---

# Contradicciones importantes entre planes

## 1. Ubicación del SGC

### `plan_codex.md`

Propone pestaña SGC en dashboard admin con selector de ronda:

```txt
/dashboard/sgc
```

### `plan_oc.md`

Propone pestaña dentro de la ronda:

```txt
/dashboard/rondas/[id]/sgc
```

### `plan_pi.md`

Propone ambas lógicas, con rutas globales y por ronda.

### Recomendación

Implementar ambas progresivamente:

- Fase 1:
  - `/dashboard/rondas/[id]/sgc`
- Fase 1.5 o 2:
  - `/dashboard/sgc` como resumen global.

## 2. F-PSEA-13 en Fase 1

### `plan_oc.md`

Sí entra en Fase 1 como checklist manual.

### `plan_pi.md`

No entra en Incremento 1.

### `plan_codex.md`

Lo deja para MVP 2 como revisión nativa.

### Recomendación

Incluir F-13 en Fase 1 si el objetivo real es **cierre documental de ronda**.

Pero hacerlo en modo simple:

- checklist fijo,
- manual,
- con métricas de apoyo,
- snapshots,
- observación obligatoria solo si hay pendientes.

## 3. F-PSEA-08 en Fase 1

### `plan_agy.md`

Lo incluye.

### `plan_codex.md`

Lo deja para MVP 2.

### `plan_oc.md`

Lo cubre como archivo en Fase 1.

### `plan_pi.md`

Lo modela nativamente en Incremento 2.

### Recomendación

Para Fase 1:

- F-PSEA-08 como evidencia por archivo.

Para Fase 2:

- Evaluar módulo nativo.

## 4. Matriz documental en Fase 1

### `plan_pi.md`

La incluye en Incremento 1.

### `plan_codex.md`

No la prioriza.

### `plan_oc.md`

No la incluye como gestor documental general.

### Recomendación

No meter matriz documental completa en la primera entrega si el objetivo urgente es cerrar rondas.

Pero sí preparar el modelo para no bloquearla después.

## 5. Notificaciones y comunicaciones

### `plan_codex.md`

Incluye comunicaciones manuales y notificaciones en MVP 1.

### `plan_oc.md`

Solo plantillas P-20 Markdown, sin notificaciones.

### `plan_pi.md`

Comentarios/comunicaciones, pero no en primer vertical slice completo.

### Recomendación

Fase 1:

- Plantillas Markdown.
- Registro manual opcional de comunicación si es barato.

Fase 2:

- Comentarios.
- Notificaciones in-app.
- Comunicaciones estructuradas.

---

# Mejoras concretas que cada plan aporta

## Aportes que deben rescatarse de `plan_agy.md`

- Simplicidad.
- División backend/frontend.
- Identificación temprana de:
  - `schema.ts`
  - `convex/sgc.ts`
  - panel SGC
  - documentos por ronda
  - hitos por ronda

Pero debe enriquecerse con los otros planes.

## Aportes que deben rescatarse de `plan_codex.md`

- Panel operativo por ronda, no repositorio completo.
- Regla nativo vs archivo.
- Checklist formal de cierre documental.
- Cronograma nativo de hitos mínimos.
- Evidencias versionadas por serie.
- Visibilidad por rol.
- Diferencia entre advertencias y bloqueos.
- Comentarios no equivalentes automáticamente a quejas.
- `pt_app` como evidencia/metadatos primero, no integración total.
- Separación MVP 1 / MVP 2.

## Aportes que deben rescatarse de `plan_oc.md`

- Fase 1 concreta y realista.
- Estado `documentacion_pendiente`.
- Pestaña SGC dentro de ronda.
- F-06/F-PPSEA-03 nativo por bloques.
- F-13 checklist manual.
- Evidencias con Convex Storage e historial.
- Snapshots de registros nativos.
- PDF imprimible.
- Plantillas P-20 Markdown.
- Bitácora mínima.
- Riesgos y tradeoffs explícitos.
- Orden de implementación práctico.

## Aportes que deben rescatarse de `plan_pi.md`

- Matriz documental maestra.
- Vista por procesos.
- Dashboard SGC global.
- Separación `estadoGestion` / `estadoImplementacion`.
- Importación CSV de matriz.
- Control documental global.
- Casos SGC como módulo futuro.
- Comentarios globales y por ronda.
- Rutas completas para evolución.
- Arquitectura incremental.

---

# Debilidades globales detectadas

## 1. Falta una definición consolidada de “Fase 1”

Cada plan tiene una Fase 1 distinta.

Esto debe resolverse antes de implementar.

## 2. Falta validar códigos documentales

Aparecen variantes:

- F-PSEA-06.
- F-PPSEA-03.
- F-PSEA-13.
- F-PSEA-08.
- F-PSEA-11.

`plan_oc.md` advierte que algunos códigos son provisionales.

Antes de generar documentos oficiales, conviene revisar la lista maestra documental.

## 3. Riesgo de mezclar “registro” y “documento”

Hay que separar claramente:

- Registro nativo.
- Evidencia de archivo.
- Documento controlado global.
- Documento específico por ronda.
- Archivo exportado desde `pt_app`.
- Plantilla de comunicación.

Si no, el modelo se vuelve confuso.

## 4. Riesgo de implementar demasiado al inicio

Entre todos los planes aparecen:

- matriz documental,
- casos SGC,
- notificaciones,
- comentarios,
- F-06,
- F-08,
- F-13,
- F-11,
- cronograma,
- PDF,
- snapshots,
- pt_app,
- comunicaciones,
- dashboard global.

No todo debe entrar al primer incremento.

## 5. Falta una política de edición post-finalización

Algunos planes permiten editar registros finalizados.

Esto debe formalizarse:

- ¿Se permite editar?
- ¿Se crea snapshot?
- ¿Se pide motivo?
- ¿Se muestra historial?
- ¿Cambia estado a “requiere revisión”?

---

# Visión final recomendada

## Principio rector

Implementar primero un **panel SGC por ronda para cierre documental**, no un gestor documental completo.

La app debe permitir responder:

> “¿Esta ronda tiene todos los registros y evidencias necesarios para considerarse documentalmente cerrada?”

---

# Plan maestro recomendado

## Fase 1 — Cierre documental por ronda

### Objetivo

Permitir cerrar documentalmente una ronda con trazabilidad básica.

### Rutas

Implementar primero:

```txt
/dashboard/rondas/[id]/sgc
```

Opcionalmente, un acceso desde:

```txt
/dashboard/sgc
```

pero puede ser solo una lista/resumen que enlace a rondas.

## Incluir en Fase 1

### 1. Estado de ronda

Agregar:

```txt
documentacion_pendiente
```

Flujo:

```txt
borrador -> activa -> documentacion_pendiente -> cerrada
```

### 2. Checklist SGC por ronda

Debe mostrar formatos agrupados por fase:

- Planificación.
- Participación.
- Recepción de datos.
- Evidencia técnica.
- Revisión.
- Cierre.

Estados:

```txt
no_aplica
pendiente
cubierto_nativo
cubierto_archivo
requiere_revision
```

### 3. F-PSEA-06 / Plan de ronda nativo

Implementarlo como registro editable por bloques.

Debe tener:

- estado completado,
- responsable,
- fecha de finalización,
- snapshots al finalizar o modificar después de finalizado,
- vista imprimible.

### 4. Cronograma/hitos por ronda

Modelo simple:

- nombre,
- fecha objetivo,
- fecha real,
- responsable,
- estado,
- visible a participantes,
- notas.

Sin Gantt, sin cron automático, sin emails.

### 5. Evidencias por archivo

Para F-PSEA-08, F-PSEA-09, F-PSEA-10, F-PSEA-14 y otros no nativos.

Reglas:

- Convex Storage.
- Versionado incremental.
- Última versión vigente.
- Sin borrado físico en Fase 1.
- Historial visible para admin.

### 6. F-PSEA-13 nativo simple

Checklist manual con métricas de apoyo.

Debe permitir finalizar, pero recomiendo:

- si hay ítems sin marcar, exigir observación;
- guardar `finalizadoPor`;
- guardar `finalizadoAt`;
- guardar snapshots.

### 7. F-PSEA-11 como no aplica

Si el esquema es in situ:

```txt
no_aplica
```

con descripción clara.

### 8. Plantillas P-20 en Markdown

No emails reales.

Solo enlaces desde SGC.

### 9. Bloqueos de cierre

Para pasar a `cerrada`:

- plan de ronda completo,
- F-13 finalizado,
- evidencias técnicas vigentes,
- participantes/registros existentes cubiertos,
- F-11 marcado no aplica,
- checklist sin pendientes críticos.

## No incluir en Fase 1

- Matriz documental completa.
- Importación CSV.
- NC/CAPA.
- Quejas/apelaciones.
- Notificaciones in-app.
- Emails automáticos.
- Integración estructurada con `pt_app`.
- Gantt/calendario.
- F-PSEA-08 nativo detallado.
- Dashboard SGC global avanzado.

---

# Fase 2 recomendada

## Incluir

1. Dashboard global SGC.
2. Comentarios de participantes por ronda.
3. Comunicaciones manuales registradas.
4. Notificaciones in-app.
5. Casos SGC:
   - quejas,
   - apelaciones,
   - NC/CAPA.
6. Evidencias `pt_app` con metadatos y aprobación.
7. F-PSEA-08 nativo si el flujo real ya está claro.
8. Matriz documental inicial, quizá sin importación CSV todavía.

---

# Fase 3 recomendada

## Incluir

1. Matriz documental completa.
2. Importación CSV.
3. Vista por procesos.
4. Control documental global.
5. Integración estructurada con `pt_app`.
6. Exportaciones formales más robustas.
7. Bitácora avanzada.
8. Recordatorios automáticos.
9. Correos.
10. Gantt/calendario si se justifica.

---

# Modelo de datos recomendado para Fase 1

Tomando lo mejor de los planes, una base razonable sería:

```txt
sgcPlanRonda
sgcRevisionDatos
sgcEvidencias
sgcRegistroSnapshots
sgcAuditLog
sgcHitosRonda
```

Y modificar:

```txt
rondas.estado
```

para incluir:

```txt
documentacion_pendiente
```

Más adelante, para matriz documental:

```txt
documentosSgc
documentoSgcVersiones
```

---

# Veredicto final

## Mejor plan para implementar primero

**`plan_oc.md`**

Porque es el más claro, acotado y ejecutable.

## Mejor plan funcional de referencia

**`plan_codex.md`**

Porque define mejor la lógica de cierre documental, roles, visibilidad, cronograma, evidencias y comunicación.

## Mejor plan arquitectónico futuro

**`plan_pi.md`**

Porque introduce matriz documental, vista por procesos y control documental global.

## Plan más débil

**`plan_agy.md`**

No porque esté mal, sino porque es demasiado resumido para guiar una implementación real.

---

# Recomendación final

Usaría esta combinación:

1. **Base de implementación:** `plan_oc.md`.
2. **Reglas funcionales y criterios de cierre:** `plan_codex.md`.
3. **Arquitectura futura:** `plan_pi.md`.
4. **Resumen macro:** `plan_agy.md`.

La decisión más importante es no construir todavía un SGC completo. Primero hay que resolver bien el cierre documental por ronda. Luego, cuando ese flujo esté validado, se puede expandir hacia matriz documental, casos SGC, comunicaciones, comentarios, dashboard global e integración con `pt_app`.
