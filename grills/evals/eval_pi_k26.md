# Evaluación Comparativa: 4 Planes SGC para CALAIRE-APP

**Fecha:** 2026-06-07  
**Evaluador:** Pi (agente de código)  
**Planes evaluados:**
- `plan_agy.md` — Plan Agente Agy
- `plan_codex.md` — Plan Codex
- `plan_oc.md` — Plan OpenCode
- `plan_pi.md` — Plan Pi

---

## Contexto del Proyecto

CALAIRE-APP es una aplicación Next.js + Convex para gestión de rondas de ensayo de aptitud (EA) de calidad del aire. El proyecto necesita implementar un **panel operativo SGC** (Sistema de Gestión de Calidad) que centralice la gestión documental y los registros operativos por ronda, sin convertir la app en un gestor documental general.

**Stack tecnológico actual:**
- Frontend: Next.js (versión con breaking changes, ver `node_modules/next/dist/docs/`)
- Backend: Convex (ver `convex/_generated/ai/guidelines.md`)
- Auth: WorkOS
- Storage: Convex Storage
- Package manager: pnpm (obligatorio)

**Schema actual:** `rondas`, `rondaContaminantes`, `rondaParticipantes`, `rondaPtItems`, `rondaPtSampleGroups`, `envios`, `enviosPt`, `fichasRegistro` (+ acompañantes, analizadores, instrumentos), `directorioParticipantes`.

**Estados de ronda actuales:** `borrador | activa | cerrada`.

---

## Metodología de Evaluación

Cada plan se evalúa en 22 dimensiones técnicas y de diseño. La puntuación usa estrellas (⭐) y cruces (❌):
- ⭐⭐⭐⭐⭐ = Excelente / muy completo
- ⭐⭐⭐⭐ = Bueno / bien definido
- ⭐⭐⭐ = Aceptable / básico
- ⭐⭐ = Débil / incompleto
- ⭐ = Muy débil / mencionado sin detalle
- ❌ = Ausente / no contemplado

---

## 1. PLAN AGY (`plan_agy.md`)

### Resumen
Plan conciso de 2 fases: (1) Base de datos y backend Convex, (2) Interfaz de usuario dashboard admin. Creado tras sesión de grill-me. Estado: aprobado pero no iniciado.

### Fortalezas Detalladas

| # | Fortaleza | Impacto |
|---|-----------|---------|
| 1 | **Simplicidad extrema** | Solo 2 fases claras con archivos y acciones específicas. Facilita la ejecución inmediata. |
| 2 | **Enfoque en implementación** | No se pierde en discusiones teóricas. Va directo al código. |
| 3 | **Integración con formatos existentes** | Reconoce explícitamente F-PSEA-06, F-PSEA-08, F-PSEA-13 como objetivos. |
| 4 | **Trazabilidad de ejecución** | Log con checkboxes para seguimiento de fases. |
| 5 | **Propuesta de almacenamiento** | Menciona Convex storage para documentos por ronda. |
| 6 | **Reconoce tablas necesarias** | Identifica `rondaDocumentos` y `rondaHitos` como nuevas tablas. |
| 7 | **Referencia a grill-me** | El plan se basa en decisiones de una sesión de grill-me previa. |

### Debilidades Detalladas

