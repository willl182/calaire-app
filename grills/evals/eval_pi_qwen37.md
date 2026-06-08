# Evaluación Comparativa de Planes SGC — CALAIRE-APP

**Fecha**: 2026-06-07
**Planes evaluados**: plan_agy.md, plan_codex.md, plan_oc.md, plan_pi.md
**Evaluador**: pi (qwen3-coder)

---

## 1. Resumen Ejecutivo

| Dimensión | 🟢 plan_agy | 🔵 plan_codex | 🟡 plan_oc | 🟣 plan_pi |
|---|---|---|---|---|
| **Alcance** | Mínimo (Fase 1 básica) | Amplio MVP1 + MVP2 | Intermedio, bien delimitado | Muy amplio (SGC completo) |
| **Profundidad técnica** | Baja | Alta | Media-Alta | Alta |
| **Modelo de datos** | Esquemático | Detallado con ER | Detallado con campos | Más detallado (CSV import) |
| **Viabilidad incremental** | Alta | Media | Alta | Baja (mucho upfront) |
| **Alineación con Convex/Next** | Genérica | Buena | Explícita (lee docs primero) | Buena pero ambiciosa |
| **Gestión de riesgos** | Ausente | Parcial | Explícita con tradeoffs | Parcial |
| **Madurez para ejecución** | ❌ Insuficiente | ⚠️ Casi lista | ✅ Lista | ⚠️ Requiere refinamiento |

---

## 2. Evaluación Individual

### 2.1 🟢 plan_agy.md — "El esqueleto"

**Fortalezas:**
- Conciso y directo al punto.
- Define fases claras (Backend → Frontend).
- Referencia archivos existentes del proyecto (`schema.ts`, `SidebarNav.tsx`).
- Tiene log de ejecución con checkboxes.

**Debilidades críticas:**
- **No define modelo de datos**: dice "agregar tablas" sin especificar campos, índices ni relaciones.
- **No define estados ni flujos**: menciona F-PSEA-06/08/13 pero no cómo se modelan.
- **No aborda evidencias/versionamiento**: solo dice "carga de documentos en Convex storage".
- **No considera visibilidad por rol**: no distingue admin vs participante.
- **No tiene criterios de aceptación** ni definición de completitud.
- **No maneja estados de ronda**: el schema actual tiene `borrador | activa | cerrada` y este plan no propone cambios.
- **Demasiado vago para ejecutar**: un desarrollador tendría que tomar decenas de decisiones no documentadas.

**Veredicto**: Es un borrador inicial, no un plan ejecutable. Útil como índice de intenciones, insuficiente como especificación.

---

### 2.2 🔵 plan_codex.md — "El arquitecto operativo"

**Fortalezas:**
- **Excelente regla nativo vs archivo** con tabla de criterios clara.
- **Arquitectura funcional completa** con diagramas Mermaid (flujo, navegación, visibilidad por rol, estados).
- **Cronograma nativo bien definido**: 11 hitos mínimos con campos detallados.
- **Máquina de estados de ronda** con transiciones y condiciones de bloqueo.
- **Registros críticos para cierre** claramente listados (siempre vs condicional).
- **Comunicaciones y notificaciones** con flujo y tabla de eventos/canales.
- **Comentarios con promoción manual** a casos SGC formales.
- **Evidencias con versionamiento** y ER diagram.
- **Integración pt_app** pragmática (MVP = adjuntar + metadatos).
- **Separación MVP1 / MVP2** sensata.
- **9 tablas Convex propuestas** con propósito claro.
- **Orden técnico recomendado** paso a paso.

**Debilidades:**
- **No aborda F-PSEA-06 (Plan de Ronda) como formulario nativo en MVP1**: lo deja implícito en el checklist pero no lo modela.
- **No incluye snapshots/historial** para registros editables.
- **No contempla PDF imprimible** para formatos nativos.
- **No define catálogo SGC en código** vs configurable.
- **Tablas numerosas para MVP1** (9 tablas): riesgo de sobreingeniería inicial.
- **No menciona importación masiva** de matriz documental.
- **Diagramas Mermaid extensos** pueden ser difíciles de mantener.

