# Evaluación comparativa de los 4 planes: Panel SGC en CALAIRE-APP

**Fecha**: 2026-06-07
**Archivos evaluados**: `plan_agy.md`, `plan_codex.md`, `plan_oc.md`, `plan_pi.md`

---

## 1. Visión general de cada plan

### plan_agy.md (Agy)
- **Extensión**: 83 líneas. Es el más breve y escueto.
- **Enfoque**: Fase 1 minimalista: dos tablas nuevas (`rondaDocumentos`, `rondaHitos`), campos adicionales en tablas existentes, y dos archivos Convex.
- **Núcleo**: Panel SGC con estado de cumplimiento por ronda + gestor de carga de archivos. Pestañas para Plan de Ronda, Preparación Ítem y Revisión de Datos.
- **Fases explícitas**: Fase 1 (backend) + Fase 2 (UI).

### plan_codex.md (Codex)
- **Extensión**: ~300 líneas. El más detallado en flujos y reglas.
- **Enfoque**: Panel operativo de cierre documental. Checklist formal de cierre por ronda, cronograma nativo de hitos mínimos, evidencias versionadas, comunicaciones manuales, notificaciones, comentarios.
- **Núcleo**: 9 tablas Convex, diagramas Mermaid de flujos, matriz de visibilidad admin/participante, estados de ronda con máquina de estados, catálogo de hitos obligatorios, reglas nativo vs archivo, MVP 1 y MVP 2 definidos.
- **Fortaleza distintiva**: Diseño de flujos y reglas de negocio muy completo.

### plan_oc.md (OC)
- **Extensión**: ~230 líneas. Detallado y pragmático.
- **Enfoque**: Panel SGC por ronda con checklist agrupado por fase. Plan de ronda nativo basado en plantilla `F-PPSEA-03` con bloques editables `a`-`u`. F-13 manual con métricas de apoyo. Evidencias por archivo con versionado automático. PDF imprimible. Snapshots de registros. Nuevo estado `documentacion_pendiente`.
- **Fortaleza distintiva**: Diseño concreto de formatos y su implementación, catálogo en código, vistas imprimibles.

### plan_pi.md (Pi)
- **Extensión**: ~360 líneas. El más arquitectónico y amplio.
- **Enfoque**: Matriz documental maestra como columna vertebral. 8 procesos. Control documental con versionado. Cronograma nativo. Plan de ronda nativo. F-PSEA-08 nativo. Comentarios de participantes. Casos SGC formales (NC/CAPA, quejas, apelaciones). 3 incrementos. Auditoría futura.
- **Fortaleza distintiva**: Matriz documental como mapa maestro, importación CSV, arquitectura de procesos, visión más completa del futuro.

---

## 2. Comparación por dimensiones críticas

### 2.1 Alcance funcional

| Aspecto | Agy | Codex | OC | Pi |
|---|---|---|---|---|
| Panel SGC por ronda | ✅ | ✅ | ✅ | ✅ |
| Checklist cierre documental | ✅ (implícito) | ✅ (formal) | ✅ (por fase) | ❌ (no checklist formal) |
| Cronograma nativo | ✅ (hitos) | ✅ (11 hitos) | ✅ (hitos simples) | ✅ (12 hitos) |
| Plan de ronda nativo | ✅ (mención) | ❌ (MVP 2) | ✅ (bloques a-u) | ✅ (campos operativos) |
| Evidencias versionadas | ✅ (carga) | ✅ (series+versiones) | ✅ (automático) | ✅ (documental) |
| Matriz documental | ❌ | ❌ | ❌ (catálogo en código) | ✅ (maestra, CSV) |
| Comunicaciones | ❌ | ✅ (manuales) | ❌ (solo plantillas) | ❌ (futuro) |
| Notificaciones in-app | ❌ | ✅ | ❌ | ❌ (futuro) |
| Comentarios participantes | ❌ | ✅ (por ronda) | ❌ | ✅ (conversión a caso) |
| Casos SGC (NC/CAPA, quejas) | ❌ | ❌ (MVP 2) | ❌ (explícitamente no) | ✅ |
| F-PSEA-08 Preparación ítem | ✅ (pestaña) | ❌ (MVP 2) | ❌ (archivo) | ✅ (nativo, niveles) |
| F-PSEA-13 Revisión datos | ✅ (pestaña) | ❌ (MVP 2) | ✅ (checklist manual) | ❌ (Incremento 2) |
| PDF imprimible | ❌ | ❌ | ✅ | ❌ (futuro) |
| Snapshots históricos | ❌ | ❌ | ✅ | ❌ |
| Integración pt_app | ❌ | ✅ (metadatos) | ❌ (fase 1 no) | ✅ (archivos) |
| Importación CSV matriz | ❌ | ❌ | ❌ | ✅ |
| Vista por procesos | ❌ | ❌ | ❌ | ✅ (8 procesos) |

