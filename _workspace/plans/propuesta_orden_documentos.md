# Propuesta B0: orden de diligenciamiento del expediente SGC de ronda

Insumo para B1 paso 1 de `plan_implementacion_diagnostico.md`. Base: `SGC_RONDA_ETAPAS` (`convex/_lib/sgc/catalog.ts`), `DIAGNOSTICO.md` §2.1 y §2.7, procedimientos P-PSEA-03/04/05/06/07/08/09/17/18/20/21/24, `I-PSEA-03` §6-7, `workflow_documentos_sgc.md`, `plan_documentos_sgc.md`.

Convenciones:
- **Tú** = coordinador / gestor SGC / responsable técnico (personal Calaire). **Participante** = laboratorio. **Automático** = la app lo genera o lo da por cumplido con sus datos.
- **Obligatorio** cuenta en el avance. **Si aplica** va en gris y no cuenta hasta que se marque que aplica.
- ⚠️ = la fuente es ambigua o es una inferencia sin respaldo explícito.
- "Depende de" puede apuntar a documentos de otras etapas (por ejemplo, F-19 depende de F-21).

Nota de catálogo: F-PSEA-19 (carpeta `02A_inicio_ronda`) y F-PSEA-20/21 (en `03_preparacion_item`) **ya están** en el catálogo actual. Se ubican abajo en su paso. Lo que hay que revisar es si los expedientes ya inicializados los tienen en su copia guardada (DIAGNOSTICO punto 1).

---

## 0. Pasos previos no SGC (barra "Siguiente paso", antes de la etapa 01)

| Paso | Acción | Responsable | Obligatorio / Si aplica | Depende de | Estado calculado sugerido | Fuente |
|---|---|---|---|---|---|---|
| 0.1 | Crear ronda (código, gases, niveles, réplicas, cupos, referencia) | Tú | Obligatorio | Datos definidos en F-06 (ver ⚠️ abajo) | Ronda existe | I-PSEA-03 §6.1; P-PSEA-04 "Control documental de inicio de ronda" |
| 0.2 | Configuración PT: niveles run/nivel por gas | Tú | Obligatorio | 0.1 | `getNivelesPTDescuadres` sin descuadres | I-PSEA-03 §6.2 num. 1 |
| 0.3 | Códigos de participante y código de réplica | Automático | Obligatorio | 0.1 | Todos los cupos y la referencia con código y réplica (ref = 1, participantes 2, 3, …) | I-PSEA-03 §6.2 num. 2; DIAGNOSTICO §2.7 punto 17 |
| 0.4 | Hitos del calendario, incluido `INICIO_RONDA` (fecha, lugar, responsable) | Tú | Obligatorio | 0.1 | Hito `INICIO_RONDA` con fecha | P-PSEA-04 (párrafo hito); P-PSEA-24 condición previa 1 |
| 0.5 | Inicializar expediente SGC | Tú | Obligatorio | 0.1 | Expediente con 8 carpetas | DIAGNOSTICO §2.7 |
| 0.6 | Registrar laboratorios y enviar invitaciones | Tú | Obligatorio | 0.2, 0.3 (I-PSEA-03 §6.2: "antes de invitar participantes") | Todos los cupos invitados | I-PSEA-03 §6.2 y §7 num. 3 |
| 0.7 | Verificación antes de continuar (checklist §6.3) | Automático | Obligatorio | 0.1-0.3 | Checklist derivado de 0.1-0.3 | I-PSEA-03 §6.3 |

⚠️ **Circularidad F-06 / creación de ronda.** P-PSEA-04 dice que F-06 debe definir los datos "antes de crear la ronda", pero en la app F-06 se diligencia dentro del expediente, que existe después de crear la ronda. Propuesta: la barra muestra 0.1-0.7 primero y F-06 queda como paso 1 de la etapa 01; los datos de F-06 se usan para verificar 0.1 (I-PSEA-03 §6.3, "iguales a F-PSEA-06").
⚠️ **Hitos antes o después del expediente.** Ninguna fuente fija si 0.4 va antes que 0.5. Lo pongo antes porque F-01 lo muestra y F-19 lo usa.
⚠️ **Invitaciones antes o después de la planificación.** I-PSEA-03 §7 pone las invitaciones (num. 3) después del calendario (num. 2) y antes de F-05/F-06 (num. 4). Las dejo en los pasos previos porque F-03 (etapa 01) depende de que los participantes estén invitados.