**Veredicto**: El plan más completo en términos de arquitectura operativa y flujos. Excelente para entender el *qué* y el *cómo*. Le falta precisión en la capa de presentación (PDF, snapshots) y en la estrategia de datos maestros.

---

### 2.3 🟡 plan_oc.md — "El pragmático disciplinado"

**Fortalezas:**
- **Delimitación explícita de alcance fase 1** con listas "incluye" y "no incluye".
- **Principios acordados** documentados como decisiones conscientes.
- **Tabla de formatos fase 1** con modo (nativo/archivo/no aplica) y criterio de cobertura verificable.
- **Estados del panel** (`no_aplica | pendiente | cubierto_nativo | cubierto_archivo | requiere_revision`) son simples y accionables.
- **Plan de ronda nativo** basado en plantilla real (`F-PPSEA-03`) con bloques `a-u` y subcampos críticos identificados.
- **F-13 manual con métricas de apoyo** bien pensado: no automatiza lo que no debe automatizarse.
- **Evidencias con metadata automática** y reglas claras (sin borrado, versión incremental, tipos permitidos, límite 10MB).
- **PDF imprimible** para F-06/F-13 con decisiones explícitas sobre qué incluye/excluye.
- **Snapshots e historial** diferenciado de versionamiento de archivos.
- **Nuevo estado `documentacion_pendiente`** con requisitos de transición bidireccionales y reapertura.
- **Plantillas P-20 en Markdown** con variables explícitas (pragmático: no motor de email).
- **UI propuesta** con columnas, agrupación y layout concretos.
- **Riesgos y tradeoffs aceptados** documentados honestamente.
- **Orden de implementación** con paso 0: "Confirmar guía de Convex y Next antes de editar código".

**Debilidades:**
- **No incluye comunicaciones/notificaciones in-app** en fase 1 (solo plantillas Markdown).
- **No incluye comentarios de participantes** en fase 1.
- **No incluye casos SGC** (NC/CAPA, quejas, apelaciones) en fase 1.
- **Catálogo SGC en código** puede volverse rígido si crece.
- **5 tablas nuevas** es manejable pero no trivial.
- **No aborda dashboard SGC global** (solo vista por ronda).
- **F-13 puede finalizarse con checks pendientes**: riesgo de auditoría si no se mitiga.

**Veredicto**: El plan más equilibrado entre profundidad y pragmatismo. Mejor delimitación de alcance. Mejor gestión de riesgos documentados. Ideal como base de ejecución para fase 1.

---

### 2.4 🟣 plan_pi.md — "El visionario comprehensivo"

**Fortalezas:**
- **Visión más completa del SGC**: matriz documental maestra, vista por procesos, dashboard global.
- **Regla nativo vs archivo** con 7 criterios (más exhaustiva que codex).
- **Matriz documental con importación CSV**: única propuesta que aborda la carga inicial masiva.
- **Modos de gestión** (`nativo | archivo | generado | integracion`) más granulares.
- **Estados separados** (gestión vs implementación): distinción importante que otros omiten.
- **Control documental con versiones** y reglas de visibilidad para participantes bien definidas.
- **Cronograma con plantilla estándar editable** de 12 hitos.
- **F-PSEA-08 Preparación de ítem** modelado con niveles individuales (`preparacionItemsNiveles`).
- **Casos SGC unificados** (NC/CAPA + quejas + apelaciones) con estados comunes.
- **Comentarios de participantes** con categorías y flujo de respuesta.
- **Rutas propuestas** completas con estructura REST-like.
- **Incrementos bien definidos** (1, 2, después).
- **Primer vertical slice** concreto con tablas, funciones y UI.

