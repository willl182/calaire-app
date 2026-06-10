# Evaluación Exhaustiva de los 4 Planes — Panel SGC CALAIRE-APP

> Fecha de evaluación: 2026-06-07  
> Planes evaluados: `plan_agy.md`, `plan_codex.md`, `plan_oc.md`, `plan_pi.md`

---

## Resumen ejecutivo

Se evaluaron 4 planes de implementación del Panel SGC para CALAIRE-APP. Cada plan tiene fortalezas y debilidades en distintas dimensiones. No existe un plan "perfecto" pero sí es posible identificar cuál es mejor para cada contexto de implementación.

| Plan | Recomendación |
|---|---|
| **AGY** | ❌ No recomendado como plan standalone |
| **CODEX** | ⚠️ Mejor para equipo con experiencia — detalle técnico superior |
| **OC** | ✅ Mejor para MVP rápido — pragmatismo y enfoque |
| **PI** | ⚠️ Mejor a largo plazo — más completo pero más complejo |

---

## 1. COHERENCIA Y ALCANCE

### Plan AGY

**Alcance**: Muy reducido. Solo cubre Fase 1 (DB + UI básica).

**Problemas**:
- No define qué va dentro del panel SGC, solo dice "Panel SGC"
- Omite completamente: cronograma, evidencias, comunicaciones, notificaciones, comentarios, casos SGC
- Las fases son genéricas ("crear vista principal", "modificar vista de detalle") sin especificar funcionalidad
- El log de ejecución muestra fases sin completar, lo que sugiere que es un plan tentativo

**Fortaleza**: Simple de seguir para quien conoce el codebase.

---

### Plan CODEX

**Alcance**: Completo para MVP 1, extensible a MVP 2. Cubre el ciclo completo de una ronda.

**Fortalezas**:
- Regla clara `nativo vs archivo` con tabla de decisión
- Estados de ronda con transiciones bien definidas
- MVP 1 y 2 separados con claridad
- Tabla de hitos mínimos con 11 hitos bien pensados
- Integración pt_app como archivo + metadatos (realista para MVP)
- Visibilidad por rol detallada

**Debilidades**:
- 9 tablas nuevas en un MVP puede ser overkill
- No menciona importación CSV ni matriz maestra
- Los casos SGC (queja/apelación/NC) van en MVP 2, pero el plan dice "admin registra manualmente" — queda medio incompleto
- No hay orden de implementación técnica detallado (solo "orden técnico recomendado" de 10 pasos)

---

### Plan OC

**Alcance**: Fase 1 enfocada, con exclusión explícita de muchos módulos.

**Fortalezas**:
- Tabla de formatos con modos claros (`nativo`, `archivo`, `no_aplica`)
- Estados de formato: `no_aplica`, `pendiente`, `cubierto_nativo`, `cubierto_archivo`, `requiere_revision`
- Incluye vistas imprimibles a PDF (algo que falta en otros planes)
- Catálogo en código (`lib/sgc/catalog.ts`) — decisión pragmática
- Estados de ronda ampliados: `documentacion_pendiente` como estado transaccional
- Snapshots para F-06/F-13 con historial visible
- Riesgo y tradeoffs documentados explícitamente

**Debilidades**:
- Excluye mucho (NC/CAPA, quejas, apelaciones, notificaciones, pt_app) — puede generar deuda si luego se necesitan
- F-13 como "manual con métricas de apoyo" puede ser frágil si el checklist no está bien definido
- No dice cómo manejar `F-PSEA-11` más allá de marcarlo `no_aplica`
- No hay modelo de datos completo para todas las tablas
- No menciona permisos por rol

---

### Plan PI

**Alcance**: El más ambicioso. Matriz documental completa + 8 procesos + dashboard + módulos.

**Fortalezas**:
- Matriz documental como concepto central (csv import, upsert)
- Procesos bien definidos: 8 categorías
- Dashboard SGC con resumen operativo
- Casos SGC como módulo integrado (NC/CAPA, quejas, apelaciones)
- Rutas propuestas completas
- Incrementos claros (Incremento 1 y 2)
- Modelo de datos para casi todo (documentos, versiones, hitos, preparación items, revision datos, comentarios, casos)
- Auditoría diseñada pero no implementada (buen enfoque de "pensar adelante")
- Visibilidad participantes bien definida

