# Evaluación comparativa de planes SGC

Fecha: 2026-06-07

Archivos evaluados:

- `plan_agy.md`
- `plan_oc.md`
- `plan_pi.md`
- `plan_codex.md`

## Conclusión principal

El mejor punto de partida es `plan_oc.md`, enriquecido selectivamente con elementos de `plan_codex.md` y dejando `plan_pi.md` como visión futura/roadmap, no como MVP inicial.

`plan_agy.md` sirve como resumen ejecutivo, pero no como plan implementable.

## Lectura global

| Plan | Naturaleza | Veredicto |
|---|---|---|
| `plan_agy.md` | Esqueleto de implementación | Útil como portada, insuficiente para decidir o ejecutar |
| `plan_oc.md` | MVP por ronda, acotado y trazable | Mejor candidato para Fase 1 |
| `plan_pi.md` | SGC operativo amplio con matriz documental | Valioso como visión completa, demasiado grande para iniciar |
| `plan_codex.md` | Intermedio: cierre por ronda + comunicaciones/comentarios/notificaciones | Buen diseño funcional, pero MVP 1 está inflado |

## 1. Evaluación de `plan_agy.md`

### Fortalezas

- Es simple y directo.
- Identifica los archivos principales a tocar: `convex/schema.ts`, `convex/sgc.ts`, `SidebarNav.tsx` y una página SGC.
- Reconoce los tres registros clave: F-PSEA-06, F-PSEA-08 y F-PSEA-13.

### Debilidades

- Es demasiado superficial para guiar implementación real.
- No define estados, permisos, versionamiento, auditoría, criterios de cierre ni rutas concretas.
- Propone tablas genéricas como `rondaDocumentos` y `rondaHitos` sin separar evidencias, snapshots, plan, revisión o bitácora.
- No resuelve el dilema clave: qué va nativo y qué va como archivo.
- No identifica riesgos documentales, como códigos provisionales o trazabilidad de registros finalizados.

### Uso recomendado

- Mantenerlo solo como resumen ejecutivo.
- No usarlo como plan base de desarrollo.

## 2. Evaluación de `plan_oc.md`

Este es el plan más sólido para una primera implementación.

### Fortalezas

- Tiene un alcance muy bien defendido: solo panel SGC por ronda, excluyendo gestor documental general, NC/CAPA, quejas, emails reales, cron e integración estructurada con `pt_app` en Fase 1.
- Alinea bien con el estado actual del repo. La app ya tiene `rondas`, `rondaParticipantes`, `fichasRegistro`, `enviosPt`, `rondaPtItems` y `rondaPtSampleGroups`, por lo que un panel por ronda es la ampliación natural.
- Define criterios concretos de cobertura para formatos ya existentes: F-05, F-05A, F-07 y F-12.
- Introduce `documentacion_pendiente`, que encaja muy bien con el problema actual de que `cerrada` mezcla cierre operativo y cierre documental.
- Tiene una decisión pragmática para F-13: checklist manual con métricas de apoyo, no automatización prematura.
- Maneja bien evidencias: Convex Storage, historial, sin borrado, versión automática y metadata mínima.
- Reconoce explícitamente riesgos: códigos provisionales, edición posterior de registros finalizados, PDF final sin lista maestra verificada.

### Debilidades

- Trata F-PSEA-08 como archivo en Fase 1, mientras que `plan_agy` y `plan_pi` lo ven como registro nativo. Si preparación de ítem es operativamente crítica, dejarlo solo como archivo puede quedarse corto.
- Permite finalizar F-13 con checks pendientes y sin observación obligatoria. Eso reduce fricción, pero debilita trazabilidad.
- Permite generar PDF final aunque los códigos documentales estén pendientes de verificación. Para uso interno puede valer; para auditoría es riesgoso.
- No incluye comentarios de participantes ni comunicaciones registradas, salvo plantillas P-20 enlazadas. Eso evita crecimiento de alcance, pero deja por fuera una parte operacional útil.
- Usa nombres de tablas relativamente genéricos: `sgcEvidencias` en vez de separar serie/versiones. Para versionamiento robusto, conviene adoptar la separación de `plan_codex`.

### Uso recomendado

