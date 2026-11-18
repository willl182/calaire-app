# Plan de corrección de los formatos F-PSEA — 2026-11-06

**Fuentes:** mapa `Z:\calaire-ea_sgc\mapa_navegacion_sgc_pea.html` (estados y aristas), maestros de `01_bloque_general\04_formatos_maestros\` (.docx, .xlsx, .csv, .md), informe `hallazgos_revision_documentos_sgc.md` y `guia_estilo_sgc.md` (en esta misma carpeta).
**Ejemplos:** ronda **EA-PP2026-R1**, O3. Niveles nominales tomados de la Tabla 1 del texto de O3 en P-PSEA-04 (0, 45, 90, 135, 180 nmol/mol). σpt = a·xpt + b con a y b por analito (D-07); para O3, a = 0.02 y b = 1 nmol/mol (P-PSEA-12, Tabla 5). Todo valor medido se escribe `<valor medido>`: no hay datos de O3 en las fuentes.
**Notación:** «Hallazgo B5» = sección B, ítem 5 del informe de hallazgos. «D-xx» = duda al final del documento.

---

## 0. Reglas transversales (aplican a todos los formatos)

1. **Encabezado** (guía §1.1): LABORATORIO DE CALIDAD DEL AIRE · Código · Versión · Fecha de vigencia · «FORMATO DE …» · Página X de Y. Al pie: REVISÓ / APROBÓ con ROL y FECHA.
2. **Quitar** «Estado: Preliminar — Revisar», «Clase: Ficha preliminar», «Instrucciones -», «pendiente de consolidación», «Ubicación esperada».
3. **Versión:** todo maestro corregido sale como `Versión: 01` (hoy conviven «0», «1.0» y «01»).
4. **Secciones mínimas:** 1 Objetivo · 2 Alcance y procedimiento que lo origina · 3 Responsables · 4 Campos · 5 Reglas de diligenciamiento · 6 Relación documental · firmas.
5. **Tabla de campos:** Campo | Tipo | Unidad | Valores permitidos | Oblig. | Definición | Ejemplo.
6. **Contaminantes:** lista cerrada `O3`, `NO`, `NO2`, `SO2`, `CO` (en CSV para pt_app, minúscula: `o3`, `no`, `no2`, `so2`, `co`, como en los CSV vigentes). Eliminar «u otro definido».
7. **Unidades:** `nmol/mol` (O3, NO, NO2, SO2) y `µmol/mol` (CO). SO2 en nmol/mol (D-03 decidida); el «ppm» de P-PSEA-13 es errata.
8. **Código de ronda:** `EA-PP2026-R1` (D-09, decidida), sin guion entre PP y el año, en documentos y ejemplos. Los CSV vigentes y calaire-app usan otro código: pendiente renombrar las carpetas de ronda y alinear la aplicación.
9. **Código de nivel en CSV:** se conserva la convención de pt_app `<nominal>-<unidad>` (p. ej. `90-nmol/mol`), presente en F-PSEA-08, 11 y 12.
10. **Cuadro de cargos (D-11, decidida)**, reemplaza los 7 cargos de P-PSEA-01 (ver guía §3): Coordinador EA · Profesional Calidad Aire · Profesional Proyectos · Profesional Infraestructura · Ingeniero Operativo · Profesional Gestión Calidad. Ya no existen Estadístico, Experto en calidad del aire ni Auxiliar Operativo. Correspondencia para los roles actuales:

| Rol actual en formatos | Cargo |
|---|---|
| Coordinación del PEA, Coordinador, Coordinador de ronda, Alta dirección del PEA, Responsable de ronda, Decisión designada, Responsable de talento humano | Coordinador EA |
| Responsable de calidad, Responsable SGC, Responsable del caso SGC | Profesional Gestión Calidad |
| Experto en calidad del aire, Estadístico, Analista PT, Responsable del informe, Soporte estadístico, Responsable técnico, Líder técnico, Revisor técnico | Profesional Calidad Aire |
| Responsable de compras, Soporte metrológico | Profesional Infraestructura |
| Auxiliar Operativo, Apoyo logístico, Estudiante Auxiliar | Ingeniero Operativo |
| Responsable de emisión, Recepcionista oficial | Profesional Proyectos (funciones exactas pendientes de confirmar) |

11. **Firmas (D-12, decidida):** REVISÓ = Profesional Gestión Calidad; APROBÓ = Coordinador EA, en todos los documentos.

---

## 1. Resumen por prioridad y lotes

| Lote | Prioridad | Formatos | Motivo | Bloqueado por |
|---|---|---|---|---|
| **L0** | Bloqueante | (procedimientos) | Aplicar D-01, D-02, D-03, D-06, D-07, D-08, D-10 y D-11 (decididas): P-PSEA-01 y F-PSEA-02 (2 h → 3 h por nivel); P-PSEA-04 y P-PSEA-10 a 13 (1 h 30 min y promedios de 30 min → 3 h, 3 promedios horarios y 10 min de estabilización entre niveles); P-PSEA-13 («ppm» → nmol/mol); P-PSEA-07 (criterio H/E de ISO 13528:2022). P-PSEA-01: cuadro de responsabilidades con los 6 cargos de D-11 y «mínimo 5 niveles» → cero + 4 niveles (D-08); P-PSEA-07 y P-PSEA-09: σpt = a·xpt + b (D-07); I-PSEA-01: alta en P-PSEA-02 y en el mapa, rol y cita de F-PSEA-01 corregidos (D-10). Además: corregir códigos en P-PSEA-01, 04 y 12; separar el texto de O3 de P-PSEA-04 | Aprobación del Coordinador EA; D-05 |
| **L1** | Alta | F-PSEA-08, 09, 10, 12, 04, 03 | Cadena de datos calaire-app → pt_app; la ronda no se evalúa sin ella | Renombrar carpetas y alinear la app (D-09) |
| **L2** | Alta | F-PSEA-07, 02, 11, 11A, 11B, 11C, 11D | Ítem de ensayo y H/E; F-PSEA-07 hoy es una copia de F-PSEA-02 | D-05; aprobación de D-06 en P-PSEA-07 |
| **L3** | Media | F-PSEA-01, 05, 06, 18 | Planificación y comunicación | L2 (niveles y tiempos) |
| **L4** | Media | F-PSEA-13 | Informe; depende de L1 y L2 | P-PSEA-09 corregido (D-07) |
| **L5** | Baja | F-PSEA-14, 15, 16, 17 | Registros de soporte SGC | P-PSEA-15 a 21 con contenido correcto (Hallazgo A), D-10b |

---

## 2. Fichas por formato

### LOTE 1 — Cadena de datos

#### F-PSEA-08 Datos reportados por participante
- **Mapa:** Implementado. **Origen:** P-PSEA-08, I-PSEA-02.
- **Archivos:** .docx, .md, .csv, .xlsx.
- **Problemas:**
  - el .docx se titula «Instrucciones - F-PSEA-08» y no define campos ni responsables (Hallazgo D);
  - `mean_h1..h3` se definen como «promedio horario o valor equivalente»: con D-02 deben ser estrictamente promedios horarios (P-PSEA-12 aún dice «tres valores promedio de 30 minutos»; B2, O2);
  - `pollutant` y `unit` terminan en «u otro definido»;
  - no tiene encabezado ni firmas;
  - `submitted_by` = `calaire-app` (sistema, no persona);
  - el CSV de ejemplo usa el código de ronda sin «EA-» y datos de CO.
- **Corrección (D-04, decidida):** el .docx es la ficha que especifica el registro digital: funciona como instructivo y conserva el código F-PSEA-08. El registro de cada ronda es el que guarda calaire-app. Mantener `mean_h1..h3` como promedios horarios (D-02) y quitar «o valor equivalente». Analitos cerrados a NO, NO2, CO, O3 y SO2. Diligencian: Sistema (calaire-app) y Participante; valida el Ingeniero Operativo.
- **Dependencias:** P-PSEA-12 corregido a 3 promedios horarios (D-02); P-PSEA-08 debe nombrar responsable y plazo de envío (Hallazgo D); unidad de CO pendiente de confirmar.
- **Archivo final:** `.docx` (ficha con función de instructivo) + registro en calaire-app (exportable `.csv`). El .xlsx sobra.
- **OUTPUT ESPERADO**

Estructura del .docx: encabezado · **1. INFORMACIÓN GENERAL** (OBJETIVO; ALCANCE: P-PSEA-08 e I-PSEA-02; CONDICIONES GENERALES) · **2. INFORMACIÓN ESPECÍFICA**: Tabla 1, reglas de captura, corrección y validación en calaire-app, salida F-PSEA-09 · firmas (REVISÓ Profesional Gestión Calidad; APROBÓ Coordinador EA).

**Tabla 1. Campos del registro**

| Campo | Lo diligencia | Definición | Ejemplo |
|---|---|---|---|
| round_id | Sistema | Código de ronda `EA-PPAAAA-Rn` | EA-PP2026-R1 |
| participant_id | Sistema | ID interno del participante (`p1…pn`) | p3 |
| Codigo_Lab | Sistema | Código anónimo publicado en el informe | p3 |
| pollutant | Participante | Analito, lista cerrada: no, no2, co, o3, so2 | o3 |
| level | Participante | Nivel nominal `<nominal>-<unidad>` de la Tabla 1 del procedimiento del gas | 90-nmol/mol |
| run | Participante | Serie 0…4 (cero + 4 niveles, D-08) | 2 |
| unit | Participante | nmol/mol (NO, NO2, O3, SO2); µmol/mol (CO, pendiente de confirmar) | nmol/mol |
| instrument | Participante | Marca y modelo del analizador; debe existir en F-PSEA-04 | `<marca modelo>` |
| mean_h1, mean_h2, mean_h3 | Participante | Promedio horario de cada una de las 3 h del nivel, sin los 10 min de estabilización. **En el nivel cero solo hay mean_h1**; h2 y h3 quedan vacíos | `<valor medido>` |
| mean_value | Sistema | Valor del nivel: media de mean_h1 a mean_h3 (cero: mean_h1) | `<valor medido>` |
| sd_value | Sistema | Desviación estándar de los promedios horarios (no aplica al cero) | `<valor medido>` |
| u_value | Participante | Incertidumbre estándar declarada (> 0) | `<valor medido>` |
| k_factor | Participante | Factor de cobertura (> 0) | 2 |
| u_exp | Sistema | u_value·k_factor | `<valor medido>` |
| n_hours | Sistema | Promedios horarios usados: 1 (cero), 3 (niveles) | 3 |
| hour_starts | Participante | Inicio de cada hora, `AAAA-MM-DD hh:mm` separados por `\|` | dato a definir (fecha de ronda) |
| submitted_at | Sistema | Fecha y hora de envío | dato a definir |
| submitted_by | Sistema | Usuario del Participante que envía | `<usuario>` |
| validation_status | Ingeniero Operativo | recibido, incompleto, observado, validado, rechazado | validado |
| observations | Ingeniero Operativo | Observaciones de la validación | — |

#### F-PSEA-09 Datos de participantes exportados para análisis PT
- **Mapa:** Implementado. **Origen:** P-PSEA-08, I-PSEA-03.
- **Archivos:** .md, .csv, .xlsx.
- **Problemas:**
  - `exported_by` = `calaire-app` (no es una persona);
  - exige consecutivo y aprobación, que la aplicación no tiene (Hallazgo D, DG-PSEA-02);
  - estado «enviado» sin definir;
  - no tiene encabezado.
- **Corrección:** `exported_by` = Profesional Calidad Aire (D-11). Agregar `approved_by` (Coordinador EA). Alinear con el botón real «Exportar CSV PT» (Hallazgo F, I-PSEA-03).
- **Dependencias:** F-PSEA-08 cerrado; P-PSEA-08 con responsable y plazo.
- **Archivo final:** `.csv` (una fila por exportación) + paquete exportado `.csv`.
- **OUTPUT ESPERADO**

| Columna | Tipo | Valores permitidos | Oblig. | Definición | Ejemplo |
|---|---|---|---|---|---|
| round_id | texto | EA-PPAAAA-Rn | Sí | Ronda | EA-PP2026-R1 |
| export_id | texto | `EXP-<ronda>-NNN` | Sí | Consecutivo de la exportación | EXP-EA-PP2026-R1-001 |
| exported_at | fecha-hora | AAAA-MM-DD hh:mm | Sí | Momento de generación | dato a definir |
| exported_by | texto | usuario con cargo Profesional Calidad Aire | Sí | Quien exporta | `<usuario>` |
| source_record | lista | F-PSEA-08 | Sí | Registro fuente | F-PSEA-08 |
| export_file | texto | `F-PSEA-09_<ronda>_<export_id>.csv` | Sí | Archivo generado | F-PSEA-09_EA-PP2026-R1_001.csv |
| schema_version | texto | v01… | Sí | Versión de columnas | v01 |
| n_participants | entero | ≥ 1 | Sí | Participantes | dato a definir |
| n_records | entero | ≥ 1 | Sí | Filas | dato a definir |
| pollutants_included | lista múltiple | o3, no, no2, so2, co separados por `\|` | Sí | Gases | o3 |
| checksum | texto | SHA-256 | Sí | Integridad (hoy es opcional; se propone obligatorio) | `<hash>` |
| status | lista | generado, validado, reemplazado, rechazado | Sí | Estado | validado |
| approved_by | texto | Coordinador EA | Sí | Aprobación | `<usuario>` |
| observations | texto | — | No | — | — |

#### F-PSEA-10 Registro de preprocesamiento de datos
- **Mapa:** Implementado. **Origen:** P-PSEA-08, I-PSEA-04.
- **Archivos:** .md, .csv, .xlsx.
- **Problemas:**
  - el .md es un instructivo («Instrucciones -», «pendiente de consolidación»);
  - `executed_by` = `pt_app`;
  - `reviewed_by` y `approved_by` vacíos;
  - pt_app no tiene control para F-PSEA-10 (Hallazgo F, I-PSEA-04).
- **Corrección:** ejecución por el Profesional Calidad Aire, revisión por el Profesional Gestión Calidad y aprobación por el Coordinador EA. Agregar `input_checksum` (vínculo con F-PSEA-09) y `rules_applied` (lista cerrada de reglas). La lista de reglas está en el .md y debe trasladarse.
- **Dependencias:** F-PSEA-09; I-PSEA-04 corregido con el orden real de botones.
- **Archivo final:** `.csv`.
- **OUTPUT ESPERADO** (columnas)

`run_id` (PRE-EA-PP2026-R1-001) · `round_id` (EA-PP2026-R1) · `input_file` (F-PSEA-09_EA-PP2026-R1_001.csv) · `input_checksum` · `input_rows` · `valid_rows` · `excluded_rows` · `excluded_detail` (participant_id/level/motivo separados por `|`) · `warning_count` · `error_count` · `rules_applied` (normalizacion_gas, unidades, niveles, duplicados, faltantes, no_numericos, fechas, promedios, incertidumbre) · `pt_app_version` · `ruleset_version` · `executed_at` · `executed_by` (Profesional Calidad Aire) · `output_files` (F-PSEA-12_…; F-PSEA-11A_…; F-PSEA-11B_…) · `status` (borrador, aprobado, reemplazado) · `reviewed_by` (Profesional Gestión Calidad) · `approved_by` (Coordinador EA) · `observations`.

#### F-PSEA-12 Datos oficiales consolidados para evaluación de aptitud
- **Mapa:** Implementado. **Origen:** P-PSEA-07, P-PSEA-08, I-PSEA-04.
- **Archivos:** .md, .csv, .xlsx.
- **Problemas:**
  - promedios horarios (`mean_h*`, `n_hours`): coinciden con D-02 y se conservan; P-PSEA-12 debe dejar de hablar de 30 min;
  - `source` = «ronda_participante» y `tipo` duplican información;
  - `instrument` contiene «p1» (es el ID, no el instrumento);
  - sin `round_id`;
  - los campos de control solo están en el .md.
- **Corrección:** agregar `round_id`. `instrument` debe llevar la marca y modelo de F-PSEA-04. Unificar `source`/`tipo` en `tipo` ∈ {participante, referencia}. Conservar `mean_h1..h3`, `n_hours` y `hour_starts` (contrato de columnas de pt_app; D-02 no exige cambios en el código).
- **Dependencias:** F-PSEA-10; P-PSEA-12 corregido según D-02.
- **Archivo final:** `.csv` (dataset) + `.csv` de control de una fila.
- **OUTPUT ESPERADO** (columnas del dataset; ejemplo de una fila de referencia O3)

| Columna | Valores / unidad | Ejemplo |
|---|---|---|
| round_id | EA-PPAAAA-Rn | EA-PP2026-R1 |
| pollutant | o3… | o3 |
| level | `<nominal>-<unidad>` | 90-nmol/mol |
| run | 0…4 | 2 |
| unit | nmol/mol, µmol/mol | nmol/mol |
| tipo | participante, referencia | referencia |
| participant_id | p1…pn, ref | ref |
| instrument | marca y modelo (F-PSEA-04) | dato a definir (analizador de referencia O3) |
| mean_h1..mean_h3 | decimal (unit), promedios horarios | `<valor medido>` |
| mean_value, sd_value, u_value | decimal (unit) | `<valor medido>` |
| k_factor | decimal | 2 |
| u_exp | decimal (unit) | `<valor medido>` |
| n_hours | 1 (cero), 3 (niveles) | 3 |
| hour_starts | AAAA-MM-DD hh:mm separados por `\|` | dato a definir |
| n_lab | entero | dato a definir |

Control: `round_id`, `dataset_file`, `run_id_F10`, `consolidated_at`, `consolidated_by` (Profesional Calidad Aire), `pt_app_version`, `n_rows`, `pollutants`, `status` (aprobado, con observaciones, reemplazado), `approved_by` (Coordinador EA).

#### F-PSEA-04 Anexo técnico de equipos e instrumentos
- **Mapa:** Implementado. **Origen:** P-PSEA-08, I-PSEA-03 (y F-PSEA-03 como fuente).
- **Archivos:** .md, .csv, .xlsx.
- **Problemas:**
  - el CSV es ancho (`Analizador_SO2`, `Analizador_CO`), sin O3, NO ni NO2, y no coincide con los campos mínimos del .md (formato largo);
  - «u otro definido»;
  - «Estado de calibración» es opcional, aunque P-PSEA-01 exige calibración multipunto;
  - el ejemplo usa «HORIBA APSA- 370» con un espacio de más.
- **Corrección:** pasar a formato largo, una fila por laboratorio y contaminante. Agregar la fecha del último certificado de calibración.
- **Dependencias:** F-PSEA-03.
- **Archivo final:** `.csv` (exportado) + `.xlsx` de presentación opcional.
- **OUTPUT ESPERADO**

| Columna | Tipo | Valores permitidos | Oblig. | Ejemplo |
|---|---|---|---|---|
| round_id | texto | EA-PPAAAA-Rn | Sí | EA-PP2026-R1 |
| Codigo_Lab | texto | REFERENCIA, p1…pn | Sí | p3 |
| pollutant | lista | o3, no, no2, so2, co | Sí | o3 |
| instrument_make | texto | — | Sí | `<marca>` |
| instrument_model | texto | — | Sí | `<modelo>` |
| serial_number | texto | — | Sí | `<serie>` |
| measurement_principle | texto | dato a definir (lista por gas) | No | dato a definir |
| calibration_date | fecha | AAAA-MM-DD | Sí | dato a definir |
| calibration_status | lista | vigente, vencido, no informado | Sí | vigente |
| range_max | decimal | unidad del gas | No | `<valor>` |
| unit | lista | nmol/mol, µmol/mol | Sí | nmol/mol |
| observations | texto | — | No | — |

#### F-PSEA-03 Registro de participación
- **Mapa:** Elaborado. **Origen:** P-PSEA-04, DG-PSEA-02, I-PSEA-02.
- **Archivos:** .docx, .md.
- **Problemas:**
  - «Requisitos_ingreso» es genérico (la aplicación exige PDF de seguridad social y ARL);
  - «Acepta_condiciones» es un solo campo (la aplicación tiene 3 declaraciones);
  - roles «Coordinación del PEA», «Responsable técnico» y «Responsable de calidad»;
  - «Analitos … u otros»;
  - sin tipos ni ejemplos.
- **Corrección:** tabla con tipo y valores; separar las declaraciones; roles de P-PSEA-01: Participante (diligencia), Profesional Proyectos (revisa completitud), Ingeniero Operativo (coherencia técnica), Profesional Gestión Calidad (conservación), Coordinador EA (aprueba la participación).
- **Dependencias:** I-PSEA-02 alineado con la interfaz (Hallazgo F).
- **Archivo final:** `.docx` (definición) + exportación `.csv` desde calaire-app.
- **OUTPUT ESPERADO** (secciones 4.1 a 4.4; campos nuevos o cambiados)

| Campo | Tipo | Valores permitidos | Oblig. | Ejemplo |
|---|---|---|---|---|
| Codigo_ronda | texto | EA-PPAAAA-Rn | Sí | EA-PP2026-R1 |
| Codigo_participante | texto | p1…pn | Sí | p3 |
| Estado_participacion | lista | invitado, inscrito, confirmado, retirado, no elegible, cerrado | Sí | confirmado |
| Analitos_participa | lista múltiple | O3, NO, NO2, SO2, CO | Sí | O3 |
| Declaracion_condiciones | sí/no | — | Sí | sí |
| Declaracion_confidencialidad | sí/no | — | Sí | sí |
| Declaracion_3 | sí/no | dato a definir (texto exacto de la tercera declaración en calaire-app) | Sí | sí |
| Soporte_seguridad_social | archivo PDF | por persona | Sí | `<archivo.pdf>` |
| Soporte_ARL | archivo PDF | por persona | Sí | `<archivo.pdf>` |
| Personal_autorizado | tabla | nombre, documento, cargo | Sí | `<Nombre>` |
| Equipos_declarados | ref. | genera F-PSEA-04 | Sí | ver F-PSEA-04 |

### LOTE 2 — Ítem de ensayo y homogeneidad/estabilidad

#### F-PSEA-07 Preparación y control del ítem
- **Mapa:** Implementado. **Origen:** P-PSEA-06.
- **Archivos:** .md, .xlsx.
- **Problemas:**
  - **el .xlsx es una copia de F-PSEA-02**: su encabezado dice «F-PSEA-02 … CRONORGAMA» y tiene corridas de 2 h (D-01 fija 3 h), con los valores en «-»;
  - el .md no registra lo que exige P-PSEA-12: fotómetro nivel 2, cero directo y cero a través del colector, puertos;
  - la «estabilización inicial» de P-PSEA-06 no tiene tiempo (Hallazgo D); D-01 fija 10 min entre niveles, que P-PSEA-06 debe recoger.
- **Corrección:** rehacer el .xlsx con su propio encabezado. Separar el valor programado (nominal) del valor observado en la referencia. Responsables: Ingeniero Operativo (genera el ítem y diligencia), Profesional Infraestructura (equipos y certificados del ítem), Profesional Calidad Aire (revisa).
- **Dependencias:** P-PSEA-06 con los 10 min de estabilización (D-01) y verificaciones; Tabla 1 de P-PSEA-12 con valores.
- **Archivo final:** `.xlsx`.
- **OUTPUT ESPERADO**

Hoja 1 «Control del ítem»: encabezado; datos de la ronda; equipos del ítem (generador de O3, fotómetro nivel 2, colector de vidrio, aire cero), con columnas ID, serie, certificado y vigencia.
Hoja 2 «Corridas»:

| Columna | Tipo | Unidad | Valores permitidos | Ejemplo |
|---|---|---|---|---|
| Ronda | texto | — | EA-PPAAAA-Rn | EA-PP2026-R1 |
| Gas | lista | — | O3, NO, NO2, SO2, CO | O3 |
| Serie | entero | — | 0…4 | 2 |
| Nivel | lista | — | Cero, Bajo, Medio-Bajo, Medio-Alto, Alto | Medio-Bajo |
| Concentración nominal | decimal | nmol/mol | Tabla 1 del procedimiento del gas | 90 |
| Fecha | fecha | — | AAAA-MM-DD | dato a definir |
| Hora inicio / Hora fin | hora | — | hh:mm | dato a definir |
| Estabilización previa | duración | min | 10 min antes de cada nivel 1 a 4; no cuenta en la duración ni en los promedios | 10 min |
| Duración | duración | h | 1 h (cero); 3 h por nivel (D-01) | 3 h |
| Media de referencia | decimal | nmol/mol | — | `<valor medido>` |
| Cero directo / Cero por colector | decimal | nmol/mol | — | `<valor medido>` |
| Desviación respecto al nominal | decimal | % | dato a definir (tolerancia) | `<calculado>` |
| Conforme | sí/no | — | — | sí |
| Registró | cargo | — | Ingeniero Operativo | Ingeniero Operativo |
| Observaciones | texto | — | — | — |

#### F-PSEA-02 Cronograma detallado
- **Mapa:** Actualizar. **Origen:** P-PSEA-04.
- **Archivos:** .xlsx (hojas Secuencia 1, Secuencia 2, Sheet2).
- **Problemas:**
  - corridas de 2 h (D-01 fija 1 h el cero y 3 h cada nivel, con 10 min de estabilización entre niveles) y 5 corridas por gas, cuando P-PSEA-12 tiene serie 0 a 4 (cero + 4 niveles); P-PSEA-01 habla de «mínimo de 5 niveles y un nivel cero»;
  - concentraciones en «-»;
  - SO2 en nmol/mol: correcto según D-03, se conserva;
  - errata «CRONORGAMA»; «O3 nmol/mnol» en Sheet2;
  - hoja sin nombre «Sheet2».
- **Corrección:** una hoja «Cronograma» por secuencia + una hoja «Niveles» que toma los niveles de los procedimientos P-PSEA-10 a 13. Columnas de responsable.
- **Dependencias:** D-08 (número de niveles); P-PSEA-01, 04 y 10 a 13 corregidos según D-01; Tablas 1 de P-PSEA-10 a 13 completas.
- **Archivo final:** `.xlsx`.
- **OUTPUT ESPERADO** — columnas de «Cronograma»: Día · Fecha (AAAA-MM-DD) · Hora inicio (hh:mm) · Duración (h) · Actividad (Instalación, Calibración multipunto, Cero/Span, Estabilización, Corrida) · Gas · Serie · Nivel · Concentración nominal · Unidad · Responsable (cargo). Ejemplo: `2.º | dato a definir | dato a definir | 3 h | Corrida | O3 | 2 | Medio-Bajo | 90 | nmol/mol | Ingeniero Operativo`.

**Cronograma tipo de una ronda O3, cero + 4 niveles** (EA-PP2026-R1; horas relativas al inicio de la serie 0, T0 = dato a definir; la estabilización no cuenta en las 3 h ni en los promedios):

| Serie | Nivel | Nominal (nmol/mol) | Actividad | Inicio | Fin | Duración | Promedios horarios |
|---|---|---|---|---|---|---|---|
| 0 | Cero | 0 | Corrida | T0 + 0:00 | T0 + 1:00 | 1 h | mean_h1 |
| — | — | — | Estabilización | T0 + 1:00 | T0 + 1:10 | 10 min | — |
| 1 | Bajo | 45 | Corrida | T0 + 1:10 | T0 + 4:10 | 3 h | mean_h1, mean_h2, mean_h3 |
| — | — | — | Estabilización | T0 + 4:10 | T0 + 4:20 | 10 min | — |
| 2 | Medio-Bajo | 90 | Corrida | T0 + 4:20 | T0 + 7:20 | 3 h | mean_h1, mean_h2, mean_h3 |
| — | — | — | Estabilización | T0 + 7:20 | T0 + 7:30 | 10 min | — |
| 3 | Medio-Alto | 135 | Corrida | T0 + 7:30 | T0 + 10:30 | 3 h | mean_h1, mean_h2, mean_h3 |
| — | — | — | Estabilización | T0 + 10:30 | T0 + 10:40 | 10 min | — |
| 4 | Alto | 180 | Corrida | T0 + 10:40 | T0 + 13:40 | 3 h | mean_h1, mean_h2, mean_h3 |

Total: 13 h 40 min (13 h de medición + 4 × 10 min de estabilización). Valor de cada nivel 1 a 4 = media de mean_h1, mean_h2 y mean_h3; valor del cero = mean_h1. Una estabilización previa al cero, si se requiere, la define P-PSEA-06 (dato a definir).

#### F-PSEA-11 Homogeneidad y estabilidad del ítem (registro principal)
- **Mapa:** Parcial. **Origen:** P-PSEA-06, P-PSEA-07; recibe 11A a 11D.
- **Archivos:** .md + 2 CSV + 2 xlsx.
- **Problemas:**
  - sin criterio de aceptación numérico (P-PSEA-07 no lo define; P-PSEA-12 lo da solo en forma cualitativa); D-06 fija ss ≤ 0.3·σpt y |x̄1 − x̄2| ≤ 0.3·σpt (ISO 13528:2022);
  - `replicate` y `sample_id` son vagos;
  - los datos de ejemplo son de CO;
  - en el CSV de estabilidad, `replicate` y `sample_id` se cruzan con los de homogeneidad.
- **Corrección:** el registro principal es una ficha de conclusión por gas y nivel. Los datos van en 11A/11B y los resultados en 11C/11D. Responsables: Profesional Calidad Aire (diseña, evalúa y registra), Ingeniero Operativo (genera el ítem y mide), Coordinador EA (aprueba el ítem).
- **Dependencias:** D-05; P-PSEA-07 con el criterio de D-06 elaborado por el Profesional Calidad Aire y aprobado por el Coordinador EA.
- **Archivo final:** `.docx` (conclusión) que referencia los CSV de 11A a 11D.
- **OUTPUT ESPERADO** — Tabla de conclusiones: Gas · Serie · Nivel · Nominal (nmol/mol) · σpt (nmol/mol) · Resultado H (ref. 11C) · Resultado E (ref. 11D) · u_hom (nmol/mol) · Límite H/E = 0.3·σpt (nmol/mol) · Conclusión (cumple, no cumple, cumple con observación) · Profesional Calidad Aire. Ejemplo: `O3 | 2 | Medio-Bajo | 90 | 2.8 | ver 11C | ver 11D | <calculado> | 0.84 | cumple | <usuario>`. Nota: σpt = a·xpt + b (D-07); para O3, σpt = 0.02·90 + 1 = 2.8 nmol/mol y 0.3·σpt = 0.84 nmol/mol, por la Ec 4 de P-PSEA-12 aplicada al nominal; en la práctica se calcula con xpt.

#### F-PSEA-11A / F-PSEA-11B Datos preprocesados de homogeneidad / estabilidad
- **Mapa:** Elaborar, aunque ya existen .docx v1.0. El mapa los rotula «Subformato H/E A/B» con textos mezclados («datos preprocesados y resultados»): corregir el mapa. **Origen:** P-PSEA-07, I-PSEA-04.
- **Problemas:**
  - «Nivel», «Réplica» y «Tiempo» son vagos (Hallazgo D, con el matiz D10: no fijar la serie 0-4 para todos los gases);
  - roles Analista PT, Revisor técnico y Responsable de ronda;
  - sin ejemplo.
- **Corrección:** campos concretos (puerto del colector, al menos 3, según P-PSEA-12 Tabla 6). Roles: Profesional Calidad Aire (genera), Ingeniero Operativo (verifica contra los datos crudos), Coordinador EA.
- **Dependencias:** D-05 (diseño de estabilidad: tiempos); criterio D-06 aprobado en P-PSEA-07.
- **Archivo final:** `.csv` de datos (contrato de pt_app) + ficha `.docx` única para 11A y 11B que define las columnas.
- **OUTPUT ESPERADO** (11A; 11B igual, con `time_point` en lugar de `port`)

| Columna | Tipo | Valores permitidos | Definición | Ejemplo |
|---|---|---|---|---|
| round_id | texto | EA-PPAAAA-Rn | Ronda | EA-PP2026-R1 |
| pollutant | lista | o3… | Gas | o3 |
| run | entero | serie del procedimiento del gas | Serie | 2 |
| level | texto | `<nominal>-<unidad>` | Nivel | 90-nmol/mol |
| replicate | entero | 1…n | Repetición de la lectura en el mismo puerto | 1 |
| sample_id / port | entero | 1…n (≥ 3 puertos) | Puerto del colector | 3 |
| time_point (11B) | fecha-hora | AAAA-MM-DD hh:mm | Momento de la lectura de estabilidad | dato a definir |
| value | decimal | nmol/mol | Lectura | `<valor medido>` |
| unit | lista | nmol/mol, µmol/mol | Unidad | nmol/mol |
| run_id_F10 | texto | PRE-… | Vínculo con F-PSEA-10 | PRE-EA-PP2026-R1-001 |

#### F-PSEA-11C / F-PSEA-11D Resultados de homogeneidad / estabilidad
- **Mapa:** Elaborar (existen .docx v1.0). **Origen:** P-PSEA-07, I-PSEA-04 (I-PSEA-05 los genera).
- **Problemas:**
  - «Estadistico_H/E» y «criterio definido en P-PSEA-07», que no existe;
  - la decisión «Requiere revisión» no tiene regla;
  - roles no definidos.
- **Corrección:** columnas con el estadístico de pt_app (ANOVA: ss, sw) y el criterio de D-06: homogeneidad ss ≤ 0.3·σpt; estabilidad |x̄1 − x̄2| ≤ 0.3·σpt. Se elimina «Requiere revisión»: la decisión es cumple / no cumple.
- **Dependencias:** **P-PSEA-07 debe incorporar el criterio H/E de D-06 elaborado por el Profesional Calidad Aire y aprobado por el Coordinador EA.**
- **Archivo final:** `.csv` exportado de pt_app + resumen en F-PSEA-11 (.docx).
- **OUTPUT ESPERADO** (11C)

| Columna | Unidad | Definición | Ejemplo |
|---|---|---|---|
| round_id, pollutant, run, level | — | Identificación | EA-PP2026-R1, o3, 2, 90-nmol/mol |
| n_ports, n_replicates | — | Diseño | ≥ 3; dato a definir |
| x_mean | nmol/mol | Media general | `<calculado>` |
| s_w | nmol/mol | Desviación dentro de puertos | `<calculado>` |
| s_s | nmol/mol | Desviación entre puertos | `<calculado>` |
| sigma_pt | nmol/mol | a·x + b (D-07; O3: 0.02·x + 1) | 2.8 (con x = 90) |
| criterion | texto | Fórmula del criterio (D-06) | s_s ≤ 0.3·sigma_pt |
| criterion_value | nmol/mol | Límite = 0.3·sigma_pt | 0.84 (con sigma_pt = 2.8) |
| decision | lista | cumple, no cumple | `<resultado>` |
| u_hom | nmol/mol | Aporte a u(xpt) (Ec 1) | `<calculado>` |
| analyzed_by / analyzed_at | — | Profesional Calidad Aire; AAAA-MM-DD hh:mm | `<usuario>` |

11D: igual estructura, con `x_first` (x̄1), `x_last` (x̄2), `diff` = |x̄1 − x̄2| (nmol/mol y %), `criterion` = `|x̄1 − x̄2| ≤ 0.3·sigma_pt`, `criterion_value` (0.84 con sigma_pt = 2.8) y `u_stab`.

### LOTE 3 — Planificación y comunicación

#### F-PSEA-01 Calendario global (Calendario Tipo)
- **Mapa:** Actualizar. **Origen:** P-PSEA-04.
- **Archivo:** .xlsx con 4 hojas (Ronda EA, Ronda EA - Prel, Prueba PrePiloto, Prueba Piloto).
- **Problemas:**
  - tres significados del código (Hallazgo B5: «Estado Instrumentos» en I-PSEA-01);
  - numeración de actividades que salta de 6 a 9;
  - duraciones mezcladas (meses y «3-4 días»);
  - fechas 1899/1900, es decir, fórmulas rotas;
  - hojas de piloto dentro del maestro.
- **Corrección:** una hoja maestra con duración en días y dependencia; las hojas de piloto se mueven al expediente de la ronda. Responsable por actividad.
- **Dependencias:** corregir en I-PSEA-01 la cita de F-PSEA-01 como «Estado instrumentos» (D-10, decidida); P-PSEA-01 debe citar «F-PSEA-01 Calendario global».
- **Archivo final:** `.xlsx`.
- **OUTPUT ESPERADO** — columnas: No · Actividad · Responsable (cargo) · Duración (días) · Predecesora · Desfase (días) · Fecha inicio · Fecha fin · Registro de salida (F-PSEA-xx). Actividades: 1 Anuncio (Profesional Proyectos, pendiente de confirmar; DG-PSEA-01) · 2 Expresión de interés · 3 Invitación formal · 4 Registro (F-PSEA-03) · 5 Alistamiento (F-PSEA-07) · 6 Instalación y calibración · 7 Ensayo · 8 Envío de resultados (F-PSEA-08) · 9 Análisis e informe preliminar · 10 Comentarios · 11 Informe final (F-PSEA-13). Duraciones: tomar las de la hoja «Ronda EA - Prel» o dato a definir. Ejemplo de fila: `7 | Ensayo | Ingeniero Operativo | dato a definir | 6 | 0 | … | … | F-PSEA-07`.

#### F-PSEA-05 Ficha básica de ronda
- **Mapa:** Elaborado. **Origen:** P-PSEA-04.
- **Problemas:**
  - plantilla vacía;
  - «Coordinación responsable»;
  - P-PSEA-14 lo llama plan de ronda (B6);
  - aprobación «Elaboró/Revisó/Aprobó» sin el rol de la guía;
  - no aparecen F-PSEA-11 ni F-PSEA-12.
- **Corrección:** encabezado; tabla de datos con valores permitidos; firmas según la guía.
- **Dependencias:** P-PSEA-14 debe citar F-PSEA-06 como plan.
- **Archivo final:** `.docx`.
- **OUTPUT ESPERADO** — campos: Código de ronda (EA-PP2026-R1) · Nombre (dato a definir) · Tipo (piloto, regular, extraordinaria) · Fechas apertura, medición y cierre (AAAA-MM-DD) · Sede (Laboratorio CALAIRE, Universidad Nacional de Colombia, Sede Medellín, según P-PSEA-01) · Coordinador EA (`<Nombre>`) · Estado (borrador, aprobada, en ejecución, cerrada) · Gases (O3) · N.º participantes previstos (dato a definir) · Ítem (atmósfera de O3 en aire cero, generador con fotómetro nivel 2, según P-PSEA-12) · Criterio (z/z' y En; |z| ≤ 2, |En| < 1) · Tabla de registros F-PSEA-01 a 13 con estado y ruta.

#### F-PSEA-06 Planificación de ronda
- **Mapa:** Elaborado. **Origen:** P-PSEA-04.
- **Problemas:**
  - las secciones 4, 9, 10 y 11 están vacías; la matriz A-U tiene 21 filas vacías (D8: aceptable en un maestro, pero sin guía de llenado);
  - roles en columnas no definidas («Coordinación EA», «Soporte metrológico / estadístico», «Apoyo logístico»).
- **Corrección:**
  - columnas de la sección 7 = los 6 cargos de D-11 + Participante;
  - sección 9 con la Tabla 1 del gas;
  - sección 10 con xpt, U(xpt) (Ec 1-3), σpt (a, b), z/z' según u(xpt) > 0.3σpt, y criterios;
  - matriz A-U con la columna «Dónde se cumple» (código del documento).
- **Dependencias:** L0 (P-PSEA-04 propio, corregido según D-01 y D-02), L2.
- **Archivo final:** `.docx`.
- **OUTPUT ESPERADO** — ejemplo de la sección 10 para O3: `Valor asignado: media de la referencia CALAIRE (P-PSEA-12) | σpt = a·xpt + b (O3: a = 0.02, b = 1 nmol/mol) | Puntaje: z si u(xpt) ≤ 0.3σpt, si no z' | En con k = 2 | Criterios: |z| ≤ 2 satisfactorio; 2 < |z| < 3 cuestionable; |z| ≥ 3 insatisfactorio; |En| < 1 satisfactorio`.

