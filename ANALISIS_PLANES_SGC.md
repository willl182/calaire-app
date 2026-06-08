# Análisis Comparativo Exhaustivo de Planes SGC

**Fecha**: 2026-06-07  
**Objetivo**: Evaluar fortalezas, debilidades y oportunidades de mejora de los 4 planes propuestos para el Panel SGC en CALAIRE-APP.

---

## Resumen Ejecutivo

Los 4 planes presentan enfoques distintos pero complementarios para implementar la gestión del Sistema de Gestión de Calidad (SGC) en CALAIRE-APP:

| Plan | Enfoque Principal | Alcance | Complejidad | Madurez |
|------|-------------------|---------|-------------|---------|
| **AGY** | Fase 1 mínima viable | Limitado (3 formatos) | Baja | Conceptual |
| **Codex** | Cierre documental por ronda | Completo (MVP1+MVP2) | Alta | Detallado |
| **OC** | Panel operativo fase 1 | Intermedio (focalizado) | Media | Muy detallado |
| **PI** | SGC completo incremental | Muy amplio (todo el SGC) | Muy alta | Arquitectónico |

---

## 1. PLAN AGY (plan_agy.md)

### Descripción General
Plan minimalista enfocado en implementar solo 3 formatos específicos (F-PSEA-06, F-PSEA-08, F-PSEA-13) con una estructura de 2 fases muy básica.

### Fortalezas ✅

1. **Simplicidad extrema**
   - Fácil de entender y comunicar
   - Bajo riesgo de sobrecarga inicial
   - Rápida implementación teórica

2. **Estructura clara**
   - División backend/frontend explícita
   - Tabla de tareas concreta
   - Log de ejecución simple

3. **Enfoque pragmático**
   - No intenta resolver todo el SGC
   - Se centra en lo "aprobado" en sesión de grill-me

### Debilidades ❌

1. **Alcance insuficiente**
   - Solo 3 formatos es demasiado limitado
   - No aborda cierre documental completo
   - Ignora cronograma, comunicaciones, evidencias
   - No tiene visión de proceso SGC integral

2. **Falta de profundidad técnica**
   - No define schema detallado
   - No especifica estados de ronda
   - No menciona versionamiento
   - Ausencia de diagramas de flujo/arquitectura

3. **Carencias funcionales críticas**
   - Sin gestión de participantes vs admin
   - Sin sistema de notificaciones/comunicaciones
   - Sin trazabilidad o auditoría
   - Sin manejo de casos especiales (quejas, NC/CAPA)

4. **Ausencia de principios de diseño**
   - No define criterio nativo vs archivo
   - No establece reglas de visibilidad
   - No documenta decisiones arquitectónicas

5. **Riesgo de retrabajo**
   - Al ser tan limitado, probablemente requiera rediseño completo cuando se expanda
   - No considera escalabilidad

### Oportunidades de Mejora 💡

- Expandir alcance para incluir al menos checklist de cierre documental
- Agregar definición de estados de ronda
- Incluir modelo de datos más completo
- Definir criterios de aceptación claros

### Veredicto
**INSUFICIENTE como plan único**. Podría servir como sub-componente de un plan mayor, pero no aborda las necesidades reales del SGC.

---

## 2. PLAN CODEX (plan_codex.md)

### Descripción General
Plan comprehensivo que propone un panel de cierre documental por ronda con MVP dividido en 2 fases, incluyendo arquitectura funcional completa, navegación, roles, y modelo de datos detallado.

### Fortalezas ✅

1. **Visión holística excelente**
   - Define claramente qué ES y qué NO ES el panel
   - Establece principio rector: "cierre documental, no repositorio"
   - Distingue nativo vs archivo vs mixto con criterios claros

2. **Arquitectura bien pensada**
   - Diagramas Mermaid para flujo, navegación, roles, estados
   - Modelo ER para evidencias
   - Separación clara de responsabilidades

3. **Gestión de roles sofisticada**
   - Matriz de visibilidad admin/participante muy detallada
   - Control granular sobre qué ve cada rol
   - Considera "Mi dashboard" para participantes