### 2.2 Modelo de datos

| Aspecto | Agy | Codex | OC | Pi |
|---|---|---|---|---|
| Tablas propuestas | 2 | 9 | 5 | 4+ (más futuro) |
| Nombres de tablas | `rondaDocumentos`, `rondaHitos` | Prefijo `sgc*` | Prefijo `sgc*` | `documentosSgc`, `rondaHitos`, etc. |
| Estados de ronda | Sin cambios | 7 estados en state machine | +`documentacion_pendiente` | Sin cambios explícitos |
| Índices definidos | ❌ | ❌ | ❌ | ❌ |
| Relaciones explícitas | ❌ | ✅ (ER diagram) | ✅ | ✅ |

**Debilidad compartida**: Ningún plan define índices Convex concretos ni considera las reglas de Convex sobre arrays no acotados (Codex y Pi proponen arrays dentro de documentos).

### 2.3 Arquitectura técnica

| Aspecto | Agy | Codex | OC | Pi |
|---|---|---|---|---|
| Orden de implementación | ✅ | ✅ | ✅ | ✅ |
| Archivos concretos | ✅ | ❌ (general) | ❌ (general) | ❌ (general) |
| Rutas URL propuestas | ❌ | Parcial | ✅ (1 ruta) | ✅ (10+ rutas) |
| Catálogo en código | ❌ | ❌ | ✅ | ❌ |
| Plantillas Markdown | ❌ | ❌ | ✅ (P-20) | ❌ |
| Uso de Convex Storage | ✅ | ✅ | ✅ | ✅ |
| Acciones Convex (Node) | ❌ | ❌ | ❌ | ❌ |

**Debilidad compartida**: Ningún plan aborda acciones Convex para procesamiento de archivos, generación de PDFs, o parseo de CSV del lado servidor.

### 2.4 Visibilidad y permisos

| Aspecto | Agy | Codex | OC | Pi |
|---|---|---|---|---|
| Matriz admin/participante | ❌ | ✅ (detallada) | ❌ | ✅ |
| Participante ve cronograma | ❌ | ✅ (sus hitos) | ❌ | ✅ (publicados) |
| Participante ve documentos | ❌ | ✅ (publicados) | ❌ | ✅ (vigentes) |
| Participante comenta | ❌ | ✅ | ❌ | ✅ |
| Auth derivation server-side | ❌ | ❌ | ❌ | ❌ |

**Debilidad compartida**: Ningún plan menciona cómo se derivará la identidad del usuario en las funciones Convex (regla de guidelines.md: nunca aceptar userId como argumento).

### 2.5 Madurez del diseño de procesos SGC

| Aspecto | Agy | Codex | OC | Pi |
|---|---|---|---|---|
| Regla nativo vs archivo | ❌ | ✅ (explícita) | ✅ (implícita) | ✅ (2+ condiciones) |
| Hitos obligatorios definidos | ❌ | ✅ (11, con referencias) | ❌ | ❌ (genéricos) |
| Referencias a formatos reales | Parcial | ✅ (F-PSEA-*) | ✅ (F-PPSEA-03, etc.) | ✅ (F-PSEA-*) |
| Estados críticos cierre | ❌ | ✅ | ✅ | ❌ |
| Máquina de estados de ronda | ❌ | ✅ (state diagram) | ✅ (3 transiciones) | ❌ |
| Criterios de cobertura | ❌ | ✅ | ✅ (detallado) | ❌ |
| Manejo de F-PSEA-11 no aplica | ❌ | ❌ | ✅ (explícito) | ✅ (explícito) |

---

## 3. Fortalezas sobresalientes de cada plan

