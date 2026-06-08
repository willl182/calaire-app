# Sesión Grill-Me — Panel Operativo SGC CALAIRE-APP

## Contexto inicial

El usuario quiere implementar en CALAIRE-APP los formatos/registros necesarios para completar la documentación del SGC, centralizados en la app. Preguntó qué cosas pueden hacerse nativas, si calendario/cronograma debe ser nativo, cuáles definitivamente requieren carga de archivos, si debe existir un panel de control, y qué otras funcionalidades necesita.

Se leyó el archivo `calaire_app_sgc_interface.md`, que identifica formatos ya cubiertos por la app y extensiones naturales.

También se revisó brevemente el código:

- Existe schema Convex con tablas de rondas, participantes, fichas y envíos.
- No hay todavía tablas SGC.
- No hay uso actual de Convex File Storage para documentos.
- Existen rutas admin bajo `/dashboard` y participante bajo `/mi-dashboard`.
- Proyecto usa Next 16, React 19, Convex, WorkOS y pnpm.

---

## Preguntas y decisiones tomadas

### 1. Alcance del panel SGC

Opciones: repositorio documental liviano, panel operativo, SGC completo.

Decisión: **panel operativo SGC**.

---

### 2. Regla nativo vs archivo

Se propuso regla:

- Nativo si es transaccional, por ronda/participante, con estados, auditoría, filtros o interacción.
- Archivo si es narrativo, estático, matriz/acta/procedimiento/instructivo o cambia poco.

Decisión: **aceptada**.

---

### 3. Control documental

Opciones: carga simple, control documental formal mínimo, control completo.

Decisión: **control documental formal mínimo**.

---

### 4. Calendario/cronograma

Opciones: archivo, cronograma nativo simple, Gantt avanzado.

Decisión: **cronograma nativo simple por ronda**.

Adicional: lo demás puede manejarse con **diagramas Mermaid** para documentación/visualización, no como fuente primaria operativa.

---

### 5. Organización del panel

Opciones: por documentos, por procesos, ambos.

Decisión: **ambas vistas**, con navegación por procesos y matriz documental secundaria/maestra.

---

### 6. Dashboard principal

Se recomendó resumen operativo + documental + mejora.

Decisión: **sí**.

Debe mostrar rondas activas, hitos vencidos, documentos próximos a revisión, NC/CAPA, quejas/apelaciones, alertas y accesos rápidos.

---

### 7. Unidad de trabajo

Opciones: todo por ronda, mixto, todo global.

Decisión: **modelo mixto**.

Algunos registros van por ronda; otros son globales o asociados opcionalmente a ronda.

---

### 8. MVP inicial

Opciones: documental, ronda-operativo, mejora, completo mínimo.

Decisión: **MVP completo mínimo en dos incrementos**.

Incremento 1:

- Dashboard SGC.
- Matriz documental.
- Versiones/archivos.
- Cronograma/hitos por ronda.
- Plan de ronda F-PSEA-06.

Incremento 2:

- F-PSEA-08 preparación.
- NC/CAPA, quejas, apelaciones.
- Comentarios.
- Revisión datos e integración/evidencias pt_app según avance.

---

### 9. Ubicación técnica de archivos

Opciones: Convex Storage, enlaces externos, mixto.

Decisión: **archivos subidos desde la app** desde el inicio.

Implicación: usar Convex File Storage.

---

### 10. Publicación de nueva versión documental

Opciones: vigente automática, borrador→vigente manual, aprobación formal.

Decisión: **vigente automáticamente**.

Al subir nueva versión:

- nueva versión queda vigente;
- anteriores quedan obsoletas;
- `versionActual` se actualiza.

---

### 11. Numeración de versiones

Opciones: manual, automática, sugerida editable.

Decisión: **versión sugerida por app y editable por admin**.

---

### 12. Complejidad F-PSEA-06 Plan de ronda

Opciones: extensión mínima, plan operativo completo, documento generado.

Decisión: **plan operativo completo nativo**, pero con campos por pulir luego.

Usuario aclaró que hay campos que quiere quitar después.

---

### 13. Plantilla de cronograma

Opciones: hitos libres, plantilla estándar, mixto.

Decisión: **plantilla estándar editable**.

---

### 14. Estado de hitos

Opciones: manual, automático, mixto.

Decisión: **manual con alertas automáticas**.

---

### 15. Notificaciones de cronograma

Opciones: sin notificaciones, manuales, automáticas, mixto.

Decisión: **por ahora solo alertas visuales**, sin envío real de notificaciones.

---

### 16. Quejas/apelaciones creadas por participantes