---

## 01 Planificación de ronda (`01_planificacion_ronda`), orden fijado por el usuario

| Paso | Código | Documento | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | F-PSEA-06 | Planificación de ronda EA | Tú | Obligatorio | Pasos previos 0.1-0.3 | P-PSEA-04 "Control documental"; P-PSEA-03 matriz ("Antes de ejecución"); decisión del usuario |
| 2 | F-PSEA-01 | Calendario global de ronda | Tú (⚠️ o Automático desde hitos) | Obligatorio | F-06, hitos (0.4) | P-PSEA-03 matriz ("Apertura y planificación"); I-PSEA-03 §7 num. 2 |
| 3 | F-PSEA-02 | Cronograma detallado de ronda | Tú | Obligatorio | F-01 | P-PSEA-03 matriz y "Verificación de completitud" (primer punto) |
| 4 | F-PSEA-05 | Ficha básica de ronda EA | Automático (datos nativos) + revisión tuya ⚠️ | Obligatorio | F-06, F-01, F-02 | P-PSEA-03 matriz (relación con F-06/F-01/F-02); catálogo ("se cubre con datos nativos") |
| 5a | F-PSEA-03 | Registro de participación y carga de datos | Participante (la app consolida) | Obligatorio | Invitaciones (0.6) | P-PSEA-03 matriz (Participante / Coordinación); P-PSEA-24 condición 2; P-PSEA-20 §6.2 |
| 5b | F-PSEA-04 | Equipos e instrumentos (exportado de F-03) | Automático (exportación) | Obligatorio ⚠️ | F-03 | P-PSEA-03 matriz; P-PSEA-08 Entradas ("cuando aplique") |
| 6a | F-PSEA-16 | Matriz de competencia y autorización | Tú | Si aplica ⚠️ | — | P-PSEA-03 matriz ("Antes y durante ejecución", ref. P-PSEA-20); catálogo |
| 6b | F-PSEA-17 | Evaluación de proveedores críticos | Tú | Si aplica | — | P-PSEA-03 matriz (ref. P-PSEA-21); catálogo |

⚠️ F-04: P-PSEA-08 la marca "cuando aplique", pero P-PSEA-03 la trata como registro normal. Se propone Obligatorio y Automático.
⚠️ F-16: el catálogo la deja como "aplica cuando se documente competencia específica". P-PSEA-03 no dice que sea condicional. Además, el archivo `P-PSEA-20 Competencia…` contiene en realidad "Comunicación PT", y `P-PSEA-21 Proveedores…` contiene "Divulgación de Valores": los procedimientos fuente de F-16/F-17 no existen con ese contenido.

---

## 02 Comunicaciones con participantes (`02_comunicaciones_participantes`)

| Paso | Código | Documento | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | I-PSEA-02 | Instructivo participante con anexos A y B (publicar versión congelada) | Tú | Obligatorio | F-01, F-02 (se publican juntos en el portal) | P-PSEA-05 "Publicación en portal"; P-PSEA-24 condición 4; workflow §5.2 |
| 2 | F-PSEA-18 | Comunicación oficial al participante (instrucciones pre-ronda T-14, recordatorio T-7) | Tú | Obligatorio ⚠️ | I-PSEA-02, F-03 | P-PSEA-20 §6.3 (tabla de comunicaciones pre-ronda); P-PSEA-05 "Reglas mínimas de registro" |
| 3 | EVID-COM | Respuestas o acuses de recibo | Participante | Obligatorio ⚠️ | F-18 | P-PSEA-05 "Criterio de cierre" num. 3 ("destinatario confirmado cuando aplica") |
| 4 | EVID-ACL | Aclaraciones o cambios / fe de erratas | Tú | Si aplica | F-18 | P-PSEA-20 §6.4; catálogo |

