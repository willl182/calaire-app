# Evaluación comparativa de planes SGC

Fecha: 2026-06-07

## Objetivo

Evaluar detalladamente los cuatro planes disponibles para implementar el panel SGC en CALAIRE-APP:

- `plan_agy.md`
- `plan_oc.md`
- `plan_pi.md`
- `plan_codex.md`

La evaluación busca identificar fortalezas, debilidades, riesgos y una visión final integrada para decidir qué plan usar como base de implementación.

## Conclusión ejecutiva

El mejor plan base es `plan_oc.md`. Es el más enfocado, implementable y alineado con el producto actual.

El mejor plan como visión futura es `plan_pi.md`, porque define una arquitectura amplia de SGC, matriz documental, procesos, casos SGC y control documental.

El mejor complemento operativo es `plan_codex.md`, especialmente por su modelo de evidencias versionadas, visibilidad por rol, cronograma mínimo y comentarios/comunicaciones.

`plan_agy.md` sirve como resumen ejecutivo o checklist inicial, pero no tiene suficiente detalle para guiar una implementación segura.

## Ranking general

| Plan | Valor principal | Problema principal | Veredicto |
|---|---|---|---|
| `plan_oc.md` | Mejor alcance fase 1 por ronda | Le faltan permisos y modelo de archivos más robusto | Base recomendada |
| `plan_codex.md` | Buena visión operativa por ronda y roles | MVP 1 demasiado grande | Usar como complemento |
| `plan_pi.md` | Mejor arquitectura SGC amplia | Scope creep; empieza por matriz documental, no por cierre de ronda | Guardar como roadmap |
| `plan_agy.md` | Claro y corto | Demasiado superficial | Útil solo como checklist inicial |

## Evaluación de `plan_agy.md`

### Fortalezas

- Identifica los archivos clave del proyecto:
  - `convex/schema.ts`
  - `convex/sgc.ts`
  - `SidebarNav.tsx`
  - página principal del panel SGC.
- Propone una división básica entre backend Convex e interfaz administrativa.
- Reconoce los elementos funcionales principales:
  - Panel SGC.
  - Carga de documentos por ronda.
  - Flujos para F-PSEA-06, F-PSEA-08 y F-PSEA-13.
- Es fácil de leer y sirve como lista de arranque.

### Debilidades

- Es demasiado corto para funcionar como plan de implementación.
- No define estados documentales ni criterios de cierre.
- No define permisos ni visibilidad por rol.
- No resuelve versionamiento, snapshots, bitácora ni trazabilidad.
- No define rutas concretas más allá de una página general.
- No especifica cómo usar Convex Storage.
- No contempla el estado intermedio `documentacion_pendiente`.
- No define cómo bloquear envíos de participantes cuando se cierre recepción de datos.
- No diferencia claramente registros nativos, archivos de evidencia y documentos controlados.

### Veredicto

`plan_agy.md` debe conservarse como resumen ejecutivo o checklist de alto nivel, pero no como especificación técnica principal.

## Evaluación de `plan_oc.md`

### Fortalezas

- Es el plan más equilibrado para una fase 1 real.
- Mantiene el eje por ronda y evita convertir CALAIRE-APP en un gestor documental general.
- Define explícitamente qué incluye y qué no incluye la fase 1.
- Reconoce que los formatos no nativos deben cubrirse con evidencias versionadas.
- Propone una pestaña `SGC` dentro de la vista de ronda, lo cual encaja bien con la navegación actual del proyecto.
- Define estados del panel:
  - `no_aplica`
  - `pendiente`
  - `cubierto_nativo`
  - `cubierto_archivo`
  - `requiere_revision`
- Propone un estado de ronda nuevo:
  - `documentacion_pendiente`
- Define un flujo razonable:
  - `borrador -> activa -> documentacion_pendiente -> cerrada`
- Reconoce que `cerrada` debe significar cierre documental y operativo, no solo cierre de recepción.
- Incluye F-13 como checklist manual, lo cual reduce complejidad y evita automatizar reglas aún no maduras.
- Incluye PDF imprimible para F-06/F-PPSEA-03 y F-13.
- Incluye snapshots para F-06/F-PPSEA-03 y F-13.
- Incluye bitácora SGC mínima.
- Acepta explícitamente riesgos y tradeoffs.

### Debilidades

- El modelo `sgcEvidencias` puede quedarse corto si se necesita historial documental formal.
- Conviene separar evidencia en dos tablas:
  - `sgcEvidenciaSeries`
  - `sgcEvidenciaVersiones`