4. **Cronograma nativo bien definido**
   - 11 hitos mínimos con campos específicos
   - Estados y transiciones claras
   - Advertencias vs bloqueos diferenciados

5. **Sistema de evidencias robusto**
   - Versionamiento sencillo pero efectivo
   - Series documentales organizadas
   - Historial completo para auditoría

6. **Comunicaciones y comentarios**
   - Flujo claro de preparación manual
   - Escalado de comentarios a casos formales
   - Registro de envíos manuales

7. **Integración pt_app considerada**
   - MVP pragmático (archivo + metadatos)
   - Campos mínimos bien definidos
   - Reconoce limitaciones actuales

8. **Roadmap claro**
   - MVP1: cierre documental básico
   - MVP2: formularios nativos y casos formales
   - Orden técnico recomendado

9. **Documentación excepcional**
   - Tablas comparativas claras
   - Ejemplos concretos
   - Criterios de criticidad explícitos

### Debilidades ❌

1. **Complejidad inicial alta**
   - 9 tablas nuevas para MVP1 puede ser abrumador
   - Muchas piezas móviles desde el inicio
   - Riesgo de parálisis por análisis

2. **Falta detalles de implementación técnica**
   - No especifica estructura de archivos Next.js
   - No menciona Convex functions específicas
   - Ausencia de consideraciones de performance

3. **Estados de ronda podrían ser más explícitos**
   - Diagrama de estados presente pero no integrado con transiciones de UI
   - No define requisitos precisos para cada transición

4. **Sin考虑 de PDF/imprimibles**
   - No menciona necesidad de vistas formales descargables
   - Importante para auditorías externas

5. **Gestión de snapshots/historial limitada**
   - Evidencias tienen versionamiento, pero registros nativos no
   - ¿Qué pasa si se edita un checklist finalizado?

6. **Plantillas P-20 mencionadas pero no desarrolladas**
   - Dice "preparar comunicaciones" pero sin detalle de plantillas
   - Variables no especificadas

### Oportunidades de Mejora 💡

- Agregar sección de "Primeros pasos técnicos" con estructura de carpetas
- Incluir consideraciones de migración de datos existentes
- Especificar estrategia de testing
- Agregar plan de rollback para cada MVP
- Detallar formato de plantillas P-20 con variables

### Veredicto
**EXCELENTE plan base**. El más completo y maduro de los 4. Sirve como columna vertebral ideal, aunque podría beneficiarse de simplificación inicial.

---

## 3. PLAN OC (plan_oc.md)

### Descripción General
Plan focalizado en Fase 1 con alcance bien delimitado, énfasis en decisiones explícitas, trade-offs aceptados, y consideraciones prácticas de implementación inmediata.

### Fortalezas ✅

1. **Alcance perfectamente delimitado**
   - Lista explícita de qué INCLUYE y qué NO incluye
   - Evita scope creep desde el inicio
   - Realista sobre capacidades fase 1

2. **Decisiones explícitas y justificadas**
   - Cada decisión tiene "Decisiones:" con bullets claros
   - Trade-offs documentados abiertamente
   - Reconoce provisionalidad de códigos SGC

3. **Consideraciones de UX/UI maduras**
   - PDF imprimible con requisitos específicos
   - Snapshots e historial para trazabilidad
   - Estados visibles y bloqueantes claros

4. **Modelo de estados de ronda superior**
   - Nuevo estado `documentacion_pendiente` muy útil
   - Requisitos explícitos para cada transición
   - Reapertura considerada
   - Bloqueo de participantes en estados finales

5. **Plan de ronda nativo bien pensado**
   - Basado en plantilla compartida F-PPSEA-03
   - Bloques editables (a-u) con flexibilidad
   - Subcampos críticos estructurados donde importa
   - Cronograma de hitos simples integrado

6. **F-13 revisión de datos pragmática**
   - Manual con métricas de apoyo (no automático)
   - Checklist fijo en código
   - Permite finalizar con items pendientes (realista)
   - Responsable formal claro

7. **Sistema de evidencias bien diseñado**
   - Metadata automática completa
   - Versiones incrementales visibles (v1, v2, v3)
   - Límites de tamaño y tipos definidos
   - Sin borrado en fase 1 (seguridad)