**Debilidades**:
- La matriz documental es un concepto pesado para un MVP — puede ser sobreingeniería
- CSV import para matriz inicial es complejo de implementar bien
- No tiene cronograma de hitos por ronda (el plan PI usa `rondaHitos` pero no profundiza en qué hitos)
- F-PSEA-13 no entra en Incremento 1
- No hay visión clara de cómo se cierra una ronda operativamente
- El plan es más un architecture spec que un plan de implementación

---

## 2. CALIDAD TÉCNICA

| Aspecto | AGY | CODEX | OC | PI |
|---|---|---|---|---|
| **Modelo de datos** | ❌ No especifica tablas, solo dice "modificar schema.ts" | ✅ 9 tablas con campos detallados | ✅ 5 tablas: `sgcPlanRonda`, `sgcRevisionDatos`, `sgcEvidencias`, `sgcAuditLog`, `sgcRegistroSnapshots` | ✅ Más completo: `documentosSgc`, `documentoSgcVersiones`, `rondaHitos`, `preparacionItemsRonda`, `preparacionItemsNiveles`, `revisionDatosRonda`, `analisisPtRonda`, `comentariosParticipante`, `casosSgc` |
| **API diseño** | ❌ No hay queries/mutations definidas | ✅ Queries y mutaciones implícitas en cada feature | ⚠️ Funciones implícitas, no detalladas | ⚠️ Funciones mencionadas pero no detalladas |
| **Versionamiento** | ❌ No menciona | ✅ Evidencias con series + versiones | ✅ Para evidencias (incrementa v1, v2, v3) | ✅ Documentos con versiones vigentes/obsoletas |
| **Estados** | ❌ No hay enum bien definido | ✅ Enum bien definido por feature | ✅ Estados de formato muy detallados | ✅ Estado gestión separado de estado implementación |
| **Edge cases** | ❌ No hay manejo | ✅ Manejo de "hitos advertencias vs bloquean" | ✅ Tradeoffs documentados | ⚠️ Menos manejo de edge cases específicos |
| **Testing** | ❌ No mencionado | ❌ No mencionado | ❌ No mencionado | ❌ No mencionado |

---

## 3. ENFOQUE DE IMPLEMENTACIÓN

### Plan AGY — Secuencial simple

```
Fase 1: DB/Backend → Fase 2: UI
```

**Pro**: Fácil de seguir  
**Contra**: No hay vertical slices, todo junto puede ser abrumador

---

### Plan CODEX — Vertical slices por feature

```
Schema → Funciones → Pestaña SGC → Selector → Cronograma+Checklist → Evidencias → Comunicaciones → Comentarios → Participante
```

**Pro**: Puedo hacer deploy incremental  
**Contra**: Requiere más discipline de implementación

---

### Plan OC — Vertical slices por formato

```
Schema → Evidencias → Pestaña SGC → F-06 nativo → F-13 manual → PDF imprimible → Templates
```

**Pro**: Cada paso produce algo usable  
**Contra**: La separación por formato puede crear inconsistencias

---

### Plan PI — Vertical slices por módulo

```
Documentos (matriz) → Dashboard → Cronograma → Plan Ronda
            ↓
    Comentarios → Casos SGC → F-08 → F-13 → pt_app
```

**Pro**: Vertical slices claros (documentos primero, luego otros módulos)  
**Contra**: La matriz documental puede retrasar todo si es compleja

---

## 4. MANEJO DE LA COMPLEJIDAD DEL DOMINIO

### Plan AGY

❌ **Subestima la complejidad**. Trata el SGC como "agregar unas tablas y una pestaña". No reconoce que:
- El cronograma de rondas es un sistema en sí mismo
- Las evidencias tienen versionamiento y series documentales
- Los estados de ronda necesitan transiciones controladas
- La visibilidad por rol es compleja

---

### Plan CODEX

✅ **Maneja bien la complejidad**. Reconoce:
- Hitos que adverten vs hitos que bloquean
- Registros críticos para cierre vs registros condicionales
- Mezcla de nativo + archivo según tipo de registro
- Comunicación como "preparar y registrar" no como envío automático

---

### Plan OC

✅ **Maneja la complejidad con pragmatismo**. Decide explícitamente:
- Qué entra en fase 1 y qué queda fuera
- Qué es nativo vs archivo por formato específico
- Códigos provisionales hasta lista maestra documental
- Tradeoffs aceptados documentados

---

### Plan PI

