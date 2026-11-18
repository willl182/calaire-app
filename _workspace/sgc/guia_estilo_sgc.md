# Guía de estilo de documentos del SGC del PEA CALAIRE — 2026-11-06

**Base única:** P-PSEA-01 Protocolo General EA_v2, P-PSEA-12 Procedimiento técnico O3 y el texto técnico de ozono que contiene hoy P-PSEA-04 (copia de 0P-PSEA-04 O3_v2). Todas las citas vienen de esas fuentes (.docx convertidos con pandoc).

**Uso:** aplica a procedimientos (P), instructivos (I), documentos generales (DG) y formatos (F). Para formatos, la sección 9 adapta las reglas.

---

## 1. Encabezado y pie

### 1.1 Encabezado de página (Word)

Las fuentes usan una tabla en el encabezado de Word con este contenido:

| Celda | Texto en la fuente |
|---|---|
| Entidad | `LABORATORIO DE CALIDAD DEL AIRE` |
| Código | `Código: P-PSEA-01` |
| Versión | `Versión: 01` |
| Título en mayúsculas | `PROTOCOLO GENERAL DE ENSAYO DE APTITUD PARA GASES CONTAMINANTES CRITERIO` |
| Paginación | `Página X de Y` (campos PAGE / NUMPAGES) |

Los formatos .xlsx (F-PSEA-01, F-PSEA-02) repiten el mismo bloque en las primeras filas: entidad, `Código F-PSEA-0x`, `Versión: 01`, `FORMATO DE …` y `Página 1 de 1`.

**Regla:** todo documento lleva estas cinco celdas. **Agregar una sexta celda `Fecha de vigencia: AAAA-MM-DD`**: ninguna fuente la tiene (defecto, ver §8).

### 1.2 Bloque de firmas (al final)

Texto literal de P-PSEA-01 y P-PSEA-12:

```
| REVISÓ |  | APROBÓ |  |
| ROL    |  | ROL    |  |
| FECHA  |  | FECHA  |  |
```

**Regla:** mantener el bloque al final, con dos columnas (REVISÓ / APROBÓ). En ROL va uno de los 6 cargos de §3. Siempre: REVISÓ = Profesional Gestión Calidad; APROBÓ = Coordinador EA (D-12, decidida).

---

## 2. Estructura y orden de secciones

Las tres fuentes siguen la plantilla de dos bloques numerados, cada uno dentro de una tabla de una columna:

```
1. INFORMACIÓN GENERAL DEL PROCEDIMIENTO
   OBJETIVO:
   ALCANCE:
   DEFINICIONES:            (lista numerada, término en negrita + definición)
   DOCUMENTOS DE REFERENCIA: (lista numerada: normas primero, luego P, F, I, DG)
   CONDICIONES GENERALES:
2. INFORMACIÓN ESPECÍFICA DEL PROCEDIMIENTO
   Título 1 (etapa)  > Título 2 (actividad) > Título 3 (detalle)
[bloque REVISÓ / APROBÓ]
```

Orden de etapas en P-PSEA-01: Preparación del ítem → Instalación, verificación y desmontaje → Desarrollo del EA → Envío de registros → Análisis y reporte.
Orden en P-PSEA-12 / P-PSEA-04 (O3): Preparación del ítem → Generación de niveles (Tabla 1) → Homogeneidad y estabilidad → Procesamiento de datos → Valores atípicos → Evaluación del desempeño (xpt, U(xpt), σpt, criterios) → Presentación gráfica → Contenido del informe.

**Reglas:**
- Las cinco etiquetas del bloque 1 van en MAYÚSCULAS, en negrita y terminadas en dos puntos.
- OBJETIVO en una o dos frases, que termina en la norma: «Esto se hace en estricto cumplimiento con la norma internacional ISO/IEC 17043:2023.»
- ALCANCE en una frase que dice desde dónde hasta dónde: «El procedimiento abarca todo el proceso desde la determinación de los niveles del ítem de ensayo y el procedimiento para la evaluación de la competencia para el gas ozono.»
- CONDICIONES GENERALES no puede quedar vacía (en las tres fuentes lo está; ver §8).