8. **Snapshots para registros nativos**
   - Diferencia claramente de evidencias por archivo
   - Historial colapsable visible para admins
   - Identificado por fecha y usuario

9. **Plantillas P-20 con variables explícitas**
   - Markdown en repo
   - Placeholders claros ({{ronda_codigo}}, etc.)
   - 5 plantillas mínimas sugeridas

10. **Riesgos y trade-offs documentados**
    - Transparencia sobre limitaciones aceptadas
    - Mitigaciones identificadas
    - Honestidad sobre verificación pendiente

11. **Orden de implementación realista**
    - 12 pasos secuenciales lógicos
    - Empieza con confirmación de guías técnicas
    - Termina con verificación de permisos

### Debilidades ❌

1. **Alcance limitado intencionalmente**
   - Sin comunicaciones/notificaciones reales
   - Sin casos SGC (quejas, apelaciones, NC/CAPA)
   - Sin integración pt_app estructurada
   - Esto es debilidad relativa según perspectiva

2. **Menos visión de largo plazo**
   - No roadmap más allá de fase 1
   - Sin MVP2 definido
   - Podría quedar como solución incompleta

3. **Falta diagramas de arquitectura**
   - No Mermaid ni flujos visuales
   - Más descriptivo que visual
   - Dificulta comunicación rápida

4. **Catálogo SGC "en código" puede ser rígido**
   - No editable desde UI (reconocido)
   - Requiere deploy para cambios
   - Balance entre control y flexibilidad

5. **Sin matriz documental maestra**
   - No vista global de todos los documentos SGC
   - Enfocado solo en por-ronda
   - Documentos globales no considerados

6. **Estados de formato podrían ser más ricos**
   - 5 estados básicos quizás insuficientes
   - Sin distinción entre "en revisión" vs "aprobado"
   - Sin workflow de aprobación formal

### Oportunidades de Mejora 💡

- Agregar roadmap tentativo post-fase 1
- Incluir al menos diagrama de flujo principal
- Considerar estado "en_revision" para formatos
- Planificar expansión a matriz documental global
- Documentar API surface para futuras integraciones

### Veredicto
**EXCELENTE para implementación inmediata**. El más pragmático y listo para ejecutar. Perfecto si se necesita resultado rápido con calidad.

---

## 4. PLAN PI (plan_pi.md)

### Descripción General
Plan arquitectónico ambicioso que propone un SGC completo con matriz documental maestra, vista por procesos, casos SGC internos, y enfoque incremental con vertical slices.

### Fortalezas ✅

1. **Visión más completa del SGC**
   - No solo cierre por ronda, sino SGC operativo completo
   - Matriz documental maestra como mapa central
   - Vista por procesos (8 categorías)
   - Dashboard con resumen operacional

2. **Regla nativo vs archivo bien fundamentada**
   - 7 criterios para decidir qué va nativo
   - 5 criterios para archivo controlado
   - Marco decisional reusable

3. **Matriz documental innovadora**
   - Importación CSV para carga inicial
   - Clave única inteligente (codigo + rondaCodigo)
   - Upsert sin borrado (seguro)
   - Modos de gestión claros (nativo/archivo/generado/integracion)

4. **Control documental robusto**
   - Versiones con estado vigente/obsoleto
   - Visibilidad granular (interna/participantes)
   - Reglas de acceso bien definidas
   - Campos de metadata completos

5. **Casos SGC unificados**
   - NC/CAPA, quejas, apelaciones en un módulo
   - Estados de workflow claros (6 estados)
   - Relación con comentarios informales
   - Interno para admin, separado de participantes

6. **Comentarios de participantes bien pensados**
   - Informales inicialmente
   - Escalables a casos formales
   - Globales o por ronda
   - Respuestas de admin visibles

7. **Incrementos bien estructurados**
   - Incremento 1: matriz + documentos + cronograma + plan
   - Incremento 2: preparación + comentarios + casos + revisión
   - Vertical slice recomendado claro
   - Roadmap post-MVP definido