⚠️ **La complejidad es alta pero bien estructurada**. La matriz documental de 8 procesos es comprehensiva, pero:
- Puede ser overkill para un MVP
- La importación CSV inicial es un riesgo
- Los 8 procesos cubren más allá del SGC por ronda (gestión documental, mejora)

---

## 5. INTEGRACIÓN CON EL SISTEMA EXISTENTE

### Plan AGY

⚠️ Menciona "modificar schema.ts" y "SidebarNav.tsx" pero no dice cómo. No hay análisis de qué tablas existentes se tocan.

---

### Plan CODEX

✅ Analiza las tablas existentes:
- Menciona `rondas`, `rondaContaminantes` como referencia
- Habla de "participantes `member` con `claimedAt`" — conoce el modelo
- Integración `pt_app` como archivo + metadatos
- Estados de ronda ampliados

---

### Plan OC

✅ Analiza lo existente:
- F-PSEA-05 como "participantes `member` con `claimedAt`"
- F-PSEA-05A como "fichas `estado='enviado'`"
- F-PSEA-07 como "participantes con `participantCode` único"
- F-PSEA-12 como "reportes finales completos de `member`"
- Estados de ronda con transición `documentacion_pendiente`

---

### Plan PI

✅ Analiza lo existente:
- Se apoya en `rondas`, `rondaContaminantes`, `rondaPtItems`, `rondaPtSampleGroups`
- Define `rondaId?` en documentos para asociación opcional
- Modelo de comentarios linked a `rondaParticipanteId?`

---

## 6. RIESGOS IDENTIFICADOS

### Plan AGY

❌ **No identifica riesgos**. Es ingenuo sobre la complejidad.

---

### Plan CODEX

⚠️ **Risgos implícitos**:
- 9 tablas nuevas es mucho para un MVP
- No hay validación de que el checklist de cierre sea implementable
- La integración pt_app como "archivo + metadatos" puede no ser suficiente a largo plazo
- Los 11 hitos del cronograma pueden no cubrir todos los escenarios

---

### Plan OC

✅ **Riscos explícitamente documentados**:
- "Códigos documentales son provisionales"
- "F-13 puede finalizarse con checks pendientes"
- "F-06/F-13 finalizados pueden editarse directamente"
- "No se implementa email en fase 1"
- "Lista maestra documental debe revisarse antes de auditoría"

---

### Plan PI

⚠️ **Risgos implícitos**:
- La matriz documental puede ser sobreingeniería
- CSV import puede fallar silenciosamente
- La auditoría "diseñada pero no implementada" puede generar deuda
- Los casos SGC en Incremento 2 pero con visibilidad participantes sin claridad

---

## 7. FACILIDAD DE VALIDACIÓN

| Plan | Facilidad | Criterio |
|---|---|---|
| **AGY** | ❌ Difícil | No hay criteria de éxito medibles |
| **CODEX** | ✅ Fácil | Cada MVP tiene outputs claros: checklist + cronograma + evidencias + comunicaciones + notificaciones + comentarios para MVP 1; F-08, F-11, F-13, casos SGC, importación pt_app para MVP 2 |
| **OC** | ✅ Fácil | Cada formato tiene un estado verificable: `no_aplica`, `pendiente`, `cubierto_nativo`, `cubierto_archivo`, `requiere_revision`. PDF imprimible como artifact verificable |
| **PI** | ⚠️ Moderada | Los incrementos son claros pero la matriz documental puede tomar mucho tiempo en validar |

---

## 8. ESCALABILIDAD Y DEUDA TÉCNICA

| Plan | Deuda técnica | Escalabilidad |
|---|---|---|
| **AGY** | Alta — no piensa en el futuro | Muy baja |
| **CODEX** | Media — 9 tablas puede ser overkill | Buena — cada feature es independiente |
| **OC** | Baja — fase 1 enfocada, decisiones pragmáticas | Buena — fases futuras pueden agregar módulos |
| **PI** | Media — matriz puede ser sobreingeniería para MVP | Excelente a largo plazo, overkill para corto |

---

## 9. VISIÓN DEL CIERRE OPERATIVO DE RONDA

Este es el aspecto más crítico y donde los planes divergen más.

### Plan AGY

❌ No menciona cómo se cierra una ronda.

---

### Plan CODEX

✅ Define cierre documental con checklist crítico:
- 11 hitos con estados
- `CierreDocumental` como estado de máquina de estados
- Bloqueo solo si faltan críticos
- Transición: `ResultadosPublicados → CierreDocumental → Cerrada`