#### F-PSEA-18 Comunicación a participantes
- **Mapa:** Preliminar. **Origen:** P-PSEA-05.
- **Problemas:**
  - nombre y correo reales en la sección 8 (Hallazgo E);
  - roles «Coordinador de ronda», «Líder técnico», «Responsable de emisión»;
  - no está en la matriz P-PSEA-02 (B8);
  - P-PSEA-05 contiene una ficha y no el procedimiento (Hallazgo A).
- **Corrección:** sustituir los datos personales por `<Nombre>` y `<correo@dominio>`. Roles: Profesional Proyectos (emite), Coordinador EA (valida), Profesional Calidad Aire (contenido técnico), Profesional Gestión Calidad (verifica la confidencialidad). ID `COM-EA-PP2026-R1-NNN`.
- **Dependencias:** P-PSEA-05 reescrito; alta en P-PSEA-02.
- **Archivo final:** `.docx` (plantilla) + registro `.csv` de comunicaciones exportado de calaire-app.
- **OUTPUT ESPERADO** — campos actuales con tipos: ID (COM-EA-PP2026-R1-001) · Codigo_ronda · Fecha_emision (AAAA-MM-DD) · Emisor (cargo) · Destinatario (Codigo_participante, p. ej. p3; el nombre va solo en calaire-app) · Canal (correo institucional, calaire-app) · Asunto · Propósito (lista: convocatoria, invitación, instrucciones, cambio de fechas, solicitud de corrección, informe) · Acción requerida · Fecha límite · Adjuntos (códigos, p. ej. I-PSEA-01) · Evidencia de envío · Estado (borrador, emitida, respondida, cerrada, escalada).