8. **Primer vertical slice muy concreto**
   - 4 tablas Convex específicas
   - 6 funciones claras
   - 3 rutas UI iniciales
   - Secuencia lógica de implementación

9. **Rutas propuestas completas**
   - Estructura RESTful clara
   - Separación admin/participante
   - Incluye importación CSV

10. **Auditoría considerada (aunque diferida)**
    - Campos básicos createdAt/by, updatedAt/by
    - Diseño pensando en bitácora futura
    - sgcEventos modelado conceptualmente

11. **F-PSEA-08 preparación detallado**
    - Modelo con tabla de niveles
    - CSV crudo + PDF cilindro
    - Campos por nivel bien definidos

### Debilidades ❌

1. **Alcance potencialmente abrumador**
   - Demasiadas piezas para implementación inicial
   - Riesgo de no terminar nada si se intenta todo
   - Curva de aprendizaje empinada

2. **Matriz documental puede ser overkill inicial**
   - Importación CSV añade complejidad
   - Parser fuera de Convex (dónde?)
   - Validación de upsert no trivial
   - Quizás excesivo para empezar

3. **Falta detalles de UI/UX**
   - Sin wireframes o mockups
   - Sin descripción de layouts
   - Menos considerado aspecto visual que otros planes

4. **Sin diagramas visuales**
   - Todo texto, ningún Mermaid
   - Dificulta comprensión rápida
   - Menos comunicativo para stakeholders

5. **Estados de ronda no tan desarrollados**
   - Menciona `documentacion_pendiente` pero sin requisitos
   - Transiciones no tan explícitas como OC
   - Menos integrado con checklist SGC

6. **Cronograma menos detallado que Codex**
   - 12 hitos vs 11 de Codex, pero menos campos
   - Sin especificación de obligatoriedad por hito
   - Alertas visuales vagas ("vence pronto")

7. **Plan de ronda F-PSEA-06 menos estructurado**
   - "Campos posibles" sin lista definitiva
   - Sin bloques editables como OC
   - Estado sencillo puede ser insuficiente

8. **Integración pt_app muy básica**
   - Solo evidencias/archivos
   - Sin metadatos estructurados
   - Sin aprobación formal como Codex

9. **Sin consideración de PDF/imprimibles**
   - No menciona vistas formales descargables
   - Importante para auditorías
   - Gap significativo

10. **Permisos menos granulares**
    - Solo admin vs participante
    - Sin matices de visibilidad por tipo de documento
    - Sin考虑 de "Mi dashboard" personalizado

### Oportunidades de Mejora 💡

- Reducir alcance inicial, enfocarse en Incremento 1 sólido
- Agregar diagramas Mermaid para flujos clave
- Incluir consideraciones de PDF/imprimibles
- Detallar estados de ronda con requisitos de transición
- Simplificar matriz documental inicial (quizás sin CSV al inicio)
- Agregar sección de UI/UX con layouts propuestos

### Veredicto
**VISIONARIO pero ambicioso**. Excelente arquitectura de largo plazo, pero requiere disciplina para no sobrecargarse. Ideal como visión estratégica con implementación phased.

---

## ANÁLISIS COMPARATIVO DETALLADO

### 1. Alcance y Cobertura

| Dimensión | AGY | Codex | OC | PI |
|-----------|-----|-------|----|----|
| Formatos SGC cubiertos | 3 | ~15+ | ~10 | ~15+ |
| Cronograma | ❌ | ✅ Completo | ✅ Simple | ✅ Simple |
| Evidencias | ❌ | ✅ Versionadas | ✅ Versionadas | ✅ Versionadas |
| Comunicaciones | ❌ | ✅ Manuales | ⚠️ Plantillas | ✅ Comentarios |
| Casos SGC | ❌ | ✅ MVP2 | ❌ | ✅ Completo |
| Matriz documental | ❌ | ❌ | ❌ | ✅ Maestra |
| Vista por procesos | ❌ | ❌ | ❌ | ✅ 8 procesos |
| PDF/Imprimibles | ❌ | ❌ | ✅ F-06/F-13 | ❌ |
| Integración pt_app | ❌ | ✅ Metadatos | ❌ | ⚠️ Archivos |
| Auditoría/Snapshots | ❌ | ⚠️ Parcial | ✅ Snapshots | ⚠️ Básico |

