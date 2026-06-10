# Evaluación detallada de los 4 planes SGC para CALAIRE-APP

**Fecha**: 2026-06-07
**Evaluador**: Pi (claude-sonnet-4-20250514)
**Archivos evaluados**: plan_agy.md, plan_codex.md, plan_oc.md, plan_pi.md

---

## Contexto del proyecto actual

El schema Convex actual tiene: `directorioParticipantes`, `rondas` (con estados `borrador | activa | cerrada`), `rondaContaminantes`, `rondaParticipantes`, `rondaPtItems`, `rondaPtSampleGroups`, `enviosPt`, `envios`, `fichasRegistro` y tablas asociadas. No existe aún ningún componente SGC.

---

## 1. RESUMEN COMPARATIVO

| Dimensión | plan_agy | plan_codex | plan_oc | plan_pi |
|---|---|---|---|---|
| **Extensión** | 45 líneas (esqueleto) | ~280 líneas | ~350 líneas | ~350 líneas |
| **Profundidad técnica** | Muy baja | Media-alta | Alta | Muy alta |
| **Tablas Convex propuestas** | 2 (`rondaDocumentos`, `rondaHitos`) | 9 tablas SGC | 5 tablas SGC + cambios a `rondas` | 7 tablas SGC |
| **Fases/Incrementos** | 2 fases simples | MVP1 + MVP2 | Fase 1 + Después | Inc.1 + Inc.2 + Después |
| **Alcance MVP** | Panel + 3 formularios | Cierre documental completo | Panel + matriz documental | Panel operativo completo |
| **Código de formatos** | Usa `F-PSEA-XX` reales | Usa `F-PSEA-XX` reales | Usa `F-PPSEA-XX` (mixto) | Usa `F-PSEA-XX` reales |
| **Mermaid/arquitectura** | No | Sí (6 diagramas) | Sí (texto) | No |
| **Modelo de datos** | Implícito | ER parcial | Conceptual detallado | Conceptual detallado |
| **Ruta de archivos propuesta** | 2 archivos | Implícita | Explícita (12 rutas) | Explícita (11 rutas) |

---

## 2. EVALUACIÓN INDIVIDUAL

### 2.1 plan_agy.md

**Fortalezas:**
- Concisión extrema: fácil de entender en 1 minuto.
- Orden técnico claro: backend primero, UI después.
- Log de ejecución con checkboxes (útil para tracking).

**Debilidades críticas:**
- **Insuficiente para implementar.** Solo menciona "agregar tablas" sin definir campos, tipos, ni índices.
- **Solo 2 tablas propuestas** (`rondaDocumentos`, `rondaHitos`): no cubre checklist, comunicaciones, evidencias versionadas, ni comentarios.
- **No define la regla "nativo vs archivo"**, que es la decisión arquitectónica central.
- **No aborda estados de ronda** ni transiciones documentales.
- **No menciona visibilidad por rol** (admin vs participante).
- **No considera versionamiento de evidencias.**
- **3 formularios específicos** (F-PSEA-06, F-PSEA-08, F-PSEA-13) pero sin definir campos ni comportamiento.
- **No hay decisión sobre pt_app** (integración vs archivo).

**Veredicto:** Es un esqueleto ejecutivo, no un plan implementable. Necesita ser completamente reescrito.

---

### 2.2 plan_codex.md

**Fortalezas:**
- **Mejor definición de "nativo vs archivo"** con tabla clara de criterios y ejemplos.
- **Diagramas Mermaid completos**: arquitectura funcional, navegación, visibilidad por rol, estados de ronda, flujo de comunicaciones, flujo de comentarios, ER de evidencias.
- **Tablas de visibilidad por rol** explícitas y detalladas.
- **Cronograma nativo con 11 hitos mínimos** y 14 campos por hito: el más completo de los 4.
- **Estados de ronda bien modelados** (borrador → Activa → EnOperacion → ... → Cerrada) con reglas de advertencia vs bloqueo.
- **Registros críticos para cierre documental** separados en "siempre" y "solo si existen casos": muy pragmático.
- **Modelo ER de evidencias** con series y versiones.
- **Flujo de comunicaciones** bien pensado (preparar → registrar envío manual → log).
- **Separación clara MVP1/MVP2** con 11 items en MVP1 y 7 en MVP2.
- **Integración pt_app** bien acotada: archivos exportados + metadatos + aprobación.