### LOTE 4 — Informe

#### F-PSEA-13 Informe final de resultados
- **Mapa:** Implementado. **Origen:** P-PSEA-09 (además P-PSEA-05, 07 y 16 a 21; I-PSEA-05).
- **Problemas:**
  - la fuente es un documento de trabajo (`EA-PP2026-R1-1-z-4-2a.docx`);
  - faltan métrica, método y factor k (DG-PSEA-03; pt_app tiene los selectores `report_metric`, `report_method` y k);
  - P-PSEA-09 contiene planificación y se contradice con la σpt nIQR/MADe y el criterio zeta (B9).
- **Corrección:**
  - estructura de 14 secciones conservada, con encabezado de la guía;
  - sección «Tratamiento estadístico» con las Ec de P-PSEA-12 y la Tabla de criterios;
  - campo de declaración del k y del método;
  - declaración de subcontratación según ISO/IEC 17043:2023, 6.4.1.
- **Dependencias:** P-PSEA-09 reescrito con σpt = a·xpt + b (D-07); L1 y L2.
- **Archivo final:** `.docx` (maestro) → PDF emitido.
- **OUTPUT ESPERADO** — campos de portada y control: Código de informe (`F-PSEA-13_EA-PP2026-R1_v01`; dato a definir: convención) · Ronda · Gases (O3) · Fecha de emisión · Versión (preliminar / final) · Métrica (z, z', En) · Método del valor asignado (referencia CALAIRE) · k = 2 · σpt = a·xpt + b (O3: a = 0.02, b = 1 nmol/mol) · Profesional Calidad Aire (elabora) · Profesional Gestión Calidad (revisa) · Coordinador EA (autoriza; ISO/IEC 17043:2023, 6.4.1 c). Tabla de resultados por gas: Codigo_Lab · Serie · Nivel · x_i · u(x_i) · xpt · U(xpt) · σpt · z o z' · En · Evaluación.

### LOTE 5 — Registros de soporte SGC

#### F-PSEA-14 Queja o no conformidad
- **Mapa:** Elaborado. **Origen:** P-PSEA-15, P-PSEA-17, P-PSEA-03.
- **Problemas:**
  - «Preliminar — Revisar»;
  - el ID no tiene formato;
  - roles «Responsable del caso SGC», «Alta dirección»;
  - P-PSEA-15 y P-PSEA-17 tienen contenido equivocado (Hallazgo A);
  - P-PSEA-16 cita F-PSEA-15 como NC (B6).
- **Corrección:** ID `CASO-AAAA-NNN`; listas cerradas; roles: Profesional Gestión Calidad (registra y evalúa), Coordinador EA (aprueba el cierre).
- **Dependencias:** P-PSEA-15 y P-PSEA-17 reescritos; corregir la cita en P-PSEA-16.
- **Archivo final:** `.docx` (definición) + registro en calaire-app (`.csv`).
- **OUTPUT ESPERADO** — campos actuales + tipo: ID_caso (CASO-2026-001) · Fecha_recepcion · Canal (correo, teléfono, calaire-app, reunión) · Tipo (queja, TNC, NC, acción correctiva) · Origen (participante, auditoría interna, operación) · Referencia_ronda (EA-PP2026-R1) · Referencia_informe · Análisis_causa · Acción_inmediata · Acción_correctiva · Responsable (cargo) · Fecha_compromiso · Verificación_eficacia · Fecha_cierre · Estado (abierto, en seguimiento, cerrado, escalado). Plazos: dato a definir.

#### F-PSEA-15 Registro de apelaciones
- **Mapa:** Elaborado. **Origen:** P-PSEA-18, P-PSEA-03.
- **Problemas:**
  - sin campo de conflicto de interés;
  - ID APEL-AAAA-NNN, distinto del de F-PSEA-14;
  - roles «Recepcionista oficial», «Panel revisor», «Decisión designada»;
  - plazo no enlazado (15 días en P-PSEA-20; B12).
- **Corrección:** agregar `Declaracion_conflicto_interes` por cada miembro del panel y `Fecha_limite_respuesta`. Registro y gestión: Profesional Gestión Calidad; decisión: Coordinador EA. Panel: personas no involucradas en la decisión apelada (ISO/IEC 17043:2023); composición pendiente (D-10b).
- **Dependencias:** P-PSEA-18 con plazo y composición del panel (D-10b).
- **Archivo final:** `.docx` + registro `.csv`.
- **OUTPUT ESPERADO** — ID_apelacion (APEL-2026-001) · Fecha_recepcion · Codigo_Lab apelante (p3) · Decisión apelada · Ronda/informe (EA-PP2026-R1 / F-PSEA-13) · Fundamento · Requisitos formales (cumple/no cumple) · Miembros_panel (cargo) · Conflicto_interes (sí/no por miembro) · Análisis · Decisión (a favor, en contra, parcial) · Fecha_decision · Fecha_limite (pendiente D-10b: 15 días según P-PSEA-20, sin confirmar) · Estado.

#### F-PSEA-16 Matriz de competencia y autorización
- **Mapa:** Elaborado. **Origen:** P-PSEA-20, P-PSEA-03.
- **Problemas:**
  - «Preliminar — Mantener / Actualizar»;
  - «ID_rol» libre;
  - rol «Responsable de talento humano» (pasa a Coordinador EA, D-11);
  - P-PSEA-20 contiene «Comunicación PT» y cita F-PSEA-16 como quejas (B6).
- **Corrección:** filas = los 6 cargos de D-11; columnas = funciones autorizables. Designa y autoriza el Coordinador EA.
- **Dependencias:** P-PSEA-20 reescrito.
- **Archivo final:** `.xlsx`.
- **OUTPUT ESPERADO** — columnas: Cargo (lista de los 6 de D-11) · Persona · Formación requerida (dato a definir) · Evidencia · Experiencia requerida (dato a definir) · Autorizado para (preparar ítem, H/E, diseño estadístico, exportación a pt_app, metrología, evaluación de desempeño, autorizar informe, comunicar a participantes) · Fecha de autorización · Vigencia · Autorizó (Coordinador EA) · Estado (activo, en formación, suspendido, vencido). Ejemplo: `Profesional Calidad Aire | <Nombre> | dato a definir | … | evaluación de desempeño; H/E | dato a definir | … | Coordinador EA | activo`.

#### F-PSEA-17 Evaluación de proveedores críticos
- **Mapa:** Elaborado. **Origen:** P-PSEA-21, P-PSEA-03.
- **Problemas:**
  - «Restricciones de tercerización según ISO/IEC 17043» sin decir cuáles;
  - rol «Responsable de compras» (pasa a Profesional Infraestructura, D-11);
  - P-PSEA-21 contiene «Divulgación de Valores»;
  - P-PSEA-20 cita F-PSEA-17 como apelaciones.
- **Corrección:** citar ISO/IEC 17043:2023, 6.4.1 a) a c) (lista de actividades no tercerizables, tomada de P-PSEA-01). Tipos de servicio cerrados. Evalúa el Profesional Infraestructura; aprueba el Coordinador EA.
- **Dependencias:** P-PSEA-21 reescrito.
- **Archivo final:** `.xlsx`.
- **OUTPUT ESPERADO** — ID_proveedor (PROV-001) · Nombre · Tipo (MRC/cilindro, calibrador, generador de O3, calibración de fotómetro, software, mantenimiento, transporte) · Criterios (trazabilidad, acreditación, certificado) · Evidencia · Evaluación inicial (aprobado, condicional, rechazado) · Fecha · Vigencia · Reevaluación · Decisión actual · Alcance · Actividad excluida por 6.4.1 (sí/no). Ejemplo: `PROV-001 | <proveedor> | calibración de fotómetro | trazabilidad a SRP NIST o equivalente (P-PSEA-12, Tabla 6) | <certificado> | aprobado | …`.