- Base principal para Fase 1.
- Ajustar tres cosas antes de implementarlo:
  - F-13 debe exigir observación si hay checks pendientes.
  - Evidencias deben separarse en serie/versiones.
  - El PDF final debería marcar códigos como provisionales hasta confirmar lista maestra.

## 3. Evaluación de `plan_pi.md`

Es el plan más completo como visión de SGC operativo, pero no es buen MVP inicial.

### Fortalezas

- Tiene la mejor regla conceptual para decidir qué va nativo y qué va como archivo.
- Introduce una matriz documental maestra con `modoGestion`, `estadoGestion` y `estadoImplementacion`, lo cual es potente para una visión SGC completa.
- Define importación CSV con reglas claras de upsert y clave `codigo + rondaCodigo opcional`.
- El modelo documental global `documentosSgc` + `documentoSgcVersiones` está bien pensado.
- Tiene buena visión de permisos: participante ve solo documentos vigentes publicados y asociados a sus rondas.
- Modela F-PSEA-08 con bastante más precisión: preparación por ronda, niveles, CSV crudo y PDF del cilindro.
- Deja F-13 para incremento 2, lo cual evita sobrecargar el primer corte.

### Debilidades

- El Incremento 1 es grande: matriz documental, importación CSV, detalle documental, versionamiento, dashboard, procesos, cronograma y plan de ronda.
- Cambia el eje del producto: pasa de cierre documental por ronda a sistema documental operativo. Eso puede desviar la app del flujo principal de ronda.
- Introduce módulos que no existen hoy: matriz, procesos, documentos globales, importador, casos SGC, comentarios globales.
- No implementa F-13 en Incremento 1, aunque F-13 es parte del cierre documental real. Esto deja incompleto el objetivo de cerrar una ronda.
- Auditoría queda diferida, pero precisamente la matriz documental y control de versiones aumentan la expectativa de trazabilidad.
- Riesgo de construir infraestructura documental antes de validar el flujo operativo mínimo.

### Uso recomendado

- Usarlo como roadmap de Fase 2/Fase 3.
- Extraer de aquí dos piezas para el plan final:
  - regla nativo/archivo;
  - modelo futuro de matriz documental.
- No empezar por importación CSV ni matriz documental si el objetivo inmediato es cerrar rondas.

## 4. Evaluación de `plan_codex.md`

Es una buena visión intermedia, pero el MVP 1 tiene demasiadas piezas simultáneas.

### Fortalezas

- Define muy bien el eje: cierre documental por ronda, no repositorio documental completo.
- Tiene una arquitectura funcional clara: checklist, cronograma, evidencias, comunicaciones, notificaciones, comentarios y resultados `pt_app`.
- La matriz de visibilidad por rol es muy útil y concreta.
- El cronograma mínimo está mejor definido que en los demás planes: 11 hitos con visibilidad participante y relación SGC.
- Distingue bien advertencias durante operación vs bloqueo solo en cierre documental.
- El diseño de evidencias como `sgcEvidenciaSeries` + `sgcEvidenciaVersiones` es mejor que una tabla única.
- La integración `pt_app` como archivo + metadata + aprobación es pragmática.

### Debilidades

- MVP 1 incluye demasiadas cosas: checklist, cronograma, evidencias, comunicaciones, notificaciones, comentarios, visibilidad participante, advertencias y bloqueos.
- Propone muchos estados de ronda nuevos en el diagrama: `EnOperacion`, `RecepcionDatos`, `Analisis`, `ResultadosPublicados`, `CierreDocumental`. El schema actual solo tiene `borrador`, `activa`, `cerrada`, así que esto sería una migración funcional grande.
- Notificaciones y comentarios implican tocar `Mi dashboard`, permisos participante, consultas nuevas y estados de lectura. Eso no es trivial.
- Deja F-PSEA-08 y F-PSEA-13 para MVP 2, pero el cierre documental básico necesita al menos F-13.
- No define snapshots de registros nativos finalizados, algo que `plan_oc` sí cubre.

### Uso recomendado

- Tomar de aquí:
  - visibilidad por rol;
  - cronograma mínimo;
  - separación serie/versiones;
  - resultados externos `pt_app`.
- No tomar completo su MVP 1; partirlo.

## Comparación por criterios

