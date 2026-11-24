# I-PSEA-03: Instructivo de administracion de rondas en calaire-app

**Codigo:** I-PSEA-03  
**Tipo documental:** Instructivo  
**Nombre:** Instructivo de administracion de rondas en calaire-app  
**Version:** 1.0  
**Fecha:** 2026-06-18  
**Estado:** Activo

---

## 1. Objetivo

Explicar el uso interno de calaire-app para configurar, administrar y controlar rondas de ensayo de aptitud: calendario, cronograma, ficha digital de ronda, participantes, comunicaciones operativas, exportaciones y casos SGC cuando aplique.

## 2. Alcance

Este instructivo aplica al personal autorizado que administra rondas en calaire-app.

Incluye:

- Configuracion inicial de una ronda.
- Gestion de calendario global y cronograma detallado.
- Registro y gestion de participantes.
- Generacion y control de la ficha digital de ronda.
- Envio de comunicaciones operativas.
- Exportacion de datos hacia pt_app.
- Registro operativo de casos SGC de queja o NC, cuando aplique.

No incluye:

- Definicion de criterios tecnicos o estadisticos del PEA (P-PSEA-07).
- Procedimiento formal de planificacion de ronda (P-PSEA-04).
- Gestion formal de comunicaciones, quejas o NC/CAPA (P-PSEA-05, P-PSEA-17, P-PSEA-15).
- Uso del aplicativo por el participante (I-PSEA-02).
- Preprocesamiento o analisis en pt_app (I-PSEA-04, I-PSEA-05).

## 3. Responsabilidades y uso

| Rol | Responsabilidad |
|---|---|
| Administrador de ronda | Crear y configurar rondas, gestionar participantes y comunicaciones. |
| Coordinador de ronda | Aprobar calendario, cronograma y ficha digital de ronda. |
| Responsable de datos | Ejecutar exportaciones oficiales hacia pt_app y asegurar su trazabilidad. |
| Responsable de casos SGC | Registrar y dar seguimiento a casos de queja o NC en calaire-app. |

El personal autorizado usa calaire-app bajo lo definido en DG-PSEA-02, P-PSEA-04 y P-PSEA-05.

## 4. Entradas

| Codigo / fuente | Descripcion |
|---|---|
| P-PSEA-04 | Procedimiento de planificacion de ronda. |
| DG-PSEA-02 | Documento general del aplicativo calaire-app. |
| F-PSEA-01 | Calendario global de ronda. |
| F-PSEA-02 | Cronograma detallado de ronda. |

## 5. Salidas

| Codigo | Descripcion |
|---|---|
| F-PSEA-01 | Calendario global actualizado. |
| F-PSEA-02 | Cronograma detallado actualizado. |
| F-PSEA-05 | Ficha basica de ronda EA. |
| F-PSEA-06 | Planificacion de ronda EA. |
| F-PSEA-09 | Exportacion de datos de participantes hacia pt_app. |
| F-PSEA-14 | Caso SGC de queja o NC, si aplica. |

## 6. Creacion y configuracion de la ronda

La ronda queda creada solo cuando se completan los dos pasos siguientes. Los datos de entrada deben estar definidos previamente en la planificacion de ronda (`P-PSEA-04`, `F-PSEA-06`).

### 6.1 Crear la ronda

Ruta: **Dashboard → Rondas → Nueva ronda**. Requiere rol administrador.

| Campo | Que registrar | Observaciones |
|---|---|---|
| Nombre | Nombre descriptivo de la ronda. | Ej.: `Comparacion interlaboratorio de gases contaminantes criterio 2026`. |
| Codigo | Codigo unico de la ronda. | Formato `EA-<tipo>-<año>[-R<n>]`, en mayusculas. Ej.: `EA-PP-2026-R1`, `EA-CIL-2026` para ronda unica. No se puede repetir. |
| Numero de participantes | Cantidad de laboratorios participantes planeados. | Crea un cupo pendiente por participante, cada uno con su enlace de acceso. No incluye la referencia. |
| Incluir referencia | Marcar si Calaire participa como referencia. | Crea un cupo adicional de perfil `member_special` con enlace individual. |
| Contaminantes | Marcar cada gas incluido (CO, SO2, O3, NO, NO2). | Solo los gases marcados se configuran y reportan. |
| Niveles (por gas) | Numero de niveles de concentracion del gas. | Define las casillas que diligencia el participante. Debe coincidir con los niveles PT de 6.2. |
| Replicas (por gas) | Numero de replicas por nivel: 2 o 3. | Aplica a todos los niveles del gas. |

Al guardar, la ronda queda en estado `borrador` y el aplicativo asigna a cada cupo un **codigo de participante aleatorio** de 6 caracteres, unico en la ronda.

### 6.2 Configurar PT

Ruta: **Ronda → Configuracion PT**. Se realiza inmediatamente despues de crear la ronda y antes de invitar participantes.