Se recomendó inicialmente que participantes pudieran crear quejas/apelaciones.

Usuario corrigió:

- participantes solo dejan comentarios;
- quejas/apelaciones se cargan manualmente por admin.

Decisión: **solo comentarios para participantes; quejas/apelaciones formales manuales por admin**.

---

### 17. Comentarios de participantes

Opciones: solo por ronda, globales y opcionalmente por ronda, solo globales.

Decisión: **globales y opcionalmente asociados a ronda**.

---

### 18. Procesos principales

Se propusieron 8 procesos:

1. Gestión documental.
2. Planificación de ronda.
3. Convocatoria e inscripción.
4. Preparación y logística.
5. Ejecución y reporte.
6. Revisión y análisis.
7. Informe y cierre.
8. Mejora.

Decisión: **aceptados**.

---

### 19. Modos de gestión en matriz

Se propusieron:

- nativo;
- archivo;
- generado;
- integracion.

Decisión: **aceptados**.

---

### 20. Auditoría

Opciones: timestamps básicos, bitácora de eventos, auditoría campo por campo.

Decisión: **diseñar para bitácora de eventos, pero por ahora no implementarla**.

MVP usa timestamps/usuarios básicos.

---

### 21. Permisos

Opciones: solo admin, admin edita/participante ve lo correspondiente, roles SGC específicos.

Decisión: **admin edita todo; participantes ven solo documentos/hitos publicados y sus comentarios**.

---

### 22. Publicado para participantes

Regla confirmada:

Participante ve documento si:

- visibilidad = participantes;
- estado = vigente;
- versión vigente existe;
- si documento tiene ronda, participante pertenece a la ronda.

---

### 23. Documentos asociados a ronda

Opciones: solo globales, globales con ronda opcional, tablas separadas.

Decisión: **documentos globales con asociación opcional a ronda**.

---

### 24. Matriz incluye módulos nativos

Opciones: todo aparece, solo archivos, separar matrices.

Decisión: **todo aparece en la matriz documental**, incluyendo nativos, generados e integraciones.

---

### 25. Formatos ya implementados

Opciones: solo mapear, mapear+accesos, mapear+generar formatos formales.

Decisión: **mapear + accesos directos**, sin generación formal nueva todavía.

---

### 26. Estados en matriz

Se propuso separar:

- estado documental/calidad;
- estado de implementación app.

Decisión: **sí, dos estados separados**.

Valores:

```ts
estadoGestion:
- borrador
- vigente
- obsoleto
```

```ts
estadoImplementacion:
- implementado
- parcial
- pendiente
- no_aplica_app
```

---

### 27. Seed inicial

Se recomendó seed inicial.

Usuario decidió: **la app empieza vacía**.

---

### 28. Creación inicial de matriz

Opciones: manual, CSV, ambos.

Usuario aclaró: **ya hay una matriz y se sube en CSV**.

Decisión: **importación CSV desde el inicio**.

---

### 29. Clave única CSV

Opciones: código, código+rondaId, ID interno.

Decisión: **codigo + rondaCodigo opcional**.

---

### 30. Archivos por versión documental

Opciones: uno, múltiples, uno ahora/anexos después.

Decisión: **solo un archivo por versión**.

---

### 31. Estado F-PSEA-06

Se buscó algo sencillo.

Decisión: **marca de completado**, no workflow formal.

Campos sugeridos:

```ts
planCompletadoAt?
planCompletadoPor?
```

---

### 32. F-PSEA-08 preparación de ítem

Se propuso por ítem PT.

Usuario corrigió:

- es un registro por ronda;
- es la tabla con niveles y archivos crudos.

Decisión: **F-PSEA-08 por ronda**.

---

### 33. Archivos crudos F-PSEA-08

Se propuso múltiples archivos.

Usuario aclaró que son exactamente/típicamente 3 elementos:

1. tabla;
2. CSV;
3. PDF del cilindro.

Decisión: **F-PSEA-08 tiene tabla de niveles, CSV crudo y PDF del cilindro**.

---

### 34. Tabla de niveles F-PSEA-08

Opciones: usar configuración existente, extender con campos de preparación, solo CSV.

Decisión: **extender con campos propios de preparación por nivel**.

---

### 35. F-PSEA-11 envío/recepción

Usuario aclaró:

- no aplica;
- el ítem es in situ;
- no se envía ni recibe.

Decisión: **F-PSEA-11 no aplica**.

---

### 36. F-PSEA-13 revisión de datos

Opciones: checklist nativo, pt_app, archivo.

