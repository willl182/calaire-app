# CALAIRE-APP como Interfaz de Gestión del SGC

## Premisa

CALAIRE-APP ya cubre implícitamente varios formatos del SGC sin llamarlos por nombre. La guía de usuario funciona como instructivo operativo (I-PSEA equivalente). La pregunta es: **¿qué más del SGC puede la app absorber como interfaz de gestión, y qué debe quedarse como documento estático?**

---

## 1. Lo que CALAIRE-APP ya cubre (sin saberlo)

La app ya implementa la lógica transaccional de estos documentos del SGC. Solo falta la **declaración formal** de que la app es el medio de registro:

| Formato SGC | Cláusula ISO | Lo que hace la app hoy | Cobertura |
|---|---|---|---|
| **F-PSEA-05** Confirmación Participación | 7.1, 7.3.4 | Invitación por token + reclamación de cupo = confirmación digital | ✅ Completa |
| **F-PSEA-05A** Hoja de Registro Participante | 7.3.4 | `fichasRegistro` + analizadores + instrumentos + acompañantes = ficha completa con auto-save | ✅ Completa |
| **F-PSEA-07** Lista Maestra Participantes | 7.2.1.3 d) | `rondaParticipantes` con código anónimo + estado + timestamps | ✅ Completa |
| **F-PSEA-12** Reporte del Participante | 7.3.5, 7.4.1 | `enviosPt` con réplicas, promedio, σ, k, U_exp + `submitted_at` | ✅ Completa |
| **P-PSEA-26** Confidencialidad (parcial) | 4.2 | Códigos anónimos de 6 chars, WorkOS AuthKit, segregación admin/member | 🟡 ~70% |

> **Implicación:** Estos 5 documentos no necesitan existir como formatos vacíos en `docs/documentacion_sgc/`. La app **es** el formato. Solo necesitas una declaración en el Manual de Calidad que diga: *"Los registros F-PSEA-05, F-PSEA-05A, F-PSEA-07 y F-PSEA-12 se mantienen en el sistema CALAIRE-APP (Convex), con respaldo periódico vía exportación CSV."*

---

## 2. Extensiones naturales: datos transaccionales que la app podría absorber

Estos formatos capturan datos **por ronda, por evento, por participante** — son transaccionales por naturaleza. La app podría absorberlos con extensiones menores:

### Prioridad alta (directamente ligados al flujo de ronda)

| Formato | Cláusula ISO | Qué captura | Esfuerzo en app |
|---|---|---|---|
| **F-PSEA-06** Plan de Ronda | 7.2.1.3 | Config de ronda: analitos, niveles, σ_pt, cronograma, personal | **Medio.** Ya tienes `rondas` + `rondaContaminantes`. Falta: σ_pt, método valor asignado, personal asignado, cronograma de hitos. ~5 campos más en el schema. |
| **F-PSEA-08** Registro Preparación Ítem | 7.3.1 | CRM usado, lote, concentración, fecha prep, operador | **Bajo.** Un formulario admin vinculado a `rondaPtItems`. |
| **F-PSEA-11** Registro Envío/Recepción | 7.3.3-4 | Fecha envío, transportista, condiciones, confirmación recepción | **Bajo.** Dos timestamps + campos en `rondaParticipantes` o tabla nueva. |
| **F-PSEA-13** Hoja Revisión Datos | 7.4.1 | Checklist pre-análisis: unidades OK, formato OK, plausibilidad | **Bajo.** Checklist boolean en un paso post-cierre de ronda (admin). |

### Prioridad media (gestión del SGC)

| Formato | Cláusula ISO | Qué captura | Esfuerzo en app |
|---|---|---|---|
| **F-PSEA-15** Registro NC/CAPA | 8.7 | Hallazgo, causa raíz, corrección, verificación, cierre | **Medio.** CRUD simple tipo tickets con estados y timestamps. |
| **F-PSEA-16** Registro Quejas | 8.10 | Queja del participante, evaluación, resolución, plazo | **Bajo.** Similar a NC pero más simple. |
| **F-PSEA-17** Registro Apelaciones | 8.11 | Apelación formal, panel imparcial, resolución | **Bajo.** Mismo patrón que quejas. |

