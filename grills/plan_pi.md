# Plan de implementación — Panel Operativo SGC CALAIRE-APP

## Objetivo

Implementar en CALAIRE-APP un **panel operativo SGC** que centralice la gestión documental y los registros operativos necesarios para completar la documentación del Sistema de Gestión de Calidad, distinguiendo entre:

- registros nativos en la app,
- documentos cargados como archivos controlados,
- registros generados/exportados desde datos existentes,
- evidencias provenientes de pt_app u otros sistemas.

La app no reemplaza todo el SGC: actúa como brazo operativo y repositorio controlado de los documentos/registros que requieren trazabilidad.

---

## Decisiones de alcance

### Tipo de solución

Se implementará un **panel operativo SGC**, no solo un repositorio de archivos ni un SGC completo dentro de la app.

El panel debe combinar:

1. Gestión documental mínima.
2. Operación por ronda.
3. Comentarios/comunicaciones.
4. Casos SGC internos: NC/CAPA, quejas y apelaciones.
5. Vista por procesos.
6. Matriz documental maestra.

---

## Regla para decidir qué va nativo y qué va como archivo

Un registro debe ser **nativo en la app** si cumple al menos dos condiciones:

- se diligencia por ronda;
- se diligencia por participante;
- tiene estados de flujo;
- requiere timestamps o trazabilidad;
- alimenta reportes, resultados, comunicaciones o auditoría;
- debe consultarse o filtrarse frecuentemente;
- involucra interacción entre admin y participante.

Debe quedar como **archivo cargado/controlado** si:

- es narrativo;
- se actualiza pocas veces al año;
- no requiere lógica de negocio;
- es matriz estática, acta, procedimiento o instructivo;
- su valor es conservar una versión firmada/aprobada.

---

## Estructura del panel SGC

### Dashboard principal

Debe mostrar resumen operativo, documental y de mejora:

- rondas activas;
- hitos vencidos;
- documentos próximos a revisión;
- NC/CAPA abiertas;
- quejas/apelaciones abiertas;
- comentarios pendientes;
- registros faltantes por ronda;
- accesos rápidos.

### Vistas principales

1. **Dashboard SGC**
2. **Matriz documental**
3. **Vista por procesos**
4. **Cronograma/hitos por ronda**
5. **Plan de ronda F-PSEA-06**
6. **Comentarios/comunicaciones**
7. **Casos SGC**
8. **Preparación de ítem F-PSEA-08**
9. **Revisión de datos F-PSEA-13**
10. **Evidencias pt_app**

---

## Procesos principales

El panel por procesos usará estas 8 categorías:

1. Gestión documental
2. Planificación de ronda
3. Convocatoria e inscripción
4. Preparación y logística
5. Ejecución y reporte
6. Revisión y análisis
7. Informe y cierre
8. Mejora

---

## Matriz documental SGC

La matriz documental será el mapa maestro de todo el SGC, incluyendo:

- documentos cargados como archivo;
- formatos nativos de la app;
- registros generados/exportados;
- integraciones con pt_app;
- módulos pendientes o parciales;
- elementos no aplicables.

### Modos de gestión

```ts
modoGestion:
- "nativo"
- "archivo"
- "generado"
- "integracion"
```

### Procesos

```ts
proceso:
- "gestion_documental"
- "planificacion_ronda"
- "convocatoria_inscripcion"
- "preparacion_logistica"
- "ejecucion_reporte"
- "revision_analisis"
- "informe_cierre"
- "mejora"
```

### Estados separados

```ts
estadoGestion:
- "borrador"
- "vigente"
- "obsoleto"
```

```ts
estadoImplementacion:
- "implementado"
- "parcial"
- "pendiente"
- "no_aplica_app"
```

---

## Carga inicial de matriz

La app empieza vacía.

La matriz inicial se cargará mediante CSV existente.

### Clave única de importación

```txt
codigo + rondaCodigo opcional
```

Reglas:

- si `rondaCodigo` está vacío, el documento es global y único por `codigo`;
- si `rondaCodigo` tiene valor, el documento es específico de esa ronda;
- si el documento no existe, se crea;
- si existe, se actualiza;
- no se borran documentos ausentes en el CSV.

### Columnas sugeridas

```csv
codigo,rondaCodigo,nombre,categoria,proceso,modoGestion,estadoGestion,estadoImplementacion,visibilidad,responsable,fechaEmision,fechaProximaRevision,descripcion,moduloAppPath
```

El CSV se parseará fuera de Convex. Convex recibirá filas estructuradas para validar y hacer upsert.

---

## Control documental

Se implementará control documental mínimo con archivos subidos desde la app.

