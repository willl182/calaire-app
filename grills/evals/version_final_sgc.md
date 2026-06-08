# Version final consolidada - Panel SGC CALAIRE-APP

Fecha: 2026-06-07

Documento construido a partir de todas las evaluaciones en `grills/evals/` y contrastado con el estado actual del repo.

Evaluaciones revisadas:

- `eval_code_55h.md`
- `eval_codex.md`
- `eval_oc.md`
- `eval_pi.md`
- `eval_pi_dsv4.md`
- `eval_pi_glm51.md`
- `eval_pi_k26.md`
- `eval_pi_m27.md`
- `eval_pi_mimo25.md`
- `eval_pi_qwen36.md`
- `eval_pi_qwen37.md`

Planes fuente evaluados por esas revisiones:

- `grills/plan_agy.md`
- `grills/plan_codex.md`
- `grills/plan_oc.md`
- `grills/plan_pi.md`

## 1. Veredicto ejecutivo

La version final no debe escoger un plan completo tal como esta. La decision correcta es un plan hibrido con jerarquia clara:

1. Base de implementacion inmediata: `plan_oc.md`.
2. Reglas funcionales, visibilidad por rol, cronograma y cierre documental: `plan_codex.md`.
3. Arquitectura futura de matriz documental, procesos, casos SGC e importacion CSV: `plan_pi.md`.
4. Simplicidad y lista macro de ejecucion: `plan_agy.md`, solo como recordatorio historico, no como especificacion.

La primera entrega debe implementar un panel SGC por ronda para cierre documental operativo. No debe implementar todavia un gestor documental completo.

La pregunta que debe poder responder Fase 1 es:

> Esta ronda tiene todos los registros y evidencias necesarios para considerarse documentalmente cerrada?

## 2. Decision central de producto

### 2.1 Que es el modulo SGC en Fase 1

Es una pestaña operativa por ronda que consolida:

- estado documental de la ronda;
- checklist de formatos y evidencias;
- plan de ronda nativo;
- cronograma/hitos;
- revision de datos F-PSEA-13;
- evidencias versionadas;
- snapshots de registros nativos;
- vista imprimible/PDF para registros principales;
- reglas de bloqueo para pasar a cierre final.

### 2.2 Que no es en Fase 1

No es:

- gestor documental global;
- matriz documental maestra editable;
- importador CSV de documentos;
- sistema NC/CAPA;
- sistema de quejas o apelaciones;
- motor de comunicaciones;
- motor de emails;
- sistema de notificaciones in-app;
- integracion estructurada con `pt_app`;
- reemplazo de `pt_app`;
- calendario/Gantt;
- auditoria formal completa.

Estas piezas son importantes, pero no son necesarias para validar el flujo principal.

## 3. Ranking consolidado de los planes

| Plan | Rol final | Veredicto |
|---|---|---|
| `plan_oc.md` | Espina dorsal de Fase 1 | Mejor balance entre alcance, trazabilidad, implementabilidad y alineacion con el repo |
| `plan_codex.md` | Arquitectura funcional | Mejor definicion de roles, hitos, cierre documental, visibilidad y flujos |
| `plan_pi.md` | Arquitectura futura | Mejor vision de matriz documental, procesos, casos SGC y control documental amplio |
| `plan_agy.md` | Resumen historico | Util como indice inicial, insuficiente como plan tecnico |

## 4. Consenso extraido de las evaluaciones

Las evaluaciones coinciden ampliamente en estos puntos:

- El eje inicial debe ser la ronda.
- El primer panel debe vivir naturalmente en el detalle de ronda.
- Convex Storage debe usarse para evidencias.
- Debe existir versionamiento o historial de evidencias.
- Debe distinguirse registro nativo, archivo de evidencia y documento controlado.
- `cerrada` no debe seguir significando cierre ambiguo.
- Hace falta un estado intermedio entre recepcion activa y cierre final.
- F-PSEA-13 debe entrar temprano si el objetivo es cierre documental.
- F-PSEA-08 puede ser archivo en Fase 1 y nativo despues.
- La matriz documental de `plan_pi.md` es valiosa, pero demasiado grande como primer corte.
- Las comunicaciones, comentarios, notificaciones y casos SGC son utiles, pero no deben bloquear el MVP nuclear.

## 5. Contradicciones resueltas

### 5.1 Ruta SGC global vs ruta por ronda

Decision:

- Fase 1: `/dashboard/rondas/[id]/sgc`.
- Fase 1.5 o Fase 2: `/dashboard/sgc` como resumen global que enlaza rondas.

Razon:

El repo ya tiene `RondaContextNav` con tabs: Resumen, Configuracion PT, Participantes y Resultados. La pestaña SGC encaja alli sin crear una plataforma nueva.

### 5.2 Matriz documental en primer incremento

Decision:

- No implementar matriz documental completa en Fase 1.
- Preparar nomenclatura y modelo para que `documentosSgc` y `documentoSgcVersiones` entren despues.

Razon:

Empezar por matriz + CSV + procesos retrasa el valor principal: cerrar una ronda con trazabilidad.

### 5.3 F-PSEA-13 en Fase 1

Decision:

- Si entra en Fase 1.
- Debe ser nativo, manual y apoyado por metricas.
- Puede finalizarse con checks pendientes solo si cada pendiente tiene observacion o justificacion.

Razon:

F-PSEA-13 es parte del cierre documental real. Postergarlo deja incompleta la primera entrega.

### 5.4 F-PSEA-08 en Fase 1

Decision:

- Fase 1: evidencia por archivo.
- Fase 2: modulo nativo de preparacion de item, tomando el modelo tecnico de `plan_pi.md`.