### Agy
- **Concreción máxima**: Identifica archivos específicos a modificar (`schema.ts`, `SidebarNav.tsx`).
- **Simplicidad**: Fácil de arrancar, bajo riesgo de over-engineering.
- **Fases claras**: Backend primero, UI después.

### Codex
- **Diseño de flujos excepcional**: Diagramas de estado, flujos de comunicación, reglas de visibilidad. Es el único que modela el "qué pasa cuando" con verdadero rigor.
- **Catálogo de hitos obligatorios con referencias SGC reales**: Los 11 hitos mapeados a formatos específicos (F-PSEA-05, F-PSEA-08, etc.) es el trabajo más minucioso de trazabilidad documental.
- **Regla nativo vs archivo más madura**: La tabla de criterios con ejemplos concretos es directamente implementable.
- **MVP 1 y MVP 2 bien delimitados**: Sabe exactamente qué entra en cada fase y por qué.

### OC
- **Pragmatismo superior en formatos**: El diseño de Plan de Ronda por bloques `a`-`u` basado en la plantilla real compartida es la decisión más fundamentada en la realidad documental del SGC.
- **PDF imprimible + snapshots**: Resuelve el problema de trazabilidad sin sobre-ingeniería, usando snapshots por fecha/usuario en vez de versionado complejo.
- **Estado `documentacion_pendiente`**: Una adición de estado de ronda quirúrgica que cierra una brecha real en el flujo actual.
- **Catálogo en código + plantillas Markdown**: La decisión de mantener el catálogo SGC en `lib/sgc/` y las plantillas P-20 como archivos `.md` versionados es excelente para control de cambios.
- **Manejo explícito de `no_aplica`**: Caso F-PSEA-11 correctamente identificado y documentado.

### Pi
- **Matriz documental como fundamento arquitectónico**: Es el único que entiende que sin una matriz documental maestra, todo lo demás son parches. La importación CSV con clave `codigo + rondaCodigo` es una solución elegante para el seeding.
- **Visión de procesos completa**: Las 8 categorías de procesos son un marco que puede crecer orgánicamente.
- **Casos SGC formales desde el inicio**: NC/CAPA, quejas y apelaciones como módulo unificado es visión de largo plazo correcta.
- **Arquitectura de rutas**: Las 10+ rutas propuestas dan una estructura URL limpia y escalable.
- **Separación de estados**: `estadoGestion` vs `estadoImplementacion` es una distinción semántica valiosa.

---

## 4. Debilidades críticas de cada plan

### Agy
- **Falta de diseño SGC**: No define qué es un "documento SGC", ni estados, ni reglas de cobertura.
- **Solo 2 tablas**: `rondaDocumentos` y `rondaHitos` son insuficientes para cubrir evidencias, comunicaciones, comentarios, o matriz documental.
- **Sin modelo de visibilidad**: No especifica qué ve un participante vs un admin.
- **Sin referencias a formatos reales**: No cita ningún F-PSEA-*, P-PSEA-*, o I-PSEA-*.
- **Sin estados de ronda ampliados**: El estado `cerrada` actual es ambiguo sin `documentacion_pendiente`.
- **Sin reglas de cierre documental**: ¿Qué se necesita para cerrar una ronda desde el punto de vista SGC?

### Codex
- **Arrays en documentos**: Propone `comentarios` y posiblemente otros arrays anidados, lo cual viola la guía de Convex sobre no almacenar listas no acotadas.
- **Sobrecarga de tablas**: 9 tablas para MVP 1 es ambicioso. Algunas (`sgcRespuestasComentario`, `sgcResultadosExternos`) podrían consolidarse o posponerse.
- **Sin distinción entre evidencias y matriz documental**: Mezcla el concepto de "evidencia versionada" con "documento controlado", cuando son cosas distintas (una evidencia es un archivo que soporta un registro; un documento controlado es una entidad del SGC con código, revisión, etc.).
- **Sin plan de ronda nativo en MVP 1**: El Plan de Ronda (F-PSEA-06) queda para MVP 2, pero es el corazón de la planificación SGC de una ronda.
- **Catálogo de hitos rígido**: Los 11 hitos obligatorios pueden no ajustarse a todas las rondas. Pi ofrece plantilla editable; OC ofrece hitos dentro del plan.

