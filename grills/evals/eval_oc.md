# Evaluacion de planes SGC CALAIRE-APP

## Evaluacion general

Los 4 planes apuntan a la misma necesidad: incorporar un modulo SGC en CALAIRE-APP para controlar registros, evidencias y cierre documental asociados a rondas. Sin embargo, difieren mucho en alcance, madurez, riesgo y claridad de implementacion.

La conclusion principal es:

`plan_oc.md` es el mejor candidato como base de implementacion de Fase 1.

`plan_pi.md` es el mas completo como vision futura, pero demasiado amplio para una primera fase.

`plan_codex.md` tiene buena arquitectura conceptual y cubre comunicacion/visibilidad, pero sobrecarga el MVP.

`plan_agy.md` es util como resumen ejecutivo, pero insuficiente para guiar implementacion real.

## Comparacion rapida

| Plan | Fortaleza principal | Debilidad principal | Mejor uso |
|---|---|---|---|
| `plan_agy.md` | Simple, directo, orientado a ejecucion | Muy incompleto, ambiguo, poca trazabilidad | Resumen inicial o checklist macro |
| `plan_oc.md` | Mejor equilibrio entre alcance, implementacion y trazabilidad | Algunas decisiones laxas para auditoria | Base recomendada para Fase 1 |
| `plan_pi.md` | Vision mas completa del SGC operativo | Alcance excesivo, riesgo de sobrediseno | Roadmap futuro / arquitectura objetivo |
| `plan_codex.md` | Buena vision funcional por roles y flujos | MVP demasiado cargado | Complemento para comunicacion, roles y cronograma |

## 1. Evaluacion de `plan_agy.md`

### Fortalezas

Es claro y breve. Define el objetivo general de implementar gestion SGC en CALAIRE-APP, incluyendo Panel SGC, documentos por ronda en Convex Storage y formatos clave como F-PSEA-06, F-PSEA-08 y F-PSEA-13.

Tiene una division basica backend/frontend:

- Modificar `convex/schema.ts`.
- Crear `convex/sgc.ts`.
- Agregar navegacion SGC.
- Crear pagina principal del Panel SGC.
- Modificar detalle de ronda con pestanas.

Tambien sirve como punto de partida porque esta muy enfocado en ejecucion inmediata.

### Debilidades

Es demasiado superficial para implementar sin tomar muchas decisiones adicionales.

Problemas principales:

- No define modelo de datos concreto.
- No define estados de documentos/evidencias.
- No define reglas de cierre documental.
- No aclara si el panel es global o por ronda.
- No distingue registros nativos, archivos, evidencias, plantillas o integraciones.
- No define versionamiento.
- No define permisos.
- No define relacion con participantes.
- No define si F-PSEA-08 es nativo o archivo.
- No define como se valida F-PSEA-13.
- No define transicion de estado de ronda.
- No contempla PDF, snapshots ni bitacora.
- No aborda que queda fuera del alcance.

### Riesgo

El riesgo de este plan es que parece implementable, pero en realidad deja demasiadas decisiones abiertas. Si se usa solo, probablemente produzca una solucion inconsistente o incompleta.

### Valor final

Buen documento de intencion. Malo como plan tecnico completo.

## 2. Evaluacion de `plan_oc.md`

### Fortalezas

Es el plan mas equilibrado y accionable.

Define una Fase 1 realista: un Panel SGC por ronda, no un gestor documental general. Esta decision es muy importante porque evita que el proyecto se convierta en un SGC completo antes de resolver el flujo operativo principal.

Sus mejores decisiones:

- El eje es la ronda.
- El catalogo SGC vive en codigo.
- Los registros existentes se calculan automaticamente.
- Los formatos no nativos se cubren con evidencias por archivo.
- Las evidencias usan Convex Storage.
- Hay historial sin borrado.
- Se agrega `documentacion_pendiente` al estado de ronda.
- Se separa cierre de recepcion de cierre documental.
- Se definen requisitos para pasar a `documentacion_pendiente` y luego a `cerrada`.
- Se define F-13 como checklist manual.
- Se definen vistas imprimibles para F-06/F-13.
- Se contemplan snapshots para registros editables finalizados.
- Se explicitan riesgos y tradeoffs.

Es el unico plan que resuelve con claridad una pregunta clave:

> Que significa realmente que una ronda este cerrada?

La respuesta del plan es correcta: `cerrada` debe significar cierre documental/operativo final, no solo cierre de recepcion de resultados.

### Debilidades

Tiene algunas decisiones practicas pero auditables con cuidado:

- Permitir finalizar F-13 con items sin marcar y sin observacion obligatoria puede ser debil para calidad.
- Permitir editar F-06/F-13 finalizados directamente, aunque haya snapshots, puede generar dudas en auditoria.
- Permitir PDF final sin marca de borrador aunque los codigos sean provisionales es riesgoso.
- No incluye comunicaciones reales ni comentarios en fase 1.
- No incluye F-PSEA-08 nativo, solo evidencia de archivo.
- No define con detalle permisos por rol.
- No define validaciones de tipo/tamano de archivo con suficiente precision tecnica.
- No define indices Convex concretos.
- No define rutas exactas para edicion de F-06/F-13.
- No define manejo de archivos huerfanos si falla el registro despues de subir a Storage.

### Riesgo

El riesgo es moderado y controlable. El plan es implementable, pero conviene endurecer algunas reglas para trazabilidad.

### Mejoras recomendadas para este plan

Deberia ajustarse asi:

- F-13 puede finalizarse con checks pendientes solo si hay observacion obligatoria.
- F-06/F-13 finalizados deberian requerir accion explicita tipo "guardar nueva revision" o al menos registrar motivo de cambio.
- PDF final deberia incluir estado documental o version de plantilla/catalogo.
- Definir permisos explicitos: admin/coordinador/participante.
- Definir limites tecnicos de archivo.
- Definir indices Convex.
- Definir generacion y limpieza de upload URLs.
- Definir si `documentacion_pendiente` afecta todas las mutaciones de participantes.

### Valor final

Es el mejor plan base para implementacion. Tiene alcance suficientemente limitado y a la vez cubre trazabilidad minima.

## 3. Evaluacion de `plan_pi.md`

### Fortalezas

Es el plan mas completo y estrategico.

No se limita al cierre por ronda. Plantea un verdadero panel operativo SGC con:

- Dashboard SGC.
- Matriz documental.
- Vista por procesos.
- Cronograma/hitos.
- Plan de ronda.
- Comentarios/comunicaciones.
- Casos SGC.
- Preparacion de item.
- Revision de datos.
- Evidencias de `pt_app`.
- Control documental.
- Importacion CSV.
- Permisos.
- Visibilidad de participantes.
- Roadmap incremental.

Su mayor fortaleza es que separa bien los tipos de gestion:

```ts
modoGestion:
- "nativo"
- "archivo"
- "generado"
- "integracion"
```

Tambien separa estados documentales de estados de implementacion:

```ts
estadoGestion:
- "borrador"
- "vigente"
- "obsoleto"

estadoImplementacion:
- "implementado"
- "parcial"
- "pendiente"
- "no_aplica_app"
```

Eso es conceptualmente muy solido.

Otra fortaleza importante es la matriz documental. Si CALAIRE-APP va a crecer como brazo operativo del SGC, una matriz documental sera necesaria tarde o temprano.

Tambien define correctamente que la app no reemplaza todo el SGC, sino que actua como brazo operativo y repositorio controlado de documentos/registros que requieren trazabilidad.

### Debilidades

El problema principal es el alcance.

Para una Fase 1, este plan es demasiado grande. Incluye:

- Matriz documental.
- Importacion CSV.
- Control documental global.
- Dashboard SGC.
- Procesos.
- Cronograma.
- Plan de ronda.
- Comentarios.
- Casos SGC.
- Preparacion item.
- Revision datos.
- Evidencias pt_app.
- Visibilidad participante.
- Documentos globales y por ronda.

Aunque propone incrementos, su "Incremento 1" sigue siendo pesado:

- Matriz documental.
- Importacion CSV.
- Detalle documental.
- Subida de archivo.
- Versionamiento.
- Dashboard.
- Cronograma.
- Plan de ronda.

Esto puede retrasar el valor principal: cerrar documentalmente una ronda.

Otra debilidad: F-PSEA-13 queda fuera del Incremento 1, aunque para cierre documental de ronda es critico. Esto contrasta con `plan_oc.md`, que si lo incluye en Fase 1.

Tambien F-PSEA-08 entra en Incremento 2, aunque el objetivo original mencionado en los planes incluye F-PSEA-08.

### Riesgo

El riesgo es alto si se intenta implementar como primera fase. Puede convertirse en un sistema documental general antes de resolver el flujo operativo basico.

Riesgos especificos:

- Sobrediseno.
- Muchas tablas iniciales.
- Mucha UI administrativa.
- Mucha logica de permisos.
- Importacion CSV como distraccion temprana.
- Posible retraso del cierre por ronda.
- Mayor superficie de errores en Convex.
- Mas dificil de validar con usuarios.

### Valor final