---

## 3. Cargos (cuadro de cargos D-11, reemplaza los 7 roles de P-PSEA-01)

Únicos nombres permitidos para personal de CALAIRE, con esta grafía exacta:

| # | Cargo (grafía exacta) | Responsabilidad |
|---|---|---|
| 1 | **Coordinador EA** | Dirige el PEA; designa y autoriza al personal (competencia, F-PSEA-16); aprueba documentos e informes. |
| 2 | **Profesional Calidad Aire** | Experto técnico. Además: diseño estadístico (P-PSEA-07), procesamiento en pt_app, homogeneidad y estabilidad (F-PSEA-11) y exportación de datos de calaire-app a pt_app, con aprobación del Coordinador EA. |
| 3 | **Profesional Proyectos** | Comunicación con participantes e inscripción. Funciones exactas: dato a definir (pendiente de confirmar). |
| 4 | **Profesional Infraestructura** | Equipos y metrología (calibrador, cilindros, analizadores de referencia, certificados); compras y proveedores críticos (P-PSEA-21, F-PSEA-17); instalaciones y sala (condiciones ambientales, colector, energía, acceso). |
| 5 | **Ingeniero Operativo** | Generación del ítem en la ronda, montaje, recepción de equipos de participantes (I-PSEA-01), apoyo durante la ronda y validación de los datos recibidos en F-PSEA-08. |
| 6 | **Profesional Gestión Calidad** | SGC, control documental, NC, quejas y apelaciones. |

Fuera de CALAIRE: **Participante** (personal del laboratorio participante) y **Organizador** (CALAIRE como laboratorio). En registros digitales, **Sistema** (calaire-app o pt_app) para los campos que llena la aplicación.

**No usar:** Coordinador (sin «EA»), Profesional de Proyectos, Profesional de Gestión de Calidad, Estadístico, Experto en calidad del aire, Auxiliar Operativo, Coordinación del PEA, Director del Proyecto, Responsable SGC, Responsable de calidad, Líder técnico, Responsable técnico, Analista PT, Revisor técnico, Responsable de compras, Recepcionista oficial, Estudiante Auxiliar, Alta dirección del PEA, Responsable de talento humano. P-PSEA-01 aún trae los 7 cargos antiguos: su cuadro de responsabilidades se corrige en el lote L0 del plan. Correspondencia en el plan (§ Reglas transversales).

---

## 4. Tono y tiempo verbal

Lo que hacen las fuentes:
- **Presente de indicativo, impersonal o con CALAIRE como sujeto**, para describir lo que ocurre: «CALAIRE procesa los resultados de las mediciones de cada laboratorio…»; «El valor asignado para cada serie de concentración es la media de las mediciones…».
- **«deben» + infinitivo** para obligaciones del participante: «Los laboratorios deben informar tres valores promedio de 30 minutos, más la incertidumbre asociada, para cada compuesto y nivel de concentración.» (Se cita por la construcción verbal; el contenido cambia por D-01/D-02: «tres promedios horarios».)
- **Futuro** para compromisos del organizador: «El laboratorio CALAIRE como organizador del ensayo de aptitud proveerá: …».
- **«se» impersonal** para el método: «Se determina al estimar la media de…»; «Se considera satisfactorio.»

**Reglas:**
- Obligación → «debe». Permiso → «puede». Prohibición → «no debe» / «se prohíbe».
- Cada actividad nombra: cargo responsable + acción + registro (código F) + momento o plazo.
- Evitar adjetivos de énfasis («estricta», «crucial», «inequívoca») salvo en citas.
- Tercera persona; nunca «nosotros» ni «usted».

---

## 5. Citas de normas y documentos

**Normas — formato único:** `ISO/IEC 17043:2023` e `ISO 13528:2022`, con el numeral cuando aplique: «El numeral 6.4.1 de la norma ISO/IEC 17043:2023, establece…».
- Cita textual de norma: entre comillas dobles y en párrafo propio, como en P-PSEA-01 (6.4.1).
- Normas técnicas de O3 que usa P-PSEA-12 (Tabla 6): USEPA 40 CFR Part 50 App. D, EN 14625, USEPA QA Handbook, 40 CFR Part 58 App A, Protocolo AQUILA. Citar con esa forma.