### Prioridad baja (pero digitalizables)

| Formato | Cláusula ISO | Qué captura | Esfuerzo en app |
|---|---|---|---|
| **F-PSEA-09** Registro Homogeneidad | 7.3.2 | Mediciones de homogeneidad, s_hom, criterio vs σ_pt | **Medio.** Formulario admin con cálculos inline (ya los tiene pt_app). |
| **F-PSEA-10** Registro Estabilidad | 7.3.2 | Mediciones de estabilidad, tendencia, criterio | **Medio.** Similar a homogeneidad. |
| **F-PSEA-14** Hoja Cálculo Estadístico | 7.4.2 | x_pt, σ_pt, z-scores, decisión estadística | **Integración.** Esto lo hace pt_app. La app podría mostrar resultados importados. |

---

## 3. Procedimientos que deben declarar la app como canal operativo

Estos procedimientos son documentos narrativos (se quedan offline como `.md`/`.docx`), pero su contenido **debe establecer que CALAIRE-APP es el medio de ejecución**. El procedimiento dice el *qué*; la app implementa el *cómo*.

| Procedimiento | Cláusula ISO | Qué debe declarar sobre la app |
|---|---|---|
| **P-PSEA-20** Comunicación PT | 7.1, 7.3.5 | Todas las comunicaciones operativas con participantes (invitaciones, confirmaciones, recordatorios de plazo, notificación de resultados, cambios de calendario) se canalizan a través de CALAIRE-APP (WorkOS email OTP + notificaciones in-app). |
| **P-PSEA-23** Gestión de Datos | 7.5.2 | CALAIRE-APP (Convex) es el sistema primario de captura, validación y almacenamiento de datos de participantes. Define políticas de respaldo, audit logs, integridad y exportación CSV hacia pt_app. |
| **P-PSEA-26** Confidencialidad | 4.2 | La codificación anónima de participantes (6 chars, alfabeto restringido) se implementa automáticamente en CALAIRE-APP. El acceso se controla por roles WorkOS (admin/member/member_special). |
| **P-PSEA-09** Planificación Ronda | 7.2.1.3 | La configuración de ronda (analitos, niveles, participantes, estados) se gestiona en CALAIRE-APP. El plan formal F-PSEA-06 se genera/exporta desde la app. |

---

## 4. Formatos SGC como funciones de la app

Cada formato transaccional del SGC tiene un equivalente funcional que debe existir como **feature implementada** en CALAIRE-APP. La relación es: el formato define los campos y la trazabilidad normativa; la app implementa la captura, validación y almacenamiento.

### Funciones de cara al participante

| Formato SGC | Función en app | Actor | Estado actual |
|---|---|---|---|
| **F-PSEA-05** Confirmación | `ClaimInvitation` — Reclamar cupo vía token de invitación | Participante | ✅ Implementada |
| **F-PSEA-05A** Ficha Registro | `FichaRegistro` — Formulario multi-sección con auto-save (datos lab, analizadores, instrumentos, logística) | Participante | ✅ Implementada |
| **F-PSEA-12** Reporte Participante | `FormularioRonda` / `FormularioReferencia` — Carga de réplicas, promedio, σ, k, U_exp con envío formal | Participante | ✅ Implementada |
| **F-PSEA-16** Quejas | `SubmitQueja` — Formulario para presentar queja con descripción, evidencia y tracking de resolución | Participante | 🔴 Por crear |
| **F-PSEA-17** Apelaciones | `SubmitApelacion` — Formulario de apelación formal contra resultado de desempeño | Participante | 🔴 Por crear |
| **F-PSEA-11** Recepción (parcial) | `ConfirmArrival` — Confirmación de llegada del participante al sitio / recepción de instrucciones | Participante | 🔴 Por crear |

### Funciones de cara al coordinador (admin)