| # | Debilidad | Severidad | Impacto |
|---|-----------|-----------|---------|
| 1 | **Alcance limitado a Fase 1** | 🔴 Alta | No hay visión de MVP 2, incrementos futuros, ni roadmap. El plan termina en la UI del dashboard. |
| 2 | **Sin definición de "nativo vs archivo"** | 🔴 Alta | No establece criterios para decidir qué se implementa como registro nativo en la app vs qué se carga como archivo. Esto es crítico para el diseño del schema. |
| 3 | **Sin estados de ronda ampliados** | 🔴 Alta | Mantiene `borrador | activa | cerrada`. No contempla estados intermedios como `documentacion_pendiente` que son esenciales para un flujo SGC real. |
| 4 | **Sin matriz documental** | 🔴 Alta | No hay catálogo maestro de documentos SGC. No se sabe qué formatos existen, cuáles aplican, ni su estado. |
| 5 | **Sin visibilidad por rol** | 🟡 Media | No define qué ve el participante vs el admin. En un sistema SGC esto es fundamental. |
| 6 | **Sin versionamiento de documentos** | 🟡 Media | No menciona versiones de documentos ni historial. |
| 7 | **Sin checklist formal** | 🟡 Media | Menciona "checklist de cierre documental" pero no define items, estados, ni reglas de completitud. |
| 8 | **Sin plantillas de comunicación** | 🟡 Media | No contempla P-20 ni comunicaciones con participantes. |
| 9 | **Sin casos SGC** | 🟡 Media | No menciona quejas, apelaciones, NC/CAPA ni mecanismos de mejora. |
| 10 | **Sin evidencias de pt_app** | 🟢 Baja | No contempla integración con la herramienta PT externa. |
| 11 | **Sin cronograma de hitos** | 🟡 Media | Menciona hitos pero no los define. |
| 12 | **Dependencia del grill-me** | 🟢 Baja | El plan se basa en `grillme-agy.md` pero no incorpora todas las decisiones documentadas allí. |

### Veredicto
> **Plan de transición / POC.** Útil para arrancar rápido pero insuficiente como visión completa del SGC. Necesita ser complementado con decisiones de alcance, criterios de nativo vs archivo, y estados de ronda ampliados. Recomendado solo como punto de partida inmediato, no como plan maestro.

---

## 2. PLAN CODEX (`plan_codex.md`)

### Resumen
Plan estructurado con decisiones de diseño acordadas, regla nativo vs archivo, arquitectura funcional con diagramas, visibilidad por rol, cronograma de 11 hitos, estados de ronda con advertencias, registros críticos, comunicaciones, comentarios, evidencias versionadas, integración pt_app, y división en MVP 1 y MVP 2.

### Fortalezas Detalladas

| # | Fortaleza | Impacto |
|---|-----------|---------|
| 1 | **Regla nativo vs archivo** | Define criterios explícitos con ejemplos. Fundamental para decisiones de diseño. |
| 2 | **Visibilidad por rol detallada** | Tabla completa admin vs participante por cada pieza del panel. |
| 3 | **Arquitectura funcional diagramada** | 6 componentes con diagrama de flujo: checklist, cronograma, evidencias, comunicaciones, notificaciones, comentarios, resultados pt_app. |
| 4 | **Navegación propuesta** | Diagrama de navegación con selector de ronda y secciones. |
| 5 | **Cronograma nativo completo** | 11 hitos mínimos con campos completos por hito (14 campos). |
| 6 | **Estados de ronda con diagrama** | Diagrama de estado con advertencias y bloqueos. Flujo visual claro. |
| 7 | **Registros críticos explícitos** | Lista de qué es crítico siempre vs condicional. Facilita validaciones. |
| 8 | **Comunicaciones con flujo** | Diagrama de flujo para preparar y registrar comunicaciones manuales. |
| 9 | **Comentarios con promoción a caso** | Flujo de comentario → caso SGC (queja, apelación, NC/CAPA). |
| 10 | **Evidencias con modelo ER** | Modelo entidad-relación con series documentales y versiones. |
| 11 | **Integración pt_app con estados** | Define metadatos, estados de aprobación, y flujo de aprobación admin. |
| 12 | **División MVP 1 / MVP 2** | 11 items para MVP 1, 7 items para MVP 2. Priorización clara. |
| 13 | **9 tablas propuestas** | Cada tabla con propósito definido. Buena base para el schema. |
| 14 | **Orden técnico de 10 pasos** | Secuencia lógica de implementación. |