### Reglas

- Un documento puede ser global o asociado opcionalmente a una ronda.
- Cada versión documental tiene un solo archivo principal.
- Al subir una nueva versión, esta queda vigente automáticamente.
- Las versiones anteriores pasan a obsoleto.
- La versión es sugerida por la app pero editable por el admin.
- No se permitirá duplicar la misma versión para un mismo documento.

### Modelo conceptual

```ts
documentosSgc
- codigo
- rondaId?
- nombre
- categoria
- proceso
- modoGestion
- estadoGestion
- estadoImplementacion
- visibilidad: "interna" | "participantes"
- versionActual?
- responsable?
- fechaEmision?
- fechaProximaRevision?
- moduloAppPath?
- descripcion?
- createdAt
- updatedAt
- createdBy?
- updatedBy?
```

```ts
documentoSgcVersiones
- documentoId
- version
- estadoGestion: "vigente" | "obsoleto"
- storageId
- nombreArchivo
- mimeType
- tamanoBytes
- notasCambio?
- subidoPor?
- subidoAt
```

### Visibilidad participantes

Un participante solo ve documentos si:

- `visibilidad = participantes`;
- `estadoGestion = vigente`;
- existe versión vigente con archivo;
- si el documento tiene `rondaId`, el participante debe pertenecer a esa ronda.

---

## Cronograma / calendario

El cronograma será **nativo simple por ronda**, no archivo ni Gantt avanzado.

Mermaid se usará para documentación y visualización de procesos, no como fuente primaria del cronograma operativo.

### Modelo conceptual

```ts
rondaHitos
- rondaId
- tipoHito
- titulo
- descripcion?
- fechaInicio?
- fechaFin?
- responsable?
- estado: "pendiente" | "en_progreso" | "cumplido" | "cancelado"
- orden
- obligatorio
- visibleParticipantes
- notificarParticipantes
- createdAt
- updatedAt
```

### Plantilla estándar editable

La app ofrecerá plantilla estándar editable con hitos como:

1. Planificación de ronda
2. Apertura convocatoria
3. Cierre inscripción
4. Confirmación participantes
5. Preparación de ítems
6. Envío de instrucciones / logística
7. Ejecución de mediciones
8. Cierre reporte participantes
9. Revisión de datos
10. Análisis estadístico
11. Emisión de informe
12. Cierre de ronda

### Estados y alertas

El estado será manual. La app calculará alertas visuales:

- sin fecha;
- vence pronto;
- vencido;
- ok.

No habrá envío real de notificaciones en el Incremento 1.

---

## Plan de ronda F-PSEA-06

Será un módulo nativo de plan operativo completo, aunque los campos se pulirán luego.

Debe apoyarse en tablas existentes:

- `rondas`
- `rondaContaminantes`
- `rondaPtItems`
- `rondaPtSampleGroups`

Campos posibles:

- objetivo;
- alcance;
- responsable/coordinador;
- método de valor asignado;
- criterio de evaluación;
- σ_pt/desviación estándar para desempeño;
- personal asignado;
- observaciones;
- vínculo con cronograma/hitos.

Estado sencillo:

```ts
planCompletadoAt?
planCompletadoPor?
```

La UI mostrará incompleto/completo según marca de completado y campos mínimos. No se implementará flujo formal de aprobación inicialmente.

---

## F-PSEA-08 Preparación de ítem

Aplica como registro por ronda, no por ítem individual.

Representa:

1. tabla de niveles;
2. CSV crudo;
3. PDF del cilindro.

La tabla de niveles necesita campos propios de preparación por nivel.

### Modelo conceptual

```ts
preparacionItemsRonda
- rondaId
- responsable
- fechaPreparacion
- observaciones?
- csvCrudoStorageId?
- csvCrudoNombre?
- pdfCilindroStorageId?
- pdfCilindroNombre?
- completadoAt?
- completadoPor?
- createdAt
- updatedAt
```

```ts
preparacionItemsNiveles
- preparacionId
- contaminante
- nivel
- concentracionObjetivo?
- concentracionPreparada?
- unidad?
- cilindro?
- lote?
- observaciones?
```

---

## F-PSEA-11 Envío/Recepción

No aplica.

El ítem es in situ. No se envía ni se recibe.

En matriz documental debe registrarse como:

```ts
estadoImplementacion: "no_aplica_app"
descripcion: "No aplica al esquema in situ; no hay envío/recepción de ítems."
```

---

## F-PSEA-13 Revisión de datos

Sí aplica como checklist nativo futuro.

Modelo conceptual:

