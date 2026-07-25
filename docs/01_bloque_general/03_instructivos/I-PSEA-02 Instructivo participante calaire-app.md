# I-PSEA-02: Instructivo de uso de calaire-app por participante

**Codigo:** I-PSEA-02  
**Tipo documental:** Instructivo  
**Nombre:** Instructivo de uso de calaire-app por participante  
**Version:** 2.0  
**Fecha:** 2026-07-25  
**Estado:** Activo

---

## 1. Objetivo

Explicar al laboratorio participante como usar calaire-app para confirmar participacion, consultar informacion de la ronda, registrar datos, cargar informacion de equipos e instrumentos, y atender comunicaciones operativas asociadas al ensayo de aptitud.

## 2. Alcance

Este instructivo aplica a los laboratorios participantes del PEA durante la fase de ejecucion de ronda y captura de datos.

Incluye:

- Acceso al aplicativo y roles disponibles para el participante.
- Confirmacion de participacion en una ronda.
- Consulta de calendario, cronograma e instrucciones de la ronda.
- Registro de informacion tecnica de equipos e instrumentos.
- Registro de datos reportados por analito y nivel.
- Seguimiento de comunicaciones operativas.

No incluye:

- Funciones administrativas de ronda (I-PSEA-03).
- Criterios tecnicos del PEA, valor asignado, sigma_pt o reglas de desempeno (P-PSEA-07).
- Comunicaciones formales del PEA (P-PSEA-05).
- Analisis estadistico o uso de pt_app (I-PSEA-04, I-PSEA-05).

## 3. Responsabilidades y uso

| Rol | Responsabilidad |
|---|---|
| Participante | Acceder a calaire-app, confirmar participacion, registrar equipos y datos, y atender comunicaciones de la ronda. |
| Coordinador de ronda | Habilitar al participante, enviar credenciales y comunicar plazos. |
| Soporte tecnico | Resolver incidencias de acceso o uso del aplicativo. |

El participante usa calaire-app bajo lo definido en DG-PSEA-02 y P-PSEA-05.

## 4. Entradas

| Codigo / fuente | Descripcion |
|---|---|
| DG-PSEA-02 | Documento general del aplicativo calaire-app. |
| F-PSEA-03 | Registro de participacion y carga de datos del participante. |
| F-PSEA-04 | Equipos e instrumentos exportados desde la carga del participante. |
| P-PSEA-05 | Procedimiento de comunicaciones del PEA. |

## 5. Salidas

| Codigo | Descripcion |
|---|---|
| F-PSEA-03 | Confirmacion, actualizacion y carga de datos del participante. |
| F-PSEA-04 | Exportacion tecnica de equipos e instrumentos. |
| F-PSEA-08 | Datos reportados por participante. |
| F-PSEA-09 | Exportacion posterior de datos hacia analisis PT. |

## 6. Procedimiento resumido

1. Acceder a calaire-app con las credenciales proporcionadas por el coordinador de ronda.
2. Confirmar la participacion en la ronda asignada dentro del plazo establecido.
3. Consultar el calendario, cronograma e instrucciones de la ronda.
4. Registrar o actualizar la informacion de participacion, personal y equipos en F-PSEA-03; la informacion tecnica de equipos se exporta como F-PSEA-04.
5. Registrar los datos obtenidos durante la ejecucion de la ronda (F-PSEA-08).
6. Revisar comunicaciones operativas y responder cuando aplique.
7. Conservar la evidencia de registros y confirmaciones generadas por el aplicativo.

## 7. Campos minimos

El participante debe completar como minimo:

- Identificacion del laboratorio y contacto operativo.
- Confirmacion de participacion por ronda.
- Equipos e instrumentos utilizados (marca, modelo, serie, metodo cuando aplique).
- Datos reportados por analito, nivel y replica segun lo definido en la ronda.
- Fecha y hora de registro de datos cuando el aplicativo lo requiera.

## 8. Controles

- El registro de datos debe hacerse dentro de los plazos definidos en el cronograma de ronda.
- La informacion de equipos e instrumentos cargada en F-PSEA-03 debe ser coherente con el anexo tecnico exportado (F-PSEA-04).
- Los datos reportados (F-PSEA-08) deben ser revisados por el participante antes de su envio.
- Cualquier modificacion posterior al cierre de la ronda debe ser comunicada formalmente segun P-PSEA-05.