Razon:

El modelo por niveles, concentraciones, cilindros y lotes puede ser correcto, pero necesita validacion de dominio. Como archivo, cubre trazabilidad inicial sin bloquear.

### 5.5 Comunicaciones, comentarios y notificaciones

Decision:

- Fase 1: plantillas P-20 en Markdown, sin envio automatico.
- Fase 1.5: registro manual de comunicacion si es barato.
- Fase 2: comentarios, notificaciones in-app y comunicaciones estructuradas.

Razon:

Codex modela muy bien estas piezas, pero meterlas en el MVP nuclear agrega permisos, destinatarios, estados de lectura y UI participante antes de cerrar el flujo documental basico.

## 6. Principios de arquitectura

### 6.1 Panel operativo antes que repositorio

La app debe resolver primero el cierre documental de rondas. La matriz documental global debe venir despues, cuando el flujo por ronda este validado.

### 6.2 Nativo vs archivo

Un registro debe ser nativo si cumple al menos dos de estas condiciones:

- se diligencia por ronda o participante;
- tiene estados;
- requiere responsable y timestamps;
- alimenta reportes o metricas;
- se consulta frecuentemente;
- requiere interaccion admin/participante;
- requiere aprobacion, revision o cierre.

Debe ser archivo/evidencia si:

- proviene de una fuente externa;
- es narrativo o tecnico y no requiere edicion frecuente en la app;
- solo debe preservarse con version e historial;
- no alimenta directamente calculos o estado operativo;
- es un resultado exportado desde `pt_app`.

Debe ser generado si:

- se produce a partir de datos nativos de la app;
- puede regenerarse;
- necesita formato formal imprimible.

Debe ser integracion si:

- depende de un sistema externo con datos estructurados;
- en Fase 1 se acepta como archivo + metadata.

### 6.3 Separar conceptos documentales

No mezclar en una sola tabla semanticas diferentes.

| Concepto | Definicion | Ejemplo |
|---|---|---|
| Registro nativo | Datos editados y cerrados dentro de la app | Plan de ronda, F-PSEA-13 |
| Evidencia de archivo | Archivo asociado a una ronda/formato | F-PSEA-08 PDF, homogeneidad, estabilidad |
| Snapshot | Copia historica de un registro nativo | Plan de ronda finalizado v1 |
| Documento controlado | Documento de la lista maestra SGC | Procedimiento, formato vigente |
| Plantilla | Texto versionado en repo para comunicacion | P-20 convocatoria |
| Integracion externa | Salida de sistema externo | `pt_app` exportado |

### 6.4 No arrays no acotados en Convex

Las relaciones 1:N deben ir a tablas separadas. No guardar listas crecientes de comentarios, eventos, versiones o participantes dentro de un solo documento.

Para campos acotados y fijos, como checks de F-PSEA-13 o bloques del plan, puede usarse un objeto/record con claves estables, no una lista operacional creciente.

### 6.5 Sin borrado fisico en Fase 1

Las evidencias no se borran fisicamente en Fase 1. Se reemplazan, retiran u obsoletan. Esto reduce riesgo de perdida documental.

### 6.6 PDF formal con estado documental visible

Los PDFs de Fase 1 pueden generarse, pero si los codigos documentales siguen provisionales deben mostrar una leyenda visible:

```txt
Codigo documental pendiente de confirmacion contra lista maestra SGC.
```

No debe existir PDF "limpio" de uso oficial si la lista maestra no esta verificada.

## 7. Alcance por fases

### 7.1 Fase 1 - Cierre documental por ronda

Objetivo:

Permitir que un coordinador cierre documentalmente una ronda con evidencias, registros nativos, historial y bloqueo final.

Incluye:

- pestaña SGC en detalle de ronda;
- nuevo estado `documentacion_pendiente`;
- checklist SGC agrupado por fase;
- catalogo SGC en codigo;
- plan de ronda nativo;
- cronograma/hitos simples;
- F-PSEA-13 nativo manual con metricas;
- evidencias en Convex Storage;
- evidencias con serie + versiones;
- snapshots de registros nativos;
- bitacora minima;
- vistas imprimibles para plan de ronda y F-PSEA-13;
- plantillas P-20 Markdown;
- bloqueo de envios/ediciones participantes cuando la ronda esta en `documentacion_pendiente` o `cerrada`;
- reglas de cierre documental.

No incluye:

- matriz documental completa;
- importacion CSV;
- comentarios de participantes;
- notificaciones in-app;
- comunicaciones estructuradas;
- emails;
- casos SGC;
- NC/CAPA;
- quejas;
- apelaciones;
- F-PSEA-08 nativo;
- integracion estructurada con `pt_app`;
- dashboard global avanzado.

### 7.2 Fase 1.5 - Operacion liviana global

Objetivo:

Agregar visibilidad transversal sin rediseñar el dominio.

Incluye:

- `/dashboard/sgc` como resumen global simple;
- listado de rondas con bloqueantes SGC;
- registro manual opcional de comunicaciones;
- enlaces a plantillas P-20;
- primeras publicaciones visibles al participante, solo lectura.

### 7.3 Fase 2 - Operacion SGC ampliada

Objetivo:

Agregar interaccion participante y casos operativos.

Incluye:

- F-PSEA-08 nativo;
- comentarios de participantes por ronda;
- comunicaciones manuales registradas;
- notificaciones in-app;
- casos SGC unificados:
  - quejas;
  - apelaciones;
  - NC/CAPA;
- evidencias `pt_app` con metadata y aprobacion;
- visibilidad participante de cronograma, publicaciones y comentarios propios;
- dashboard SGC global basico.

