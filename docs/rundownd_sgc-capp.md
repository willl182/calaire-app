Rundown SGC — docs/01_bloque_general

Panorama

Bloque contiene SGC maestro del Programa de Ensayos de Aptitud CALAIRE-EA para gases contaminantes criterio.

Cobertura principal:

- Planeación de rondas.
- Registro de participantes y equipos.
- Preparación de ítems gaseosos.
- Homogeneidad y estabilidad.
- Captura y tratamiento digital de datos.
- Diseño y análisis estadístico.
- Emisión de informes.
- Quejas, apelaciones, NC y acciones correctivas.
- Competencia, confidencialidad y proveedores.
- Trazabilidad con ISO/IEC 17043:2023, ISO/IEC 17025:2017 e ISO 13528:2022.

Inventario físico: 153 archivos. Muchos son versiones equivalentes DOCX/Markdown/Excel/CSV, capturas y auxiliares; no 153 documentos controlados distintos.

Arquitectura documental

Familias:

- DG: documentos generales. Marco y aplicaciones.
- P: procedimientos. Reglas, controles y responsabilidades.
- I: instructivos. Ejecución detallada.
- F: formatos/registros. Evidencia objetiva.
- Matrices e inventarios: navegación, vigencia y trazabilidad.

Jerarquía lógica:

DG: qué es sistema y qué aplicaciones usa
 P: qué debe hacerse y bajo qué controles
 I: cómo ejecutar operación
 F: dónde registrar evidencia

1. 00_plantillas_base

Contiene moldes para crear documentos nuevos:

- DG-PSEA- Documento General.docx
- P-PSEA-01 Plantilla Procedimiento.doc
- I-PSEA-01 Plantilla Instructivo.doc
- F-PSEA-01 Plantilla Formato_Excel.xlsx

Función: estandarizar encabezados, codificación, control de cambios y presentación.

Observación: plantillas usan códigos que pueden confundirse con documentos vigentes. Conviene marcarlas claramente como PLANTILLA y evitar número documental real dentro del nombre.

2. 01_documentos_marco

DG-PSEA-01 — Protocolo general de participación

Marco externo para participantes:

- Condiciones de participación.
- Alcance del ensayo.
- Reglas generales.
- Confidencialidad.
- Comunicación y resultados.
- Referencia al protocolo general y al informe.

Estado: mantener, pero revisar al cierre. Debe alinearse con arquitectura digital final.

DG-PSEA-02 — Aplicativo calaire-app

Describe sistema de gestión operativa:

- Rondas y publicaciones.
- Participantes.
- Cronogramas.
- Comunicaciones.
- Plantillas.
- Notificaciones.
- Captura de F-PSEA-08.
- Gestión de casos.
- Matriz documental.
- Cobertura documental por ronda.

Relaciones clave:

- P-PSEA-04: planificación.
- P-PSEA-08: flujo digital.
- I-PSEA-02: uso por participante.
- I-PSEA-03: administración interna.
- F-PSEA-03, F-PSEA-04, F-PSEA-08, F-PSEA-09.

Incluye DOCX, Markdown, HTML y diez capturas.

DG-PSEA-03 — Aplicativo pt_app

Describe sistema técnico-estadístico:

- Carga de datos.
- Preprocesamiento.
- Homogeneidad y estabilidad.
- Valores atípicos.
- Valor asignado.
- Incertidumbre.
- Compatibilidad metrológica.
- Puntajes z y En.
- Generación de informes.
- Gestión de participantes.

Relaciones clave:

- P-PSEA-07: diseño estadístico.
- P-PSEA-08: flujo digital.
- P-PSEA-09: informe.
- I-PSEA-04 e I-PSEA-05.
- F-PSEA-10 a F-PSEA-13.

Incluye DOCX, Markdown, HTML, 17 capturas y script de capturas.

3. 02_procedimientos

Marco documental

- P-PSEA-01 — Protocolo general EA
Procedimiento rector. Define alcance general y conecta planeación, operación, análisis e informe.
- P-PSEA-02 — Matriz documental básica
Fuente maestra de códigos, nombres, estados y ubicación documental.
- P-PSEA-03 — Control de registros y evidencias
Define conservación de evidencia por ronda, checklist y estructura de siete etapas.

Operación de ronda