---

### Plan OC

✅ Define cierre con estado transaccional `documentacion_pendiente`:
- Flujo: `borrador → activa → documentacion_pendiente → cerrada`
- Requisitos explícitos para pasar entre estados
- Reapertura posible

---

### Plan PI

❌ No tiene cierre operativo claro. Menciona dashboard, casos, comentarios pero no cómo se "cierra" una ronda desde el punto de vista SGC.

---

## 10. COMPARACIÓN FINAL POR DIMENSIÓN

| Dimensión | AGY | CODEX | OC | PI |
|---|---|---|---|---|
| **Alcance** | ❌ Incompleto | ✅ Completo | ✅ Enfocado | ⚠️ Muy amplio |
| **Modelo de datos** | ❌ Ausente | ✅ Completo | ✅ Bueno | ✅ Más completo |
| **Regla nativo vs archivo** | ❌ No hay | ✅ Clara | ✅ Por formato | ⚠️ Genérica |
| **Estados de ronda** | ❌ No hay | ✅ Completos | ✅ `documentacion_pendiente` | ⚠️ Implícitos |
| **Cronograma/hitos** | ❌ No hay | ✅ 11 hitos detallados | ⚠️ Simple | ⚠️ Modelo pero sin detalle |
| **Evidencias/versionamiento** | ❌ No hay | ✅ Series + versiones | ✅ v1,v2,v3 | ✅ Documentos + versiones |
| **Comunicaciones** | ❌ No hay | ✅ Preparar/registrar | ❌ No hay | ❌ No hay |
| **Notificaciones** | ❌ No hay | ✅ Admin + participante | ❌ No hay | ❌ No hay |
| **Comentarios** | ❌ No hay | ✅ Por ronda | ❌ No hay | ✅ Global + por ronda |
| **Casos SGC** | ❌ No hay | ⚠️ MVP 2 | ❌ Excluido | ✅ Módulo completo |
| **F-06 Plan de ronda** | ❌ No hay | ⚠️ Checklist | ✅ Nativo por bloques | ✅ Módulo completo |
| **F-08 Preparación ítem** | ❌ No hay | ⚠️ MVP 2 | ⚠️ Archivo | ✅ Modelo completo |
| **F-13 Revisión datos** | ❌ No hay | ⚠️ MVP 2 | ✅ Manual con métricas | ⚠️ No en Inc 1 |
| **Integración pt_app** | ❌ No hay | ✅ Archivo + metadata | ❌ No hay | ⚠️ Archivo primero |
| **Matriz documental** | ❌ No hay | ❌ No hay | ⚠️ Catálogo en código | ✅ CSV import |
| **PDF imprimible** | ❌ No hay | ❌ No hay | ✅ F-06 y F-13 | ❌ No hay |
| **Permisos/visibilidad** | ❌ No hay | ✅ Por rol detallado | ⚠️ Implícito | ✅ Por rol |
| **Riesgos documentados** | ❌ No hay | ⚠️ Implícitos | ✅ Explícitos | ⚠️ Implícitos |
| **Incrementos** | ❌ No hay | ✅ MVP 1 y 2 | ⚠️ Fase 1/2 | ✅ Inc 1 y 2 |
| **Rutas propuestas** | ❌ No hay | ⚠️ En diagrama | ⚠️ Implícitas | ✅ Explícitas |
| **Facilidad implementación** | ✅ Muy fácil | ⚠️ Compleja (9 tablas) | ✅ Enfocada | ⚠️ Compleja (matriz) |

---

## 11. DEBILIDADES CRÍTICAS POR PLAN

### Plan AGY

1. No tiene modelo de datos
2. No define funcionalidades del panel
3. No menciona cronograma, evidencias, comunicaciones
4. No hay cierre operativo de ronda
5. No hay permisos/visibilidad

---

### Plan CODEX

1. 9 tablas nuevas puede ser overkill para MVP
2. Casos SGC relegados a MVP 2 sin plan claro
3. No hay matriz documental maestra
4. No hay PDF imprimible para formatos
5. Comunicaciones/notificaciones como "registro manual" puede ser insuficiente

---

### Plan OC

1. Excluye mucho (casos SGC, notificaciones, pt_app) — puede generar deuda
2. F-13 manual puede ser frágil
3. No hay modelo para comentarios de participantes
4. La matriz documental vive en código — no escalable
5. No hay visibilidad detallada para participantes