---

## 3. Dependencias con procedimientos (hacer antes)

| Procedimiento | Corrección previa | Formatos que desbloquea |
|---|---|---|
| P-PSEA-01 | Códigos P-PSEA-10 a 13 y P-PSEA-09; «F-PSEA-01 Calendario global»; «dos (2) horas» → 1 h el cero, 3 h cada nivel y 10 min de estabilización (D-01); «mínimo 5 niveles» → cero + 4 niveles (D-08); cuadro de responsabilidades con los 6 cargos de D-11 | 01, 02, 07 y todos (cargos) |
| P-PSEA-04 | Reemplazar el texto de O3 por la planificación; mover el texto de O3 a P-PSEA-12 con 3 h por nivel y 3 promedios horarios (D-01, D-02) | 01, 02, 03, 05, 06 |
| P-PSEA-10 a 13 | Tabla 1: 1 h 30 min → 3 h por nivel y 10 min de estabilización; «tres valores promedio de 30 minutos» → «tres promedios horarios» (D-01, D-02); P-PSEA-13: «ppm» → nmol/mol (D-03) | 02, 07, 08, 12 |
| P-PSEA-12 | Tabla 1 con valores; Ec 5-7 editables; numeración de tablas; promedios horarios (D-02) | 07, 08, 11, 12, 13 |
| P-PSEA-07 | σpt = a·xpt + b, a y b por analito (D-07); criterio H/E de D-06 (ss ≤ 0.3·σpt; \|x̄1 − x̄2\| ≤ 0.3·σpt) elaborado por el Profesional Calidad Aire y aprobado por el Coordinador EA; σpt; criterio zeta | 11, 11A-D, 12, 13 |
| P-PSEA-06 | Estabilización de 10 min entre niveles (D-01); verificaciones | 07 |
| P-PSEA-08 | Responsable y plazo de exportación | 08, 09, 10 |
| P-PSEA-09 | Contenido de informe propio; σpt = a·xpt + b (D-07), sin nIQR/MADe | 13 |
| P-PSEA-05 | Contenido de comunicaciones | 18 |
| P-PSEA-15, 17, 18, 20, 21 | Contenido correcto (Hallazgo A) | 14 a 17 |
| P-PSEA-02 | Dar de alta F-PSEA-18 e I-PSEA-01 (D-10) | 18, 01 |
| I-PSEA-01 | Mantener (D-10): «Estudiante Auxiliar» → Ingeniero Operativo; quitar la cita de F-PSEA-01 como «Estado instrumentos» | 01, 04 |
| Carpetas de ronda y calaire-app | Renombrar al código EA-PP2026-R1 y alinear la aplicación (D-09, pendiente) | 08 a 12 |
| Mapa | Alta de I-PSEA-01 (D-10); rótulos de 11A-D; estado «Elaborar» frente a los .docx existentes | 11A-D |