**Debilidades:**
- **Alcance muy amplio para incremento 1**: matriz documental + importación CSV + detalle + subida + versionamiento + dashboard + cronograma + plan de ronda = mucho.
- **No incluye F-13 en incremento 1**: lo posterga al incremento 2, pero es crítico para cierre documental.
- **No aborda PDF imprimible** para formatos nativos.
- **No aborda snapshots** para registros editables.
- **Auditoría diseñada pero no implementada**: solo campos básicos en MVP.
- **Complejidad de la matriz documental**: importar CSV + upsert + validación es un módulo completo en sí mismo.
- **Vista por procesos** en incremento 1 añade superficie UI significativa.
- **No detalla integración con WorkOS/auth** para permisos.
- **Estado `documentacion_pendiente` no propuesto** (usa el modelo actual de 3 estados).
- **Riesgo de parálisis por análisis**: tantas abstracciones pueden ralentizar la entrega.

**Veredicto**: El plan con mejor visión sistémica y mejor modelo de datos a largo plazo. Pero es demasiado ambicioso para un primer incremento. Necesita poda agresiva para ser ejecutable.

---

## 3. Análisis Cruzado por Dimensión

### 3.1 Modelo de Datos

| Aspecto | agy | codex | oc | pi |
|---|---|---|---|---|
| Tablas propuestas | 2 (vagas) | 9 | 5 | 7+ |
| Campos definidos | No | Sí (parcial) | Sí (completo) | Sí (completo) |
| Índices | No | No | No | No |
| Relaciones ER | No | Sí (diagrama) | Implícitas | Implícitas |
| Importación masiva | No | No | No | Sí (CSV) |
| Versionamiento | No | Sí (series+versiones) | Sí (simple) | Sí (con estados) |
| Snapshots | No | No | Sí | No |

**Ganador**: 🟡 **plan_oc** por equilibrio entre completitud y simplicidad. 🟣 plan_pi tiene mejor modelo de matriz pero es overkill para fase 1.

### 3.2 Gestión de Estados

| Aspecto | agy | codex | oc | pi |
|---|---|---|---|---|
| Estados de ronda | No cambia | Máquina completa | Agrega `documentacion_pendiente` | No cambia |
| Transiciones | No | Sí (con condiciones) | Sí (con requisitos) | No |
| Reapertura | No | No | Sí | No |
| Estados de formato | No | Checklist binario | 5 estados graduales | Por documento |

**Ganador**: 🟡 **plan_oc** por el estado intermedio `documentacion_pendiente` que refleja la realidad operativa. 🔵 plan_codex tiene mejor máquina de estados formal.

### 3.3 Formatos SGC Cubiertos

| Formato | agy | codex | oc | pi |
|---|---|---|---|---|
| F-PSEA-06 Plan de Ronda | Mención | Checklist | ✅ Nativo (bloques a-u) | ✅ Nativo (campos) |
| F-PSEA-05 Confirmación | No | Checklist | ✅ Nativo existente | ✅ Nativo existente |
| F-PSEA-05A Ficha | No | Checklist | ✅ Nativo existente | ✅ Nativo existente |
| F-PSEA-07 Lista maestra | No | Checklist | ✅ Nativo existente | ✅ Nativo existente |
| F-PSEA-08 Preparación | Mención | Archivo en MVP1 | Archivo en fase 1 | ✅ Nativo (niveles) |
| F-PSEA-11 Envío | No | Checklist | No aplica | No aplica |
| F-PSEA-12 Reportes | No | Checklist | ✅ Nativo existente | ✅ Nativo existente |
| F-PSEA-13 Revisión | Mención | Checklist | ✅ Nativo (manual) | Postergado Inc.2 |
| F-PSEA-09/10/14 | No | pt_app adjunto | Archivo | Archivo |

**Ganador**: 🟡 **plan_oc** por cobertura realista en fase 1. 🟣 plan_pi modela mejor F-08 pero lo incluye en incremento 2.

### 3.4 Experiencia de Usuario

| Aspecto | agy | codex | oc | pi |
|---|---|---|---|---|
| Ubicación panel | Pestaña SGC | Pestaña SGC | Pestaña en RondaContextNav | Dashboard separado |
| Visibilidad participante | No definida | Definida | Definida | Definida |
| PDF imprimible | No | No | ✅ Sí | No |
| Plantillas comunicación | No | Registro manual | Markdown con variables | No en Inc.1 |
| Comentarios | No | ✅ Sí | No en fase 1 | ✅ Sí (Inc.2) |