### 7.4 Fase 3 - SGC documental completo

Objetivo:

Convertir el modulo en sistema documental operativo ampliado.

Incluye:

- matriz documental maestra;
- `documentosSgc`;
- `documentoSgcVersiones`;
- importacion CSV;
- vista por procesos;
- control documental global;
- documentos proximos a revision;
- auditoria formal;
- integracion estructurada con `pt_app`;
- automatizacion de comunicaciones;
- recordatorios;
- calendario/Gantt solo si se justifica.

## 8. Estado de ronda

### 8.1 Estado actual del repo

El schema actual define:

```ts
"borrador" | "activa" | "cerrada"
```

Tambien hay transiciones codificadas en `convex/rondas.ts`, `lib/rondas.ts`, acciones del dashboard, formularios de participante, badges y paginas de detalle.

Por tanto, agregar un estado no es un cambio local. Es una migracion funcional.

### 8.2 Estado final recomendado

Agregar:

```ts
"documentacion_pendiente"
```

Flujo:

```txt
borrador -> activa -> documentacion_pendiente -> cerrada
```

Reapertura:

```txt
cerrada -> documentacion_pendiente
```

No permitir:

```txt
cerrada -> activa
documentacion_pendiente -> activa
```

salvo que se defina un proceso excepcional posterior.

### 8.3 Semantica de cada estado

| Estado | Significado | Participante | Admin |
|---|---|---|---|
| `borrador` | Configuracion inicial | No opera | Configura ronda, PT, participantes |
| `activa` | Ronda en operacion | Puede reclamar cupo, enviar ficha y resultados | Gestiona operacion |
| `documentacion_pendiente` | Recepcion cerrada, SGC pendiente | Solo lectura | Completa plan, F-13, evidencias y cierre |
| `cerrada` | Cierre documental completo | Solo lectura | Solo consulta o reapertura controlada |

### 8.4 Requisitos de transicion

#### `borrador -> activa`

Requisitos:

- ronda tiene configuracion minima;
- si aplica PT, existen items y grupos;
- participantes pueden asignarse o invitarse segun flujo actual.

#### `activa -> documentacion_pendiente`

Requisitos minimos:

- plan de ronda existe y esta finalizado;
- participantes `member` esperados estan identificados;
- F-PSEA-05 cubierto por confirmaciones/enlaces reclamados o justificacion;
- F-PSEA-05A cubierto por fichas enviadas o justificacion;
- F-PSEA-07 cubierto por codigos de participante;
- F-PSEA-12 cubierto por envios finales cuando aplique;
- no hay envios de participante en progreso que el admin decida mantener abiertos;
- se registra responsable y timestamp de transicion.

Efecto:

- participantes quedan en modo lectura;
- formularios publicos rechazan mutaciones porque la ronda ya no esta `activa`.

#### `documentacion_pendiente -> cerrada`

Requisitos:

- checklist SGC sin pendientes criticos;
- F-PSEA-13 finalizado;
- evidencias requeridas vigentes;
- F-PSEA-11 marcado como no aplica si corresponde;
- registros nativos finalizados tienen snapshot;
- codigos documentales muestran estado verificado o leyenda provisional;
- responsable y fecha de cierre documental registrados.

#### `cerrada -> documentacion_pendiente`

Requisitos:

- motivo obligatorio;
- responsable;
- bitacora;
- no reabre formularios de participante.

## 9. Checklist SGC de Fase 1

### 9.1 Estados de cobertura por formato

```txt
no_aplica
pendiente
cubierto_nativo
cubierto_archivo
requiere_revision
```

Definiciones:

| Estado | Definicion |
|---|---|
| `no_aplica` | El formato no aplica a esta ronda y la razon esta documentada |
| `pendiente` | Falta registro, evidencia o decision |
| `cubierto_nativo` | La app puede demostrar cobertura con datos nativos |
| `cubierto_archivo` | Existe evidencia vigente cargada |
| `requiere_revision` | Hay datos/evidencia, pero falta aprobacion, observacion o correccion |

### 9.2 Formatos iniciales

| Formato | Nombre operacional | Fase | Modo Fase 1 | Criterio de cobertura |
|---|---|---|---|---|
| F-PPSEA-03 / F-PSEA-06 | Plan de ronda | Planificacion | Nativo | Plan finalizado, responsable, fecha, snapshot |
| F-PSEA-05 | Confirmacion / participacion | Convocatoria | Nativo existente calculado | Participantes `member` reclamados o justificados |
| F-PSEA-05A | Ficha de registro | Convocatoria | Nativo existente calculado | Fichas `enviado` para participantes aplicables |
| F-PSEA-07 | Lista/codigos de participantes | Participacion | Nativo existente calculado | Participantes con `participantCode` unico |
| F-PSEA-08 | Preparacion de item | Preparacion | Archivo | Evidencia vigente cargada |
| F-PSEA-09 | Homogeneidad | Evidencia tecnica | Archivo | Evidencia vigente cargada |
| F-PSEA-10 | Estabilidad | Evidencia tecnica | Archivo | Evidencia vigente cargada |
| F-PSEA-11 | Envio/recepcion de item | Logistica | No aplica inicial | Marcado `no_aplica` por esquema in situ |
| F-PSEA-12 | Reportes de participantes | Ejecucion | Nativo existente calculado | Envios finales completos cuando aplica |
| F-PSEA-13 | Revision de datos | Revision | Nativo | Checklist finalizado, metricas revisadas, snapshot |
| F-PSEA-14 | Calculo estadistico | Analisis | Archivo | Evidencia vigente desde `pt_app` o archivo tecnico |