### Debilidades Detalladas

| # | Debilidad | Severidad | Impacto |
|---|-----------|-----------|---------|
| 1 | **Sin matriz documental maestra** | 🔴 Alta | No propone un mapa maestro del SGC. No hay visión global de qué documentos existen, su estado, ni su modo de gestión. |
| 2 | **Sin estados de ronda formales en schema** | 🔴 Alta | El diagrama de estado es conceptual pero no propone agregar `documentacion_pendiente` al schema de `rondas`. |
| 3 | **Sin plan de ronda nativo detallado** | 🟡 Media | No desglosa F-PSEA-06 en bloques literales (ej: `a` a `u`). Solo menciona "Plan de Ronda". |
| 4 | **Sin snapshots de registros** | 🟡 Media | No contempla historial de versiones de registros nativos. Solo versiones de archivos. |
| 5 | **Sin PDF imprimible** | 🟡 Media | No menciona exportación a PDF de formatos nativos. |
| 6 | **Sin importación CSV** | 🟡 Media | No contempla carga inicial de catálogo ni matriz. |
| 7 | **F-13 muy genérico** | 🟡 Media | Solo menciona "checklist manual" sin detalle de items ni métricas de apoyo. |
| 8 | **Plantillas P-20 sin detalle** | 🟢 Baja | Menciona plantillas pero no define variables ni ubicación en repo. |
| 9 | **Complejidad alta para MVP 1** | 🟡 Media | 9 tablas + 11 hitos + 6 componentes puede ser abrumador. Falta un "primer corte" más pequeño. |
| 10 | **Sin estados del panel por formato** | 🟡 Media | No define estados como `no_aplica`, `cubierto_nativo`, `cubierto_archivo`, `requiere_revision`. |
| 11 | **F-08 sin detalle técnico** | 🟢 Baja | Menciona preparación de items pero sin campos técnicos (niveles, concentraciones, cilindros). |
| 12 | **Sin riesgos/tradeoffs documentados** | 🟢 Baja | No hay sección de decisiones conscientes aceptadas. |

### Veredicto
> **Plan más completo y estructurado.** Excelente para la visión a largo plazo del SGC. Las debilidades principales son la falta de un "primer vertical slice" claro, la ausencia de matriz documental maestra, y la falta de detalle en F-06/F-13. Recomendado como plan maestro de visión, pero necesita ser complementado con un plan de fase 1 más operativo.

---

## 3. PLAN OC (`plan_oc.md`)

### Resumen
Plan operativo detallado para fase 1 del panel SGC. Define explícitamente qué SÍ y qué NO entra. Incluye formatos con modo y criterio de cobertura, estados del panel, plan de ronda nativo por bloques `a` a `u`, F-13 con métricas de apoyo, evidencias con metadata automática, PDF imprimible, snapshots, estados de ronda ampliados con `documentacion_pendiente`, plantillas P-20, UI propuesta, modelo de datos, riesgos y tradeoffs, y orden de implementación de 12 pasos.

### Fortalezas Detalladas

