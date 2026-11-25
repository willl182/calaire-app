# Instrucciones - P-PSEA-05 Comunicaciones del PEA

**Codigo:** `P-PSEA-05`  
**Tipo:** Procedimiento transversal  
**Estado:** pendiente de creacion como maestro documental  
**Ubicacion esperada:** `01_bloque_general/02_procedimientos/P-PSEA-05 Comunicaciones del PEA.docx`

---

## Proposito

Definir como se emiten, reciben, registran, conservan y trazan las comunicaciones internas y externas del Proveedor de Ensayos de Aptitud (PEA) durante la planificacion, ejecucion, evaluacion y cierre de las rondas.

El procedimiento debe asegurar que toda comunicacion critica del ensayo quede asociada a una ronda, a un responsable, a una evidencia verificable y, cuando aplique, a un caso o registro del SGC.

---

## Alcance

Aplica a las comunicaciones relacionadas con:

- invitacion y confirmacion de participantes;
- instrucciones tecnicas y operativas de ronda;
- cambios de cronograma o condiciones de participacion;
- solicitud, recepcion y aclaracion de datos;
- envio o publicacion de resultados;
- comunicaciones internas de coordinacion tecnica;
- consultas, quejas, no conformidades y apelaciones;
- comunicaciones con proveedores criticos cuando afecten el ensayo.

No reemplaza los procedimientos de quejas, apelaciones, trabajo no conforme, confidencialidad ni emision de informe; los activa o referencia cuando la comunicacion derive en esos procesos.

---

## Canales autorizados

| Canal | Uso permitido | Control minimo |
|---|---|---|
| Correo institucional | Comunicaciones formales con participantes, proveedores y partes interesadas | conservar asunto, fecha, remitente, destinatario, adjuntos y respuesta si aplica |
| `calaire-app` | Comunicaciones, notificaciones o registros asociados a gestion de ronda y participantes | conservar trazabilidad digital, usuario, fecha, ronda y estado |
| Reunion documentada | Aclaraciones tecnicas, decisiones de coordinacion o seguimiento | conservar acta, asistentes, fecha, acuerdos y responsables |
| Documento formal del PEA | Circulares, instrucciones, informes y comunicaciones controladas | conservar version, codigo, fecha de emision y responsable |

---

## Responsables

- **Coordinador EA:** autoriza comunicaciones criticas de ronda y valida mensajes a participantes.
- **Responsable tecnico:** prepara contenido tecnico sobre item, niveles, datos, metodos o resultados.
- **Responsable de calidad:** revisa comunicaciones asociadas a SGC, quejas, apelaciones, no conformidades y confidencialidad.
- **Administrador de `calaire-app`:** asegura disponibilidad y trazabilidad de comunicaciones gestionadas por el aplicativo.
- **Responsable de emision:** envia o registra la comunicacion y archiva la evidencia.

---

## Comunicaciones de ronda con participantes

> Contenido reubicado desde el antiguo archivo `P-PSEA-20` ("Comunicación PT", borrador del 2026-04-08), que ahora corresponde a Competencia y autorización operativa. Los códigos se actualizaron a la numeración vigente del catálogo. Los plazos y aprobadores marcados con ⚠️ siguen pendientes de validar.

### Solicitudes y acuerdos de participación

1. El coordinador EA recibe la solicitud o confirma la invitación directa al laboratorio. En la prueba piloto no hay convocatoria abierta: los participantes se invitan directamente.
2. Antes de confirmar la inclusión, verifica que el laboratorio cumpla los requisitos mínimos de participación:

   | Requisito | Evidencia |
   |---|---|
   | Dispone de analizadores para los analitos de la ronda | Declarado en `F-PSEA-03`; exportado en `F-PSEA-04` |
   | Cuenta con certificado de calibración vigente | Declarado en `F-PSEA-03`; exportado en `F-PSEA-04` |
   | Puede trasladar los equipos al sitio en las fechas indicadas | Declarado en `F-PSEA-03` |
   | Acepta las condiciones de confidencialidad | Confirmado en `F-PSEA-03` |

3. Si no cumple algún requisito, se le notifican las razones por escrito y, si aplica, se le ofrece participar en una ronda futura.
4. El código anónimo del participante lo asigna `calaire-app` y no se comparte con los demás participantes (ver `P-PSEA-19`).
5. El acuerdo de participación queda formalizado con la aceptación registrada en `F-PSEA-03`. Cubre las condiciones de participación (`DG-PSEA-01`), la confidencialidad y el anonimato de los resultados, la disponibilidad de los equipos en las fechas indicadas y la veracidad de los datos declarados.
6. En operación regular, se evalúa si hace falta un acuerdo contractual aparte, por ejemplo cuando el participante asume compromisos económicos o exige una confidencialidad específica. ⚠️ Por definir.

### Calendario de comunicaciones de la ronda

| Comunicación | Contenido | Plazo ⚠️ | Aprueba ⚠️ | Instrumento |
|---|---|---|---|---|
| Invitación | Descripción del esquema, analitos, fechas tentativas y condiciones generales | T-30 días | Directora del PEA | Correo institucional o carta formal |
| Instrucciones previas a la ronda | Instrucciones completas para el participante y solicitud de actualizar `F-PSEA-03` en `calaire-app` | T-14 días | Coordinador EA y responsable de calidad | `F-PSEA-18` con `I-PSEA-02` |
| Recordatorio | Verificación de `F-PSEA-03` y fecha límite | T-7 días | Coordinador EA | `F-PSEA-18` o correo breve |
| Confirmación logística | Punto de encuentro, horario y contacto del día | T-1 día | Coordinador EA | Correo breve |
| Comunicación de resultados | Informe individual de desempeño (confidencial) | ≤ 45 días después de la ronda | Directora del PEA | Informe formal publicado en el portal (`P-PSEA-09`) |

