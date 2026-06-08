# Evaluación Comparativa de los 4 Planes SGC

**Fecha**: 2026-06-07
**Planes evaluados**: plan_agy.md, plan_codex.md, plan_oc.md, plan_pi.md

---

## 1. Resumen Ejecutivo

| Dimensión | Plan AGY | Plan Codex | Plan OC | Plan Pi |
|---|---|---|---|---|
| **Alcance F1** | Muy acotado | Amplio pero priorizado | Preciso y pragmático | Muy ambicioso |
| **Profundidad técnica** | Baja | Alta | Muy alta | Alta |
| **Alineación con codebase** | Baja | Media-Alta | Alta | Media |
| **Madurez del modelo de datos** | Esbozo | Completo pero genérico | Muy específico y aplicado | Completo pero sobredimensionado |
| **Riesgo de overscope** | Bajo | Medio | Bajo | Alto |
| **Riesgo de underscope** | Alto | Bajo | Bajo | Bajo |

---

## 2. Evaluación Detallada por Plan

### Plan AGY

**Fortalezas:**
- Minimalista y directo: 2 fases, pocas tablas
- Bajo riesgo de overscope
- Enfoque correcto: tabla + storage + navegación

**Debilidades críticas:**
- **Modelo de datos insuficiente**: Propone solo `rondaDocumentos` y `rondaHitos`, lo cual es demasiado simplista. No distingue entre series documentales y versiones, no modela estados de cobertura, no tiene checkpoint de cierre documental, no contempla snapshots.
- **Ausencia total de criterio nativo vs archivo**: No define qué es registro nativo y qué es evidencia cargada. Esto genera ambigüedad inmediata en la implementación.
- **Sin estados de ronda ampliados**: El schema actual solo tiene `borrador`, `activa`, `cerrada`. El plan no contempla el estado `documentacion_pendiente` que es esencial para bloquear envíos de participantes mientras se cierra documentación.
- **Sin mecanismo de cierre documental**: No define qué registros son críticos para cerrar una ronda, ni qué significa que estén "cubiertos".
- **F-PSEA-06, F-PSEA-08, F-PSEA-13 mencionados pero sin modelado**: Solo los nombra como "tabs" sin especificar su estructura, estados, o cómo interactúan con la ronda.
- **No contempla visibilidad por rol**: El participante no aparece en ningún lado.
- **No contempla plantillas P-20 ni comunicaciones**: Omite completamente este aspecto operativo.
- **Sin considerar el schema existente**: No referencia las tablas existentes (`rondas`, `rondaContaminantes`, `rondaParticipantes`, `fichasRegistro`, etc.), lo que sugiere un análisis superficial del codebase.

**Veredicto**: Demasiado incompleto para servir como guía de implementación. Funciona como intención pero no como especificación.

---

### Plan Codex

**Fortalezas:**
- **Arquitectura funcional clara**: El diagrama Mermaid y la descomposición del panel son excelentes. El eje "por ronda" está bien articulado.
- **Regla nativo vs archivo explícita**: Define claramente qué es transaccional y qué es archivo, con criterios y ejemplos.
- **Visibilidad por rol detallada**: La tabla admin vs participante es precisa y operativa.
- **Cronograma con hitos mínimos**: Los 11 hitos con campos detallados son prácticos y alineados con la operación real.
- **Estados de ronda con advertencias**: El state diagram con advertencias y bloqueos es un buen modelo mental.
- **Cierre documental explícito**: Lista clara de registros críticos siempre/condicionales.
- **Comunicaciones y notificaciones bien definidas**: Aunque MVP es manual, el modelo de comunicación con destinatarios y plantillas está pensado.
- **Comentarios con promoción a caso SGC**: Flujo lógico de comentario → queja/apelación/NC.
- **Evidencias con versionamiento sencillo**: Modelo de series + versiones con estado vigente/reemplazada/retirada.
- **Integración pt_app bien acotada**: MVP = adjuntar archivo + metadatos, sin reemplazar pt_app.
- **Separación MVP 1 / MVP 2**: Permite entregar valor rápido sin sacrificar visión.
- **Tabla de tablas Convex propuesta**: 9 tablas con nombres y propósitos claros.