```ts
revisionDatosRonda
- rondaId
- unidadesOk
- replicasCompletas
- incertidumbresOk
- valoresPlausibles
- exclusionesDocumentadas
- listoParaAnalisis
- observaciones?
- revisadoPor?
- revisadoAt?
```

No entra en Incremento 1.

---

## Integración pt_app

Para F-PSEA-09 Homogeneidad, F-PSEA-10 Estabilidad y F-PSEA-14 Cálculo estadístico:

- primero se manejarán como evidencias/archivos subidos desde pt_app;
- no habrá integración estructurada ni API inicialmente.

Modelo conceptual:

```ts
analisisPtRonda
- rondaId
- tipo: "homogeneidad" | "estabilidad" | "calculo_estadistico"
- storageId
- nombreArchivo
- observaciones?
- subidoAt
- subidoPor?
```

---

## Comentarios de participantes

Los participantes no crearán quejas/apelaciones formales directamente.

Tendrán un módulo de comentarios informales.

Los comentarios serán globales y opcionalmente asociados a ronda.

Admin podrá responder y, si aplica, convertir o relacionar un comentario con un caso SGC interno.

Modelo conceptual:

```ts
comentariosParticipante
- rondaId?
- rondaParticipanteId?
- directorioParticipanteId?
- asunto
- mensaje
- categoria
- estado: "recibido" | "respondido" | "cerrado"
- respuestaAdmin?
- creadoAt
- respondidoAt?
- cerradoAt?
```

Los comentarios deben verse:

- dentro de una ronda si están asociados;
- en módulo global de comunicaciones/soporte.

---

## Casos SGC

NC/CAPA, quejas y apelaciones se manejarán como un solo módulo de casos SGC.

Son internos para admin. Participantes ven sus comentarios y respuestas, no los casos formales.

### Modelo conceptual

```ts
casosSgc
- tipo: "nc_capa" | "queja" | "apelacion"
- rondaId?
- comentarioId?
- participanteId?
- titulo
- descripcion
- estado
- severidad?
- causaRaiz?
- accionCorrectiva?
- respuestaResolucion?
- responsable?
- fechaRecepcion
- fechaLimite?
- cerradoAt?
```

### Estados comunes

```ts
estado:
- "abierto"
- "en_revision"
- "accion_definida"
- "en_verificacion"
- "cerrado"
- "cancelado"
```

---

## Permisos y visibilidad

### Admin

- ve y edita todo el panel SGC;
- carga documentos;
- gestiona cronogramas, plan de ronda, comentarios y casos;
- accede a matriz completa.

### Participante

- ve solo documentos vigentes publicados para participantes;
- ve cronograma/hitos publicados de sus rondas;
- crea comentarios;
- ve respuestas a sus comentarios;
- no ve matriz completa, casos SGC internos ni documentos internos.

---

## Auditoría

Se diseñará pensando en bitácora de eventos, pero no se implementará todavía.

Para MVP se usarán campos básicos:

- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`

Futuro:

```ts
sgcEventos
- entidadTipo
- entidadId
- rondaId?
- accion
- descripcion
- actorUserId
- actorEmail?
- createdAt
```

---

## Rutas propuestas

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

### Incremento 1 implementa

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

## Incrementos

### Incremento 1

Vertical slice inicial:

1. Matriz documental SGC.
2. Importación CSV.
3. Detalle de documento.
4. Subida de archivo desde la app.
5. Nueva versión vigente automática.
6. Versiones anteriores obsoletas.
7. Dashboard SGC básico.
8. Cronograma/hitos por ronda.
9. Plan de ronda F-PSEA-06.

### Incremento 2

1. F-PSEA-08 Preparación de ítem.
2. Comentarios de participantes.
3. Casos SGC.
4. F-PSEA-13 Revisión de datos.
5. Evidencias pt_app para F-PSEA-09/10/14.

### Después

1. Notificaciones manuales/automáticas.
2. Exportación formal PDF/Word/CSV de formatos.
3. Bitácora de eventos.
4. Importaciones más avanzadas.
5. Integración estructurada con pt_app.

---

## Primer vertical slice recomendado

Cuando se implemente, empezar por:

1. Tablas Convex:
   - `documentosSgc`
   - `documentoSgcVersiones`

2. Funciones Convex:
   - listar documentos;
   - crear/editar documento;
   - upsert desde CSV parseado;
   - generar upload URL;
   - registrar nueva versión vigente;
   - obtener URL de descarga.

3. UI:
   - `/dashboard/sgc/documentos`;
   - `/dashboard/sgc/documentos/importar`;
   - `/dashboard/sgc/documentos/[id]`.

4. Luego:
   - dashboard SGC;
   - procesos;
   - cronograma;
   - plan de ronda.