### 9.3 Agrupacion UI

Agrupar el checklist por:

- Planificacion;
- Convocatoria y participacion;
- Preparacion y evidencia tecnica;
- Ejecucion y recepcion;
- Revision y analisis;
- Cierre.

## 10. Plan de ronda nativo

### 10.1 Decision

Implementar el plan de ronda como registro nativo, tomando el detalle de `plan_oc.md`:

- bloques editables `a` a `u`;
- subcampos estructurados solo donde aportan trazabilidad;
- autocompletado desde datos existentes cuando sea razonable;
- estado de finalizacion;
- responsable;
- timestamps;
- snapshot al finalizar y al modificar despues de finalizado;
- vista imprimible.

### 10.2 Reglas

- Puede editarse mientras no este finalizado.
- Al finalizar se crea snapshot.
- Si se modifica despues de finalizado:
  - exigir motivo;
  - crear nuevo snapshot;
  - registrar evento en bitacora;
  - marcar el registro como `requiere_revision` hasta que se vuelva a confirmar.

### 10.3 Datos autocompletables

Desde `rondas`:

- codigo;
- nombre;
- estado.

Desde `rondaContaminantes`:

- contaminantes;
- niveles;
- replicas.

Desde `rondaPtItems` y `rondaPtSampleGroups`:

- items PT;
- grupos;
- codigos operativos.

Desde `rondaParticipantes`:

- numero de participantes;
- codigos asignados;
- perfiles `member` / `member_special`.

## 11. Cronograma e hitos

### 11.1 Decision

Implementar cronograma simple, no Gantt.

Usar la estructura de Codex como referencia, pero sin notificaciones automaticas en Fase 1.

### 11.2 Campos minimos

Cada hito debe tener:

- `rondaId`;
- `codigo`;
- `nombre`;
- `fase`;
- `fechaObjetivo`;
- `fechaReal`;
- `estado`;
- `responsable`;
- `visibleParticipante`;
- `bloqueaCierre`;
- `formatoRelacionado`;
- `notas`;
- `createdAt`;
- `updatedAt`.

### 11.3 Estados de hito

```txt
pendiente
en_progreso
completado
vencido
cancelado
no_aplica
```

### 11.4 Regla de bloqueo

Durante `activa`, los hitos atrasados advierten. En `documentacion_pendiente`, los hitos marcados `bloqueaCierre` pueden impedir pasar a `cerrada`.

## 12. Evidencias

### 12.1 Decision

Adoptar el modelo serie/versiones de `plan_codex.md`, enriquecido con metadata automatica de `plan_oc.md`.

No usar una sola tabla `sgcEvidencias` para todo el historial si se quiere versionamiento robusto.

### 12.2 Tablas recomendadas

```txt
sgcEvidenciaSeries
sgcEvidenciaVersiones
```

### 12.3 Serie documental

Una serie representa el requisito documental de una ronda/formato/seccion.

Campos:

- `rondaId`;
- `formatoCodigo`;
- `seccion`;
- `titulo`;
- `estado`;
- `versionVigenteId`;
- `obligatoria`;
- `createdAt`;
- `createdBy`;
- `updatedAt`;
- `updatedBy`.

Estados:

```txt
pendiente
vigente
requiere_revision
retirada
no_aplica
```

Indices:

- `by_rondaId`;
- `by_rondaId_and_formatoCodigo`;
- `by_rondaId_and_estado`;

### 12.4 Version de evidencia

Una version representa un archivo real en Convex Storage.

Campos:

- `serieId`;
- `rondaId`;
- `storageId`;
- `versionNumero`;
- `estado`;
- `filename`;
- `mimeType`;
- `sizeBytes`;
- `sha256` opcional si se calcula fuera de mutation;
- `descripcion`;
- `uploadedAt`;
- `uploadedBy`;
- `reemplazadaPorVersionId`;
- `retiredAt`;
- `retiredBy`;
- `motivoRetiro`.

Estados:

```txt
vigente
reemplazada
retirada
rechazada
```

Indices:

- `by_serieId`;
- `by_serieId_and_versionNumero`;
- `by_rondaId`;
- `by_rondaId_and_estado`;

### 12.5 Reglas de Storage

Fase 1:

- Tipos permitidos: PDF, DOCX, XLSX, CSV, PNG, JPG.
- Limite sugerido inicial: 10 MB por archivo, ajustable tras verificar limites reales del proyecto.
- `generateUploadUrl` debe usarse para subir.
- Luego se registra version con metadata.
- Una sola version puede estar `vigente` por serie.
- Al subir nueva version, la anterior pasa a `reemplazada`.
- No borrar fisicamente desde Storage en Fase 1.
- Descarga mediante URL generada por `ctx.storage.getUrl` y controlada por permisos.

### 12.6 Archivos huerfanos

Si se sube un archivo pero falla el registro de version:

- registrar evento si es detectable;
- permitir reconciliacion administrativa posterior;
- no intentar resolverlo con borrado automatico en Fase 1.

## 13. F-PSEA-13 Revision de datos

### 13.1 Decision

Implementar F-PSEA-13 como checklist nativo manual con metricas de apoyo.

No automatizar completamente la revision.

### 13.2 Metricas de apoyo

Mostrar al coordinador:

- participantes esperados;
- participantes con ficha enviada;
- participantes con envio final;
- completitud por contaminante/nivel/grupo;
- celdas faltantes;
- estado de export CSV;
- evidencias F-PSEA-09/10/14 cargadas;
- inconsistencias detectables.

### 13.3 Checks