| # | Fortaleza | Impacto |
|---|-----------|---------|
| 1 | **Alcance fase 1 explícito** | Tabla clara de qué entra y qué no entra. Elimina ambigüedad. |
| 2 | **Formatos fase 1 detallados** | 11 formatos con modo (`nativo`, `archivo`, `no_aplica`) y criterio de cobertura. Excelente para desarrollo. |
| 3 | **Estados del panel definidos** | 5 estados: `no_aplica`, `pendiente`, `cubierto_nativo`, `cubierto_archivo`, `requiere_revision`. |
| 4 | **Plan de ronda nativo por bloques** | Desglosa F-PPSEA-03 en bloques `a` a `u` con subcampos críticos identificados (`d`, `f`, `j/k`, `o`, `p`, `r`). |
| 5 | **F-13 detallado** | Checklist manual con métricas de apoyo específicas (participantes esperados, envíos finales, completitud, celdas faltantes, estado CSV). |
| 6 | **Evidencias con metadata automática** | 12 campos de metadata automática. Tipos permitidos (PDF, DOCX, XLSX, CSV, PNG/JPG). Límite de 10MB. |
| 7 | **PDF imprimible** | Requisitos completos para F-06 y F-13: contenido, estado/fechas, listado de evidencias. Sin marca de borrador. |
| 8 | **Snapshots e historial** | Diferencia clara: versiones de evidencias (`v1`, `v2`) vs snapshots de registros (fecha+usuario). |
| 9 | **Estados de ronda ampliados** | Agrega `documentacion_pendiente` con flujo completo `borrador -> activa -> documentacion_pendiente -> cerrada`. |
| 10 | **Requisitos de transición definidos** | Exactamente qué se necesita para pasar de `activa` a `documentacion_pendiente` y de `documentacion_pendiente` a `cerrada`. |
| 11 | **Reapertura definida** | `cerrada` puede reabrirse a `documentacion_pendiente`. No vuelve a `activa`. |
| 12 | **Plantillas P-20 con variables** | 5 plantillas mínimas con variables explícitas (`{{ronda_codigo}}`, `{{ronda_nombre}}`, etc.). |
| 13 | **UI propuesta detallada** | Columnas, agrupación por fase, resumen de progreso, lista de bloqueantes, acciones por formato. |
| 14 | **Modelo de datos** | 5 tablas nuevas con propósito claro. Cambios a `rondas`. Catálogo en código. |
| 15 | **Riesgos y tradeoffs** | Sección explícita de 7 decisiones conscientes aceptadas. Muy valioso para gestión de expectativas. |
| 16 | **Orden de implementación** | 12 pasos secuenciales con dependencias lógicas. |

### Debilidades Detalladas

| # | Debilidad | Severidad | Impacto |
|---|-----------|-----------|---------|
| 1 | **Sin matriz documental maestra** | 🔴 Alta | Aunque tiene catálogo en código, no propone importación ni matriz global del SGC. |
| 2 | **Sin casos SGC en fase 1** | 🟡 Media | Quejas, apelaciones, NC/CAPA declarados explícitamente fuera de fase 1. |
| 3 | **Sin comentarios de participantes en fase 1** | 🟡 Media | No entran en fase 1. |
| 4 | **Sin notificaciones in-app en fase 1** | 🟢 Baja | Declarado como fuera de fase 1. |
| 5 | **Sin integración pt_app estructurada** | 🟡 Media | Solo evidencias por archivo. No hay metadatos ni estados de aprobación como Codex. |
| 6 | **Sin bitácora de eventos completa** | 🟢 Baja | Solo campos básicos `createdAt/updatedAt`. |
| 7 | **F-11 marcado como no aplica** | 🟢 Baja | Podría necesitar reconsideración si el esquema de envío de items cambia. |
| 8 | **Códigos provisionales** | 🟡 Media | Acepta que los códigos SGC son provisionales. Crea deuda técnica documental. |
| 9 | **F-13 puede finalizarse incompleto** | 🟡 Media | Reducción de control documental aceptada como tradeoff. Riesgo para auditoría. |
| 10 | **Sin vista Gantt/calendario** | 🟢 Baja | Cronograma es tabla simple. |
| 11 | **Sin regla nativo vs archivo explícita** | 🟡 Media | Aunque los criterios están implícitos en la tabla de formatos, no hay una regla general como Codex. |
| 12 | **Sin visibilidad por rol detallada** | 🟡 Media | Menciona que participantes ven ciertas cosas pero no tiene tabla completa como Codex. |

### Veredicto
> **Plan más operativo y realista.** Excelente definición de fase 1 con decisiones conscientes de tradeoffs. La principal debilidad es que deja fuera de fase 1 varias piezas que otros planes sí contemplan (casos SGC, comentarios, notificaciones). Recomendado como plan de ejecución inmediata para fase 1, con la condición de que los items fuera de fase 1 se planifiquen para fase 2.