**Ganador**: **Codex** y **PI** (dependiendo de perspectiva)

### 2. Profundidad Técnica

| Aspecto | AGY | Codex | OC | PI |
|---------|-----|-------|----|----|
| Schema detallado | ❌ | ✅ Tablas propuestas | ✅ Modelo conceptual | ✅ Modelo conceptual |
| Funciones Convex | ⚠️ Mencionadas | ✅ Queries/mutations | ⚠️ Implícitas | ✅ 6 funciones iniciales |
| Estructura archivos | ❌ | ❌ | ⚠️ Rutas propuestas | ✅ Rutas completas |
| Estados máquina | ❌ | ✅ Diagrama | ✅ Transiciones | ⚠️ Básico |
| Versionamiento | ❌ | ✅ Evidencias | ✅ Evidencias + Snapshots | ✅ Documentos |
| Importación datos | ❌ | ❌ | ❌ | ✅ CSV matriz |
| Permisos/Roles | ❌ | ✅ Granular | ✅ Admin/Participante | ✅ Básico |

**Ganador**: **OC** (mejor balance detalle/practicidad)

### 3. Pragmatismo y Ejecutabilidad

| Criterio | AGY | Codex | OC | PI |
|----------|-----|-------|----|----|
| Tiempo estimado | Semanas | Meses | Semanas | Meses+ |
| Complejidad inicial | Baja | Alta | Media | Alta |
| Riesgo de fracaso | Alto (insuficiente) | Medio | Bajo | Medio-Alto |
| Claridad primeros pasos | ⚠️ Vago | ✅ Orden técnico | ✅ 12 pasos | ✅ Vertical slice |
| Dependencias externas | Ninguna | Ninguna | Plantillas MD | CSV parser |
| Cambios a existente | Mínimos | Moderados | Moderados | Significativos |
| Testing strategy | ❌ | ❌ | ❌ | ❌ |

**Ganador**: **OC** (más ejecutable inmediatamente)

### 4. Calidad de Documentación

| Elemento | AGY | Codex | OC | PI |
|----------|-----|-------|----|----|
| Diagramas Mermaid | 0 | 6+ | 0 | 0 |
| Tablas comparativas | 1 | 8+ | 4 | 3 |
| Ejemplos concretos | 0 | Muchos | Algunos | Algunos |
| Decisiones registradas | 0 | Implícitas | Explícitas | Algunas |
| Trade-offs documentados | ❌ | ⚠️ Parcial | ✅ Sección dedicada | ⚠️ Parcial |
| Roadmap futuro | ❌ | ✅ MVP1/MVP2 | ❌ | ✅ Incrementos |
| Riesgos identificados | ❌ | ⚠️ Implícitos | ✅ Sección dedicada | ⚠️ Implícitos |

**Ganador**: **Codex** (mejor documentación visual y estructural)

### 5. Alineación con Necesidades SGC

| Necesidad | AGY | Codex | OC | PI |
|-----------|-----|-------|----|----|
| Cierre documental por ronda | ⚠️ Parcial | ✅ Excelente | ✅ Muy bueno | ✅ Bueno |
| Trazabilidad completa | ❌ | ✅ Buena | ✅ Muy buena | ⚠️ Parcial |
| Control de versiones | ❌ | ✅ Evidencias | ✅ Evidencias + Snapshots | ✅ Documentos |
| Gestión de participantes | ❌ | ✅ Granular | ✅ Básica | ✅ Básica |
| Casos especiales (NC, quejas) | ❌ | ✅ MVP2 | ❌ | ✅ Completo |
| Reporting/Auditoría | ❌ | ⚠️ Parcial | ✅ Snapshots + PDF | ⚠️ Básico |
| Escalabilidad futura | ❌ | ✅ Buena | ⚠️ Limitada | ✅ Excelente |
| Cumplimiento normativo | ❌ | ✅ Bueno | ✅ Muy bueno | ✅ Bueno |

**Ganador**: **Codex** (mejor balance cobertura/pragmatismo)

---

## SÍNTESIS DE FORTALEZAS ÚNICAS POR PLAN