⚠️ F-18 no aparece citado por código en ningún procedimiento leído. P-PSEA-20 §6.3 describe las comunicaciones, pero las registra en "F-PSEA-07" (numeración antigua).
⚠️ EVID-COM: P-PSEA-05 pide confirmar al destinatario "cuando aplica". No queda claro si un acuse de cada participante es obligatorio.
⚠️ Responsable de EVID-COM: el acuse lo produce el participante, pero si llega por correo lo carga Tú. Si la app registra la lectura en el portal, podría ser Automático.

---

## 02A Inicio de ronda (`02A_inicio_ronda`)

F-PSEA-19 tiene un solo documento, pero P-PSEA-24 "Desarrollo de la apertura" define sub-pasos. Se proponen como pasos internos del documento, en el estado `no_inicializado → borrador → docx_generado → pdf_firmado_cargado → publicado` (DIAGNOSTICO §2.1).

| Paso | Código | Documento / sub-paso | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | F-PSEA-19 | Inicializar acta (toma hito, lugar, F-03, F-21) | Tú (gestor SGC) | Obligatorio (crítico, no bloquea cierre) | Hito `INICIO_RONDA`, F-03, **F-21 validado (etapa 03)** | P-PSEA-24 condiciones 1-3 y desarrollo num. 1 |
| 1.1 | F-PSEA-19 | Revisar datos y registrar 2 organizadores | Tú (coordinador) | Obligatorio | 1 | P-PSEA-24 num. 2 |
| 1.2 | F-PSEA-19 | Generar DOCX e imprimir | Tú (gestor SGC) | Obligatorio | 1.1 | P-PSEA-24 num. 3 |
| 1.3 | F-PSEA-19 | Apertura presencial y firma manuscrita | Tú + Participante | Obligatorio | 1.2 | P-PSEA-24 num. 4-5 |
| 1.4 | F-PSEA-19 | Cargar PDF firmado | Tú (gestor SGC) | Obligatorio (criterio de completitud) | 1.3 | P-PSEA-24 num. 6 y "Control del acta" |
| 1.5 | F-PSEA-19 | Autorizar publicación a participantes | Tú (coordinador, admin) | Obligatorio ⚠️ | 1.4 | P-PSEA-24 num. 7; P-PSEA-05 ("cuando coordinación publique expresamente") |

⚠️ **Orden de carpetas frente a orden real.** F-21 (carpeta 03) debe estar validado **antes** de F-19 (carpeta 02A). La barra "Siguiente paso" debe seguir las dependencias, no el número de carpeta.
⚠️ La completitud es "PDF firmado cargado". No está claro si la publicación (1.5) cuenta para el avance o es opcional.

---

## 03 Preparación del ítem (`03_preparacion_item`)

| Paso | Código | Documento | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | F-PSEA-21 | Relación de instrumentos Calaire usados (mín. 4 analizadores, aire cero, calibrador, cilindro; 2 fotos cada uno) → enviar a validación → validar | Tú (técnico registra, coordinador valida) | Obligatorio (crítico, no bloquea cierre) | F-06 | P-PSEA-06 actividades 7-8; P-PSEA-24 condición 3; P-PSEA-04 (párrafo final) |
| 2 | F-PSEA-20 | Rotulado anónimo: cargar, rotular, confirmar `usadoEnRonda` | Tú (responsable técnico) | Obligatorio (crítico, no bloquea cierre) | Códigos de participante (0.3) | P-PSEA-06 actividad 6 |
| 3 | EVID-CERT | Certificados de gases, equipos o patrones | Tú | Si aplica ⚠️ | F-21 | P-PSEA-06 actividad 2 (verificar el estado metrológico); catálogo ("cuando aplique") |
| 4 | F-PSEA-07 | Preparación y control del ítem | Tú (responsable técnico) | Obligatorio | F-06, EVID-CERT | P-PSEA-06 actividades 1-5 y "Salidas"; P-PSEA-03 matriz |
| 5 | EVID-MONT | Montaje, configuración o verificación técnica | Tú | Si aplica ⚠️ | F-07 | P-PSEA-06 actividades 3-5; catálogo |