---

## 4. PLAN PI (`plan_pi.md`)

### Resumen
Plan ambicioso y estratégico con matriz documental maestra, 4 modos de gestión, 8 procesos, importación CSV, control documental con versiones, visibilidad por rol, plan de ronda F-PSEA-06, F-PSEA-08 con tabla de niveles, F-PSEA-11 declarado como no aplica, F-PSEA-13 conceptual, integración pt_app, comentarios de participantes, casos SGC unificados, permisos, rutas propuestas, y 3 incrementos.

### Fortalezas Detalladas

| # | Fortaleza | Impacto |
|---|-----------|---------|
| 1 | **Matriz documental maestra** | Único plan que propone un mapa maestro completo del SGC. Diferenciador estratégico. |
| 2 | **Modos de gestión** | 4 modos: `nativo`, `archivo`, `generado`, `integracion`. Framework de decisión claro. |
| 3 | **Procesos principales** | 8 categorías de procesos para organizar el SGC. |
| 4 | **Importación CSV** | Define clave única (`codigo + rondaCodigo`) y reglas de upsert. Carga inicial estructurada. |
| 5 | **Control documental** | Modelo de versiones con estados `vigente`/`obsoleto`. Versión sugerida editable. |
| 6 | **Visibilidad participantes** | Reglas explícitas de qué ven los participantes. |
| 7 | **Plan de ronda F-PSEA-06** | Campos posibles y estado sencillo (`planCompletadoAt`/`planCompletadoPor`). |
| 8 | **F-PSEA-08 Preparación de ítem** | Modelo con `preparacionItemsRonda` y `preparacionItemsNiveles`. Campos técnicos (concentración, cilindro, lote). |
| 9 | **F-PSEA-11 explícito** | Declara "No aplica" con justificación técnica (ítem in situ). |
| 10 | **F-PSEA-13 conceptual** | Modelo con campos de checklist estructurado. |
| 11 | **Integración pt_app** | Define `analisisPtRonda` para homogeneidad/estabilidad/estadístico con `storageId`. |
| 12 | **Comentarios de participantes** | Modelo con estados `recibido`/`respondido`/`cerrado`. Asociación opcional a ronda. |
| 13 | **Casos SGC unificados** | Módulo único para NC/CAPA, quejas, apelaciones con 5 estados comunes. |
| 14 | **Permisos y visibilidad** | Admin vs participante bien definido. |
| 15 | **Rutas propuestas** | 13 rutas, con 7 para Incremento 1. Estructura de navegación clara. |
| 16 | **Incrementos claros** | 3 incrementos bien definidos con scope específico. |
| 17 | **Primer vertical slice** | Recomienda empezar por documentos + versiones. Enfoque pragmático. |

### Debilidades Detalladas