Excelente como vision de producto y arquitectura futura. No deberia ser la base directa de Fase 1.

## 4. Evaluacion de `plan_codex.md`

### Fortalezas

Tiene buena arquitectura funcional. Explica bien el ecosistema del panel:

- Checklist.
- Cronograma.
- Evidencias.
- Comunicaciones.
- Notificaciones.
- Comentarios.
- Resultados `pt_app`.

Tambien tiene una buena vision por roles:

- Admin ve el panel completo.
- Participante ve solo cronograma visible, notificaciones propias, comentarios propios y publicaciones compartidas.

Este plan resuelve mejor que los demas la relacion entre SGC y experiencia del participante.

Tambien aporta una idea util: los hitos durante operacion advierten, pero no bloquean; el cierre documental si puede bloquear si faltan registros criticos. Esa distincion es buena.

Otra fortaleza es el tratamiento de comentarios:

- El participante comenta.
- El admin responde.
- El admin puede convertir o relacionar el comentario con queja, apelacion o NC/CAPA.

Esto es funcionalmente maduro.

### Debilidades

Su MVP 1 esta demasiado cargado.

Incluye en MVP 1:

- Pestana SGC.
- Selector de ronda.
- Checklist.
- Cronograma.
- Evidencias versionadas.
- Comunicaciones.
- Notificaciones.
- Comentarios.
- Visibilidad participante.
- Advertencias.
- Bloqueo de cierre.

Eso es mucho para una primera entrega.

Ademas, no baja tanto a modelo de datos detallado como `plan_pi.md`, ni define transiciones de estado de ronda tan concretamente como `plan_oc.md`.

Tambien tiene una diferencia importante con `plan_oc.md`: propone mas estados de ronda operativos (`EnOperacion`, `RecepcionDatos`, `Analisis`, `ResultadosPublicados`, `CierreDocumental`). Eso puede ser conceptualmente bueno, pero probablemente requiere redisenar mas partes de la app. Para Fase 1, `documentacion_pendiente` es una solucion mas minima.

### Riesgo

Riesgo medio-alto por alcance. Menor que `plan_pi.md` en profundidad documental, pero mayor que `plan_oc.md` por incluir comunicaciones, notificaciones y comentarios desde MVP 1.

### Valor final

Muy buen complemento funcional. No es el mejor plan base para implementacion inmediata, pero varias ideas deberian incorporarse al diseno final.

## Conclusion principal

La mejor estrategia es combinar los planes asi:

Usar `plan_oc.md` como base de Fase 1.

Tomar de `plan_pi.md` la vision futura de matriz documental, estados separados y roadmap.

Tomar de `plan_codex.md` la claridad de roles, cronograma, comentarios, comunicaciones y relacion con participantes.

Usar `plan_agy.md` solo como resumen macro o punto de partida historico.

## Plan final recomendado

La vision final deberia quedar asi:

CALAIRE-APP debe implementar primero un Panel SGC por ronda para cierre documental operativo, no un gestor documental completo.

La Fase 1 debe permitir cerrar correctamente una ronda desde el punto de vista SGC:

- Plan de ronda nativo.
- Cronograma/hitos simples.
- Checklist SGC por ronda.
- Evidencias versionadas en Convex Storage.
- F-13 revision de datos nativa.
- Evidencias para F-08/F-09/F-10/F-14.
- Estado `documentacion_pendiente`.
- Bloqueo de cierre si faltan registros criticos.
- Vista imprimible/PDF de registros principales.
- Bitacora minima.
- Sin borrar evidencias.

No deberia incluir todavia:

- Matriz documental global.
- Importacion CSV.
- NC/CAPA.
- Quejas/apelaciones.
- Comentarios participantes.
- Notificaciones.
- Emails.
- Integracion estructurada con `pt_app`.
- Dashboard SGC global complejo.
- Gestor documental general.

## Fase 1 recomendada

### Objetivo

Implementar cierre documental SGC por ronda.

### Componentes minimos

| Componente | Decision recomendada |
|---|---|
| Ubicacion | Pestana `SGC` dentro del detalle de ronda |
| Estado nuevo | `documentacion_pendiente` |
| Plan de ronda | Nativo |
| Cronograma | Hitos simples por ronda |
| F-13 | Checklist nativo manual |
| F-08 | Evidencia por archivo en Fase 1 |
| F-09/F-10/F-14 | Evidencia por archivo desde `pt_app` |
| F-11 | `no_aplica` si el ensayo es in situ |
| Evidencias | Convex Storage con versionamiento |
| Borrado | No borrar en Fase 1 |
| PDF | Vista imprimible de Plan/F-13 |
| Auditoria | Bitacora minima |
| Catalogo | En codigo |
| Participantes | Solo bloqueo de edicion al pasar a `documentacion_pendiente` |