⚠️ **Orden F-20/F-21 frente a F-07.** En P-PSEA-06 el orden es 1-5 (preparación, F-07), luego 6 (F-20) y luego 7-8 (F-21). Aquí se adelanta F-21 porque bloquea el acta (F-19), que se firma en la apertura, y la apertura es anterior a la medición. Hay que confirmar si F-07 se cierra antes o después de la apertura.
⚠️ EVID-CERT y EVID-MONT: P-PSEA-06 exige verificar el estado metrológico (act. 2), lo que sugiere que los certificados son obligatorios. El catálogo dice "cuando aplique".

---

## 04 Datos y preprocesamiento (`04_datos_y_preprocesamiento`)

| Paso | Código | Documento | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | F-PSEA-08 | Datos reportados por participante (envíos PT + archivo original) | Participante | Obligatorio | Ronda activa, códigos de réplica (0.3), F-19 ⚠️ | P-PSEA-03 matriz; P-PSEA-08 act. 7; I-PSEA-02 Anexo B |
| 2 | F-PSEA-09 | Exportación para análisis PT | Automático (exportación de calaire-app) | Obligatorio | F-08 completos, niveles PT (0.2) | P-PSEA-08 act. 2 y "Controles"; I-PSEA-03 §7 num. 7 |
| 3 | EVID-CSV | CSV/exportaciones conservadas | Automático ⚠️ | Si aplica | F-09 | P-PSEA-08 act. 8; P-PSEA-03 principio 5 ("solo cuando soportan una decisión") |
| 4 | F-PSEA-10 | Registro de preprocesamiento (pt_app) | Tú (responsable de datos) | Obligatorio | F-09 | P-PSEA-08 act. 3; P-PSEA-03 matriz |
| 5 | F-PSEA-12 | Datos oficiales consolidados | Tú (pt_app) / Automático ⚠️ | Obligatorio | F-10, **F-11 (etapa 05)** | P-PSEA-08 act. 5; P-PSEA-07 Entradas |

⚠️ F-12: el catálogo dice "se cubre con envíos finales y dataset consolidado", es decir, Automático. P-PSEA-03 la atribuye a pt_app y al responsable de datos, es decir, Tú.
⚠️ P-PSEA-08 pone H/E (act. 4) antes de consolidar (act. 5). La etapa 05 se intercala antes del paso 5 de la etapa 04.
⚠️ La dependencia F-08 → F-19 no está escrita. Se infiere porque el reporte ocurre después de la apertura.

---

## 05 Homogeneidad y estabilidad (`05_homogeneidad_estabilidad`)

| Paso | Código | Documento | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | F-PSEA-11A | Datos preprocesados de homogeneidad | Tú (pt_app) | Obligatorio ⚠️ | F-07, F-10 | P-PSEA-08 act. 4 y matriz (soporte_trazable); P-PSEA-06 Salidas |
| 2 | F-PSEA-11B | Datos preprocesados de estabilidad | Tú (pt_app) | Obligatorio ⚠️ | F-07, F-10 | Ídem |
| 3 | F-PSEA-11C | Resultados de homogeneidad | Tú (pt_app) | Obligatorio ⚠️ | 11A | P-PSEA-07 Salidas; P-PSEA-08 matriz (evidencia_oficial) |
| 4 | F-PSEA-11D | Resultados de estabilidad | Tú (pt_app) | Obligatorio ⚠️ | 11B | Ídem |
| 5 | F-PSEA-11 | Registro principal H/E y conclusión | Tú (técnico / datos) | Obligatorio | 11A-11D | P-PSEA-06 Salidas; P-PSEA-07 act. 5 y control "evidenciar H/E antes de interpretar"; P-PSEA-03 "Verificación de completitud" |

⚠️ P-PSEA-06 act. 9 y P-PSEA-08 act. 4 dicen "cuando aplique" para H/E. P-PSEA-07 y P-PSEA-03 la tratan como necesaria. Hay que decidir si toda la etapa puede ser "si aplica" (por ejemplo, ítem dinámico sin H/E formal).
⚠️ El orden 11A-D → 11 es una inferencia: F-11 es el registro principal que resume a los demás.

---

## 06 Análisis e informe (`06_analisis_e_informe`)