| # | Debilidad | Severidad | Impacto |
|---|-----------|-----------|---------|
| 1 | **Sin estados de ronda ampliados** | 🔴 Alta | No propone `documentacion_pendiente`. Mantiene flujo simple de ronda. |
| 2 | **Sin snapshots de registros** | 🟡 Media | No contempla historial de versiones de registros nativos. |
| 3 | **Sin PDF imprimible** | 🟡 Media | No menciona exportación formal de formatos nativos. |
| 4 | **Sin plantillas P-20 detalladas** | 🟢 Baja | Menciona plantillas pero sin variables ni ubicación. |
| 5 | **F-06 sin bloques literales** | 🟡 Media | No desglosa en `a` a `u` como plan OC. |
| 6 | **F-13 sin métricas de apoyo** | 🟡 Media | Modelo conceptual sin detalle de items del checklist ni métricas. |
| 7 | **Cronograma sin hitos mínimos definidos** | 🟡 Media | Modelo conceptual pero sin lista de 11 hitos como Codex. |
| 8 | **Sin estados del panel por formato** | 🟡 Media | No define `no_aplica`, `cubierto_nativo`, etc. |
| 9 | **Auditoría diferida** | 🟢 Baja | "Se diseñará pensando en bitácora pero no se implementará todavía". |
| 10 | **Complejidad de matriz** | 🟡 Media | La matriz documental puede ser overkill para MVP. |
| 11 | **CSV parseado fuera de Convex** | 🟢 Baja | Añade complejidad de infraestructura. |
| 12 | **Sin regla nativo vs archivo explícita** | 🟡 Media | No tiene criterios generales como Codex. Los modos de gestión son similares pero no iguales. |
| 13 | **Sin riesgos/tradeoffs** | 🟢 Baja | No hay sección de decisiones conscientes aceptadas. |
| 14 | **Sin comunicaciones manuales** | 🟡 Media | No define flujo de comunicaciones registradas como Codex. |

### Veredicto
> **Plan más ambicioso y estratégico.** La matriz documental es un diferenciador importante que ningún otro plan contempla. La debilidad principal es que no define estados de ronda intermedios ni detalles operativos de F-06/F-13 como OC. Recomendado como visión estratégica a largo plazo y para la fase de matriz documental, pero necesita ser complementado con un plan de fase 1 operativo.

---

## Matriz Comparativa Consolidada

| Dimensión | AGY | CODEX | OC | PI |
|---|---|---|---|---|
| **Concisión** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Alcance fase 1 definido** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Regla nativo vs archivo** | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Matriz documental maestra** | ❌ | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| **Estados de ronda ampliados** | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Plan de ronda F-06 detallado** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **F-13 checklist detallado** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Versionamiento de evidencias** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Snapshots de registros** | ❌ | ❌ | ⭐⭐⭐⭐⭐ | ❌ |
| **PDF imprimible** | ❌ | ❌ | ⭐⭐⭐⭐⭐ | ❌ |
| **Plantillas P-20** | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cronograma/hitos** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Comunicaciones** | ❌ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Comentarios participantes** | ❌ | ⭐⭐⭐⭐ | ❌ (f1) | ⭐⭐⭐⭐ |
| **Casos SGC (NC/Quejas)** | ❌ | ⭐⭐⭐⭐ | ❌ (f1) | ⭐⭐⭐⭐ |
| **Visibilidad por rol** | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Importación CSV** | ❌ | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| **Integración pt_app** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Bitácora/auditoría** | ❌ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Rutas/UI propuesta** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Incrementos/MVP definidos** | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Riesgos/tradeoffs documentados** | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## Análisis por Dimensiones Críticas

### Dimensión 1: Alcance y Foco
- **AGY**: Muy enfocado pero limitado. Solo Fase 1 sin visión futura.
- **CODEX**: Amplio pero sin priorización clara de primer corte.
- **OC**: Fase 1 muy bien definida con exclusiones explícitas. Tradeoffs documentados.
- **PI**: Amplio con incrementos bien definidos. Primer vertical slice recomendado.

**Ganador:** OC para fase 1 inmediata. PI para roadmap completo.

### Dimensión 2: Modelo de Datos
- **AGY**: Menciona 2 tablas nuevas sin detalle.
- **CODEX**: 9 tablas con propósito. Modelo ER para evidencias.
- **OC**: 5 tablas + cambios a `rondas`. Campos detallados.
- **PI**: 5 tablas principales + modelo conceptual para casos, comentarios, análisis.

**Ganador:** Codex para evidencias. OC para estados de ronda. PI para matriz documental.

### Dimensión 3: Operatividad (F-06, F-13, F-08)
- **AGY**: Menciona los formatos sin detalle.
- **CODEX**: Menciona checklist pero sin items.
- **OC**: Desglosa F-06 en bloques `a` a `u`. F-13 con métricas. F-08 como archivo.
- **PI**: F-06 con campos posibles. F-08 con tabla de niveles. F-13 conceptual.

