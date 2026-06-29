# DG-PSEA-02: Aplicativo calaire-app

## Objetivo

Documentar el alcance, funciones, entradas, salidas, controles y limites del aplicativo `calaire-app` como sistema digital del PEA para la gestion de rondas de ensayo de aptitud, participantes, cronogramas, captura de datos, exportaciones oficiales y registro operativo de casos SGC de quejas o no conformidades cuando aplique.

El aplicativo debe permitir demostrar que la informacion usada en la ronda se mantiene integra, trazable, confidencial y disponible para el flujo posterior de evaluacion de aptitud.

## Alcance

Aplica al aplicativo `calaire-app` durante las fases de planificacion, ejecucion de ronda, comunicacion operativa, recoleccion de datos, cierre de captura y exportacion de informacion oficial del ensayo de aptitud para gases contaminantes criterio.

Incluye:

- Gestion de rondas de ensayo de aptitud.
- Registro, confirmacion y administracion de participantes.
- Configuracion de calendarios, cronogramas, analitos, niveles y ventanas de reporte.
- Generacion o consolidacion de la ficha digital de ronda (`F-PSEA-06`).
- Captura de datos reportados por los participantes (`F-PSEA-08`).
- Registro de informacion tecnica de equipos e instrumentos (`F-PSEA-04`).
- Control de usuarios, roles, permisos y acceso a informacion de participantes.
- Trazabilidad de registros, modificaciones, cierres y exportaciones.
- Exportacion oficial de datos hacia `pt_app` (`F-PSEA-09`).
- Registro operativo de casos SGC de quejas o no conformidades cuando el flujo del aplicativo lo habilite.
- Evidencia de validacion funcional, control de cambios, respaldo, recuperacion y tratamiento de incidentes del aplicativo.

No incluye:

- Definicion de criterios estadisticos, valor asignado, `sigma_pt`, incertidumbre ni reglas de desempeno.
- Preprocesamiento, analisis estadistico, evaluacion de homogeneidad/estabilidad ni emision del informe final.
- Aprobacion metodologica del esquema o de la ronda.
- Sustitucion de los procedimientos de comunicacion, planificacion, confidencialidad, trabajo no conforme, quejas o control documental del PEA.

## Ficha del aplicativo

| Campo | Descripcion |
|---|---|
| Aplicativo | `calaire-app` |
| Uso previsto | Planificacion operativa, gestion de participantes, captura controlada de datos, generacion de ficha digital, exportacion oficial hacia `pt_app` y registro operativo de casos SGC cuando aplique. |
| Rol en el SGC | Aplicativo critico para control de informacion, confidencialidad, trazabilidad y transferencia de datos oficiales. |
| Requisitos relacionados | ISO/IEC 17043:2023: confidencialidad, comunicacion del esquema, instrucciones, manejo de resultados, control de datos y sistema de gestion. ISO 13528:2022: revision inicial de datos, trazabilidad de datos y control de herramientas que soportan el analisis. |
| Instructivos de uso | `I-PSEA-02`, `I-PSEA-03` |
| Procedimientos relacionados | `P-PSEA-03`, `P-PSEA-04`, `P-PSEA-05`, `P-PSEA-08`, `P-PSEA-14`, `P-PSEA-15`, `P-PSEA-17`, `P-PSEA-19` |

## Requisitos minimos del aplicativo

| Requisito SGC | Control esperado en `calaire-app` |
|---|---|
| Confidencialidad de participantes | Acceso por rol, proteccion de identidad, visibilidad limitada por participante y restriccion de datos de otros laboratorios. |
| Comunicacion e instrucciones de ronda | Publicacion o registro de calendario, cronograma, ficha digital, instrucciones y cambios controlados. |
| Captura comparable de resultados | Campos estructurados, unidades definidas, validaciones basicas, ventanas de reporte y bloqueo o trazabilidad de cambios posteriores al cierre. |
| Trazabilidad de datos | Registro de ronda, participante, usuario, fecha/hora, identificador de ficha, origen del dato, estado del registro y exportacion asociada. |
| Integridad de datos | Controles para evitar sobrescritura no trazada, duplicados no autorizados, perdida de informacion o modificaciones sin justificacion. |
| Transferencia a `pt_app` | Exportacion oficial identificada como `F-PSEA-09`, con identificador de ronda, fecha/hora, responsable y estado de aprobacion. |
| Tratamiento de desviaciones | Registro de incidentes, correcciones, reaperturas, quejas o no conformidades conforme a los procedimientos SGC aplicables. |
| Validacion y cambios | Evidencia de pruebas funcionales, revision de cambios y aprobacion antes de uso oficial o despues de modificaciones relevantes. |

