# Plan de ajuste — P-PSEA-04 Planificación de ronda EA

**Objetivo:** convertir `P-PSEA-04` en el procedimiento que instruye cómo diligenciar `F-PSEA-06 Planificación de ronda EA`, cubriendo los 21 literales a)–u) de ISO/IEC 17043:2023.

**Estado actual:** `P-PSEA-04` no es un procedimiento de planificación. Su cuerpo (líneas 19–150) es diseño estadístico y evaluación de desempeño, duplicando `P-PSEA-07` y `P-PSEA-09`. Solo las líneas 5–7 tocan planificación.

---

## 1. Hallazgos que motivan el ajuste

| # | Hallazgo | Evidencia | Impacto |
|---|---|---|---|
| H1 | Título ≠ contenido | `P-PSEA-04` §"Preparación del ítem", "σpt", "z-score", "Presentación gráfica" | Auditoría: procedimiento no evidencia planificación |
| H2 | Duplicación normativa | `P-PSEA-04` cita `P-PSEA-07 Diseño estadístico` como referencia y luego lo repite | Riesgo de versiones divergentes |
| H3 | Solape con `P-PSEA-06` | Preparación/homogeneidad/estabilidad del ítem ya es alcance de `P-PSEA-06` | Ambigüedad de responsabilidad |
| H4 | Solape con `P-PSEA-09` | Contenido del informe y gráficos | Idem |
| H5 | **Matriz A–U incoherente** | `F-PSEA-06` §11 lista A="Objetivo de la ronda", B="Ítems", C="Participantes"… ; `docs/Planificacion_R1_PP.md` lista a)="Personal involucrado", b)="Proveedores externos", c)="Criterios de participación"… | Dos taxonomías distintas con las mismas letras. **Bloqueante** |
| H6 | Cláusula citada dudosa | `F-PSEA-06` §2 y §11 citan `7.2.1.3`; el listado a)–u) real corresponde al requisito de diseño del programa | Referencia normativa a verificar contra la norma |
| H7 | Formato huérfano | `docs/Planificacion_R1_PP.md` encabeza `F-PPSEA-03` (typo) y no `F-PSEA-06` | Trazabilidad rota |
| H8 | Copias divergentes | `docs/Planificacion_R1_PP.md`, `_workspace/plans/Planificacion_R1_PP.md`, `_workspace/plans/Planificacion_R1_PP_LIMPIO.md`, `docs/01_bloque_general/02_procedimientos/Planificacion_R1_PP (1).md` | Sin fuente única |

---

## 2. Decisión de arquitectura documental

```
P-PSEA-04  Planificación de ronda EA        → CÓMO planificar y diligenciar F-PSEA-06 (a–u)
F-PSEA-06  Planificación de ronda EA        → registro diligenciado por ronda
P-PSEA-06  Preparación y control del ítem   → conserva ítem, homogeneidad, estabilidad
P-PSEA-07  Diseño estadístico               → recibe σpt, x_pt, u(x_pt), z/z'/En, atípicos
P-PSEA-09  Informe de resultados            → conserva contenido del informe y gráficos
```

Regla: `P-PSEA-04` **referencia**, no reproduce. Cada literal apunta al procedimiento dueño.

---

## 3. Resolución de H5 — matriz a)–u) canónica

**DECIDIDO (usuario, 2026-07-29): la fuente de verdad es `Planificacion_R1_PP.md`.** La matriz a)–u) de ese documento es la taxonomía canónica. La lista A–U de `F-PSEA-06` §11 se descarta como matriz normativa.

Destino de las 5 casillas de `F-PSEA-06` §11 que no son literales de la norma:

| Casilla actual | Destino en `F-PSEA-06` |
|---|---|
| A Objetivo de la ronda | §3 Identificación y control documental |
| Q Seguridad y ambiente | §6 Recursos críticos y condiciones de operación |
| R Registros y trazabilidad | §13 Criterio de completitud (o sección nueva de registros) |
| S Quejas y apelaciones | referencia a `F-PSEA-14` / `F-PSEA-15`, fuera de la matriz |
| U Revisión y aprobación del diseño | §12 Aprobación y control de cambios |

No se pierden: dejan de estar en la matriz y pasan a la sección que les corresponde.

Taxonomía canónica:

| Lit. | Requisito | Procedimiento dueño | Registro/fuente del dato |
|---|---|---|---|
| a | Personal involucrado en diseño y operación del EA | P-PSEA-04 §Roles | HV + contrato; `F-PSEA-06` §7 |
| b | Proveedores externos y datos de contacto | P-PSEA-04 | `F-PSEA-06` §6 (servicios críticos) |
| c | Criterios de participación | P-PSEA-04 | `F-PSEA-06` §5 prerrequisitos |
| d | Número y tipo de participantes esperados | P-PSEA-04 | `F-PSEA-03` → `F-PSEA-06` §4/§5 |
| e | Actividades a realizar y resultados a informar | P-PSEA-04 | `F-PSEA-06` §8 + `F-PSEA-18` |
| f | Rango de valores / características del ítem | P-PSEA-06 | `F-PSEA-06` §9 |
| g | Fuentes potenciales de error del área técnica | P-PSEA-04 | `F-PSEA-06` §9 (respuesta a desviaciones) |
| h | Producción, control de calidad, almacenamiento y distribución del ítem | P-PSEA-06 | `F-PSEA-06` §6 |
| i | Disposiciones contra colusión y falsificación | P-PSEA-14 | `F-PSEA-06` §5 |
| j | Información a participantes y cronograma | P-PSEA-04 | `F-PSEA-06` §8 |
| k | EA continuos: frecuencia, fechas límite y de medición | P-PSEA-04 | `F-PSEA-06` §8 |
| l | Métodos para almacenar/manipular/preparar/enviar/desechar ítems y medir | P-PSEA-06 / I-PSEA-01 | `F-PSEA-06` §9 |
| m | Métodos de homogeneidad y estabilidad | P-PSEA-06 | `F-PSEA-06` §10 |
| n | Formatos normalizados de informe del participante | P-PSEA-04 | plantilla de cargue del aplicativo |
| o | Análisis estadístico detallado | P-PSEA-07 | `F-PSEA-06` §10 |
| p | Origen, trazabilidad e incertidumbre del valor asignado | P-PSEA-07 | `F-PSEA-06` §10 |
| q | Tratamiento de resultados por métodos distintos | P-PSEA-07 | `F-PSEA-06` §10 |
| r | Criterios de evaluación del desempeño | P-PSEA-07 | `F-PSEA-06` §10 |
| s | Datos, informes provisionales e información a devolver | P-PSEA-09 | `F-PSEA-06` §11 |
| t | Grado de publicidad de resultados y conclusiones | P-PSEA-09 | `F-PSEA-06` §11 |
| u | Procedimientos ante pérdida, deterioro o daño del ítem | P-PSEA-06 | `F-PSEA-06` §9 |

Tabla congelada. Si más adelante se coteja contra el texto de ISO/IEC 17043:2023 y aparece divergencia, se corrige por excepción y se registra en el control de cambios; ya no bloquea la ejecución.

---

## 4. Estructura destino de `P-PSEA-04`

```
1. Información general (objetivo, alcance, definiciones, referencias)   ← reescribir
2. Responsabilidades de planificación                                    ← nuevo
3. Entradas de la planificación (F-PSEA-03, F-PSEA-04 anexo, histórico)  ← nuevo
4. Secuencia de planificación (T-30 → T-0)                               ← nuevo
5. Diligenciamiento de F-PSEA-06 sección por sección (§3 a §10)          ← nuevo
6. Diligenciamiento de la matriz a)–u): guía por literal                 ← nuevo, núcleo
7. Revisión, aprobación y control de cambios del plan de ronda           ← nuevo
8. Criterio de completitud y liberación para ejecución                   ← de F-PSEA-06 §13
9. Registros generados                                                    ← nuevo
```

Sección 6 = el corazón. Por cada literal: qué se debe definir, quién lo define, de dónde sale el dato, dónde se registra, criterio de aceptación del contenido.

---

## 5. Contenido a migrar (no borrar)

