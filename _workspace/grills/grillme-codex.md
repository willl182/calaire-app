# Grill-me Codex: Panel SGC en CALAIRE-APP

Fecha: 2026-06-07

Documento base: `calaire_app_sgc_interface.md`

## Objetivo de la sesion

Definir, mediante preguntas de diseno una por una, como implementar en CALAIRE-APP los formatos y registros necesarios para completar la documentacion del SGC, diferenciando que debe ser nativo en la app y que debe conservarse como archivo/evidencia.

## Pregunta 1

**Pregunta:** El panel SGC debe ser un panel de ejecucion operativa por ronda o un repositorio documental completo del SGC?

**Recomendacion:** Panel de ejecucion operativa por ronda, no repositorio documental total.

**Respuesta:** Si.

**Decision:** La app gestiona registros vivos y trazables. Manuales, procedimientos, instructivos, matrices e informes narrativos quedan como documentos controlados o evidencias adjuntas.

## Pregunta 2

**Pregunta:** El panel SGC debe organizarse alrededor de la ronda o alrededor del listado de formatos SGC?

**Recomendacion:** Alrededor de la ronda.

**Respuesta:** Por ronda.

**Decision:** El eje principal sera la ronda. Cada ronda tendra su panel documental.

## Pregunta 3

**Pregunta:** El panel por ronda debe funcionar como checklist de cierre documental con estados obligatorios, o solo como navegacion a modulos?

**Recomendacion:** Checklist de cierre documental con navegacion integrada.

**Respuesta:** Si. Falta incluir cronogramas.

**Decision:** El panel sera una checklist formal de cierre documental por ronda y debe incluir cronograma.

## Pregunta 4

**Pregunta:** El cronograma debe ser un modulo nativo de la ronda o un archivo cargado?

**Recomendacion:** Nativo para hitos operativos; archivo adjunto opcional para cronograma formal externo.

**Respuesta:** Acepta recomendacion. Para lo demas se pueden mirar diagramas Mermaid, pero debe existir una tabla con hitos minimos.

**Decision:** MVP con tabla nativa de hitos minimos. No calendario/Gantt inicial.

### Hitos minimos acordados

| Orden | Hito |
|---:|---|
| 1 | Apertura de invitaciones |
| 2 | Limite de confirmacion |
| 3 | Limite de ficha de registro |
| 4 | Preparacion de items |
| 5 | Envio/entrega de instrucciones o items |
| 6 | Inicio de mediciones |
| 7 | Cierre de recepcion de datos |
| 8 | Revision de datos |
| 9 | Analisis estadistico |
| 10 | Publicacion de resultados |
| 11 | Cierre documental de ronda |

## Pregunta 5

**Pregunta:** Los hitos deben bloquear el avance/cierre de la ronda, o solo advertir que falta algo?

**Recomendacion:** Advertir durante operacion; bloquear solo el cierre documental.

**Respuesta:** Advertir.

**Decision:** Los hitos advierten durante la operacion. El bloqueo aplica solo para cierre documental si faltan criticos.

## Pregunta 6

**Pregunta:** Que registros deben ser criticos para cerrar documentalmente una ronda?

**Recomendacion:** Criticos siempre: plan de ronda, cronograma minimo, lista maestra, confirmaciones/fichas aplicables, preparacion de items, envio/recepcion, reportes participantes, revision de datos, resultados estadisticos/importacion, evidencia de publicacion. Criticos condicionales: quejas, apelaciones, NC/CAPA, cambios de cronograma, evidencias externas requeridas.

**Respuesta:** Si.

**Decision:** Se acepta la clasificacion de criticos.

## Pregunta 7

**Pregunta:** Las comunicaciones deben ser un modulo propio o solo eventos registrados dentro de cada hito/formato?

**Recomendacion:** Modulo propio de comunicaciones, conectado a hitos y registros.

**Respuesta:** Registrar/preparar comunicaciones para envio manual. Algunos correos pueden evitarse dentro del aplicativo; toca diferenciar notificaciones.

**Decision:** MVP con comunicaciones preparadas/registradas manualmente, sin envio automatico inicial.

## Pregunta 8

**Pregunta:** La app debe enviar correos automaticamente o solo registrar/preparar comunicaciones para envio manual?

**Recomendacion:** MVP con envio manual/registrado + plantillas; automatizacion despues.

**Respuesta:** Registrar/preparar para envio manual.

**Decision:** No automatizar correos en MVP.

## Pregunta 9

**Pregunta:** Las notificaciones in-app deben ser visibles para cada participante en Mi dashboard, o basta con que queden registradas para admin?

**Recomendacion:** Visibles para el participante cuando afecten su accion o derechos; eventos internos solo admin.

**Respuesta:** Ambas, admin y participantes.

**Decision:** Habra notificaciones para admin y participantes, con visibilidad segun audiencia.

## Pregunta 10

**Pregunta:** Las evidencias deben tener versionamiento formal o basta con historial de archivos cargados?

**Recomendacion:** Historial con estado vigente/reemplazado.

**Respuesta:** Algo sencillo, pero si se va a llevar versionamiento.

**Decision:** Versionamiento sencillo: serie documental + versiones; una version vigente, anteriores reemplazadas.

## Pregunta 11