| Formato SGC | Función en app | Actor | Estado actual |
|---|---|---|---|
| **F-PSEA-06** Plan de Ronda | `RoundConfig` — Config de ronda extendida: σ_pt, método valor asignado, personal, cronograma de hitos | Admin | 🟡 Parcial (~5 campos por agregar) |
| **F-PSEA-07** Lista Maestra | `ParticipantManager` — CRUD de participantes con código anónimo, historial por ronda, estado | Admin | ✅ Implementada |
| **F-PSEA-08** Preparación Ítem | `ItemPreparation` — Registro de CRM, lote, concentración, condiciones, operador | Admin | 🔴 Por crear |
| **F-PSEA-11** Envío/Recepción | `LogisticsTracker` — Fechas de envío, transporte, condiciones, confirmación de recepción | Admin | 🔴 Por crear |
| **F-PSEA-13** Revisión Datos | `DataReviewChecklist` — Checklist pre-análisis: unidades, formato, plausibilidad, cifras significativas | Admin | 🔴 Por crear |
| **F-PSEA-15** NC/CAPA | `NCTracker` — CRUD tipo tickets: hallazgo → causa raíz → corrección → verificación → cierre | Admin | 🔴 Por crear |

### Funciones de integración con pt_app

| Formato SGC | Función en app | Flujo | Estado actual |
|---|---|---|---|
| **F-PSEA-09** Homogeneidad | `HomogeneityResults` — Importar/mostrar resultados de homogeneidad calculados por pt_app | pt_app → app | 🔴 Por crear |
| **F-PSEA-10** Estabilidad | `StabilityResults` — Importar/mostrar resultados de estabilidad | pt_app → app | 🔴 Por crear |
| **F-PSEA-14** Cálculo Estadístico | `StatisticalApproval` — Mostrar z-scores, decisión estadística, aprobación formal | pt_app → app | 🔴 Por crear |

### Funciones de comunicación (P-PSEA-20)

| Acción de comunicación | Función en app | Trigger | Estado actual |
|---|---|---|---|
| Invitación a participar | `SendInvitation` — Email con token de acceso (WorkOS) | Admin crea participante | ✅ Implementada |
| Recordatorio de plazo | `SendReminder` — Notificación automática pre-deadline | Cron / manual | 🔴 Por crear |
| Cambio de calendario | `NotifyScheduleChange` — Email a participantes activos de la ronda | Admin modifica ronda | 🔴 Por crear |
| Resultados disponibles | `NotifyResults` — Notificación de que el informe está listo | Admin publica resultados | 🔴 Por crear |
| Confirmación de recepción | `AckReceipt` — Confirmación automática al participante al confirmar F-PSEA-11 | Sistema | 🔴 Por crear |

---

## 5. Lo que NO debe ir en la app (documentación estática)

Estos documentos son **políticas, procedimientos narrativos o matrices de referencia** que no cambian por ronda. Meterlos en una app transaccional sería sobreingeniería:

| Documento | Razón para quedarse offline |
|---|---|
| **DG-PSEA-01** Manual de Calidad | Documento de política. Se actualiza ~1 vez/año. PDF/docx controlado. |
| **P-PSEA-01 a P-PSEA-09** Procedimientos operativos | Narrativos. Definen el "cómo" — documentación de referencia que declara a la app como canal. |
| **P-PSEA-11 a P-PSEA-28** Procedimientos de gestión | Idem. Son gobernanza documental. Algunos (P-PSEA-20, 23, 26) referencian la app. |
| **I-PSEA-02 a I-PSEA-15** Instructivos | Documentos de instrucción. Se leen, no se llenan. |
| **F-PSEA-01/02** Calendario/Cronograma | Mejor como Gantt/Excel. No encaja en una app CRUD. |
| **F-PSEA-04** Formato Informe Resultados | El informe final es un documento generado (Quarto/Word), no un form. |
| **F-PSEA-18** Acta Revisión Dirección | Evento anual, formato narrativo. No justifica digitalización. |
| **F-PSEA-19** Lista Verificación Auditoría | Checklist de auditoría — posible candidato futuro, pero no prioritario. |
| **F-PSEA-20** Protocolo Validación Software | Documento técnico narrativo. |
| **F-PSEA-21** Matriz Competencia | Tabla estática de personal. Mejor en Excel/Sheets. |
| **F-PSEA-22** Matriz Riesgos Imparcialidad | Tabla de evaluación periódica. No es transaccional por ronda. |
| **F-PSEA-23** Evaluación Proveedores | Registro periódico, no por ronda. |