**Documentos internos — formato:** `<código> <título vigente>` la primera vez; luego solo el código. Ejemplo de la fuente: «I-PSEA-01 Instructivo de Embalaje y Transporte».
- El código y el título deben ser los de la matriz P-PSEA-02 y el mapa, no los antiguos.
- Para formatos: «registrado en el Formato F-PSEA-01 Calendario Tipo» es la construcción de la fuente; usarla con el título vigente.

---

## 6. Tablas, ecuaciones, unidades y criterios

### 6.1 Tablas
- Título encima, en negrita, numerado y con punto: «**Tabla 1. Concentraciones referencia para O3**».
- Fila de encabezado en negrita. Unidad en el encabezado o en nota al pie con asterisco: «\*Todas las concentraciones en la tabla son nominales expresadas en nmol/mol».
- Numeración correlativa sin saltos ni repeticiones dentro del documento.

Ejemplo correcto (Tabla 1 de O3 de P-PSEA-04, con los tiempos corregidos según D-01; la fuente dice 1 h 30 min):

| Serie | Nivel de Concentración | Concentración Nominal O3 | Tiempo corrida |
|---|---|---|---|
| 0 | Cero | 0 | 1 h |
| 1 | Bajo | 45 | 3 h |
| 2 | Medio-Bajo | 90 | 3 h |
| 3 | Medio-Alto | 135 | 3 h |
| 4 | Alto | 180 | 3 h |

\*Concentraciones nominales en nmol/mol. Entre niveles se dejan 10 min de estabilización, que no forman parte del tiempo de corrida ni de los promedios.

**Regla de corrida (D-01, D-02):** nivel cero = 1 h y un promedio horario; cada nivel posterior = 3 h de medición y 3 promedios horarios (`mean_h1`, `mean_h2`, `mean_h3`); valor del nivel = media de los 3 promedios horarios. Todo procedimiento de gas (P-PSEA-10 a 13) y todo formato de tiempos (F-PSEA-02, F-PSEA-07) debe usar estos tiempos.

### 6.2 Ecuaciones
- Ecuación en línea propia, con rótulo a la derecha «Ec N» correlativo: `σpt = a·xpt + b    Ec 4` (D-07: a y b por analito, según P-PSEA-10 a 13).
- Después, «Donde:» y una línea por símbolo: «**ucal**: Incertidumbre del gas de calibración y del sistema de dilución.»
- Escribir la ecuación como texto o editor de ecuaciones de Word, **no como imagen** (Ec 5 a Ec 7 de P-PSEA-12 se pierden al convertir).

### 6.3 Unidades y criterios numéricos
- Unidades SI de fracción de cantidad: `nmol/mol` (O3, NO, NO2, SO2), `µmol/mol` (CO; unidad de CO pendiente de confirmar). No usar ppb/ppm. SO2 en nmol/mol (D-03): el «ppm» de P-PSEA-13 es errata.
- Cifra y unidad separadas por un espacio; decimal con punto, como en las fuentes (`0.02`, `k=2`).
- Duraciones: «1 h», «3 h», «10 min»; números en palabra y cifra solo si la fuente lo hace («dos (2) horas»).
- Criterios con símbolo matemático y sin ambigüedad: `|z| ≤ 2`, `2 < |z| < 3`, `|z| ≥ 3`, `|En| < 1`, `|En| ≥ 1`, `u(xpt) > 0.3·σpt`; homogeneidad `ss ≤ 0.3·σpt` y estabilidad `|x̄1 − x̄2| ≤ 0.3·σpt` (ISO 13528:2022, D-06).
- Mínimos explícitos: «al menos 3 puertos diferentes del colector», «cero + 4 niveles» (D-08; no «mínimo 5 niveles»), «20 lecturas consecutivas».

---

## 7. Nivel de detalle

Lo bueno de P-PSEA-12 que debe imitarse:
- Tabla de niveles con serie, nombre, concentración, unidad y tiempo.
- Coeficientes explícitos: «O3 | a = 0.02 | b = 1 nmol/mol».
- Tabla de componentes de incertidumbre con cuatro columnas: componente, dato a recolectar, frecuencia, fuente.
- Criterios de desempeño en tabla con indicador, criterio e interpretación.