- P-PSEA-04 — Planificación de ronda
Participantes, recursos, cronograma, ficha, plan técnico, competencia y proveedores.
- P-PSEA-05 — Comunicaciones
Emisión, recepción y evidencia de comunicaciones formales.
- P-PSEA-06 — Preparación y control del ítem
Producción, manejo, trazabilidad y control del ítem gaseoso.
- P-PSEA-07 — Diseño estadístico
Valor asignado, σpt, incertidumbre, homogeneidad, estabilidad, desempeño y reglas de decisión.
- P-PSEA-08 — Flujo técnico de datos digitales
Captura, exportación, preprocesamiento, consolidación, análisis y archivo.
- P-PSEA-09 — Generación y emisión del informe
Revisión, aprobación, emisión y control de F-PSEA-13.

Procedimientos por analito

- P-PSEA-10: NO–NO₂.
- P-PSEA-11: CO.
- P-PSEA-12: O₃.
- P-PSEA-13: SO₂.

Cada uno conecta:

Preparación del ítem
Diseño estadístico
Informe final

Gestión SGC

- P-PSEA-14: colusión y falsificación.
- P-PSEA-15: trabajo no conforme, NC y CAPA.
- P-PSEA-16: divulgación de valores sensibles.
- P-PSEA-17: quejas.
- P-PSEA-18: apelaciones.
- P-PSEA-19: confidencialidad interna.
- P-PSEA-20: competencia y autorización.
- P-PSEA-21: proveedores críticos.
- P-PSEA-23: mejora continua.

P-PSEA-23 figura como reservado/placeholder. Falta decisión sobre activación o cobertura mediante SGC institucional.

Auxiliares no controlados

- crear_estructura_ronda.sh
- plantilla_checklist_ronda.md
- Planificacion_R1_PP (1).md

Apoyan operación, pero inventario vigente indica que script y checklist base no son documentos controlados.

4. 03_instructivos

- I-PSEA-01 — Embalaje
Instrucciones para embalaje del ítem. Existe físicamente, pero no aparece en diccionario ni inventario vigente.
- I-PSEA-02 — Participante calaire-app
Registro, acceso, carga y reporte de datos.
- I-PSEA-03 — Administración de rondas calaire-app
Creación y administración de rondas, participantes, publicaciones y exportaciones.
- I-PSEA-04 — Preprocesador pt_app
Entradas, revisión, transformaciones, salidas, versión y responsable.
- I-PSEA-05 — Módulo de análisis pt_app
Análisis estadístico, revisión de resultados y generación de informe.

Responsabilidades dominantes:

- Coordinación EA: gobierna ronda y control documental.
- Responsable técnico: preparación, ejecución y validación técnica.
- Soporte metrológico/estadístico: diseño y revisión del análisis.
- Administrador de aplicaciones: operación y trazabilidad digital.
- Responsable del informe: aprobación de versión final.
- Participante: registro, equipos y reporte de resultados.

5. 04_formatos_maestros

Planeación

- F-PSEA-01: calendario global.
- F-PSEA-02: cronograma detallado.
- F-PSEA-03: registro de participación y carga.
- F-PSEA-04: equipos e instrumentos.
- F-PSEA-05: ficha básica de ronda.
- F-PSEA-06: planificación completa.
- F-PSEA-16: competencia y autorización.
- F-PSEA-17: proveedores críticos.

Preparación del ítem

- F-PSEA-07: preparación y control del ítem.

Datos digitales

- F-PSEA-08: datos reportados por participante.
- F-PSEA-09: exportación oficial hacia análisis PT.
- F-PSEA-10: registro de preprocesamiento.
- F-PSEA-12: dataset oficial consolidado.

Homogeneidad y estabilidad

- F-PSEA-11: registro principal.
- F-PSEA-11A: datos preprocesados de homogeneidad.
- F-PSEA-11B: datos preprocesados de estabilidad.
- F-PSEA-11C: resultados de homogeneidad.
- F-PSEA-11D: resultados de estabilidad.

Informe y cierre

- F-PSEA-13: informe final.
- F-PSEA-14: queja, trabajo no conforme o NC.
- F-PSEA-15: apelaciones.
- F-PSEA-18: comunicaciones y evidencia de envío/respuesta.

Varios formatos tienen representación simultánea:

Markdown: definición documental
DOCX: versión presentable
XLSX/CSV: estructura operativa o intercambio de datos

Conviene dejar explícito cuál versión es maestra y cuáles son exportaciones.

6. 05_matrices_inventarios

Cinco documentos de gobierno:

Árbol Maestro PSEA.md

Mapa de dependencias entre DG, P, I y F. Define rutas críticas y estructura operativa.