| Paso | Código | Documento | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | EVID-SALIDAS | Salidas, gráficas y tablas de pt_app | Tú / Automático ⚠️ | Obligatorio ⚠️ | F-12, F-11 | P-PSEA-03 flujo num. 5; P-PSEA-07 act. 6-7 |
| 2 | F-PSEA-13 | Informe final de resultados (revisión y snapshot) | Tú (coordinación / técnico) | Obligatorio | EVID-SALIDAS, F-12 | P-PSEA-09; P-PSEA-07 Salidas; P-PSEA-03 matriz |
| 3 | EVID-ENVIO | Evidencia de envío del informe al participante | Automático (publicación/notificación) ⚠️ | Obligatorio | F-13 | P-PSEA-05 "Trazabilidad" (F-13) y "Criterio de cierre" |

⚠️ EVID-SALIDAS: P-PSEA-03 pide "soporte trazable", pero no dice si se carga aparte o si el informe basta ("cita o conserva", Verificación de completitud).
⚠️ EVID-ENVIO es Automático solo si la app publica el informe en el portal. Si se envía por correo, el responsable es Tú.

---

## 07 Cierre SGC (`07_cierre_sgc`)

| Paso | Código | Documento | Responsable | Obligatorio / Si aplica | Depende de | Fuente |
|---|---|---|---|---|---|---|
| 1 | F-PSEA-14 | Caso de queja o NC | Tú (responsable SGC) | Si aplica | Queja o NC registrada | P-PSEA-17 §4.1 y §5; P-PSEA-15; P-PSEA-03 matriz ("Cuando se presenta caso") |
| 2 | F-PSEA-15 | Registro de apelación | Tú (responsable de calidad / SGC) | Si aplica | Apelación de un participante (sobre F-13) | P-PSEA-18 §4 y §5 |
| 3 | EVID-CIERRE | Evidencia de cierre de ronda (checklist) | Tú (coordinación aprueba) / Automático (checklist) ⚠️ | Obligatorio | Todas las etapas; F-14/F-15 cerrados si aplican | P-PSEA-03 flujo num. 7 y "Verificación de completitud"; P-PSEA-03 Responsabilidades ("aprobar el cierre documental") |

⚠️ F-14/F-15 pueden abrirse en cualquier etapa, no solo al final. Se propone que, cuando se marquen como "aplica", bloqueen EVID-CIERRE hasta su cierre (P-PSEA-17 §4.6, P-PSEA-18 §4.6).
⚠️ La nota de P-PSEA-20 §6.6 llama a los registros de quejas y apelaciones "F-PSEA-16/17", lo que contradice el catálogo (F-14/F-15). Es numeración antigua.

---

## Preguntas abiertas para el usuario

1. **F-06 frente a la creación de ronda:** ¿aceptas que F-06 sea el paso 1 de Planificación aunque P-PSEA-04 diga que va "antes de crear la ronda"? ¿O lo actualizamos en P-PSEA-04?
2. **Hitos:** ¿se configuran antes de inicializar el expediente (como se propone) o después de F-06?
3. **Invitaciones:** ¿van en los pasos previos (antes de F-03) o después de F-01/F-02, como en I-PSEA-03 §7?
4. **F-01:** ¿lo diligencias tú o se da por cumplido automáticamente con los hitos?
5. **F-05:** ¿es Automático (datos nativos), o requiere tu revisión o aprobación explícita?
6. **F-04:** ¿es obligatorio o "si aplica"?
7. **F-16:** ¿es "si aplica" o es obligatorio en cada ronda? Además, los archivos P-PSEA-20/21 tienen un contenido que no corresponde a su título: ¿cuál es la fuente real de F-16/F-17?
8. **F-18 y EVID-COM:** ¿son obligatorios? ¿Se exige un acuse de cada participante?
9. **Barra por dependencias:** ¿confirmas que F-21 (carpeta 03) se pida antes que F-19 (02A), aunque rompa el orden de las carpetas?
10. **F-19:** ¿el avance cuenta como completo con el PDF cargado o exige publicarlo?
11. **F-07:** ¿se cierra antes de la apertura o durante la medición (después de F-19)?
12. **EVID-CERT / EVID-MONT:** ¿son obligatorios o "si aplica"?
13. **H/E:** ¿la etapa 05 completa puede ser "si aplica"? ¿Son obligatorios los subformatos 11A-D?
14. **F-12 y EVID-SALIDAS:** ¿Automático (sincronizado desde pt_app) o carga manual tuya?
15. **EVID-ENVIO:** ¿basta con publicar el informe en el portal (Automático)?
16. **F-14/F-15 activos:** ¿bloquean el cierre hasta cerrarse?
17. **EVID-CIERRE:** ¿se genera automáticamente desde el checklist o requiere tu aprobación explícita?