Lo que falta en las fuentes y debe exigirse: responsable (cargo), registro (F-PSEA-xx) y plazo por actividad.

---

## 8. Defectos de las fuentes que NO deben imitarse

| # | Defecto | Dónde | Corrección |
|---|---|---|---|
| 1 | Encabezado sin fecha; nombre de archivo «_v2» pero «Versión: 01». | P-PSEA-01 | Versión del encabezado = versión real; agregar fecha. |
| 2 | Código del encabezado distinto al del documento (P-PSEA-12 dice «P-PSEA-04»). | P-PSEA-12 | Código del encabezado = código del archivo. |
| 3 | Códigos obsoletos: P-PSEA-02 a 05 por analito, P-PSEA-06 como informe. | P-PSEA-01, P-PSEA-12 | Usar P-PSEA-10 a 13 y P-PSEA-09. |
| 4 | «dos (2) horas para cada nivel» frente a 1 h 30 min de la Tabla 1; ninguna es la vigente. | P-PSEA-01, F-PSEA-02, P-PSEA-04, P-PSEA-10 a 13 | Cero 1 h; cada nivel 3 h; 10 min de estabilización entre niveles (D-01). |
| 5 | «tres valores promedio de 30 minutos» y «3 concentraciones promedio de una hora» en el mismo texto. | P-PSEA-04 / P-PSEA-10 a 13 | Tres promedios horarios por nivel; valor del nivel = su media (D-02). |
| 6 | Columna de concentraciones vacía en la Tabla 1. | P-PSEA-12 | Toda tabla de niveles con valores. |
| 7 | Numeración de tablas rota: Tabla 1, luego «Tabla 6», «Tabla 5», «Tabla 6». | P-PSEA-12 | Numerar en orden. |
| 8 | Tabla 5 titulada «Parámetros … para la determinación de la incertidumbre», pero contiene a y b de σpt. | P-PSEA-12 | Título que describa el contenido. |
| 9 | Ecuaciones como imagen (Ec 5–7 vacías); Ec 3 incluye uEC sin definir en «Donde:». | P-PSEA-12 | Ecuación editable; definir todo símbolo. |
| 10 | Mezcla de símbolos: σpt / σp, xpt / Xref / X. | P-PSEA-12 | Un símbolo por magnitud (σpt, xpt, u(xpt), U(xpt)). |
| 11 | Normas citadas de 4 formas: «ISO-IEC 17043:2023», «ISO/IEC 17043:2023», «ISO 17043:2023», «ISO 13528:2015/2022». | todas | `ISO/IEC 17043:2023`, `ISO 13528:2022`. |
| 12 | Remisión a «Sección 5.3 / 5.4» sin decir de qué documento. | P-PSEA-12 | «ISO 13528:2022, 5.3» (verificar numeral). |
| 13 | Criterio de homogeneidad sin cifra («inferiores al valor crítico … o a las diferencias máximas especificadas»); estabilidad «dentro de los umbrales porcentuales o absolutos». | P-PSEA-12 | `ss ≤ 0.3·σpt` y `|x̄1 − x̄2| ≤ 0.3·σpt` (ISO 13528:2022, D-06), elaborado por el Profesional Calidad Aire y aprobado por el Coordinador EA en P-PSEA-07. |
| 14 | Lista de definiciones con ítem vacío y una definición convertida en título («Ítem de ensayo»). | P-PSEA-01 | Lista numerada continua. |
| 15 | Anglicismos y comillas sueltas: «blunders», «En-score», «manifold» alternando con «colector». | P-PSEA-12, P-PSEA-01 | «errores groseros»; «puntuación En»; elegir «colector de distribución» y mantenerlo. |
| 16 | Erratas: «ppm» por nmol/mol en SO2 (P-PSEA-13, D-03), «.elaboradas», «se consigan», «La mezcla de prueba se preparan», «deben de realizar», «CRONORGAMA» (F-PSEA-02). | varias | Revisión ortográfica antes de aprobar. |
| 17 | CONDICIONES GENERALES vacía. | las tres | Llenar o eliminar la etiqueta. |
| 18 | Referencia sin código («procedimientos internos de CALAIRE para la imparcialidad»). | P-PSEA-01 | Citar código (P-PSEA-15, P-PSEA-19…). |
| 19 | Rol genérico «El personal técnico del EA», «El personal operativo». | P-PSEA-01 | Cargo de §3. |