### OC
- **Sin matriz documental**: El catálogo en código es un paso, pero no hay visión de cómo crecerá cuando el SGC tenga 50+ documentos.
- **Sin comentarios ni comunicaciones en fase 1**: Solo plantillas Markdown, sin registro de comunicaciones enviadas.
- **Sin vista del participante**: No aborda qué ve el participante en su dashboard.
- **`documentacion_pendiente` sin bloqueo de envíos**: Dice que los participantes no pueden enviar/modificar F-12 en ese estado, pero no especifica cómo se implementa el bloqueo en Convex.
- **Snapshots sin integridad**: Los snapshots de F-06/F-13 son solo copias, no hay cómo verificar que no fueron alterados (no hay hash, no hay firma).

### Pi
- **Complejidad excesiva para arranque**: Proponer matriz documental + importación CSV + 8 procesos + casos SGC + comentarios de una vez es un Incremento 1 demasiado grande.
- **Sin checklist de cierre documental**: Extrañamente, el plan más arquitectónico omite el checklist formal de cierre por ronda, que es la funcionalidad core que Codex y OC sí cubren.
- **Sin F-PSEA-13 en Incremento 1**: La revisión de datos queda para Incremento 2, pero es un formato crítico para el cierre documental.
- **Sin referencia a la plantilla real de Plan de Ronda**: A diferencia de OC, no referencia la plantilla `Planificacion_R1_PP (1).md` ni propone una estructura de bloques concreta.
- **Sin estados de ronda ampliados**: No aborda `documentacion_pendiente` ni la máquina de estados de ronda.
- **`rondaHitos` con arrays implícitos**: El campo `notificarParticipantes` es booleano pero no especifica cómo se modela la relación con participantes específicos.

---

## 5. Convergencias y divergencias clave

### Todos coinciden en:
1. Panel SGC por ronda como eje central.
2. Carga de archivos en Convex Storage.
3. Cronograma nativo de hitos (no calendario completo).
4. Pestaña SGC en dashboard admin.
5. Distinguir entre registros nativos y archivos cargados.
6. No hacer gestor documental completo.

### Divergen en:
1. **Matriz documental**: Solo Pi la propone como base; OC tiene catálogo en código; Codex y Agy no la contemplan.
2. **Plan de ronda nativo**: OC (bloques a-u con plantilla real) vs Pi (campos operativos) vs Codex (MVP 2) vs Agy (mención vaga).
3. **Comunicaciones**: Codex (registro manual) vs OC (solo plantillas) vs Pi y Agy (nada en fase 1).
4. **Comentarios de participantes**: Codex y Pi los incluyen; OC y Agy no.
5. **Casos SGC formales**: Solo Pi los incluye desde el inicio.
6. **F-PSEA-11 (no aplica)**: OC y Pi lo identifican correctamente; Codex y Agy no lo mencionan.
7. **Estados de ronda**: Codex (7 estados) vs OC (+`documentacion_pendiente`) vs Pi y Agy (sin cambios).

---

## 6. Síntesis: visión unificada recomendada

La mejor solución integra las fortalezas de los cuatro planes. A continuación la arquitectura unificada propuesta:

### 6.1 Orden de implementación (Incremento 1)

```
Fase A: Fundación documental (de Pi + OC)
├── 1. Catálogo SGC en código (lib/sgc/catalog.ts) — de OC
├── 2. Tabla documentoSgc + documentoSgcVersiones — de Pi
├── 3. Importación CSV de matriz documental — de Pi
├── 4. UI: /dashboard/sgc/documentos — de Pi

Fase B: Operación por ronda (de Codex + OC)
├── 5. Ampliar estado de ronda: +documentacion_pendiente — de OC
├── 6. Tabla sgcChecklistItems (checklist cierre) — de Codex
├── 7. Tabla rondaHitos (cronograma nativo) — de Codex con diseño de Pi
├── 8. Tabla sgcEvidencias (evidencias por archivo) — de OC
├── 9. Plan de ronda nativo (bloques a-u) — de OC
├── 10. F-13 checklist manual con métricas — de OC
├── 11. UI: panel SGC con checklist por fase — de Codex + OC
├── 12. Vistas imprimibles PDF — de OC

Fase C: Participantes y comunicación (de Codex)
├── 13. Comentarios de ronda — de Codex
├── 14. Comunicaciones manuales registradas — de Codex
├── 15. Notificaciones in-app — de Codex
├── 16. Vista participante en Mi dashboard — de Codex
└── 17. Validaciones de cierre documental — de Codex + OC
```