### AGY
- ✅ Simplicidad máxima
- ✅ Fácil de comunicar
- ❌ Demasiado limitado para ser útil solo

### Codex
- ✅ Arquitectura más completa y visual
- ✅ Mejor documentación con diagramas
- ✅ Visión holística del cierre documental
- ✅ Roles y permisos más granulares
- ✅ Cronograma nativo mejor definido
- ✅ Integración pt_app más pensada

### OC
- ✅ Alcance perfectamente delimitado
- ✅ Decisiones explícitas y justificadas
- ✅ Estados de ronda más maduros (`documentacion_pendiente`)
- ✅ PDF/imprimibles considerados
- ✅ Snapshots para registros nativos
- ✅ Plan de ronda por bloques editable
- ✅ Trade-offs transparentemente documentados
- ✅ Más listo para implementar YA

### PI
- ✅ Visión más amplia del SGC completo
- ✅ Matriz documental maestra innovadora
- ✅ Vista por procesos (8 categorías)
- ✅ Casos SGC unificados (NC/CAPA/quejas/apelaciones)
- ✅ Importación CSV para carga inicial
- ✅ Incrementos bien estructurados
- ✅ Primer vertical slice muy concreto
- ✅ Regla nativo vs archivo mejor fundamentada

---

## GAP ANALYSIS: Qué falta en cada plan

### AGY - Gaps Críticos
1. ❌ Sin cronograma/hitos
2. ❌ Sin sistema de evidencias
3. ❌ Sin comunicaciones
4. ❌ Sin gestión de roles
5. ❌ Sin estados de ronda
6. ❌ Sin trazabilidad/versionamiento
7. ❌ Sin casos especiales
8. ❌ Sin matriz documental
9. ❌ Sin PDF/imprimibles
10. ❌ Sin roadmap futuro

**Conclusión**: No es un plan SGC completo, es un sub-módulo.

### Codex - Gaps Identificados
1. ⚠️ Sin PDF/imprimibles formales
2. ⚠️ Sin snapshots para registros nativos editables
3. ⚠️ Sin matriz documental global
4. ⚠️ Sin vista por procesos
5. ⚠️ Detalles de implementación técnica ausentes
6. ⚠️ Sin estrategia de testing
7. ⚠️ Plantillas P-20 poco desarrolladas

**Conclusión**: Muy completo funcionalmente, necesita detalles técnicos de implementación.

### OC - Gaps Identificados
1. ❌ Sin casos SGC (quejas, apelaciones, NC/CAPA)
2. ❌ Sin comunicaciones reales (solo plantillas)
3. ❌ Sin notificaciones in-app
4. ❌ Sin integración pt_app estructurada
5. ❌ Sin matriz documental global
6. ❌ Sin vista por procesos
7. ❌ Sin roadmap post-fase 1
8. ❌ Sin diagramas visuales

**Conclusión**: Excelente para fase 1, pero necesita plan de expansión.

### PI - Gaps Identificados
1. ❌ Sin PDF/imprimibles
2. ⚠️ Estados de ronda menos desarrollados
3. ⚠️ Sin diagramas visuales
4. ⚠️ UI/UX menos considerado
5. ⚠️ Cronograma menos detallado
6. ⚠️ Permisos menos granulares
7. ⚠️ Plan de ronda menos estructurado
8. ⚠️ Alcance puede ser abrumador

**Conclusión**: Visión estratégica excelente, necesita priorización y foco inicial.

---

## RECOMENDACIÓN: PLAN HÍBRIDO OPTIMIZADO

Basado en el análisis, recomiendo **combinar lo mejor de cada plan**:

### Estructura Recomendada

#### FASE 1 (Inmediata - 4-6 semanas)
**Base**: Plan OC (por su pragmatismo y claridad)
**Mejoras de Codex**: 
- Agregar diagramas Mermaid de OC
- Incorporar granularidad de roles de Codex
- Usar cronograma de 11 hitos de Codex