- Mezcla o deja ambigua la nomenclatura `F-PPSEA-03`, F-06 y Plan de Ronda.
- No profundiza suficiente en autorización Convex.
- No detalla cómo se generarán y validarán URLs de Convex Storage.
- No baja al detalle de migración del estado de ronda en todo el código existente.
- No explica cómo se adaptarán los formularios de participante a `documentacion_pendiente`.

### Veredicto

`plan_oc.md` debe ser la base principal de implementación. Requiere ajustes en modelo de evidencias, permisos, storage y migración de estados.

## Evaluación de `plan_pi.md`

### Fortalezas

- Tiene la mejor arquitectura conceptual de SGC completo.
- Define una regla clara para decidir qué va nativo y qué va como archivo.
- Propone una matriz documental maestra.
- Separa estados de gestión documental y estados de implementación:
  - `estadoGestion`
  - `estadoImplementacion`
- Define procesos SGC claros:
  - Gestión documental.
  - Planificación de ronda.
  - Convocatoria e inscripción.
  - Preparación y logística.
  - Ejecución y reporte.
  - Revisión y análisis.
  - Informe y cierre.
  - Mejora.
- Incluye importación inicial por CSV.
- Define control documental mínimo.
- Propone visibilidad para participantes.
- Define cronograma nativo simple.
- Propone modelo para F-PSEA-08.
- Reconoce que F-PSEA-11 no aplica al esquema in situ.
- Incluye comentarios, casos SGC, NC/CAPA, quejas y apelaciones.
- Propone roadmap incremental.

### Debilidades

- Es demasiado amplio para el primer incremento.
- Su primer vertical slice empieza por matriz documental y documentos globales, no por cierre documental de ronda.
- Puede retrasar la entrega del valor principal.
- Deja F-PSEA-13 fuera del Incremento 1, aunque F-13 parece central para la fase inicial.
- Introduce casos SGC, comentarios, procesos y matriz maestra antes de estabilizar el flujo de ronda.
- La carga CSV de matriz documental puede consumir tiempo sin resolver todavía el cierre operativo.
- El alcance se acerca a un SGC completo, aunque el objetivo inmediato parece más acotado.

### Veredicto

`plan_pi.md` debe usarse como roadmap estratégico para fases 2 y 3, no como MVP inmediato.

## Evaluación de `plan_codex.md`

### Fortalezas

- Combina bien operación por ronda, checklist, cronograma, evidencias versionadas, comunicaciones, notificaciones, comentarios y visibilidad participante.
- Define una arquitectura funcional clara.
- Propone un modelo de evidencias más robusto que `plan_oc.md`, con:
  - `sgcEvidenciaSeries`
  - `sgcEvidenciaVersiones`
- Distingue visibilidad admin y participante.
- Define cronograma mínimo con hitos concretos.
- Diferencia registros críticos siempre requeridos y registros críticos condicionales.
- Propone integración con `pt_app` como archivo + metadatos + aprobación, lo cual es realista para MVP.
- Reconoce que comentarios de participantes no son quejas formales por defecto.
- Propone promoción manual de comentario a caso SGC.
- Incluye validaciones de cierre documental.

### Debilidades

- El MVP 1 es demasiado grande.
- Incluye desde el inicio:
  - checklist;
  - cronograma;
  - evidencias;
  - comunicaciones;
  - notificaciones;
  - comentarios;
  - vista participante;
  - validaciones de cierre.
- Para el estado actual del repo, eso implica demasiados cambios simultáneos.
- Notificaciones y comentarios deberían moverse a MVP 2, salvo que sean estrictamente necesarios.
- No trata con suficiente detalle el problema de autenticación Convex.
- Su modelo de estados de ronda es más amplio que el estado actual del proyecto y puede requerir una refactorización mayor.

### Veredicto

`plan_codex.md` debe usarse como complemento operativo. Sus mejores piezas son el modelo de evidencias, la visibilidad por rol, el cronograma mínimo y el tratamiento de comentarios/comunicaciones para fases posteriores.

## Riesgos técnicos reales del repo

### Autorización y autenticación Convex

Este es el riesgo más importante.

La guía local de Convex indica que no se debe aceptar `userId` como argumento para autorización. Sin embargo, el repo actual tiene varias funciones Convex que reciben `userId` como argumento.