**Debilidades:**
- **No detalla F-06 (Plan de Ronda)**: Lo menciona como crítico para cierre pero no modela su estructura interna ni cómo se edita por bloques.
- **No detalla F-13 (Revisión de Datos)**: Solo lo incluye en MVP 2 sin detalles.
- **No especifica el estado `documentacion_pendiente` para rondas**: Cae en la misma brecha que AGY respecto a transiciones de estado de la ronda.
- **Naming genérico de tablas**: `sgcChecklistItems` es un nombre vago que mezcla conceptos (¿es checklist de cierre? ¿es estado de cobertura por formato?).
- **No contempla snapshots ni historial de edición plana**: Si F-06 se edita, ¿cómo se preserva trazabilidad?
- **No contempla PDF imprimible**: Para un contexto ISO, la capacidad de generar un PDF formal es importante.
- **No alinea con las plantillas reales (F-PPSEA-03)**: No referencia qué plantilla concreta sigue el plan de ronda.

---

### Plan OC

**Fortalezas:**
- **El más pragmático y alineado con la realidad operativa**: Define explícitamente qué formatos son nativos existentes, nativos nuevos, o por archivo, con códigos provisionales.
- **Plan de ronda detallado al nivel de bloques**: Especifica bloques `a` a `u` con subcampos críticos, y cómo se autocompletan desde datos existentes. Esto es el nivel de detalle que ninguno otro plan tiene.
- **F-13 como checklist manual con métricas de apoyo**: Define exactamente qué hace, qué no hace (`puede finalizarse con checks pendientes`), y qué métricas muestra. Muy realista.
- **Estado `documentacion_pendiente` bien definido**: Incluye transiciones, requisitos para cada cambio de estado, y política de reapertura. Crítico y bien pensado.
- **Requisitos explícitos para transición de estados**: `activa → documentacion_pendiente` requiere F-05, F-05A, F-07, F-12 cubiertos + Plan finalizado. `documentacion_pendiente → cerrada` requiere todo el panel cubierto o no aplica.
- **F-11 explícitamente `no_aplica`**: Aclara que los ítems in situ no requieren envío/recepción. Esto evita implementar algo innecesario.
- **Evidencias con metadata automática**: Lista concreta de campos, incluyendo `seccion` opcional para vincular a literales del plan de ronda.
- **PDF imprimible planificado**: F-06 y F-13 generan vista formal descargable.
- **Snapshots e historial**: Soluciona el problema de trazabilidad cuando se edita un formato finalizado.
- **Plantillas P-20 con variables explícitas**: Incluye `{{ronda_codigo}}`, `{{fecha_limite}}`, etc. Lista concreta de plantillas mínimas.
- **Catálogo SGC en código**: `lib/sgc/catalog.ts` como fuente de verdad, no editable desde UI. Correcto para F1.
- **Limita F1 con claridad**: Lista explícita de lo que no incluye, evitando scope creep.
- **Tabla de estados del panel (`no_aplica`, `pendiente`, `cubierto_nativo`, `cubierto_archivo`, `requiere_revision`)**: Modelo semántico claro para la UI.
- **Referencia la plantilla real**: Identifica `Planificacion_R1_PP (1).md` como base del F-PPSEA-03.

**Debilidades:**
- **No modela NC/CAPA, quejas ni apelaciones**: Los excluye explícitamente de F1, lo cual es correcto, pero tampoco deja un "hook" en el modelo de datos para cuando se implementen.
- **Comunicaciones mínimas**: Solo plantillas Markdown sin flujo de registro. Falta cómo se vincula una comunicación enviada a la ronda.
- **No contempla un dashboard SGC global**: Solo piensa en la pestaña dentro de la ronda, sin vista resumen para el admin.
- **No define comentarios de participantes**: No hay modelo para que participantes escriban comentarios ni para que admin responda.
- **Audit log postergado**: Correcto para F1, pero los campos `createdBy`/`updatedBy` no existen en el schema actual, lo que puede requerir cambios más amplios.
- **No contempla la matriz documental maestra**: Falta una vista del SGC como sistema documental completo.

---

### Plan Pi

**Fortalezas:**
- **Visión más completa del SGC**: Incluye matriz documental, vista por procesos, casos SGC, comentarios y dashboard global.
- **Regla nativo vs archivo explícita con criterios**: Define cuándo algo debe ser nativo (cumple 2+ condiciones) y cuándo archivo.
- **Modelo de datos extenso**: Tablas con campos detallados para documentos, versiones, hitos, preparación ítems, revisión datos, comentarios, casos SGC.
- **8 procesos SGC bien definidos**: Organización lógica del SGC.
- **CSV importación para matriz documental**: Pensado para carga inicial real.
- **Visibilidad por rol detallada**: Admin ve todo, participante solo lo publicado y propio.
- **Casos SGC como módulo único**: NC/CAPA, quejas y apelaciones en un solo módulo escalable.
- **F-PSEA-08 modelado con detalle**: La preparación de ítems incluye tabla de niveles, CSV crudo, PDF de cilindro.
- **Rutas propuestas con incremento claro**: Define exactamente qué rutas existen en Incremento 1 vs Incremento 2.