### 6.2 Tablas Convex unificadas (Incremento 1)

| Tabla | Origen | Propósito |
|---|---|---|
| `documentosSgc` | Pi | Matriz documental maestra |
| `documentoSgcVersiones` | Pi | Versiones de archivos de matriz |
| `sgcChecklistItems` | Codex | Checklist de cierre documental por ronda |
| `rondaHitos` | Codex+Pi | Cronograma nativo de hitos |
| `sgcEvidencias` | OC | Evidencias por archivo con metadata automática |
| `sgcPlanRonda` | OC | Plan de ronda por bloques a-u |
| `sgcRevisionDatos` | OC | Checklist F-13 manual |
| `sgcComentariosRonda` | Codex | Comentarios de participantes |
| `sgcComunicaciones` | Codex | Registro de comunicaciones |
| `sgcNotificaciones` | Codex | Notificaciones in-app |
| `sgcRegistroSnapshots` | OC | Snapshots de F-06/F-13 |

### 6.3 Reglas de diseño unificadas

1. **Regla nativo vs archivo** (de Codex, refinada): Nativo si cumple ≥2 de: estado, responsable, fechas, trazabilidad, aprobación, interacción admin-participante.
2. **Estados de ronda** (de Codex + OC): `borrador → activa → documentacion_pendiente → cerrada`.
3. **Criterios de cobertura para cierre** (de Codex + OC): checklist formal con críticos obligatorios y condicionales.
4. **Catálogo SGC** (de OC): en código, no editable desde UI en fase 1.
5. **Matriz documental** (de Pi): CSV importable, clave `codigo + rondaCodigo`.
6. **Visibilidad** (de Codex): matriz explícita admin vs participante.
7. **Evidencias** (de OC): metadata automática, versión incremental, sin borrado.
8. **Snapshots** (de OC): para registros editables post-finalización.
9. **No arrays no acotados** (de guidelines Convex): toda relación 1:N va a tabla separada.

### 6.4 Lo que ningún plan aborda y debe agregarse

1. **Acciones Convex para procesamiento**: PDFs, parseo CSV del lado servidor, y upload URLs requieren actions con `"use node"`.
2. **Derivación de identidad server-side**: En todas las mutaciones SGC debe usarse `ctx.auth.getUserIdentity()` para obtener el `tokenIdentifier`, nunca recibir userId como argumento.
3. **Índices Convex concretos**: Cada tabla debe definir sus índices según los patrones de consulta esperados (por ronda, por participante, por estado, etc.).
4. **Paginación**: Listas como matriz documental, comentarios, y notificaciones necesitan `paginationOpts`.
5. **Límites de transacción**: Mutaciones que operen sobre muchos documentos (cierre de ronda, importación CSV) deben procesar en lotes con `ctx.scheduler.runAfter`.
6. **Manejo de F-PSEA-11**: Debe registrarse explícitamente como `no_aplica` en el checklist, no simplemente omitirse.

---

## 7. Veredicto final

| Plan | Calidad del diseño SGC | Pragmatismo técnico | Completitud | Viabilidad arranque | Visión futuro |
|---|---|---|---|---|---|
| **Agy** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **Codex** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **OC** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Pi** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

- **Mejor diseño SGC**: **Codex** — sus flujos, estados de ronda, catálogo de hitos con referencias reales, y matriz de visibilidad son los más rigurosos.
- **Mejor pragmatismo**: **OC** — sus decisiones están más ancladas en la realidad concreta del proyecto (plantilla real, bloques a-u, `documentacion_pendiente`, PDF imprimible).
- **Mejor visión de largo plazo**: **Pi** — la matriz documental como fundamento y la arquitectura de procesos es la única que escala.
- **Mejor para arrancar ya**: **Agy** — es el único que identifica archivos concretos y tiene un scope realista para una primera iteración inmediata.

**La visión final unificada debe tomar:**
- La **matriz documental** de Pi como cimiento.
- El **diseño de flujos y checklist** de Codex como columna vertebral operativa.
- El **pragmatismo de formatos** de OC (bloques a-u, plantilla real, PDF, snapshots, catálogo en código) como implementación concreta.
- La **simplicidad de fases** de Agy como disciplina de ejecución.