---

### Plan PI

1. Matriz documental es sobreingeniería para MVP
2. CSV import es un riesgo de implementación
3. F-13 no entra en Incremento 1
4. No hay cierre operativo claro de ronda
5. La auditoría "diseñada pero no implementada" puede generar deuda técnica

---

## 12. FORTALEZAS CLAVE POR PLAN

### Plan AGY

1. Simple de entender
2. Bajo barrera de entrada
3. Compatible con approach incremental si se expande

### Plan CODEX

1. Modelo de estados de ronda completo
2. Regla nativo vs archivo con criterios claros
3. Tabla de 11 hitos con campos detallados
4. Visibilidad por rol muy detallada
5. Integración pt_app como archivo + metadata (realista)

### Plan OC

1. Tradeoffs y riesgos explícitamente documentados
2. PDF imprimible para F-06 y F-13
3. Estado `documentacion_pendiente` como solución pragmática
4. Formatos organizados por fase con modos claros
5. Snapshots para trazabilidad de ediciones

### Plan PI

1. Matriz documental completa (conceptualmente)
2. Casos SGC como módulo integrado desde inicio
3. Dashboard SGC con resumen operativo
4. Modelo de datos para todos los módulos
5. Auditoría diseñada para futuro

---

## 13. RECOMENDACIÓN POR CONTEXTO

### Si el equipo necesita algo rápido y básico:

**Plan OC** — tiene el mejor balance entre alcance y pragmatismo. Fase 1 enfocada, decisiones explícitas sobre qué entra y qué queda fuera, riesgos documentados.

### Si el equipo quiere la solución más robusta a largo plazo:

**Plan PI** — la matriz documental y los 8 procesos son el enfoque más completo. Pero requiere más tiempo para implementar.

### Si el equipo quiere la solución más detallada para implementar:

**Plan CODEX** — tiene el mejor detalle técnico, reglas claras, modelos de datos, y una visión de máquina de estados bien definida. Pero 9 tablas en MVP puede ser overkill.

### Plan AGY:

**No recomendado como plan standalone**. Parece un plan tentativo o de alto nivel que necesita ser completado con los detalles de CODEX u OC.

---

## 14. FUSIÓN ÓPTIMA RECOMENDADA

Si tuviera que crear un plan híbrido ideal basado en las mejores prácticas de cada plan:

1. **Alcance y enfoque** → Plan OC (fase 1 enfocada, decisiones pragmáticas)
2. **Modelo de datos** → Plan PI (más completo, incluye todos los módulos)
3. **Regla nativo vs archivo** → Plan CODEX (más detallada)
4. **Estados de ronda** → Plan OC (`documentacion_pendiente`) + Plan CODEX (máquina de estados)
5. **Cronograma/hitos** → Plan CODEX (11 hitos detallados)
6. **Evidencias/versionamiento** → Plan CODEX (series + versiones) o Plan PI (documentos + versiones)
7. **Casos SGC** → Plan PI (módulo completo) — no esperar a MVP 2
8. **F-06 Plan de ronda** → Plan OC (por bloques con snapshots)
9. **F-13 Revisión datos** → Plan OC (manual con métricas) + Plan PI (modelo)
10. **PDF imprimible** → Plan OC (implementar desde inicio)
11. **Visibilidad/permisos** → Plan CODEX (detallado por rol)
12. **Riesgos** → Plan OC (documentados explícitamente)
13. **Rutas** → Plan PI (explícitas)
14. **Dashboard operativo** → Plan PI (resumen con hitos vencidos, NC abiertas, etc.)
15. **Comunicación/notificaciones** → Plan CODEX (preparar y registrar)

---

## 15. PRÓXIMOS PASOS RECOMENDADOS

1. **Decidir alcance del MVP**: ¿Cuánto tiempo y recursos hay disponibles?
2. **Seleccionar plan base**: ¿OC para MVP rápido o PI para solución robusta?
3. **Incorporar elementos de CODEX**: La regla nativo vs archivo y los estados de ronda son los mejores del conjunto
4. **Definir modelo de datos consolidado**: Basado en las tablas de CODEX y PI
5. **Diseñar vertical slices**: Implementar primero lo que da valor operativo inmediato
6. **Planificar incrementos**: No intentar hacer todo en una sola fase

---

*Evaluación generada: 2026-06-07*