**Debilidades críticas:**
- **Overscope significativo para Incremento 1**: La matriz documental con CSV, importación, 8 procesos, dashboard global, y control documental versión por versión es mucho para un primer entregable.
- **Matriz documental como primer vertical slice**: Comienza con `documentosSgc` + `documentoSgcVersiones` + importación CSV, que es gestión documental general, no cierre documental por ronda. Es iniciar por lo más complejo y menos urgente.
- **F-13 explícitamente fuera de Incremento 1**: Posterga la revisión de datos que es crítica para cerrar una ronda.
- **F-PSEA-06 como campos simples**: No modela el plan de ronda con bloques editables ni referencia la plantilla real. Pierde la riqueza del formato F-PPSEA-03.
- **Estados de ronda no ampliados**: No menciona `documentacion_pendiente`, lo que es una omisión seria.
- **Cronograma sin gantt/inicial** pero con 12 hitos estándar: Menos alineado con los hitos ISO reales que Codex.
- **`rondaHitos` con campos excesivos**: `notificarParticipantes` en incremento 1 cuando no hay notificaciones.
- **F-PSEA-11 "no aplica" bien definido**, pero es lo único que coincide con OC.
- **No contempla PDF imprimible**: Omite la necesidad de generar documentos formales.
- **No contempla snapshots de formatos**: Si se edita un plan finalizado, no hay mecanismo de trazabilidad.
- **9 tablas nuevas en Incremento 1**: Demasiado para un primer slice vertical. La carga cognitiva y el riesgo de refactor son altos.
- **No referencia el schema existente**: No analiza cómo las tablas nuevas se relacionan con `rondas`, `rondaParticipantes`, `fichasRegistro`, etc.

---

## 3. Análisis Cruzado por Criterios Clave

### 3.1 Modelo de datos

| Aspecto | AGY | Codex | OC | Pi |
|---|---|---|---|---|
| Tablas nuevas propuestas | 2 | 9 | 5 | 7+ |
| Alineación con schema actual | ❌ No lo referencia | ⚠️ Parcial | ✅ Referencia tablas existentes | ❌ No lo referencia |
| Versionamiento de evidencias | ❌ No modela | ✅ Series + versiones | ✅ Series + versiones + sección | ✅ Documentos + versiones |
| Snapshots/ historial | ❌ No | ❌ No | ✅ Snapshots para F-06/F-13 | ❌ No |
| Estados de ronda ampliados | ❌ No | ⚠️ No explícito | ✅ `documentacion_pendiente` | ❌ No |
| Cierre documental explícito | ❌ No | ✅ Lista de críticos | ✅ Con requisitos por transición | ⚠️ Implícito en la matriz |

**Ganador: OC** — Mejor balance entre completitud y pragmatismo. Las 5 tablas son suficientes y bien definidas.

### 3.2 Detalle de formatos SGC

| Aspecto | AGY | Codex | OC | Pi |
|---|---|---|---|---|
| F-PSEA-06 / F-PPSEA-03 | ❌ Solo nombra | ⚠️ Crítico pero sin detalle | ✅ Bloques a-u, subcampos, autocompletar | ⚠️ Campos simples |
| F-PSEA-08 | ❌ Solo nombra | ⚠️ MVP 2 | ⚠️ Archivo en F1 | ✅ Modelo con niveles |
| F-PSEA-13 | ❌ Solo nombra | ⚠️ MVP 2 | ✅ Checklist manual con métricas | ❌ Incremento 2 |
| F-PSEA-11 | ❌ No menciona | ⚠️ MVP 2 | ✅ `no_aplica` explícito | ✅ `no_aplica` explícito |
| Plantilla real | ❌ No | ❌ No | ✅ Referencia F-PPSEA-03 | ❌ No |

**Ganador: OC** — El único que modela los formatos con el nivel de detalle necesario para implementar en F1.

### 3.3 Operatividad y cierre por ronda