---

## 4. Dudas para decisión del usuario

| ID | Duda | Opciones | Decisión o recomendación |
|---|---|---|---|
| **D-01** (decidida) | Duración por nivel | — | **Decidida:** cero 1 h; cada nivel 3 h; 10 min de estabilización entre niveles, fuera de las 3 h. Corregir P-PSEA-01, F-PSEA-02, P-PSEA-04 y P-PSEA-10 a 13. |
| **D-02** (decidida) | Periodo de promedio | — | **Decidida:** 3 promedios horarios por nivel (`mean_h1` a `mean_h3`; el cero, uno); valor del nivel = media de los 3. Se conservan las columnas de pt_app. |
| **D-03** (decidida) | Unidad de SO2 | — | **Decidida:** nmol/mol; el «ppm» de P-PSEA-13 es errata. |
| **D-04** (decidida) | F-PSEA-08 | — | **Decidida:** el .docx es la ficha que especifica el registro digital, con función de instructivo y código F; el registro de la ronda lo guarda calaire-app (estructura en la ficha F-PSEA-08). |
| **D-05** | Diseño de estabilidad | a) primera frente a última media de referencia en cada nivel (P-PSEA-12); b) diseño de pt_app (réplicas en el tiempo) | Recomendación, pendiente de confirmar: a, documentado en P-PSEA-07 con tiempos: dato a definir. |
| **D-06** (decidida) | Criterio H/E | — | **Decidida:** ISO 13528:2022, ss ≤ 0.3·σpt (homogeneidad) y \|x̄1 − x̄2\| ≤ 0.3·σpt (estabilidad). P-PSEA-07 lo elabora el Profesional Calidad Aire y lo aprueba el Coordinador EA. |
| **D-07** (decidida) | σpt | — | **Decidida:** σpt = a·xpt + b, con a y b por analito según P-PSEA-10 a 13. P-PSEA-09 deja nIQR/MADe y remite a P-PSEA-07. |
| **D-08** (decidida) | Número de niveles | — | **Decidida:** cero + 4 niveles. Corregir el «mínimo 5 niveles» de P-PSEA-01 y las 5 corridas de F-PSEA-02. |
| **D-09** (decidida) | Código de ronda | — | **Decidida:** `EA-PP2026-R1`, sin guion entre PP y el año. **Pendiente:** renombrar las carpetas de ronda y alinear calaire-app y los CSV. |
| **D-10** (decidida) | I-PSEA-01 | — | **Decidida:** se mantiene; alta en P-PSEA-02 y en el mapa; «Estudiante Auxiliar» → Ingeniero Operativo; F-PSEA-01 no es «Estado instrumentos». |
| D-10b | Plazo de apelación y panel | a) 15 días (P-PSEA-20) en P-PSEA-18 y F-PSEA-15; b) otro | **Pendiente.** Recomendación sin confirmar: a. Composición del panel: pendiente. |
| **D-11** (decidida) | Cuadro de cargos | — | **Decidida:** 6 cargos (guía §3; plan §0 regla 10). Compras y proveedores → Profesional Infraestructura; competencia y autorización → Coordinador EA; exportación a pt_app → Profesional Calidad Aire. **Pendiente:** funciones exactas del Profesional Proyectos. |
| **D-12** (decidida) | Firmas | — | **Decidida:** REVISÓ = Profesional Gestión Calidad; APROBÓ = Coordinador EA. Los registros técnicos (11C/D, 12) los elabora el Profesional Calidad Aire. |
| D-13 | Tolerancia nominal frente a referencia (F-PSEA-07) y concentraciones de NO, NO2, SO2 y CO | — | Recomendación, pendiente de confirmar: dato a definir por el Profesional Calidad Aire. |
| D-14 | Estabilización antes del cero | a) sin estabilización; b) definida en P-PSEA-06 | **Pendiente.** |
| D-15 | Unidad de CO | a) µmol/mol; b) otra | **Pendiente.** Los ejemplos usan µmol/mol provisionalmente. |