**Debilidades:**
- **No define campos del schema Convex** para las 9 tablas propuestas (solo nombres y propósito).
- **No menciona índices Convex** ni consideraciones de performance.
- **El catálogo SGC no se menciona** (¿vive en código? ¿en DB?).
- **No detalla la UI** más allá de diagramas de navegación (layout, columnas, acciones).
- **No menciona PDF imprimible** para formularios.
- **No menciona snapshots/historial** de ediciones.
- **Comunicaciones y comentarios son MVP1** pero no hay detalle de implementación.
- **No hay orden técnico de implementación** con archivos concretos.
- **F-PSEA-08 y F-PSEA-11 como MVP2** puede ser problemático si son necesarios para cierre documental en MVP1.
- **No menciona límites de archivo** ni tipos permitidos.

**Veredicto:** Excelente documento de diseño y toma de decisiones. Le falta especificidad técnica para implementar directamente. Es el mejor "plan de diseño" de los 4.

---

### 2.3 plan_oc.md

**Fortalezas:**
- **Más realista sobre el alcance de fase 1**: excluye NC/CAPA, quejas, apelaciones, notificaciones, cron automático.
- **Formatos fase 1 bien tabulados** con criterio de cobertura explícito (nativo existente, nativo nuevo, archivo, no aplica).
- **Estados del panel bien definidos**: `no_aplica`, `pendiente`, `cubierto_nativo`, `cubierto_archivo`, `requiere_revision`.
- **Plan de ronda nativo basado en F-PPSEA-03** con bloques `a` a `u`: el más detallado sobre este formulario.
- **F-13 como checklist manual** con métricas de apoyo: decisión pragmática.
- **Evidencias con metadata automática** (10 campos definidos) y tipos/limites de archivo.
- **PDF imprimible** para F-06 y F-13: requisito que los otros omiten.
- **Snapshots e historial** para formularios editables post-finalización.
- **Estados de ronda ampliados** con `documentacion_pendiente` y reglas de transición claras.
- **Plantillas P-20 en Markdown** con variables: solución sin email provider.
- **Riesgos y tradeoffs aceptados** explícitos.
- **Orden de implementación** con 12 pasos concretos.

**Debilidades:**
- **Códigos mixtos** (`F-PPSEA-03` vs `F-PSEA-06`): puede causar confusión con la documentación real.
- **No define tablas Convex con campos completos** (solo menciona nombres de tablas).
- **No diagramas Mermaid** (a diferencia de codex).
- **F-11 como "no aplica"** es correcto para esquema in situ, pero no lo justifica claramente.
- **No menciona integración con tablas existentes** (`rondas`, `rondaContaminantes`, etc.).
- **No detalla la UI** (layout, componentes, responsividad).
- **"Catálogo SGC vive en código"** pero no define estructura del catálogo.
- **Plantillas P-20** mencionadas pero no incluye contenido de las plantillas.
- **No menciona permisos de Convex** (public vs internal functions).

**Veredicto:** El plan más maduro operativamente. Buen equilibrio entre alcance realista y detalle. El código mixto de formatos es su mayor riesgo.

---

### 2.4 plan_pi.md

**Fortalezas:**
- **Más completo técnicamente**: define modelos conceptuales con campos completos para cada tabla.
- **Regla "nativo vs archivo"** más elaborada (7 condiciones, al menos 2 para ser nativo).
- **Matriz documental maestra** como módulo central: ningún otro plan la propone.
- **Modo de gestión con 4 categorías** (`nativo`, `archivo`, `generado`, `integracion`): más granular que los otros.
- **Estados separados** para gestión e implementación: más robusto para auditoría.
- **Importación CSV** de matriz documental con clave de upsert y reglas de merge.
- **Modelo de control documental** completo (documentos + versiones + visibilidad).
- **8 procesos SGC** definidos como categorías de la matriz.
- **F-PSEA-08 detallado** con tabla de niveles separada (`preparacionItemsNiveles`).
- **Casos SGC** como módulo unificado (NC/CAPA + quejas + apelaciones) con estados y severidad.
- **Comentarios de participantes** con modelo completo y estados.
- **Rutas propuestas** explícitas para cada vista.
- **Incrementos bien definidos** con vertical slice recomendado.
- **Primer vertical slice** con tablas, funciones y UI concretas.