| Aspecto | AGY | Codex | OC | Pi |
|---|---|---|---|---|
| ¿El admin puede cerrar una ronda? | ❌ No definido | ✅ Con checklist | ✅ Con requisitos explícitos | ⚠️ Implícito |
| ¿Participante puede seguir enviando? | ❌ No abordado | ⚠️ No explícito | ✅ Bloqueado en `documentacion_pendiente` | ❌ No abordado |
| ¿Qué hacer si faltan críticos? | ❌ No definido | ✅ Bloquea cierre | ✅ Lista de bloqueantes en UI | ⚠️ No explícito |
| Reapertura de ronda | ❌ No | ❌ No | ✅ `cerrada → documentacion_pendiente` | ❌ No |

**Ganador: OC** — El único que define completamente el ciclo de vida de la ronda con SGC.

### 3.4 Escalabilidad y visión de futuro

| Aspecto | AGY | Codex | OC | Pi |
|---|---|---|---|---|
| NC/CAPA / Quejas / Apelaciones | ❌ No | ✅ Modelado (MVP 2) | ❌ F1, sin hook | ✅ Modelado (Inc 2) |
| Matriz documental maestra | ❌ No | ❌ No | ❌ No | ✅ Completa |
| Vista por procesos | ❌ No | ❌ No | ❌ No | ✅ 8 procesos |
| Dashboard SGC global | ❌ No | ✅ Panel SGC | ❌ Solo por ronda | ✅ Completo |
| Comentarios de participantes | ❌ No | ✅ Con promoción a caso | ❌ No | ✅ Con respuesta admin |
| Comunicaciones | ❌ No | ✅ Manual con registro | ⚠️ Solo plantillas MD | ⚠️ No en Inc 1 |
| Integración pt_app | ❌ No | ✅ Archivo + metadatos | ✅ Archivo + metadatos | ✅ Archivo (Inc 2) |

**Ganador: Pi** — Tiene la visión más completa, pero al costo de un Incremento 1 demasiado pesado.

### 3.5 Viabilidad de implementación (F1)

| Aspecto | AGY | Codex | OC | Pi |
|---|---|---|---|---|
| ¿Se puede implementar en 1-2 sprints? | ✅ Sí, pero incompleto | ⚠️ Ambicioso | ✅ Sí, bien acotado | ❌ No, es demasiado |
| ¿El primer vertical slice entrega valor? | ⚠️ Parcial | ✅ Sí (checklist + hitos) | ✅ Sí (cierre documental funcional) | ⚠️ Matriz documental no es lo más urgente |
| ¿Riesgo de refactor futuro? | ⚠️ Alto (modelo insuficiente) | ⚠️ Medio (tablas genéricas) | ✅ Bajo (modelo preciso) | ⚠️ Alto (modelo sobredimensionado) |
| ¿Facilidad de iterar después? | ❌ Mucho retrabajo | ✅ Buena separación MVP 1/2 | ✅ Fase 2 natural | ⚠️ Acoplado a matriz documental |

**Ganador: OC** — Scope correcto, modelo preciso, iteración natural.

---

## 4. Análisis de Riesgos Específicos

### Riesgos AGY
1. **Modelo insuficiente** obligará a refactoring masivo o truncar funcionalidad.
2. **Sin estados de ronda ampliados** significa que no se puede bloquear envíos → cierre documental imposible.
3. **Sin definición de cierre** → el panel SGC no tiene criterio de éxito.

### Riesgos Codex
1. **9 tablas nuevas en MVP 1** puede ser excesivo para un primer ciclo.
2. **F-06 y F-13 postergados a MVP 2** debilita el valor del cierre documental.
3. **Comunicaciones y notificaciones en MVP 1** añaden complejidad que podría postergarse.
4. **Naming inconsistente**: `sgcChecklistItems` mezcla cobertura de formato con checklist de cierre.

### Riesgos OC
1. **Sin módulo de comentarios** deja al participante sin voz en F1.
2. **Sin dashboard global** el admin no ve panorama de todas las rondas.
3. **Sin hook para NC/CAPA** puede dificultar la adición posterior.
4. **Códigos SGC provisionales** pueden confundir si se liberan sin marca.

### Riesgos Pi
1. **Matriz documental como primer slice** desvía el foco del cierre por ronda (lo urgente).
2. **9+ tablas nuevas en Incremento 1** conlleva alto riesgo de errores y deuda técnica.
3. **F-13 pospuesto al Incremento 2** impide cerrar documentalmente una ronda en Incremento 1.
4. **Sin PDF imprimible** en un contexto ISO es una omisión seria.
5. **Sin `documentacion_pendiente`** impide bloquear envíos de participantes durante cierre.