---

## 9. Adaptación a formatos (F-PSEA)

1. Encabezado §1.1 con «FORMATO DE …» como título. Sin campos «Estado: Preliminar», «Clase: Ficha preliminar» ni «pendiente de consolidación» en el maestro aprobado.
2. Secciones mínimas: 1. Objetivo · 2. Alcance y procedimiento que lo origina · 3. Responsables (cargos §3) · 4. Campos · 5. Reglas de diligenciamiento · 6. Relación documental · bloque REVISÓ / APROBÓ.
3. Tabla de campos con columnas fijas: **Campo | Tipo | Unidad | Valores permitidos | Obligatorio | Definición | Ejemplo**. Excepción: la ficha que especifica un registro digital (F-PSEA-08, D-04) usa la estructura de 9.1.
4. Nombres de campo: un solo estilo por formato. Los formatos .csv que consume pt_app conservan los nombres en inglés y minúscula (`pollutant`, `level`…) porque son el contrato con el aplicativo; los .docx usan `Nombre_Campo` en español.
5. Listas cerradas, nunca «u otro definido». Analitos: `NO`, `NO2`, `CO`, `O3`, `SO2`.
6. Fechas `AAAA-MM-DD`; fecha-hora `AAAA-MM-DD hh:mm` (hora local).
7. Ejemplos sin nombres, correos ni teléfonos reales; usar `<Nombre>`, `<correo@dominio>`.
8. Código de ronda en ejemplos: `EA-PP2026-R1` (D-09), sin guion entre PP y el año.

### 9.1 Ficha de registro digital (D-04; modelo F-PSEA-08)

El .docx conserva el código F y funciona como instructivo; el registro de la ronda es el que guarda calaire-app. Estructura:

```
[encabezado §1.1]
1. INFORMACIÓN GENERAL
   OBJETIVO:  ALCANCE:  CONDICIONES GENERALES:
2. INFORMACIÓN ESPECÍFICA
   Tabla 1. Campos del registro
     Campo | Lo diligencia (Sistema / Participante / cargo) | Definición | Ejemplo
   Reglas de diligenciamiento y validación
   Salida: F-PSEA-09
[bloque REVISÓ / APROBÓ]
```

---

## 10. Hacer / no hacer

| Hacer | No hacer |
|---|---|
| Encabezado de 5 celdas + fecha; bloque REVISÓ / APROBÓ con ROL y FECHA. | Dejar código antiguo en el encabezado de Word. |
| Bloque 1 con OBJETIVO, ALCANCE, DEFINICIONES, DOCUMENTOS DE REFERENCIA, CONDICIONES GENERALES. | Dejar etiquetas vacías. |
| Nombrar uno de los 6 cargos de §3 (D-11). | «Estadístico», «Auxiliar Operativo», «Responsable técnico», «Analista PT», «Coordinación del PEA». |
| `ISO/IEC 17043:2023, 6.4.1`; `ISO 13528:2022`. | «ISO 17043», «ISO-IEC 13528», «2015/2022». |
| Código + título vigente del documento interno. | P-PSEA-02…06 en su sentido antiguo. |
| «Tabla N. Título» encima; numeración correlativa. | Saltar o repetir números de tabla. |
| Ecuación editable + «Ec N» + «Donde:». | Ecuación como imagen o símbolos sin definir. |
| nmol/mol, µmol/mol; `|z| ≤ 2`, `|En| < 1`. | ppb/ppm; «aproximadamente», «adecuado» sin cifra. |
| «debe» para obligación, presente para descripción. | Tono publicitario o enfático. |
| Escribir «dato a definir» cuando falte un valor técnico. | Inventar o copiar un valor de otro gas. |