## Responsabilidades y uso

| Rol | Responsabilidad |
|---|---|
| Coordinador de ronda | Configurar o aprobar ronda, calendario, cronograma, ficha digital y participantes en `calaire-app`. |
| Administrador del aplicativo | Gestionar usuarios, permisos, parametrizacion, versiones del aplicativo, respaldos, trazabilidad tecnica y casos SGC habilitados en el aplicativo. |
| Participante | Confirmar participacion, consultar informacion de ronda y registrar datos, equipos e instrumentos dentro de los plazos definidos. |
| Analista PT | Recibir y verificar que la exportacion oficial (`F-PSEA-09`) sea la entrada autorizada para el flujo en `pt_app`. |
| Responsable de calidad | Verificar que los controles de confidencialidad, registros, cambios, incidentes y evidencias del aplicativo esten alineados con el SGC. |
| Revisor tecnico | Revisar consistencia de datos exportados cuando existan alertas, correcciones, reaperturas o incidencias que puedan afectar la validez de la ronda. |

## Entradas

| Entrada | Uso |
|---|---|
| Requisitos operativos PEA | Funciones requeridas para gestion de rondas, participantes, comunicaciones y captura. |
| `P-PSEA-04` | Base para configurar la planificacion de ronda. |
| `P-PSEA-05` | Base para controlar comunicaciones operativas. |
| `F-PSEA-05` | Plan de ronda EA, cuando se use como base de configuracion. |
| Participantes | Datos de contacto, confirmacion, equipos, instrumentos y resultados reportados por laboratorios participantes. |
| Configuracion de ronda | Analitos, niveles, fechas, instrucciones, estado de ronda y responsables. |
| Registros SGC | Quejas, no conformidades, comunicaciones o incidentes que deban asociarse a la ronda. |

## Salidas

| Salida | Descripcion |
|---|---|
| `F-PSEA-01` | Calendario global de ronda. |
| `F-PSEA-02` | Cronograma detallado de ronda. |
| `F-PSEA-03` | Registro de participacion. |
| `F-PSEA-04` | Anexo tecnico de equipos e instrumentos del participante. |
| `F-PSEA-06` | Ficha digital de ronda EA. |
| `F-PSEA-08` | Datos reportados por participante. |
| `F-PSEA-09` | Datos de participantes exportados para analisis PT. |
| `F-PSEA-14` | Caso SGC de queja o NC, si aplica. |
| Bitacora del aplicativo | Evidencia de usuarios, cambios, exportaciones, cierres, reaperturas, incidentes y respaldos cuando aplique. |
| Registro de validacion/cambio | Evidencia de pruebas, version aprobada del aplicativo, cambios liberados y evaluacion de impacto. |

## Campos minimos y trazabilidad

Cada ronda configurada en `calaire-app` debe registrar como minimo:

- Codigo y nombre de la ronda.
- Identificador de configuracion de la ronda.
- Periodo de ejecucion, ventanas de medicion y fechas limite de reporte.
- Analito(s), nivel(es) y magnitudes solicitadas.
- Laboratorios participantes, estado de confirmacion y codigo interno de participante.
- Responsable de la ronda y responsable de la configuracion.
- Identificador de la ficha digital de ronda (`F-PSEA-06`).
- Estado de ronda: borrador, publicada, en captura, cerrada, exportada, anulada o equivalente.
- Historial de cambios relevantes con fecha, usuario, justificacion y aprobacion cuando aplique.

Cada participante debe registrar como minimo:

- Identificacion del laboratorio y codigo de participante usado para proteger su identidad en el flujo de evaluacion.
- Contacto operativo autorizado.
- Equipos e instrumentos asociados (`F-PSEA-04`).
- Datos reportados por analito y nivel (`F-PSEA-08`).
- Usuario, fecha/hora y estado de envio de los datos.
- Correcciones, reemplazos o reaperturas autorizadas, con justificacion y responsable.

Cada exportacion oficial hacia `pt_app` debe registrar como minimo:

- Identificador de ronda.
- Consecutivo o identificador de exportacion.
- Fecha y hora de generacion.
- Responsable que genera y/o aprueba la exportacion.
- Alcance de datos incluidos.
- Estado de aprobacion para analisis.
- Referencia al archivo conservado como `F-PSEA-09`.
- Observaciones sobre datos faltantes, correcciones, exclusiones o alertas de consistencia.