| Origen en P-PSEA-04 actual | Destino |
|---|---|
| "Preparación del ítem de ensayo" (L19–21) | `P-PSEA-06` |
| "Generación de los niveles" + Tabla 1 (L23–37) | `P-PSEA-06`; en `P-PSEA-04` queda solo la referencia al rango planificado (literal f) |
| "Homogeneidad y estabilidad" (L39–45) | `P-PSEA-06` |
| "Procesamiento de datos" (L47–49) | `P-PSEA-07` |
| "Detección de valores atípicos" (L51–55) | `P-PSEA-07` |
| "Valor asignado x_pt" (L57–59) | `P-PSEA-07` |
| "Incertidumbre U(x_pt)" + Ec 1–3 + Tabla 2 (L61–93) | `P-PSEA-07` |
| "σpt" + Ec 4 + Tabla 3 (L95–112) | `P-PSEA-07` |
| "Criterios de desempeño" + Ec 5–7 + Tabla 4 (L114–140) | `P-PSEA-07` |
| "Presentación gráfica" (L142–146) | `P-PSEA-09` |
| "Contenido del informe" (L148–150) | `P-PSEA-09` (ya solo referencia) |
| "Control documental de inicio de ronda" (L5–7) | permanece, integrado a §4 secuencia |
| Imágenes base64 image1–image3 | migran con las ecuaciones a `P-PSEA-07` |

Verificar antes de mover: si `P-PSEA-07` ya contiene estas secciones, es deduplicación, no migración.

---

## 6. Pasos de ejecución

1. ~~**Verificar norma.**~~ **RESUELTO:** matriz canónica = `Planificacion_R1_PP.md` (§3). Queda abierto solo H6, el número de cláusula citado en `F-PSEA-06` §2/§11 (`7.2.1.3`), a confirmar contra la norma; no bloquea.
2. **Auditar `P-PSEA-07` y `P-PSEA-06`.** Determinar qué del §5 ya existe allí. Salida: lista migrar vs. deduplicar.
3. **Consolidar el formato huérfano.** Elegir fuente única para `Planificacion_R1_PP`; corregir encabezado `F-PPSEA-03` → `F-PSEA-06`; borrar copias divergentes o marcarlas obsoletas.
4. **Alinear `F-PSEA-06` §11** a la taxonomía congelada (renombrar literales A–U, corregir cláusula en §2).
5. **Reescribir `P-PSEA-04`.** Estructura §4; §6 con guía por literal.
6. **Mover contenido** según §5 a `P-PSEA-06`, `P-PSEA-07`, `P-PSEA-09`.
7. **Actualizar referencias cruzadas** en los cuatro procedimientos + `.docx` correspondientes.
8. **Rellenar `F-PSEA-06` de la R1** usando el nuevo `P-PSEA-04`, tomando las respuestas ya redactadas en `Planificacion_R1_PP.md` como prueba de suficiencia.
9. **Revisar impacto en la app.** Buscar referencias a `P-PSEA-04` / `F-PSEA-06` en `convex/`, `lib/`, `app/` antes de renombrar códigos.

Paso 1 resuelto. Pasos 2–3 bloquean 4–8. Paso 9 puede correr en paralelo.

---

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Renumerar literales rompe planes de rondas ya emitidos | Versionar `F-PSEA-06` y dejar tabla de equivalencia vieja→nueva |
| Migrar ecuaciones rompe imágenes base64 | Mover bloques `[imageN]: <data:...>` junto con sus referencias |
| Códigos de documento referenciados en la app | Ejecutar paso 9 antes de cualquier renombrado |
| `.docx` y `.md` se desincronizan | Definir el `.md` como fuente y regenerar `.docx`, o registrar la divergencia |

---

## 8. Entregables

- `P-PSEA-04` reescrito como procedimiento de planificación con guía a)–u).
- `F-PSEA-06` con matriz alineada y cláusula corregida.
- `P-PSEA-06`, `P-PSEA-07`, `P-PSEA-09` con el contenido migrado.
- `F-PSEA-06` de la ronda R1-PP diligenciado.
- Tabla de equivalencia de literales.

---

## 9. Decisiones

**Resueltas**

1. Taxonomía a)–u) canónica: **`Planificacion_R1_PP.md`** (usuario, 2026-07-29).

**Pendientes**

2. ¿Fuente de verdad `.md` o `.docx`?
3. ¿`Planificacion_R1_PP.md` se conserva como registro de la ronda R1 o se absorbe dentro de `docs/EA-PP-2026-R1/01_planificacion_ronda/F-PSEA-06...`? Relacionado: cuál de las 4 copias divergentes sobrevive (H8).