---

## Decisiones del usuario (2026-11-06)

- **D-01 Duración:** el nivel cero dura 1 h; cada nivel posterior, 3 h de medición. Entre niveles se dejan 10 min de estabilización, que no cuentan dentro de las 3 h ni entran en los promedios. Hay que corregir P-PSEA-01 y F-PSEA-02 (dicen 2 h) y P-PSEA-04 y P-PSEA-10 a 13 (dicen 1 h 30 min).
- **D-02 Promedios:** el cero da un promedio horario; cada nivel, 3 promedios horarios (`mean_h1`, `mean_h2`, `mean_h3`; las columnas se mantienen). El valor del nivel es la media de los 3. Hay que corregir P-PSEA-04 y P-PSEA-10 a 13 (dicen promedios de 30 min).
- **D-03 Unidad de SO2:** nmol/mol. El «ppm» de P-PSEA-13 es una errata.
- **D-06 Criterio H/E:** el de ISO 13528:2022, ss ≤ 0.3·σpt (homogeneidad) y |x̄1 − x̄2| ≤ 0.3·σpt (estabilidad). P-PSEA-07 lo elabora el Profesional Calidad Aire y lo aprueba el Coordinador EA (D-11).
- **Pendientes (estado inicial, superado por la segunda y tercera tanda):** D-04, D-05, D-07 a D-13 y D-10b.