| Criterio | Mejor plan | Comentario |
|---|---|---|
| Claridad de MVP | `plan_oc` | Es el más acotado y ejecutable |
| Visión completa SGC | `plan_pi` | Mejor mapa futuro, peor MVP |
| Modelo de evidencias | `plan_codex` | Serie + versiones es más limpio |
| Control de estados de ronda | `plan_oc` | `documentacion_pendiente` es simple y suficiente |
| Permisos/visibilidad | `plan_codex` / `plan_pi` | Codex es más específico por rol; PI es mejor en documentos publicados |
| F-PSEA-13 | `plan_oc` | Lo incluye en Fase 1 |
| F-PSEA-08 | `plan_pi` | Mejor modelo nativo, pero quizá para Fase 2 |
| Comunicaciones | `plan_codex` | Buen flujo manual, pero no debe entrar completo al MVP |
| Gestión documental global | `plan_pi` | Valiosa, pero no prioritaria |
| Implementabilidad inmediata | `plan_oc` | Menor superficie de cambio |

## Visión final recomendada

No conviene escoger un plan único tal como está. La visión final debería consolidar lo mejor de cada uno.

### Fase 1: cierre documental por ronda

Base: `plan_oc.md`.

Implementar:

- Pestaña SGC por ronda.
- Checklist agrupado por fase.
- Estado nuevo `documentacion_pendiente`.
- Catálogo SGC en código.
- Evidencias en Convex Storage.
- Evidencias separadas en serie/versiones, tomado de `plan_codex`.
- F-PSEA-06 / plan de ronda nativo.
- F-PSEA-13 nativo manual con métricas de apoyo.
- Snapshots para F-PSEA-06 y F-PSEA-13.
- Vistas imprimibles para F-PSEA-06 y F-PSEA-13.
- F-PSEA-08, F-PSEA-09, F-PSEA-10 y F-PSEA-14 como evidencia vigente.
- F-PSEA-11 como no aplica, salvo que después se confirme otra operación.
- Plantillas P-20 en Markdown enlazadas, sin motor de comunicaciones.

Ajustes obligatorios:

- Si F-13 se finaliza con checks pendientes, exigir observación.
- No permitir PDF final limpio si los códigos documentales siguen provisionales; mejor mostrar “código pendiente de confirmación documental” o bloquear modo final oficial.
- No crear matriz documental global todavía.
- No crear notificaciones ni comentarios en Fase 1.
- No cambiar a una máquina de estados compleja; solo añadir `documentacion_pendiente`.

### Fase 2: operación ampliada

Base: partes de `plan_codex` y `plan_pi`.

Implementar:

- F-PSEA-08 nativo usando el modelo de `plan_pi`.
- Comunicaciones manuales registradas.
- Comentarios de participantes por ronda.
- Resultados externos `pt_app` con metadata y aprobación.
- Visibilidad participante: cronograma visible, publicaciones compartidas, comentarios propios.
- Casos SGC solo si ya hay necesidad real: quejas, apelaciones, NC/CAPA.

### Fase 3: SGC documental completo

Base: `plan_pi`.

Implementar:

- Matriz documental maestra.
- Importación CSV.
- Documentos globales y por ronda.
- Vista por procesos.
- Control documental general.
- Documentos próximos a revisión.
- Auditoría formal amplia.
- Integración estructurada con `pt_app`.

## Recomendación de decisión

La recomendación final es:

1. Usar `plan_oc.md` como plan rector de Fase 1.
2. Sustituir el modelo de evidencias de una sola tabla por el modelo serie/versiones de `plan_codex.md`.
3. Adoptar la regla nativo-vs-archivo de `plan_pi.md` como criterio de arquitectura.
4. Dejar matriz documental, comentarios, notificaciones, casos SGC e importación CSV fuera del MVP inicial.
5. Tratar `plan_agy.md` como resumen, no como especificación.

La razón técnica es simple: el repo actual todavía tiene una base pequeña. Saltar directo a `plan_pi` o al MVP completo de `plan_codex` multiplicaría tablas, rutas, permisos y estados antes de cerrar el caso de uso principal. `plan_oc` permite entregar valor real con menor riesgo: cerrar documentalmente una ronda, preservar evidencia y separar recepción de datos de cierre SGC.