1. **Niveles PT por gas.** Seleccionar el contaminante y registrar una fila por nivel con:
   - **Run:** identificador de la corrida (ej. `1`, `2`, `3`).
   - **Nivel:** etiqueta del nivel de concentracion (ej. `1`, `2`, `3`).

   Repetir para cada gas. El numero de filas de cada gas debe ser igual al numero de niveles definido en 6.1. El aplicativo no permite cargar mas niveles PT de los definidos ni niveles de un gas no incluido, muestra un aviso mientras falten niveles y no permite activar la ronda hasta que coincidan. Los pares run/nivel son los que se exportan a pt_app (`F-PSEA-09`).
2. **Codigos de participantes PT.** Verificar que cada participante y la referencia tengan codigo asignado. El codigo se genera automaticamente; editarlo solo como respaldo administrativo y conservando la unicidad. El campo **Replica** completa la exportacion CSV.

Los codigos de participante son el identificador anonimo de la ronda: no deben publicarse junto con la identidad del laboratorio (`P-PSEA-19`, `F-PSEA-20`).

### 6.3 Verificacion antes de continuar

- [ ] Codigo y nombre de la ronda correctos.
- [ ] Cupos = participantes planeados (+ referencia, si aplica).
- [ ] Gases, niveles y replicas iguales a `F-PSEA-06`.
- [ ] Niveles PT cargados para cada gas, en igual numero que los niveles.
- [ ] Todos los participantes y la referencia con codigo PT.

## 7. Procedimiento resumido

1. Crear y configurar la ronda en calaire-app segun la seccion 6.
2. Configurar el calendario global (F-PSEA-01) y el cronograma detallado (F-PSEA-02).
3. Registrar o importar los laboratorios participantes y enviar invitaciones.
4. Generar y controlar la ficha basica de ronda (F-PSEA-05) y la planificacion completa de ronda (F-PSEA-06).
5. Enviar comunicaciones operativas segun el cronograma.
6. Monitorear el registro de datos y equipos por parte de los participantes.
7. Ejecutar la exportacion oficial de datos (F-PSEA-09) hacia pt_app.
8. Registrar casos SGC de queja o NC cuando aplique.

## 7A. Expediente documental de la ronda (pantalla SGC)

La pantalla **Rondas → (ronda) → SGC** guía el expediente en este orden:

1. **Siguiente paso** (barra superior): muestra la primera tarea pendiente según las dependencias, no según el número de carpeta. Antes del expediente pide los pasos previos: Configuración PT, códigos de participante y de réplica, hito `INICIO_RONDA` con fecha, inicializar el expediente e invitaciones. El botón "Ir al paso" lleva a la pantalla o sección que corresponde.
2. **Aviso de desincronización**: si el catálogo documental cambió después de crear el expediente, aparece "Actualizar expediente (N documentos nuevos)". Actualizar no borra ni cambia lo ya diligenciado.
3. **Avance del expediente**: un solo indicador, calculado sobre los documentos que aplican. Los "si aplica" solo cuentan cuando se marcan como aplicables.
4. **Expediente por etapas**: cada documento aparece numerado en el orden de diligenciamiento, con su responsable (**Tú** = coordinador, **Participante**, **Automático**), su estado y una sola acción principal: *Crear en Drive → Diligenciar → Cargar definitivo → Publicar*. Las demás opciones (reemplazar enlace, retirar, visibilidad) están en "Más opciones".
5. **Hitos del calendario** (`#hitos`): fechas en dd/mm/aaaa. Se registran antes o en paralelo al expediente; no impiden inicializarlo.
6. **Explorador de carpetas**: vista de carpetas de Drive. Las insignias distinguen *integración Drive conectada* (credenciales del servidor) de *carpeta de la ronda creada*. "Crear en Google Drive" crea o reutiliza la carpeta de la ronda y sus subcarpetas, y copia las plantillas de los documentos que aún no tienen enlace.
7. **Cierre documental**: los **bloqueantes** (recuadro rojo) impiden el cierre; los **críticos** (recuadro amarillo) conviene resolverlos pero no bloquean. Cada pendiente enlaza al documento.

### 7A.1 Mapa de carpetas, etapas y documentos

