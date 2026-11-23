# P-PSEA-24 Apertura de ronda EA

## Objetivo

Definir como se realiza la apertura presencial de cada ronda del Programa de Ensayos de Aptitud para Gases Contaminantes Criterio y como se deja constancia de ella en el acta de inicio `F-PSEA-19`.

## Alcance

Aplica a todas las rondas presenciales, desde la verificacion previa de participantes y equipos hasta la publicacion del acta de inicio firmada. La planificacion de la ronda y la creacion del hito `INICIO_RONDA` corresponden a `P-PSEA-04`; la preparacion del item y el registro de instrumentos corresponden a `P-PSEA-06`.

## Responsabilidades

| Rol | Responsabilidad |
|---|---|
| Coordinador de ronda | Dirigir la apertura, revisar fecha, lugar, participantes, organizadores y equipos del acta, y autorizar su publicacion. |
| Responsable tecnico | Tener registrada y validada en `F-PSEA-21` la relacion de instrumentos para metodo de referencia antes de generar el acta. |
| Gestor SGC | Generar el acta en `calaire-app`, controlar sus versiones y cargar el PDF firmado. |
| Participantes y organizadores | Asistir a la apertura y firmar el acta. |

## Condiciones previas

1. El hito `INICIO_RONDA` tiene fecha objetivo definida segun `P-PSEA-04`.
2. La lista de participantes y sus entidades esta confirmada en `F-PSEA-03`.
3. La relacion de instrumentos para metodo de referencia de la ronda esta registrada y validada en `F-PSEA-21`.
4. Los participantes conocen el calendario, cronograma e instructivo aplicables.

## Desarrollo de la apertura

1. **Inicializacion del acta.** El gestor SGC inicializa `F-PSEA-19` en `calaire-app`. El aplicativo toma la fecha del hito `INICIO_RONDA`, el lugar institucional, los participantes de `F-PSEA-03` y los instrumentos de `F-PSEA-21`.
2. **Revision.** El coordinador de ronda revisa los datos, ajusta fecha, lugar o texto de inicio si corresponde y registra exactamente dos organizadores de Calaire.
3. **Generacion.** El gestor SGC genera el DOCX del acta y lo imprime para la apertura.
4. **Apertura presencial.** En la fecha y lugar indicados, el coordinador declara formalmente iniciada la ronda ante los asistentes y presenta el metodo de determinacion del valor asignado y los instrumentos para metodo de referencia relacionados en el acta.
5. **Firma.** Participantes y organizadores firman el acta impresa a mano.
6. **Carga.** El gestor SGC escanea el acta firmada y carga el PDF en `calaire-app`.
7. **Publicacion.** El coordinador de ronda, con rol administrador, autoriza la publicacion del PDF firmado a los participantes.

## Registros

| Codigo | Registro | Uso en la apertura |
|---|---|---|
| `F-PSEA-19` | Acta de inicio de ronda | Registro oficial de la apertura: datos de la ronda, declaracion de inicio, metodo de determinacion del valor asignado, instrumentos para metodo de referencia y firmas. |
| `F-PSEA-03` | Registro de participacion | Fuente de participantes y entidades firmantes. |
| `F-PSEA-21` | Relacion de instrumentos Calaire usados | Fuente de los instrumentos para metodo de referencia incluidos en el acta. Permanece interno. |

## Control del acta

El acta se controla como registro segun `P-PSEA-03` y se conserva en la etapa `02A_inicio_ronda` de la ronda.

- El DOCX generado es archivo de trabajo interno y nunca se publica.
- Solo el PDF firmado vigente puede publicarse a participantes.
- Reemplazar el PDF crea nueva version y auditoria.
- Cambiar datos u organizadores despues de generar el DOCX exige regenerarlo y retira la publicacion vigente.
- Si la relacion de instrumentos en `F-PSEA-21` cambia despues de generar el DOCX, el gestor SGC debe regenerarlo antes de la firma.
- La firma es manuscrita; el acta no admite firmas digitales.
- Completitud: PDF firmado vigente cargado.
- Criticidad: critico, no bloquea el cierre documental.

## Documentos relacionados

| Codigo | Relacion |
|---|---|
| `P-PSEA-03` | Control, conservacion y versionamiento del acta. |
| `P-PSEA-04` | Planificacion de la ronda, hito `INICIO_RONDA` y metodo de determinacion del valor asignado resumido en el acta. |
| `P-PSEA-05` | Comunicacion del acta firmada a participantes. |
| `P-PSEA-06` | Preparacion del item y registro de instrumentos en `F-PSEA-21`. |
| `P-PSEA-19` | Confidencialidad operativa; reglas de publicacion de `F-PSEA-19` y `F-PSEA-21`. |

## Requisitos normativos

ISO/IEC 17043:2023 7.1 (revision de acuerdos y confirmacion de participantes) y 7.3.5 (informacion a participantes al inicio de la ronda); ISO/IEC 17025:2017 7.5 (registros tecnicos).

## Limites

- No sustituye la planificacion de `P-PSEA-04` ni la preparacion del item de `P-PSEA-06`.
- El acta no sustituye `F-PSEA-03` ni `F-PSEA-21`.