## Validacion, cambios y mantenimiento

`calaire-app` debe validarse antes de su uso oficial en una ronda y despues de cambios que puedan afectar captura, permisos, exportaciones, reglas de validacion, estructura de datos, reportes, seguridad o disponibilidad.

La evidencia minima de validacion o cambio debe incluir:

- Version del aplicativo, modulo o componente evaluado.
- Alcance de la prueba.
- Casos de prueba y resultado esperado.
- Datos de prueba usados, cuando aplique.
- Resultado obtenido y decision de aceptacion.
- Responsable de ejecucion, revision y aprobacion.
- Evaluacion de impacto sobre rondas abiertas, datos ya capturados o exportaciones emitidas.
- Acciones correctivas o restricciones de uso si se detectan fallas.

Los cambios no deben liberarse para uso oficial si no existe aprobacion del responsable autorizado. Cuando un cambio afecte datos ya reportados, exportaciones oficiales o confidencialidad, debe evaluarse si corresponde registrar trabajo no conforme, no conformidad, accion correctiva o comunicacion controlada.

## Controles operativos

- El acceso al aplicativo debe estar acotado por rol y revisarse ante altas, bajas, cambios de funciones o cierre de ronda.
- Las credenciales de participantes son personales o institucionales controladas y no deben permitir acceso a datos de otros participantes.
- La identidad de participantes debe protegerse en las exportaciones y reportes segun las reglas del PEA.
- Los cambios en calendario, cronograma, ficha digital o instrucciones deben quedar trazables y comunicarse por el canal definido.
- La captura de resultados debe cerrarse segun el cronograma aprobado; cualquier reapertura debe quedar justificada.
- Las exportaciones hacia `pt_app` deben identificarse, conservarse como `F-PSEA-09` y no sobrescribirse sin trazabilidad.
- Los datos exportados deben someterse a una revision de completitud y consistencia antes de su uso analitico.
- Las fallas de disponibilidad, perdida de datos, errores de permisos, exposicion de informacion o exportaciones incorrectas deben registrarse y evaluarse por impacto en la validez de la ronda.
- Deben existir respaldos o mecanismos de recuperacion proporcionales al riesgo de perdida de informacion oficial.
- La documentacion tecnica interna del aplicativo debe mantenerse como soporte controlado, aunque no sustituye este documento general.

## Documentos relacionados

| Codigo | Relacion |
|---|---|
| `I-PSEA-02` | Instructivo de uso de `calaire-app` por participante. |
| `I-PSEA-03` | Instructivo de administracion de rondas en `calaire-app`. |
| `P-PSEA-03` | Control de registros y evidencias del PEA. |
| `P-PSEA-04` | Procedimiento de planificacion de ronda que usa el aplicativo. |
| `P-PSEA-05` | Procedimiento de comunicaciones que usa el aplicativo. |
| `P-PSEA-08` | Flujo tecnico de datos digitales del PEA. |
| `P-PSEA-14` | Control de colusion y falsificacion, cuando los datos del aplicativo generen alertas. |
| `P-PSEA-15` | Trabajo no conforme, no conformidades y acciones correctivas. |
| `P-PSEA-17` | Procedimiento de quejas del PEA gestionadas como casos SGC. |
| `P-PSEA-19` | Confidencialidad operativa interna del PEA. |
| `DG-PSEA-03` | Aplicativo `pt_app` que recibe las exportaciones oficiales. |

## Limites

- No es un formato `F-PSEA`.
- No es un instructivo de uso; la operacion se documenta en `I-PSEA-02` e `I-PSEA-03`.
- No define criterios estadisticos, valor asignado, `sigma_pt`, incertidumbre ni reglas de desempeno.
- No genera el informe final de resultados ni el analisis estadistico.
- No reemplaza procedimientos de planificacion, comunicaciones, confidencialidad, quejas, trabajo no conforme ni control documental.
- No convierte la documentacion tecnica del software en registro oficial de ronda salvo que sea referenciada por `P-PSEA-03` o `P-PSEA-08`.

---

**Nota:** La documentacion tecnica interna de `calaire-app` (`calaire-app_func_docs_sgc.md`, `calaire-app_reg_docs_sgc.md`, `calaire-app_registros-sgc.html`) se mantiene en carpeta aparte como soporte del aplicativo y no forma parte de este documento codificado.