Decisión: **sí aplica como checklist nativo futuro**.

---

### 37. pt_app F-PSEA-09/10/14

Opciones: subir archivos, importar datos estructurados, integración profunda.

Decisión: **primero subir archivos/evidencias generadas por pt_app**, sin integración estructurada todavía.

---

### 38. Comentarios en panel

Opciones: ejecución/reporte, comunicaciones, ambos.

Decisión: **ambos**:

- por ronda si están asociados;
- módulo global de comunicaciones/soporte.

---

### 39. NC/CAPA, quejas y apelaciones

Opciones: módulos separados, módulo único casos SGC, NC separado.

Decisión: **un solo módulo de casos SGC**.

---

### 40. Estados de casos SGC

Estados aceptados:

```ts
abierto
en_revision
accion_definida
en_verificacion
cerrado
cancelado
```

---

### 41. Visibilidad de casos para participantes

Opciones: no, sí si asociado, solo comentarios.

Decisión: **participantes ven comentarios/respuestas, no casos formales SGC**.

---

### 42. Rutas

Estructura confirmada:

```txt
/dashboard/sgc
/dashboard/sgc/documentos
/dashboard/sgc/documentos/importar
/dashboard/sgc/documentos/[id]
/dashboard/sgc/procesos
/dashboard/sgc/rondas/[id]/cronograma
/dashboard/sgc/rondas/[id]/plan
/dashboard/sgc/rondas/[id]/preparacion
/dashboard/sgc/rondas/[id]/revision-datos
/dashboard/sgc/comentarios
/dashboard/sgc/casos
/mi-dashboard/comentarios
```

Incremento 1 implementa:

```txt
/dashboard/sgc
/dashboard/sgc/documentos
/dashboard/sgc/documentos/importar
/dashboard/sgc/documentos/[id]
/dashboard/sgc/procesos
/dashboard/sgc/rondas/[id]/cronograma
/dashboard/sgc/rondas/[id]/plan
```

---

### 43. Estrategia de implementación

Opciones: backend primero, UI primero, vertical slice.

Decisión: **vertical slice**, empezando por matriz documental + subida de archivo.

---

### 44. Importación CSV técnica

Opciones: server action parsea y llama Convex, Convex recibe filas parseadas, Convex action procesa CSV.

Decisión: **CSV parseado fuera de Convex; Convex recibe filas estructuradas**.

---

### 45. Subida de archivos documentales

Opciones: subida directa crea versión vigente, versión primero, archivo primero.

Decisión: **subida directa crea versión vigente**.

Flujo:

1. Admin entra al documento.
2. Completa versión, notas y archivo.
3. App genera upload URL.
4. Archivo se sube a Convex Storage.
5. Mutation registra versión vigente.
6. Versiones anteriores quedan obsoletas.

---

### 46. Implementar ahora

Se preguntó si procedíamos a implementar el vertical slice.

Usuario respondió: **no**. Pidió guardar el plan y la sesión en archivos raíz:

- `plan_pi.md`
- `grillme_pi.md`

---

## Resumen de implementación acordada

### Empezar por vertical slice

1. Crear tablas:
   - `documentosSgc`
   - `documentoSgcVersiones`

2. Crear funciones Convex:
   - listar documentos;
   - crear/editar documento;
   - upsert desde CSV parseado;
   - generar upload URL;
   - registrar nueva versión vigente;
   - obtener URL de descarga.

3. Crear rutas:
   - `/dashboard/sgc`;
   - `/dashboard/sgc/documentos`;
   - `/dashboard/sgc/documentos/importar`;
   - `/dashboard/sgc/documentos/[id]`.

4. Luego:
   - `/dashboard/sgc/procesos`;
   - `/dashboard/sgc/rondas/[id]/cronograma`;
   - `/dashboard/sgc/rondas/[id]/plan`.

---

## Notas importantes para el próximo agente

- Leer `convex/_generated/ai/guidelines.md` antes de tocar Convex.
- No usar npm; usar siempre pnpm.
- Proyecto usa Next.js 16; leer docs relevantes en `node_modules/next/dist/docs/` antes de tocar APIs Next si hay duda.
- La app debe empezar vacía; no seed automático.
- La matriz inicial viene de CSV.
- El usuario quiere pulir campos de F-PSEA-06 más adelante; no sobre-diseñar formulario todavía.
- F-PSEA-11 no aplica.
- F-PSEA-08 es por ronda, con tabla de niveles, CSV crudo y PDF del cilindro.
- Participantes no crean quejas/apelaciones formales; solo comentarios.
- Casos SGC son internos.