La pregunta abierta (duración del nivel frente al número de promedios) queda cerrada por D-01 y D-02: niveles de 3 h con 3 promedios horarios.

### Decisiones del usuario (2026-11-06, segunda tanda)

- **D-04 F-PSEA-08:** el `.docx` es la especificación del registro, con carácter de instructivo. Los datos se diligencian en calaire-app y el registro de cada ronda es lo que guarda la aplicación.
- **D-10 I-PSEA-01:** se mantiene. Hay que darlo de alta en P-PSEA-02 y en el mapa, y corregir el rol que menciona y el formato F-PSEA-01 que cita.
- **D-07 σpt:** σpt = a·xpt + b, con a y b por analito según los procedimientos técnicos.
- **D-08 Niveles:** un cero y 4 niveles. Hay que corregir el «mínimo 5 niveles» de P-PSEA-01.
- **D-09 Código de ronda:** `EA-PP2026-R1`. Se reemplazan las variantes con guion tras PP y sin prefijo EA en documentos y carpetas; en la aplicación queda pendiente decidir.
- **D-11 Cargos, nueva lista (reemplaza los 7 cargos de P-PSEA-01):** Coordinador EA, Profesional Calidad Aire, Profesional Proyectos, Profesional Infraestructura, Ingeniero Operativo y Profesional Gestión Calidad. Faltan sus funciones y la reasignación del Estadístico y del Auxiliar Operativo.