Diccionario de Documentos SGC.md

Resumen más útil por documento:

- Código.
- Tipo.
- Propósito.
- Relaciones principales.

Inventario Documental del SGC.md

Control de:

- Nombre vigente.
- Estado.
- Ubicación.
- Criterio de precedencia.

Fuentes maestras declaradas:

1. P-PSEA-02
2. P-PSEA-03
3. P-PSEA-08
4. Mapa de navegación SGC

Matriz Maestra de Cumplimiento Normativo.md

Cruza documentos contra:

- ISO/IEC 17043:2023.
- ISO/IEC 17025:2017.
- ISO 13528:2022.

trazabilidad_normativa_sgc.md

Versión compacta de trazabilidad, incluyendo cobertura inversa: documento frente a requisitos cubiertos.

Flujo crítico de ronda

P-PSEA-04 Planificación
P-PSEA-05 Comunicaciones
P-PSEA-06 Preparación del ítem
P-PSEA-07 Diseño estadístico
P-PSEA-08 Flujo digital
P-PSEA-09 Informe
Procedimientos SGC de cierre

Flujo de datos:

Participante
I-PSEA-02
F-PSEA-08
calaire-app
F-PSEA-09
pt_app / I-PSEA-04
F-PSEA-10
F-PSEA-12
pt_app / I-PSEA-05
F-PSEA-13

Evidencia esperada por ronda

Arquitectura prevista:

02_despliegue_rondas/<codigo_ronda>/
  checklist_ronda.md
  01_planificacion_ronda/
  02_comunicaciones_participantes/
  03_preparacion_item/
  04_datos_y_preprocesamiento/
  05_homogeneidad_estabilidad/
  06_analisis_e_informe/
  07_cierre_sgc/

Cada ronda debe instanciar formatos maestros. No debe modificar originales de 04_formatos_maestros.

Cobertura normativa

Cobertura fuerte:

- Planeación del esquema.
- Preparación y control del ítem.
- Diseño estadístico.
- Gestión digital de datos.
- Evaluación de desempeño.
- Informe PT.
- Quejas y apelaciones.
- Trabajo no conforme.
- Competencia y proveedores.
- Confidencialidad.

Cobertura parcial:

- Mejora continua.
- Riesgos y oportunidades.
- Actualización final del marco general.
- Correspondencia entre estructura prevista y carpetas reales de ronda.

Hallazgos principales

1. I-PSEA-01 existe, pero no está inventariado.
Debe incorporarse en P-PSEA-02, diccionario, árbol e inventario, o declararse obsoleto/no controlado.
2. Salto de P-PSEA-21 a P-PSEA-23.
Falta aclarar si P-PSEA-22 está reservado, retirado o nunca asignado.
3. P-PSEA-23 no está plenamente implementado.
Brecha explícita para ISO/IEC 17043, cláusula 8.6, y requisitos de mejora.
4. DG-PSEA-01 y P-PSEA-01 requieren revisión final.
Deben reflejar arquitectura digital real y mapa documental definitivo.
5. Arquitectura operativa posiblemente no materializada.
Documentos hablan de 02_despliegue_rondas, pero matriz menciona 02_prueba_piloto_rondas como fuente histórica o estructura existente.
6. Estados no siempre coherentes con existencia física.
Hay documentos “en actualización” con DOCX y Markdown completos. Estado debe indicar aprobación, no solo existencia.
7. Múltiples representaciones sin regla universal de precedencia.
DOCX, Markdown, XLSX y CSV pueden divergir. Hace falta campo “fuente maestra editable” por código.
8. Dos DOCX de ronda quedan sueltos en raíz.
EA-PP2026-R1-1-z-4-2a.docx y EA-PP2026-R2-1-z-4-2a.docx parecen evidencias o informes de ronda. Mejor ubicarlos dentro de despliegue correspondiente o documentar función.
9. Nombre informal: Planificacion_R1_PP (1).md.
Sufijo (1) sugiere copia manual. Riesgo de versión no controlada.

Evaluación general

SGC tiene arquitectura sólida y bastante completa. Núcleo técnico y digital bien conectado. Mayor trabajo pendiente no está en crear más formatos, sino en:

1. Cerrar vigencia y aprobación.
2. Resolver excepciones de codificación.
3. Definir fuente maestra por documento.
4. Materializar estructura oficial por ronda.
5. Activar o reemplazar P-PSEA-23.
6. Actualizar documentos marco al estado final de aplicaciones.