---

## 6. La guía de usuario como instructivo

La guía de usuario de CALAIRE-APP cumple la función de **I-PSEA-09 (Instrucciones a Participantes)** para la parte digital del flujo. Pero hay un matiz:

| Aspecto | Guía de usuario app | I-PSEA-09 SGC |
|---|---|---|
| **Alcance** | Cómo usar la app (login, formulario, envío) | Qué reportar, formato de datos, plazos, contacto |
| **Audiencia** | Usuario técnico (lab) frente a una pantalla | Participante del esquema EA (incluye lo no-digital) |
| **Diferencia clave** | Operación del software | Protocolo metrológico completo |

**Recomendación:** No fusionarlos. La guía de usuario **referencia** a I-PSEA-09 para las instrucciones metrológicas. I-PSEA-09 **referencia** a la guía de usuario para el flujo digital. Dos documentos complementarios, no uno solo.

---

## 7. Mapa SGC × CALAIRE-APP

```
                      CALAIRE-APP
                 ┌─────────────────────┐
                 │                     │
  ┌──────────────┤  YA IMPLEMENTADO    │
  │              │  F-05, 05A, 07, 12  │
  │              │  + Invitaciones     │
  │              └──────┬──────────────┘
  │                     │
  │  ┌──────────────────▼──────────────┐
  │  │  FUNCIONES POR CREAR            │
  │  │  Participante: Quejas (F-16),   │
  │  │    Apelaciones (F-17),          │
  │  │    Recepción (F-11)             │
  │  │  Admin: ItemPrep (F-08),        │
  │  │    DataReview (F-13),           │
  │  │    NCTracker (F-15),            │
  │  │    RoundConfig+ (F-06)          │
  │  │  Comms: Reminders, Notify (P-20)│
  │  └──────────────────┬──────────────┘
  │                     │
  │  ┌──────────────────▼──────────────┐
  │  │  INTEGRACIÓN pt_app             │
  │  │  F-09, 10, 14 (H&S, stats)     │
  │  └──────────────────┬──────────────┘
  │                     │
  │  ┌──────────────────▼──────────────┐
  │  │  PROCEDIMIENTOS QUE REFERENCIAN │
  │  │  P-PSEA-09, 20, 23, 26         │
  │  │  (offline, pero declaran app    │
  │  │   como canal operativo)         │
  │  └──────────────────┬──────────────┘
  │                     │
  │  ┌──────────────────▼──────────────┐
  │  │  OFFLINE / ESTÁTICO             │
  │  │  DG-01, demás P-PSEA,          │
  │  │  todos los I-PSEA,             │
  │  │  F-01/02/04/18-23              │
  │  └─────────────────────────────────┘
```

## 8. Resumen ejecutivo

| Categoría | Formatos/Funciones | Funciones app | Estado |
|---|---|---|---|
| Ya implementado | F-05, 05A, 07, 12 | 4 funciones | ✅ |
| Funciones participante por crear | F-11, 16, 17 | 3 funciones | 🔴 |
| Funciones admin por crear | F-06+, 08, 13, 15 | 4 funciones | 🔴 |
| Funciones comunicación (P-PSEA-20) | Reminders, Notify, AckReceipt | 4 funciones | 🔴 |
| Integración pt_app | F-09, 10, 14 | 3 funciones | 🔴 |
| Procedimientos que referencian app | P-PSEA-09, 20, 23, 26 | — (docs offline) | 🟡 Por redactar |
| Documentación estática | ~38 docs | — | Offline |

**Conclusión pragmática:** CALAIRE-APP es el **brazo operativo del SGC** — no lo reemplaza, lo ejecuta. Los procedimientos (P-PSEA) definen *qué* debe pasar; la app implementa *cómo* pasa. Cada formato transaccional (F-PSEA) del SGC corresponde a una **función concreta** que debe existir en la app. Hoy hay 4 implementadas; faltan ~14 por crear, de las cuales las de interacción con participantes (quejas, apelaciones, recepción) y las de comunicación (P-PSEA-20) son las más visibles.
