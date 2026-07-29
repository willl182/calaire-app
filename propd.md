# Propuesta de actualización del protocolo de ensayos

## 1. Objetivo

Actualizar el protocolo de ensayos para incluir formalmente el acta de inicio de ronda, el cronograma detallado con tiempos de estabilización, un instructivo de apertura de ronda y un formato de reporte de novedades. Además, proponer una hoja de vida de ronda que consolide todos los documentos y registros modificables de la ronda.

## 2. Documentos que se deben crear o actualizar

### 2.1 Protocolo de ensayos (actualización)

- Incluir el acta de inicio como anexo obligatorio al protocolo.
- El acta de inicio debe estar vinculada al protocolo, no ser un documento independiente.
- El protocolo debe hacer referencia explícita al instructivo de apertura de ronda.

### 2.2 Instructivo de apertura de ronda (nuevo)

- Este documento es el protocolo de apertura de ronda.
- Debe indicar que se da inicio a la ronda registrando la hora exacta de inicio.
- Debe indicar que se diligencia el cronograma exacto de la ronda, con las horas de inicio y fin de cada nivel y transición.
- El cronograma debe considerar los tiempos de estabilización y duraciones establecidas:
  - Nivel 0: 1 hora.
  - Transición entre niveles: 30 minutos.
  - Tiempo adicional de estabilización por transición: 10 minutos.
  - Demás niveles: 3 horas cada uno.
  - Transición entre cada nivel posterior: 10 minutos.
- El protocolo debe indicar que el cronograma se entrega al técnico que programa las horas y al participante para que conozca los horarios exactos de cambios y transiciones.
- Se recomienda programar el envío de las muestras para los tiempos exactos definidos en el cronograma.

### 2.3 Acta de inicio de ronda (actualización)

- Agregar el cronograma detallado como parte del acta de inicio.
- El cronograma debe incluir las horas exactas de inicio y fin de cada nivel, considerando los tiempos de estabilización y transición.
- El cronograma debe ser entregado al técnico responsable de programar las horas y al participante para que conozca los horarios exactos de los cambios de nivel y transiciones.

### 2.4 Formato de reporte de novedades (nuevo)

- Crear un formato estandarizado para registrar cualquier novedad durante la ronda.
- El formato debe incluir al menos: fecha, hora, nivel, descripción de la novedad, acción correctiva, responsable y firma.
- El reporte de novedades debe formar parte de la hoja de vida de la ronda.

### 2.5 Hoja de vida de ronda (nuevo)

- Crear una hoja de vida de ronda que consolide todos los documentos y registros de una ronda.
- La hoja de vida debe incluir al menos:
  - Protocolo de ensayos aprobado.
  - Acta de inicio con cronograma detallado.
  - Instructivo de apertura de ronda.
  - Registros de lecturas y mediciones.
  - Reportes de novedades.
  - Cronogramas modificados (si aplica).
  - Acta de cierre (si aplica).
- Si hay modificaciones al cronograma, se debe elaborar un nuevo cronograma y anexarlo a la hoja de vida.

## 3. Cronograma de tiempos

| Etapa | Duración | Tiempo de estabilización / transición | Nota |
|-------|----------|----------------------------------------|------|
| Nivel 0 | 1 hora | — | Inicio de la ronda |
| Transición a nivel 1 | 30 minutos | + 10 minutos de estabilización | — |
| Nivel 1 | 3 horas | — | — |
| Transición a nivel 2 | 10 minutos | + 10 minutos de estabilización | — |
| Nivel 2 | 3 horas | — | — |
| Transición a nivel 3 | 10 minutos | + 10 minutos de estabilización | — |
| Nivel 3 | 3 horas | — | — |
| Niveles posteriores | 3 horas cada uno | 10 minutos de transición + 10 minutos de estabilización | Según protocolo |

## 3.1 Archivos de respaldo de ronda para apelación

- Conservar copia de seguridad de todos los archivos generados por los sistemas de generación de la ronda, con los valores registrados durante la ejecución.
- Incluir como mínimo los archivos del sistema generador T700 que contengan los valores generados por nivel (por ejemplo, registros de concentración objetivo y concentración actual con marca de tiempo).
- De los archivos del T700 se extrae la tabla de niveles nominales de concentración usados durante la ronda. Con esos valores se marcan los archivos para el preproceso, identificando qué registros pertenecen a cada nivel y cuál es la concentración objetivo esperada.
- Estos archivos deben formar parte de la hoja de vida de la ronda y deben conservarse junto con los documentos modificables de la ronda para respaldar auditorías o apelaciones.
- Los archivos de respaldo deben estar referenciados en el acta de inicio de ronda o en el formato de entrega de documentos de la hoja de vida.

## 4. Gestión de modificaciones

- Cualquier modificación al cronograma original debe generar un nuevo cronograma.
- El nuevo cronograma debe indicar: motivo de la modificación, fecha y hora de la modificación, responsable, horas afectadas y ajustes realizados.
- El nuevo cronograma debe anexarse a la hoja de vida de ronda como documento de soporte.
- Se debe conservar el cronograma original y todos los cronogramas modificados para trazabilidad.

## 5. Riesgos identificados

- **Error humano:** Pérdida de tiempos por errores en el diligenciamiento del cronograma, la programación de horas o el envío de muestras.
  - Mitigación: usar horas exactas, entregar el cronograma al técnico programador, programar envíos de muestras según el cronograma y conservar registros en la hoja de vida.
- **Desviación en tiempos de estabilización:** No respetar los tiempos de transición y estabilización puede afectar los resultados de los ensayos.
  - Mitigación: incluir los tiempos de estabilización en el cronograma detallado y verificar cumplimiento antes de cada nivel.
- **Falta de trazabilidad:** No conservar los documentos modificados dificulta auditorías o reprocesos.
  - Mitigación: mantener la hoja de vida de ronda actualizada con todos los anexos.
- **Configuración interna de concentraciones nominales por nivel:** Aunque el aplicativo expone los niveles como 1, 2, 3, 4 y 5 al cargar la ronda, el administrador interno debe poder definir y revisar las concentraciones nominales reales asociadas a cada nivel. Es necesario identificar en qué módulo o pantalla del aplicativo se cargan o editan esos valores, para garantizar que coincidan con los niveles nominales extraídos de los archivos del T700 y con el protocolo vigente.

## 6. Acciones sugeridas

1. Revisar el protocolo de ensayos vigente y verificar si el acta de inicio ya está incluida.
2. Si no está incluida, redactar el acta de inicio y vincularla al protocolo.
3. Elaborar el instructivo de apertura de ronda.
4. Diseñar el formato de cronograma detallado con horas exactas y tiempos de estabilización.
5. Diseñar el formato de reporte de novedades.
6. Crear la plantilla de hoja de vida de ronda.
7. Definir el flujo de aprobación y anexión de documentos a la hoja de vida.