**Debilidades:**
- **Alcance muy ambicioso para MVP**: matriz documental + importación CSV + control documental + casos SGC es mucho para un primer incremento.
- **No menciona PDF imprimible**.
- **No menciona snapshots/historial** de ediciones de formularios.
- **No menciona plantillas P-20** ni comunicaciones.
- **No diagramas Mermaid**.
- **No define hitos del cronograma** (solo el modelo de tabla).
- **No menciona el estado `documentacion_pendiente`** para rondas.
- **Modelo `casosSgc`** incluido en incremento 2 pero podría posponerse más.
- **No menciona la integración específica con tablas existentes** del schema actual.
- **"Auditoría" mencionada como futuro** pero no define qué eventos auditar.
- **Algunas tablas propuestas** (`documentosSgc`, `documentoSgcVersiones`) son redundantes con `sgcEvidencias` si se simplifica.

**Veredicto:** El plan más técnicamente completo. Ideal como referencia de arquitectura. Su ambición puede ser un riesgo si se intenta implementar todo en el primer incremento.

---

## 3. ANÁLISIS CRUZADO DE FORTALEZAS Y DEBILIDADES

### 3.1 Decisiones que los 4 planes compiden (consenso)

| Decisión | Consenso |
|---|---|
| Panel por ronda, no repositorio global | ✅ Los 4 |
| Pestaña nueva SGC en dashboard admin | ✅ Los 4 |
| Checklist de cierre documental | ✅ Los 4 |
| Cronograma nativo simple (no Gantt) | ✅ Los 4 |
| Evidencias con versionamiento en Convex Storage | ✅ Los 4 |
| No enviar emails automáticos en MVP | ✅ Los 4 |
| No reemplazar pt_app | ✅ Los 4 |

### 3.2 Decisiones donde hay divergencia

| Tema | plan_agy | plan_codex | plan_oc | plan_pi | Recomendación |
|---|---|---|---|---|---|
| **NC/CAPA, quejas, apelaciones** | No menciona | MVP2 | Fuera de fase 1 | Inc.2 | **MVP2/Inc.2** (correcto) |
| **Comunicaciones** | No menciona | MVP1 (manuales) | Fuera de fase 1 (plantillas P-20 sí) | No menciona | **Plantillas en MVP1, módulo en MVP2** |
| **Notificaciones in-app** | No menciona | MVP1 | Fuera de fase 1 | No menciona | **MVP2** (baja prioridad) |
| **Matriz documental** | No | No | No | Sí (central) | **Útil pero no MVP1** |
| **Importación CSV** | No | No | No | Sí | **MVP2** |
| **PDF imprimible** | No | No | Sí (F-06, F-13) | No | **Sí en MVP1** |
| **Snapshots/historial** | No | No | Sí | No | **Sí en MVP1** |
| **F-PSEA-08** | Fase 2 | MVP2 | Archivo (fase 1) | Inc.2 | **Archivo en MVP1, nativo en MVP2** |
| **F-PSEA-11** | No menciona | MVP2 | No aplica | No aplica | **No aplica** (in situ) |
| **Comentarios participantes** | No | MVP1 | Fuera de fase 1 | Inc.2 | **MVP2** |
| **Casos SGC** | No | MVP2 | Fuera de fase 1 | Inc.2 | **MVP2** |
| **Estados de ronda** | No cambia | 6 estados | `documentacion_pendiente` | No menciona | **Agregar `documentacion_pendiente`** |
| **Visibilidad participante** | No menciona | Detallada | Detallada | Detallada | **Implementar** |

### 3.3 Huecos que ningún plan cubre bien

| Hueco | Impacto |
|---|---|
| **Campos Convex exactos con tipos** | Ningún plan define `v.string()`, `v.number()`, etc. para sus tablas. |
| **Índices Convex** | Ningún plan menciona índices específicos. |
| **Integración con schema existente** | Ninguno detalla cómo `sgcPlanRonda` se vincula con `rondas`, `rondaContaminantes`, etc. |
| **Auth/permisos en Convex** | Ninguno menciona `ctx.auth.getUserIdentity()` ni funciones `internal` vs `public`. |
| **Componentes UI específicos** | Ninguno define componentes React (solo páginas y rutas). |
| **Testing** | Ningún plan menciona tests. |
| **Performance** | Ninguno considera paginación, límites de collect(), ni denormalización. |

---