## Modelo conceptual consolidado

Tablas recomendadas para Fase 1:

```ts
sgcPlanRonda
sgcRevisionDatos
sgcEvidencias
sgcRegistroSnapshots
sgcAuditLog
sgcHitosRonda
```

Tambien se debe modificar:

```ts
rondas.estado
```

para incluir:

```ts
"documentacion_pendiente"
```

Y bloquear envios/edicion participante cuando la ronda este en:

```ts
"documentacion_pendiente" | "cerrada"
```

## Estados recomendados

Flujo minimo recomendado:

```txt
borrador -> activa -> documentacion_pendiente -> cerrada
```

Significado:

| Estado | Significado |
|---|---|
| `borrador` | Configuracion inicial |
| `activa` | Participantes pueden operar/enviar |
| `documentacion_pendiente` | Recepcion cerrada, admin completa SGC |
| `cerrada` | Cierre documental completo |

Esta solucion es mejor que redisenar todos los estados operativos ahora, porque es minima y compatible con la app existente.

## Checklist SGC Fase 1

Debe incluir:

| Formato | Modo | Comentario |
|---|---|---|
| F-PPSEA-03 / F-PSEA-06 | Nativo | Plan de ronda |
| F-PSEA-05 | Existente calculado | Confirmaciones |
| F-PSEA-05A | Existente calculado | Fichas enviadas |
| F-PSEA-07 | Existente calculado | Participantes/codigos |
| F-PSEA-08 | Archivo | Preparacion de item |
| F-PSEA-09 | Archivo | Homogeneidad |
| F-PSEA-10 | Archivo | Estabilidad |
| F-PSEA-11 | No aplica | Si es in situ |
| F-PSEA-12 | Existente calculado | Reportes participantes |
| F-PSEA-13 | Nativo | Revision de datos |
| F-PSEA-14 | Archivo | Calculo estadistico |

## Decisiones que conviene corregir antes de implementar

### 1. No permitir F-13 incompleto sin observacion

Mejor regla:

```txt
F-13 puede finalizarse con checks pendientes solo si cada pendiente tiene observacion o justificacion.
```

### 2. No editar registros finalizados silenciosamente

Mejor regla:

```txt
Si F-06 o F-13 esta finalizado y se modifica, se crea snapshot y se exige motivo de cambio.
```

### 3. No generar PDF final sin identificar version/catalogo

Mejor regla:

```txt
El PDF debe incluir fecha de generacion, estado, responsable y version de plantilla/catalogo.
```

### 4. No llamar "cerrada" a una ronda si falta SGC

Mejor regla:

```txt
cerrada = cierre documental completo.
```

### 5. No implementar matriz documental global en Fase 1

Mejor regla:

```txt
La matriz documental entra en Fase 2 o Fase 3, cuando el cierre por ronda ya funcione.
```

## Roadmap recomendado

### Fase 1: Cierre SGC por ronda

- Pestana SGC en detalle de ronda.
- Checklist por fase.
- Plan de ronda nativo.
- Hitos simples.
- F-13 nativo.
- Evidencias versionadas.
- Estado `documentacion_pendiente`.
- PDF imprimible.
- Bitacora minima.

### Fase 2: Operacion SGC ampliada

- F-PSEA-08 nativo.
- Comentarios participantes.
- Comunicaciones manuales registradas.
- Publicaciones visibles al participante.
- Dashboard SGC global basico.
- Evidencias `pt_app` con aprobacion.

### Fase 3: Sistema documental y mejora

- Matriz documental.
- Importacion CSV.
- Control documental global.
- NC/CAPA.
- Quejas/apelaciones.
- Auditoria formal.
- Notificaciones.
- Integracion estructurada con `pt_app`.

## Veredicto final

El orden de calidad para implementacion inmediata es:

1. `plan_oc.md`
2. `plan_codex.md`
3. `plan_pi.md`
4. `plan_agy.md`

El orden de calidad para vision futura es:

1. `plan_pi.md`
2. `plan_codex.md`
3. `plan_oc.md`
4. `plan_agy.md`

La decision mas solida seria:

```txt
Implementar Fase 1 usando plan_oc.md como base,
incorporando elementos puntuales de plan_codex.md,
y dejando plan_pi.md como roadmap futuro.
```

`plan_oc.md` gana porque tiene el mejor balance entre valor, trazabilidad, bajo riesgo y factibilidad tecnica.