---

## Decisiones del usuario (2026-11-24)

Estas decisiones reemplazan las recomendaciones y los ⚠️ de arriba cuando no coinciden.

| # | Tema | Decisión |
|---|---|---|
| 1 | F-06 frente a crear ronda | F-06 es el paso 1 de Planificación. P-PSEA-04 se ajusta: "antes de activar la ronda". |
| 2 | Hitos | Antes o en paralelo al expediente. No bloquean inicializar el expediente. |
| 3 | Invitaciones | En los pasos previos, antes de F-03. |
| 4 | F-01 | Lo diligencia el coordinador (manual). No se da por cumplido con los hitos. |
| 5 | F-05 | Automático con datos nativos más un "revisado" del coordinador. |
| 6 | F-04 | Obligatorio y automático (exportado de F-03). |
| 7 | F-16 | Obligatorio en cada ronda. F-17 sigue siendo "si aplica". Fuente: ver nota abajo. |
| 8 | F-18 / EVID-COM | F-18 obligatorio. No se exige acuse por separado: el acuse se da por hecho cuando el participante entra a la app (registro automático de ingreso). |
| 9 | Barra "Siguiente paso" | Sigue el orden lógico por dependencias, no el número de carpeta (F-21 antes de F-19). |
| 10 | F-19 | Dos estados para el avance: "diligenciada / por subir" y "subida" (PDF firmado). Solo "subida" cuenta como completa. La publicación no cuenta. |
| 11 | F-07 | Se cierra con la apertura: debe estar completa al momento de F-19. |
| 12 | EVID-CERT / EVID-MONT | Ambas "si aplica". |
| 13 | Etapa 05 H/E | Toda la etapa "si aplica", laxa: se puede marcar no aplica sin justificación. 11A-D también "si aplica". |
| 14 | F-12 / EVID-SALIDAS | Carga manual del coordinador (desde pt_app). |
| 15 | EVID-ENVIO | Publicar el informe en el portal cuenta como evidencia (automático). |
| 16 | F-14 / F-15 abiertos | No bloquean el cierre por ahora. |
| 17 | EVID-CIERRE | El checklist se arma automáticamente; el cierre requiere aprobación explícita del coordinador. |
| 18 | Tolerancia de la advertencia PT | Se mantiene 0,5 % relativo con piso de 0,001. |

### Nota sobre la fuente de F-16/F-17 (pregunta 7)

Revisado en `calaire-app/docs` y en `calaire-ea_sgc`:
- Los formatos **F-PSEA-16** y **F-PSEA-17** existen (fichas preliminares v1.0).
- Los procedimientos **P-PSEA-20** (Competencia y autorización) y **P-PSEA-21** (Proveedores críticos) **no están redactados**. Los archivos con ese nombre traen otro contenido: P-PSEA-20 es un borrador de "Comunicación PT" y P-PSEA-21 un placeholder de "Divulgación de valores". Esto pasa en ambos repos, también en los .docx.
- Lo que sí existe: `calaire-ea_sgc/fichas_resumen/ficha_P-PSEA-20.md` y `ficha_P-PSEA-21.md` (propósito y alcance del procedimiento correcto), y los placeholders antiguos `para_quitar/.../P-PSEA-27 Competencia…` y `P-PSEA-28 Proveedores externos…`.
- **Pendiente nuevo:** redactar P-PSEA-20 y P-PSEA-21 a partir de sus fichas resumen. Además, reubicar los contenidos actuales ("Comunicación PT" y "Divulgación de valores") con su código correcto.

### Decisiones posteriores (2026-11-24, tras B2)

| # | Tema | Decisión |
|---|---|---|
| 19 | F-03 y cupos sin reclamar | Un cupo que nadie reclamó cuenta como "no participó": no bloquea F-03. F-03 se cumple cuando todos los cupos reclamados enviaron su ficha (comportamiento de B2). |