## 9. Relaciones documentales

| Codigo | Relacion |
|---|---|
| DG-PSEA-02 | Documento general del aplicativo que se opera. |
| P-PSEA-05 | Procedimiento de comunicaciones al participante. |
| P-PSEA-08 | Flujo tecnico que recibe la informacion capturada. |
| F-PSEA-03 | Registro de participacion y carga de datos del participante. |
| F-PSEA-04 | Equipos e instrumentos exportados desde F-PSEA-03. |
| F-PSEA-08 | Datos reportados por participante y registro de carga. |
| F-PSEA-19 | Acta de inicio firmada que puede consultarse cuando se publique. |
| I-PSEA-03 | Instructivo de administracion de rondas (uso interno). |

## 10. Limites

- No reemplaza DG-PSEA-02; solo explica el uso operativo para participantes.
- No define criterios estadisticos, valor asignado, sigma_pt ni reglas de desempeno.
- No gobierna comunicaciones formales del PEA; debe alinearse con P-PSEA-05.
- No describe la administracion interna de rondas; eso corresponde a I-PSEA-03.
- No cubre el uso de pt_app; el analisis se documenta en I-PSEA-04 e I-PSEA-05.

## Anexo A. Instalacion, calibracion y medicion

### A.1 Preparacion e instalacion

1. Verificar que equipo, conexiones, alimentación, gases y accesorios correspondan al plan de participación registrado.
2. Instalar equipo en ubicación asignada y conservar código anónimo comunicado por organización.
3. Evitar modificaciones no autorizadas en configuración, líneas o condiciones comunes de medición.
4. Registrar cualquier desviación o incidencia por canal oficial antes de continuar.

### A.2 Calibracion y verificacion

1. Ejecutar verificaciones y calibraciones normales del método propio del participante.
2. Usar patrones, gases y secuencias establecidos por su sistema de calidad.
3. No aplicar ajustes extraordinarios orientados a modificar artificialmente resultado de ronda.
4. Conservar registros propios de calibración y trazabilidad.

### A.3 Medicion

1. Operar equipo bajo condiciones normales documentadas por laboratorio.
2. Cumplir ventanas y duración definidas en calendario y cronograma.
3. Conservar datos originales sin sustitución, interpolación o eliminación no documentada.
4. Reportar incidencias que puedan afectar integridad o comparabilidad.

## Anexo B. Descarga, tratamiento y carga de datos

### B.1 Archivo original

Participante debe conservar y cargar archivo original producido por equipo o sistema de adquisición. Archivo original es obligatorio y no puede reemplazarse únicamente por hoja resumida.

### B.2 Promedios horarios

1. Calcular promedios horarios según ventanas definidas en cronograma.
2. Cada promedio horario requiere mínimo 75 % de datos válidos esperados en intervalo.
3. Si cobertura es menor, marcar resultado como no válido y documentar causa; no completar mediante datos inventados.
4. Mantener trazabilidad entre archivo original, tratamiento aplicado y valores cargados.

### B.3 Incertidumbre

Reportar incertidumbre con método propio documentado del laboratorio. Para cada resultado incluir:

- Unidad.
- Incertidumbre reportada.
- Factor de cobertura `k`.
- Nivel de confianza.
- Referencia al método o procedimiento usado.

### B.4 Carga en F-PSEA-08

1. Revisar ronda, analito, nivel, réplica, unidad y periodo antes de enviar.
2. Cargar promedios horarios y metadatos requeridos en F-PSEA-08.
3. Adjuntar archivo original obligatorio.
4. Confirmar envío dentro del plazo del cronograma.
5. Solicitar corrección por canal formal cuando ronda ya no permita edición.

### B.5 Controles

- No convertir unidades sin dejar evidencia de fórmula y factor usados.
- No omitir resultados por desempeño esperado.
- No compartir códigos, datos o resultados con otros participantes.
- Cualquier exclusión debe quedar identificada, justificada y trazable.