Además, `app/providers.tsx` usa `ConvexProvider`, no `ConvexProviderWithAuth`. Esto significa que, para SGC, hay que decidir con cuidado si las operaciones pasarán por server actions con WorkOS o si se migrará la integración Convex a JWT autenticado.

Antes de exponer evidencias internas, comentarios o vistas de participante SGC, debe resolverse el contrato de identidad.

### Estado de ronda

El esquema actual solo soporta:

```ts
"borrador" | "activa" | "cerrada"
```

Agregar `documentacion_pendiente` exige revisar:

- `convex/schema.ts`
- `convex/rondas.ts`
- `lib/rondas.ts`
- badges de estado;
- dashboard admin;
- dashboard participante;
- acciones de transición;
- bloqueo de formularios;
- carga de fichas;
- carga de resultados;
- métricas operativas;
- reapertura de ronda.

No basta con cambiar el enum.

### Convex Storage

Los planes hablan de evidencias, pero la implementación debe concretar:

- `generateUploadUrl`;
- registro de versión;
- una sola versión vigente por serie;
- obtención de URL con `ctx.storage.getUrl`;
- lectura de metadata desde `_storage`;
- límite de tamaño;
- tipos MIME permitidos;
- manejo de reemplazos;
- historial sin borrado en MVP;
- consistencia al marcar versiones anteriores como reemplazadas u obsoletas.

### Alcance de UI

El repo actual tiene una navegación de ronda con tabs:

- Resumen.
- Configuración PT.
- Participantes.
- Resultados.

La ubicación más natural para fase 1 es agregar `SGC` en `RondaContextNav`, no crear primero una plataforma global compleja en `/dashboard/sgc`.

Una vista global SGC puede venir después.

## Visión final recomendada

La implementación recomendada debe combinar los planes de esta forma:

1. Base principal: `plan_oc.md`.
2. Modelo de evidencias: tomar `sgcEvidenciaSeries` y `sgcEvidenciaVersiones` de `plan_codex.md`.
3. Regla nativo vs archivo: tomarla de `plan_pi.md`.
4. Roadmap de SGC amplio: tomarlo de `plan_pi.md`.
5. Resumen ejecutivo: usar `plan_agy.md` solo como portada o checklist.

## MVP 1 recomendado

Objetivo: cierre documental básico por ronda.

Incluye:

1. Nueva pestaña `/dashboard/rondas/[id]/sgc`.
2. Checklist de cierre documental por ronda.
3. Catálogo SGC en código.
4. Estado `documentacion_pendiente`.
5. Cronograma mínimo de hitos por ronda.
6. Plan de ronda nativo.
7. F-PSEA-13 como checklist manual.
8. Evidencias con series y versiones.
9. Convex Storage para carga y descarga.
10. Vistas imprimibles para Plan de Ronda y F-13.
11. Bloqueo de cierre documental si faltan críticos.
12. Participantes en `documentacion_pendiente` con lectura sin edición.

No incluye:

- matriz documental global;
- importación CSV;
- NC/CAPA;
- quejas;
- apelaciones;
- comentarios de participantes;
- notificaciones;
- correos automáticos;
- integración estructurada con `pt_app`.

## MVP 1.5 recomendado

Agregar F-PSEA-08 Preparación de Ítem como formulario nativo mínimo:

- registro por ronda;
- responsable;
- fecha de preparación;
- observaciones;
- tabla de niveles;
- evidencia CSV crudo;
- evidencia PDF del cilindro;
- marca de completado.

## MVP 2 recomendado

Agregar:

- comentarios de participantes por ronda;
- comunicaciones manuales registradas;
- notificaciones in-app;
- visibilidad participante de cronograma y documentos publicados;
- evidencias `pt_app` con metadatos y aprobación;
- casos SGC manuales para quejas, apelaciones y NC/CAPA.

## MVP 3 recomendado

Agregar:

- matriz documental maestra;
- importación CSV;
- vista por procesos;
- documentos globales;
- control documental amplio;
- reportes de auditoría;
- gestión documental más formal.

## Decisión recomendada

No conviene implementar directamente `plan_pi.md` completo ni `plan_codex.md` completo. Ambos son valiosos, pero demasiado grandes para el primer corte.

La ruta más sólida es:

```txt
plan_oc.md
+ modelo de evidencias de plan_codex.md
+ regla nativo/archivo de plan_pi.md
+ roadmap futuro de plan_pi.md
```

Esto mantiene el foco en cerrar rondas con trazabilidad documental, sin bloquear el crecimiento futuro hacia un SGC operativo más completo.