**Entregables**:
1. ✅ Pestaña SGC en dashboard admin
2. ✅ Checklist de cierre documental por ronda
3. ✅ Cronograma nativo (11 hitos de Codex)
4. ✅ Evidencias versionadas (sistema de OC)
5. ✅ Plan de ronda F-PPSEA-03 nativo por bloques (de OC)
6. ✅ F-13 revisión de datos manual con métricas (de OC)
7. ✅ Estados de ronda con `documentacion_pendiente` (de OC)
8. ✅ PDF imprimible para F-06 y F-13 (de OC)
9. ✅ Snapshots para registros nativos (de OC)
10. ✅ Plantillas P-20 Markdown con variables (de OC)
11. ✅ Visibilidad granular admin/participante (de Codex)

#### FASE 2 (Mediano plazo - 6-8 semanas)
**Base**: MVP2 de Codex + Incremento 2 de PI
**Mejoras**:
- Formularios nativos F-08, F-11, F-13 (de Codex)
- Comentarios de participantes (de PI)
- Casos SGC unificados (de PI)
- Integración pt_app estructurada (de Codex)

**Entregables**:
1. ✅ F-PSEA-08 Preparación de ítem nativo
2. ✅ F-PSEA-11 Envío/Recepción (si aplica)
3. ✅ F-PSEA-13 Revisión de datos avanzada
4. ✅ Módulo de comentarios de participantes
5. ✅ Casos SGC (NC/CAPA, quejas, apelaciones)
6. ✅ Integración pt_app con metadatos y aprobación
7. ✅ Notificaciones in-app básicas

#### FASE 3 (Largo plazo - 8-12 semanas)
**Base**: Visión de PI
**Mejoras**:
- Matriz documental maestra (de PI)
- Vista por procesos (de PI)
- Dashboard SGC completo (de PI)
- Bitácora de eventos/auditoría (de PI)

**Entregables**:
1. ✅ Matriz documental SGC importable por CSV
2. ✅ Vista por 8 procesos SGC
3. ✅ Dashboard SGC con resumen operacional
4. ✅ Control documental global con versiones
5. ✅ Bitácora de eventos sgcEventos
6. ✅ Exportaciones formales avanzadas
7. ✅ Automatización de comunicaciones

---

## DECISIONES CLAVE A ADOPTAR

### 1. ¿Repositorio o Panel Operativo?
**Decisión**: Panel operativo de cierre documental (Codex) + Matriz documental global (PI) como Fase 3.

**Justificación**: Empezar con foco en rondas evita sobrecarga inicial, pero planificar matriz global desde el diseño permite expansión coherente.

### 2. ¿Estados de Ronda?
**Decisión**: Adoptar modelo de OC con `documentacion_pendiente`.

**Justificación**: Estado intermedio crucial para separar cierre de recepción de cierre documental. Más maduro que otros planes.

### 3. ¿Versionamiento?
**Decisión**: Evidencias por archivo con versiones incrementales (OC) + Snapshots para registros nativos (OC).

**Justificación**: Doble approach cubre ambos casos adecuadamente. Codex solo tiene versionamiento para archivos.

### 4. ¿PDF/Imprimibles?
**Decisión**: Incluir desde Fase 1 (OC).

**Justificación**: Crítico para auditorías externas. Solo OC lo considera explícitamente.

### 5. ¿Matriz Documental?
**Decisión**: Diferir a Fase 3 (PI), pero diseñar schema compatible desde inicio.

**Justificación**: Overkill para Fase 1, pero importante para visión completa. Diseñar tablas `documentosSgc` desde inicio facilita expansión.

### 6. ¿Casos SGC?
**Decisión**: Diferir a Fase 2 (PI), pero预留 espacio en UI.

**Justificación**: Necesarios pero no críticos para cierre documental básico. Mejor implementar después de tener base sólida.

### 7. ¿Comunicaciones?
**Decisión**: Plantillas Markdown Fase 1 (OC) → Registro manual Fase 2 (Codex) → Automatización Fase 3.

**Justificación**: Progresión pragmática que entrega valor incremental sin sobrecarga técnica inicial.

### 8. ¿Integración pt_app?
**Decisión**: Archivo + metadatos Fase 1 (Codex) → Integración estructurada Fase 2.