**Ganador:** OC para F-06/F-13. PI para F-08.

### Dimensión 4: Gestión Documental
- **AGY**: Sin definición.
- **CODEX**: Series documentales con versiones. Modelo ER.
- **OC**: Evidencias con metadata automática. Snapshots. Sin borrado.
- **PI**: Matriz documental maestra. Control documental con versiones. Importación CSV.

**Ganador:** PI para matriz maestra. Codex para versionamiento. OC para metadata y snapshots.

### Dimensión 5: Flujo de Ronda
- **AGY**: Estados existentes.
- **CODEX**: Diagrama conceptual con advertencias.
- **OC**: Estados ampliados con `documentacion_pendiente`. Requisitos de transición definidos.
- **PI**: Estados simples. Sin intermedio.

**Ganador:** OC claramente.

### Dimensión 6: Participantes y Comunicaciones
- **AGY**: Sin definición.
- **CODEX**: Comunicaciones manuales registradas. Comentarios con promoción. Notificaciones.
- **OC**: Plantillas P-20. Sin comentarios ni notificaciones en fase 1.
- **PI**: Comentarios con estados. Casos SGC. Sin comunicaciones manuales.

**Ganador:** Codex para comunicaciones. PI para comentarios y casos.

---

## Hallazgos Transversales

### 1. Complementariedad de los Planes
Ningún plan es suficiente por sí solo. Cada uno aporta dimensiones que los otros no cubren:
- **AGY**: Punto de partida inmediato.
- **Codex**: Visión completa, reglas de decisión, visibilidad por rol.
- **OC**: Operatividad de fase 1, estados de ronda, F-06/F-13 detallados, PDF, snapshots.
- **PI**: Matriz documental, F-08 técnico, casos SGC, comentarios, importación CSV.

### 2. Decisiones No Resueltas entre Planes
| Decisión | AGY | Codex | OC | PI |
|---|---|---|---|---|
| ¿F-06 editable después de finalizado? | ❓ | ❓ | Sí, con snapshots | ❓ |
| ¿F-13 exige completitud? | ❓ | ❓ | No, tradeoff aceptado | ❓ |
| ¿Códigos SGC provisionales? | ❓ | ❓ | Sí, tradeoff aceptado | ❓ |
| ¿F-11 aplica o no? | ❓ | ❓ | No aplica | No aplica |
| ¿Emails automáticos? | ❓ | MVP 2 | No fase 1 | Después |
| ¿Notificaciones in-app? | ❓ | MVP 1 | No fase 1 | Después |

### 3. Riesgos Comunes
1. **Complejidad del schema**: Todos los planes (excepto AGY) proponen 5-9 tablas nuevas. El schema actual tiene 10 tablas. El schema SGC podría duplicar el tamaño.
2. **Deuda técnica documental**: OC acepta códigos provisionales. Esto debe revisarse antes de auditoría.
3. **Sobrecarga de MVP 1**: Codex propone 11 items para MVP 1. OC propone 12 pasos. Ambos pueden ser demasiado para un solo sprint.
4. **Integración pt_app**: Ningún plan resuelve cómo se sincronizarán los datos. Solo evidencias por archivo.

### 4. Oportunidades de Sinergia
1. **Combinar OC + Codex para fase 1**: Toma la operatividad de OC y las reglas de decisión de Codex.
2. **Combinar PI + Codex para fase 2**: Toma la matriz documental de PI y los casos SGC, con las comunicaciones de Codex.
3. **Usar AGY como checklist de ejecución**: Sus 2 fases pueden mapearse a tareas concretas del plan híbrido.

---

## Recomendación Final: Plan Híbrido Consolidado

Basado en la evaluación, se propone un **plan híbrido** que tome lo mejor de cada plan:

### Fase 1 (MVP 1) — Basado principalmente en OC + Codex

| Componente | Fuente principal | Notas |
|---|---|---|
| Alcance fase 1 explícito | **OC** | Tabla de formatos con modo y criterio |
| Estados de ronda ampliados | **OC** | `borrador -> activa -> documentacion_pendiente -> cerrada` |
| Regla nativo vs archivo | **Codex** | Criterios explícitos |
| Plan de ronda F-06 | **OC** | Bloques `a` a `u` con subcampos críticos |
| F-13 checklist | **OC** | Manual con métricas de apoyo |
| Evidencias por archivo | **OC + Codex** | Metadata automática + versionamiento |
| PDF imprimible | **OC** | F-06 y F-13 |
| Snapshots de registros | **OC** | Historial por fecha/usuario |
| Cronograma de hitos | **Codex** | 11 hitos mínimos |
| Estados del panel | **OC** | 5 estados por formato |
| Plantillas P-20 | **OC** | Markdown con variables |
| Visibilidad por rol | **Codex** | Tabla admin vs participante |
| Comunicaciones | **Codex** | Flujo manual registrado |
| Comentarios de ronda | **Codex** | Con posibilidad de promover a caso |
| Notificaciones | **Codex** | Visibles admin/participante |

### Fase 2 (MVP 2) — Incorporar PI

| Componente | Fuente | Notas |
|---|---|---|
| Matriz documental maestra | **PI** | Importación CSV, modos de gestión |
| Casos SGC | **PI + Codex** | NC/CAPA, quejas, apelaciones |
| Integración pt_app estructurada | **PI + Codex** | Metadatos + aprobación |
| F-PSEA-08 nativo | **PI** | Tabla de niveles |
| F-PSEA-13 nativo | **PI + OC** | Checklist estructurado |

### Lo que se deja fuera inicialmente (aceptado)

- Gestor documental general
- Emails reales / notificaciones automáticas
- Cron automático
- Bitácora de eventos completa
- Vista Gantt/calendario
- Cálculos nativos estadísticos

---

## Primer Vertical Slice Recomendado

Combinando OC (pasos 2-5) + Codex (orden técnico 1-3) + PI (primer slice):

1. **Catálogo SGC en código** (`lib/sgc/catalog.ts`) — basado en OC + PI
2. **Schema Convex**: `sgcEvidencias`, `sgcPlanRonda`, `sgcRevisionDatos`, `sgcHitosRonda`, `sgcSnapshots` — basado en OC
3. **Ampliar estado de ronda** con `documentacion_pendiente` — OC
4. **Pestaña SGC** en `RondaContextNav` — OC
5. **Tabla/checklist** agrupada por fase — OC
6. **Carga de evidencias** con Convex Storage — OC + Codex
7. **Plan de ronda nativo** (bloques `a` a `u`) — OC
8. **F-13 checklist** manual — OC
9. **PDF imprimible** para F-06/F-13 — OC
10. **Plantillas P-20** Markdown — OC

---

## Conclusión

Los 4 planes son **complementarios**, no competidores:

- **AGY** es el punto de partida inmediato.
- **Codex** es la visión completa y las reglas de decisión.
- **OC** es el plan operativo de fase 1 más detallado.
- **PI** es la estrategia a largo plazo con matriz documental.

La recomendación es **no elegir uno solo**, sino **consolidar un plan híbrido** que tome:
- De **OC**: La operatividad de fase 1, estados de ronda, F-06/F-13 detallados, PDF, snapshots.
- De **Codex**: Las reglas de decisión, visibilidad por rol, comunicaciones, comentarios.
- De **PI**: La matriz documental, F-08 técnico, casos SGC, importación CSV.
- De **AGY**: El enfoque en ejecución inmediata.

---

*Documento generado el 2026-06-07 como parte de la evaluación de planes SGC para CALAIRE-APP.*