## 4. RECOMENDACIONES PARA LA VERSIÓN FINAL

### 4.1 Estructura del plan final

```
1. Objetivo y alcance (de codex/oc)
2. Decisiones de diseño (consenso de los 4)
3. Regla nativo vs archivo (de pi, simplificada)
4. Arquitectura funcional (diagramas de codex)
5. Estados de ronda (de oc)
6. Visibilidad por rol (de codex)
7. Cronograma nativo (de codex, hitos de oc)
8. Formatos y módulos:
   - F-PSEA-06 Plan de ronda (de oc, bloques a-u)
   - F-PSEA-08 Preparación (archivo en MVP1, de pi para MVP2)
   - F-PSEA-11 No aplica (de oc)
   - F-PSEA-13 Revisión (de oc, checklist manual)
   - Evidencias (de codex, modelo de pi)
   - Comunicaciones (plantillas de oc)
9. Integración pt_app (de codex)
10. Tablas Convex (modelo de pi + campos exactos)
11. Rutas y UI (de pi + oc)
12. Incrementos/MVPs (de oc, más realista)
13. Orden técnico (de oc)
14. Riesgos y tradeoffs (de oc)
```

### 4.2 Decisiones clave para la versión final

| Decisión | Recomendación | Fuente |
|---|---|---|
| **MVP1 = cierre documental básico** | Sí | oc |
| **Estados de ronda** | Agregar `documentacion_pendiente` | oc |
| **Cronograma** | 11 hitos mínimos de codex, campos de codex | codex |
| **Evidencias** | Series + versiones (codex) con metadata automática (oc) | codex + oc |
| **F-PSEA-06** | Nativo por bloques a-u | oc |
| **F-PSEA-08** | Archivo en MVP1, nativo en MVP2 | oc + pi |
| **F-PSEA-13** | Checklist manual con métricas de apoyo | oc |
| **PDF imprimible** | Sí para F-06 y F-13 en MVP1 | oc |
| **Snapshots** | Sí para F-06 y F-13 | oc |
| **Plantillas P-20** | Markdown con variables, sin email | oc |
| **Comunicaciones/notificaciones** | MVP2 | consenso |
| **NC/CAPA/quejas/apelaciones** | MVP2 | consenso |
| **Matriz documental** | MVP2 (útil pero no urgente) | pi |
| **Importación CSV** | MVP2 | pi |
| **Tablas Convex** | 5-7 tablas (modelo pi, simplificado) | pi |
| **Visibilidad por rol** | Admin = todo, Participante = subset | codex |
| **Mermaid** | Sí para documentación | codex |

### 4.3 Tablas Convex recomendadas para MVP1

| Tabla | Propósito | Fuente |
|---|---|---|
| `sgcPlanRonda` | Plan de ronda F-PSEA-06 por bloques | oc |
| `sgcRevisionDatos` | Checklist F-13 manual | oc |
| `sgcEvidencias` | Series + versiones (merge codex+oc) | codex + oc |
| `sgcAuditLog` | Bitácora mínima | oc |
| `sgcRegistroSnapshots` | Snapshots de F-06 y F-13 | oc |
| `sgcHitosRonda` | Cronograma nativo | codex |
| `sgcComunicaciones` | Comunicaciones manuales registradas | codex |

### 4.4 Riesgo principal a mitigar

El mayor riesgo es **intentar hacer demasiado en MVP1**. El plan_pi propone matriz documental + importación CSV + control documental completo como primer incremento, lo cual es excesivo. El plan_oc es el más realista: cierre documental básico por ronda, sin gestor documental general.

---

## 5. CONCLUSIÓN

| Plan | Mejor para | Peor para |
|---|---|---|
| **plan_agy** | Ejecutivo/overview rápido | Implementación |
| **plan_codex** | Diseño arquitectónico y decisiones | Especificidad técnica |
| **plan_oc** | Alcance realista y operativo | Arquitectura visual |
| **plan_pi** | Modelo de datos y alcance completo | Realismo de MVP1 |

**La versión final debería tomar:**
- **Estructura y decisiones** de `plan_codex`
- **Alcance y realismo** de `plan_oc`
- **Modelo de datos** de `plan_pi`
- **Mermaid y visibilidad** de `plan_codex`
- **PDF, snapshots y plantillas P-20** de `plan_oc`
- **Orden técnico** de `plan_oc`