Para las instrucciones previas a la ronda:

1. El coordinador EA redacta la comunicación personalizada.
2. El responsable de calidad verifica que esté completa frente a `I-PSEA-02`.
3. La directora del PEA la aprueba si cambió respecto a la versión anterior.
4. El coordinador EA la envía por un canal autorizado y la registra en `F-PSEA-18`.

### Notificación de cambios y fe de erratas

| Tipo de cambio | Obligación | Plazo máximo ⚠️ |
|---|---|---|
| Fechas de la ronda | Comunicar a todos los participantes confirmados y emitir fe de erratas | ≤ 24 h desde la decisión |
| Analitos o niveles | Igual que el anterior, y evaluar si cada participante puede continuar | ≤ 24 h desde la decisión |
| Lugar o sala | Comunicar a todos y actualizar las instrucciones logísticas | ≤ 24 h desde la decisión |
| Corrección de un dato técnico de las instrucciones | Fe de erratas por correo y archivo en el SGC | ≤ 48 h desde que se detecta |
| Criterios de evaluación (σ_pt, indicador) | Reemitir la sección correspondiente de las instrucciones | Al menos en T-5 días |

Para emitir una fe de erratas:

1. El coordinador EA redacta el correo con el asunto `[CALAIRE-EA] Fe de erratas — [código de ronda] — [tema]`.
2. Indica qué decía la comunicación original y qué debe decir ahora.
3. La envía a todos los participantes afectados.
4. La registra como aclaración o cambio (`EVID-ACL`) en el expediente de la ronda.

### Quejas y apelaciones

Toda comunicación a participantes incluye el párrafo de referencia a quejas y apelaciones. Los plazos y la gestión se rigen por `P-PSEA-17` (quejas, registro `F-PSEA-14`) y `P-PSEA-18` (apelaciones, registro `F-PSEA-15`).

### Criterios de verificación de la ronda

| Criterio | Condición |
|---|---|
| Trazabilidad completa | Toda comunicación oficial queda archivada y registrada en `F-PSEA-18` o en el expediente de la ronda |
| Plazo de las instrucciones | Enviadas a más tardar en T-14 días |
| Acuerdos registrados | `F-PSEA-03` completo y aceptado por todos los participantes antes de T-7 días |
| Canal autorizado | Ninguna comunicación oficial se envía por un canal no autorizado |

---

## Reglas minimas de registro

Toda comunicacion critica debe registrar:

- fecha y hora;
- ronda o codigo del ensayo;
- emisor;
- destinatario;
- canal usado;
- asunto;
- resumen tecnico de la comunicacion;
- documentos o registros relacionados;
- accion requerida o decision derivada;
- responsable de seguimiento;
- estado: `emitida`, `recibida`, `respondida`, `cerrada`, `escalada`;
- evidencia: correo, acta, captura, registro de aplicativo o documento controlado.

---

## Trazabilidad documental

El procedimiento debe enlazar las comunicaciones con los siguientes documentos cuando aplique:

- `F-PSEA-03` Registro de participacion y carga de datos del participante;
- `F-PSEA-05` Ficha basica de ronda EA;
- `F-PSEA-06` Planificacion de ronda EA;
- `F-PSEA-08` Datos reportados por participante;
- `F-PSEA-09` Datos exportados para analisis PT;
- `F-PSEA-13` Informe final de resultados;
- `F-PSEA-14` Registro de caso de queja o no conformidad;
- `F-PSEA-15` Registro de apelaciones;
- `P-PSEA-16` Divulgacion y control de valores sensibles;
- `P-PSEA-19` Confidencialidad operativa interna del PEA.

---

## Control de confidencialidad

El procedimiento debe prohibir la divulgacion no autorizada de:

- identidad de participantes;
- codigos de laboratorio asociados a nombres reales;
- valores asignados antes de liberacion formal;
- valores sensibles de referencia o consenso;
- resultados individuales;
- informacion tecnica restringida de equipos o metodos;
- datos no validados o versiones preliminares de informes.

Cuando una comunicacion incluya informacion sensible, debe identificarse el destinatario autorizado, el motivo de envio y la evidencia de control.

---

## Publicacion en portal de participantes

Durante estados `activa`, `documentacion_pendiente` y `cerrada`, el portal puede mostrar instrucciones vigentes, calendario, cronograma y `F-PSEA-19` cuando coordinacion publique expresamente el PDF firmado. `F-PSEA-20` y `F-PSEA-21` nunca se publican. Reemplazar el PDF firmado de `F-PSEA-19` exige nueva revision y publicacion explicita.

## Salidas del procedimiento

Las salidas esperadas son:

- comunicacion emitida o recibida;
- evidencia archivada;
- acuse o confirmacion cuando aplique;
- decision o accion derivada;
- caso SGC abierto si corresponde;
- cierre documentado de la comunicacion.

---

## Criterio de cierre

Una comunicacion se considera cerrada cuando:

1. fue enviada o recibida por un canal autorizado;
2. la evidencia quedo archivada;
3. el destinatario fue confirmado cuando aplica;
4. la accion derivada fue cerrada o transferida al procedimiento correspondiente;
5. no quedan respuestas pendientes que afecten la ronda o el SGC.