**Ganador**: 🔵 **plan_codex** por completeness de UX. 🟡 plan_oc gana en PDF y plantillas.

### 3.5 Viabilidad Técnica

| Aspecto | agy | codex | oc | pi |
|---|---|---|---|---|
| Tamaño Inc.1 | Pequeño | Medio-Grande | Medio | Grande |
| Dependencias externas | Ninguna | Ninguna | Plantilla MD | CSV parser |
| Complejidad Convex | Baja | Alta (9 tablas) | Media (5 tablas) | Alta (7+ tablas) |
| Riesgo de scope creep | Alto (vago) | Medio | Bajo | Alto |
| Lectura docs Convex/Next | No | No | ✅ Paso 0 explícito | No |

**Ganador**: 🟡 **plan_oc** por tamaño manejable y paso 0 de verificación.

---

## 4. Recomendación Final: Plan Sintético

Ningún plan individual es suficiente. La estrategia óptima es **combinar lo mejor de cada uno**:

### Base estructural: 🟡 plan_oc
- Delimitación de alcance fase 1.
- Estado `documentacion_pendiente` con transiciones.
- Formatos con modo y criterio de cobertura.
- F-06 nativo por bloques + F-13 manual con métricas.
- Evidencias simples + PDF imprimible + snapshots.
- Plantillas P-20 en Markdown.
- Riesgos y tradeoffs documentados.
- Paso 0: leer docs de Convex y Next.

### Complementos de 🔵 plan_codex:
- Diagramas de flujo y visibilidad por rol.
- Comentarios de participantes (añadir a fase 1 si hay capacidad).
- Registros críticos condicionales (si hubo queja/apelación/NC).
- Integración pt_app con estados de aprobación.

### Complementos de 🟣 plan_pi:
- Matriz documental simplificada (sin importación CSV en fase 1; crear manualmente).
- Vista por procesos como filtro/vista, no como módulo separado.
- Modelo de `preparacionItemsNiveles` para cuando F-08 sea nativo.
- Casos SGC unificados para fase 2.
- Rutas REST-like como referencia futura.

### Descartar de 🟢 plan_agy:
- Todo su contenido está superado por los otros tres. Conservar solo como registro histórico.

### Incremento 1 Recomendado (7-8 tablas máx.)

```
1. sgcPlanRonda          ← F-06 nativo (oc)
2. sgcRevisionDatos      ← F-13 manual (oc)
3. sgcEvidencias         ← Archivos versionados (oc + codex)
4. sgcHitosRonda         ← Cronograma nativo (codex + oc)
5. sgcRegistroSnapshots  ← Historial F-06/F-13 (oc)
6. sgcComentariosRonda   ← Comentarios participantes (codex, si alcanza)
7. Cambiar rondas.estado ← Agregar documentacion_pendiente (oc)
```

### Criterios de Éxito del Incremento 1
1. ✅ Una ronda puede transicionar `activa → documentacion_pendiente → cerrada`.
2. ✅ El plan de ronda F-06 es editable y genera PDF.
3. ✅ F-13 es finalizable con métricas de apoyo.
4. ✅ Las evidencias F-08/09/10/14 se cargan y versionan.
5. ✅ El cronograma muestra hitos con alertas visuales.
6. ✅ El participante ve solo lo que le corresponde.
7. ✅ Los códigos provisionales están marcados como tales.

---

## 5. Advertencias Finales

1. **Los códigos SGC son provisionales**: todos los planes coinciden. Debe revisarse la lista maestra documental antes de cualquier uso en auditoría.
2. **Convex Storage tiene límites**: verificar límites de tamaño y tipos MIME antes de implementar.
3. **El estado `documentacion_pendiente` requiere migración**: las rondas existentes en `cerrada` deben evaluarse.
4. **F-13 permisivo es un riesgo**: documentar la decisión y planear endurecimiento en fase 2.
5. **No over-engineer la matriz documental**: empezar con catálogo en código; la importación CSV puede esperar.