Los checks deben ser fijos en codigo para Fase 1, con claves estables.

Cada check debe guardar:

- `cumple`;
- `observacion`;
- `updatedAt`;
- `updatedBy`.

Regla:

- Si `cumple` es falso al finalizar, `observacion` es obligatoria.

### 13.4 Finalizacion

Al finalizar:

- guardar `finalizadoAt`;
- guardar `finalizadoBy`;
- crear snapshot;
- registrar evento;
- actualizar cobertura del checklist.

## 14. Snapshots

### 14.1 Decision

Los registros nativos finalizables deben tener snapshots.

Aplica en Fase 1 a:

- Plan de ronda;
- F-PSEA-13.

### 14.2 Tabla recomendada

```txt
sgcRegistroSnapshots
```

Campos:

- `rondaId`;
- `tipoRegistro`;
- `registroId`;
- `versionNumero`;
- `payload`;
- `motivo`;
- `createdAt`;
- `createdBy`.

Indices:

- `by_rondaId`;
- `by_registroId`;
- `by_rondaId_and_tipoRegistro`;

### 14.3 Reglas

- Snapshot al finalizar.
- Snapshot antes o despues de modificar un registro finalizado; la decision tecnica debe ser consistente y documentada.
- Motivo obligatorio si el registro ya estaba finalizado.
- Historial visible para admin.

## 15. Bitacora minima

### 15.1 Tabla

```txt
sgcAuditLog
```

Campos:

- `rondaId`;
- `eventType`;
- `targetType`;
- `targetId`;
- `summary`;
- `metadata`;
- `createdAt`;
- `createdBy`.

Indices:

- `by_rondaId`;
- `by_rondaId_and_eventType`;
- `by_createdAt`;

### 15.2 Eventos minimos

- plan creado;
- plan finalizado;
- plan modificado despues de finalizado;
- F-13 finalizado;
- evidencia cargada;
- evidencia reemplazada;
- evidencia retirada;
- estado de ronda cambiado;
- ronda reabierta;
- PDF generado.

## 16. Catalogo SGC en codigo

### 16.1 Decision

Fase 1 debe usar catalogo en codigo, no UI editable.

Ruta sugerida:

```txt
lib/sgc/catalog.ts
```

### 16.2 Contenido minimo

Cada entrada del catalogo:

- codigo;
- nombre;
- fase;
- modoGestion;
- criticidad;
- aplicaPorDefecto;
- criterioCobertura;
- requiereEvidencia;
- permiteNoAplica;
- descripcionNoAplica;
- rutaModulo;
- orden;
- codigoVerificado;
- notaCodigoProvisional.

### 16.3 Criterio sobre codigos provisionales

Si un codigo no esta confirmado:

- marcar `codigoVerificado: false`;
- mostrar leyenda en UI;
- mostrar leyenda en PDF;
- no ocultar el riesgo.

## 17. Plantillas P-20

### 17.1 Decision

Fase 1 solo incluye plantillas Markdown versionadas en repo.

Ruta sugerida:

```txt
lib/sgc/templates/p20/
```

### 17.2 Plantillas minimas

- convocatoria;
- recordatorio de ficha;
- recordatorio de envio de resultados;
- publicacion de resultados;
- cierre de ronda.

### 17.3 Variables minimas

- `{{ronda_codigo}}`;
- `{{ronda_nombre}}`;
- `{{fecha_limite}}`;
- `{{participante_nombre}}`;
- `{{laboratorio_nombre}}`;
- `{{link_ronda}}`;
- `{{contacto_soporte}}`.

No enviar emails automaticamente en Fase 1.

## 18. Visibilidad por rol

### 18.1 Roles iniciales

Fase 1 debe distinguir como minimo:

- admin/coordinador;
- participante.

La app actual usa WorkOS y guarda `workosUserId` en tablas como `rondaParticipantes` y `directorioParticipantes`.

### 18.2 Admin/coordinador

Puede:

- ver todo el panel SGC;
- editar plan de ronda;
- finalizar plan;
- cargar/reemplazar evidencias;
- finalizar F-PSEA-13;
- cambiar estado a `documentacion_pendiente` y `cerrada`;
- reabrir a `documentacion_pendiente`;
- ver snapshots y bitacora;
- generar vistas imprimibles.

### 18.3 Participante

Fase 1:

- no edita SGC;
- ve solo lectura de su ronda cuando aplique;
- no ve evidencias internas sensibles salvo que se marquen publicables;
- no ve bitacora, snapshots internos ni documentos no publicados.

Fase 2:

- ve cronograma publicable;
- ve comunicaciones publicadas;
- comenta por ronda;
- consulta respuestas propias.

## 19. Autenticacion y permisos Convex

Este es un bloqueador tecnico, no un detalle.

### 19.1 Estado actual

El repo usa:

```tsx
ConvexProvider
```

en `app/providers.tsx`, no `ConvexProviderWithAuth`.

La guia local de Convex dice:

- crear `convex/auth.config.ts` cuando se use autenticacion;
- usar `ctx.auth.getUserIdentity()`;
- preferir `identity.tokenIdentifier`;
- nunca aceptar `userId` como argumento para autorizacion;
- no usar funciones publicas para operaciones internas sensibles.

### 19.2 Decision para SGC

Antes de exponer evidencias o mutaciones SGC desde cliente, debe resolverse el contrato de identidad.

Opciones:

1. Migrar Convex a JWT autenticado:
   - `convex/auth.config.ts`;
   - `ConvexProviderWithAuth`;
   - funciones Convex derivan identidad con `ctx.auth.getUserIdentity()`.