**Pregunta:** Que tan nativo debe ser el modulo de quejas, apelaciones y NC/CAPA?

**Recomendacion:** Casos/tickets SGC con tipos distintos.

**Respuesta:** Comentarios desde app; lo demas externo y se registra manualmente.

**Decision:** Participantes crean comentarios operativos. Quejas, apelaciones y NC/CAPA formales se registran manualmente por admin.

## Pregunta 12

**Pregunta:** Los comentarios deben estar asociados a una ronda completa, a un participante en una ronda, o a pantallas/registros especificos?

**Recomendacion:** Minimo participante+ronda, opcional contexto especifico.

**Respuesta:** A ronda.

**Decision:** Comentarios asociados a ronda.

## Pregunta 13

**Pregunta:** Que debe importar la app desde `pt_app` para resultados?

**Recomendacion:** MVP adjunta archivo + registra metadatos/aprobacion; fase posterior importa datos estructurados.

**Respuesta:** Recomendacion.

**Decision:** CALAIRE-APP no reemplaza `pt_app` en MVP. Registra archivo exportado, metadatos y aprobacion.

## Pregunta 14

**Pregunta:** Que debe ser el MVP 1 del panel SGC?

**Recomendacion:** Checklist, cronograma, evidencias, comunicaciones/notificaciones, comentarios y estados criticos de cierre. Dejar formularios nativos completos e importacion estructurada para MVP 2.

**Respuesta:** Si.

**Decision:** MVP 1 queda limitado al cierre documental basico por ronda.

## Pregunta 15

**Pregunta:** El panel SGC debe vivir como pestaña nueva dentro del dashboard actual o reemplazar/absorber `Registros`?

**Recomendacion inicial:** Absorber/renombrar `Registros` como `SGC`.

**Respuesta:** Pestaña nueva SGC. Registros es aparte.

**Decision:** Crear pestaña nueva `SGC`. No tocar el significado de `Registros`.

## Pregunta 16

**Pregunta:** El panel SGC debe ser visible solo para admin o tambien para participantes en version limitada?

**Recomendacion:** Admin ve panel completo; participante ve solo piezas especificas en `Mi dashboard`.

**Respuesta:** Pestaña aparte. Admin todo. Participante solo piezas que le corresponden.

**Decision:** Admin ve todo el panel SGC. Participantes no ven el panel completo; ven cronograma visible, notificaciones propias, comentarios propios y publicaciones/evidencias compartidas.

## Pregunta 17

**Pregunta:** El cronograma visible al participante debe mostrar todos los hitos o solo los hitos que afectan acciones del participante?

**Recomendacion:** Solo hitos que afectan al participante.

**Respuesta:** Solo los que le tocan.

**Decision:** Cronograma participante parcial.

### Hitos visibles al participante

| Hito | Visible participante |
|---|---:|
| Apertura de invitaciones | No |
| Limite de confirmacion | Si |
| Limite de ficha de registro | Si |
| Preparacion de items | No |
| Envio/entrega de instrucciones o items | Si, si aplica |
| Inicio de mediciones | Si |
| Cierre de recepcion de datos | Si |
| Revision de datos | No |
| Analisis estadistico | No |
| Publicacion de resultados | Si |
| Cierre documental de ronda | No |

## Pregunta 18

**Pregunta:** Dejar documentado en `calaire_app_sgc_interface.md` o crear un plan separado?

**Recomendacion:** Crear plan separado `docs/sgc_panel_mvp_plan.md` y actualizar documento conceptual solo con resumen.

**Respuesta:** Nuevo documento. No actualizar. Dejar en directorio principal como `plan_codex.md`.

**Decision:** Se creo `plan_codex.md` en la raiz. No se modifico `calaire_app_sgc_interface.md`.

## Resultado producido

Archivo creado:

- `plan_codex.md`

Contenido del plan:

- Decisiones acordadas.
- Diagramas Mermaid.
- Tabla de hitos minimos.
- Reglas de visibilidad admin/participante.
- Versionamiento sencillo de evidencias.
- Comunicaciones y notificaciones.
- Comentarios de ronda.
- Integracion MVP con `pt_app`.
- Alcance MVP 1 y MVP 2.
- Tablas Convex tentativas.
- Orden tecnico recomendado.

## Resumen final de decisiones

| Tema | Decision |
|---|---|
| Panel | SGC por ronda |
| Dashboard | Pestaña nueva `SGC` |
| Registros | Se mantiene aparte |
| Admin | Ve todo |
| Participante | Ve solo lo que le corresponde |
| Cronograma | Tabla nativa de hitos minimos |
| Calendario/Gantt | No en MVP |
| Hitos | Advierten durante operacion |
| Cierre documental | Puede bloquear por criticos faltantes |
| Comunicaciones | Manuales/preparadas en MVP |
| Notificaciones | Admin y participantes segun audiencia |
| Evidencias | Versionamiento sencillo |
| Comentarios | Por ronda |
| Quejas/apelaciones/NC | Registro manual admin si son formales |
| `pt_app` | Archivo + metadatos/aprobacion en MVP |
| MVP 1 | Checklist, cronograma, evidencias, comunicaciones/notificaciones, comentarios |
| MVP 2 | Formularios nativos SGC, casos formales, importacion estructurada |