---

## 5. Síntesis de Fortalezas Únicas por Plan

| Plan | Fortaleza única que aportar al plan final |
|---|---|
| **AGY** | Simplicidad extrema como recordatorio: no over-engineer lo básico. |
| **Codex** | Arquitectura funcional, visibilidad por rol, hitos con detalle, comentarios con promoción a caso SGC, separación MVP 1/2. |
| **OC** | Modelado preciso de F-06/F-13, estados de ronda, PDF imprimible, snapshots, plantillas P-20, catálogo en código, regla F-11 = no aplica. |
| **Pi** | Matriz documental maestra como visión de largo plazo, vista por procesos, casos SGC unificados, F-08 con niveles, importación CSV. |

---

## 6. Recomendación: Plan Híbrido Óptimo

Tomando lo mejor de cada plan y descartando el overscope:

### Fase 1 (del plan OC, enriquecido)

| Elemento | Origen | Ajuste |
|---|---|---|
| Catálogo SGC en código (`lib/sgc/catalog.ts`) | OC | Sin cambios |
| Tablas `sgcPlanRonda`, `sgcRevisionDatos`, `sgcEvidencias`, `sgcAuditLog`, `sgcRegistroSnapshots` | OC | Sin cambios |
| Estado `documentacion_pendiente` en `rondas` | OC | Sin cambios |
| Plan de ronda por bloques (a-u) con subcampos críticos | OC | Sin cambios |
| F-13 checklist manual con métricas de apoyo | OC | Sin cambios |
| Evidencias con versionamiento, metadata automática, sin borrado | OC | Sin cambios |
| F-11 = `no_aplica` | OC | Sin cambios |
| PDF imprimible para F-06/F-13 | OC | Sin cambios |
| Snapshots para formatos editables | OC | Sin cambios |
| Plantillas P-20 en Markdown con variables | OC | Sin cambios |
| Pestaña SGC en RondaContextNav | OC + Codex | Tabla por fase con estados semánticos |
| Visibilidad por rol (admin/participante) | Codex | Adoptar tabla completa de Codex |

### Extensiones de Fase 1 (de otros planes)

| Elemento | Origen | Ajuste |
|---|---|---|
| Comentarios de participantes por ronda | Codex | Añadir modelo mínimo (no promoción a caso SGC hasta F2) |
| Cronograma con hitos mínimos (11 hitos) | Codex | Incorporar en `sgcHitosRonda` |
| Dashboard SGC resumen (rondas activas, bloqueantes) | Pi | Versión ligera, no matriz documental completa |
| `sgcComunicaciones` como registro manual | Codex | Sin envío de correos, solo registro |

### Postergar a Fase 2

| Elemento | Origen | Justificación |
|---|---|---|
| Matriz documental maestra + CSV | Pi | No es urgente para cierre por ronda |
| Vista por 8 procesos | Pi | Prematuro sin los formatos implementados |
| NC/CAPA, quejas, apelaciones | Codex, Pi | Requiere modelo de casos completo |
| Notificaciones in-app | Codex | Sin motor de comunicaciones en F1 |
| Integración estructurada pt_app | Codex, Pi | Archivo + metadatos es suficiente |
| F-PSEA-08 nativo (preparación ítems) | Pi | Archivo como evidencia en F1 |
| Motor de comunicaciones con correos | Todos | Postergar hasta validar el flujo manual |

---

## 7. Veredicto Final

| Plan | Puntuación | Rol |
|---|---|---|
| **AGY** | ⭐⭐ (3/10) | Descartado — demasiado incompleto |
| **Codex** | ⭐⭐⭐⭐ (8/10) | **Arquitecto funcional** — mejor visión de conjunto y flujos |
| **OC** | ⭐⭐⭐⭐⭐ (9/10) | **Espina dorsal de F1** — más pragmático, preciso y alineado |
| **Pi** | ⭐⭐⭐ (7/10) | **Visión de largo plazo** — buena arquitectura de futuro pero overscope para F1 |

**Recomendación**: Usar el **Plan OC como base de implementación de Fase 1**, incorporando de **Codex** la visibilidad por rol, los comentarios de participantes, el cronograma con hitos y las comunicaciones manuales, y de **Pi** la visión de matriz documental como roadmap de Fase 2+. El Plan AGY se descarta como guía de implementación pero su espíritu minimalista se respeta manteniendo F1 acotado.