2. Mantener SGC detras de server actions:
   - WorkOS se valida en Next server;
   - operaciones sensibles no quedan invocables libremente desde cliente;
   - aun asi debe cuidarse que las funciones Convex publicas no permitan bypass directo.

Recomendacion:

Para un modulo SGC con evidencias internas, la opcion mas limpia a mediano plazo es integrar auth Convex real. Si se posterga, las funciones SGC sensibles deben ser muy restringidas y revisadas antes de deploy.

### 19.3 Regla obligatoria

Ninguna mutation/query/action SGC debe aceptar `userId`, `workosUserId` o email como argumento para autorizar una accion.

La identidad se deriva server-side.

## 20. Modelo de datos Fase 1

### 20.1 Tablas nuevas recomendadas

```txt
sgcPlanRonda
sgcRevisionDatos
sgcHitosRonda
sgcEvidenciaSeries
sgcEvidenciaVersiones
sgcRegistroSnapshots
sgcAuditLog
```

Cambio a tabla existente:

```txt
rondas.estado += "documentacion_pendiente"
```

### 20.2 `sgcPlanRonda`

Proposito:

Plan de ronda nativo.

Campos:

- `rondaId`;
- `estado`: `borrador | finalizado | requiere_revision`;
- `bloques`: record con claves estables `a` a `u`;
- `camposEstructurados`: objeto con subcampos criticos;
- `finalizadoAt`;
- `finalizadoBy`;
- `createdAt`;
- `createdBy`;
- `updatedAt`;
- `updatedBy`.

Indices:

- `by_rondaId`.

### 20.3 `sgcRevisionDatos`

Proposito:

F-PSEA-13 nativo.

Campos:

- `rondaId`;
- `estado`: `borrador | finalizado | requiere_revision`;
- `checks`: record con claves de checklist;
- `metricasSnapshot`;
- `observacionGeneral`;
- `finalizadoAt`;
- `finalizadoBy`;
- `createdAt`;
- `createdBy`;
- `updatedAt`;
- `updatedBy`.

Indices:

- `by_rondaId`.

### 20.4 `sgcHitosRonda`

Proposito:

Cronograma operativo por ronda.

Campos:

- `rondaId`;
- `codigo`;
- `nombre`;
- `fase`;
- `fechaObjetivo`;
- `fechaReal`;
- `estado`;
- `responsable`;
- `visibleParticipante`;
- `bloqueaCierre`;
- `formatoRelacionado`;
- `notas`;
- `createdAt`;
- `updatedAt`.

Indices:

- `by_rondaId`;
- `by_rondaId_and_estado`;
- `by_rondaId_and_fechaObjetivo`.

### 20.5 `sgcEvidenciaSeries`

Ver seccion 12.

### 20.6 `sgcEvidenciaVersiones`

Ver seccion 12.

### 20.7 `sgcRegistroSnapshots`

Ver seccion 14.

### 20.8 `sgcAuditLog`

Ver seccion 15.

## 21. API Convex recomendada

Archivo sugerido:

```txt
convex/sgc.ts
```

Separar helpers si crece:

```txt
convex/sgc/catalog.ts
convex/sgc/evidencias.ts
convex/sgc/cierre.ts
```

La estructura exacta depende de las convenciones finales del repo, pero el API conceptual debe cubrir:

### 21.1 Queries

- `getPanelSgc(rondaId)`;
- `getPlanRonda(rondaId)`;
- `getRevisionDatos(rondaId)`;
- `listHitosRonda(rondaId)`;
- `listEvidenciaSeries(rondaId)`;
- `listEvidenciaVersiones(serieId, paginationOpts)`;
- `listAuditLog(rondaId, paginationOpts)`;
- `listSnapshots(rondaId, tipoRegistro, paginationOpts)`;
- `getDownloadUrl(evidenciaVersionId)`.

### 21.2 Mutations

- `createOrUpdatePlanRonda`;
- `finalizarPlanRonda`;
- `createOrUpdateRevisionDatos`;
- `finalizarRevisionDatos`;
- `createHitoRonda`;
- `updateHitoRonda`;
- `createEvidenciaSeries`;
- `registrarEvidenciaVersion`;
- `retirarEvidenciaVersion`;
- `transitionRondaToDocumentacionPendiente`;
- `transitionRondaToCerrada`;
- `reabrirRondaSgc`.

### 21.3 Actions

Usar actions solo cuando haga falta runtime Node o trabajo fuera de transaccion:

- generar PDF si requiere libreria Node;
- calcular hash de archivo si se procesa contenido;
- parsear CSV en fases posteriores;
- tareas programadas o batch.

## 22. Rutas y UI

### 22.1 Rutas Fase 1

Agregar:

```txt
app/(protected)/dashboard/rondas/[id]/sgc/page.tsx
```

Agregar tab:

```txt
SGC -> /dashboard/rondas/[id]/sgc
```

en:

```txt
app/(protected)/dashboard/rondas/[id]/RondaContextNav.tsx
```

### 22.2 Rutas Fase 1.5 / 2

```txt
app/(protected)/dashboard/sgc/page.tsx
```

Opcionales:

```txt
app/(protected)/dashboard/sgc/documentos/page.tsx
app/(protected)/dashboard/sgc/casos/page.tsx
```

solo cuando entren matriz/casos.

### 22.3 UI de pestaña SGC

La pantalla debe tener:

- encabezado de ronda con estado SGC;
- resumen de progreso;
- bloqueantes de cierre;
- acciones de transicion;
- checklist por fase;
- seccion Plan de Ronda;
- seccion Cronograma;
- seccion Evidencias;
- seccion F-PSEA-13;
- historial/snapshots colapsable;
- bitacora minima;
- enlaces a plantillas P-20.