| Carpeta | Etapa | Documentos en orden (responsable; SA = si aplica) |
|---|---|---|
| `01_planificacion_ronda` | 01 Planificación | 1 F-PSEA-06 (Tú) · 2 F-PSEA-01 (Tú) · 3 F-PSEA-02 (Tú) · 4 F-PSEA-05 (Automático + "Marcar revisado") · 5 F-PSEA-03 (Participante) · 6 F-PSEA-04 (Automático) · 7 F-PSEA-16 (Tú) · F-PSEA-17 (Tú, SA) |
| `02_comunicaciones_participantes` | 02 Comunicaciones | 1 I-PSEA-02 (Tú) · 2 F-PSEA-18 (Tú) · 3 EVID-COM (Automático: ingreso del participante a la app) · EVID-ACL (Tú, SA) |
| `02A_inicio_ronda` | 02A Inicio de ronda | 1 F-PSEA-19 (Tú) |
| `03_preparacion_item` | 03 Preparación del ítem | 1 F-PSEA-21 (Tú) · 2 F-PSEA-20 (Tú) · 3 F-PSEA-07 (Tú) · EVID-CERT (Tú, SA) · EVID-MONT (Tú, SA) |
| `04_datos_y_preprocesamiento` | 04 Datos y preprocesamiento | 1 F-PSEA-08 (Participante) · 2 F-PSEA-09 (Automático) · 3 F-PSEA-10 (Tú) · 4 F-PSEA-12 (Tú) · EVID-CSV (Automático, SA) |
| `05_homogeneidad_estabilidad` | 05 Homogeneidad y estabilidad | Toda la etapa SA: F-PSEA-11A, 11B, 11C, 11D, F-PSEA-11 (Tú). Se puede dejar en "no aplica" sin justificación. |
| `06_analisis_e_informe` | 06 Análisis e informe | 1 EVID-SALIDAS (Tú, carga desde pt_app) · 2 F-PSEA-13 (Tú) · 3 EVID-ENVIO (Automático: informe publicado en el portal) |
| `07_cierre_sgc` | 07 Cierre SGC | 1 EVID-CIERRE (Automático + "Aprobar cierre") · F-PSEA-14 (Tú, SA) · F-PSEA-15 (Tú, SA) |

Notas de uso:

- **F-PSEA-01, F-PSEA-02 y F-PSEA-04** tienen el botón "Descargar CSV" con los datos de la app (hitos y equipos declarados). F-PSEA-01 y F-PSEA-02 los sigue diligenciando el coordinador: la descarga es una ayuda, no los da por cumplidos.
- **F-PSEA-06** se diligencia a pantalla completa y se cierra con "Finalizar registro".
- **F-PSEA-19** tiene dos estados para el avance: *diligenciada / por subir* y *subida* (PDF firmado cargado). Solo "subida" cuenta como completa. Publicar el acta es una acción aparte que no cambia el avance. No se puede inicializar sin el hito `INICIO_RONDA` con fecha.
- **F-PSEA-07** debe estar completo al momento de F-PSEA-19; **F-PSEA-21** va antes que F-PSEA-19 en la barra "Siguiente paso".

### 7A.2 Glosario de la pantalla

- **Diligenciado**: el contenido del documento está completo (en Drive o en la app).
- **Enlace editable**: dirección del documento de trabajo en Google Drive; solo la ve el equipo Calaire.
- **Versión definitiva**: copia final (PDF o archivo) que queda como evidencia del expediente.
- **Publicar**: hace visible la versión definitiva a los participantes en la app. No cambia el avance.

## 8. Campos minimos

La administracion de una ronda debe controlar como minimo:

- Codigo, nombre y version de la ronda.
- Periodo de ejecucion y fechas criticas.
- Analito(s) y niveles de concentracion.
- Lista de participantes y estado de confirmacion.
- Version del calendario global y cronograma detallado.
- Version de la ficha basica (F-PSEA-05) y de la planificacion completa de ronda (F-PSEA-06).
- Identificador de la exportacion oficial hacia pt_app (F-PSEA-09).
- Registro de casos SGC, si aplica.

## 9. Controles

- Los cambios en calendario o cronograma deben estar justificados y comunicados.
- La planificacion de ronda (F-PSEA-06) debe reflejar lo definido en P-PSEA-04; la ficha basica (F-PSEA-05) resume esa planificacion.
- La exportacion hacia pt_app debe ser la version oficial y conservarse como F-PSEA-09.
- Los casos SGC de queja deben alinearse con P-PSEA-17 y escalar a P-PSEA-15 cuando deriven en trabajo no conforme, NC o accion correctiva. P-PSEA-16 solo aplica a divulgacion y control de valores sensibles.
- El acceso administrativo debe estar restringido a roles autorizados.

## 10. Relaciones documentales

| Codigo | Relacion |
|---|---|
| DG-PSEA-02 | Documento general del aplicativo que se administra. |
| P-PSEA-04 | Procedimiento de planificacion de ronda. |
| P-PSEA-05 | Procedimiento de comunicaciones operativas. |
| P-PSEA-08 | Flujo tecnico que recibe exportaciones. |
| P-PSEA-15 | Procedimiento de trabajo no conforme, no conformidades y acciones correctivas al que escalan los casos SGC. |
| P-PSEA-17 | Procedimiento de quejas gestionadas como casos SGC. |
| F-PSEA-05 | Ficha basica de ronda generada o actualizada en calaire-app. |
| F-PSEA-06 | Planificacion completa de ronda generada o consolidada desde calaire-app. |
| I-PSEA-02 | Instructivo de uso del participante. |

## 11. Limites

- No reemplaza P-PSEA-04; solo explica como ejecutar en el aplicativo lo definido por el procedimiento.
- No define criterios estadisticos ni analisis de resultados.
- No reemplaza I-PSEA-02, que cubre el uso del participante.
- No gobierna quejas o apelaciones; solo puede explicar el registro operativo de casos cuando aplique.
- No cubre el uso de pt_app; el analisis se documenta en I-PSEA-04 e I-PSEA-05.