### Decisiones del usuario (2026-11-06, tercera tanda, finales)

Aplicadas en todo el plan y en la guía:
- **D-04:** ficha .docx con función de instructivo y código F; registro en calaire-app; Tabla 1 «Campos del registro» (Campo | Lo diligencia | Definición | Ejemplo); salida F-PSEA-09; analitos NO, NO2, CO, O3, SO2; en el cero solo mean_h1.
- **D-07:** σpt = a·xpt + b, a y b por analito según P-PSEA-10 a 13.
- **D-08:** cero + 4 niveles; corregir P-PSEA-01.
- **D-09:** `EA-PP2026-R1`; pendiente renombrar carpetas de ronda y alinear la aplicación.
- **D-10:** I-PSEA-01 se mantiene; alta en P-PSEA-02 y en el mapa; rol y cita de F-PSEA-01 corregidos.
- **D-11:** cuadro de 6 cargos (guía §3); corrección del cuadro de responsabilidades de P-PSEA-01 en L0.
- **D-12:** REVISÓ = Profesional Gestión Calidad; APROBÓ = Coordinador EA.

**Pendientes:** D-05; D-10b (15 días, recomendación sin confirmar; composición del panel); D-13; estabilización antes del cero (D-14); funciones exactas del Profesional Proyectos; unidad de CO (D-15).
