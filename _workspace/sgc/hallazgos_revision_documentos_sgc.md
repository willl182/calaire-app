# Hallazgos de la revisión de documentos del SGC (fuente: .docx) — 2026-11-06

**Fuente:** los `.docx` vigentes de `Z:\calaire-ea_sgc\01_bloque_general\`, convertidos con pandoc. Este informe reemplaza la versión anterior, que revisaba los `.md` de `calaire-app/docs`; esos `.md` no son la versión válida.

**Cómo se revisó:** con dos subagentes (Haiku 5.5, esfuerzo bajo), en modo solo lectura.

**Criterio de estilo:** P-PSEA-01 (Protocolo General EA v2) y los procedimientos técnicos P-PSEA-10 (NO-NO2), P-PSEA-11 (CO), P-PSEA-12 (O3) y P-PSEA-13 (SO2). Sus rasgos:
- cargos fijos: Coordinador, Estadístico, Ingeniero Operativo, Profesional de Gestión de Calidad, Auxiliar Operativo;
- cifras de corrida: 1 h 30 min por nivel, tres promedios de 30 min;
- umbrales: |z| ≤ 2, |En| < 1;
- tablas numeradas.

**Pendiente:** validación cruzada. Los hallazgos no se han comprobado uno por uno.

## A. Contenido que no corresponde con el código o el título

| Doc | Debería ser | Contiene |
|---|---|---|
| DG-PSEA-01 | Protocolo de participación | Solo el bloque de firmas. P-PSEA-01 le da dos títulos distintos. |
| P-PSEA-04 | Planificación de ronda | Texto técnico de ozono |
| P-PSEA-05 | Comunicaciones | Ficha de instrucciones, "pendiente de creacion como maestro" |
| P-PSEA-09 | Generación/emisión del informe | Texto de planificación de ronda |
| P-PSEA-15 | Trabajo no conforme / NC | "Mejora Continua del PEA" |
| P-PSEA-16 | Divulgación de valores sensibles | "No Conformidades y Acciones Correctivas" |
| P-PSEA-17 | Quejas | "Auditorías Internas del PEA" |
| P-PSEA-19 | Confidencialidad | "Monitoreo de Imparcialidad" |
| P-PSEA-20 | Competencia y autorización | "Comunicación PT" (v0.1 skeleton) |
| P-PSEA-21 | Proveedores críticos | "Divulgación de Valores" |
| P-PSEA-23 | Mejora continua | Reservado, sin contenido |

## B. Contradicciones entre documentos

1. **Duración por nivel:** P-PSEA-01 da "dos (2) horas para cada nivel". P-PSEA-10 a 13 dan 1 h 30 min por nivel y 1 h para el cero.
2. **Promedios:** F-PSEA-08 usa promedios *horarios* (mean_h1 a h3). P-PSEA-12 y 13 usan tres promedios de 30 min.
3. **Subcontratación:** P-PSEA-01 dice que "podrán subcontratarse". El texto de P-PSEA-09 la prohíbe (ISO 17043, 6.4.1).
4. **Códigos obsoletos en P-PSEA-01:**
   - los procedimientos por analito figuran como P-PSEA-02 a 05; los vigentes son P-PSEA-10 a 13;
   - el informe figura como P-PSEA-06; debería ser P-PSEA-09.

   P-PSEA-04 y P-PSEA-10 a 13 también citan P-PSEA-06 como informe.
5. **F-PSEA-01 tiene tres significados:**
   - "Calendario Tipo" en P-PSEA-01;
   - "Calendario global" en catalog.ts;
   - "Estado Instrumentos" en I-PSEA-01.

   Además, P-PSEA-01 y 09 llaman F-PSEA-01 al cronograma, y la matriz usa F-PSEA-02.
6. **Formatos cruzados:**

   | Código | Según la matriz | Según otros documentos |
   |---|---|---|
   | F-PSEA-15 | Apelaciones | NC (P-PSEA-16) |
   | F-PSEA-16 | Competencia | Quejas (P-PSEA-20) |
   | F-PSEA-17 | Proveedores | Apelaciones (P-PSEA-20) |
   | F-PSEA-05 | Ficha básica | Plan de ronda (P-PSEA-14; el plan es F-PSEA-06) |

7. **Colusión:** la matriz la asigna a P-PSEA-14 y el texto de P-PSEA-09 la asigna a P-PSEA-08. P-PSEA-23 invierte P-PSEA-15 y P-PSEA-17.
8. **I-PSEA-01:** la matriz lo marca como "Reservado / fuera del mapa", pero el archivo existe y P-PSEA-01 y 09 lo exigen. F-PSEA-18 existe y no está en la matriz.
9. **σpt:**
   - P-PSEA-01 y P-PSEA-10 a 13 usan a·X_ref + b.
   - P-PSEA-09 usa nIQR/MADe.
   - P-PSEA-09 cita un criterio Zeta que no aparece en otro documento.
10. **ISO 13528:** se cita como 2022 en general y como 2023 en P-PSEA-09.
11. **Rango de SO2:** P-PSEA-09 da 0 a 500 nmol/mol. P-PSEA-13 da niveles de 40 a 180 "ppm".
12. **Plazo de apelación:** P-PSEA-18 dice "plazo definido por el PEA". P-PSEA-20 da 15 días.
13. **Roles:** P-PSEA-01 define 7 cargos, pero en los documentos aparecen otros que no define:
    - Coordinación: "Coordinador EA", "Coordinación del PEA", "Director del Proyecto".
    - Calidad: "Responsable SGC", "Responsable de calidad".
    - Otros: "Líder técnico", "Responsable técnico", "Analista PT", "Responsable de compras", "Recepcionista oficial", "Estudiante Auxiliar".
14. **Clases de evidencia:** P-PSEA-08 usa 4 clases y P-PSEA-03 usa 5.

## C. Códigos citados sin archivo

- **Sin documento:** F-PSEA-19 (lo cita P-PSEA-17), F-PSEA-22 (P-PSEA-19), I-PSEA-09 (P-PSEA-20) y P-PSEA-26 (P-PSEA-21).
- **Sin maestro .docx, pero en catalog.ts:** F-PSEA-01, 02, 04, 07, 09, 10, 11 y 12.

## D. Texto genérico (sin cargo, registro, plazo o criterio)

- **P-PSEA-07 (genérico):**
  - "Definir o confirmar el valor asignado…" no da fórmula; los coeficientes a y b ya están en P-PSEA-10 a 13 y no se trasladan.
  - "Evaluar homogeneidad y estabilidad…" no da criterio.
- **P-PSEA-14 (genérico):** "coincidencias anómalas" no tiene umbral.
- **P-PSEA-06:** "estabilizacion inicial" no tiene tiempo; "estado metrologico" no dice qué verificar.
- **P-PSEA-03:** la validación "antes del cierre" no tiene plazo. Usa roles que no están en P-PSEA-01.
- **P-PSEA-08:** "Exportar desde calaire-app…" no dice responsable ni plazo.
- **P-PSEA-18:** la composición del panel es "con imparcialidad", sin miembros definidos.
- **P-PSEA-02:** "Mantener / revisar al cierre" no tiene fecha ni responsable.
- **F-PSEA-05, F-PSEA-06 (secciones 4, 9, 10 y 11; la matriz A-U tiene 21 filas vacías) y F-PSEA-16 y 17:** son plantillas sin aterrizar.
- **F-PSEA-11C y 11D:** "Estadistico_H/E" y "criterio definido en P-PSEA-07" remiten a P-PSEA-07, que no define el criterio. DG-PSEA-03 usa ANOVA y MADe/nIQR.
- **F-PSEA-11A y 11B:** "Nivel", "Replica" y "Tiempo" son vagos. Lo concreto sería serie 0-4, puerto del colector (mínimo 3) y fecha/hora de cada corrida.
- **F-PSEA-03:**
  - "Requisitos_ingreso" es genérico; la aplicación exige PDF de seguridad social y ARL.
  - "Acepta_condiciones" es un solo campo; la aplicación tiene 3 declaraciones.
- **F-PSEA-08:** es un instructivo, no un formato. Los valores de "pollutant" y "unit" terminan en "u otro definido".
- **F-PSEA-13:**
  - La fuente es un documento de trabajo, `EA-PP2026-R1-1-z-4-2a.docx`.
  - Faltan la métrica, el método y el factor k que exige DG-PSEA-03.
- **F-PSEA-14 y 15:**
  - Los IDs no tienen formato común (F-PSEA-15 usa APEL-AAAA-NNN).
  - F-PSEA-15 no tiene campo para declarar conflicto de interés.
- **F-PSEA-17:** "Restricciones de tercerización según ISO 17043" no dice cuáles; deberían citarse las de 6.4.1.
- **DG-PSEA-02:**
  - "Acceso por rol" no dice qué roles ven la identidad real.
  - F-PSEA-09 exige consecutivo y aprobación, pero la aplicación no tiene esos campos.

## E. Placeholders y datos sensibles

- **P-PSEA-09:** contiene "[ADOPTAR LA RETENCIÓN".
- **P-PSEA-20:** contiene "[CORREO]" y "[TELÉFONO]".
- **Nombres y correos reales:**
  - P-PSEA-20 y la sección 8 de F-PSEA-18 traen un nombre real.
  - F-PSEA-18 trae también un correo institucional en el ejemplo.

  Reemplazar ambos por placeholders.
- **F-PSEA-14:** "Preliminar — Revisar".
- **F-PSEA-16:** el estado es "Preliminar — Mantener / Actualizar".
- **I-PSEA-01:** no tiene código, versión ni fecha en el encabezado.
- **Plantilla DG-PSEA-:** solo tiene el bloque de firmas.

## F. Instructivos frente a la interfaz real

- **I-PSEA-02:**
  - Dice "credenciales" y "Confirmar participación". La aplicación usa un enlace de invitación ("Invitación aceptada. Complete la ficha…").
  - Faltan los botones "Guardar datos temporalmente" y "Enviar ficha →".
  - Para cronograma e instrucciones solo existe "Ver calendario".
- **I-PSEA-03:**
  - La "exportación oficial" es en realidad el botón "Exportar CSV PT".
  - No hay control para F-PSEA-01 ni F-PSEA-02.
  - Faltan "Confirmar cierre" y "Confirmar reapertura", con la justificación que exige DG-PSEA-02.
- **I-PSEA-04:**
  - Dice "configurar parámetros". Los controles reales son las cargas de datos crudos, niveles y diseño H/E, y "k por defecto".
  - Dice "orden establecido". El orden real es: Guardar crudos, Ejecutar preprocesamiento, Exportar referencia y participantes, Importar desde calaire-app, Generar ronda completa.
  - F-PSEA-10 no tiene ningún control en pt_app.
- **I-PSEA-05:**
  - Dice "ejecutar cálculos". Los botones reales son Ejecutar, Calcular Algoritmo A, Calcular valores consenso, Calcular Compatibilidad y Calcular puntajes. No hay control para σpt.
  - Para el informe, los botones son "Generar Vista Previa" y "Descargar informe".
  - No hay selector de criterio estadístico.
- **I-PSEA-01:** usa "Estudiante Auxiliar" en lugar de "Auxiliar Operativo".

## G. Errores en los documentos de referencia (P-PSEA-10 a 13)

- **P-PSEA-11 (CO):** tiene "Concentración Nominal SO2" en la tabla de CO, y b = 100 con una pendiente "|" rota.
- **P-PSEA-12:** la columna de concentraciones de la Tabla 1 está vacía.
- **P-PSEA-10:** NO = 180 en la serie "Cero".

## Específicos o bien resueltos

P-PSEA-02, P-PSEA-03 (salvo los plazos) y las matrices de cumplimiento de DG-PSEA-02.

---

## Validación cruzada (GPT-6.1-sol, esfuerzo bajo, contra los .docx originales)

**Resultado:** de 58 hallazgos, 35 quedan confirmados, 22 parcialmente y 1 refutado. La validación agrega 5 hallazgos omitidos, todos confirmados.

**Refutado:**
- **G3:** en P-PSEA-10, NO = 180 en la serie cero corresponde a la tabla 2 (alternativa GPT con NO fijo) y es coherente. En la tabla 1 el cero es 0.

**Matizados (parciales):**
- **B2:** F-PSEA-08 dice "promedio horario **o valor equivalente**". Es ambiguo, no contradictorio.
- **B3:** P-PSEA-01 también prohíbe externalizar diseño, evaluación y autorización. La diferencia es de política.
- **B5:** "Calendario Tipo" (cronograma general de 12 meses) y "Calendario global" son compatibles. El conflicto real está en I-PSEA-01 ("Estado Instrumentos") y en P-PSEA-09.
- **B9:** el criterio zeta sí aparece en DG-PSEA-03 (z, z', zeta, En).
- **B12:** a P-PSEA-18 le falta enlazar el plazo de 15 días de P-PSEA-20. No hay dos plazos distintos.
- **B14:** P-PSEA-08 clasifica CSV y P-PSEA-03 clasifica registros. Son universos distintos; solo falta una tabla de correspondencia.
- **C2:** F-PSEA-01, 02, 04, 07, 09, 10, 11 y 12 tienen maestros en XLSX o CSV. No faltan; solo no están en .docx.
- **D3 a D5 y D7:** los detalles se resuelven por remisión a otros documentos (P-PSEA-10 a 13, la matriz de P-PSEA-03) o con hitos que no son plazos numéricos.
- **D8:** los campos vacíos son esperables en un maestro.
- **D10:** no imponer series 0-4 a todos los gases; P-PSEA-10 usa series 0-8.
- **E6:** el encabezado de Word de I-PSEA-01 sí tiene código y versión 01. Solo le falta la fecha.
- **F4:** pt_app sí tiene selectores `report_metric`, `report_method` y k (app.R:2246-2249).

**Hallazgos omitidos (confirmados):**
- **O1:** los encabezados de Word conservan los códigos antiguos:
  - P-PSEA-10 dice "P-PSEA-01";
  - P-PSEA-12 dice "P-PSEA-04";
  - P-PSEA-13 dice "P-PSEA-05".
- **O2:** P-PSEA-04 se contradice: "tres valores promedio de 30 minutos" frente a "3 concentraciones promedio de una hora".
- **O3:** P-PSEA-09 llama P-PSEA-06 al diseño estadístico; es P-PSEA-07.
- **O4:** P-PSEA-20 llama F-PSEA-07 a la "Lista Maestra" de participantes; F-PSEA-07 es la preparación del ítem.
- **O5:** I-PSEA-05 dice que F-PSEA-12 es la "única entrada", pero en las secciones 4 y 6 exige también F-PSEA-11A y 11B.