### 22.4 Columnas del checklist

- formato;
- nombre;
- fase;
- modo;
- estado;
- responsable;
- ultima actualizacion;
- evidencia/registro vinculado;
- accion principal;
- observaciones.

### 22.5 Estados visuales

Usar badges consistentes con el sistema actual:

- pendiente: amarillo;
- cubierto: verde;
- requiere revision: naranja/rojo suave;
- no aplica: gris;
- cerrado: slate.

## 23. Impacto en codigo existente

Agregar `documentacion_pendiente` exige revisar como minimo:

- `convex/schema.ts`;
- `convex/rondas.ts`;
- `convex/migrations.ts`;
- `lib/rondas.ts`;
- `lib/operativo.ts`;
- `app/(protected)/dashboard/actions.ts`;
- `app/(protected)/dashboard/page.tsx`;
- `app/(protected)/dashboard/components/EstadoBadge.tsx`;
- `app/(protected)/dashboard/rondas/[id]/actions.ts`;
- `app/(protected)/dashboard/rondas/[id]/page.tsx`;
- `app/(protected)/dashboard/rondas/[id]/participantes/actions.ts`;
- `app/(protected)/dashboard/rondas/[id]/configuracion-pt/actions.ts`;
- `app/(protected)/ronda/[codigo]/page.tsx`;
- `app/(protected)/ronda/[codigo]/actions.ts`;
- `app/(protected)/ronda/[codigo]/registro/page.tsx`;
- `app/(protected)/ronda/[codigo]/registro/FormularioRegistro.tsx`;
- `app/(protected)/ronda/[codigo]/FormularioRonda.tsx`;
- `app/(protected)/ronda/[codigo]/FormularioReferencia.tsx`;
- `app/(protected)/mi-dashboard/page.tsx`.

Regla:

Donde hoy se verifica `ronda.estado === "cerrada"` para solo lectura, probablemente debe cambiar a:

```ts
ronda.estado === "documentacion_pendiente" || ronda.estado === "cerrada"
```

Donde hoy se permite editar si `estado !== "cerrada"`, revisar caso por caso. Algunas acciones admin pueden permitirse en `documentacion_pendiente`; acciones participante no.

## 24. Migracion

### 24.1 Datos existentes

Rondas existentes:

- `borrador`: quedan igual;
- `activa`: quedan igual;
- `cerrada`: quedan cerradas, pero no tendran panel SGC completo hasta backfill o reapertura controlada.

### 24.2 Backfill SGC

Para cada ronda existente, crear panel SGC bajo demanda:

- si no existe `sgcPlanRonda`, inicializarlo cuando admin entra al tab;
- si no existen hitos, crear plantilla por defecto;
- si no existe F-PSEA-13, inicializar borrador;
- checklist calcula cobertura desde datos existentes.

### 24.3 Rondas cerradas historicas

No forzar reconstruccion completa. Permitir:

- vista de solo lectura;
- carga excepcional de evidencia historica si admin reabre a `documentacion_pendiente`;
- marca "cerrada antes de modulo SGC" si aplica.

## 25. Criterios de aceptacion Fase 1

La Fase 1 esta completa cuando:

1. Existe pestaña SGC en cada ronda.
2. El checklist lista todos los formatos de Fase 1.
3. El checklist calcula cobertura nativa de F-PSEA-05, F-PSEA-05A, F-PSEA-07 y F-PSEA-12.
4. Se puede crear, editar y finalizar plan de ronda.
5. Finalizar plan crea snapshot.
6. Editar plan finalizado exige motivo y crea historial.
7. Se pueden cargar evidencias por formato.
8. Cargar nueva evidencia reemplaza la vigente sin borrar historial.
9. Se puede crear y mantener cronograma simple.
10. Se puede diligenciar y finalizar F-PSEA-13.
11. F-PSEA-13 con checks pendientes exige observacion.
12. F-PSEA-11 aparece como `no_aplica` con razon.
13. Una ronda puede pasar `activa -> documentacion_pendiente`.
14. En `documentacion_pendiente`, participantes quedan en solo lectura.
15. Una ronda solo puede pasar a `cerrada` si no hay pendientes criticos.
16. Una ronda cerrada puede reabrirse solo a `documentacion_pendiente` con motivo.
17. PDFs/vistas imprimibles de plan y F-PSEA-13 muestran responsable, fechas, estado y leyenda de codigo provisional si aplica.
18. Admin puede ver bitacora minima.
19. Participante no puede acceder a evidencia interna no publicada.
20. Las queries de listas con historial usan paginacion cuando puedan crecer.

## 26. Estrategia de pruebas

Ninguna evaluacion desarrollo suficiente la estrategia de testing. Debe agregarse.

### 26.1 Unit tests

Probar:

- calculo de cobertura del checklist;
- reglas nativo vs archivo;
- derivacion de bloqueantes;
- validacion de F-PSEA-13;
- transiciones de estado;
- generacion de payload imprimible.

### 26.2 Tests de Convex

Probar:

- indices y queries por ronda;
- creacion de panel SGC inicial;
- versionamiento de evidencias;
- una sola version vigente;
- snapshots;
- bitacora;
- permisos.

### 26.3 Tests de integracion UI

Probar:

- tab SGC visible;
- checklist renderiza estados;
- carga de evidencia;
- acciones de transicion;
- participantes bloqueados en `documentacion_pendiente`;
- reapertura con motivo.

### 26.4 Casos negativos

Probar que falla:

- cerrar sin F-PSEA-13;
- cerrar sin evidencias criticas;
- finalizar F-PSEA-13 con pendiente sin observacion;
- participante intenta enviar en `documentacion_pendiente`;
- usuario no autorizado intenta descargar evidencia.

## 27. Riesgos y mitigaciones

### 27.1 Scope creep

Riesgo:

Meter matriz, casos, comentarios y notificaciones antes de cerrar la ronda.

Mitigacion:

Congelar Fase 1 como cierre documental por ronda.

### 27.2 Auth Convex insuficiente

Riesgo:

Evidencias internas accesibles por funciones publicas sin identidad server-side.

Mitigacion:

Resolver auth antes de exponer SGC sensible. No aceptar `userId` como argumento.

### 27.3 Estado de ronda subestimado

Riesgo:

Agregar `documentacion_pendiente` rompe formularios, badges, dashboards o acciones.

Mitigacion:

Tratarlo como migracion transversal. Revisar todas las comparaciones `activa`/`cerrada`.

### 27.4 Codigos documentales provisionales

Riesgo:

Emitir documentos "oficiales" con codigos no confirmados.

Mitigacion:

Leyenda visible y bloqueo de modo oficial hasta validar lista maestra.

### 27.5 F-PSEA-13 demasiado permisivo

Riesgo:

Checklist finalizado con pendientes sin trazabilidad.

Mitigacion:

Observacion obligatoria por pendiente.

### 27.6 Matriz documental postergada demasiado

Riesgo:

El catalogo en codigo se vuelve rigido.

Mitigacion:

Disenar catalogo con campos compatibles con `documentosSgc`; implementar matriz en Fase 3.

### 27.7 Confundir evidencia con documento controlado

Riesgo:

Una tabla termina mezclando archivos de ronda, versiones oficiales, plantillas y documentos globales.

Mitigacion:

Separar evidencias por ronda de matriz documental global.

## 28. Orden tecnico recomendado

### Paso 0 - Verificacion tecnica

- Leer `convex/_generated/ai/guidelines.md`.
- Leer guia relevante de Next en `node_modules/next/dist/docs/` antes de editar rutas/API.
- Confirmar estrategia de auth Convex/WorkOS.

### Paso 1 - Catalogo

- Crear `lib/sgc/catalog.ts`.
- Definir formatos, fases, criticidad y criterios.
- Marcar codigos provisionales.

### Paso 2 - Estado de ronda

- Agregar `documentacion_pendiente` en schema y tipos.
- Actualizar transiciones en `convex/rondas.ts`.
- Actualizar badges, dashboards y formularios.
- Bloquear participante en `documentacion_pendiente`.

### Paso 3 - Schema SGC

- Crear tablas Fase 1.
- Definir indices.
- Evitar arrays no acotados.

### Paso 4 - Funciones Convex base

- Query `getPanelSgc`.
- Inicializacion bajo demanda.
- Mutations de plan, F-13, hitos y evidencia.
- Audit log.

### Paso 5 - Storage

- Upload URL.
- Registrar version.
- Reemplazo de vigente.
- Download URL con permisos.

### Paso 6 - UI tab SGC

- Agregar tab en `RondaContextNav`.
- Crear pagina SGC.
- Renderizar resumen, bloqueantes y checklist.

### Paso 7 - Plan de ronda

- Editor por bloques.
- Finalizacion.
- Snapshot.
- Vista imprimible.

### Paso 8 - Cronograma

- Hitos por ronda.
- Estados.
- Advertencias.

### Paso 9 - F-PSEA-13

- Checklist manual.
- Metricas de apoyo.
- Finalizacion con observaciones obligatorias.
- Snapshot.

### Paso 10 - Cierre documental

- `activa -> documentacion_pendiente`.
- `documentacion_pendiente -> cerrada`.
- `cerrada -> documentacion_pendiente`.
- Validaciones y bloqueantes.

### Paso 11 - Plantillas P-20

- Crear Markdown.
- Enlazar desde SGC.

### Paso 12 - Verificacion

- Tests unitarios.
- Tests de flujo.
- Revision de permisos.
- Prueba manual de una ronda completa.

## 29. Roadmap final

### Fase 1

Panel SGC por ronda, cierre documental, evidencias, plan, F-13, cronograma, snapshots y PDF.

### Fase 1.5

Dashboard SGC global liviano y registro manual opcional de comunicaciones.

### Fase 2

F-PSEA-08 nativo, comentarios, comunicaciones, notificaciones, casos SGC y `pt_app` con metadata/aprobacion.

### Fase 3

Matriz documental, importacion CSV, vista por procesos, control documental, auditoria formal e integraciones.

## 30. Decision final

Implementar primero:

```txt
plan_oc.md
+ evidencia serie/version de plan_codex.md
+ visibilidad/cronograma/cierre critico de plan_codex.md
+ regla nativo-vs-archivo y arquitectura futura de plan_pi.md
```

No implementar primero:

```txt
matriz documental completa
comentarios
notificaciones
casos SGC
F-PSEA-08 nativo
integracion estructurada pt_app
```

La razon tecnica es directa: el repo actual todavia esta organizado alrededor de rondas, participantes, fichas y resultados. La ampliacion natural es cerrar documentalmente una ronda. Saltar directo a un SGC global multiplicaria tablas, rutas, permisos y estados antes de validar el caso de uso principal.

El primer hito exitoso debe ser una ronda que pueda pasar, con evidencia y trazabilidad, de:

```txt
activa -> documentacion_pendiente -> cerrada
```

sin perder historial, sin abrir edicion a participantes, y sin presentar como oficiales documentos cuyos codigos aun no hayan sido confirmados.