**Justificación**: MVP pragmático permite avanzar sin depender de pt_app API.

---

## RIESGOS Y MITIGACIONES

### Riesgo 1: Scope Creep
**Probabilidad**: Alta  
**Impacto**: Alto  
**Mitigación**: 
- Adherirse estrictamente a entregables de Fase 1
- Documentar "fuera de alcance" explícitamente
- Revisar scope semanalmente

### Riesgo 2: Sobrecarga Técnica Inicial
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**:
- Empezar con OC simplificado (sin casos SGC, sin matriz)
- Vertical slice primero (1 tabla, 1 función, 1 vista)
- Iterar rápidamente

### Riesgo 3: Retrabajo por Cambios Futuros
**Probabilidad**: Media  
**Impacto**: Medio  
**Mitigación**:
- Diseñar schema Convex pensando en Fase 3
- Usar nombres de tablas compatibles con expansión
- Documentar decisiones arquitectónicas

### Riesgo 4: Falta de Aceptación de Usuarios
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**:
- Involucrar admins en diseño de UI
- Demostrar PDF/imprimibles temprano
- Feedback loop corto con usuarios piloto

### Riesgo 5: Complejidad de Versionamiento
**Probabilidad**: Baja  
**Impacto**: Medio  
**Mitigación**:
- Implementar versionamiento simple primero
- Probar exhaustivamente casos edge
- Documentar comportamiento esperado

---

## MÉTRICAS DE ÉXITO PROPUESTAS

### Fase 1
- [ ] 100% de formatos SGC listados en checklist
- [ ] Cronograma con 11 hitos funcional
- [ ] Evidencias cargables y versionadas
- [ ] PDF de F-06 y F-13 generable
- [ ] Estados de ronda funcionando con transiciones
- [ ] Visibilidad admin/participante correcta
- [ ] 0 bugs críticos en producción

### Fase 2
- [ ] Formularios nativos F-08, F-13 operacionales
- [ ] Módulo de comentarios activo
- [ ] Casos SGC creando y gestionando
- [ ] Integración pt_app con metadatos
- [ ] Notificaciones in-app funcionando

### Fase 3
- [ ] Matriz documental importable por CSV
- [ ] Vista por 8 procesos navegable
- [ ] Dashboard SGC con métricas en tiempo real
- [ ] Bitácora de eventos completa
- [ ] Exportaciones formales disponibles

---

## CONCLUSIÓN FINAL

### Ranking de Planes Individuales

1. **🥇 Codex**: Mejor plan base completo. Arquitectura sólida, documentación excepcional, visión holística. Ideal como columna vertebral.

2. **🥈 OC**: Mejor plan para implementación inmediata. Pragmático, decisiones claras, alcance realista. Perfecto para Fase 1.

3. **🥉 PI**: Mejor visión estratégica largo plazo. Arquitectura completa, matriz innovadora, incrementos bien pensados. Necesita foco inicial.

4. **4° AGY**: Insuficiente como plan único. Podría ser sub-componente, pero no aborda necesidades SGC reales.

### Recomendación Final

**NO elegir un solo plan**. Implementar **plan híbrido**:

- **Fase 1**: OC + mejoras de Codex (diagramas, roles, cronograma)
- **Fase 2**: Codex MVP2 + PI Incremento 2 (casos SGC, comentarios)
- **Fase 3**: PI visión completa (matriz, procesos, dashboard)

Esto combina:
- ✅ Pragmatismo de OC para empezar YA
- ✅ Completitud de Codex para cobertura funcional
- ✅ Visión de PI para escalabilidad futura
- ❌ Evita limitaciones de AGY

**Próximos pasos inmediatos**:
1. Confirmar guía técnica Convex/Next.js
2. Crear schema initial basado en OC + tablas de Codex
3. Implementar vertical slice: 1 tabla, 1 función, 1 vista
4. Iterar rápidamente hacia checklist + cronograma
5. Validar con usuarios antes de expandir

---

**Documento generado**: 2026-06-07  
**Análisis realizado por**: Asistente AI  
**Planes evaluados**: 4 (AGY, Codex, OC, PI)  
**Recomendación**: Plan híbrido phased en 3 fases
